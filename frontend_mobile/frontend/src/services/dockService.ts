import { ymsRequest, YmsApiError } from "@/src/lib/ymsApi";
import { computeLoadingCompleteState } from "@/src/lib/loadingCompleteState";
import { buildCallableQueueEntries } from "@/src/lib/dockResourceActions";
import { parseYmsList } from "@/src/services/queueService";
import { readQueueWeightKg } from "@/src/services/weighingService";
import {
  DOCK_CARGO_TYPE_DEFAULTS,
  DOCK_VEHICLE_TYPE_DEFAULTS,
} from "@/src/lib/dockEnums";

export const DOCK_CREATED_BY = "mobile-dock";

export const ACTIVE_DOCK_QUEUE_STATUSES = new Set([
  "CALLED",
  "DOCK_ASSIGNED",
  "RESOURCE_PENDING",
  "READY_FOR_LOADING",
  "LOADING",
]);

export function isActiveDockQueueEntry(queue: Record<string, unknown> | null | undefined) {
  if (!queue) return false;
  return ACTIVE_DOCK_QUEUE_STATUSES.has(String(queue.status || "").toUpperCase());
}

export type DockBoardRow = {
  id: string;
  code: string;
  name: string;
  zone?: string;
  status: string;
  backendStatus: string;
  hasActiveAssignment: boolean;
  loadingStatus?: string | null;
  vehicleStatus?: string | null;
  vehicleId?: string | null;
  queueEntryId?: string | null;
  appointmentId?: string | null;
  plate?: string | null;
  transporter?: string | null;
  queueNumber?: string | null;
  progressPct: number;
  labor?: DockResourceAssignment | null;
  equipment?: DockResourceAssignment | null;
  tareWeightKg?: number | null;
  grossWeightKg?: number | null;
  netWeightKg?: number | null;
};

export type DockResourceAssignment = {
  id: string;
  code: string;
  name: string;
  status: string;
};

export type { CallableQueueOption } from "@/src/lib/dockResourceActions";

export type DockBoardBundle = {
  rows: DockBoardRow[];
  summary: {
    total: number;
    available: number;
    occupied: number;
    loading: number;
    delayed: number;
  };
};

function isActiveDockQueue(queue: Record<string, unknown> | null | undefined) {
  return isActiveDockQueueEntry(queue);
}

function estimateProgress(queue: Record<string, unknown> | null, vehicle: Record<string, unknown> | null) {
  const status = String(vehicle?.status || queue?.status || "").toUpperCase();
  const startIso = queue?.dock_assigned_time || queue?.called_time || queue?.checkin_time;
  if (!startIso) {
    if (status === "LOADING") return 55;
    if (status === "DOCK_ASSIGNED" || status === "READY_FOR_LOADING") return 15;
    return 0;
  }
  const elapsedMin = Math.floor((Date.now() - new Date(String(startIso)).getTime()) / 60000);
  const targetMin = status === "LOADING" ? 75 : 90;
  return Math.min(98, Math.max(5, Math.round((elapsedMin / targetMin) * 100)));
}

function displayDockStatus(
  dock: Record<string, unknown>,
  queue: Record<string, unknown> | null,
  vehicle: Record<string, unknown> | null,
) {
  const backend = String(dock.status || "").toUpperCase();
  if (backend === "MAINTENANCE" || backend === "BLOCKED") return "MAINTENANCE";
  if (!dock.current_vehicle_id && !queue) return "AVAILABLE";
  const progress = estimateProgress(queue, vehicle);
  if (progress >= 85 && backend !== "MAINTENANCE") return "DELAYED";
  if (String(vehicle?.status || queue?.status || "").toUpperCase() === "LOADING") return "LOADING";
  if (dock.current_vehicle_id || queue) return "OCCUPIED";
  return backend || "AVAILABLE";
}

