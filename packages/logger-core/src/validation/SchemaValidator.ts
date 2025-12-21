import type { ILogEntry } from "../interfaces";
import type { LogLevel } from "../utils";
import type { Context } from "../context";

export interface SchemaValidationError {
  message: string;
  entry: unknown;
}

export interface SchemaValidatorOptions {
  enabled?: boolean;

  // 🆕 limits
  maxContextKeys?: number;
  maxContextSizeBytes?: number;

  // 🆕 security
  unsafeKeys?: string[];

  // 🆕 tracing
  requireTraceId?: boolean;

  // 🆕 metadata
  schemaVersion?: number;

  onError?: (error: SchemaValidationError) => void;
}

const VALID_LEVELS: Record<LogLevel, true> = {
  debug: true,
  info: true,
  warn: true,
  error: true,
};

const DEFAULT_UNSAFE_KEYS = [
  "password",
  "passwd",
  "pwd",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "apiKey",
];

export class SchemaValidator {
  private enabled: boolean;
  private opts: Required<
    Omit<SchemaValidatorOptions, "onError" | "requireTraceId">
  > & {
    requireTraceId?: boolean;
    onError?: (error: SchemaValidationError) => void;
  };
  private lastErrorAt = new Map<string, number>();
  private ERROR_DEDUP_WINDOW_MS = 1000;

  constructor(options: SchemaValidatorOptions = {}) {
    this.enabled = options.enabled ?? true;

    this.opts = {
      enabled: this.enabled,
      maxContextKeys: options.maxContextKeys ?? 50,
      maxContextSizeBytes: options.maxContextSizeBytes ?? 8 * 1024, // 8 KB
      unsafeKeys: options.unsafeKeys ?? DEFAULT_UNSAFE_KEYS,
      schemaVersion: options.schemaVersion ?? 1,
      requireTraceId: options.requireTraceId,
      onError: options.onError,
    };
  }

  validate(entry: unknown): entry is ILogEntry {
    if (!this.enabled) return true;

    if (typeof entry !== "object" || entry === null) {
      return this.fail("Log entry must be an object", entry);
    }

    const e = entry as ILogEntry;

    // ---- basic fields ----
    if (!VALID_LEVELS[e.level]) {
      return this.fail("Invalid log level", entry);
    }

    if (typeof e.message !== "string") {
      return this.fail("Message must be a string", entry);
    }

    if (typeof e.timestamp !== "number") {
      return this.fail("Timestamp must be a number", entry);
    }

    // ---- tracing ----
    if (e.traceId && typeof e.traceId !== "string") {
      return this.fail("traceId must be a string", entry);
    }

    if (e.spanId && typeof e.spanId !== "string") {
      return this.fail("spanId must be a string", entry);
    }

    if (this.opts.requireTraceId && !e.traceId) {
      return this.fail("traceId is required but missing", entry);
    }

    // ---- context ----
    if (e.context !== undefined) {
      if (typeof e.context !== "object" || e.context === null) {
        return this.fail("Context must be an object", entry);
      }

      const ok = this.sanitizeContext(e.context);
      if (!ok) return false;
    }

    // ---- schema metadata ----
    e.schemaVersion = this.opts.schemaVersion;

    return true;
  }
  private sanitizeContext(ctx: Context): boolean {
    // strip unsafe keys
    for (const key of Object.keys(ctx)) {
      if (this.opts.unsafeKeys.includes(key)) {
        delete ctx[key];
      }
    }

    if (Object.keys(ctx).length > this.opts.maxContextKeys) {
      this.fail(
        `Context key count exceeds limit ${this.opts.maxContextKeys}`,
        ctx
      );
      return false;
    }

    const size = byteSize(ctx);
    if (size > this.opts.maxContextSizeBytes) {
      this.fail(
        `Context size ${size} exceeds limit ${this.opts.maxContextSizeBytes}`,
        ctx
      );
      return false;
    }

    return true;
  }

  private fail(message: string, entry: unknown): false {
    const now = Date.now();
    const last = this.lastErrorAt.get(message);

    if (!last || now - last > this.ERROR_DEDUP_WINDOW_MS) {
      this.lastErrorAt.set(message, now);
      this.opts.onError?.({ message, entry });
    }

    return false;
  }
}

function byteSize(obj: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(obj), "utf8");
  } catch {
    return Infinity;
  }
}
