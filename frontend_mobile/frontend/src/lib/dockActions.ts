import type { DockBoardRow } from "@/src/services/dockService";
import { YMS_PERMISSIONS } from "@/src/lib/ymsPermissions";
import {
  canCompleteLoading as canCompleteLoadingForRow,
  canPauseLoading,
  canReleaseDock,
  canResumeLoading,
  releaseDockBlockReason,
} from "@/src/lib/dockManageActions";
import {
  canStartLoadingForVehicleStatus,
  canStartLoadingFromReadiness,
  type ResourceReadiness,
} from "@/src/lib/resourceGating";

export type DockFilter = "all" | "active" | "available" | "loading" | "delayed";

export type DockActionId =
  | "start_loading"
  | "complete_loading"
  | "release_dock"
  | "report_exception"
  | "pause_loading"
  | "resume_loading"
  | "update_status";

export type DockActionDef = {
  id: DockActionId;
  label: string;
  variant: "primary" | "danger" | "secondary";
  enabled: boolean;
  reason?: string;
};

export const MOBILE_EXCEPTION_TYPES = [
  { value: "EQUIPMENT_FAILURE", label: "Equipment failure" },
  { value: "MATERIAL_SHORTAGE", label: "Material shortage" },
  { value: "LABOR_DELAY", label: "Labor delay" },
  { value: "GENERIC_DELAY", label: "Generic delay" },
] as const;

const STARTABLE_QUEUE_STATUSES = new Set([
  "CALLED",
  "DOCK_ASSIGNED",
  "RESOURCE_PENDING",
  "READY_FOR_LOADING",
]);

function resolveVehicleStatus(row: Pick<DockBoardRow, "vehicleStatus" | "loadingStatus">) {
  return String(row.vehicleStatus || row.loadingStatus || "").toUpperCase();
}

function hasPermission(can: (permission: string) => boolean, permission: string) {
  return can("*") || can(permission);
}

export function canStartLoading(
  row: Pick<DockBoardRow, "vehicleId" | "loadingStatus" | "vehicleStatus" | "hasActiveAssignment">,
  readiness?: ResourceReadiness | null,
) {
  if (!row.hasActiveAssignment || !row.vehicleId) return false;
  const vehicleStatus = resolveVehicleStatus(row);
  const queueStatus = String(row.loadingStatus || "").toUpperCase();
  if (vehicleStatus === "LOADING" || queueStatus === "LOADING") return false;
  if (!canStartLoadingForVehicleStatus(vehicleStatus)) return false;
  if (readiness && !canStartLoadingFromReadiness(readiness)) return false;
  return true;
}

export function startLoadingBlockReason(
  row: Pick<DockBoardRow, "vehicleId" | "loadingStatus" | "vehicleStatus" | "hasActiveAssignment">,
  readiness?: ResourceReadiness | null,
): string | undefined {
  if (!row.hasActiveAssignment || !row.vehicleId) {
    return "Assign a vehicle to this dock first";
  }
  const vehicleStatus = resolveVehicleStatus(row);
  const queueStatus = String(row.loadingStatus || "").toUpperCase();
  if (vehicleStatus === "LOADING" || queueStatus === "LOADING") {
    return "Loading already in progress";
  }
  if (!canStartLoadingForVehicleStatus(vehicleStatus)) {
    if (STARTABLE_QUEUE_STATUSES.has(queueStatus) || STARTABLE_QUEUE_STATUSES.has(vehicleStatus)) {
      return "Assign labor to the dock — vehicle must reach READY_FOR_LOADING";
    }
    return `Vehicle must be READY_FOR_LOADING (current: ${vehicleStatus || "unknown"})`;
  }
  if (readiness && !canStartLoadingFromReadiness(readiness)) {
    const missing = readiness.missing?.length
      ? readiness.missing.join(", ")
      : "required dock resources";
    return `Waiting on resources: ${missing}`;
  }
  return undefined;
}

