import { describe, expect, it } from "vitest";
import { batchPoints, shouldAcceptPoint } from "@/src/tracking/batching";

describe("tracking batching", () => {
  it("dedupes near-identical points", () => {
    const previous = { latitude: 10, longitude: 20, capturedAt: 1 };
    const near = { latitude: 10.0000001, longitude: 20.0000001, capturedAt: 2 };
    const far = { latitude: 10.01, longitude: 20.01, capturedAt: 3 };
    expect(shouldAcceptPoint(previous, near)).toBe(false);
    expect(shouldAcceptPoint(previous, far)).toBe(true);
  });

  it("batches points into chunks", () => {
    const points = Array.from({ length: 25 }, (_, i) => ({
      latitude: i,
      longitude: i,
      capturedAt: i,
    }));
    const batches = batchPoints(points, 10);
    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(10);
  });
});