export function mapDockBoardRow(
  dock: Record<string, unknown>,
  vehicle: Record<string, unknown> | null,
  queue: Record<string, unknown> | null,
  labor: Record<string, unknown> | null = null,
  equipment: Record<string, unknown> | null = null,
): DockBoardRow {
  const activeQueue = isActiveDockQueue(queue) ? queue : null;
  const vehicleId = dock.current_vehicle_id
    ? String(dock.current_vehicle_id)
    : activeQueue?.vehicle_id
      ? String(activeQueue.vehicle_id)
      : null;
  const activeVehicle = vehicleId && vehicle ? vehicle : null;
  const hasActiveAssignment = Boolean(vehicleId && activeVehicle) || Boolean(activeQueue);
  const loadingStatus = activeQueue?.status
    ? String(activeQueue.status)
    : activeVehicle?.status
      ? String(activeVehicle.status)
      : null;

  return {
    id: String(dock.id),
    code: String(dock.dock_code || dock.dockCode || "—"),
    name: String(dock.dock_name || dock.dockName || "Dock"),
    zone: dock.zone ? String(dock.zone) : undefined,
    status: displayDockStatus(dock, activeQueue, activeVehicle),
    backendStatus: String(dock.status || "AVAILABLE"),
    hasActiveAssignment,
    loadingStatus,
    vehicleStatus: activeVehicle?.status ? String(activeVehicle.status) : null,
    vehicleId: hasActiveAssignment ? vehicleId : null,
    queueEntryId: activeQueue?.id ? String(activeQueue.id) : null,
    appointmentId: activeQueue?.appointment_id ? String(activeQueue.appointment_id) : null,
    plate: activeVehicle?.vehicle_number ? String(activeVehicle.vehicle_number) : null,
    transporter: activeVehicle?.transporter_name ? String(activeVehicle.transporter_name) : null,
    queueNumber: activeQueue?.queue_number ? String(activeQueue.queue_number) : null,
    progressPct: hasActiveAssignment ? estimateProgress(activeQueue, activeVehicle) : 0,
    labor: labor ? mapLaborOption(labor) : null,
    equipment: equipment ? mapEquipmentOption(equipment) : null,
    tareWeightKg: readQueueWeightKg(activeQueue, "tare"),
    grossWeightKg: readQueueWeightKg(activeQueue, "gross"),
    netWeightKg: readQueueWeightKg(activeQueue, "net"),
  };
}

function findLaborForDock(laborList: Record<string, unknown>[], dockId: string) {
  return laborList.find((row) => String(row.assigned_dock_id || "") === dockId) || null;
}

function findEquipmentForDock(equipmentList: Record<string, unknown>[], dockId: string) {
  return equipmentList.find((row) => String(row.assigned_dock_id || "") === dockId) || null;
}

