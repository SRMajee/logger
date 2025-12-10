import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Logger } from "../src/core/Logger";
import { ConsoleTransport } from "@majee/logger-core";

describe("Logger Integration", () => {
  let consoleSpy: any;

  beforeEach(() => {
    // Spy on console.log so we can check calls but suppress output
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should print to console when level is high enough", () => {
    const logger = new Logger({
      level: "info",
      transports: [{ transport: new ConsoleTransport() }],
    });

    logger.info("Hello World");

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    // Check that the output contains the message
    expect(consoleSpy.mock.calls[0][0]).toContain("Hello World");
  });

  it("should NOT print when level is too low", () => {
    const logger = new Logger({
      level: "warn", // Only warn and above
      transports: [{ transport: new ConsoleTransport() }],
    });

    logger.info("This should be ignored");

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
