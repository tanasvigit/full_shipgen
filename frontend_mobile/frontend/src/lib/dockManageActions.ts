import type { CreateDockInput } from "@/src/services/dockService";
import { DOCK_TYPE_OPTIONS, DOCK_ZONE_OPTIONS } from "@/src/lib/dockEnums";

export { DOCK_TYPE_OPTIONS, DOCK_ZONE_OPTIONS, dockZoneLabel } from "@/src/lib/dockEnums";

export const DOCK_STATUS_OPTIONS = ["AVAILABLE", "MAINTENANCE", "BLOCKED"] as const;
export const PAUSE_REASON_CODES = [
  { value: "EQUIPMENT_FAILURE", label: "Equipment failure" },
  { value: "MATERIAL_SHORTAGE", label: "Material shortage" },
  { value: "LABOR_DELAY", label: "Labor delay" },
  { value: "GENERIC_DELAY", label: "Generic delay" },
] as const;

export function validateCreateDockForm(form: CreateDockInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.dockName.trim()) errors.dockName = "Dock name is required";
  if (!form.dockType.trim()) errors.dockType = "Dock type is required";
  if (!form.zone.trim()) errors.zone = "Zone is required";
  return errors;
}

export function canPauseLoading(loadingStatus?: string | null) {
  return String(loadingStatus || "").toUpperCase() === "LOADING";
}

export function canResumeLoading(row: { loadingStatus?: string | null; status?: string }) {
  const loadingStatus = String(row.loadingStatus || "").toUpperCase();
  return loadingStatus === "LOADING" || row.status === "LOADING";
}
