// packages/logger-core/src/async/AsyncQueue.ts

export type AsyncQueueTask<T> = T;

export type AsyncQueueWorker<T> = (item: T) => Promise<void> | void;

export type DropPolicy = "drop-new" | "drop-oldest" | "throw";

export interface AsyncQueueHooks<T> {
  onEnqueue?: (item: T) => void;
  onDequeue?: (item: T) => void;
  onError?: (error: unknown, item: T) => void;
  onDrop?: (item: T) => void;
  onIdle?: () => void;
}

export interface AsyncQueueOptions<T> extends AsyncQueueHooks<T> {
  worker: AsyncQueueWorker<T>;
  concurrency?: number;
  maxPending?: number;
  dropPolicy?: DropPolicy;
  autoStart?: boolean;
}

export interface AsyncQueueStats {
  pending: number;
  inFlight: number;
  totalEnqueued: number;
  totalProcessed: number;
  totalDropped: number;
  totalErrors: number;
  isRunning: boolean;
}

/**
 * Generic async work queue used by the logger pipeline.
 *
 * V2 – phase 1: provides basic concurrency, backpressure, and hooks
 * for metrics and observability. Retry/backoff and circuit breaker
 * will be layered on top as separate components.
 */
export class AsyncQueue<T> {
  private readonly worker: AsyncQueueWorker<T>;
  private readonly concurrency: number;
  private readonly maxPending?: number;
  private readonly dropPolicy: DropPolicy;
  private readonly hooks: AsyncQueueHooks<T>;

  private queue: T[] = [];
  private inFlight = 0;
  private running = false;
  private flushingResolvers: Array<() => void> = [];

  private totalEnqueued = 0;
  private totalProcessed = 0;
  private totalDropped = 0;
  private totalErrors = 0;

  constructor(options: AsyncQueueOptions<T>) {
    if (!options || typeof options.worker !== "function") {
      throw new Error("AsyncQueue requires a worker function.");
    }

    this.worker = options.worker;
    this.concurrency =
      options.concurrency && options.concurrency > 0 ? options.concurrency : 1;
    this.maxPending = options.maxPending;
    this.dropPolicy = options.dropPolicy ?? "drop-new";
    this.hooks = {
      onEnqueue: options.onEnqueue,
      onDequeue: options.onDequeue,
      onError: options.onError,
      onDrop: options.onDrop,
      onIdle: options.onIdle,
    };

    if (options.autoStart ?? true) {
      this.start();
    }
  }

  /**
   * Start processing items in the queue.
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.pump();
  }

  /**
   * Stop processing new items. In-flight items will finish.
   */
  stop(): void {
    this.running = false;
  }

  /**
   * Enqueue an item for processing.
   * Returns true if the item was accepted, false if it was dropped.
   */
  enqueue(item: T): boolean {
    if (this.maxPending != null && this.queue.length >= this.maxPending) {
      // Apply drop policy
      if (this.dropPolicy === "drop-new") {
        this.totalDropped++;
        this.hooks.onDrop?.(item);
        return false;
      }

      if (this.dropPolicy === "drop-oldest") {
        const dropped = this.queue.shift();
        if (dropped !== undefined) {
          this.totalDropped++;
          this.hooks.onDrop?.(dropped);
        }
      } else if (this.dropPolicy === "throw") {
        throw new Error("AsyncQueue: queue is full and dropPolicy is 'throw'.");
      }
    }

    this.queue.push(item);
    this.totalEnqueued++;
    this.hooks.onEnqueue?.(item);

    if (this.running) {
      this.pump();
    }

    return true;
  }

  /**
   * Flush waits until all queued items have been processed.
   * Does not stop the queue.
   */
  async flush(): Promise<void> {
    if (!this.running && this.queue.length === 0 && this.inFlight === 0) {
      return;
    }

    return new Promise<void>((resolve) => {
      this.flushingResolvers.push(resolve);
      this.checkFlushComplete();
    });
  }

  /**
   * Shutdown the queue. Optionally waits for in-flight and pending items
   * to finish processing.
   */
  async shutdown(
    options: { drain?: boolean } = { drain: true }
  ): Promise<void> {
    this.stop();

    if (options.drain) {
      await this.flush();
    } else {
      // If not draining, clear pending items
      while (this.queue.length > 0) {
        const dropped = this.queue.shift();
        if (dropped !== undefined) {
          this.totalDropped++;
          this.hooks.onDrop?.(dropped);
        }
      }
    }
  }

  getStats(): AsyncQueueStats {
    return {
      pending: this.queue.length,
      inFlight: this.inFlight,
      totalEnqueued: this.totalEnqueued,
      totalProcessed: this.totalProcessed,
      totalDropped: this.totalDropped,
      totalErrors: this.totalErrors,
      isRunning: this.running,
    };
  }

  private pump(): void {
    // Fill available concurrency slots
    while (
      this.running &&
      this.inFlight < this.concurrency &&
      this.queue.length > 0
    ) {
      const item = this.queue.shift() as T;
      this.inFlight++;
      this.hooks.onDequeue?.(item);

      void this.runWorker(item);
    }

    // If nothing left and nothing in-flight, we are idle
    if (this.queue.length === 0 && this.inFlight === 0) {
      this.hooks.onIdle?.();
      this.checkFlushComplete();
    }
  }

  private async runWorker(item: T): Promise<void> {
    try {
      await this.worker(item);
      this.totalProcessed++;
    } catch (error) {
      this.totalErrors++;
      this.hooks.onError?.(error, item);
    } finally {
      this.inFlight--;
      this.checkFlushComplete();
      if (this.running) {
        this.pump();
      }
    }
  }

  private checkFlushComplete(): void {
    if (
      this.queue.length === 0 &&
      this.inFlight === 0 &&
      this.flushingResolvers.length > 0
    ) {
      const resolvers = this.flushingResolvers;
      this.flushingResolvers = [];
      for (const resolve of resolvers) {
        resolve();
      }
    }
  }
}
