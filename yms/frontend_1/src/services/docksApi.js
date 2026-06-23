/**
 * Dock Management — bay control layer over ymsApi.
 */

import ymsApi from "./ymsApi";
import { safeBundleFetch } from "../utils/safeBundleFetch";
import { notifyYmsDataChanged } from "./gateManagementApi";
import { computeMandatoryReadiness } from "../utils/resourceGating";
import { parseRequestType, slotFromReportingTime } from "./appointmentsApi";
import { resolveEquipmentLabel, mapEquipmentRow } from "./equipmentApi";
import { resolveLaborLabel, mapLaborRow } from "./laborApi";

export const HOURS = Array.from({ length: 12 }, (_, i) => 7 + i);

export const DOCK_TYPES = [
  "LOADING", "UNLOADING", "MIXED", "HAZMAT", "COLD_CHAIN", "CONTAINER", "GENERAL", "CUSTOM",
];

export const DOCK_ZONES = ["Zone A", "Zone B", "Zone C", "Zone D", "Zone E", "Zone F"];

export const DOCK_VEHICLE_TYPES = [
  "TRUCK", "TRAILER", "CONTAINER", "TANKER", "LCV", "TEMPO", "CUSTOM",
];

export const DOCK_MATERIAL_TYPES = [
  "GENERAL", "BAGS", "PALLETS", "STEEL", "CEMENT", "CHEMICALS", "HAZMAT",
  "PHARMA", "COLD_CHAIN", "CONTAINERS", "CUSTOM",
];

export const DOCK_STATUSES = [
  "AVAILABLE", "OCCUPIED", "MAINTENANCE", "BLOCKED", "OUT_OF_SERVICE",
];

export const DOCK_STATUSES_FUTURE = ["RESOURCE_PENDING", "READY_FOR_LOADING"];

/** Queue statuses that represent an active dock assignment (matches backend ACTIVE_DOCK_QUEUE_STATUSES). */
export const ACTIVE_DOCK_QUEUE_STATUSES = [
  "CALLED",
  "DOCK_ASSIGNED",
  "RESOURCE_PENDING",
  "READY_FOR_LOADING",
  "LOADING",
];

export function isActiveDockQueue(queue) {
  return !!queue && ACTIVE_DOCK_QUEUE_STATUSES.includes(queue.status);
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

function findEquipmentForDock(equipmentList, dockId) {
  const match = equipmentList?.find((e) => e.assigned_dock_id === dockId);
  return match ? mapEquipmentRow(match) : null;
}

function findLaborForDock(laborList, dockId) {
  const match = laborList?.find((t) => t.assigned_dock_id === dockId);
  return match ? mapLaborRow(match) : null;
}

const EQUIPMENT = ["Forklift", "Crane", "Reach Stacker", "Pallet Jack"];
const LABOR_TEAMS = ["Team Alpha", "Team Bravo", "Team Charlie", "Team Delta"];

const TYPE_PALETTE = {
  "General Cargo": "#0F172A",
  "Pharma — Cold": "#0EA5E9",
  Refrigerated: "#2563EB",
  Chemicals: "#DC2626",
  "Heavy Steel": "#64748B",
  FMCG: "#16A34A",
  Hazmat: "#D97706",
  Container: "#7C3AED",
};

export function categorizeDockType(dock) {
  const blob = `${dock.dock_type || ""} ${(dock.supported_cargo_types || []).join(" ")}`.toLowerCase();
  if (/pharma|cold|refrig/.test(blob)) return "Pharma — Cold";
  if (/refrigerat/.test(blob)) return "Refrigerated";
  if (/chem|hazmat/.test(blob)) return /hazmat/.test(blob) ? "Hazmat" : "Chemicals";
  if (/steel|heavy/.test(blob)) return "Heavy Steel";
  if (/fmcg|consumer/.test(blob)) return "FMCG";
  if (/container/.test(blob)) return "Container";
  return dock.dock_type || "General Cargo";
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < (str || "").length; i += 1) h += str.charCodeAt(i);
  return h;
}

