/**
 * Executive KPI scorecard — live metrics from YMS + detention APIs.
 */

import ymsApi, { formatApiError, API_BASE } from "./ymsApi";
import { formatINR } from "./controlTowerApi";
import { matchesSearch } from "../utils/search";

export { formatINR };

export const YARD_CAPACITY = 72;
export const YARD_OCCUPANCY_TARGET_PCT = 75;
export const FUEL_LITRES_PER_WAITING_VEHICLE = 6;
export const CUSTOMER_SAT_FALLBACK = 94;
export const SHIPMENT_TARGET_PCT = 95;
/** Baseline for CSAT proxy formula (matches Control Tower). */
export const CSAT_FORMULA_BASELINE_PCT = 90;
export const DETENTION_TARGET_INR = 100000;

export const TARGETS = {
  avgWaitingMin: 30,
  avgTurnaroundMin: 90,
  dockUtilizationPct: 85,
  yardOccupancyPct: YARD_OCCUPANCY_TARGET_PCT,
  detentionToday: DETENTION_TARGET_INR,
  fuelWasted: 200,
  shipmentCompletionPct: 95,
  customerSatPct: 92,
};

const GATE_IN_EVENT_TYPES = new Set([
  "VEHICLE_CHECKED_IN",
  "QUEUE_ENTRY_CREATED",
  "APPOINTMENT_CREATED",
  "VEHICLE_CREATED",
]);

import { isVehicleInYard } from "../constants/lifecycleStatuses";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const ASSUMPTIONS = {
  yardCapacity: `Yard occupancy = in-yard vehicles / ${YARD_CAPACITY} (no capacity API).`,
  detentionToday: "Detention Today uses billed/derived `detention_records` summary.today from GET /detention.",
  fuelWasted: `Fuel wastage = WAITING queue count × ${FUEL_LITRES_PER_WAITING_VEHICLE} L (idle estimate).`,
  customerSat: `CSAT proxy: ${CUSTOMER_SAT_FALLBACK} + (shipment completion − ${CSAT_FORMULA_BASELINE_PCT}) × 0.4, clamped 60–100.`,
  shipmentCompletion:
    "Today's operational completion: share of non-cancelled appointments with created_at or updated_at today (UTC) that reached COMPLETED or EXITED.",
  fetchDegradation: "Failed API sources fall back to empty arrays; scorecard still renders. Errors listed in bundle.fetchErrors.",
  avgTat: "TAT = earliest gate-in yard_event → exit event (or vehicle updated_at) per exited vehicle.",
  trends7d: "7-day charts bucket by UTC calendar day from yard_events and vehicle exits.",
  yesterdayDelta: "Δ vs Yesterday compares today's metric definition to the same formula on the prior UTC day.",
};

function utcDateKey(isoOrDate) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function isOnUtcDate(iso, refDate) {
  if (!iso) return false;
  const key = utcDateKey(iso);
  const refKey = utcDateKey(refDate);
  return key && refKey && key === refKey;
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
}

function minutesBetween(startIso, endIso) {
  if (!startIso) return 0;
  const start = new Date(startIso).getTime();
  const end = typeof endIso === "string" ? new Date(endIso).getTime() : endIso;
  const mins = Math.floor((end - start) / 60000);
  return Number.isFinite(mins) && mins >= 0 ? mins : 0;
}

function mapOwnershipKey(type) {
  const t = (type || "").toLowerCase();
  if (t === "company") return "company";
  if (t === "contract") return "contract";
  return "outside";
}

function buildCheckInMap(events) {
  const checkInByVehicle = new Map();
  for (const e of events) {
    if (e.vehicle_id && GATE_IN_EVENT_TYPES.has(e.event_type)) {
      const prev = checkInByVehicle.get(e.vehicle_id);
      if (!prev || new Date(e.event_time) < new Date(prev)) {
        checkInByVehicle.set(e.vehicle_id, e.event_time);
      }
    }
  }
  return checkInByVehicle;
}

