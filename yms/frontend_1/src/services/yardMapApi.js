/**
 * Yard Map — operational yard control visualization.
 *
 * Vehicle positions and zone occupancy come exclusively from the backend:
 * vehicles.current_zone_id and yard_zones enrichment (currentOccupancy, etc.).
 */

import { IN_YARD_VEHICLE_STATUSES, lifecycleDisplayLabel } from "../constants/lifecycleStatuses";
import { YARD_CAPACITY, YARD_ZONE_DEFS } from "../constants/yardConstants";
import ymsApi from "./ymsApi";
import yardZonesApi, { MAP_ZONE_COLORS } from "./yardZonesApi";
import { estimateProgress, fetchDocksBundle, isDockDelayed, EMPTY_DOCK_BUNDLE } from "./docksApi";
import { parseRequestType } from "./appointmentsApi";
import { formatDockLabel } from "../utils/display";
import { matchesAnyValues, safeIncludes, safeLower } from "../utils/search";

export { YARD_CAPACITY, YARD_ZONE_DEFS };

export const ASSUMPTIONS = {
  zones: "Zone master and occupancy from GET /api/yard/zones (DB: yard_zones + vehicles.current_zone_id).",
  positions: "Vehicle dots use deterministic grid slots within each zone (visual layout only).",
  capacity: `Per-zone capacity from zone master; total yard reference capacity is ${YARD_CAPACITY}.`,
};

/** Operational zones shown in live counter strip (occupancy from GET /api/yard/zones). */
export const LIVE_ZONE_COUNTER_SPECS = [
  { zoneType: "GATE_IN", label: "Gate In" },
  { zoneType: "WAITING_AREA", label: "Waiting" },
  { zoneType: "STAGING", label: "Staging" },
  { zoneType: "LOADING", label: "Loading", mapCode: "A" },
  { zoneType: "EXIT_HOLDING", label: "Exit Holding" },
  { zoneType: "GATE_OUT", label: "Gate Out" },
];

/** Resolve a navigable zone (map or operational) by yard_zones id. */
export function findNavZoneById(model, zoneId) {
  if (!model || !zoneId) return null;
  const fromMap = (model.zones || []).find((z) => z.id === zoneId);
  if (fromMap) return fromMap;
  const fromOps = (model.operationalZones || []).find((z) => z.id === zoneId);
  if (fromOps) return fromOps;
  const raw = (model.yardZones || []).find((z) => z.id === zoneId);
  if (!raw) return null;
  return {
    id: raw.id,
    code: raw.mapCode || raw.zoneCode,
    mapCode: raw.mapCode,
    zoneCode: raw.zoneCode,
    name: raw.name,
    zoneType: raw.zoneType,
    capacity: raw.maxCapacity ?? raw.capacity ?? 0,
    occupied: raw.currentOccupancy ?? raw.occupied ?? 0,
    free: raw.availableSlots ?? 0,
    pct: raw.occupancyPct ?? 0,
    status: raw.status,
    color: raw.color,
    purpose: raw.description || raw.purpose,
    vehicles: [],
  };
}

export function getLiveZoneCounters(yardZones = []) {
  return LIVE_ZONE_COUNTER_SPECS.map((spec) => {
    const zone = yardZones.find((z) =>
      spec.mapCode ? z.mapCode === spec.mapCode : z.zoneType === spec.zoneType
    );
    const capacity = zone?.maxCapacity ?? zone?.capacity ?? 0;
    const occupied = zone?.currentOccupancy ?? zone?.occupied ?? 0;
    return {
      ...spec,
      id: zone?.id ?? null,
      occupied,
      capacity,
      pct: zone?.occupancyPct ?? (capacity ? Math.round((occupied / capacity) * 100) : 0),
    };
  });
}

export function formatZoneOperationLine(v) {
  const parts = [v.plate, lifecycleDisplayLabel(v.status) || v.status];
  const dockLabel = v.dockCode || (v.dock && v.dock !== "—" ? v.dock : null);
  if (dockLabel) parts.push(dockLabel);
  else if (v.appointmentRef) parts.push(v.appointmentRef);
  if (v.delayed) parts.push("Delayed");
  else if (v.etaMin != null && v.etaMin > 0) parts.push(`ETA ${v.etaMin}m`);
  return parts.join(" | ");
}

const IN_YARD_STATUSES = IN_YARD_VEHICLE_STATUSES;

