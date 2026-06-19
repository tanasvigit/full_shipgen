/**
 * Labor Management — live backend layer.
 */

import ymsApi from "./ymsApi";
import { safeBundleFetch } from "../utils/safeBundleFetch";
import { notifyYmsDataChanged } from "./gateManagementApi";

export const LABOR_MATERIAL_TYPES = [
  "GENERAL",
  "BAGS",
  "PALLETS",
  "STEEL",
  "CEMENT",
  "CHEMICALS",
  "HAZMAT",
  "PHARMA",
  "COLD_CHAIN",
  "CONTAINERS",
  "CUSTOM",
];

/** @deprecated use LABOR_MATERIAL_TYPES */
export const LABOR_TEAM_TYPES = LABOR_MATERIAL_TYPES;

export const LABOR_STATUSES = [
  "ON_DUTY",
  "OFF_DUTY",
  "ASSIGNED",
  "AVAILABLE",
  "BREAK",
  "UNAVAILABLE",
];

export function formatShift(row) {
  return `${row.shift_start} — ${row.shift_end}`;
}

export function formatAssignedSince(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function computeUtilization(row) {
  const members = row.members_count || 0;
  if (members === 0) {
    return { pct: 0, estimated: true, label: "No members" };
  }
  const assigned = row.assigned_count ?? Math.max(0, members - (row.available_count || 0));
  const pct = Math.min(100, Math.round((assigned / members) * 100));
  return { pct, estimated: false, label: null };
}

export function mapLaborRow(row) {
  const util = computeUtilization(row);
  const materialType = row.material_type || row.team_type || "GENERAL";
  return {
    laborId: row.id,
    id: row.team_code,
    code: row.team_code,
    name: row.team_name,
    shift: formatShift(row),
    shiftStart: row.shift_start,
    shiftEnd: row.shift_end,
    members: row.members_count,
    available: row.available_count,
    assigned: row.current_assignment || "—",
    assignedCount: row.assigned_count,
    status: row.status,
    supervisor: row.supervisor_name || "—",
    supervisorPhone: row.supervisor_phone || "—",
    materialType,
    teamType: materialType,
    location: row.current_location || "—",
    utilPct: util.pct,
    utilEstimated: util.estimated,
    utilLabel: util.label,
    assignedDockId: row.assigned_dock_id,
    assignedVehicleId: row.assigned_vehicle_id,
    assignedQueueEntryId: row.assigned_queue_entry_id,
    assignedAppointmentId: row.assigned_appointment_id,
    assignedSince: row.assigned_since,
    assignedSinceLabel: formatAssignedSince(row.assigned_since),
    remarks: row.notes,
    notes: row.notes,
    raw: row,
  };
}

export function resolveLaborLabel(laborList, { dockId, vehicleId } = {}) {
  if (!laborList?.length) return null;
  const match =
    (dockId && laborList.find((t) => t.assigned_dock_id === dockId)) ||
    (vehicleId && laborList.find((t) => t.assigned_vehicle_id === vehicleId));
  if (!match) return null;
  return mapLaborRow(match).name;
}

export function getLaborEvents(events, laborId, limit = 20) {
  return events
    .filter((e) => e.labor_id === laborId)
    .sort((a, b) => new Date(b.event_time) - new Date(a.event_time))
    .slice(0, limit);
}

export async function fetchLaborBundle({
  includeAppointments = false,
  includeQueue = false,
} = {}) {
  const queuePromise = safeBundleFetch(
    includeQueue,
    () => ymsApi.listQueueEntries(),
    []
  );
  const appointmentsPromise = safeBundleFetch(
    includeAppointments,
    () => ymsApi.listAppointments(),
    []
  );

  const [labor, docks, vehicles, events, queue, appointments] = await Promise.all([
    ymsApi.listLabor(),
    ymsApi.listDocks(),
    ymsApi.listVehicles(),
    ymsApi.listYardEvents(),
    queuePromise,
    appointmentsPromise,
  ]);
  const rows = labor.map(mapLaborRow);
  return { rows, labor, docks, vehicles, events, queue, appointments };
}

export function computeLaborKpis(rows) {
  const totalMembers = rows.reduce((s, t) => s + t.members, 0);
  const availableNow = rows.reduce(
    (s, t) =>
      s +
      (["ON_DUTY", "AVAILABLE", "ASSIGNED"].includes(t.status) ? t.available : 0),
    0
  );
  const onDuty = rows.filter((t) => ["ON_DUTY", "ASSIGNED", "AVAILABLE"].includes(t.status)).length;
  const avgUtil = rows.length
    ? Math.round(rows.reduce((s, t) => s + t.utilPct, 0) / rows.length)
    : 0;
  const idlePct = totalMembers ? Math.max(0, 100 - avgUtil) : 0;

  const availableWorkforce = rows
    .filter((t) => ["ON_DUTY", "AVAILABLE"].includes(t.status))
    .reduce((s, t) => s + t.available, 0);
  const assignedTeams = rows.filter((t) => t.status === "ASSIGNED").length;
  const teamsOnBreak = rows.filter((t) => t.status === "BREAK").length;
  const teamsOffDuty = rows.filter((t) => t.status === "OFF_DUTY").length;
  const teamsWorking = rows.filter(
    (t) => t.status === "ASSIGNED" && (t.assignedDockId || t.assignedVehicleId)
  ).length;
  const teamsAvailable = rows.filter((t) => ["ON_DUTY", "AVAILABLE"].includes(t.status)).length;

  return {
    totalMembers,
    availableNow,
    onDuty,
    avgUtil,
    idlePct,
    availableWorkforce,
    assignedTeams,
    teamsOnBreak,
    teamsOffDuty,
    teamsWorking,
    teamsAvailable,
    teamCount: rows.length,
  };
}

async function afterMutation(detail = {}) {
  notifyYmsDataChanged({ source: "laborApi", ...detail });
}

export async function createTeam(payload) {
  const result = await ymsApi.createLabor({
    ...payload,
    created_by: "labor-ui",
  });
  await afterMutation();
  return mapLaborRow(result);
}

export async function updateTeam(laborId, payload) {
  const result = await ymsApi.updateLabor(laborId, {
    ...payload,
    created_by: "labor-ui",
    event_note: payload.event_note || `Team updated via labor-ui`,
  });
  await afterMutation();
  return mapLaborRow(result);
}

export async function deleteTeam(laborId) {
  await ymsApi.deleteLabor(laborId);
  await afterMutation();
}

export async function checkLaborReadiness(vehicleId) {
  return ymsApi.checkLaborReadiness(vehicleId);
}

export async function assignToDock(laborId, dockId, options = {}) {
  const useDockCentric = options.dockCentric !== false;
  const result = useDockCentric
    ? await ymsApi.assignDockLabor(dockId, {
        labor_id: laborId,
        workers_assigned: options.workersAssigned,
        event_note: options.eventNote || "Labor assigned via dock-centric flow",
        created_by: options.createdBy || "docks-ui",
      })
    : await ymsApi.assignLabor(laborId, {
        dock_id: dockId,
        vehicle_id: options.vehicleId || null,
        queue_entry_id: options.queueEntryId || null,
        appointment_id: options.appointmentId || null,
        current_assignment: options.assignment,
        current_location: options.location,
        workers_assigned: options.workersAssigned,
        event_note: options.eventNote,
        created_by: "labor-ui",
      });
  await afterMutation({ action: "TEAM_ASSIGNED", laborId, dockId });
  return result;
}

export async function assignToVehicle(laborId, vehicleId, options = {}) {
  const result = await ymsApi.assignLabor(laborId, {
    vehicle_id: vehicleId,
    dock_id: options.dockId || null,
    queue_entry_id: options.queueEntryId || null,
    current_assignment: options.assignment,
    current_location: options.location,
    workers_assigned: options.workersAssigned,
    event_note: options.eventNote,
    created_by: "labor-ui",
  });
  await afterMutation();
  return result;
}

export async function release(laborId, eventNote) {
  const result = await ymsApi.releaseLabor(laborId, eventNote);
  await afterMutation();
  return result;
}

export async function markOnDuty(laborId) {
  const result = await ymsApi.markLaborOnDuty(laborId);
  await afterMutation();
  return result;
}

export async function markOffDuty(laborId) {
  const result = await ymsApi.markLaborOffDuty(laborId);
  await afterMutation();
  return result;
}

export async function markBreak(laborId) {
  const result = await ymsApi.markLaborBreak(laborId);
  await afterMutation();
  return result;
}

export async function endBreak(laborId) {
  const result = await ymsApi.endLaborBreak(laborId);
  await afterMutation();
  return result;
}

export async function markUnavailable(laborId, note) {
  const result = await ymsApi.markLaborUnavailable(laborId);
  await afterMutation();
  return result;
}

export default {
  LABOR_MATERIAL_TYPES,
  LABOR_TEAM_TYPES,
  LABOR_STATUSES,
  fetchLaborBundle,
  mapLaborRow,
  resolveLaborLabel,
  getLaborEvents,
  computeLaborKpis,
  createTeam,
  updateTeam,
  deleteTeam,
  checkLaborReadiness,
  assignToDock,
  assignToVehicle,
  release,
  markOnDuty,
  markOffDuty,
  markBreak,
  endBreak,
  markUnavailable,
};
