import type { ILogEntry } from "../interfaces";

export type SamplerDecision = "keep" | "drop";

export interface Sampler {
  decide(entry: ILogEntry): SamplerDecision;
}

/* -------------------------------------------------- */
/* RATE LIMIT SAMPLER                                 */
/* -------------------------------------------------- */

export interface RateLimitOptions {
  limit: number;        // max logs
  intervalMs: number;   // per interval
  key?: (entry: ILogEntry) => string; // default: global
}

export class RateLimitSampler implements Sampler {
  private buckets = new Map<string, { count: number; resetAt: number }>();
  private opts: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.opts = options;
  }

  decide(entry: ILogEntry): SamplerDecision {
    const key = this.opts.key?.(entry) ?? "__global__";
    const now = Date.now();

    let bucket = this.buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = {
        count: 0,
        resetAt: now + this.opts.intervalMs,
      };
      this.buckets.set(key, bucket);
    }

    if (bucket.count >= this.opts.limit) {
      return "drop";
    }

    bucket.count++;
    return "keep";
  }
}

/* -------------------------------------------------- */
/* DEDUP SAMPLER                                      */
/* -------------------------------------------------- */

export interface DedupOptions {
  windowMs: number;
  fingerprint?: (entry: ILogEntry) => string;
}

export class DedupSampler implements Sampler {
  private seen = new Map<string, number>();
  private opts: DedupOptions;

  constructor(options: DedupOptions) {
    this.opts = options;
  }

  decide(entry: ILogEntry): SamplerDecision {
    const key =
      this.opts.fingerprint?.(entry) ??
      `${entry.level}:${entry.message}`;

    const now = Date.now();
    const last = this.seen.get(key);

    if (last && now - last < this.opts.windowMs) {
      return "drop";
    }

    this.seen.set(key, now);
    return "keep";
  }
}

/* -------------------------------------------------- */
/* PROBABILISTIC SAMPLER                              */
/* -------------------------------------------------- */

export interface ProbabilisticOptions {
  probability: number; // 0.0 – 1.0
}

export class ProbabilisticSampler implements Sampler {
  private p: number;

  constructor(options: ProbabilisticOptions) {
    this.p = Math.max(0, Math.min(1, options.probability));
  }

  decide(): SamplerDecision {
    return Math.random() < this.p ? "keep" : "drop";
  }
}

/* -------------------------------------------------- */
/* COMPOSITE SAMPLER                                  */
/* -------------------------------------------------- */

export class CompositeSampler implements Sampler {
  private samplers: Sampler[];

  constructor(samplers: Sampler[]) {
    this.samplers = samplers;
  }

  decide(entry: ILogEntry): SamplerDecision {
    for (const sampler of this.samplers) {
      if (sampler.decide(entry) === "drop") {
        return "drop";
      }
    }
    return "keep";
  }
}
