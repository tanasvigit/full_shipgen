/**
 * Loading Operations — execution layer over ymsApi + docksApi helpers.
 */

import ymsApi from "./ymsApi";
import { safeBundleFetch } from "../utils/safeBundleFetch";
import { notifyYmsDataChanged } from "./gateManagementApi";
import { parseRequestType } from "./appointmentsApi";
import { ACTIVE_DOCK_QUEUE_STATUSES as DOCK_ACTIVE_STATUSES } from "./docksApi";
import {
  buildLoadingSession,
  computeLoadingMetrics,
  healthAccent,
  OPERATION_HEALTH,
} from "./loadingProgressEngine";
import loadingExceptionsApi, {
  isActiveExceptionStatus,
  isCriticalExceptionType,
  mapExceptionRow,
} from "./loadingExceptionsApi";
import { computePauseState, pausedMsFromState } from "./loadingPauseEngine";

export { DOCK_ACTIVE_STATUSES as ACTIVE_DOCK_QUEUE_STATUSES };
import { mapEquipmentRow } from "./equipmentApi";
import { mapLaborRow } from "./laborApi";

export { healthAccent, HEALTH as LOADING_HEALTH, OPERATION_HEALTH } from "./loadingProgressEngine";
export {
  EXCEPTION_TYPES,
  PAUSE_REASONS,
  exceptionTypeLabel,
} from "./loadingExceptionsApi";

export const EXCEPTION_EVENTS = {
  MATERIAL_SHORTAGE: "LOADING_MATERIAL_SHORTAGE",
  EQUIPMENT_ISSUE: "LOADING_EQUIPMENT_ISSUE",
  LABOR_UNAVAILABLE: "LOADING_LABOR_UNAVAILABLE",
  PAUSED: "LOADING_PAUSED",
  RESUMED: "LOADING_RESUMED",
  DELAY: "LOADING_DELAY",
  STARTED: "LOADING_STARTED",
  COMPLETED: "LOADING_COMPLETED",
};

export const NO_LABOR_ASSIGNED = "No Labor Assigned";
export const NO_EQUIPMENT_ASSIGNED = "No Equipment Assigned";

const EXCEPTION_LABELS = {
  [EXCEPTION_EVENTS.MATERIAL_SHORTAGE]: "Material shortage",
  [EXCEPTION_EVENTS.EQUIPMENT_ISSUE]: "Equipment issue",
  [EXCEPTION_EVENTS.LABOR_UNAVAILABLE]: "Labor unavailable",
  [EXCEPTION_EVENTS.PAUSED]: "Paused",
  [EXCEPTION_EVENTS.DELAY]: "Delay",
};

const ACTIVE_QUEUE_STATUSES = new Set(DOCK_ACTIVE_STATUSES);
const COMPLETED_QUEUE_STATUSES = new Set(["COMPLETED", "EXIT_HOLDING", "EXIT_VERIFIED", "EXITED"]);
const COMPLETED_VEHICLE_STATUSES = new Set(["COMPLETED", "EXIT_HOLDING", "EXIT_VERIFIED", "EXITED"]);
const RECENT_COMPLETED_MS = 4 * 3600000;

const ACTIVE_STATUS_SORT = {
  LOADING: 0,
  READY_FOR_LOADING: 1,
  RESOURCE_PENDING: 2,
  DOCK_ASSIGNED: 3,
  CALLED: 4,
};

export function isActiveQueueStatus(status) {
  return ACTIVE_QUEUE_STATUSES.has(status);
}

export function resolveOperationType(queue, appointment) {
  const qt = (queue?.queue_type || "").toLowerCase();
  if (qt.includes("unload")) return "Unloading";
  if (qt.includes("load")) return "Loading";
  const parsed = parseRequestType(appointment?.shipment_reference, appointment?.remarks);
  return parsed === "Unloading" ? "Unloading" : "Loading";
}

function resolveOperationStartIso(events, vehicleId, queue) {
  const safeEvents = Array.isArray(events) ? events : [];
  const vid = vehicleId || null;
  if (!vid && !queue?.id) return null;
  const started = [...safeEvents]
    .reverse()
    .find((e) => e.vehicle_id === vid && e.event_type === EXCEPTION_EVENTS.STARTED)?.event_time;
  return started || queue?.dock_assigned_time || queue?.called_time || null;
}

function eventTimeMs(iso) {
  if (!iso) return NaN;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : NaN;
}

