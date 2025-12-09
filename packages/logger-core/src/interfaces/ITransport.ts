export interface ITransport {
  log(payload: string): void | Promise<void>;
}