function getVehicleExitTime(vehicleId, events, fallbackIso) {
  const exitEvents = events
    .filter((e) => e.vehicle_id === vehicleId)
    .filter((e) => e.event_type === "VEHICLE_STATUS_CHANGED")
    .filter((e) => (e.event_note || "").toUpperCase().includes("EXITED"));
  if (exitEvents.length) {
    return exitEvents.sort((a, b) => new Date(b.event_time) - new Date(a.event_time))[0].event_time;
  }
  return fallbackIso;
}

function avgTatForExitsOnDay(day, vehicles, events, checkInByVehicle) {
  const samples = { company: [], contract: [], outside: [] };
  for (const v of vehicles) {
    if (v.status !== "EXITED") continue;
    if (!isOnUtcDate(v.updated_at, day)) continue;
    const checkIn = checkInByVehicle.get(v.id);
    if (!checkIn) continue;
    const exitTime = getVehicleExitTime(v.id, events, v.updated_at);
    const mins = minutesBetween(checkIn, exitTime);
    if (mins > 0) samples[mapOwnershipKey(v.ownership_type)].push(mins);
  }
  const avg = (arr) => (arr.length ? Math.round(arr.reduce((s, m) => s + m, 0) / arr.length) : 0);
  return {
    company: avg(samples.company),
    contract: avg(samples.contract),
    outside: avg(samples.outside),
    overall: avg([...samples.company, ...samples.contract, ...samples.outside]),
  };
}

function inYardCountAtDayEnd(day, vehicles, events, checkInByVehicle) {
  const dayEnd = endOfUtcDay(day).toISOString();
  let count = 0;
  for (const v of vehicles) {
    if (["CANCELLED"].includes(v.status)) continue;
    const checkIn = checkInByVehicle.get(v.id);
    if (!checkIn || new Date(checkIn) > endOfUtcDay(day)) continue;
    const exitTime = v.status === "EXITED" ? getVehicleExitTime(v.id, events, v.updated_at) : null;
    if (exitTime && new Date(exitTime) <= endOfUtcDay(day)) continue;
    if (isVehicleInYard(v) || (v.status === "EXITED" && isOnUtcDate(v.updated_at, day))) {
      count += 1;
    } else if (checkIn && isOnUtcDate(checkIn, day)) {
      count += 1;
    }
  }
  return count;
}

function dockUtilForDay(day, docks, events) {
  const total = docks.length || 1;
  const dayStart = startOfUtcDay(day).getTime();
  const dayEnd = endOfUtcDay(day).getTime();
  const state = new Map(docks.map((d) => [d.id, "AVAILABLE"]));

  const sorted = [...events].sort((a, b) => new Date(a.event_time) - new Date(b.event_time));
  for (const e of sorted) {
    const t = new Date(e.event_time).getTime();
    if (t < dayStart || t > dayEnd) continue;
    if (e.event_type === "DOCK_ASSIGNED" && e.dock_id) state.set(e.dock_id, "OCCUPIED");
    if (e.event_type === "LOADING_COMPLETED" && e.dock_id) state.set(e.dock_id, "AVAILABLE");
    if (e.event_type === "VEHICLE_STATUS_CHANGED" && (e.event_note || "").toUpperCase().includes("EXITED") && e.dock_id) {
      state.set(e.dock_id, "AVAILABLE");
    }
  }

  const occupied = [...state.values()].filter((s) => s === "OCCUPIED").length;
  return Math.round((occupied / total) * 100);
}

function avgWaitingForDay(day, queueEntries, events) {
  const dayEnd = endOfUtcDay(day).toISOString();
  const mins = [];
  for (const q of queueEntries) {
    if (!q.checkin_time) continue;
    if (!isOnUtcDate(q.checkin_time, day) && !isOnUtcDate(q.updated_at, day)) continue;
    const end =
      isOnUtcDate(q.updated_at, day) && ["COMPLETED", "EXITED", "CANCELLED"].includes(q.status)
        ? q.updated_at
        : dayEnd;
    const m = minutesBetween(q.checkin_time, end);
    if (m > 0) mins.push(m);
  }
  return mins.length ? Math.round(mins.reduce((s, m) => s + m, 0) / mins.length) : 0;
}

