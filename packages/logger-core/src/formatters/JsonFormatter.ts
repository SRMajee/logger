import type { IFormatter } from "../interfaces/IFormatter";
import type { ILogEntry } from "../interfaces/ILogEntry";

export class JsonFormatter implements IFormatter {
  format(entry: ILogEntry): string {
    return JSON.stringify(entry);
  }
}
