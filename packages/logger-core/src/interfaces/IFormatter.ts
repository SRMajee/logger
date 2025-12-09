import type { ILogEntry } from "../interfaces/ILogEntry";

export interface IFormatter {
  format(entry: ILogEntry): string;
}
