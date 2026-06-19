import { hasPermission, MOD, PERMS } from "./permissions";
import { filterNavMenu, NAV_MENU } from "./navigation";

const gatePerms = [
  "module.gate",
  "module.vehicles",
  "module.appointments.view",
  "module.yard_map.view",
  "flow.check_in",
  "flow.vehicle_transition",
  "yard_event.write",
  "gate.approve_entry",
  "gate.reject_entry",
  "gate.verify_exit",
  "gate.gate_out",
];

const gateOperatorPermissions = gatePerms;

describe("hasPermission", () => {
  it("grants wildcard to admin", () => {
    expect(hasPermission(["*"], MOD.GATE)).toBe(true);
    expect(hasPermission(["*"], PERMS.DOCK_WRITE)).toBe(true);
  });

  it("allows view-only appointments via module alias", () => {
    expect(hasPermission(["module.appointments.view"], MOD.APPOINTMENTS)).toBe(true);
    expect(hasPermission(["module.appointments.view"], PERMS.APPOINTMENT_WRITE)).toBe(false);
  });

  it("allows view-only yard map via module alias", () => {
    expect(hasPermission(["module.yard_map.view"], MOD.YARD_MAP)).toBe(true);
  });

  it("aliases gate approve to flow check_in", () => {
    expect(hasPermission(["flow.check_in"], PERMS.GATE_APPROVE_ENTRY)).toBe(true);
  });
});

describe("filterNavMenu", () => {
  const can = (module) => hasPermission(gateOperatorPermissions, module);

  it("shows only gate-operator modules", () => {
    const menu = filterNavMenu(NAV_MENU, can);
    const labels = menu.flatMap((s) => s.items.map((i) => i.label));
    expect(labels).toContain("Gate Management");
    expect(labels).toContain("Vehicles");
    expect(labels).toContain("Appointments");
    expect(labels).toContain("Yard Map");
    expect(labels).not.toContain("Virtual Queue");
    expect(labels).not.toContain("Docks");
    expect(labels).not.toContain("User Management");
  });

  it("hides empty sections", () => {
    const menu = filterNavMenu(NAV_MENU, can);
    expect(menu.find((s) => s.section === "Administration")).toBeUndefined();
  });
});

describe("dock_supervisor navigation", () => {
  const dockPerms = [
    "module.docks",
    "module.labor",
    "module.equipment",
    "module.loading",
    "module.vehicles",
    "module.yard_map",
  ];
  const can = (module) => hasPermission(dockPerms, module);

  it("shows dock supervisor modules only", () => {
    const labels = filterNavMenu(NAV_MENU, can).flatMap((s) => s.items.map((i) => i.label));
    expect(labels).toEqual(
      expect.arrayContaining(["Docks", "Labor", "Equipment", "Loading Ops", "Vehicles", "Yard Map"])
    );
    expect(labels).not.toContain("Gate Management");
    expect(labels).not.toContain("Virtual Queue");
  });
});