export function deriveEquipment(dock) {
  return EQUIPMENT[hashCode(dock.dock_code) % EQUIPMENT.length];
}

export function deriveLaborTeam(dock) {
  return LABOR_TEAMS[hashCode(dock.dock_name) % LABOR_TEAMS.length];
}

export function estimateProgress(queue, vehicle) {
  const status = vehicle?.status || queue?.status;
  const startIso = queue?.dock_assigned_time || queue?.called_time || queue?.checkin_time;
  if (!startIso) {
    if (status === "LOADING") return { pct: 55, etaMin: 30, estimated: true };
    if (status === "DOCK_ASSIGNED") return { pct: 15, etaMin: 75, estimated: true };
    return { pct: 0, etaMin: 0, estimated: true };
  }
  const elapsedMin = Math.floor((Date.now() - new Date(startIso).getTime()) / 60000);
  const targetMin = status === "LOADING" ? 75 : 90;
  const pct = Math.min(98, Math.max(5, Math.round((elapsedMin / targetMin) * 100)));
  const etaMin = Math.max(0, targetMin - elapsedMin);
  return { pct, etaMin, estimated: true };
}

export function isDockDelayed(dock, queue, progress) {
  if (dock.status === "BLOCKED") return false;
  if (dock.status === "MAINTENANCE") return false;
  return progress.pct >= 85 && progress.etaMin > 15;
}

export function displayDockStatus(dock, queue, vehicle) {
  if (dock.status === "MAINTENANCE" || dock.status === "BLOCKED") return "MAINTENANCE";
  if (dock.status === "AVAILABLE" && !dock.current_vehicle_id) return "AVAILABLE";
  const progress = estimateProgress(queue, vehicle);
  if (isDockDelayed(dock, queue, progress)) return "DELAYED";
  if (dock.current_vehicle_id || dock.status === "OCCUPIED") return "OCCUPIED";
  return dock.status;
}

export function estimateUtilization(dock, queue) {
  if (dock.status === "MAINTENANCE" || dock.status === "BLOCKED") return 0;
  if (!isActiveDockQueue(queue) && !dock.current_vehicle_id) return 0;
  if (dock.current_vehicle_id) {
    const progress = estimateProgress(queue, null);
    return Math.min(100, 40 + progress.pct);
  }
  return 15 + (hashCode(dock.dock_code) % 35);
}

