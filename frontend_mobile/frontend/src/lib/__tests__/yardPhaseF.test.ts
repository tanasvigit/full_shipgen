import { describe, expect, it } from "vitest";
import { buildJourneySteps, mapVehicle360Profile } from "@/src/lib/vehicle360";
import { groupYardModuleLinks, visibleYardModuleLinks } from "@/src/lib/yardModules";
import { YARD_ROLE } from "@/src/lib/moduleAccess";

describe("vehicleService", () => {
  it("marks current journey step from vehicle status", () => {
    const steps = buildJourneySteps("LOADING");
    const current = steps.find((step) => step.current);
    expect(current?.key).toBe("LOADING");
  });

  it("maps vehicle journey payload into a 360 profile", () => {
    const profile = mapVehicle360Profile({
      vehicle: {
        id: "v1",
        vehicle_number: "TN01AB1234",
        transporter_name: "Acme",
        driver_name: "Alex",
        status: "WAITING",
      },
      appointment: { booking_reference: "BK-1" },
      queue_entry: { id: "q1", queue_number: "Q-100", status: "WAITING" },
      dock: { dock_code: "D3" },
      zone_name: "Waiting Area",
      current_stage: "Waiting",
      queue_status: "WAITING",
      events: [{ id: "e1", event_type: "VEHICLE_CHECKED_IN", event_time: "2026-06-18T10:00:00Z" }],
    });
    expect(profile.plate).toBe("TN01AB1234");
    expect(profile.dockCode).toBe("D3");
    expect(profile.events).toHaveLength(1);
  });
});

describe("yardModules", () => {
  const canFor = (perms: string[]) => (permission: string) =>
    perms.includes("*") || perms.includes(permission);

  it("shows gate and search for gate operator", () => {
    const links = visibleYardModuleLinks(canFor(["module.gate"]), false, YARD_ROLE.GATE_OPERATOR, {
      excludeKeys: ["profile"],
    });
    expect(links.map((link) => link.key)).toEqual(expect.arrayContaining(["gate", "search"]));
    expect(links.map((link) => link.key)).not.toContain("overview");
  });

  it("groups module links by section", () => {
    const links = visibleYardModuleLinks(canFor(["*"]), true, YARD_ROLE.ADMIN, { excludeKeys: ["profile"] });
    const grouped = groupYardModuleLinks(links);
    expect(grouped.Operations?.length).toBeGreaterThan(0);
    expect(grouped.Control?.length).toBeGreaterThan(0);
  });
});