function detentionSumForDay(day, detentionRecords) {
  const key = utcDateKey(day);
  return detentionRecords
    .filter((r) => {
      const bd = r.billing_date;
      const dKey = typeof bd === "string" ? bd.slice(0, 10) : utcDateKey(bd);
      return dKey === key;
    })
    .reduce((s, r) => s + (Number(r.cost) || 0), 0);
}

/** Appointments touched on a UTC day (operational completion rate, not lifetime). */
export function shipmentCompletionForDay(day, appointments) {
  const relevant = appointments.filter(
    (a) =>
      !["CANCELLED"].includes(a.status) &&
      (isOnUtcDate(a.updated_at, day) || isOnUtcDate(a.created_at, day))
  );
  if (!relevant.length) return 0;
  const done = relevant.filter((a) => ["COMPLETED", "EXITED"].includes(a.status)).length;
  return Math.round((done / relevant.length) * 100);
}

function customerSatFromCompletion(completionPct) {
  return Math.min(
    100,
    Math.max(60, Math.round(CUSTOMER_SAT_FALLBACK + (completionPct - CSAT_FORMULA_BASELINE_PCT) * 0.4))
  );
}

function fuelForDay(day, queueEntries) {
  const waiting = queueEntries.filter((q) => {
    if (q.status !== "WAITING") return false;
    if (isOnUtcDate(q.checkin_time, day)) return true;
    return isOnUtcDate(q.updated_at, day);
  }).length;
  return waiting * FUEL_LITRES_PER_WAITING_VEHICLE;
}

function computeCurrentMetrics({ vehicles, appointments, queueEntries, docks, events, detentionRecords, detentionSummary }) {
  const checkInByVehicle = buildCheckInMap(events);
  const today = new Date();

  const inYard = vehicles.filter((v) => isVehicleInYard(v));
  const waitingVehicles = vehicles.filter((v) => v.status === "WAITING");
  const queueByVehicle = new Map(queueEntries.map((q) => [q.vehicle_id, q]));
  const totalDocks = docks.length || 1;
  const occupiedDocks = docks.filter((d) => d.status === "OCCUPIED").length;

  const waitingMinutes = waitingVehicles
    .map((v) => minutesBetween(queueByVehicle.get(v.id)?.checkin_time || v.updated_at))
    .filter((m) => m > 0);
  const avgWaitingMin = waitingMinutes.length
    ? Math.round(waitingMinutes.reduce((s, m) => s + m, 0) / waitingMinutes.length)
    : 0;

  const tatToday = avgTatForExitsOnDay(today, vehicles, events, checkInByVehicle);

  const exitedToday = vehicles.filter((v) => v.status === "EXITED" && isOnUtcDate(v.updated_at, today)).length;
  const shipmentCompletionPct = shipmentCompletionForDay(today, appointments);

  return {
    avgWaitingMin,
    avgTurnaroundMin: tatToday.overall,
    dockUtilizationPct: Math.round((occupiedDocks / totalDocks) * 100),
    yardOccupancyPct: Math.min(100, Math.round((inYard.length / YARD_CAPACITY) * 100)),
    detentionToday: Number(detentionSummary?.today ?? 0) || detentionSumForDay(today, detentionRecords),
    fuelWasted: waitingVehicles.length * FUEL_LITRES_PER_WAITING_VEHICLE,
    shipmentCompletionPct,
    customerSatPct: customerSatFromCompletion(shipmentCompletionPct),
    inYard: inYard.length,
    waiting: waitingVehicles.length,
    loading: vehicles.filter((v) => ["READY_FOR_LOADING", "LOADING"].includes(v.status)).length,
    exitHolding: vehicles.filter((v) => ["EXIT_HOLDING", "EXIT_VERIFIED"].includes(v.status)).length,
    exitedToday,
  };
}

