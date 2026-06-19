/**
 * Control Tower dashboard data layer.
 * Fetches YMS entities and derives operational KPIs/widgets.
 *
 * Assumptions documented in ASSUMPTIONS export below.
 */

import { isVehicleInYard } from "../constants/lifecycleStatuses";
import { YARD_CAPACITY, YARD_ZONE_DEFS } from "../constants/yardConstants";
import ymsApi, { DASHBOARD_EVENTS_LIMIT, DASHBOARD_LIST_LIMIT } from "./ymsApi";
import yardZonesApi, { MAP_ZONE_COLORS } from "./yardZonesApi";

export { YARD_CAPACITY };

/** Litres per vehicle-hour assumed idle in queue (placeholder until telematics exists). */
export const FUEL_LITRES_PER_WAITING_VEHICLE = 6;

/** Customer satisfaction fallback when no CSAT telemetry exists. */
export const CUSTOMER_SAT_FALLBACK = 94;

/** Target completion rate used for CSAT proxy. */
export const SHIPMENT_TARGET_PCT = 90;

const OWNERSHIP_COLORS = {
  company: "#0F172A",
  contract: "#2563EB",
  outside: "#D97706",
};

const GATE_IN_EVENT_TYPES = new Set([
  "VEHICLE_CHECKED_IN",
  "QUEUE_ENTRY_CREATED",
  "APPOINTMENT_CREATED",
  "VEHICLE_CREATED",
]);

const ZONE_DEFS = [
  { code: "A", name: "Loading", color: "#16A34A" },
  { code: "B", name: "Unloading", color: "#2563EB" },
  { code: "C", name: "Documentation", color: "#64748B" },
  { code: "D", name: "Hazardous", color: "#DC2626" },
  { code: "E", name: "Cold Chain", color: "#0EA5E9" },
  { code: "F", name: "Emergency Holding", color: "#D97706" },
];

export const ASSUMPTIONS = {
  yardCapacity: `Yard occupancy uses fixed capacity ${YARD_CAPACITY} (no capacity API yet).`,
  fuelWasted: `Fuel wasted = waiting queue count × ${FUEL_LITRES_PER_WAITING_VEHICLE} L/hr (placeholder).`,
  customerSat: `Customer satisfaction uses shipment completion vs target ${SHIPMENT_TARGET_PCT}% when no CSAT feed exists.`,
  avgTat: "Average turnaround uses check-in to exit timing from yard events; partial when exit timestamps are missing.",
  yardZones: "Zone occupancy uses GET /yard/zones (same source as Yard Map).",
  detentionExposure: "Detention exposure is estimated from waiting minutes × category risk factor, not billed detention records.",
  recommendations: "Recommendations are rule-based heuristics, not ML/AI.",
};

export function formatINR(value) {
  const n = Number(value) || 0;
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getUTCFullYear() === now.getUTCFullYear() &&
    d.getUTCMonth() === now.getUTCMonth() &&
    d.getUTCDate() === now.getUTCDate()
  );
}

function minutesBetween(startIso, endIso = new Date().toISOString()) {
  if (!startIso) return 0;
  const start = new Date(startIso).getTime();
  const end = typeof endIso === "string" ? new Date(endIso).getTime() : endIso;
  const mins = Math.floor((end - start) / 60000);
  return Number.isFinite(mins) && mins >= 0 ? mins : 0;
}

function normalizeOwnership(type) {
  const t = (type || "").toLowerCase();
  if (t === "company") return "Company";
  if (t === "contract") return "Contract";
  return "Outside";
}

function mapOwnershipKey(type) {
  const t = (type || "").toLowerCase();
  if (t === "company") return "company";
  if (t === "contract") return "contract";
  return "outside";
}

function eventLevel(eventType) {
  const t = (eventType || "").toUpperCase();
  if (t.includes("CANCEL") || t.includes("DETENTION")) return "danger";
  if (t.includes("DELAY") || t.includes("WARNING")) return "warning";
  if (t.includes("EXIT") || t.includes("COMPLETE") || t.includes("SUCCESS")) return "success";
  return "info";
}

