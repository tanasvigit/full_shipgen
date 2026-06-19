/**
 * Vehicles — operational monitor (read-only visibility over ymsApi).
 */

import ymsApi from "./ymsApi";
import yardZonesApi from "./yardZonesApi";
import { safeBundleFetch } from "../utils/safeBundleFetch";
import { notifyYmsDataChanged } from "./gateManagementApi";
import { mapOperationRow } from "./loadingOpsApi";
import loadingExceptionsApi from "./loadingExceptionsApi";

export const VEHICLE_TYPES = ["TRUCK", "TRAILER", "CONTAINER", "TANKER", "LCV", "TEMPO", "CUSTOM"];

export const VEHICLE_TYPE_LABELS = {
  TRUCK: "Truck",
  TRAILER: "Trailer",
  CONTAINER: "Container",
  TANKER: "Tanker",
  LCV: "LCV",
  TEMPO: "Tempo",
  CUSTOM: "Custom",
};

export const OPERATION_TYPES = ["Loading", "Unloading", "Transit", "Inter-Warehouse"];

export const MATERIAL_TYPES = [
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

export const OWNERSHIP_CATEGORIES = [
  { value: "company", label: "Company" },
  { value: "contract", label: "Contract" },
  { value: "outside", label: "Outside" },
];

import { lifecycleDisplayLabel } from "../constants/lifecycleStatuses";

/** Operational zone labels — aligned with yard map zone types (current_zone_id source of truth). */
export const ZONE_TYPE_LABELS = {
  GATE_IN: "Gate In",
  WAITING_AREA: "Waiting Area",
  STAGING: "Staging",
  LOADING: "Loading",
  UNLOADING: "Unloading",
  EXIT_HOLDING: "Exit Holding",
  GATE_OUT: "Gate Out",
  DOCUMENTATION: "Documentation",
  HAZMAT: "Hazmat",
  COLD_CHAIN: "Cold Chain",
  EMERGENCY_HOLDING: "Emergency Holding",
  CUSTOM: "Custom",
};

export const JOURNEY_STEPS = [
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "EN_ROUTE", label: "En Route" },
  { key: "APPROACHING", label: "Approaching" },
  { key: "ARRIVED", label: lifecycleDisplayLabel("ARRIVED") },
  { key: "CHECKED_IN", label: lifecycleDisplayLabel("CHECKED_IN") },
  { key: "WAITING", label: lifecycleDisplayLabel("WAITING") },
  { key: "CALLED", label: lifecycleDisplayLabel("CALLED") },
  { key: "DOCK_ASSIGNED", label: lifecycleDisplayLabel("DOCK_ASSIGNED") },
  { key: "RESOURCE_PENDING", label: lifecycleDisplayLabel("RESOURCE_PENDING") },
  { key: "READY_FOR_LOADING", label: lifecycleDisplayLabel("READY_FOR_LOADING") },
  { key: "LOADING", label: lifecycleDisplayLabel("LOADING") },
  { key: "COMPLETED", label: lifecycleDisplayLabel("COMPLETED") },
  { key: "EXIT_HOLDING", label: lifecycleDisplayLabel("EXIT_HOLDING") },
  { key: "EXIT_VERIFIED", label: lifecycleDisplayLabel("EXIT_VERIFIED") },
  { key: "EXITED", label: lifecycleDisplayLabel("EXITED") },
];

const STATUS_TO_STAGE_KEY = {
  SCHEDULED: "SCHEDULED",
  ARRIVED: "ARRIVED",
  CHECKED_IN: "CHECKED_IN",
  WAITING: "WAITING",
  CALLED: "CALLED",
  DOCK_ASSIGNED: "DOCK_ASSIGNED",
  RESOURCE_PENDING: "RESOURCE_PENDING",
  READY_FOR_LOADING: "READY_FOR_LOADING",
  LOADING: "LOADING",
  COMPLETED: "COMPLETED",
  EXIT_HOLDING: "EXIT_HOLDING",
  EXIT_VERIFIED: "EXIT_VERIFIED",
  EXITED: "EXITED",
  CANCELLED: "EXITED",
};