export function mapDockRow(dock, vehicle, appointment, queue, equipmentList = [], laborList = []) {
  const activeQueue = isActiveDockQueue(queue) ? queue : null;
  const activeVehicle =
    dock.current_vehicle_id && vehicle && String(vehicle.id) === String(dock.current_vehicle_id)
      ? vehicle
      : activeQueue
      ? vehicle
      : null;
  const hasActiveAssignment = !!(dock.current_vehicle_id && activeVehicle) || !!activeQueue;
  const progress = estimateProgress(activeQueue, activeVehicle);
  const displayStatus = displayDockStatus(dock, activeQueue, activeVehicle);
  const materialParts = (appointment?.shipment_reference || "").split("|");
  const material = materialParts.length >= 2 ? materialParts[1] : appointment?.shipment_reference;
  const equipRow = findEquipmentForDock(equipmentList, dock.id);
  const laborRow = findLaborForDock(laborList, dock.id);
  const assignedSince = dock.assigned_since || queue?.dock_assigned_time;

  return {
    id: dock.id,
    code: dock.dock_code,
    name: dock.dock_name,
    type: categorizeDockType(dock),
    rawType: dock.dock_type,
    zone: dock.zone || "—",
    maxCapacity: dock.max_capacity ?? 1,
    status: displayStatus,
    backendStatus: dock.status,
    hasActiveAssignment,
    loadingStatus:
      activeQueue?.status || (activeVehicle?.status === "LOADING" ? "LOADING" : null),
    currentVehicle: hasActiveAssignment ? activeVehicle?.vehicle_number || null : null,
    currentVehicleId: hasActiveAssignment ? dock.current_vehicle_id || activeQueue?.vehicle_id : null,
    appointmentRef: hasActiveAssignment ? appointment?.booking_reference || null : null,
    appointmentId: hasActiveAssignment ? appointment?.id : null,
    queueEntryId: hasActiveAssignment ? activeQueue?.id : null,
    queueNumber: hasActiveAssignment ? activeQueue?.queue_number || null : null,
    plate: hasActiveAssignment ? activeVehicle?.vehicle_number : null,
    transporter: hasActiveAssignment ? activeVehicle?.transporter_name : null,
    material: hasActiveAssignment ? material : null,
    progressPct: hasActiveAssignment ? progress.pct : 0,
    etaCloseMin: progress.etaMin,
    progressEstimated: progress.estimated,
    equipment: equipRow?.name || resolveEquipmentLabel(equipmentList, { dockId: dock.id }) || deriveEquipment(dock),
    equipmentCode: equipRow?.code || null,
    equipmentDerived: !equipRow && !resolveEquipmentLabel(equipmentList, { dockId: dock.id }),
    laborTeam: laborRow?.name || resolveLaborLabel(laborList, { dockId: dock.id }) || deriveLaborTeam(dock),
    laborCode: laborRow?.code || null,
    laborDerived: !laborRow && !resolveLaborLabel(laborList, { dockId: dock.id }),
    assignedSince: hasActiveAssignment ? assignedSince : null,
    assignedSinceLabel: hasActiveAssignment ? formatAssignedSince(assignedSince) : "—",
    utilizationPct: estimateUtilization(dock, activeQueue),
    supportedCargo: dock.supported_cargo_types || [],
    supportedMaterialTypes: dock.supported_cargo_types || [],
    supportedVehicles: dock.supported_vehicle_types || [],
    estimatedServiceTimeMin: dock.estimated_service_time_min ?? 90,
    dock,
    vehicle: activeVehicle,
    appointment: hasActiveAssignment ? appointment : null,
    queue: activeQueue,
    equipRow,
    laborRow,
    tareWeightKg: activeQueue?.tare_weight_kg ?? activeQueue?.tareWeightKg ?? null,
    grossWeightKg: activeQueue?.gross_weight_kg ?? activeQueue?.grossWeightKg ?? null,
    netWeightKg: activeQueue?.net_weight_kg ?? activeQueue?.netWeightKg ?? null,
  };
}

function emptyDockBundle() {
  return {
    rows: [],
    docks: [],
    vehicles: [],
    appointments: [],
    queueEntries: [],
    events: [],
    equipment: [],
    labor: [],
    vehicleMap: new Map(),
    queueByDock: new Map(),
    queueByVehicle: new Map(),
  };
}

export const EMPTY_DOCK_BUNDLE = emptyDockBundle();