export async function fetchDockBoard(_options?: { includeQueue?: boolean }): Promise<DockBoardBundle> {
  const [docksPayload, vehiclesPayload, laborPayload, equipmentPayload, queuePayload] = await Promise.all([
    ymsRequest<unknown>("/docks?limit=100"),
    ymsRequest<unknown>("/vehicles?limit=500"),
    ymsRequest<unknown>("/labor?limit=200"),
    ymsRequest<unknown>("/equipment?limit=200"),
    ymsRequest<unknown>("/queue-entries?limit=500"),
  ]);

  const docks = parseYmsList(docksPayload);
  const queueEntries = parseYmsList(queuePayload);
  const vehicles = parseYmsList(vehiclesPayload);
  const laborList = parseYmsList(laborPayload);
  const equipmentList = parseYmsList(equipmentPayload);

  const vehicleMap = new Map(vehicles.map((row) => [String(row.id), row]));
  const queueByDock = new Map<string, Record<string, unknown>>();
  const queueByVehicle = new Map<string, Record<string, unknown>>();

  for (const queue of queueEntries) {
    if (!isActiveDockQueue(queue)) continue;
    if (queue.dock_id) queueByDock.set(String(queue.dock_id), queue);
    if (queue.vehicle_id) queueByVehicle.set(String(queue.vehicle_id), queue);
  }

  const rows = docks
    .map((dock) => {
      const dockId = String(dock.id);
      const queue =
        queueByDock.get(dockId) ||
        (dock.current_vehicle_id ? queueByVehicle.get(String(dock.current_vehicle_id)) : null) ||
        null;
      const vehicle = dock.current_vehicle_id
        ? vehicleMap.get(String(dock.current_vehicle_id)) || null
        : queue?.vehicle_id
          ? vehicleMap.get(String(queue.vehicle_id)) || null
          : null;
      return mapDockBoardRow(
        dock,
        vehicle,
        queue,
        findLaborForDock(laborList, dockId),
        findEquipmentForDock(equipmentList, dockId),
      );
    })
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));

  return {
    rows,
    summary: {
      total: rows.length,
      available: rows.filter((row) => row.status === "AVAILABLE").length,
      occupied: rows.filter((row) => row.status === "OCCUPIED" || row.status === "LOADING").length,
      loading: rows.filter((row) => row.loadingStatus === "LOADING" || row.status === "LOADING").length,
      delayed: rows.filter((row) => row.status === "DELAYED").length,
    },
  };
}

export async function startLoadingAtDock(vehicleId: string, operationType = "Loading") {
  return ymsRequest<Record<string, unknown>>(`/flow/vehicles/${vehicleId}/transition`, {
    method: "POST",
    body: {
      status: "LOADING",
      event_note: `${operationType} started at dock`,
      created_by: DOCK_CREATED_BY,
    },
  });
}

export async function completeLoadingAtDock(input: {
  vehicleId: string;
  appointmentId?: string | null;
  dockId?: string | null;
  queueEntryId?: string | null;
  note?: string;
}) {
  const note = input.note || "Loading completed at dock";
  try {
    return await ymsRequest<LoadingCompleteState>("/loading-operations/complete", {
      method: "POST",
      body: {
        vehicle_id: input.vehicleId,
        appointment_id: input.appointmentId,
        dock_id: input.dockId,
        queue_entry_id: input.queueEntryId,
        note,
        created_by: DOCK_CREATED_BY,
      },
    });
  } catch (err) {
    if (!(err instanceof YmsApiError) || err.status !== 404) throw err;
    await ymsRequest<Record<string, unknown>>("/yard-events", {
      method: "POST",
      body: {
        vehicle_id: input.vehicleId,
        appointment_id: input.appointmentId,
        dock_id: input.dockId,
        queue_entry_id: input.queueEntryId,
        event_type: "LOADING_COMPLETED",
        event_note: note,
        created_by: DOCK_CREATED_BY,
      },
    });
    return {
      awaitingRelease: true,
      loadingCompleted: true,
      completedAt: new Date().toISOString(),
    };
  }
}

export type LoadingExceptionInput = {
  vehicleId?: string | null;
  appointmentId?: string | null;
  queueEntryId?: string | null;
  dockId?: string | null;
  exceptionType: string;
  description?: string;
};

export async function createLoadingException(input: LoadingExceptionInput) {
  return ymsRequest<Record<string, unknown>>("/loading-operations/exceptions", {
    method: "POST",
    body: {
      vehicle_id: input.vehicleId,
      appointment_id: input.appointmentId,
      queue_entry_id: input.queueEntryId,
      dock_id: input.dockId,
      exception_type: input.exceptionType,
      description: input.description,
      created_by: DOCK_CREATED_BY,
    },
  });
}

export type CreateDockInput = {
  dockName: string;
  dockType: string;
  zone: string;
};

