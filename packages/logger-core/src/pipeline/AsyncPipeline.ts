import { AsyncQueue } from "../async/AsyncQueue";

export interface PipelineStage<T> {
  name: string;
  handler: (event: T) => Promise<void> | void;
}

export interface AsyncPipelineOptions<T> {
  stages: PipelineStage<T>[];
  concurrency?: number;
  maxPending?: number;
}

export class AsyncPipeline<T> {
  private readonly queue: AsyncQueue<T>;
  private readonly stages: PipelineStage<T>[];

  constructor(options: AsyncPipelineOptions<T>) {
    this.stages = options.stages;

    this.queue = new AsyncQueue<T>({
      worker: (event) => this.runStages(event),
      concurrency: options.concurrency ?? 1,
      maxPending: options.maxPending ?? 10000,
      dropPolicy: "drop-new",
    });
  }

  write(event: T): void {
    this.queue.enqueue(event);
  }

  async flush(): Promise<void> {
    await this.queue.flush();
  }

  async shutdown(): Promise<void> {
    await this.queue.shutdown({ drain: true });
  }

  private async runStages(event: T): Promise<void> {
    for (const stage of this.stages) {
      await stage.handler(event);
    }
  }
}
