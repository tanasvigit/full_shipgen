import { describe, expect, it } from "vitest";
import { liveDriversToMapMarkers, mapLiveDriverPins } from "@/src/lib/liveMapper";

describe("liveMapper", () => {
  it("maps driver locations into map markers", () => {
    const pins = mapLiveDriverPins([
      {
        uuid: "driver-1",
        name: "Alex",
        online: true,
        location: { type: "Point", coordinates: [-97.74, 30.27] },
      },
      {
        uuid: "driver-2",
        name: "No GPS",
      },
    ]);

    expect(pins).toHaveLength(1);
    expect(pins[0]?.name).toBe("Alex");
    expect(liveDriversToMapMarkers(pins)[0]?.kind).toBe("driver");
  });
});
