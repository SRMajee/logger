import type { LogLevel } from "../utils/levels";
import type { Context } from "../context/ContextManager";

export interface ILogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Context;

  // 🆕 optional tracing (V3-ready)
  traceId?: string;
  spanId?: string;

  // 🆕 schema metadata
  schemaVersion?: number;
}
