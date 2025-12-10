import type { IFormatter } from "../interfaces/IFormatter";
import type { ILogEntry } from "../interfaces/ILogEntry";

export class JsonFormatter implements IFormatter {
  format(entry: ILogEntry): string {
    return JSON.stringify(entry, this.replaceErrors);
  }

  // Helper: ensures Error objects are fully serialized
  private replaceErrors(key: string, value: any) {
    if (value instanceof Error) {
      return {
        ...value, // spread any other custom properties attached to the error
        name: value.name,
        message: value.message,
        stack: value.stack
      };
    }
    return value;
  }
}