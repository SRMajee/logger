import {
  now,
  LogLevels,
  type LogLevel,
  type ILogEntry,
  type ITransport,
  type IFormatter,
  JsonFormatter,
  ConsoleTransport,
  type Context,
  defaultContextManager,
  type ContextManager,
  AsyncQueue,
  formatEntry,
  writeToTransport,
  SchemaValidator,
} from "@majee/logger-core";

export interface TransportConfig {
  transport: ITransport;
  formatter?: IFormatter;
  minLevel?: LogLevel;

  retry?: {
    retries: number;
    initialDelayMs: number;
    maxDelayMs?: number;
  };

  concurrency?: number;
  maxPending?: number;
}

export interface LoggerOptions {
  level?: LogLevel;
  formatter?: IFormatter;
  transports?: TransportConfig[];
  contextManager?: ContextManager;
}

export class Logger {
  private level: LogLevel;
  private formatter: IFormatter;
  private contextManager: ContextManager;
  private validator: SchemaValidator;

  // 🔥 One queue PER transport
  private transportQueues: AsyncQueue<ILogEntry>[] = [];

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? "info";
    this.formatter = options.formatter ?? new JsonFormatter();
    this.contextManager = options.contextManager ?? defaultContextManager;
    this.validator = new SchemaValidator({
      schemaVersion: 1,
      maxContextKeys: 50,
      maxContextSizeBytes: 8 * 1024,
      requireTraceId: false,
      onError: (err) => {
        console.error("[logger] schema violation:", err.message);
      },
    });

    const transports = options.transports ?? [
      {
        transport: new ConsoleTransport(),
        formatter: new JsonFormatter(),
      },
    ];

    // 🚀 Create isolated queue per transport
    for (const cfg of transports) {
      const queue = new AsyncQueue<ILogEntry>({
        concurrency: cfg.concurrency ?? 1,
        maxPending: cfg.maxPending ?? 5000,
        dropPolicy: "drop-new",

        worker: async (entry) => {
          if (!this.shouldLog(entry.level, cfg.minLevel)) return;

          const formatter = cfg.formatter ?? this.formatter;

          let formatted;
          try {
            formatted = formatEntry(entry, formatter);
          } catch (err) {
            console.error("Formatter failed:", err);
            return;
          }

          try {
            await writeToTransport(formatted, {
              transport: cfg.transport,
              retry: cfg.retry,
            });
          } catch (err) {
            console.error("Transport failed after retries:", err);
          }
        },
      });

      this.transportQueues.push(queue);
    }
  }

  private shouldLog(level: LogLevel, minLevel?: LogLevel): boolean {
    if (LogLevels[level] < LogLevels[this.level]) return false;
    if (!minLevel) return true;
    return LogLevels[level] >= LogLevels[minLevel];
  }

  private currentContext(): Context | undefined {
    const ctx = this.contextManager.getContext();
    return Object.keys(ctx).length ? ctx : undefined;
  }

  private emit(level: LogLevel, message: string): void {
    const entry: ILogEntry = {
      level,
      message,
      timestamp: now(),
      context: this.currentContext(),
    };

    // 🛑 Schema validation (fail fast)
    if (!this.validator.validate(entry)) {
      return;
    }

    // enqueue to all transport queues
    for (const q of this.transportQueues) {
      q.enqueue(entry);
    }
  }

  debug(msg: string): void {
    this.emit("debug", msg);
  }
  info(msg: string): void {
    this.emit("info", msg);
  }
  warn(msg: string): void {
    this.emit("warn", msg);
  }
  error(msg: string): void {
    this.emit("error", msg);
  }

  runWithContext<T>(ctx: Context, fn: () => T): T {
    return this.contextManager.runWithContext(ctx, fn);
  }

  mergeContext(partial: Context): void {
    this.contextManager.mergeContext(partial);
  }

  getContext(): Context {
    return this.contextManager.getContext();
  }

  async flush(): Promise<void> {
    await Promise.all(this.transportQueues.map((q) => q.flush()));
  }

  async shutdown(): Promise<void> {
    await Promise.all(
      this.transportQueues.map((q) => q.shutdown({ drain: true }))
    );
  }
}