export function parseExceptions(events, vehicleId, queueEntryId, startIso = null) {
  const safeEvents = Array.isArray(events) ? events : [];
  const startMs = eventTimeMs(startIso);
  const startTime = Number.isFinite(startMs) ? startMs : 0;
  const vid = vehicleId || null;
  const qid = queueEntryId || null;

  const vehEvents = safeEvents
    .filter((e) => {
      if (!e || !(e.event_type || "").startsWith("LOADING_")) return false;
      const matchesVehicle = vid && e.vehicle_id === vid;
      const matchesQueue = qid && e.queue_entry_id === qid;
      if (!matchesVehicle && !matchesQueue) return false;
      const evtMs = eventTimeMs(e.event_time);
      if (!Number.isFinite(evtMs)) return false;
      return evtMs >= startTime;
    })
    .sort((a, b) => eventTimeMs(b.event_time) - eventTimeMs(a.event_time));

  const active = [];
  let paused = false;

  const latestPause = vehEvents.find((e) => e.event_type === EXCEPTION_EVENTS.PAUSED);
  if (latestPause) {
    const resumed = vehEvents.find(
      (e) =>
        e.event_type === EXCEPTION_EVENTS.RESUMED &&
        new Date(e.event_time) > new Date(latestPause.event_time)
    );
    if (!resumed) {
      paused = true;
      active.push({
        type: EXCEPTION_EVENTS.PAUSED,
        label: EXCEPTION_LABELS[EXCEPTION_EVENTS.PAUSED],
        note: latestPause.event_note,
      });
    }
  }

  for (const type of [
    EXCEPTION_EVENTS.MATERIAL_SHORTAGE,
    EXCEPTION_EVENTS.EQUIPMENT_ISSUE,
    EXCEPTION_EVENTS.LABOR_UNAVAILABLE,
    EXCEPTION_EVENTS.DELAY,
  ]) {
    const latest = vehEvents.find((e) => e.event_type === type);
    if (latest) {
      active.push({
        type,
        label: EXCEPTION_LABELS[type] || type,
        note: latest.event_note,
      });
    }
  }

  return { list: active, paused };
}

export function formatStartedTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function matchAssignedLabor(laborList, { dockId, vehicleId, queueEntryId }) {
  if (!laborList?.length) return null;
  return (
    (queueEntryId && laborList.find((t) => t.assigned_queue_entry_id === queueEntryId)) ||
    (vehicleId && laborList.find((t) => t.assigned_vehicle_id === vehicleId)) ||
    (dockId && laborList.find((t) => t.assigned_dock_id === dockId)) ||
    null
  );
}

function matchAssignedEquipment(equipmentList, { dockId, vehicleId, queueEntryId }) {
  if (!equipmentList?.length) return null;
  return (
    (queueEntryId && equipmentList.find((e) => e.assigned_queue_entry_id === queueEntryId)) ||
    (vehicleId && equipmentList.find((e) => e.assigned_vehicle_id === vehicleId)) ||
    (dockId && equipmentList.find((e) => e.assigned_dock_id === dockId)) ||
    null
  );
}

export function resolveAssignedLaborLabel(laborList, ctx) {
  const match = matchAssignedLabor(laborList, ctx);
  if (!match) return NO_LABOR_ASSIGNED;
  const mapped = mapLaborRow(match);
  return mapped.code && mapped.name ? `${mapped.code} · ${mapped.name}` : mapped.name || mapped.code;
}

export function resolveAssignedEquipmentLabel(equipmentList, ctx) {
  const match = matchAssignedEquipment(equipmentList, ctx);
  if (!match) return NO_EQUIPMENT_ASSIGNED;
  const mapped = mapEquipmentRow(match);
  return mapped.code && mapped.name ? `${mapped.code} · ${mapped.name}` : mapped.name || mapped.code;
}

function resolveDockForQueue(queue, dockMap, events, vehicleId) {
  if (queue?.dock_id && dockMap.has(queue.dock_id)) {
    return dockMap.get(queue.dock_id);
  }
  const assignEvent = [...(events || [])]
    .reverse()
    .find(
      (e) =>
        e.vehicle_id === vehicleId &&
        (e.event_type === "DOCK_ASSIGNED" || e.event_type === "DOCK_REASSIGNED") &&
        e.dock_id
    );
  if (assignEvent?.dock_id && dockMap.has(assignEvent.dock_id)) {
    return dockMap.get(assignEvent.dock_id);
  }
  return null;
}

