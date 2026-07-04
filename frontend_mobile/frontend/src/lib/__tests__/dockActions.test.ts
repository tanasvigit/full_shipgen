import { describe, expect, it } from "vitest";
import {
  canCompleteLoading,
  canReportException,
  canStartLoading,
  filterDockRows,
  resolveDockActions,
} from "@/src/lib/dockActions";
import { YMS_PERMISSIONS } from "@/src/lib/ymsPermissions";
import type { DockBoardRow } from "@/src/services/dockService";

const supervisorCan = (permission: string) =>
  permission === "*" ||
  [
    YMS_PERMISSIONS.LOADING_START,
    YMS_PERMISSIONS.LOADING_COMPLETE,
    YMS_PERMISSIONS.LOADING_MANAGE_EXCEPTIONS,
    YMS_PERMISSIONS.DOCK_WRITE,
    YMS_PERMISSIONS.YARD_EVENT_WRITE,
  ].includes(permission as typeof YMS_PERMISSIONS.LOADING_START);

const baseRow = (overrides: Partial<DockBoardRow> = {}): DockBoardRow => ({
  id: "d1",
  code: "D1",
  name: "Dock 1",
  status: "OCCUPIED",
  backendStatus: "OCCUPIED",
  hasActiveAssignment: true,
  loadingStatus: "DOCK_ASSIGNED",
  vehicleStatus: "DOCK_ASSIGNED",
  vehicleId: "v1",
  queueEntryId: "q1",
  appointmentId: "a1",
  plate: "ABC123",
  transporter: "Acme",
  progressPct: 20,
  ...overrides,
});

describe("dockActions", () => {
  it("allows start loading only when vehicle is READY_FOR_LOADING", () => {
    expect(
      canStartLoading(
        baseRow({ loadingStatus: "READY_FOR_LOADING", vehicleStatus: "READY_FOR_LOADING" }),
        { ready: true },
      ),
    ).toBe(true);
    expect(canStartLoading(baseRow())).toBe(false);
    expect(canStartLoading(baseRow({ loadingStatus: "LOADING", vehicleStatus: "LOADING" }))).toBe(false);
    expect(canStartLoading(baseRow({ hasActiveAssignment: false, vehicleId: null }))).toBe(false);
  });

  it("allows complete loading only when status is loading and not awaiting release", () => {
    expect(
      canCompleteLoading(baseRow({ loadingStatus: "LOADING", vehicleStatus: "LOADING", status: "LOADING" })),
    ).toBe(true);
    expect(
      canCompleteLoading(
        baseRow({ loadingStatus: "LOADING", vehicleStatus: "LOADING", status: "LOADING" }),
        { awaitingRelease: true },
      ),
    ).toBe(false);
    expect(canCompleteLoading(baseRow({ loadingStatus: "DOCK_ASSIGNED", status: "OCCUPIED" }))).toBe(false);
  });

  it("allows exception reporting when vehicle is assigned", () => {
    expect(canReportException(baseRow())).toBe(true);
    expect(canReportException(baseRow({ vehicleId: null, hasActiveAssignment: false }))).toBe(false);
  });

  it("resolves dock supervisor actions by assignment state", () => {
    const assigned = resolveDockActions(
      baseRow({ loadingStatus: "READY_FOR_LOADING", vehicleStatus: "READY_FOR_LOADING" }),
      supervisorCan,
      { ready: true },
    );
    expect(assigned.find((action) => action.id === "start_loading")?.enabled).toBe(true);
    expect(assigned.find((action) => action.id === "complete_loading")?.enabled).toBe(false);
    expect(assigned.find((action) => action.id === "report_exception")?.enabled).toBe(true);

    const loading = resolveDockActions(
      baseRow({ loadingStatus: "LOADING", vehicleStatus: "LOADING", status: "LOADING" }),
      supervisorCan,
    );
    expect(loading.find((action) => action.id === "start_loading")?.enabled).toBe(false);
    expect(loading.find((action) => action.id === "complete_loading")?.enabled).toBe(true);
    expect(loading.find((action) => action.id === "release_dock")?.enabled).toBe(false);
    expect(loading.find((action) => action.id === "pause_loading")?.enabled).toBe(true);
    expect(loading.find((action) => action.id === "resume_loading")?.enabled).toBe(false);

    const awaitingRelease = resolveDockActions(
      baseRow({
        loadingStatus: "LOADING",
        vehicleStatus: "LOADING",
        status: "LOADING",
        grossWeightKg: 12000,
      }),
      supervisorCan,
      null,
      null,
      { awaitingRelease: true },
    );
    expect(awaitingRelease.find((action) => action.id === "complete_loading")?.enabled).toBe(false);
    expect(awaitingRelease.find((action) => action.id === "release_dock")?.enabled).toBe(true);
    expect(awaitingRelease.find((action) => action.id === "pause_loading")?.enabled).toBe(false);

    const awaitingReleaseNoGross = resolveDockActions(
      baseRow({ loadingStatus: "LOADING", vehicleStatus: "LOADING", status: "LOADING" }),
      supervisorCan,
      null,
      null,
      { awaitingRelease: true },
    );
    expect(awaitingReleaseNoGross.find((action) => action.id === "release_dock")?.enabled).toBe(false);
    expect(awaitingReleaseNoGross.find((action) => action.id === "release_dock")?.reason).toContain(
      "gross weight",
    );

    const paused = resolveDockActions(
      baseRow({ loadingStatus: "LOADING", vehicleStatus: "LOADING", status: "LOADING" }),
      supervisorCan,
      null,
      { paused: true },
    );
    expect(paused.find((action) => action.id === "pause_loading")?.enabled).toBe(false);
    expect(paused.find((action) => action.id === "resume_loading")?.enabled).toBe(true);
  });

  it("filters dock rows by filter and search", () => {
    const rows = [
      baseRow({ id: "d1", code: "D1", plate: "ABC123", status: "AVAILABLE", hasActiveAssignment: false, vehicleId: null }),
      baseRow({ id: "d2", code: "D2", plate: "XYZ999", status: "LOADING", loadingStatus: "LOADING" }),
    ];
    expect(filterDockRows(rows, "available", "")).toHaveLength(1);
    expect(filterDockRows(rows, "active", "")).toHaveLength(1);
    expect(filterDockRows(rows, "all", "xyz")).toHaveLength(1);
  });
});