export function canCompleteLoading(
  row: Pick<DockBoardRow, "vehicleId" | "loadingStatus" | "vehicleStatus" | "status">,
  completeState?: { awaitingRelease?: boolean } | null,
) {
  return canCompleteLoadingForRow(row, completeState);
}

export { canReleaseDock } from "@/src/lib/dockManageActions";

export function canReportException(row: Pick<DockBoardRow, "vehicleId" | "hasActiveAssignment">) {
  return Boolean(row.hasActiveAssignment && row.vehicleId);
}

export function resolveDockActions(
  row: DockBoardRow | null,
  can: (permission: string) => boolean,
  readiness?: ResourceReadiness | null,
  pauseState?: { paused?: boolean } | null,
  completeState?: { awaitingRelease?: boolean } | null,
): DockActionDef[] {
  if (!row) return [];

  const startEnabled =
    hasPermission(can, YMS_PERMISSIONS.LOADING_START) && canStartLoading(row, readiness);
  const completeEnabled =
    hasPermission(can, YMS_PERMISSIONS.LOADING_COMPLETE) && canCompleteLoading(row, completeState);
  const releaseEnabled =
    hasPermission(can, YMS_PERMISSIONS.DOCK_WRITE) && canReleaseDock(row, completeState);
  const exceptionEnabled =
    (hasPermission(can, YMS_PERMISSIONS.LOADING_MANAGE_EXCEPTIONS) ||
      hasPermission(can, YMS_PERMISSIONS.YARD_EVENT_WRITE)) &&
    canReportException(row);

  const pauseEnabled =
    hasPermission(can, YMS_PERMISSIONS.YARD_EVENT_WRITE) &&
    canPauseLoading(row, pauseState, completeState);
  const resumeEnabled =
    hasPermission(can, YMS_PERMISSIONS.YARD_EVENT_WRITE) && canResumeLoading(pauseState);

  const statusEnabled = hasPermission(can, YMS_PERMISSIONS.DOCK_WRITE);

  return [
    {
      id: "start_loading",
      label: "Start loading",
      variant: "primary",
      enabled: startEnabled,
      reason: startEnabled ? undefined : startLoadingBlockReason(row, readiness),
    },
    {
      id: "complete_loading",
      label: "Complete loading",
      variant: "primary",
      enabled: completeEnabled,
      reason: completeEnabled
        ? undefined
        : completeState?.awaitingRelease
          ? "Loading already completed — release the dock when ready"
          : "Start loading before completing",
    },
    {
      id: "release_dock",
      label: "Release dock",
      variant: "primary",
      enabled: releaseEnabled,
      reason: releaseEnabled ? undefined : releaseDockBlockReason(row, completeState),
    },
    {
      id: "report_exception",
      label: "Report exception",
      variant: "danger",
      enabled: exceptionEnabled,
    },
    {
      id: "pause_loading",
      label: "Pause loading",
      variant: "secondary",
      enabled: pauseEnabled,
      reason: pauseEnabled ? undefined : "Pause when vehicle is actively loading",
    },
    {
      id: "resume_loading",
      label: "Resume loading",
      variant: "secondary",
      enabled: resumeEnabled,
      reason: resumeEnabled ? undefined : "Resume after a pause",
    },
    {
      id: "update_status",
      label: "Update dock status",
      variant: "secondary",
      enabled: statusEnabled,
    },
  ];
}

export function filterDockRows(rows: DockBoardRow[], filter: DockFilter, search: string) {
  const query = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filter === "active" && !row.hasActiveAssignment && row.status !== "LOADING") return false;
    if (filter === "available" && row.status !== "AVAILABLE") return false;
    if (filter === "loading") {
      const loadingStatus = String(row.loadingStatus || row.vehicleStatus || row.status || "").toUpperCase();
      if (loadingStatus !== "LOADING" && row.status !== "LOADING") return false;
    }
    if (filter === "delayed" && row.status !== "DELAYED") return false;
    if (!query) return true;
    const haystack = [row.code, row.name, row.plate, row.transporter, row.zone, row.status, row.loadingStatus]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}
