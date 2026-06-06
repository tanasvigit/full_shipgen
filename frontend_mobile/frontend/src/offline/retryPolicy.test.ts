import { describe, expect, it } from "vitest";
import { isRetryableError, nextRetryDelayMs, shouldDeadLetter } from "@/src/offline/retryPolicy";

describe("retryPolicy", () => {
  it("increases retry delay exponentially", () => {
    expect(nextRetryDelayMs(0)).toBeGreaterThanOrEqual(1000);
    expect(nextRetryDelayMs(3)).toBeGreaterThan(nextRetryDelayMs(1));
  });

  it("marks non-retryable 4xx as permanent", () => {
    expect(isRetryableError({ status: 403 })).toBe(false);
    expect(isRetryableError({ status: 500 })).toBe(true);
    expect(isRetryableError({ status: 429 })).toBe(true);
  });

  it("dead-letters after max retries", () => {
    expect(shouldDeadLetter(8)).toBe(true);
    expect(shouldDeadLetter(2)).toBe(false);
  });
});