function formatEventMessage(event) {
  const type = event.event_type || "EVENT";
  const note = event.event_note ? ` — ${event.event_note}` : "";
  const labels = {
    VEHICLE_CREATED: "Vehicle registered",
    APPOINTMENT_CREATED: "Appointment booked",
    QUEUE_ENTRY_CREATED: "Entered virtual queue",
    VEHICLE_CHECKED_IN: "Gate check-in completed",
    VEHICLE_CALLED: "Vehicle called to dock",
    DOCK_ASSIGNED: "Dock assigned",
    VEHICLE_STATUS_CHANGED: "Status updated",
    TRIP_CANCELLED: "Trip cancelled",
  };
  return `${labels[type] || type.replace(/_/g, " ")}${note}`;
}

/** Build A–F map zone occupancy from yard zone master (aligned with Yard Map). */
export function buildYardZonesFromApi(yardZoneRows = []) {
  const mapZones = yardZoneRows
    .filter((z) => z.mapCode && ["A", "B", "C", "D", "E", "F"].includes(z.mapCode))
    .sort((a, b) => a.mapCode.localeCompare(b.mapCode));

  if (mapZones.length > 0) {
    return mapZones.map((z) => ({
      code: z.mapCode,
      name: z.name,
      color: z.color || MAP_ZONE_COLORS[z.mapCode] || "#64748B",
      occupied: z.currentOccupancy ?? z.occupied ?? 0,
      capacity: z.maxCapacity ?? z.capacity ?? 0,
    }));
  }

  return YARD_ZONE_DEFS.map((def) => {
    const zone = yardZoneRows.find((z) => z.mapCode === def.code);
    return {
      code: def.code,
      name: def.name,
      color: def.color,
      occupied: zone?.currentOccupancy ?? zone?.occupied ?? 0,
      capacity: zone?.maxCapacity ?? def.capacity,
    };
  });
}

export function totalYardOccupancyFromZones(yardZoneRows = []) {
  return yardZoneRows.reduce((sum, z) => sum + (z.currentOccupancy ?? z.occupied ?? 0), 0);
}

function buildThroughput24h(events) {
  const now = Date.now();
  const buckets = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date(now - (23 - i) * 3600000);
    return {
      h: `${hour.getHours().toString().padStart(2, "0")}`,
      in: 0,
      out: 0,
      ts: hour.getTime(),
    };
  });

  for (const e of events) {
    const t = new Date(e.event_time).getTime();
    if (t < now - 24 * 3600000) continue;
    const hourIdx = Math.floor((now - t) / 3600000);
    const idx = 23 - hourIdx;
    if (idx < 0 || idx > 23) continue;

    const note = (e.event_note || "").toUpperCase();
    const isOut =
      e.event_type === "VEHICLE_STATUS_CHANGED" &&
      (note.includes("EXITED") || note.includes("COMPLETED"));
    const isIn = GATE_IN_EVENT_TYPES.has(e.event_type) && !isOut;

    if (isIn) buckets[idx].in += 1;
    if (isOut) buckets[idx].out += 1;
  }

  return buckets;
}

function buildVehicleMix(vehicles) {
  const inYard = vehicles.filter((v) => isVehicleInYard(v));
  const counts = { company: 0, contract: 0, outside: 0 };
  for (const v of inYard) {
    const key = mapOwnershipKey(v.ownership_type);
    counts[key] += 1;
  }
  return [
    { name: "Company", value: counts.company, fill: OWNERSHIP_COLORS.company },
    { name: "Contract", value: counts.contract, fill: OWNERSHIP_COLORS.contract },
    { name: "Outside", value: counts.outside, fill: OWNERSHIP_COLORS.outside },
  ].filter((x) => x.value > 0);
}

