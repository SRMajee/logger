import { now } from "@majee/logger-core";
import { ConsoleTransport } from "@majee/logger-core";
import type { ITransport } from "@majee/logger-core";

export class Logger {
  constructor(
    private transports: ITransport[] = [new ConsoleTransport()]
  ) {}

  log(level: string, message: string) {
    const entry = { level, message, timestamp: now() };
    this.transports.forEach(t => t.log(entry));
  }

  info(msg: string) { this.log("INFO", msg); }
  warn(msg: string) { this.log("WARN", msg); }
  debug(msg: string) { this.log("DEBUG", msg); }
  error(msg: string) { this.log("ERROR", msg); }
}
