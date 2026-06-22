import { describe, expect, it } from "vitest";
import { YARD_ROLE } from "@/src/lib/moduleAccess";
import { visibleYardModuleLinks } from "@/src/lib/yardModules";

function canFor(perms: string[]) {
  return (permission: string) => perms.includes("*") || perms.includes(permission);
}

describe("yardModules more hub", () => {
  it("shows queue, vehicles, yard map, labor, and equipment for yard coordinator", () => {
    const perms = [
      "module.queue",
      "module.vehicles",
      "module.yard_map",
      "module.labor",
      "module.equipment",
      "module.appointments.view",
      "queue.write",
      "labor.write",
      "equipment.write",
    ];
    const keys = visibleYardModuleLinks(canFor(perms), false, YARD_ROLE.COORDINATOR, {
      excludeKeys: ["search", "profile"],
    }).map((link) => link.key);

    expect(keys).toContain("queue");
    expect(keys).toContain("vehicles");
    expect(keys).toContain("yard-map");
    expect(keys).toContain("labor");
    expect(keys).toContain("equipment");
    expect(keys).not.toContain("gate");
    expect(keys).not.toContain("docks");
  });

  it("shows queue, loading ops, labor, and equipment for dock supervisor", () => {
    const perms = [
      "module.docks",
      "module.queue",
      "module.loading",
      "module.labor",
      "module.equipment",
      "module.vehicles",
      "module.yard_map",
      "flow.assign_dock",
      "labor.write",
      "equipment.write",
    ];
    const keys = visibleYardModuleLinks(canFor(perms), false, YARD_ROLE.DOCK_SUPERVISOR, {
      excludeKeys: ["search", "profile"],
    }).map((link) => link.key);

    expect(keys).toContain("queue");
    expect(keys).toContain("loading-ops");
    expect(keys).toContain("labor");
    expect(keys).toContain("equipment");
    expect(keys).toContain("docks");
    expect(keys).toContain("vehicles");
    expect(keys).toContain("yard-map");
  });

  it("shows yard map for gate operator with view-only permission", () => {
    const perms = ["module.gate", "module.yard_map.view", "flow.check_in"];
    const keys = visibleYardModuleLinks(canFor(perms), false, YARD_ROLE.GATE_OPERATOR, {
      excludeKeys: ["search", "profile"],
    }).map((link) => link.key);

    expect(keys).toContain("yard-map");
    expect(keys).not.toContain("vehicles");
  });
});