export function formatVehicleType(type) {
  if (!type) return "—";
  const code = String(type).toUpperCase();
  return VEHICLE_TYPE_LABELS[code] || type;
}

export function formatCategory(ownership) {
  if (!ownership) return "—";
  const map = { company: "Company", contract: "Contract", outside: "Outside" };
  return map[ownership] || ownership;
}

export function deriveStageKey(vehicle, appointment) {
  const status = vehicle?.status || "SCHEDULED";
  if (status !== "SCHEDULED") return STATUS_TO_STAGE_KEY[status] || status;

  const reporting = appointment?.reporting_time || vehicle?.expected_arrival;
  if (!reporting) return "SCHEDULED";
  const mins = (new Date(reporting).getTime() - Date.now()) / 60000;
  if (mins <= 30) return "APPROACHING";
  if (mins <= 120) return "EN_ROUTE";
  return "SCHEDULED";
}

export function deriveCurrentStageLabel(vehicle, appointment) {
  const key = deriveStageKey(vehicle, appointment);
  return JOURNEY_STEPS.find((s) => s.key === key)?.label || lifecycleDisplayLabel(key);
}

export function formatZoneOperationalLabel(zone) {
  if (!zone) return "—";
  const zoneType = zone.zoneType || zone.zone_type;
  if (zoneType && ZONE_TYPE_LABELS[zoneType]) return ZONE_TYPE_LABELS[zoneType];
  return zone.name || zone.zone_name || zone.zoneCode || zone.zone_code || "—";
}

function resolveZoneFromVehicle(vehicle, zonesById) {
  if (!vehicle?.current_zone_id) return { label: "—", zoneType: null, zoneId: null };
  const z = zonesById.get(vehicle.current_zone_id);
  if (!z) return { label: "—", zoneType: null, zoneId: vehicle.current_zone_id };
  return {
    label: formatZoneOperationalLabel(z),
    zoneType: z.zoneType || z.zone_type || null,
    zoneId: vehicle.current_zone_id,
  };
}

export function mapVehicleRow(vehicle, { appointment, queue, dock, zoneInfo } = {}) {
  const stageKey = deriveStageKey(vehicle, appointment);
  const zone = zoneInfo || { label: "—", zoneType: null, zoneId: null };
  return {
    id: vehicle.id,
    vehicleId: vehicle.id,
    reference: vehicle.vehicle_reference || "—",
    plate: vehicle.vehicle_number,
    displayName: vehicle.display_name || vehicle.vehicle_number,
    vehicleType: vehicle.vehicle_type,
    vehicleTypeLabel: formatVehicleType(vehicle.vehicle_type),
    category: formatCategory(vehicle.ownership_type),
    ownershipType: vehicle.ownership_type,
    transporter: vehicle.transporter_name,
    driver: vehicle.driver_name || "—",
    driverPhone: vehicle.driver_phone || "—",
    material: vehicle.material_type || appointment?.shipment_reference?.split("|")?.[1] || "—",
    operationType: vehicle.operation_type || "Loading",
    status: vehicle.status,
    currentStage: deriveCurrentStageLabel(vehicle, appointment),
    currentStageKey: stageKey,
    zone: zone.label,
    zoneType: zone.zoneType,
    zoneId: zone.zoneId,
    dockCode: dock?.dock_code || "—",
    dockId: dock?.id || queue?.dock_id || null,
    appointmentRef: appointment?.booking_reference || "—",
    queueNumber: queue?.queue_number || "—",
    lastActivity: vehicle.updated_at,
    lastUpdated: vehicle.updated_at,
    registrationSource: vehicle.registration_source || "manual",
    appointmentId: appointment?.id || null,
    queueEntryId: queue?.id || null,
    raw: vehicle,
  };
}