function normalizeCategory(ownershipType) {
  const t = (ownershipType || "").toLowerCase();
  if (t === "company") return "Company";
  if (t === "contract") return "Contract";
  return "Outside";
}

function isUnload(queue, appointment) {
  const qt = (queue?.queue_type || "").toLowerCase();
  if (qt.includes("unload")) return true;
  return parseRequestType(appointment?.shipment_reference, appointment?.remarks) === "Unloading";
}

export function dotPosition(index, total) {
  const n = Math.max(1, Math.min(total, 24));
  const cols = Math.ceil(Math.sqrt(n));
  const r = Math.floor(index / cols);
  const c = index % cols;
  return {
    left: `${10 + (c * 80) / cols}%`,
    top: `${15 + (r * 70) / Math.max(cols, 1)}%`,
  };
}

export function mapVehicleForYard(vehicle, appointment, queue, dock, zoneMeta, dockRow = null) {
  const operation = queue
    ? parseRequestType(appointment?.shipment_reference, appointment?.remarks)
    : vehicle.status === "LOADING"
    ? "Loading"
    : vehicle.status === "UNLOADING"
    ? "Unloading"
    : "—";

  const materialParts = (appointment?.shipment_reference || "").split("|");
  const material = materialParts.length >= 2 ? materialParts[1] : appointment?.shipment_reference || "—";

  const dockEntity = dockRow?.dock || dock;
  const progress = estimateProgress(queue, vehicle);
  const delayed =
    dockRow?.status === "DELAYED" ||
    (dockEntity && isDockDelayed(dockEntity, queue, progress));
  const etaMin = dockRow?.etaCloseMin ?? progress.etaMin ?? 0;
  const dockCode = dockRow?.code || dock?.dock_code || null;

  return {
    vehicleId: vehicle.id,
    queueEntryId: queue?.id || null,
    appointmentId: appointment?.id || queue?.appointment_id || null,
    dockId: queue?.dock_id || dock?.id || null,
    currentZoneId: vehicle.current_zone_id || null,
    id: vehicle.id,
    plate: vehicle.vehicle_number,
    transporter: vehicle.transporter_name,
    category: normalizeCategory(vehicle.ownership_type),
    status: vehicle.status,
    zone: zoneMeta?.code || zoneMeta?.mapCode || zoneMeta?.zoneCode,
    zoneId: zoneMeta?.id || null,
    zoneName: zoneMeta?.name,
    dock: formatDockLabel(dock),
    dockCode,
    appointmentRef: appointment?.booking_reference || null,
    operation,
    material,
    unload: isUnload(queue, appointment),
    etaMin,
    delayed,
    operationLine: null,
    searchBlob: safeLower(
      [
        vehicle.vehicle_number,
        vehicle.transporter_name,
        vehicle.status,
        zoneMeta?.code,
        zoneMeta?.name,
        dock?.dock_code,
        appointment?.booking_reference,
        material,
      ]
        .filter(Boolean)
        .join(" ")
    ),
  };
}

function finalizeYardVehicle(row) {
  return { ...row, operationLine: formatZoneOperationLine(row) };
}

function buildZoneLookup(yardZones) {
  const byId = new Map();
  const byMapCode = new Map();
  for (const z of yardZones || []) {
    byId.set(z.id, z);
    if (z.mapCode) byMapCode.set(z.mapCode, z);
  }
  return { byId, byMapCode };
}

function resolveVehicleZoneMeta(vehicle, lookup) {
  if (!vehicle?.current_zone_id || !lookup.byId.has(vehicle.current_zone_id)) {
    return null;
  }
  const z = lookup.byId.get(vehicle.current_zone_id);
  return {
    id: z.id,
    code: z.mapCode || z.zoneCode,
    mapCode: z.mapCode,
    zoneCode: z.zoneCode,
    name: z.name,
    color: z.color,
    zoneType: z.zoneType,
  };
}

function mapZoneTile(def) {
  const capacity = def.capacity ?? def.maxCapacity ?? 1;
  const occupied = def.currentOccupancy ?? def.occupied ?? 0;
  const free = def.availableSlots ?? Math.max(0, capacity - occupied);
  const pct = def.occupancyPct ?? (capacity ? Math.min(100, Math.round((occupied / capacity) * 100)) : 0);
  return {
    id: def.id,
    code: def.mapCode || def.code,
    mapCode: def.mapCode || def.code,
    zoneCode: def.zoneCode,
    name: def.name,
    zoneType: def.zoneType,
    capacity,
    color: def.color,
    purpose: def.purpose || def.description,
    occupied,
    free,
    pct,
    status: def.status,
    dbStatus: def.status,
    vehicles: [],
    isMandatory: def.isMandatory,
  };
}