function findLoadingStartedBefore(events, vehicleId, beforeIso) {
  const beforeMs = eventTimeMs(beforeIso);
  return [...(events || [])]
    .filter(
      (e) =>
        e.vehicle_id === vehicleId &&
        e.event_type === EXCEPTION_EVENTS.STARTED &&
        eventTimeMs(e.event_time) <= beforeMs
    )
    .sort((a, b) => eventTimeMs(b.event_time) - eventTimeMs(a.event_time))[0];
}

function resolveDockCodeFromEvents(events, vehicleId, completedEvent) {
  const dockId =
    completedEvent?.dock_id ||
    findLoadingStartedBefore(events, vehicleId, completedEvent?.event_time)?.dock_id;
  if (!dockId) {
    const assignEvent = [...(events || [])]
      .reverse()
      .find(
        (e) =>
          e.vehicle_id === vehicleId &&
          (e.event_type === "DOCK_ASSIGNED" || e.event_type === "DOCK_REASSIGNED") &&
          e.dock_id
      );
    return assignEvent?.dock_id;
  }
  return dockId;
}

function matchExceptionsForOp(exceptionRows, vehicleId, queueEntryId, plate, dockCode) {
  return (exceptionRows || [])
    .filter(
      (row) =>
        (queueEntryId && row.queue_entry_id === queueEntryId) ||
        (vehicleId && row.vehicle_id === vehicleId)
    )
    .map((row) => mapExceptionRow(row, { plate, dockCode }));
}

export function mapOperationRow(
  queue,
  vehicle,
  appointment,
  dock,
  events,
  equipmentList = [],
  laborList = [],
  exceptionRows = []
) {
  const materialParts = (appointment?.shipment_reference || "").split("|");
  const material = materialParts.length >= 2 ? materialParts[1] : appointment?.shipment_reference || "—";
  const operationType = resolveOperationType(queue, appointment);
  const startIso = resolveOperationStartIso(events, vehicle?.id, queue);
  const pauseState = computePauseState(events, {
    vehicleId: vehicle?.id,
    queueEntryId: queue?.id,
  });
  const paused = pauseState.paused;
  const plate = vehicle?.vehicle_number || "—";
  const dockCode = dock?.dock_code || "—";
  const structuredExceptions = matchExceptionsForOp(
    exceptionRows,
    vehicle?.id,
    queue?.id,
    plate,
    dockCode
  );
  const activeExceptions = structuredExceptions.filter((ex) => ex.isActive);

  const resourceCtx = {
    dockId: dock?.id,
    vehicleId: vehicle?.id,
    queueEntryId: queue?.id,
  };

  const session = buildLoadingSession({ events, vehicleId: vehicle?.id, dock });
  const isLoading =
    queue.status === "LOADING" || vehicle?.status === "LOADING";
  const metrics = computeLoadingMetrics(session, {
    isLoading,
    pausedMs: pausedMsFromState(pauseState),
  });
  const operationHealth = paused ? OPERATION_HEALTH.PAUSED : metrics.health;

  return {
    id: queue.id,
    queueEntryId: queue.id,
    vehicleId: vehicle?.id,
    appointmentId: appointment?.id,
    appointmentRef: appointment?.booking_reference || "—",
    dockId: dock?.id,
    plate,
    driver: vehicle?.driver_name || "—",
    transporter: vehicle?.transporter_name || "—",
    dockCode,
    dockName: dock?.dock_name || "—",
    operationType,
    displayStatus: vehicle?.status || queue.status,
    queueStatus: queue.status,
    material,
    startedAt: session.loading_started_at || startIso,
    startedTime: formatStartedTime(session.loading_started_at || startIso),
    loadingSession: session,
    progressPct: metrics.progressPct,
    etaMin: metrics.remainingMin != null ? Math.abs(metrics.remainingMin) : 0,
    etaCompletionLabel: metrics.etaCompletionLabel,
    remainingLabel: metrics.remainingLabel,
    remainingMin: metrics.remainingMin,
    elapsedMin: metrics.elapsedMin,
    delayMin: metrics.delayMin,
    health: metrics.health,
    operationHealth,
    healthAccent: healthAccent(operationHealth),
    progressEstimated: metrics.progressEstimated,
    plannedDurationMin: metrics.plannedDurationMin,
    structuredExceptions,
    exceptions: activeExceptions,
    exceptionSummary:
      activeExceptions.map((e) => e.typeLabel + (e.description ? `: ${e.description}` : "")).join(" · ") ||
      null,
    paused,
    pauseState,
    pausedSince: pauseState.pausedSince,
    pauseReason: pauseState.pauseReason,
    pausedDurationMin: pauseState.pausedDurationMin,
    totalPausedMin: pauseState.totalPausedMin,
    delayed: metrics.delayed,
    hasException: activeExceptions.length > 0 || paused,
    equipment: resolveAssignedEquipmentLabel(equipmentList, resourceCtx),
    laborTeam: resolveAssignedLaborLabel(laborList, resourceCtx),
    vehicle,
    appointment,
    dock,
    queue,
    isCompleted: false,
  };
}