export async function createDock(input: CreateDockInput) {
  return ymsRequest<Record<string, unknown>>("/docks", {
    method: "POST",
    body: {
      dock_name: input.dockName.trim(),
      dock_type: input.dockType,
      zone: input.zone,
      supported_vehicle_types: [...DOCK_VEHICLE_TYPE_DEFAULTS],
      supported_cargo_types: [...DOCK_CARGO_TYPE_DEFAULTS],
      max_capacity: 1,
      status: "AVAILABLE",
      estimated_service_time_min: 90,
      created_by: DOCK_CREATED_BY,
    },
  });
}

export type LaborOption = {
  id: string;
  teamCode: string;
  teamName: string;
  status: string;
  assignedDockId?: string | null;
};

export type EquipmentOption = {
  id: string;
  equipmentCode: string;
  equipmentName: string;
  status: string;
  assignedDockId?: string | null;
};

function mapLaborOption(row: Record<string, unknown>): LaborOption {
  return {
    id: String(row.id),
    teamCode: String(row.team_code || row.teamCode || "—"),
    teamName: String(row.team_name || row.teamName || "Team"),
    status: String(row.status || ""),
    assignedDockId: row.assigned_dock_id ? String(row.assigned_dock_id) : null,
  };
}

function mapEquipmentOption(row: Record<string, unknown>): EquipmentOption {
  return {
    id: String(row.id),
    equipmentCode: String(row.equipment_code || row.equipmentCode || "—"),
    equipmentName: String(row.equipment_name || row.equipmentName || "Equipment"),
    status: String(row.status || ""),
    assignedDockId: row.assigned_dock_id ? String(row.assigned_dock_id) : null,
  };
}

export async function fetchAssignableLabor(dockId?: string | null) {
  const payload = await ymsRequest<unknown>("/labor?limit=200");
  return parseYmsList(payload)
    .map(mapLaborOption)
    .filter((row) => {
      if (dockId && row.assignedDockId === dockId) return true;
      return ["ON_DUTY", "AVAILABLE"].includes(row.status.toUpperCase()) && !row.assignedDockId;
    });
}

export async function fetchAssignableEquipment(dockId?: string | null) {
  const payload = await ymsRequest<unknown>("/equipment?limit=200");
  return parseYmsList(payload)
    .map(mapEquipmentOption)
    .filter((row) => {
      if (dockId && row.assignedDockId === dockId) return true;
      return row.status.toUpperCase() === "IDLE" && !row.assignedDockId;
    });
}

export async function fetchCallableQueueOptions(options?: { includeQueue?: boolean }) {
  if (options?.includeQueue === false) return [];

  const [queuePayload, vehiclesPayload] = await Promise.all([
    ymsRequest<unknown>("/queue-entries?limit=500"),
    ymsRequest<unknown>("/vehicles?limit=500"),
  ]);
  return buildCallableQueueEntries(parseYmsList(queuePayload), parseYmsList(vehiclesPayload));
}

export type AssignVehicleResult = {
  queueEntryId: string;
  vehicleId?: string;
  queueNumber?: string;
  status?: string;
};

export async function resolveActiveQueueEntryId(dockId: string, vehicleId?: string | null) {
  const payload = await ymsRequest<unknown>(`/queue-entries?limit=500`);
  const entries = parseYmsList(payload);
  const dockMatch = entries.find(
    (entry) => String(entry.dock_id || "") === dockId && isActiveDockQueueEntry(entry),
  );
  if (dockMatch?.id) return String(dockMatch.id);
  if (!vehicleId) return null;
  const vehicleMatch = entries.find(
    (entry) =>
      String(entry.vehicle_id || "") === vehicleId &&
      String(entry.dock_id || "") === dockId &&
      isActiveDockQueueEntry(entry),
  );
  return vehicleMatch?.id ? String(vehicleMatch.id) : null;
}

function mapAssignVehicleResult(
  queueEntryId: string,
  payload: Record<string, unknown>,
): AssignVehicleResult {
  return {
    queueEntryId: String(payload.id || queueEntryId),
    vehicleId: payload.vehicle_id ? String(payload.vehicle_id) : undefined,
    queueNumber: payload.queue_number ? String(payload.queue_number) : undefined,
    status: payload.status ? String(payload.status) : undefined,
  };
}