function computeYesterdayMetrics(ctx) {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const { vehicles, appointments, queueEntries, docks, events, detentionRecords } = ctx;
  const checkInByVehicle = buildCheckInMap(events);
  const tat = avgTatForExitsOnDay(yesterday, vehicles, events, checkInByVehicle);
  const inYard = inYardCountAtDayEnd(yesterday, vehicles, events, checkInByVehicle);
  const shipment = shipmentCompletionForDay(yesterday, appointments);

  return {
    avgWaitingMin: avgWaitingForDay(yesterday, queueEntries, events),
    avgTurnaroundMin: tat.overall,
    dockUtilizationPct: dockUtilForDay(yesterday, docks, events),
    yardOccupancyPct: Math.min(100, Math.round((inYard / YARD_CAPACITY) * 100)),
    detentionToday: detentionSumForDay(yesterday, detentionRecords),
    fuelWasted: fuelForDay(yesterday, queueEntries),
    shipmentCompletionPct: shipment,
    customerSatPct: customerSatFromCompletion(shipment),
  };
}

function buildTurnaroundTrend7d(vehicles, events) {
  const checkInByVehicle = buildCheckInMap(events);
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const tat = avgTatForExitsOnDay(d, vehicles, events, checkInByVehicle);
    days.push({
      day: DAY_LABELS[d.getUTCDay()],
      dateKey: utcDateKey(d),
      company: tat.company,
      contract: tat.contract,
      outside: tat.outside,
    });
  }
  return days;
}

function buildYardOccupancyTrend7d(vehicles, events) {
  const checkInByVehicle = buildCheckInMap(events);
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - i);
    const count = inYardCountAtDayEnd(d, vehicles, events, checkInByVehicle);
    days.push({
      day: DAY_LABELS[d.getUTCDay()],
      dateKey: utcDateKey(d),
      occ: Math.min(100, Math.round((count / YARD_CAPACITY) * 100)),
      target: YARD_OCCUPANCY_TARGET_PCT,
    });
  }
  return days;
}