export function buildYardMapModel({
  vehicles,
  appointments,
  queueEntries,
  events,
  dockRows,
  yardZones,
  dashboard,
}) {
  const appointmentByVehicle = new Map(appointments.map((a) => [a.vehicle_id, a]));
  const queueByVehicle = new Map(queueEntries.map((q) => [q.vehicle_id, q]));
  const dockRowById = new Map((dockRows || []).map((d) => [d.id, d]));
  const lookup = buildZoneLookup(yardZones);

  const inYard = vehicles.filter(
    (v) => IN_YARD_STATUSES.has(v.status) && v.current_zone_id
  );

  const vehiclesByZoneId = new Map();
  for (const z of yardZones || []) {
    vehiclesByZoneId.set(z.id, []);
  }

  for (const vehicle of inYard) {
    const appointment = appointmentByVehicle.get(vehicle.id);
    const queue = queueByVehicle.get(vehicle.id);
    const dockRow = queue?.dock_id ? dockRowById.get(queue.dock_id) : null;
    const dock = dockRow?.dock || dockRow || null;
    const zoneMeta = resolveVehicleZoneMeta(vehicle, lookup);
    if (!zoneMeta?.id) continue;
    const mapped = finalizeYardVehicle(
      mapVehicleForYard(vehicle, appointment, queue, dock, zoneMeta, dockRow)
    );
    if (!vehiclesByZoneId.has(zoneMeta.id)) {
      vehiclesByZoneId.set(zoneMeta.id, []);
    }
    vehiclesByZoneId.get(zoneMeta.id).push(mapped);
  }

  for (const list of vehiclesByZoneId.values()) {
    list.sort((a, b) => a.plate.localeCompare(b.plate));
  }

  const mapZoneRows = (yardZones || [])
    .filter((z) => z.mapCode && ["A", "B", "C", "D", "E", "F"].includes(z.mapCode))
    .sort((a, b) => a.mapCode.localeCompare(b.mapCode));

  const zones = (
    mapZoneRows.length > 0
      ? mapZoneRows.map((def) => mapZoneTile(def))
      : YARD_ZONE_DEFS.map((def) => ({
          ...mapZoneTile({ ...def, mapCode: def.code, status: "ACTIVE", currentOccupancy: 0, availableSlots: def.capacity, occupancyPct: 0 }),
          code: def.code,
        }))
  ).map((z) => {
    const zoneVehicles = (z.id && vehiclesByZoneId.get(z.id)) || [];
    const vehiclesWithDots = zoneVehicles.map((v, idx) => ({
      ...v,
      dot: dotPosition(idx, zoneVehicles.length),
    }));
    return { ...z, vehicles: vehiclesWithDots };
  });

  const operationalZones = (yardZones || [])
    .filter((z) => !z.mapCode)
    .map((z) => ({
      ...z,
      occupied: z.currentOccupancy ?? 0,
      free: z.availableSlots ?? Math.max(0, (z.capacity ?? z.maxCapacity ?? 0) - (z.currentOccupancy ?? 0)),
      pct: z.occupancyPct ?? 0,
      vehicles: vehiclesByZoneId.get(z.id) || [],
    }));

  const dockTiles = (dockRows || [])
    .slice()
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
    .map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      type: d.type,
      status: d.status,
      currentVehicle: d.currentVehicle,
      color:
        d.status === "AVAILABLE"
          ? "bg-emerald-500"
          : d.status === "OCCUPIED"
          ? "bg-red-500"
          : d.status === "DELAYED"
          ? "bg-amber-500"
          : d.status === "MAINTENANCE"
          ? "bg-slate-400"
          : "bg-slate-500",
    }));

  const recentEvents = (events || [])
    .slice()
    .sort((a, b) => new Date(b.event_time) - new Date(a.event_time))
    .slice(0, 50);

  const allVehicles = [
    ...zones.flatMap((z) => z.vehicles),
    ...operationalZones.flatMap((z) => z.vehicles || []),
  ];

  return {
    zones,
    operationalZones,
    dockTiles,
    allVehicles,
    recentEvents,
    totalInYard: inYard.length,
    dashboard: dashboard || null,
    yardZones: yardZones || [],
  };
}