export async function fetchVehiclesBundle({
  includeAppointments = false,
  includeQueue = false,
  includeDocks = false,
  includeYardZones = false,
} = {}) {
  const [vehicles, appointments, zones, queueEntries, docks] = await Promise.all([
    ymsApi.listVehicles({ limit: 500 }),
    safeBundleFetch(
      includeAppointments,
      () => ymsApi.listAppointments({ limit: 500 }),
      []
    ),
    safeBundleFetch(
      includeYardZones,
      () => yardZonesApi.fetchYardZonesBundle().then((b) => b.zones || []),
      []
    ),
    safeBundleFetch(
      includeQueue,
      () => ymsApi.listQueueEntries({ limit: 500 }),
      []
    ),
    safeBundleFetch(includeDocks, () => ymsApi.listDocks(), []),
  ]);

  const apptByVehicle = new Map();
  for (const a of appointments) {
    if (!a.vehicle_id) continue;
    const prev = apptByVehicle.get(a.vehicle_id);
    if (!prev || new Date(a.created_at) > new Date(prev.created_at)) {
      apptByVehicle.set(a.vehicle_id, a);
    }
  }

  const queueByVehicle = new Map();
  for (const q of queueEntries) {
    if (!q.vehicle_id) continue;
    const prev = queueByVehicle.get(q.vehicle_id);
    if (!prev || new Date(q.created_at) > new Date(prev.created_at)) {
      queueByVehicle.set(q.vehicle_id, q);
    }
  }

  const zonesById = new Map((zones || []).map((z) => [z.id, z]));
  const dockById = new Map((docks || []).map((d) => [d.id, d]));

  const rows = vehicles.map((v) => {
    const appointment = apptByVehicle.get(v.id);
    const queue = queueByVehicle.get(v.id);
    const dock = queue?.dock_id ? dockById.get(queue.dock_id) : null;
    return mapVehicleRow(v, {
      appointment,
      queue,
      dock,
      zoneInfo: resolveZoneFromVehicle(v, zonesById),
    });
  });

  const counts = {
    total: rows.length,
    inYard: rows.filter((r) => r.status !== "EXITED" && r.status !== "CANCELLED").length,
    waiting: rows.filter((r) => r.status === "WAITING").length,
    loading: rows.filter((r) => ["READY_FOR_LOADING", "LOADING"].includes(r.status)).length,
    exitHolding: rows.filter((r) => ["EXIT_HOLDING", "EXIT_VERIFIED"].includes(r.status)).length,
  };

  return { rows, counts, vehicles, appointments, queueEntries, zones, docks };
}

export async function registerVehicle(form) {
  const plate = (form.vehicle_number || "").trim().toUpperCase();
  if (!plate || plate.length < 3) throw new Error("Vehicle number (plate) is required");

  const vehicle = await ymsApi.createVehicle({
    vehicle_number: plate,
    display_name: (form.display_name || plate).trim(),
    vehicle_type: (form.vehicle_type || "TRUCK").toUpperCase(),
    ownership_type: form.ownership_type || "outside",
    operation_type: form.operation_type || "Loading",
    material_type: (form.material_type || "GENERAL").toUpperCase(),
    transporter_name: (form.transporter_name || "").trim(),
    driver_name: (form.driver_name || "").trim() || null,
    driver_phone: (form.driver_phone || "").trim() || null,
    expected_arrival: form.expected_arrival ? new Date(form.expected_arrival).toISOString() : null,
    remarks: (form.remarks || "").trim() || null,
    registration_source: "manual",
    status: "SCHEDULED",
    created_by: "vehicles-ui",
  });

  notifyYmsDataChanged();
  return mapVehicleRow(vehicle);
}

