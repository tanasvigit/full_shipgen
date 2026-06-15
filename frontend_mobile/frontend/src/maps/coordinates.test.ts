import { describe, expect, it } from "vitest";
import { tripMarkersFromOrder, listTripMapMarkers, tripMarkersFromRoute } from "@/src/maps/coordinates";

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
    expect(model?.markers.map((marker) => marker.id)).toEqual(["pickup", "dropoff"]);
  });

  it("excludes driver position from route waypoints", () => {
    const model = tripMarkersFromOrder({
      id: "order-1",
      code: "ORD-1",
      pickup: "Warehouse A",
      dropoff: "Customer B",
      pickupCoordinate: { latitude: 40.7, longitude: -74.0 },
      dropoffCoordinate: { latitude: 40.72, longitude: -73.98 },
      driverCoordinate: { latitude: 40.71, longitude: -73.99 },
    });
    expect(model?.route).toHaveLength(2);
    expect(model?.routeWaypoints).toHaveLength(2);
    expect(model?.markers).toHaveLength(3);
  });

  it("does not duplicate pickup when driver location is missing", () => {
    const model = tripMarkersFromOrder({
      id: "order-1",
      code: "ORD-1",
      pickup: "Warehouse A",
      dropoff: "Customer B",
      pickupCoordinate: { latitude: 40.7, longitude: -74.0 },
      dropoffCoordinate: { latitude: 40.7, longitude: -74.0 },
    });
    expect(model?.driver).toBeUndefined();
    expect(listTripMapMarkers(model!)).toEqual([
      expect.objectContaining({ id: "pickup" }),
      expect.objectContaining({ id: "dropoff" }),
    ]);
  });

  it("builds route waypoint markers from coordinates", () => {
    const model = tripMarkersFromRoute({
      waypoints: [
        {
          name: "Pickup",
          address: "A",
          coordinate: { latitude: 40.7, longitude: -74.0 },
        },
        {
          name: "Dropoff",
          address: "B",
          coordinate: { latitude: 40.72, longitude: -73.98 },
        },
      ],
    });
    expect(model?.markers).toHaveLength(2);
    expect(model?.route).toHaveLength(2);
  });
});
