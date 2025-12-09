import type { ITransport } from "../interfaces/ITransport";

export class ConsoleTransport implements ITransport {
  log(entry: any) {
    console.log(
      `[${entry.level}] ${new Date(entry.timestamp).toISOString()} - ${entry.message}`
    );
  }
}
