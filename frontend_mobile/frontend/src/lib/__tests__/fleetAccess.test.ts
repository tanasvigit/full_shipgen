import { describe, expect, it } from "vitest";
import {
  canAccessFleetWorkspace,
  canManageFleetVehicles,
  showFleetTab,
} from "@/src/lib/fleetAccess";
import type { MobileUser } from "@/src/services/authService";

const driverUser: MobileUser = {
  id: "u1",
  name: "Driver",
  email: "d@test.local",
  role: "Driver",
  permissions: [],
  isAdmin: false,
  raw: { type: "driver", driver: { public_id: "driver_1", uuid: "dv-1" } },
};

const adminUser: MobileUser = {
  id: "u2",
  name: "Admin",
  email: "a@test.local",
  role: "Admin",
  permissions: ["fleet-ops list vehicle"],
  isAdmin: true,
  raw: { type: "admin" },
};

describe("fleetAccess", () => {
  it("hides fleet tab for driver users", () => {
    const can = (action: string, resource: string) =>
      action === "list" && resource === "vehicle";
    expect(showFleetTab(driverUser, can)).toBe(false);
  });

  it("shows fleet tab for ops users with list vehicle", () => {
    const can = (action: string, resource: string) =>
      action === "list" && resource === "vehicle";
    expect(showFleetTab(adminUser, can)).toBe(true);
  });

  it("hides fleet tab when vehicle list is not permitted", () => {
    expect(showFleetTab(adminUser, () => false)).toBe(false);
  });

  it("allows drivers into fleet workspace when they can list issues", () => {
    const canIssues = (action: string, resource: string) =>
      action === "list" && resource === "issue";
    expect(canAccessFleetWorkspace(driverUser, canIssues)).toBe(true);
    expect(showFleetTab(driverUser, canIssues)).toBe(false);
  });

  it("allows drivers into fleet workspace when they can list fuel reports", () => {
    const canFuel = (action: string, resource: string) =>
      action === "list" && resource === "fuel-report";
    expect(canAccessFleetWorkspace(driverUser, canFuel)).toBe(true);
  });

  it("blocks fleet workspace when user has no fleet permissions", () => {
    expect(canAccessFleetWorkspace(driverUser, () => false)).toBe(false);
    expect(canAccessFleetWorkspace(null, () => true)).toBe(false);
  });

  it("gates vehicle create for managers", () => {
    expect(canManageFleetVehicles((a, r) => a === "create" && r === "vehicle")).toBe(true);
    expect(canManageFleetVehicles(() => false)).toBe(false);
  });
});
