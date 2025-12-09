export interface ITransport {
  log(entry: any): void | Promise<void>;
}
