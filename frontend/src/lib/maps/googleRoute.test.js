import { describe, expect, it } from "vitest";
import { decodePolyline } from "@/lib/maps/decodePolyline";
import { isLiveGpsTrail, normalizeWaypoints } from "@/lib/maps/googleRoute";

describe("decodePolyline", () => {
  it("decodes a short encoded polyline", () => {
    const points = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
    expect(points.length).toBeGreaterThan(1);
    expect(points[0].lat).toBeCloseTo(38.5, 1);
    expect(points[0].lng).toBeCloseTo(-120.2, 1);
  });
});

describe("googleRoute helpers", () => {
  it("normalizes mixed coordinate shapes", () => {
    const points = normalizeWaypoints([
      [40.1, -74.1],
      { lat: 40.2, lng: -74.2 },
      null,
    ]);
    expect(points).toHaveLength(2);
  });

  it("detects live GPS trails", () => {
    expect(isLiveGpsTrail(Array.from({ length: 13 }, (_, i) => [i, i]))).toBe(true);
    expect(isLiveGpsTrail([[1, 2], [3, 4]])).toBe(false);
  });
});
