import { AsyncLocalStorage } from "async_hooks";

export type Context = Record<string, any>;

export class ContextManager {
  private readonly storage = new AsyncLocalStorage<Context>();

  /**
   * Run the given function within the provided context.
   * All async work spawned inside will see this context.
   */
  runWithContext<T>(ctx: Context, fn: () => T): T {
    return this.storage.run(ctx, fn);
  }

  /**
   * Merge additional fields into the current context for the
   * rest of this async chain.
   */
  mergeContext(partial: Context): void {
    const current = this.storage.getStore() ?? {};
    const next = { ...current, ...partial };
    this.storage.enterWith(next);
  }

  /**
   * Get current context (or empty object).
   */
  getContext(): Context {
    return this.storage.getStore() ?? {};
  }
}

export const defaultContextManager = new ContextManager();
