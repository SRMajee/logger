import type { ITransport } from "../interfaces/ITransport";

export class ConsoleTransport implements ITransport {
  log(payload: string): void {
    console.log(payload);
  }
}
