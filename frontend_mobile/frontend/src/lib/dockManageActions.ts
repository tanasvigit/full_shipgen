import type { CreateDockInput } from "@/src/services/dockService";
import { DOCK_TYPE_OPTIONS, DOCK_ZONE_OPTIONS } from "@/src/lib/dockEnums";

export { DOCK_TYPE_OPTIONS, DOCK_ZONE_OPTIONS, dockZoneLabel } from "@/src/lib/dockEnums";

export const DOCK_STATUS_OPTIONS = ["AVAILABLE", "MAINTENANCE", "BLOCKED"] as const;

export const PAUSE_REASON_CODES = [
  { value: "MATERIAL_SHORTAGE", label: "Material shortage" },
  { value: "EQUIPMENT_FAILURE", label: "Equipment failure" },
  { value: "DOCUMENTATION_HOLD", label: "Documentation hold" },
  { value: "SAFETY_HOLD", label: "Safety hold" },
  { value: "QUALITY_HOLD", label: "Quality hold" },
  { value: "WEATHER_DELAY", label: "Weather delay" },
  { value: "OTHER", label: "Other" },
] as const;

export const DEFAULT_PAUSE_REASON_CODE = "OTHER" as const;

export function validateCreateDockForm(form: CreateDockInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.dockName.trim()) errors.dockName = "Dock name is required";
  if (!form.dockType.trim()) errors.dockType = "Dock type is required";
  if (!form.zone.trim()) errors.zone = "Zone is required";
  return errors;
}

export function isVehicleLoading(row: {
  loadingStatus?: string | null;
  vehicleStatus?: string | null;
  status?: string;
}) {
  const status = String(row.loadingStatus || row.vehicleStatus || row.status || "").toUpperCase();
  return status === "LOADING";
}

export function canPauseLoading(
  row: {
    loadingStatus?: string | null;
    vehicleStatus?: string | null;
    status?: string;
  },
  pauseState?: { paused?: boolean } | null,
  completeState?: { awaitingRelease?: boolean } | null,
) {
  return isVehicleLoading(row) && !pauseState?.paused && !completeState?.awaitingRelease;
}

export function canCompleteLoading(
  row: {
    loadingStatus?: string | null;
    vehicleStatus?: string | null;
    status?: string;
    vehicleId?: string | null;
  },
  completeState?: { awaitingRelease?: boolean } | null,
) {
  if (!row.vehicleId) return false;
  return isVehicleLoading(row) && !completeState?.awaitingRelease;
}

export function canReleaseDock(
  row: {
    hasActiveAssignment?: boolean;
    vehicleId?: string | null;
    grossWeightKg?: number | null;
  },
  completeState?: { awaitingRelease?: boolean } | null,
) {
  return Boolean(
    row.hasActiveAssignment &&
      row.vehicleId &&
      completeState?.awaitingRelease &&
      row.grossWeightKg != null,
  );
}

export function releaseDockBlockReason(
  row: {
    hasActiveAssignment?: boolean;
    vehicleId?: string | null;
    grossWeightKg?: number | null;
  },
  completeState?: { awaitingRelease?: boolean } | null,
): string | undefined {
  if (!row.hasActiveAssignment || !row.vehicleId) return "Assign a vehicle to this dock first";
  if (!completeState?.awaitingRelease) return "Complete loading before releasing the dock";
  if (row.grossWeightKg == null) return "Record gross weight before releasing the dock";
  return undefined;
}

export function canResumeLoading(pauseState?: { paused?: boolean } | null) {
  return Boolean(pauseState?.paused);
}

export function isResourceAssignedToDock(
  assignedDockId: string | null | undefined,
  dockId: string | undefined,
) {
  return Boolean(dockId && assignedDockId && assignedDockId === dockId);
}

export function canUnassignVehicleFromDock(row: {
  hasActiveAssignment?: boolean;
  vehicleId?: string | null;
  queueEntryId?: string | null;
  loadingStatus?: string | null;
  vehicleStatus?: string | null;
}) {
  const status = String(row.loadingStatus || row.vehicleStatus || "").toUpperCase();
  return Boolean(row.hasActiveAssignment && row.vehicleId) && status !== "LOADING";
}
