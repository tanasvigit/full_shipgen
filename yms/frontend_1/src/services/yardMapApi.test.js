import {
  formatZoneOperationLine,
  findNavZoneById,
  getLiveZoneCounters,
  buildYardMapModel,
} from "./yardMapApi";

describe("yardMapApi Phase 2 helpers", () => {
  test("getLiveZoneCounters reads API occupancy fields", () => {
    const counters = getLiveZoneCounters([
      { zoneType: "GATE_IN", currentOccupancy: 4, maxCapacity: 20 },
      { zoneType: "WAITING_AREA", currentOccupancy: 7, maxCapacity: 40 },
      { zoneType: "STAGING", currentOccupancy: 3, maxCapacity: 16 },
      { mapCode: "A", zoneType: "LOADING", currentOccupancy: 5, maxCapacity: 24 },
      { zoneType: "EXIT_HOLDING", currentOccupancy: 2, maxCapacity: 30 },
      { zoneType: "GATE_OUT", currentOccupancy: 0, maxCapacity: 20 },
    ]);
    expect(counters.find((c) => c.label === "Gate In")).toEqual(
      expect.objectContaining({ occupied: 4, capacity: 20 })
    );
    expect(counters.find((c) => c.label === "Loading")).toEqual(
      expect.objectContaining({ occupied: 5, capacity: 24 })
    );
    expect(counters.find((c) => c.label === "Gate Out")).toEqual(
      expect.objectContaining({ occupied: 0, capacity: 20 })
    );
    expect(counters).toHaveLength(6);
  });

  test("findNavZoneById resolves map and operational zones", () => {
    const model = {
      zones: [{ id: "z-map", mapCode: "A", name: "Loading", vehicles: [{ plate: "X" }] }],
      operationalZones: [{ id: "z-gate", name: "Gate In", vehicles: [] }],
      yardZones: [],
    };
    expect(findNavZoneById(model, "z-map")?.name).toBe("Loading");
    expect(findNavZoneById(model, "z-gate")?.name).toBe("Gate In");
  });

  test("formatZoneOperationLine builds pipe-separated summary", () => {
    const line = formatZoneOperationLine({
      plate: "APXI1000",
      status: "LOADING",
      dockCode: "DK-006",
      etaMin: 20,
      delayed: false,
    });
    expect(line).toBe("APXI1000 | Loading | DK-006 | ETA 20m");
  });

  test("buildYardMapModel only places vehicles with current_zone_id", () => {
    const zoneId = "z-loading";
    const model = buildYardMapModel({
      vehicles: [
        { id: "v1", vehicle_number: "IN-ZONE", status: "LOADING", current_zone_id: zoneId, ownership_type: "outside", transporter_name: "T" },
        { id: "v2", vehicle_number: "NO-ZONE", status: "WAITING", current_zone_id: null, ownership_type: "outside", transporter_name: "T" },
      ],
      appointments: [],
      queueEntries: [],
      events: [],
      dockRows: [],
      yardZones: [
        { id: zoneId, mapCode: "A", zoneCode: "ZN-A", name: "Loading", zoneType: "LOADING", maxCapacity: 24, currentOccupancy: 1, availableSlots: 23, occupancyPct: 4, status: "ACTIVE", color: "#16A34A" },
      ],
      dashboard: null,
    });
    expect(model.allVehicles).toHaveLength(1);
    expect(model.allVehicles[0].plate).toBe("IN-ZONE");
    expect(model.zones[0].occupied).toBe(1);
  });
});