export async function assignVehicleToDock(dockId: string, queueEntryId: string): Promise<AssignVehicleResult> {
  try {
    const queue = await ymsRequest<Record<string, unknown>>(`/queue-entries/${queueEntryId}`);
    const status = String(queue.status || "").toUpperCase();
    if (["WAITING", "CHECKED_IN"].includes(status)) {
      await ymsRequest<Record<string, unknown>>(`/flow/queue-entries/${queueEntryId}/call`, {
        method: "POST",
        body: {},
      });
    }
  } catch {
    // Queue detail may be unavailable for some roles — assign-dock flow still accepts the entry id.
  }
  const result = await ymsRequest<Record<string, unknown>>(`/flow/queue-entries/${queueEntryId}/assign-dock`, {
    method: "POST",
    body: { dock_id: dockId },
  });
  return mapAssignVehicleResult(queueEntryId, result);
}

export async function fetchResourceReadiness(vehicleId: string) {
  return ymsRequest<{
    ready?: boolean;
    missing?: string[];
    dockAssigned?: boolean;
    laborAssigned?: boolean;
    equipmentAssigned?: boolean;
    equipmentOptional?: boolean;
    equipmentRecommended?: boolean;
  }>(`/flow/readiness/vehicle/${vehicleId}`);
}

export async function releaseDock(
  dockId: string,
  row: Pick<DockBoardRow, "vehicleId" | "code" | "grossWeightKg">,
) {
  if (!row.grossWeightKg) {
    throw new Error("Record gross weight before releasing the dock");
  }
  if (row.vehicleId) {
    return ymsRequest<Record<string, unknown>>(`/flow/vehicles/${row.vehicleId}/transition`, {
      method: "POST",
      body: {
        status: "COMPLETED",
        event_note: `Dock ${row.code} released from mobile dock board`,
        created_by: DOCK_CREATED_BY,
      },
    });
  }
  await releaseDockResources(dockId);
  return updateDockStatus(dockId, "AVAILABLE", "Released from mobile dock board");
}

export async function assignLaborToDock(dockId: string, laborId: string, workersAssigned = 1) {
  return ymsRequest<Record<string, unknown>>(`/docks/${dockId}/assign-labor`, {
    method: "POST",
    body: {
      labor_id: laborId,
      workers_assigned: workersAssigned,
      event_note: "Labor assigned from mobile dock board",
      created_by: DOCK_CREATED_BY,
    },
  });
}

export async function assignEquipmentToDock(dockId: string, equipmentId: string) {
  return ymsRequest<Record<string, unknown>>(`/docks/${dockId}/assign-equipment`, {
    method: "POST",
    body: {
      equipment_id: equipmentId,
      set_in_use: false,
      event_note: "Equipment assigned from mobile dock board",
      created_by: DOCK_CREATED_BY,
    },
  });
}

export async function releaseDockResources(dockId: string) {
  return ymsRequest<Record<string, unknown>>(`/docks/${dockId}/release-resources`, {
    method: "POST",
  });
}

export async function releaseLaborFromDock(laborId: string) {
  return ymsRequest<Record<string, unknown>>(`/labor/${laborId}/release`, {
    method: "POST",
    body: {},
  });
}

export async function releaseEquipmentFromDock(equipmentId: string) {
  return ymsRequest<Record<string, unknown>>(`/equipment/${equipmentId}/release`, {
    method: "POST",
    body: {},
  });
}

export async function unassignVehicleFromDock(queueEntryId: string) {
  return ymsRequest<Record<string, unknown>>(`/flow/queue-entries/${queueEntryId}/unassign-dock`, {
    method: "POST",
    body: {},
  });
}

