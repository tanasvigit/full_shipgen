import { describe, expect, it } from "vitest";
import { placeCoordinate } from "@/src/lib/placeCoordinates";

describe("placeCoordinate", () => {
  it("reads GeoJSON Point location from Fleetbase places", () => {
    const place = {
      name: "Pickup",
      location: { type: "Point", coordinates: [-73.9851, 40.7589] },
    };

    expect(placeCoordinate(place)).toEqual({
      latitude: 40.7589,
      longitude: -73.9851,
    });
  });

  it("reads explicit latitude and longitude fields", () => {
    expect(placeCoordinate({ latitude: 12.34, longitude: 56.78 })).toEqual({
      latitude: 12.34,
      longitude: 56.78,
    });
  });

  it("returns null when coordinates are missing", () => {
    expect(placeCoordinate({ address: "123 Main St" })).toBeNull();
    expect(placeCoordinate(null)).toBeNull();
    expect(placeCoordinate("Pickup address only")).toBeNull();
  });
});
