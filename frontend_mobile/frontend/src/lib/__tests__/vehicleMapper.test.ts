import { describe, expect, it } from "vitest";
import { mapVehicleFromApi, normalizeVehicleType, normalizeVehicleStatus, idsMatch } from "@/src/lib/vehicleMapper";

describe("vehicleMapper", () => {
  it("maps API vehicle fields including nested driver", () => {
    const vehicle = mapVehicleFromApi({
      uuid: "veh-uuid-1",
      public_id: "vehicle_ABC",
      plate_number: "ABC-123",
      make: "Ford",
      model: "Transit",
      vehicle_type: "cargo_van",
      status: "operational",
      odometer: 42000,
      photo_url: "https://example.com/van.jpg",
      driver: {
        uuid: "driver-uuid-1",
        name: "Alex Driver",
      },
    });

    expect(vehicle.id).toBe("veh-uuid-1");
    expect(vehicle.publicId).toBe("vehicle_ABC");
    expect(vehicle.plate).toBe("ABC-123");
    expect(vehicle.model).toBe("Ford Transit");
    expect(vehicle.type).toBe("Van");
    expect(vehicle.status).toBe("active");
    expect(vehicle.mileage).toBe(42000);
    expect(vehicle.driverId).toBe("driver-uuid-1");
    expect(vehicle.driverName).toBe("Alex Driver");
    expect(vehicle.image).toBe("https://example.com/van.jpg");
  });

  it("normalizes vehicle types and statuses", () => {
    expect(normalizeVehicleType("semi_truck")).toBe("Truck");
    expect(normalizeVehicleType("cargo_van")).toBe("Van");
    expect(normalizeVehicleStatus("operational")).toBe("active");
    expect(normalizeVehicleStatus("maintenance")).toBe("maintenance");
  });

  it("matches entity ids across uuid and public id", () => {
    expect(idsMatch("abc", "abc")).toBe(true);
    expect(idsMatch("abc", "def")).toBe(false);
    expect(idsMatch("", "abc")).toBe(false);
  });
});
