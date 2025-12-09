import type { IFormatter } from "../interfaces/IFormatter";
import type { ILogEntry } from "../interfaces/ILogEntry";

const COLORS: Record<string, string> = {
  debug: "\x1b[90m", // gray
  info: "\x1b[32m",  // green
  warn: "\x1b[33m",  // yellow
  error: "\x1b[31m"  // red
};

const RESET = "\x1b[0m";

export class PrettyFormatter implements IFormatter {
  format(entry: ILogEntry): string {
    const levelUpper = entry.level.toUpperCase();
    const color = COLORS[entry.level] ?? "";
    const ts = new Date(entry.timestamp).toISOString();
    const msg = entry.message;

    return `${color}[${levelUpper}]${RESET} ${ts} - ${msg}`;
  }
}
