import type { LogLevel } from "../utils/levels";
import type { Context } from "../context/ContextManager";

export interface ILogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: Context;
}
