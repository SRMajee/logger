import { describe, it, expect } from "vitest";
import { JsonFormatter } from "../src/formatters/JsonFormatter";
import { LogLevel } from "../src/utils/levels";
import { now } from "../src/utils/now";

describe("JsonFormatter", () => {
  const formatter = new JsonFormatter();

  it("should format a log entry as a valid JSON string", () => {
    const entry = {
      level: "info" as LogLevel,
      message: "Test message",
      timestamp: now(),
      meta: { userId: 123 },
    };

    const result = formatter.format(entry);
    const parsed = JSON.parse(result);

    expect(parsed).toMatchObject({
      level: "info",
      message: "Test message",
      meta: { userId: 123 },
    });
    // Ensure timestamp is present
    expect(parsed.timestamp).toBeDefined();
  });

  it("should handle errors in metadata", () => {
    const error = new Error("Something failed");
    const entry = {
      level: "error" as LogLevel,
      message: "Failure",
      timestamp: now(),
      meta: { error },
    };

    const result = formatter.format(entry);
    expect(result).toContain("Something failed");
    expect(result).toContain("stack"); // Ensure stack trace is serialized
  });
});
