import { describe, expect, it } from "vitest";
import {
  countGateActivityByTab,
  filterGateActivity,
  formatRejectReason,
  resolveGateActions,
} from "@/src/lib/gateActions";
import type { GateVehicleContext } from "@/src/services/gateService";
import { YMS_PERMISSIONS } from "@/src/lib/ymsPermissions";

const gateOperatorCan = (permission: string) =>
  permission === "*" ||
  [
    YMS_PERMISSIONS.FLOW_CHECK_IN,
    YMS_PERMISSIONS.FLOW_VEHICLE_TRANSITION,
    YMS_PERMISSIONS.YARD_EVENT_WRITE,
  ].includes(permission as typeof YMS_PERMISSIONS.FLOW_CHECK_IN);

function buildContext(overrides: Partial<GateVehicleContext> = {}): GateVehicleContext {
  return {
    vehicleId: "veh-1",
    gateId: "G1",
    entryChecks: [{ id: "a", label: "Appointment exists", passed: true }],
    exitChecks: [{ id: "b", label: "Loading completed", passed: true, field: "loading_completed_verified" }],
    entryApproved: true,
    exitApproved: true,
    display: {
      plate: "ABC123",
      transporter: "Acme",
      driver: "Driver",
      appointment: "APT-1",
      slot: "AM",
      status: "ARRIVED",
    },
    activityTab: "ARRIVED",
    ...overrides,
  };
}

describe("gateActions", () => {
  it("offers approve entry for arrived vehicles with passing checks", () => {
    const actions = resolveGateActions(buildContext(), gateOperatorCan, "entry");
    expect(actions.find((action) => action.id === "approve_entry")?.enabled).toBe(true);
  });

  it("filters exit holding rows in exit mode", () => {
    const rows = [
      { plate: "A1", activityTab: "ARRIVED", status: "ARRIVED" },
      { plate: "B1", activityTab: "EXIT_HOLDING", status: "EXIT_HOLDING" },
    ];
    expect(filterGateActivity(rows, "exit", "")).toHaveLength(1);
    expect(filterGateActivity(rows, "entry", "")).toHaveLength(1);
  });

  it("requires exit checklist completion before verify exit", () => {
    const actions = resolveGateActions(
      buildContext({
        activityTab: "EXIT_HOLDING",
        display: { ...buildContext().display, status: "EXIT_HOLDING" },
        exitChecks: [{ id: "b", label: "Loading completed", passed: false, field: "loading_completed_verified" }],
        exitApproved: false,
      }),
      gateOperatorCan,
      "exit",
    );
    expect(actions.find((action) => action.id === "verify_exit")?.enabled).toBe(false);
  });

  it("filters entry rows by pipeline tab", () => {
    const rows = [
      { plate: "A1", activityTab: "ARRIVED", status: "ARRIVED" },
      { plate: "B1", activityTab: "WAITING", status: "WAITING" },
    ];
    expect(filterGateActivity(rows, "entry", "", "WAITING")).toHaveLength(1);
    expect(filterGateActivity(rows, "entry", "", "ALL")).toHaveLength(2);
  });

  it("counts activity tabs for pipeline chips", () => {
    const rows = [
      { activityTab: "ARRIVED", status: "ARRIVED" },
      { activityTab: "WAITING", status: "WAITING" },
      { activityTab: "EXIT_HOLDING", status: "EXIT_HOLDING" },
    ];
    const counts = countGateActivityByTab(rows, "entry");
    expect(counts.ALL).toBe(2);
    expect(counts.WAITING).toBe(1);
  });

  it("appends note and photo marker to reject reason", () => {
    expect(formatRejectReason("Security hold", "Missing seal", true)).toBe(
      "Security hold — Missing seal [photo attached]",
    );
  });
});
