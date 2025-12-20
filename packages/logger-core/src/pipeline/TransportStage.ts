import type { FormattedLog } from "./FormatterStage";
import { withRetry } from "../async/RetryPolicy";
import { ITransport } from "../interfaces/ITransport";

export interface TransportStageOptions {
  transport: ITransport;
  retry?: {
    retries: number;
    initialDelayMs: number;
    maxDelayMs?: number;
  };
}

export async function writeToTransport(
  log: FormattedLog,
  options: TransportStageOptions
): Promise<void> {
  const fn = async () => {
    await options.transport.log(log.payload as string);
  };

  if (options.retry) {
    await withRetry(fn, options.retry);
  } else {
    await fn();
  }
}
