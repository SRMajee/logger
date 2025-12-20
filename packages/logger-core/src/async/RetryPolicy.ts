export interface RetryOptions {
  retries: number;
  initialDelayMs: number;
  maxDelayMs?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let attempt = 0;
  let delay = options.initialDelayMs;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt > options.retries) {
        throw err;
      }

      await sleep(delay);
      delay = Math.min(
        delay * 2,
        options.maxDelayMs ?? delay * 2
      );
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
