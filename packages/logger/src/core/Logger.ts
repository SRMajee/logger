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
  type ContextManager
} from "@majee/logger-core";

export interface TransportConfig {
  transport: ITransport;
  formatter?: IFormatter;
  minLevel?: LogLevel; // optional per-transport filter
}

export interface LoggerOptions {
  level?: LogLevel;               // global minimum level
  transports?: TransportConfig[]; // per-transport config
  formatter?: IFormatter;         // global default formatter
  contextManager?: ContextManager;
}

export class Logger {
  private level: LogLevel;
  private transports: TransportConfig[];
  private formatter: IFormatter;
  private contextManager: ContextManager;

  // ✅ 1. Track active async log operations
  private pendingPromises: Set<Promise<any>> = new Set();

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? "info";
    this.formatter = options.formatter ?? new JsonFormatter();
    this.contextManager = options.contextManager ?? defaultContextManager;

    this.transports =
      options.transports ??
      [
        {
          transport: new ConsoleTransport(),
          formatter: new JsonFormatter()
        }
      ];
  }

  private shouldLog(level: LogLevel, minLevel?: LogLevel): boolean {
    const globalOk = LogLevels[level] >= LogLevels[this.level];
    if (!globalOk) return false;

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
      context: this.currentContext()
    };

    for (const { transport, formatter, minLevel } of this.transports) {
      if (!this.shouldLog(level, minLevel)) continue;

      const fmt = formatter ?? this.formatter;
      const payload = fmt.format(entry);

      // ✅ 2. Capture the result instead of using 'void'
      const result = transport.log(payload);

      // ✅ 3. If it is a Promise (Async Transport like Mongo), track it
      if (result instanceof Promise) {
        this.pendingPromises.add(result);

        result
          .catch((err) => {
            // Optional: Prevent unhandled rejections if logging fails
            console.error("Async transport failed:", err);
          })
          .finally(() => {
            // Remove from tracking set when finished (success or fail)
            this.pendingPromises.delete(result);
          });
      }
    }
  }

  // Public logging API
  debug(msg: string): void { this.emit("debug", msg); }
  info(msg: string): void { this.emit("info", msg); }
  warn(msg: string): void { this.emit("warn", msg); }
  error(msg: string): void { this.emit("error", msg); }


  /**
   * Run a function within a specific context. All logs inside
   * will automatically include this context.
   */
  runWithContext<T>(ctx: Context, fn: () => T): T {
    return this.contextManager.runWithContext(ctx, fn);
  }

  /**
   * Merge additional fields into current context in this async chain.
   */
  mergeContext(partial: Context): void {
    this.contextManager.mergeContext(partial);
  }

  /**
   * Get the current context snapshot.
   */
  getContext(): Context {
    return this.contextManager.getContext();
  }

  /**
   * ✅ 4. New Method: Flush
   * Waits for all pending async logs (like MongoDB writes) to complete.
   * Call this before shutting down your application.
   */
  async flush(): Promise<void> {
    await Promise.all(this.pendingPromises);
  }
}