export async function fetchDocksBundle({ includeAppointments = false, includeQueue = false } = {}) {
  const appointmentsPromise = safeBundleFetch(
    includeAppointments,
    () => ymsApi.listAppointments(),
    []
  );
  const queuePromise = safeBundleFetch(
    includeQueue,
    () => ymsApi.listQueueEntries(),
    []
  );

  const [docks, vehicles, appointments, queueEntries, events, equipment, labor] = await Promise.all([
    ymsApi.listDocks(),
    ymsApi.listVehicles(),
    appointmentsPromise,
    queuePromise,
    ymsApi.listYardEvents(),
    ymsApi.listEquipment(),
    ymsApi.listLabor(),
  ]);

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
  const queueByDock = new Map();
  const queueByVehicle = new Map();
  for (const q of queueEntries) {
    if (!isActiveDockQueue(q)) continue;
    if (q.dock_id) queueByDock.set(q.dock_id, q);
    queueByVehicle.set(q.vehicle_id, q);
  }

  const appointmentByVehicle = new Map();
  for (const a of appointments) {
    if (!appointmentByVehicle.has(a.vehicle_id)) appointmentByVehicle.set(a.vehicle_id, a);
  }

  const rows = docks.map((dock) => {
    const queue = queueByDock.get(dock.id) || (dock.current_vehicle_id ? queueByVehicle.get(dock.current_vehicle_id) : null);
    const vehicle = dock.current_vehicle_id
      ? vehicleMap.get(dock.current_vehicle_id)
      : queue
      ? vehicleMap.get(queue.vehicle_id)
      : null;
    const appointment =
      queue?.appointment_id
        ? appointments.find((a) => a.id === queue.appointment_id)
        : vehicle
        ? appointmentByVehicle.get(vehicle.id)
        : null;
    return mapDockRow(dock, vehicle, appointment, queue, equipment, labor);
  });

  rows.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  return {
    rows,
    docks,
    vehicles,
    appointments,
    queueEntries,
    events,
    equipment,
    labor,
    vehicleMap,
    queueByDock,
    queueByVehicle,
  };
}

export function computeDockKpis(rows) {
  const total = rows.length;
  const available = rows.filter((d) => d.status === "AVAILABLE").length;
  const occupied = rows.filter((d) => d.status === "OCCUPIED").length;
  const delayed = rows.filter((d) => d.status === "DELAYED").length;
  const maint = rows.filter((d) => d.status === "MAINTENANCE").length;
  const avgUtil = total ? Math.round(rows.reduce((s, d) => s + d.utilizationPct, 0) / total) : 0;
  return { total, available, occupied, delayed, maint, avgUtil };
}

