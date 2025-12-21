import type { SamplerConfig } from "../interfaces";

/**
 * Sensible defaults:
 * - rate limit noisy logs
 * - deduplicate bursts
 * - keep everything (no probabilistic drop)
 */
export const defaultSampler: SamplerConfig = {
  rateLimit: {
    limit: 100,
    intervalMs: 1000,
    key: (e) => e.level, // per-level rate limit
  },

  dedup: {
    windowMs: 2000,
  },

  probabilistic: {
    probability: 1.0, // keep all by default
  },
};