export async function getVehicleJourney(vehicleId) {
  const journey = await ymsApi.getVehicleJourney(vehicleId);
  const v = journey.vehicle;
  const equipmentList = journey.equipment ? [journey.equipment] : [];
  const laborList = journey.labor ? [journey.labor] : [];
  let exceptionRows = [];
  try {
    exceptionRows = await loadingExceptionsApi.listLoadingExceptions({ vehicleId });
  } catch {
    exceptionRows = [];
  }
  const loadingOp =
    journey.queue_entry && journey.appointment
      ? mapOperationRow(
          journey.queue_entry,
          v,
          journey.appointment,
          journey.dock,
          journey.events || [],
          equipmentList,
          laborList,
          exceptionRows
        )
      : null;

  return {
    ...journey,
    loadingOp,
    stageKey: deriveStageKey(v, journey.appointment),
  };
}

export function buildTimelineTimes(events, statusKey) {
  const map = {};
  for (const e of events || []) {
    if (e.event_type === "APPOINTMENT_CREATED" || e.event_type === "VEHICLE_CREATED") map.SCHEDULED = e.event_time;
    if (e.event_type === "ENTRY_APPROVED") map.WAITING = map.WAITING || e.event_time;
    if (e.event_type === "VEHICLE_CHECKED_IN") map.CHECKED_IN = e.event_time;
    if (e.event_type === "QUEUE_ENTRY_CREATED") map.WAITING = e.event_time;
    if (e.event_type === "VEHICLE_CALLED" || e.event_type === "QUEUE_CALLED") map.CALLED = e.event_time;
    if (e.event_type === "EXIT_HOLDING") map.EXIT_HOLDING = e.event_time;
    if (e.event_type === "EXIT_VERIFIED") map.EXIT_VERIFIED = e.event_time;
    if (e.event_type === "DOCK_ASSIGNED") map.DOCK_ASSIGNED = e.event_time;
    if (e.event_type === "RESOURCE_GATE_BLOCKED" || e.event_type === "RESOURCE_READINESS_UPDATED") {
      map.RESOURCE_PENDING = map.RESOURCE_PENDING || e.event_time;
    }
    if (e.event_type === "LOADING_STARTED") map.LOADING = e.event_time;
    if (e.event_type === "LOADING_COMPLETED") map.COMPLETED = e.event_time;
    if (e.event_type === "VEHICLE_STATUS_CHANGED" && typeof e.event_note === "string") {
      const note = e.event_note;
      if (note.includes("ARRIVED")) map.ARRIVED = map.ARRIVED || e.event_time;
      if (note.includes("RESOURCE_PENDING")) map.RESOURCE_PENDING = e.event_time;
      if (note.includes("READY_FOR_LOADING")) map.READY_FOR_LOADING = e.event_time;
      else if (/\bLOADING\b/.test(note)) map.LOADING = map.LOADING || e.event_time;
      if (note.includes("COMPLETED")) map.COMPLETED = map.COMPLETED || e.event_time;
      if (note.includes("EXIT_HOLDING")) map.EXIT_HOLDING = e.event_time;
      if (note.includes("EXIT_VERIFIED")) map.EXIT_VERIFIED = e.event_time;
      if (note.includes("EXITED")) map.EXITED = e.event_time;
    }
  }
  if (statusKey === "READY_FOR_LOADING" && !map.READY_FOR_LOADING && events?.length) {
    map.READY_FOR_LOADING = events[events.length - 1]?.event_time;
  }
  return map;
}

export function resolveJourneyZoneLabel(journey) {
  if (!journey) return "—";
  const zoneName = journey.zone_name;
  const zoneCode = journey.zone_code;
  if (zoneName) {
    const match = Object.entries(ZONE_TYPE_LABELS).find(
      ([, label]) => label.toLowerCase() === String(zoneName).toLowerCase()
    );
    if (match) return match[1];
    return zoneName;
  }
  return zoneCode || "—";
}

export default {
  VEHICLE_TYPES,
  OPERATION_TYPES,
  MATERIAL_TYPES,
  ZONE_TYPE_LABELS,
  fetchVehiclesBundle,
  registerVehicle,
  getVehicleJourney,
  mapVehicleRow,
  deriveCurrentStageLabel,
  buildTimelineTimes,
  formatZoneOperationalLabel,
  resolveJourneyZoneLabel,
};