export function buildDockTimeline(appointments, dockRow, vehicles = []) {
  const today = new Date().toISOString().slice(0, 10);
  const slots = [];

  appointments
    .filter((a) => a.gate_number === dockRow.code && a.booking_date === today)
    .forEach((a) => {
      const v = vehicles.find((x) => x.id === a.vehicle_id);
      const slot = a.scheduled_slot || slotFromReportingTime(a.reporting_time);
      slots.push({
        time: slot,
        label: v?.vehicle_number || a.booking_reference,
        type: "BOOKED",
      });
    });

  if (dockRow.currentVehicle && dockRow.queue) {
    const start = dockRow.queue.dock_assigned_time || dockRow.assignedSince;
    if (start) {
      const t = new Date(start);
      slots.push({
        time: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`,
        label: dockRow.currentVehicle,
        type: dockRow.loadingStatus === "LOADING" ? "LOADING" : "ACTIVE",
      });
    }
  }

  slots.sort((a, b) => String(a.time).localeCompare(String(b.time)));

  if (slots.length === 0) {
    return [{ time: "—", label: "Available", type: "FREE" }];
  }

  return slots;
}

async function afterMutation() {
  notifyYmsDataChanged();
}

export async function createDock(payload) {
  const result = await ymsApi.createDock({
    ...payload,
    created_by: "docks-ui",
  });
  await afterMutation();
  return mapDockRow(result, null, null, null);
}

export async function updateDock(dockId, payload) {
  const result = await ymsApi.updateDock(dockId, {
    ...payload,
    created_by: "docks-ui",
    event_note: payload.event_note || "Dock updated via docks-ui",
  });
  await afterMutation();
  return result;
}

export async function deleteDock(dockId) {
  await ymsApi.deleteDock(dockId);
  await afterMutation();
}

export async function checkDockReadiness(vehicleId) {
  return ymsApi.checkDockReadiness(vehicleId);
}

export async function fetchResourceReadiness(vehicleId) {
  if (!vehicleId) {
    return {
      dockAssigned: false,
      laborAssigned: false,
      equipmentAssigned: false,
      equipmentOptional: true,
      equipmentRecommended: true,
      ready: false,
      missing: ["dock", "labor"],
    };
  }
  try {
    return await ymsApi.checkResourceReadiness(vehicleId);
  } catch {
    const [dock, labor, equipment] = await Promise.all([
      ymsApi.checkDockReadiness(vehicleId).catch(() => ({ dockAssigned: false })),
      ymsApi.checkLaborReadiness(vehicleId).catch(() => ({ laborAssigned: false })),
      ymsApi.checkEquipmentReadiness(vehicleId).catch(() => ({ equipmentAssigned: false })),
    ]);
    return {
      ...dock,
      ...labor,
      ...equipment,
      ...computeMandatoryReadiness({
        dockAssigned: dock.dockAssigned,
        laborAssigned: labor.laborAssigned,
        equipmentAssigned: equipment.equipmentAssigned,
      }),
    };
  }
}

function dockPatchFields(dock) {
  return {
    dock_name: dock.dock_name,
    dock_type: dock.dock_type,
    zone: dock.zone,
    supported_vehicle_types: dock.supported_vehicle_types || [],
    supported_cargo_types: dock.supported_cargo_types || [],
    max_capacity: dock.max_capacity ?? 1,
    notes: dock.notes,
    estimated_service_time_min: dock.estimated_service_time_min ?? 90,
  };
}

export function computeTypeBreakdown(rows) {
  const map = {};
  rows.forEach((d) => {
    map[d.type] = (map[d.type] || 0) + 1;
  });
  return Object.entries(map).map(([name, value]) => ({
    name,
    value,
    fill: TYPE_PALETTE[name] || "#64748B",
  }));
}

export function buildScheduleHeatmap(rows, appointments) {
  const today = new Date().toISOString().slice(0, 10);
  return rows.map((dock) =>
    HOURS.map((hour) => {
      if (dock.status === "MAINTENANCE") return "MAINT";
      const apptOnDock = appointments.filter(
        (a) =>
          a.booking_date === today &&
          a.gate_number === dock.code &&
          parseInt(slotFromReportingTime(a.reporting_time), 10) === hour
      );
      if (dock.code && apptOnDock.length > 1) return "DELAYED";
      if (dock.currentVehicle && dock.status === "OCCUPIED" && hour === new Date().getHours()) return "BUSY";
      if (apptOnDock.length === 1) return "BOOKED";
      if (dock.status === "AVAILABLE") return "FREE";
      return dock.status === "DELAYED" ? "DELAYED" : "BOOKED";
    })
  );
}

export const DOCK_ASSIGNMENT_LIFECYCLE = [
  "STAGING",
  "DOCK_ASSIGNED",
  "RESOURCE_PENDING",
  "READY_FOR_LOADING",
  "LOADING",
  "COMPLETED",
  "EXIT_HOLDING",
  "EXITED",
];

export function formatWaitingDuration(minutes) {
  if (minutes == null || minutes < 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function parseMaterialLabel(shipmentRef) {
  if (!shipmentRef) return "—";
  const parts = String(shipmentRef).split("|");
  return parts.length >= 2 ? parts[1] : shipmentRef;
}

export function buildAwaitingDockAssignment(queueEntries = []) {
  return queueEntries
    .filter(
      (e) =>
        !e.dockId &&
        (e.status === "CALLED" || e.displayStatus === "REPORTING_TO_DOCK")
    )
    .map((e) => ({
      queueEntryId: e.queueEntryId,
      vehicleId: e.vehicleId,
      appointmentId: e.appointmentId,
      vehicleNumber: e.plate || "—",
      queueNumber: e.queueNumber || "—",
      appointmentRef: e.bookingRef || "—",
      material: parseMaterialLabel(e.material),
      vehicleType: e.vehicleType || "—",
      priority: e.priorityScore ?? 0,
      recommendedDock: e.recommendedDock || null,
      waitingMin: e.waitingMin ?? 0,
      waitingLabel: formatWaitingDuration(e.waitingMin),
      status: e.displayStatus || e.status,
    }))
    .sort((a, b) => b.priority - a.priority);
}

export function getAssignableDocks(dockRows) {
  return dockRows.filter(
    (d) =>
      d.backendStatus === "AVAILABLE" &&
      !d.currentVehicleId &&
      d.status !== "MAINTENANCE" &&
      d.status !== "BLOCKED"
  );
}

/** Single source for lifecycle step — prefers persisted vehicle/queue status. */
export function resolveAssignmentLifecycleStage(vehicle, queue, readiness) {
  const vs = vehicle?.status || queue?.status || "STAGING";
  if (["LOADING", "COMPLETED", "EXIT_HOLDING", "EXITED"].includes(vs)) return vs;
  if (vs === "READY_FOR_LOADING") return "READY_FOR_LOADING";
  if (readiness?.ready && ["DOCK_ASSIGNED", "RESOURCE_PENDING"].includes(vs)) {
    return "READY_FOR_LOADING";
  }
  if (vs === "RESOURCE_PENDING") return "RESOURCE_PENDING";
  if (vs === "DOCK_ASSIGNED") return "DOCK_ASSIGNED";
  if (vs === "CALLED") return "STAGING";
  return vs;
}

export function buildDockAssignmentLifecycle(vehicle, queue, readiness) {
  const current = resolveAssignmentLifecycleStage(vehicle, queue, readiness);
  const order = DOCK_ASSIGNMENT_LIFECYCLE;
  const idx = order.indexOf(current);
  const effectiveIdx = idx >= 0 ? idx : order.indexOf("STAGING");
  return order.map((step, i) => ({
    step,
    state: i < effectiveIdx ? "done" : i === effectiveIdx ? "current" : "pending",
  }));
}

export function currentAssignmentStage(vehicle, queue, readiness) {
  return resolveAssignmentLifecycleStage(vehicle, queue, readiness) || "—";
}

export async function assignStagingToDock(queueEntryId, dockId) {
  return assignQueueToDock(dockId, queueEntryId);
}

export function getCallableQueueEntries(queueEntries, vehicles) {
  return queueEntries
    .filter((q) => ["WAITING", "CHECKED_IN", "CALLED"].includes(q.status) && !q.dock_id)
    .map((q) => {
      const v = vehicles.find((x) => x.id === q.vehicle_id);
      return {
        id: q.id,
        queueNumber: q.queue_number,
        status: q.status,
        plate: v?.vehicle_number || "—",
        priority: q.priority_score,
      };
    })
    .sort((a, b) => b.priority - a.priority);
}

export async function assignQueueToDock(dockId, queueEntryId) {
  let queue = await ymsApi.getQueueEntry(queueEntryId);
  if (["WAITING", "CHECKED_IN"].includes(queue.status)) {
    queue = await ymsApi.callQueueEntry(queueEntryId);
  }
  const result = await ymsApi.assignDock(queueEntryId, { dock_id: dockId });
  notifyYmsDataChanged();
  return result;
}

export async function assignLaborToDock(dockId, laborId, options = {}) {
  const result = await ymsApi.assignDockLabor(dockId, {
    labor_id: laborId,
    workers_assigned: options.workersAssigned,
    event_note: options.eventNote || `Labor assigned to dock`,
    created_by: "docks-ui",
  });
  await afterMutation();
  return result;
}

export async function assignEquipmentToDock(dockId, equipmentId, options = {}) {
  const result = await ymsApi.assignDockEquipment(dockId, {
    equipment_id: equipmentId,
    set_in_use: !!options.setInUse,
    event_note: options.eventNote || `Equipment assigned to dock`,
    created_by: "docks-ui",
  });
  await afterMutation();
  return result;
}

export async function releaseDockResources(dockId) {
  const result = await ymsApi.releaseDockResources(dockId);
  await afterMutation();
  return result;
}

export async function releaseDock(dockId, { includeQueue = false } = {}) {
  const bundle = await fetchDocksBundle({ includeAppointments: false, includeQueue });
  const dock = bundle.docks.find((d) => d.id === dockId) || (await ymsApi.getDock(dockId));
  const queue = bundle.queueByDock.get(dockId);

  if (queue?.vehicle_id) {
    await ymsApi.transitionVehicle(queue.vehicle_id, {
      status: "COMPLETED",
      event_note: `Dock ${dock.dock_code} released — loading complete`,
      created_by: "docks-ui",
    });
  } else if (dock.current_vehicle_id) {
    await releaseDockResources(dockId);
    await ymsApi.updateDock(dockId, {
      ...dockPatchFields(dock),
      status: "AVAILABLE",
      current_vehicle_id: null,
      created_by: "docks-ui",
    });
    await ymsApi.createYardEvent({
      dock_id: dockId,
      vehicle_id: dock.current_vehicle_id,
      event_type: "DOCK_RELEASED",
      event_note: `Dock ${dock.dock_code} manually released`,
      created_by: "docks-ui",
    });
  } else {
    await ymsApi.updateDock(dockId, {
      ...dockPatchFields(dock),
      status: "AVAILABLE",
      current_vehicle_id: null,
      created_by: "docks-ui",
    });
  }
  notifyYmsDataChanged();
}

export async function startLoadingAtDock(dockId, { includeQueue = false } = {}) {
  const bundle = await fetchDocksBundle({ includeAppointments: false, includeQueue });
  const queue = bundle.queueByDock.get(dockId);
  const dock = bundle.docks.find((d) => d.id === dockId);
  const vehicleId = queue?.vehicle_id || dock?.current_vehicle_id;
  if (!vehicleId) throw new Error("No vehicle at this dock");
  await ymsApi.transitionVehicle(vehicleId, {
    status: "LOADING",
    event_note: "Loading started at dock",
    created_by: "docks-ui",
  });
  notifyYmsDataChanged();
}

export async function setDockStatus(dockId, status) {
  const dock = await ymsApi.getDock(dockId);
  await ymsApi.updateDock(dockId, {
    ...dockPatchFields(dock),
    status,
    current_vehicle_id: status === "AVAILABLE" ? null : dock.current_vehicle_id,
    created_by: "docks-ui",
    event_note: `Dock status set to ${status}`,
  });
  notifyYmsDataChanged();
}

export function getDockEvents(events, dockId, limit = 15) {
  return events
    .filter((e) => e.dock_id === dockId)
    .sort((a, b) => new Date(b.event_time) - new Date(a.event_time))
    .slice(0, limit);
}

export function nextAppointmentsForDock(appointments, dockCode, limit = 3) {
  const today = new Date().toISOString().slice(0, 10);
  return appointments
    .filter((a) => a.gate_number === dockCode && a.booking_date === today && a.status === "SCHEDULED")
    .slice(0, limit)
    .map((a) => ({
      id: a.id,
      ref: a.booking_reference,
      slot: a.scheduled_slot || slotFromReportingTime(a.reporting_time),
      type: parseRequestType(a.shipment_reference, a.remarks),
    }));
}

export default {
  DOCK_TYPES,
  DOCK_ZONES,
  DOCK_VEHICLE_TYPES,
  DOCK_MATERIAL_TYPES,
  DOCK_STATUSES,
  DOCK_ASSIGNMENT_LIFECYCLE,
  buildAwaitingDockAssignment,
  getAssignableDocks,
  buildDockAssignmentLifecycle,
  assignStagingToDock,
  fetchDocksBundle,
  computeDockKpis,
  computeTypeBreakdown,
  buildScheduleHeatmap,
  buildDockTimeline,
  createDock,
  updateDock,
  deleteDock,
  checkDockReadiness,
  fetchResourceReadiness,
  assignQueueToDock,
  assignLaborToDock,
  assignEquipmentToDock,
  releaseDockResources,
  releaseDock,
  startLoadingAtDock,
  setDockStatus,
  mapDockRow,
  HOURS,
};
