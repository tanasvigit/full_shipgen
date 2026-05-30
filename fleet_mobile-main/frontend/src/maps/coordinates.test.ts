import { describe, expect, it } from "vitest";
import { tripMarkersFromOrder } from "@/src/maps/coordinates";

describe("trip map coordinates", () => {
  it("returns null when no coordinates are available", () => {
    const model = tripMarkersFromOrder({
      id: "order-1",
      code: "ORD-1",
      pickup: "Warehouse A",
      dropoff: "Customer B",
    });
    expect(model).toBeNull();
  });

  it("builds pickup/dropoff markers from API coordinates", () => {
    const model = tripMarkersFromOrder({
      id: "order-1",
      code: "ORD-1",
      pickup: "Warehouse A",
      dropoff: "Customer B",
      pickupCoordinate: { latitude: 40.7, longitude: -74.0 },
      dropoffCoordinate: { latitude: 40.72, longitude: -73.98 },
    });
    expect(model?.pickup.kind).toBe("pickup");
    expect(model?.route.length).toBe(2);
  });
});
