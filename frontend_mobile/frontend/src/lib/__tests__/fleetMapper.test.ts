import { describe, expect, it } from "vitest";
import {
  mapDriverFromApi,
  mapFuelLogFromApi,
  mapIssueFromApi,
  mapPlaceFromApi,
  mapRouteFromApi,
} from "@/src/lib/fleetMapper";

describe("fleetMapper", () => {
  it("maps driver API fields", () => {
    const driver = mapDriverFromApi({
      uuid: "driver-1",
      name: "Alex Driver",
      phone: "+10000000000",
      email: "alex@test.local",
      online: true,
      avatar_url: "https://example.com/a.jpg",
      drivers_license_number: "DL-123",
      vehicle_uuid: "veh-1",
      city: "Austin",
      created_at: "2026-01-15T10:00:00Z",
    });

    expect(driver.id).toBe("driver-1");
    expect(driver.name).toBe("Alex Driver");
    expect(driver.status).toBe("online");
    expect(driver.licenseNo).toBe("DL-123");
    expect(driver.vehicleId).toBe("veh-1");
    expect(driver.currentLocation).toBe("Austin");
  });

  it("maps place and route API fields", () => {
    const place = mapPlaceFromApi({
      uuid: "place-1",
      name: "Main warehouse",
      street1: "100 Main St",
      city: "Austin",
      type: "warehouse",
      latitude: 30.2672,
      longitude: -97.7431,
    });
    expect(place.type).toBe("Warehouse");
    expect(place.address).toContain("100 Main St");
    expect(place.coordinate).toEqual({ latitude: 30.2672, longitude: -97.7431 });

    const route = mapRouteFromApi({
      uuid: "route-1",
      order_public_id: "order_ABC",
      order_status: "dispatched",
      total_distance: 12000,
      total_time: 1800,
      details: { assignments: [{}, {}] },
      driver: { uuid: "driver-1", name: "Alex Driver" },
    });
    expect(route.name).toBe("order_ABC");
    expect(route.stops).toBe(2);
    expect(route.status).toBe("active");
    expect(route.driverName).toBe("Alex Driver");
  });

  it("maps route waypoint coordinates from payload places", () => {
    const route = mapRouteFromApi({
      uuid: "route-2",
      payload: {
        pickup: {
          name: "Warehouse",
          street1: "100 Main",
          location: { type: "Point", coordinates: [-97.74, 30.27] },
        },
        dropoff: {
          name: "Customer",
          street1: "200 Oak",
          location: { type: "Point", coordinates: [-97.7, 30.25] },
        },
      },
    });
    expect(route.waypoints).toHaveLength(2);
    expect(route.waypoints[0]?.coordinate).toEqual({ latitude: 30.27, longitude: -97.74 });
    expect(route.waypoints[1]?.coordinate).toEqual({ latitude: 30.25, longitude: -97.7 });
  });

  it("maps issue and fuel report API fields", () => {
    const issue = mapIssueFromApi({
      uuid: "issue-1",
      report: "Brake warning light on",
      priority: "high",
      status: "open",
      reporter_name: "Alex Driver",
      vehicle_uuid: "veh-1",
      vehicle_name: "ABC-123",
      created_at: "2026-02-01T08:00:00Z",
    });
    expect(issue.title).toBe("Brake warning light on");
    expect(issue.vehicleId).toBe("veh-1");
    expect(issue.vehicleName).toBe("ABC-123");

    const fuel = mapFuelLogFromApi({
      uuid: "fuel-1",
      volume: 42,
      amount: 88.5,
      driver_uuid: "driver-1",
      vehicle_uuid: "veh-1",
      vehicle_name: "ABC-123",
      created_at: "2026-02-02T08:00:00Z",
      odometer: 12000,
    });
    expect(fuel.amount).toBe(42);
    expect(fuel.cost).toBe(88.5);
    expect(fuel.vehicleName).toBe("ABC-123");
  });
});
