import type { IFormatter,ILogEntry } from "../interfaces";
export interface FormattedLog {
  raw: ILogEntry;
  payload: String;
}

export function formatEntry(
  entry: ILogEntry,
  formatter: IFormatter
): FormattedLog {
  return {
    raw: entry,
    payload: formatter.format(entry)
  };
}
