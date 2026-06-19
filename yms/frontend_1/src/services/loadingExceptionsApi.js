import { request } from "./ymsApi";
import { notifyYmsDataChanged } from "./gateManagementApi";

export const EXCEPTION_TYPES = [
  { value: "MATERIAL_SHORTAGE", label: "Material Shortage", critical: false },
  { value: "EQUIPMENT_FAILURE", label: "Equipment Failure", critical: true },
  { value: "LABOR_DELAY", label: "Labor Delay", critical: false },
  { value: "DOCUMENTATION_HOLD", label: "Documentation Hold", critical: false },
  { value: "SAFETY_HOLD", label: "Safety Hold", critical: true },
  { value: "QUALITY_HOLD", label: "Quality Hold", critical: false },
  { value: "WEATHER_DELAY", label: "Weather Delay", critical: false },
  { value: "GENERIC_DELAY", label: "Generic Delay", critical: false },
];

export const EXCEPTION_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

export const PAUSE_REASONS = [
  { value: "MATERIAL_SHORTAGE", label: "Material Shortage" },
  { value: "EQUIPMENT_FAILURE", label: "Equipment Failure" },
  { value: "DOCUMENTATION_HOLD", label: "Documentation Hold" },
  { value: "SAFETY_HOLD", label: "Safety Hold" },
  { value: "QUALITY_HOLD", label: "Quality Hold" },
  { value: "WEATHER_DELAY", label: "Weather Delay" },
  { value: "OTHER", label: "Other" },
];

export const AUDIT_EVENT_TYPES = new Set([
  "EXCEPTION_CREATED",
  "EXCEPTION_ASSIGNED",
  "EXCEPTION_RESOLVED",
  "EXCEPTION_CLOSED",
  "LOADING_PAUSED",
  "LOADING_RESUMED",
]);

const TYPE_LABELS = Object.fromEntries(EXCEPTION_TYPES.map((t) => [t.value, t.label]));

export function exceptionTypeLabel(type) {
  return TYPE_LABELS[type] || (type || "").replace(/_/g, " ");
}

export function isCriticalExceptionType(type) {
  return type === "EQUIPMENT_FAILURE" || type === "SAFETY_HOLD";
}

export function isActiveExceptionStatus(status) {
  return status === "OPEN" || status === "IN_PROGRESS";
}

function eventTimeMs(iso) {
  if (!iso) return NaN;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : NaN;
}

export function mapExceptionRow(row, ctx = {}) {
  const createdMs = eventTimeMs(row.created_at);
  const ageMin = Number.isFinite(createdMs)
    ? Math.max(0, Math.floor((Date.now() - createdMs) / 60000))
    : 0;
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    appointmentId: row.appointment_id,
    queueEntryId: row.queue_entry_id,
    dockId: row.dock_id,
    exceptionType: row.exception_type,
    typeLabel: exceptionTypeLabel(row.exception_type),
    status: row.status,
    description: row.description,
    createdAt: row.created_at,
    createdBy: row.created_by,
    assignedTo: row.assigned_to,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
    resolutionNotes: row.resolution_notes,
    closedAt: row.closed_at,
    closedBy: row.closed_by,
    updatedAt: row.updated_at,
    ageMin,
    ageLabel: `${ageMin}m`,
    plate: ctx.plate,
    dockCode: ctx.dockCode,
    critical: isCriticalExceptionType(row.exception_type),
    isActive: isActiveExceptionStatus(row.status),
  };
}

export async function listLoadingExceptions(params = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.vehicleId) qs.set("vehicle_id", params.vehicleId);
  if (params.queueEntryId) qs.set("queue_entry_id", params.queueEntryId);
  if (params.activeOnly) qs.set("active_only", "true");
  const suffix = qs.toString() ? `?${qs}` : "";
  const rows = await request(`/loading-operations/exceptions${suffix}`);
  return Array.isArray(rows) ? rows : [];
}

export async function createLoadingException(payload) {
  const row = await request("/loading-operations/exceptions", {
    method: "POST",
    body: JSON.stringify({
      vehicle_id: payload.vehicleId,
      appointment_id: payload.appointmentId,
      queue_entry_id: payload.queueEntryId,
      dock_id: payload.dockId,
      exception_type: payload.exceptionType,
      description: payload.description,
      created_by: payload.createdBy || "loading-ops-ui",
    }),
  });
  notifyYmsDataChanged();
  return row;
}

export async function assignLoadingException(exceptionId, assignedTo, createdBy = "loading-ops-ui") {
  const row = await request(`/loading-operations/exceptions/${exceptionId}/assign`, {
    method: "POST",
    body: JSON.stringify({ assigned_to: assignedTo, created_by: createdBy }),
  });
  notifyYmsDataChanged();
  return row;
}

export async function resolveLoadingException(
  exceptionId,
  { resolvedBy, resolutionNotes, createdBy = "loading-ops-ui" } = {}
) {
  const row = await request(`/loading-operations/exceptions/${exceptionId}/resolve`, {
    method: "POST",
    body: JSON.stringify({
      resolved_by: resolvedBy,
      resolution_notes: resolutionNotes,
      created_by: createdBy,
    }),
  });
  notifyYmsDataChanged();
  return row;
}

export async function closeLoadingException(exceptionId, closedBy, createdBy = "loading-ops-ui") {
  const row = await request(`/loading-operations/exceptions/${exceptionId}/close`, {
    method: "POST",
    body: JSON.stringify({ closed_by: closedBy, created_by: createdBy }),
  });
  notifyYmsDataChanged();
  return row;
}

export async function pauseLoadingOperation(op, reasonCode, note) {
  const result = await request("/loading-operations/pause", {
    method: "POST",
    body: JSON.stringify({
      vehicle_id: op.vehicleId,
      appointment_id: op.appointmentId,
      queue_entry_id: op.queueEntryId,
      dock_id: op.dockId,
      reason_code: reasonCode,
      note,
      created_by: "loading-ops-ui",
    }),
  });
  notifyYmsDataChanged();
  return result;
}

export async function resumeLoadingOperation(op) {
  const result = await request("/loading-operations/resume", {
    method: "POST",
    body: JSON.stringify({
      vehicle_id: op.vehicleId,
      appointment_id: op.appointmentId,
      queue_entry_id: op.queueEntryId,
      dock_id: op.dockId,
      created_by: "loading-ops-ui",
    }),
  });
  notifyYmsDataChanged();
  return result;
}

export default {
  EXCEPTION_TYPES,
  EXCEPTION_STATUSES,
  PAUSE_REASONS,
  listLoadingExceptions,
  createLoadingException,
  assignLoadingException,
  resolveLoadingException,
  closeLoadingException,
  pauseLoadingOperation,
  resumeLoadingOperation,
  mapExceptionRow,
  exceptionTypeLabel,
  isCriticalExceptionType,
  isActiveExceptionStatus,
};