function buildPriorityQueueWidget(queueEntries, vehicles, appointments) {
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
  const appointmentMap = new Map(appointments.map((a) => [a.id, a]));

  return queueEntries
    .filter((q) => !["COMPLETED", "EXITED", "CANCELLED"].includes(q.status))
    .map((entry) => {
      const vehicle = vehicleMap.get(entry.vehicle_id);
      const appointment = appointmentMap.get(entry.appointment_id);
      const waitingMin = minutesBetween(entry.checkin_time);
      const riskPerMin = 35;
      const multiplier = entry.status === "WAITING" ? 1 : entry.status === "CALLED" ? 0.6 : 0.4;
      return {
        id: entry.id,
        queueEntryId: entry.id,
        appointmentId: entry.appointment_id,
        vehicleId: entry.vehicle_id,
        dockId: entry.dock_id,
        plate: vehicle?.vehicle_number || "—",
        transporter: vehicle?.transporter_name || "—",
        category: normalizeOwnership(vehicle?.ownership_type),
        waitingMin,
        detentionCost: Math.round(waitingMin * riskPerMin * multiplier),
        priorityScore: entry.priority_score ?? 0,
        status: entry.status,
        queueNumber: entry.queue_number,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

function buildLiveEvents(events, vehicles) {
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
  return [...events]
    .sort((a, b) => new Date(b.event_time) - new Date(a.event_time))
    .slice(0, 40)
    .map((e) => {
      const vehicle = e.vehicle_id ? vehicleMap.get(e.vehicle_id) : null;
      return {
        id: e.id,
        ts: new Date(e.event_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        msg: formatEventMessage(e),
        level: eventLevel(e.event_type),
        plate: vehicle?.vehicle_number,
        status: vehicle?.status,
      };
    });
}

function buildDetentionByCategory(vehicles, queueEntries) {
  const categories = [
    { key: "company", label: "Company", fill: OWNERSHIP_COLORS.company },
    { key: "contract", label: "Contract", fill: OWNERSHIP_COLORS.contract },
    { key: "outside", label: "Outside", fill: OWNERSHIP_COLORS.outside },
  ];

  const totals = { company: 0, contract: 0, outside: 0 };
  const riskPerMin = 35;

  const addExposure = (vehicle, waitingMin) => {
    const key = mapOwnershipKey(vehicle?.ownership_type);
    totals[key] += Math.round((waitingMin || 0) * riskPerMin);
  };

  for (const q of queueEntries) {
    if (!["WAITING", "CHECKED_IN", "CALLED"].includes(q.status)) continue;
    const vehicle = vehicles.find((v) => v.id === q.vehicle_id);
    if (!vehicle) continue;
    addExposure(vehicle, minutesBetween(q.checkin_time));
  }

  for (const v of vehicles) {
    if (v.status !== "LOADING") continue;
    addExposure(v, minutesBetween(v.updated_at));
  }

  return categories.map((c) => ({
    name: c.label,
    value: totals[c.key],
    fill: c.fill,
  }));
}

function buildRuleBasedRecommendations(metrics) {
  const recs = [];
  if (metrics.waiting >= 15) {
    recs.push({
      id: "rec-queue-congestion",
      module: "Rule-Based Recommendation",
      title: "Reduce queue congestion",
      impact: `${metrics.waiting} vehicles waiting — consider calling and dock assignment`,
      savings: 0,
      confidence: 88,
      severity: "warning",
    });
  }
  if (metrics.dockUtilizationPct >= 85) {
    recs.push({
      id: "rec-dock-pressure",
      module: "Rule-Based Recommendation",
      title: "Open additional dock capacity",
      impact: `Dock utilization at ${metrics.dockUtilizationPct}%`,
      savings: 0,
      confidence: 85,
      severity: "warning",
    });
  }
  if (metrics.detentionExposure >= 120000) {
    recs.push({
      id: "rec-detention-risk",
      module: "Rule-Based Recommendation",
      title: "Prioritize outside vehicles",
      impact: "Detention exposure is rising in the yard",
      savings: 0,
      confidence: 82,
      severity: "danger",
    });
  }
  if (metrics.avgWaitingMin >= 45) {
    recs.push({
      id: "rec-avg-wait",
      module: "Rule-Based Recommendation",
      title: "Reduce average waiting time",
      impact: `Average wait is ${metrics.avgWaitingMin} min`,
      savings: 0,
      confidence: 80,
      severity: "info",
    });
  }
  if (metrics.inYard >= YARD_CAPACITY * 0.9) {
    recs.push({
      id: "rec-yard-capacity",
      module: "Rule-Based Recommendation",
      title: "Yard nearing capacity",
      impact: `Occupancy at ${metrics.yardOccupancyPct}%`,
      savings: 0,
      confidence: 90,
      severity: "warning",
    });
  }
  return recs.slice(0, 4);
}

function computeMetrics({ vehicles, appointments, queueEntries, docks, events, inYardCount }) {
  const inYardVehicles = vehicles.filter((v) => isVehicleInYard(v));
  const inYardTotal = inYardCount ?? inYardVehicles.length;
  const waitingVehicles = vehicles.filter((v) => v.status === "WAITING");
  const loadingCount = vehicles.filter((v) =>
    ["READY_FOR_LOADING", "LOADING"].includes(v.status)
  ).length;
  const exitedToday = vehicles.filter(
    (v) => v.status === "EXITED" && (isToday(v.exit_time) || isToday(v.updated_at))
  ).length;

  const yardOccupancyPct = Math.min(100, Math.round((inYardTotal / YARD_CAPACITY) * 100));

  const totalDocks = docks.length || 1;
  const occupiedDocks = docks.filter((d) => d.status === "OCCUPIED").length;
  const dockUtilizationPct = Math.round((occupiedDocks / totalDocks) * 100);

  const queueByVehicle = new Map(queueEntries.map((q) => [q.vehicle_id, q]));
  const waitingMinutes = waitingVehicles
    .map((v) => {
      const q = queueByVehicle.get(v.id);
      return minutesBetween(q?.checkin_time || v.updated_at);
    })
    .filter((m) => m > 0);
  const avgWaitingMin = waitingMinutes.length
    ? Math.round(waitingMinutes.reduce((s, m) => s + m, 0) / waitingMinutes.length)
    : 0;

  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const checkInByVehicle = new Map();
  for (const e of events) {
    if (e.vehicle_id && GATE_IN_EVENT_TYPES.has(e.event_type)) {
      const prev = checkInByVehicle.get(e.vehicle_id);
      if (!prev || new Date(e.event_time) < new Date(prev)) {
        checkInByVehicle.set(e.vehicle_id, e.event_time);
      }
    }
  }

  const tatSamples = [];
  for (const v of vehicles) {
    if (v.status !== "EXITED" || !isToday(v.updated_at)) continue;
    const checkIn = checkInByVehicle.get(v.id);
    const exitEvents = events
      .filter((e) => e.vehicle_id === v.id)
      .filter((e) => e.event_type === "VEHICLE_STATUS_CHANGED")
      .filter((e) => (e.event_note || "").toUpperCase().includes("EXITED"));
    const exitTime = exitEvents.length
      ? exitEvents.sort((a, b) => new Date(b.event_time) - new Date(a.event_time))[0].event_time
      : v.updated_at;
    if (checkIn) {
      const mins = minutesBetween(checkIn, exitTime);
      if (mins > 0) tatSamples.push(mins);
    }
  }
  const avgTurnaroundMin = tatSamples.length
    ? Math.round(tatSamples.reduce((s, m) => s + m, 0) / tatSamples.length)
    : 0;
  const tatPartial = exitedToday > 0 && tatSamples.length < exitedToday;

  let detentionExposure = 0;
  for (const q of queueEntries) {
    if (q.status !== "WAITING") continue;
    const vehicle = vehicleById.get(q.vehicle_id);
    const waitingMin = minutesBetween(q.checkin_time);
    detentionExposure += waitingMin * 35 * (vehicle?.ownership_type === "outside" ? 1.2 : vehicle?.ownership_type === "contract" ? 0.8 : 0.5);
  }
  for (const v of vehicles) {
    if (v.status === "LOADING") {
      detentionExposure += minutesBetween(v.updated_at) * 35;
    }
  }

  const fuelWasted = waitingVehicles.length * FUEL_LITRES_PER_WAITING_VEHICLE;

  const relevantAppointments = appointments.filter((a) => !["CANCELLED"].includes(a.status));
  const completedOrExited = relevantAppointments.filter((a) =>
    ["COMPLETED", "EXITED"].includes(a.status)
  ).length;
  const shipmentCompletionPct =
    relevantAppointments.length > 0
      ? Math.round((completedOrExited / relevantAppointments.length) * 100)
      : 0;

  const customerSatPct = Math.min(
    100,
    Math.max(60, Math.round(CUSTOMER_SAT_FALLBACK + (shipmentCompletionPct - SHIPMENT_TARGET_PCT) * 0.4))
  );

  return {
    inYard: inYardTotal,
    waiting: waitingVehicles.length,
    exitHolding: vehicles.filter((v) => ["EXIT_HOLDING", "EXIT_VERIFIED"].includes(v.status)).length,
    loading: loadingCount,
    exitedToday,
    yardOccupancyPct,
    dockUtilizationPct,
    avgWaitingMin,
    avgTurnaroundMin,
    tatPartial,
    detentionExposure,
    detentionToday: detentionExposure,
    fuelWasted,
    shipmentCompletionPct,
    customerSatPct,
    dockAvailable: docks.filter((d) => d.status === "AVAILABLE").length,
    dockOccupied: occupiedDocks,
    dockDelayed: docks.filter((d) => d.status === "DELAYED").length,
    dockMaintenance: docks.filter((d) => d.status === "MAINTENANCE").length,
  };
}

export async function fetchControlTowerDashboard({
  includeAppointments = false,
  includeQueue = false,
  includeDocks = false,
  includeYardZones = false,
} = {}) {
  const listLimit = { limit: DASHBOARD_LIST_LIMIT };
  const appointmentsPromise = includeAppointments
    ? ymsApi.listAppointments(listLimit)
    : Promise.resolve([]);
  const queuePromise = includeQueue
    ? ymsApi.listQueueEntries(listLimit)
    : Promise.resolve([]);
  const docksPromise = includeDocks
    ? ymsApi.listDocks()
    : Promise.resolve([]);
  const yardZonesPromise = includeYardZones
    ? yardZonesApi.fetchYardZonesBundle().then((b) => b.zones)
    : Promise.resolve([]);

  const [vehicles, appointments, queueEntries, docks, events, yardZoneRows] = await Promise.all([
    ymsApi.listVehicles(listLimit),
    appointmentsPromise,
    queuePromise,
    docksPromise,
    ymsApi.listYardEvents({ limit: DASHBOARD_EVENTS_LIMIT }),
    yardZonesPromise,
  ]);

  const yardZones = buildYardZonesFromApi(yardZoneRows);
  const inYardCount = totalYardOccupancyFromZones(yardZoneRows);
  const metrics = computeMetrics({
    vehicles,
    appointments,
    queueEntries,
    docks,
    events,
    inYardCount,
  });

  return {
    metrics,
    throughput24h: buildThroughput24h(events),
    vehicleMix: buildVehicleMix(vehicles),
    priorityQueue: buildPriorityQueueWidget(queueEntries, vehicles, appointments),
    liveEvents: buildLiveEvents(events, vehicles),
    yardZones,
    detentionByCategory: buildDetentionByCategory(vehicles, queueEntries),
    docks,
    recommendations: buildRuleBasedRecommendations(metrics),
    raw: { vehicles, appointments, queueEntries, docks, events },
  };
}

export function filterDashboardBySearch(data, search) {
  if (!search?.trim()) return data;
  const q = search.trim().toLowerCase();

  const { vehicles, queueEntries, docks, events, priorityQueue } = data;

  const filteredVehicles = vehicles.filter((v) =>
    [v.vehicle_number, v.transporter_name, v.status, v.ownership_type].some((f) => String(f || "").toLowerCase().includes(q))
  );
  const filteredQueue = queueEntries.filter((entry) => {
    const vehicle = vehicles.find((v) => v.id === entry.vehicle_id);
    return [entry.queue_number, entry.status, vehicle?.vehicle_number, vehicle?.transporter_name].some((f) =>
      String(f || "").toLowerCase().includes(q)
    );
  });
  const filteredDocks = docks.filter((d) =>
    [d.dock_code, d.dock_name, d.dock_type, d.status].some((f) => String(f || "").toLowerCase().includes(q))
  );
  const filteredEvents = events.filter((e) => {
    const vehicle = vehicles.find((v) => v.id === e.vehicle_id);
    return [e.event_type, e.event_note, vehicle?.vehicle_number, vehicle?.status].some((f) =>
      String(f || "").toLowerCase().includes(q)
    );
  });

  const vehicleIds = new Set([
    ...filteredVehicles.map((v) => v.id),
    ...filteredQueue.map((q) => q.vehicle_id),
    ...filteredEvents.map((e) => e.vehicle_id).filter(Boolean),
  ]);

  const priorityFiltered = priorityQueue.filter((row) => vehicleIds.has(row.vehicleId));

  return {
    ...data,
    vehicles: filteredVehicles,
    queueEntries: filteredQueue,
    docks: filteredDocks,
    events: filteredEvents,
    priorityQueue: priorityFiltered,
  };
}

export default {
  fetchControlTowerDashboard,
  filterDashboardBySearch,
  formatINR,
  YARD_CAPACITY,
  ASSUMPTIONS,
};