function deltaPct(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

function performancePct(actual, target, lowerIsBetter) {
  if (target <= 0) return 0;
  if (lowerIsBetter) {
    if (actual <= 0) return 100;
    return Math.min(100, Math.round((target / actual) * 100));
  }
  return Math.min(100, Math.round((actual / target) * 100));
}

function resolveStatus(actual, target, lowerIsBetter, perfPct) {
  if (lowerIsBetter) {
    if (actual > target * 1.2 || perfPct < 65) return "danger";
    if (actual > target * 1.05 || perfPct < 85) return "warning";
    if (actual <= target) return "success";
    return "info";
  }
  if (actual < target * 0.8 || perfPct < 65) return "danger";
  if (actual < target * 0.95 || perfPct < 85) return "warning";
  if (actual >= target) return "success";
  return "info";
}

function statusLabel(status) {
  if (status === "danger") return "Critical";
  if (status === "warning") return "Watch";
  if (status === "success") return "On Track";
  return "Steady";
}

function formatValue(key, value) {
  switch (key) {
    case "avgWaitingMin":
    case "avgTurnaroundMin":
      return `${value} min`;
    case "dockUtilizationPct":
    case "yardOccupancyPct":
    case "shipmentCompletionPct":
    case "customerSatPct":
      return `${value}%`;
    case "detentionToday":
      return formatINR(value);
    case "fuelWasted":
      return `${value} L`;
    default:
      return String(value);
  }
}

function formatTarget(key, target) {
  switch (key) {
    case "avgWaitingMin":
    case "avgTurnaroundMin":
      return `${target} min`;
    case "dockUtilizationPct":
    case "yardOccupancyPct":
    case "shipmentCompletionPct":
    case "customerSatPct":
      return `${target}%`;
    case "detentionToday":
      return formatINR(target);
    case "fuelWasted":
      return `${target} L`;
    default:
      return String(target);
  }
}

const SCORECARD_DEFS = [
  { key: "avgWaitingMin", metric: "Avg Waiting Time", lowerIsBetter: true },
  { key: "avgTurnaroundMin", metric: "Avg Turnaround", lowerIsBetter: true },
  { key: "dockUtilizationPct", metric: "Dock Utilization", lowerIsBetter: false },
  { key: "yardOccupancyPct", metric: "Yard Occupancy", lowerIsBetter: false },
  { key: "detentionToday", metric: "Detention Today", lowerIsBetter: true },
  { key: "fuelWasted", metric: "Fuel Wastage", lowerIsBetter: true },
  { key: "shipmentCompletionPct", metric: "Shipment Completion", lowerIsBetter: false },
  { key: "customerSatPct", metric: "Cust. Satisfaction", lowerIsBetter: false },
];

function buildScorecard(current, yesterday) {
  return SCORECARD_DEFS.map((def) => {
    const targetRaw = TARGETS[def.key];
    const valueRaw = current[def.key] ?? 0;
    const prevRaw = yesterday[def.key] ?? 0;
    const perf = performancePct(valueRaw, targetRaw, def.lowerIsBetter);
    const status = resolveStatus(valueRaw, targetRaw, def.lowerIsBetter, perf);
    const trend = deltaPct(valueRaw, prevRaw);

    return {
      key: def.key,
      metric: def.metric,
      value: formatValue(def.key, valueRaw),
      target: formatTarget(def.key, targetRaw),
      valueRaw,
      targetRaw,
      trend,
      status,
      performancePct: perf,
      lowerIsBetter: def.lowerIsBetter,
      stateLabel: statusLabel(status),
    };
  });
}

export function filterScorecardRows(rows, search) {
  if (!search?.trim()) return rows;
  return rows.filter((r) =>
    matchesSearch(
      { metric: r.metric, value: r.value, target: r.target, state: r.stateLabel, key: r.key },
      search,
      ["metric", "value", "target", "state", "key"]
    )
  );
}

export function toExportRows(rows) {
  return rows.map((k) => ({
    metric: k.metric,
    current: k.value,
    target: k.target,
    delta: `${k.trend > 0 ? "+" : ""}${k.trend}%`,
    state: k.stateLabel,
  }));
}

export function buildExecutiveKpisBundle(raw) {
  const detentionRecords = raw.detention?.records ?? [];
  const detentionSummary = raw.detention?.summary ?? {};
  const ctx = {
    vehicles: raw.vehicles,
    appointments: raw.appointments,
    queueEntries: raw.queueEntries,
    docks: raw.docks,
    events: raw.events,
    detentionRecords,
    detentionSummary,
  };

  const current = computeCurrentMetrics(ctx);
  const yesterday = computeYesterdayMetrics(ctx);
  const scorecard = buildScorecard(current, yesterday);

  return {
    scorecard,
    headline: current,
    turnaroundTrend: buildTurnaroundTrend7d(raw.vehicles, raw.events),
    yardOccupancyTrend: buildYardOccupancyTrend7d(raw.vehicles, raw.events),
    targets: TARGETS,
    assumptions: ASSUMPTIONS,
    fetchErrors: raw.fetchErrors ?? [],
  };
}

const SOURCE_DEFAULTS = {
  vehicles: [],
  appointments: [],
  queueEntries: [],
  docks: [],
  events: [],
  detention: { records: [], summary: {} },
};

async function fetchSource(key, loader) {
  try {
    return { key, data: await loader(), error: null };
  } catch (err) {
    console.error(`[executiveKpis] ${key} fetch failed`, err);
    return {
      key,
      data: SOURCE_DEFAULTS[key],
      error: { source: key, message: formatApiError(err) },
    };
  }
}

export async function fetchExecutiveKpisBundle() {
  const results = await Promise.all([
    fetchSource("vehicles", () => ymsApi.listVehicles()),
    fetchSource("appointments", () => ymsApi.listAppointments()),
    fetchSource("queueEntries", () => ymsApi.listQueueEntries()),
    fetchSource("docks", () => ymsApi.listDocks()),
    fetchSource("events", () => ymsApi.listYardEvents()),
    fetchSource("detention", () => ymsApi.getDetentionDashboard()),
  ]);

  const fetchErrors = results.filter((r) => r.error).map((r) => r.error);
  const data = Object.fromEntries(results.map((r) => [r.key, r.data]));

  if (fetchErrors.length === results.length) {
    const message = fetchErrors.map((e) => `${e.source}: ${e.message}`).join("; ");
    throw new Error(`All executive KPI data sources failed — ${message}`);
  }

  return buildExecutiveKpisBundle({ ...data, fetchErrors });
}

export default {
  fetchExecutiveKpisBundle,
  filterScorecardRows,
  toExportRows,
  buildExecutiveKpisBundle,
  shipmentCompletionForDay,
  formatINR,
  TARGETS,
  ASSUMPTIONS,
};