export function buildCompletedOperations(
  queueEntries,
  vehicles,
  appointments,
  docks,
  events,
  equipmentList = [],
  laborList = []
) {
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
  const appointmentMap = new Map(appointments.map((a) => [a.id, a]));
  const dockMap = new Map(docks.map((d) => [d.id, d]));
  const rows = [];
  const seen = new Set();

  const pushCompleted = (completedEvent, queue) => {
    const vehicleId = completedEvent?.vehicle_id || queue?.vehicle_id;
    if (!vehicleId) return;
    const key = `${vehicleId}:${completedEvent?.event_time || queue?.id}`;
    if (seen.has(key)) return;
    seen.add(key);

    const vehicle = vehicleMap.get(vehicleId);
    const appointment = queue
      ? appointmentMap.get(queue.appointment_id)
      : [...appointmentMap.values()].find((a) => a.vehicle_id === vehicleId);
    const dockId = resolveDockCodeFromEvents(events, vehicleId, completedEvent);
    const dock = dockId ? dockMap.get(dockId) : null;
    const started = findLoadingStartedBefore(events, vehicleId, completedEvent?.event_time);
    const completedAt = completedEvent?.event_time || queue?.updated_at;
    const session = buildLoadingSession({
      events,
      vehicleId,
      dock,
    });
    if (started?.event_time && !session.loading_started_at) {
      session.loading_started_at = started.event_time;
    }
    if (completedAt) {
      session.loading_completed_at = completedAt;
    }
    const metrics = computeLoadingMetrics(session, { isCompleted: true });
    const durationMin = metrics.actualDurationMin;

    rows.push({
      id: `completed-${queue?.id || vehicleId}-${completedAt}`,
      queueEntryId: queue?.id,
      vehicleId,
      appointmentId: appointment?.id,
      plate: vehicle?.vehicle_number || "—",
      appointmentRef: appointment?.booking_reference || "—",
      dockUsed: dock?.dock_code || "—",
      dockName: dock?.dock_name || "—",
      loadingDurationMin: durationMin,
      plannedDurationMin: metrics.plannedDurationMin,
      varianceMin: metrics.varianceMin,
      varianceLabel: metrics.varianceLabel,
      completedTime: formatStartedTime(completedAt),
      completedAt,
      queueStatus: queue?.status || vehicle?.status,
      health: metrics.health,
      progressPct: 100,
      isCompleted: true,
      equipment: resolveAssignedEquipmentLabel(equipmentList, {
        dockId: dock?.id,
        vehicleId,
        queueEntryId: queue?.id,
      }),
      laborTeam: resolveAssignedLaborLabel(laborList, {
        dockId: dock?.id,
        vehicleId,
        queueEntryId: queue?.id,
      }),
    });
  };

  for (const event of events || []) {
    if (event.event_type !== EXCEPTION_EVENTS.COMPLETED || !event.vehicle_id) continue;
    if (Date.now() - new Date(event.event_time).getTime() > RECENT_COMPLETED_MS) continue;
    const queue =
      queueEntries.find((q) => q.id === event.queue_entry_id) ||
      queueEntries.find((q) => q.vehicle_id === event.vehicle_id);
    pushCompleted(event, queue);
  }

  for (const queue of queueEntries) {
    if (!COMPLETED_QUEUE_STATUSES.has(queue.status)) continue;
    if (Date.now() - new Date(queue.updated_at).getTime() > RECENT_COMPLETED_MS) continue;
    const vehicle = vehicleMap.get(queue.vehicle_id);
    if (!vehicle || !COMPLETED_VEHICLE_STATUSES.has(vehicle.status)) continue;
    const already = rows.some((r) => r.vehicleId === vehicle.id);
    if (already) continue;
    const completedEvent = [...(events || [])]
      .reverse()
      .find((e) => e.vehicle_id === vehicle.id && e.event_type === EXCEPTION_EVENTS.COMPLETED);
    pushCompleted(completedEvent, queue);
  }

  return rows.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

export async function fetchLoadingOpsBundle({
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

  const [queueEntries, vehicles, appointments, docks, events, equipment, labor, exceptionRows] =
    await Promise.all([
      queuePromise,
      ymsApi.listVehicles(),
      appointmentsPromise,
      ymsApi.listDocks(),
      ymsApi.listYardEvents(),
      ymsApi.listEquipment(),
      ymsApi.listLabor(),
      loadingExceptionsApi.listLoadingExceptions({ activeOnly: false }),
    ]);

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
  const appointmentMap = new Map(appointments.map((a) => [a.id, a]));
  const dockMap = new Map(docks.map((d) => [d.id, d]));

  const activeQueues = queueEntries.filter((q) => isActiveQueueStatus(q.status));

  const operations = activeQueues
    .map((q) => {
      const dock = resolveDockForQueue(q, dockMap, events, q.vehicle_id);
      return mapOperationRow(
        q,
        vehicleMap.get(q.vehicle_id),
        appointmentMap.get(q.appointment_id),
        dock,
        events,
        equipment,
        labor,
        exceptionRows
      );
    })
    .sort(
      (a, b) =>
        (ACTIVE_STATUS_SORT[a.queueStatus] ?? 9) - (ACTIVE_STATUS_SORT[b.queueStatus] ?? 9)
    );

  const completedOperations = buildCompletedOperations(
    queueEntries,
    vehicles,
    appointments,
    docks,
    events,
    equipment,
    labor
  );

  return {
    operations,
    completedOperations,
    queueEntries,
    vehicles,
    appointments,
    docks,
    events,
    equipment,
    labor,
    exceptions: exceptionRows,
  };
}

export function buildActiveExceptionRows(exceptionRows, operations = []) {
  const opByVehicle = new Map();
  const opByQueue = new Map();
  for (const op of operations) {
    if (op.vehicleId) opByVehicle.set(op.vehicleId, op);
    if (op.queueEntryId) opByQueue.set(op.queueEntryId, op);
  }
  return (exceptionRows || [])
    .filter((row) => isActiveExceptionStatus(row.status))
    .map((row) => {
      const op =
        opByQueue.get(row.queue_entry_id) || opByVehicle.get(row.vehicle_id);
      return mapExceptionRow(row, { plate: op?.plate, dockCode: op?.dockCode });
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function computeLoadingKpis(operations, events, exceptionRows = []) {
  const active = operations.filter((o) => isActiveQueueStatus(o.queueStatus));
  const mappedExceptions = (exceptionRows || []).map((row) => mapExceptionRow(row));
  const openExceptions = mappedExceptions.filter((ex) => ex.isActive).length;
  const criticalExceptions = mappedExceptions.filter(
    (ex) => isActiveExceptionStatus(ex.status) && isCriticalExceptionType(ex.exceptionType)
  ).length;
  const pausedOperations = active.filter((o) => o.paused).length;

  const loadingElapsed = active
    .filter((o) => o.queueStatus === "LOADING" && o.startedAt)
    .map((o) => Math.floor((Date.now() - new Date(o.startedAt).getTime()) / 60000));

  const completedPairs = [];
  for (const e of events) {
    if (e.event_type !== EXCEPTION_EVENTS.COMPLETED || !e.vehicle_id) continue;
    const started = events.find(
      (s) =>
        s.vehicle_id === e.vehicle_id &&
        s.event_type === EXCEPTION_EVENTS.STARTED &&
        new Date(s.event_time) < new Date(e.event_time)
    );
    if (started) {
      completedPairs.push(
        Math.floor((new Date(e.event_time) - new Date(started.event_time)) / 60000)
      );
    }
  }

  const avgSamples = completedPairs.length ? completedPairs : loadingElapsed;
  const avgLoadingMin = avgSamples.length
    ? Math.round(avgSamples.reduce((s, m) => s + m, 0) / avgSamples.length)
    : 0;

  return {
    activeCount: active.length,
    avgLoadingMin,
    openExceptions,
    criticalExceptions,
    pausedOperations,
    dockCount: new Set(active.map((o) => o.dockId).filter(Boolean)).size,
  };
}

const OPERATION_EVENT_PREFIXES = ["LOADING_", "EXCEPTION_"];

export function getOperationEvents(events, op, limit = 30) {
  return (events || [])
    .filter((e) => {
      const type = e.event_type || "";
      const isOpEvent = OPERATION_EVENT_PREFIXES.some((p) => type.startsWith(p));
      if (!isOpEvent) return false;
      return (
        e.vehicle_id === op.vehicleId ||
        e.queue_entry_id === op.queueEntryId ||
        e.dock_id === op.dockId
      );
    })
    .sort((a, b) => new Date(b.event_time) - new Date(a.event_time))
    .slice(0, limit);
}

export function formatAuditEventLabel(eventType) {
  return (eventType || "").replace(/_/g, " ");
}

async function writeOpEvent(op, eventType, note) {
  await ymsApi.createYardEvent({
    vehicle_id: op.vehicleId,
    appointment_id: op.appointmentId,
    queue_entry_id: op.queueEntryId,
    dock_id: op.dockId,
    event_type: eventType,
    event_note: note,
    created_by: "loading-ops-ui",
  });
  notifyYmsDataChanged();
}

export async function startLoadingOperation(op) {
  if (!op?.vehicleId) throw new Error("No vehicle for operation");
  await ymsApi.transitionVehicle(op.vehicleId, {
    status: "LOADING",
    event_note: `${op.operationType} started`,
    created_by: "loading-ops-ui",
  });
}

export async function startUnloadingOperation(op) {
  return startLoadingOperation({ ...op, operationType: "Unloading" });
}

export async function completeOperation(op) {
  if (!op?.vehicleId) throw new Error("No vehicle for operation");
  await ymsApi.transitionVehicle(op.vehicleId, {
    status: "COMPLETED",
    event_note: `${op.operationType} completed`,
    created_by: "loading-ops-ui",
  });
}

export async function pauseOperation(op, reasonCode = "OTHER", note) {
  return loadingExceptionsApi.pauseLoadingOperation(op, reasonCode, note);
}

export async function resumeOperation(op) {
  return loadingExceptionsApi.resumeLoadingOperation(op);
}

export async function createOperationException(op, exceptionType, description) {
  return loadingExceptionsApi.createLoadingException({
    vehicleId: op.vehicleId,
    appointmentId: op.appointmentId,
    queueEntryId: op.queueEntryId,
    dockId: op.dockId,
    exceptionType,
    description,
  });
}

export async function assignOperationException(exceptionId, assignedTo) {
  return loadingExceptionsApi.assignLoadingException(exceptionId, assignedTo);
}

export async function resolveOperationException(exceptionId, resolvedBy, resolutionNotes) {
  return loadingExceptionsApi.resolveLoadingException(exceptionId, {
    resolvedBy,
    resolutionNotes,
  });
}

export async function closeOperationException(exceptionId, closedBy) {
  return loadingExceptionsApi.closeLoadingException(exceptionId, closedBy);
}

/** @deprecated Use createOperationException */
export async function reportMaterialShortage(op, note = "Material shortage reported") {
  return createOperationException(op, "MATERIAL_SHORTAGE", note);
}

/** @deprecated Use createOperationException */
export async function reportEquipmentIssue(op, note = "Equipment issue reported") {
  return createOperationException(op, "EQUIPMENT_FAILURE", note);
}

/** @deprecated Use createOperationException */
export async function reportLaborUnavailable(op, note = "Labor unavailable") {
  return createOperationException(op, "LABOR_DELAY", note);
}

/** @deprecated Use createOperationException */
export async function reportDelay(op, note = "Operation delayed") {
  return createOperationException(op, "GENERIC_DELAY", note);
}

export default {
  fetchLoadingOpsBundle,
  computeLoadingKpis,
  buildActiveExceptionRows,
  mapOperationRow,
  buildCompletedOperations,
  isActiveQueueStatus,
  resolveAssignedLaborLabel,
  resolveAssignedEquipmentLabel,
  startLoadingOperation,
  startUnloadingOperation,
  completeOperation,
  pauseOperation,
  resumeOperation,
  createOperationException,
  assignOperationException,
  resolveOperationException,
  closeOperationException,
  reportMaterialShortage,
  reportEquipmentIssue,
  getOperationEvents,
  formatAuditEventLabel,
  EXCEPTION_EVENTS,
  NO_LABOR_ASSIGNED,
  NO_EQUIPMENT_ASSIGNED,
};
