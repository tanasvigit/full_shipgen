import { describe, expect, it } from "vitest";
import { nextReconnectDelayMs } from "@/src/realtime/reconnect";

describe("socket reconnect", () => {
  it("uses exponential backoff", () => {
    expect(nextReconnectDelayMs(0)).toBe(1000);
    expect(nextReconnectDelayMs(4)).toBeGreaterThan(nextReconnectDelayMs(1));
    expect(nextReconnectDelayMs(20)).toBeLessThanOrEqual(30_000);
  });
});
