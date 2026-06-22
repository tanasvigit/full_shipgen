import { describe, expect, it } from "vitest";
import {
  YARD_ROLE,
  canAccessYardScreen,
  canAccessYardTab,
  defaultYardHome,
  hasDocksModuleAccess,
  hasQueueModuleAccess,
  visibleYardTabs,
} from "@/src/lib/moduleAccess";

function canFor(perms: string[]) {
  return (permission: string) => perms.includes("*") || perms.includes(permission);
}

describe("moduleAccess yard routing", () => {
  it("sends gate operator to gate home with gate, appointments, search, more, and profile tabs", () => {
    const perms = ["module.gate", "flow.check_in"];
    expect(defaultYardHome({ role: YARD_ROLE.GATE_OPERATOR, permissions: perms })).toBe("/(yard)/gate");
    expect(visibleYardTabs(canFor(perms), false, YARD_ROLE.GATE_OPERATOR)).toEqual([
      "gate",
      "appointments",
      "search",
      "more",
      "profile",
    ]);
    expect(canAccessYardTab("appointments", canFor(perms), false, YARD_ROLE.GATE_OPERATOR)).toBe(true);
  });

  it("sends yard coordinator to queue home with queue, search, more, and profile tabs", () => {
    const perms = ["module.queue", "queue.write"];
    expect(defaultYardHome({ role: YARD_ROLE.COORDINATOR, permissions: perms })).toBe("/(yard)/queue");
    expect(visibleYardTabs(canFor(perms), false, YARD_ROLE.COORDINATOR)).toEqual([
      "queue",
      "search",
      "more",
      "profile",
    ]);
  });

  it("sends dock supervisor to docks home with docks, search, more, and profile tabs", () => {
    const perms = ["module.docks", "loading.start"];
    expect(defaultYardHome({ role: YARD_ROLE.DOCK_SUPERVISOR, permissions: perms })).toBe("/(yard)/docks");
    expect(visibleYardTabs(canFor(perms), false, YARD_ROLE.DOCK_SUPERVISOR)).toEqual([
      "docks",
      "search",
      "more",
      "profile",
    ]);
  });

  it("sends yard manager to overview with alerts and search tabs", () => {
    const perms = ["module.control_tower", "module.queue", "queue.write"];
    expect(defaultYardHome({ role: YARD_ROLE.MANAGER, permissions: perms })).toBe("/(yard)/overview");
    expect(visibleYardTabs(canFor(perms), false, YARD_ROLE.MANAGER)).toEqual([
      "overview",
      "alerts",
      "search",
      "more",
      "profile",
    ]);
  });

  it("limits yard admin to overview, alerts, search, more, and profile tabs", () => {
    const perms = ["*"];
    expect(defaultYardHome({ role: YARD_ROLE.ADMIN, permissions: perms })).toBe("/(yard)/overview");
    expect(visibleYardTabs(canFor(perms), true, YARD_ROLE.ADMIN)).toEqual([
      "overview",
      "alerts",
      "search",
      "more",
      "profile",
    ]);
    expect(canAccessYardTab("gate", canFor(perms), true, YARD_ROLE.ADMIN)).toBe(false);
    expect(canAccessYardTab("more", canFor(perms), true, YARD_ROLE.ADMIN)).toBe(true);
  });

  it("hides gate tab for yard coordinator even if permissions were mis-assigned", () => {
    const perms = ["module.gate", "module.queue"];
    expect(canAccessYardTab("gate", canFor(perms), false, YARD_ROLE.COORDINATOR)).toBe(false);
    expect(canAccessYardTab("queue", canFor(perms), false, YARD_ROLE.COORDINATOR)).toBe(true);
  });

  it("lets yard admin open gate screen from more hub without showing gate tab", () => {
    const perms = ["*"];
    expect(canAccessYardTab("gate", canFor(perms), true, YARD_ROLE.ADMIN)).toBe(false);
    expect(canAccessYardScreen("gate", canFor(perms), true, YARD_ROLE.ADMIN)).toBe(true);
  });

  it("allows alerts tab only with control tower access", () => {
    const perms = ["module.control_tower"];
    expect(canAccessYardTab("alerts", canFor(perms), false, YARD_ROLE.MANAGER)).toBe(true);
    expect(canAccessYardTab("alerts", canFor(["module.gate"]), false, YARD_ROLE.GATE_OPERATOR)).toBe(false);
  });

  it("lets yard manager open queue from more hub with queue module permission", () => {
    const perms = ["module.control_tower", "module.queue", "queue.write"];
    expect(canAccessYardTab("queue", canFor(perms), false, YARD_ROLE.MANAGER)).toBe(false);
    expect(canAccessYardScreen("queue", canFor(perms), false, YARD_ROLE.MANAGER)).toBe(true);
  });

  it("lets yard manager open appointments from more hub with appointments module permission", () => {
    const perms = ["module.control_tower", "module.appointments", "appointment.write"];
    expect(canAccessYardTab("appointments", canFor(perms), false, YARD_ROLE.MANAGER)).toBe(false);
    expect(canAccessYardScreen("appointments", canFor(perms), false, YARD_ROLE.MANAGER)).toBe(true);
  });

  it("lets gate operator access appointments tab via gate or appointments view permission", () => {
    const perms = ["module.gate", "module.appointments.view", "flow.check_in"];
    expect(canAccessYardTab("appointments", canFor(perms), false, YARD_ROLE.GATE_OPERATOR)).toBe(true);
    expect(canAccessYardScreen("appointments", canFor(perms), false, YARD_ROLE.GATE_OPERATOR)).toBe(true);
  });

  it("lets yard coordinator open vehicles and yard map from more hub", () => {
    const perms = [
      "module.queue",
      "module.vehicles",
      "module.yard_map",
      "module.appointments.view",
      "queue.write",
    ];
    const can = canFor(perms);
    expect(canAccessYardTab("vehicles", can, false, YARD_ROLE.COORDINATOR)).toBe(false);
    expect(canAccessYardTab("yard-map", can, false, YARD_ROLE.COORDINATOR)).toBe(false);
    expect(canAccessYardScreen("vehicles", can, false, YARD_ROLE.COORDINATOR)).toBe(true);
    expect(canAccessYardScreen("yard-map", can, false, YARD_ROLE.COORDINATOR)).toBe(true);
    expect(hasDocksModuleAccess(can)).toBe(false);
    expect(hasQueueModuleAccess(can)).toBe(true);
  });

  it("lets dock supervisor access docks without queue module", () => {
    const perms = ["module.docks", "module.vehicles", "module.yard_map", "loading.start", "flow.assign_dock"];
    const can = canFor(perms);
    expect(canAccessYardScreen("docks", can, false, YARD_ROLE.DOCK_SUPERVISOR)).toBe(true);
    expect(hasQueueModuleAccess(can)).toBe(false);
    expect(hasDocksModuleAccess(can)).toBe(true);
  });

  it("lets dock supervisor open queue, loading ops, labor, and equipment from more hub", () => {
    const perms = [
      "module.docks",
      "module.queue",
      "module.loading",
      "module.labor",
      "module.equipment",
      "module.vehicles",
      "module.yard_map",
    ];
    const can = canFor(perms);
    expect(canAccessYardScreen("queue", can, false, YARD_ROLE.DOCK_SUPERVISOR)).toBe(true);
    expect(canAccessYardScreen("loading-ops", can, false, YARD_ROLE.DOCK_SUPERVISOR)).toBe(true);
    expect(canAccessYardScreen("labor", can, false, YARD_ROLE.DOCK_SUPERVISOR)).toBe(true);
    expect(canAccessYardScreen("equipment", can, false, YARD_ROLE.DOCK_SUPERVISOR)).toBe(true);
    expect(canAccessYardTab("queue", can, false, YARD_ROLE.DOCK_SUPERVISOR)).toBe(false);
  });

  it("lets coordinator open labor and equipment from more hub", () => {
    const perms = ["module.queue", "module.labor", "module.equipment", "labor.write", "equipment.write"];
    const can = canFor(perms);
    expect(canAccessYardScreen("labor", can, false, YARD_ROLE.COORDINATOR)).toBe(true);
    expect(canAccessYardScreen("equipment", can, false, YARD_ROLE.COORDINATOR)).toBe(true);
  });
});