export async function updateDockStatus(dockId: string, status: string, notes?: string) {
  return ymsRequest<Record<string, unknown>>(`/docks/${dockId}`, {
    method: "PATCH",
    body: {
      status,
      notes: notes?.trim() || undefined,
      event_note: notes?.trim() ? `Status → ${status}: ${notes.trim()}` : `Status → ${status}`,
      created_by: DOCK_CREATED_BY,
    },
  });
}

export async function pauseLoadingAtDock(input: {
  vehicleId?: string | null;
  appointmentId?: string | null;
  dockId?: string | null;
  queueEntryId?: string | null;
  reasonCode: string;
  note?: string;
}) {
  return ymsRequest<Record<string, unknown>>("/loading-operations/pause", {
    method: "POST",
    body: {
      vehicle_id: input.vehicleId,
      appointment_id: input.appointmentId,
      dock_id: input.dockId,
      queue_entry_id: input.queueEntryId,
      reason_code: input.reasonCode,
      note: input.note,
      created_by: DOCK_CREATED_BY,
    },
  });
}

export async function resumeLoadingAtDock(input: {
  vehicleId?: string | null;
  appointmentId?: string | null;
  dockId?: string | null;
  queueEntryId?: string | null;
}) {
  return ymsRequest<Record<string, unknown>>("/loading-operations/resume", {
    method: "POST",
    body: {
      vehicle_id: input.vehicleId,
      appointment_id: input.appointmentId,
      dock_id: input.dockId,
      queue_entry_id: input.queueEntryId,
      created_by: DOCK_CREATED_BY,
    },
  });
}

export type LoadingCompleteState = {
  awaitingRelease: boolean;
  loadingCompleted: boolean;
  completedAt?: string | null;
};

async function fetchYardEventsForLoadingState() {
  const payload = await ymsRequest<unknown>("/yard-events?limit=500");
  return parseYmsList(payload) as Record<string, unknown>[];
}

export async function fetchLoadingCompleteState(input: {
  vehicleId?: string | null;
  queueEntryId?: string | null;
}): Promise<LoadingCompleteState> {
  try {
    const params = new URLSearchParams();
    if (input.vehicleId) params.set("vehicle_id", input.vehicleId);
    if (input.queueEntryId) params.set("queue_entry_id", input.queueEntryId);
    const suffix = params.toString() ? `?${params.toString()}` : "";
    const payload = await ymsRequest<Record<string, unknown>>(`/loading-operations/complete-state${suffix}`);
    return {
      awaitingRelease: Boolean(payload.awaiting_release),
      loadingCompleted: Boolean(payload.loading_completed),
      completedAt: payload.completed_at ? String(payload.completed_at) : null,
    };
  } catch (err) {
    if (!(err instanceof YmsApiError) || err.status !== 404) throw err;
    const events = await fetchYardEventsForLoadingState();
    return computeLoadingCompleteState(events, input.vehicleId, input.queueEntryId);
  }
}

export type LoadingPauseState = {
  paused: boolean;
  pausedSince?: string | null;
  pauseReason?: string | null;
  pausedDurationMin?: number;
  totalPausedMin?: number;
};

export async function fetchLoadingPauseState(input: {
  vehicleId?: string | null;
  queueEntryId?: string | null;
}): Promise<LoadingPauseState> {
  const params = new URLSearchParams();
  if (input.vehicleId) params.set("vehicle_id", input.vehicleId);
  if (input.queueEntryId) params.set("queue_entry_id", input.queueEntryId);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const payload = await ymsRequest<Record<string, unknown>>(`/loading-operations/pause-state${suffix}`);
  return {
    paused: Boolean(payload.paused),
    pausedSince: payload.paused_since ? String(payload.paused_since) : null,
    pauseReason: payload.pause_reason ? String(payload.pause_reason) : null,
    pausedDurationMin: Number(payload.paused_duration_min ?? 0),
    totalPausedMin: Number(payload.total_paused_min ?? 0),
  };
}
