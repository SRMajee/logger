import type { SamplerConfig } from "../interfaces";

export function createDefaultSampler(opts?: {
  environment?: "dev" | "prod" | "test";
}): SamplerConfig {
  const env = opts?.environment ?? "prod";

  if (env === "dev") {
    return {
      rateLimit: {
        limit: 500,
        intervalMs: 1000,
        key: (e) => e.level,
      },
      dedup: {
        windowMs: 1000,
      },
      probabilistic: {
        probability: 1.0, // keep all in dev
      },
    };
  }

  if (env === "test") {
    return {
      probabilistic: {
        probability: 1.0,
      },
    };
  }

  // prod (default)
  return {
    rateLimit: {
      limit: 100,
      intervalMs: 1000,
      key: (e) => e.level,
    },
    dedup: {
      windowMs: 2000,
    },
    probabilistic: {
      probability: 0.3, // reduce volume in prod
    },
  };
}
