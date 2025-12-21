/* eslint-disable @typescript-eslint/no-unused-vars */
import { SchemaValidator } from "./SchemaValidator";

/**
 * Sensible default schema validator.
 * 
 * - Protects against oversized context
 * - Strips unsafe keys
 * - Adds schemaVersion
 * - Does NOT throw
 * 
 * ❗ Opt-in only. Logger does not enable this automatically.
 */
export const defaultValidator = new SchemaValidator({
  schemaVersion: 1,
  maxContextKeys: 50,
  maxContextSizeBytes: 8 * 1024, // 8 KB
  requireTraceId: false,
  onError: (err) => {
    // Intentionally console.warn (not error)
    console.warn("[logger] schema violation:", err.message);
  },
});
