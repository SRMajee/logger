import { ILogEntry } from "../interfaces";
import { Sampler } from "../sampler";

export interface SamplerConfig {
  rateLimit?: {
    limit: number;
    intervalMs: number;
    key?: (entry: ILogEntry) => string;
  };

  dedup?: {
    windowMs: number;
    fingerprint?: (entry: ILogEntry) => string;
  };

  probabilistic?: {
    probability: number;
  };

  // 🔥 advanced users
  custom?: Sampler[];
}