export async function fetchYardMapBundle({
  includeAppointments = false,
  includeQueue = false,
  includeDocks = false,
} = {}) {
  const appointmentsPromise = includeAppointments
    ? ymsApi.listAppointments()
    : Promise.resolve([]);
  const queuePromise = includeQueue
    ? ymsApi.listQueueEntries()
    : Promise.resolve([]);
  const dockBundlePromise = includeDocks
    ? fetchDocksBundle({ includeAppointments, includeQueue })
    : Promise.resolve(EMPTY_DOCK_BUNDLE);

  const [vehicles, appointments, queueEntries, events, dockBundle, yardBundle] = await Promise.all([
    ymsApi.listVehicles(),
    appointmentsPromise,
    queuePromise,
    ymsApi.listYardEvents(),
    dockBundlePromise,
    yardZonesApi.fetchYardZonesBundle().catch(() => ({ zones: [], dashboard: null })),
  ]);

  const model = buildYardMapModel({
    vehicles,
    appointments,
    queueEntries,
    events,
    dockRows: dockBundle.rows,
    yardZones: yardBundle.zones,
    dashboard: yardBundle.dashboard,
  });

  return {
    ...model,
    vehicles,
    appointments,
    queueEntries,
    events,
    dockBundle,
  };
}

export function filterYardMapModel(model, search, zoneFilter) {
  const q = (search || "").trim().toLowerCase();
  let zones = model.zones;

  if (zoneFilter && zoneFilter !== "ALL") {
    if (zoneFilter === "occupied") {
      zones = zones.filter((z) => z.occupied > 0);
    } else if (zoneFilter === "free") {
      zones = zones.filter((z) => z.free > 0);
    } else if (["A", "B", "C", "D", "E", "F"].includes(zoneFilter)) {
      zones = zones.filter((z) => z.code === zoneFilter);
    } else {
      const nameMap = {
        loading: "A",
        unloading: "B",
        documentation: "C",
        hazardous: "D",
        "cold chain": "E",
        emergency: "F",
      };
      const code = nameMap[zoneFilter.toLowerCase()];
      if (code) zones = zones.filter((z) => z.code === code);
    }
  }

  if (!q) {
    return { ...model, zones, filteredVehicles: model.allVehicles };
  }

  const matchVehicle = (v) =>
    safeIncludes(v.searchBlob, q) ||
    matchesAnyValues([v.plate, v.transporter, v.status, v.zone, v.dock, v.appointmentRef], q);

  const filteredVehicles = model.allVehicles.filter(matchVehicle);

  zones = zones.map((z) => ({
    ...z,
    vehicles: z.vehicles.filter(matchVehicle),
    _highlight: safeIncludes(z.name, q) || safeLower(z.code) === q,
  }));

  const dockTiles = model.dockTiles.filter((d) =>
    matchesAnyValues([d.code, d.name, d.type, d.status, d.currentVehicle], q)
  );

  return { ...model, zones, dockTiles, filteredVehicles };
}

export function getZoneEvents(events, zoneCode, vehiclesInZone, limit = 8) {
  const vehicleIds = new Set(vehiclesInZone.map((v) => v.vehicleId));
  return events
    .filter(
      (e) =>
        vehicleIds.has(e.vehicle_id) ||
        (e.event_note || "").toLowerCase().includes(`zone ${zoneCode.toLowerCase()}`) ||
        [
          "VEHICLE_ENTERED_ZONE",
          "VEHICLE_EXITED_ZONE",
          "ZONE_TRANSFERRED",
          "ZONE_CAPACITY_EXCEEDED",
          "ZONE_RULE_VIOLATION",
        ].includes(e.event_type)
    )
    .sort((a, b) => new Date(b.event_time) - new Date(a.event_time))
    .slice(0, limit);
}

export default {
  fetchYardMapBundle,
  buildYardMapModel,
  filterYardMapModel,
  getLiveZoneCounters,
  findNavZoneById,
  formatZoneOperationLine,
  dotPosition,
  YARD_ZONE_DEFS,
  LIVE_ZONE_COUNTER_SPECS,
  ASSUMPTIONS,
};
