/**
 * Appointments module — scheduling data layer over ymsApi.
 */

import ymsApi from "./ymsApi";
import { safeBundleFetch } from "../utils/safeBundleFetch";
import { notifyYmsDataChanged } from "./gateManagementApi";
import { ACTIVE_APPOINTMENT_STATUSES, isVehicleInYard } from "../constants/lifecycleStatuses";
import { safeText } from "../utils/search";
import { formatDockLabel } from "../utils/display";
import { fetchResourceReadiness } from "./docksApi";

export { ACTIVE_APPOINTMENT_STATUSES };

export const HOURS = Array.from({ length: 12 }, (_, i) => 7 + i);
export const GATES = ["G1", "G2", "G3", "G4"];

export const REQUEST_TYPES = ["Loading", "Unloading", "Transit", "Inter-Warehouse"];
export const VEHICLE_TYPE_OPTIONS = ["Truck", "Trailer", "Container", "Tanker", "LCV", "Tempo", "Custom"];
export const VEHICLE_CATEGORIES = [
  { value: "company", label: "Company Vehicle" },
  { value: "contract", label: "Contract Vehicle" },
  { value: "outside", label: "Outside Vehicle" },
];
export const PRIORITY_OPTIONS = ["Normal", "High", "Urgent"];
export const MATERIALS = [
  "Cement Bags", "Steel Coils", "FMCG Cartons", "Pharma — Cold", "Chemicals — Cat B",
  "Rice Bags", "Auto Parts", "Textiles", "Electronics", "General Cargo",
];

const PRIORITY_MAP = { Normal: 0, High: 50, Urgent: 90 };
const PRIORITY_LABEL = { 0: "Normal", 50: "High", 90: "Urgent" };

export function priorityLabel(priority) {
  if (priority >= 90) return "Urgent";
  if (priority >= 50) return "High";
  return PRIORITY_LABEL[priority] || "Normal";
}

const SLOT_CAPACITY_WARN = 3;
const SLOT_CAPACITY_CRITICAL = 5;

/** Per-gate slot capacity for schedule-step visibility (warn only — no hard block). */
export const GATE_SLOT_CAPACITY = 10;

const DURATION_BY_REQUEST = {
  Loading: 60,
  Unloading: 90,
  Transit: 30,
  "Inter-Warehouse": 60,
};

export const APPOINTMENT_LIFECYCLE = [
  "DRAFT",
  "SCHEDULED",
  "ARRIVED",
  "CHECKED_IN",
  "WAITING",
  "CALLED",
  "DOCK_ASSIGNED",
  "RESOURCE_PENDING",
  "READY_FOR_LOADING",
  "LOADING",
  "COMPLETED",
  "EXIT_HOLDING",
  "EXIT_VERIFIED",
  "EXITED",
];

const AUDIT_EVENT_TYPES = new Set([
  "APPOINTMENT_CREATED",
  "APPOINTMENT_CONFIRMED",
  "APPOINTMENT_UPDATED",
  "APPOINTMENT_RESCHEDULED",
  "APPOINTMENT_CANCELLED",
  "APPOINTMENT_STATUS_CHANGED",
]);

export function estimateOperationDuration(reqType) {
  return DURATION_BY_REQUEST[reqType] ?? 60;
}

export function computeExpectedCompletion(date, slot, durationMin) {
  if (!date || !slot) return "—";
  const start = new Date(`${date}T${slot}:00`);
  if (Number.isNaN(start.getTime())) return "—";
  const end = new Date(start.getTime() + (durationMin || 60) * 60 * 1000);
  return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
}

export function generatePreviewBookingRef(date, existingRows = []) {
  const d = date || new Date().toISOString().slice(0, 10);
  const compact = d.replace(/-/g, "");
  const prefix = `APT-${compact}-`;
  const nums = existingRows
    .map((r) => r.bookingRef)
    .filter((ref) => ref && ref.startsWith(prefix))
    .map((ref) => parseInt(ref.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export function capacityLevelFromPct(pct) {
  if (pct >= 90) return "red";
  if (pct >= 80) return "yellow";
  return "green";
}

export function computeGateSlotCapacity(rows, date, slot, gate, includePendingBooking = true) {
  const active = (r) =>
    r.date === date &&
    r.slot === slot &&
    r.gate === gate &&
    !["CANCELLED"].includes(r.backendStatus);
  const current = rows.filter(active).length;
  const afterBooking = includePendingBooking ? current + 1 : current;
  const max = GATE_SLOT_CAPACITY;
  const available = Math.max(0, max - afterBooking);
  const pctAfter = Math.round((afterBooking / max) * 100);
  const level = capacityLevelFromPct(pctAfter);
  let message = null;
  if (pctAfter >= 100) message = "Slot at capacity — booking still allowed until limit enforced";
  else if (pctAfter >= 90) message = "Slot nearly full (90%+) — consider another gate or time";
  else if (pctAfter >= 80) message = "Slot busy (80%+) — elevated congestion risk";
  return { gate, current, afterBooking, available, max, pctAfter, level, message };
}

export function appointmentCardLabel(row) {
  if (!row) return "—";
  const plate = (row.plate || "").trim();
  if (plate && !/^TBD-/i.test(plate) && plate !== "—") return plate;
  return row.bookingRef || "—";
}

export function displayVehiclePlate(row) {
  const plate = (row?.plate || "").trim();
  if (!plate || /^TBD-/i.test(plate)) return "—";
  return plate;
}

export function parseCargoFromRemarks(remarks) {
  const text = safeText(remarks);
  const pick = (prefix) => {
    const line = text.split("\n").find((l) => l.startsWith(prefix));
    return line ? line.slice(prefix.length).trim() : "";
  };
  const qtyLine = pick("Qty:");
  const [qtyPart, weightPart, volumePart] = qtyLine.split("·").map((s) => s.trim());
  return {
    quantity: qtyPart || "—",
    weight: weightPart?.replace(/Weight:\s*/i, "").replace(/\s*kg$/i, "").trim() || "—",
    volume: volumePart?.replace(/Volume:\s*/i, "").replace(/\s*m³$/i, "").trim() || "—",
    vehicleType: pick("Vehicle Type:") || "—",
    ownershipType: pick("Category:") || "—",
    pickup: pick("Pickup:") || "—",
    delivery: pick("Delivery:") || "—",
  };
}

const IN_PROGRESS_STATUSES = new Set([
  "CHECKED_IN",
  "WAITING",
  "CALLED",
  "DOCK_ASSIGNED",
  "RESOURCE_PENDING",
  "READY_FOR_LOADING",
  "LOADING",
]);

export function parseRequestType(shipmentReference, remarks) {
  const ref = safeText(shipmentReference);
  const rm = safeText(remarks);
  if (ref.startsWith("Loading|") || ref.startsWith("[Loading]")) return "Loading";
  if (ref.startsWith("Unloading|") || ref.startsWith("[Unloading]")) return "Unloading";
  if (rm.includes("Request: Loading")) return "Loading";
  if (rm.includes("Request: Unloading")) return "Unloading";
  if (/unloading/i.test(ref)) return "Unloading";
  return "Loading";
}

export function formatShipmentReference(reqType, material, delivery) {
  return `${reqType}|${material}|${delivery || "—"}`;
}

export function buildRemarks(form) {
  return [
    `Request: ${form.reqType}`,
    `Pickup: ${form.pickup}`,
    `Delivery: ${form.delivery || "—"}`,
    `Vehicle Type: ${form.vehicleType}`,
    `Category: ${form.ownershipType || "company"}`,
    `Qty: ${form.quantity || "—"} · Weight: ${form.weight || "—"} kg · Volume: ${form.volume || "—"}`,
    form.notes ? `Notes: ${form.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function validateBookingForm(form, step) {
  const errors = {};
  if (step >= 1) {
    if (!form.reqType) errors.reqType = "Request type required";
    if (!form.pickup?.trim()) errors.pickup = "Pickup location required";
    if (!form.delivery?.trim()) errors.delivery = "Delivery location required";
    if (!form.material) errors.material = "Material type required";
    if (!form.priority) errors.priority = "Priority required";
  }
  if (step >= 2) {
    if (!form.vehicleType) errors.vehicleType = "Vehicle type required";
  }
  if (step >= 3) {
    if (!form.date) errors.date = "Preferred date required";
    if (!form.slot) errors.slot = "Time slot required";
  }
  return errors;
}

export function slotLoadCount(rows, date, slot) {
  return rows.filter(
    (r) => r.date === date && r.slot === slot && !["CANCELLED"].includes(r.backendStatus)
  ).length;
}

export function slotCapacityWarning(rows, date, slot) {
  const count = slotLoadCount(rows, date, slot);
  if (count >= SLOT_CAPACITY_CRITICAL) {
    return { level: "critical", message: `Slot overloaded (${count} appointments) — consider another time` };
  }
  if (count >= SLOT_CAPACITY_WARN) {
    return { level: "warning", message: `Slot busy (${count} appointments) — elevated wait risk` };
  }
  return null;
}

function buildCargoProfile(material, vehicleType, reqType) {
  const mat = (material || "").toLowerCase();
  const vt = (vehicleType || "").toLowerCase();
  const cargoTypes = new Set(["GENERAL"]);
  const preferredDockTypes = new Set(["GENERAL", "LOADING", "MIXED"]);
  let zoneHint = reqType === "Unloading" ? "UNLOADING" : "LOADING";

  if (/pharma|cold|refrig/.test(mat)) {
    cargoTypes.add("COLD_CHAIN");
    cargoTypes.add("PHARMA");
    preferredDockTypes.clear();
    preferredDockTypes.add("COLD_CHAIN");
    zoneHint = "COLD_CHAIN";
  }
  if (/chem|hazmat|cat b/.test(mat)) {
    cargoTypes.add("HAZMAT");
    cargoTypes.add("CHEMICALS");
    preferredDockTypes.clear();
    preferredDockTypes.add("HAZMAT");
    zoneHint = "HAZMAT";
  }
  if (/auto/.test(mat)) {
    cargoTypes.add("GENERAL");
    preferredDockTypes.add("GENERAL");
  }
  if (/steel/.test(mat)) cargoTypes.add("STEEL");
  if (vt === "container" || vt.includes("container")) {
    cargoTypes.add("CONTAINERS");
    preferredDockTypes.add("CONTAINER");
    zoneHint = "CONTAINER";
  }
  if (vt === "tanker") {
    cargoTypes.add("CHEMICALS");
    cargoTypes.add("HAZMAT");
  }
  if (reqType === "Unloading") preferredDockTypes.add("UNLOADING");

  return { cargoTypes, preferredDockTypes, zoneHint };
}

function scoreDockCandidate(dock, profile, laborRows = [], equipmentRows = []) {
  if (dock.status !== "AVAILABLE" || dock.current_vehicle_id) return null;

  const supported = new Set((dock.supported_cargo_types || []).map((c) => String(c).toUpperCase()));
  const dockType = String(dock.dock_type || "").toUpperCase();
  const cargoMatch = [...profile.cargoTypes].some((t) => supported.has(t));
  const dockTypeMatch = [...profile.preferredDockTypes].includes(dockType);
  const materialMatch = cargoMatch || dockTypeMatch;

  const dockId = String(dock.id);
  const laborAvail = laborRows.some(
    (r) => r.assigned_dock_id === dockId || ["ON_DUTY", "AVAILABLE"].includes(r.status)
  );
  const equipAvail = equipmentRows.some(
    (r) => r.assigned_dock_id === dockId || ["IDLE", "ASSIGNED"].includes(r.status)
  );

  const reasons = [];
  let score = 0;
  if (materialMatch) {
    score += 40;
    reasons.push("Material Match");
  }
  if (laborAvail) {
    score += 25;
    reasons.push("Labor Available");
  }
  if (equipAvail) {
    score += 25;
    reasons.push("Equipment Available");
  }
  if (dock.status === "AVAILABLE") {
    score += 10;
    reasons.push("Current Capacity Available");
  }
  if (score === 0) return null;

  return {
    dockCode: dock.dock_code,
    dockName: dock.dock_name,
    dockId: dock.id,
    score,
    materialMatch,
    laborAvailable: laborAvail,
    equipmentAvailable: equipAvail,
    reasons,
    reason: reasons.join(" · "),
  };
}

export function recommendDockForBooking(material, docks = [], options = {}) {
  const { vehicleType, reqType, laborRows = [], equipmentRows = [] } = options;
  const profile = buildCargoProfile(material, vehicleType, reqType);
  const candidates = docks
    .map((d) => scoreDockCandidate(d, profile, laborRows, equipmentRows))
    .filter(Boolean);
  if (!candidates.length) return null;
  return candidates.reduce((best, c) => (c.score > best.score ? c : best));
}

export function recommendGateForBooking(rows, date, slot, preferredGate) {
  const gate = preferredGate || pickGateForSlot(rows, date, slot);
  const load = rows.filter((r) => r.date === date && r.gate === gate && r.slot === slot).length;
  return {
    gate,
    reason: load === 0 ? "Low gate load for selected slot" : `${load} appointment(s) at this gate/slot`,
  };
}

export function recommendZoneForBooking(reqType, material, vehicleType) {
  const mat = (material || "").toLowerCase();
  const vt = (vehicleType || "").toLowerCase();
  const reasons = [];

  if (/pharma|cold|refrig/.test(mat)) {
    reasons.push("Cold Chain material", "Cold Chain zone type");
    return { zone: "Cold Chain (E)", zoneType: "COLD_CHAIN", reasons, reason: reasons.join(" · ") };
  }
  if (/chem|hazmat|cat b/.test(mat)) {
    reasons.push("HAZMAT material", "HAZMAT zone type");
    return { zone: "Hazardous (D)", zoneType: "HAZMAT", reasons, reason: reasons.join(" · ") };
  }
  if (vt === "container" || vt.includes("container")) {
    reasons.push("Container vehicle type", "Container zone type");
    return { zone: "Container (C)", zoneType: "CONTAINER", reasons, reason: reasons.join(" · ") };
  }
  if (/auto/.test(mat)) {
    reasons.push("Auto Parts material", "General staging zone");
    return { zone: "Loading (A)", zoneType: "GENERAL", reasons, reason: reasons.join(" · ") };
  }
  if (reqType === "Unloading") {
    reasons.push("Unloading request type", "Inbound unload staging");
    return { zone: "Unloading (B)", zoneType: "UNLOADING", reasons, reason: reasons.join(" · ") };
  }
  reasons.push("Loading request type", "Outbound load staging");
  return { zone: "Loading (A)", zoneType: "LOADING", reasons, reason: reasons.join(" · ") };
}

export async function computeBookingRecommendations(form, existingRows, docks) {
  let laborRows = [];
  let equipmentRows = [];
  try {
    const [labor, equipment] = await Promise.all([ymsApi.listLabor(), ymsApi.listEquipment()]);
    laborRows = labor;
    equipmentRows = equipment;
  } catch {
    /* recommendations still work without labor/equipment signals */
  }

  const gate = form.gate || recommendGateForBooking(existingRows, form.date, form.slot, form.gate).gate;
  const slotWarn = slotCapacityWarning(existingRows, form.date, form.slot);
  const gateCapacity = computeGateSlotCapacity(existingRows, form.date, form.slot, gate);
  const dock = recommendDockForBooking(form.material, docks, {
    vehicleType: form.vehicleType,
    reqType: form.reqType,
    laborRows,
    equipmentRows,
  });
  const zone = recommendZoneForBooking(form.reqType, form.material, form.vehicleType);
  const durationMin = estimateOperationDuration(form.reqType);
  const expectedCompletion = computeExpectedCompletion(form.date, form.slot, durationMin);

  return {
    gate: recommendGateForBooking(existingRows, form.date, form.slot, gate),
    dock,
    zone,
    slotWarning: slotWarn,
    gateCapacity,
    durationMin,
    expectedCompletion,
  };
}

export async function fetchAppointmentHistory(appointmentId, vehicleId) {
  const events = await ymsApi.listYardEvents({ limit: 500 });
  return events
    .filter(
      (e) =>
        e.appointment_id === appointmentId || (vehicleId && e.vehicle_id === vehicleId)
    )
    .sort((a, b) => new Date(a.event_time) - new Date(b.event_time));
}

export function filterAuditHistory(events) {
  return [...events]
    .filter((e) => AUDIT_EVENT_TYPES.has(e.event_type))
    .sort((a, b) => new Date(b.event_time) - new Date(a.event_time));
}

export function buildLifecycleTimeline(appointment, events = [], operationalStatus = null) {
  const timestamps = {};
  const vehicleId = appointment?.vehicle_id;

  for (const ev of events) {
    const t = ev.event_time;
    switch (ev.event_type) {
      case "APPOINTMENT_CREATED":
        timestamps.DRAFT = timestamps.DRAFT || t;
        break;
      case "APPOINTMENT_CONFIRMED":
        timestamps.SCHEDULED = timestamps.SCHEDULED || t;
        break;
      case "VEHICLE_CHECKED_IN":
        timestamps.CHECKED_IN = timestamps.CHECKED_IN || t;
        break;
      case "ENTRY_APPROVED":
        timestamps.WAITING = timestamps.WAITING || t;
        break;
      case "VEHICLE_CALLED":
      case "QUEUE_CALLED":
        timestamps.CALLED = timestamps.CALLED || t;
        break;
      case "EXIT_HOLDING":
        timestamps.EXIT_HOLDING = timestamps.EXIT_HOLDING || t;
        break;
      case "EXIT_VERIFIED":
        timestamps.EXIT_VERIFIED = timestamps.EXIT_VERIFIED || t;
        break;
      case "DOCK_ASSIGNED":
        timestamps.DOCK_ASSIGNED = timestamps.DOCK_ASSIGNED || t;
        break;
      case "VEHICLE_STATUS_CHANGED": {
        const m = ev.event_note?.match(/->\s*([A-Z_]+)/);
        if (m && APPOINTMENT_LIFECYCLE.includes(m[1])) {
          timestamps[m[1]] = timestamps[m[1]] || t;
        }
        break;
      }
      default:
        break;
    }
  }

  if (appointment?.created_at) {
    timestamps.SCHEDULED = timestamps.SCHEDULED || appointment.created_at;
    timestamps.DRAFT = timestamps.DRAFT || appointment.created_at;
  }

  const currentStatus = operationalStatus || appointment?.status || "SCHEDULED";
  const currentIdx = APPOINTMENT_LIFECYCLE.indexOf(currentStatus);

  return APPOINTMENT_LIFECYCLE.map((step, idx) => ({
    step,
    timestamp: timestamps[step] || null,
    state: currentIdx < 0 ? "pending" : idx < currentIdx ? "done" : idx === currentIdx ? "current" : "pending",
  }));
}

export function slotFromReportingTime(reportingTime) {
  if (!reportingTime) return "09:00";
  const d = new Date(reportingTime);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function dateFromReportingTime(reportingTime) {
  if (!reportingTime) return new Date().toISOString().slice(0, 10);
  return new Date(reportingTime).toISOString().slice(0, 10);
}

export function isDelayed(appointment) {
  if (!appointment?.reporting_time) return false;
  if (["COMPLETED", "EXITED", "CANCELLED"].includes(appointment.status)) return false;
  return new Date(appointment.reporting_time).getTime() < Date.now() && appointment.status === "SCHEDULED";
}

/** When a vehicle is in-yard, vehicle.status is operational truth for appointment views. */
export function resolveOperationalStatus(appointment, vehicle) {
  if (vehicle && isVehicleInYard(vehicle)) {
    return vehicle.status;
  }
  return appointment?.status ?? "SCHEDULED";
}

export function displayStatus(appointment, vehicle = null) {
  const operational = resolveOperationalStatus(appointment, vehicle);
  if (!isVehicleInYard(vehicle) && isDelayed(appointment)) return "DELAYED";
  const lifecycle = new Set([
    "DRAFT", "SCHEDULED", "ARRIVED", "CHECKED_IN", "WAITING", "CALLED", "DOCK_ASSIGNED",
    "RESOURCE_PENDING", "READY_FOR_LOADING", "LOADING", "COMPLETED", "EXIT_HOLDING",
    "EXIT_VERIFIED", "EXITED", "CANCELLED",
  ]);
  if (lifecycle.has(operational)) return operational;
  return operational;
}

function resolveDockRecord(queueEntry, dockFromMap, appointment) {
  if (dockFromMap && typeof dockFromMap === "object") return dockFromMap;
  const embedded = appointment?.dock;
  if (embedded && typeof embedded === "object") return embedded;
  return null;
}

export function mapAppointmentRow(appointment, vehicle, queueEntry, dockFromMap, allDocks = []) {
  const reqType = parseRequestType(appointment.shipment_reference, appointment.remarks);
  const materialParts = safeText(appointment.shipment_reference).split("|");
  const material = materialParts.length >= 2 ? materialParts[1] : safeText(appointment.shipment_reference, "—");
  const dockRecord = resolveDockRecord(queueEntry, dockFromMap, appointment);
  const dockLabel = formatDockLabel(dockRecord);

  const cargoParsed = parseCargoFromRemarks(appointment.remarks);
  const vt = vehicle?.vehicle_type || cargoParsed.vehicleType || "—";
  const rec = recommendDockForBooking(material, allDocks, { vehicleType: vt, reqType });
  const zoneRec = recommendZoneForBooking(reqType, material, vt);
  const durationMin = estimateOperationDuration(reqType);
  const apptDate = appointment.booking_date || dateFromReportingTime(appointment.reporting_time);
  const apptSlot = appointment.scheduled_slot || slotFromReportingTime(appointment.reporting_time);

  return {
    id: appointment.id,
    bookingRef: appointment.booking_reference || "—",
    vehicleId: appointment.vehicle_id,
    plate: vehicle?.vehicle_number || "—",
    transporter: vehicle?.transporter_name || appointment.customer_name || "—",
    type: reqType,
    material: material || "—",
    vehicleType: vt,
    quantity: cargoParsed.quantity,
    weight: cargoParsed.weight,
    volume: cargoParsed.volume,
    ownershipType: vehicle?.ownership_type || cargoParsed.ownershipType,
    slot: apptSlot,
    date: apptDate,
    gate: appointment.gate_number || "G1",
    dock: dockLabel,
    dockId: queueEntry?.dock_id || dockRecord?.id || null,
    recommendedDock: dockRecord?.dock_code || rec?.dockCode || "—",
    recommendedGate: appointment.gate_number || "G1",
    recommendedZone: zoneRec?.zone || "—",
    recommendationReasons: rec?.reasons || [],
    durationMin,
    expectedCompletion: computeExpectedCompletion(apptDate, apptSlot, durationMin),
    status: displayStatus(appointment, vehicle),
    backendStatus: resolveOperationalStatus(appointment, vehicle),
    appointmentStatus: appointment.status,
    createdBy: appointment.customer_name || "—",
    createdAt: appointment.created_at,
    priority: appointment.priority,
    priorityLabel: priorityLabel(appointment.priority),
    reportingTime: appointment.reporting_time,
    remarks: appointment.remarks,
    appointment,
    vehicle,
    queueEntry,
    dockRecord,
    delayed: isDelayed(appointment),
  };
}

export async function fetchAppointmentsBundle({
  includeQueue = false,
  includeDocks = false,
} = {}) {
  const queuePromise = safeBundleFetch(
    includeQueue,
    () => ymsApi.listQueueEntries(),
    []
  );
  const docksPromise = safeBundleFetch(
    includeDocks,
    () => ymsApi.listDocks(),
    []
  );

  const [appointments, vehicles, queueEntries, docks] = await Promise.all([
    ymsApi.listAppointments(),
    ymsApi.listVehicles(),
    queuePromise,
    docksPromise,
  ]);

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
  const queueByAppointment = new Map(queueEntries.map((q) => [q.appointment_id, q]));
  const dockMap = new Map(docks.map((d) => [d.id, d]));

  const rows = appointments.map((appt) => {
    const queue = queueByAppointment.get(appt.id);
    const dock = queue?.dock_id ? dockMap.get(queue.dock_id) : null;
    return mapAppointmentRow(appt, vehicleMap.get(appt.vehicle_id), queue, dock, docks);
  });

  return { rows, appointments, vehicles, queueEntries, docks };
}

export function computeKpis(rows, selectedDate) {
  const dayRows = rows.filter((r) => r.date === selectedDate);
  const loading = dayRows.filter((r) => r.type === "Loading").length;
  const unloading = dayRows.filter((r) => r.type === "Unloading").length;
  const delayed = dayRows.filter((r) => r.delayed).length;
  const completed = dayRows.filter((r) => r.backendStatus === "COMPLETED" || r.backendStatus === "EXITED").length;
  const inProgress = dayRows.filter((r) => IN_PROGRESS_STATUSES.has(r.backendStatus)).length;
  const scheduled = dayRows.filter((r) => r.backendStatus === "SCHEDULED").length;

  return { scheduled, loading, unloading, delayed, completed, inProgress, total: dayRows.length };
}

export function computeHourBuckets(rows, selectedDate) {
  const dayRows = rows.filter((r) => r.date === selectedDate);
  const map = Object.fromEntries(HOURS.map((h) => [h, 0]));
  dayRows.forEach((r) => {
    const h = parseInt(String(r.slot).split(":")[0], 10);
    if (h in map) map[h] += 1;
  });
  return HOURS.map((h) => ({ hour: `${String(h).padStart(2, "0")}`, count: map[h] }));
}

export function pickGateForSlot(rows, selectedDate, slot) {
  const counts = Object.fromEntries(GATES.map((g) => [g, 0]));
  rows
    .filter((r) => r.date === selectedDate && r.slot === slot && !["CANCELLED"].includes(r.backendStatus))
    .forEach((r) => {
      if (counts[r.gate] !== undefined) counts[r.gate] += 1;
    });
  return GATES.reduce((best, g) => (counts[g] < counts[best] ? g : best), GATES[0]);
}

export function buildSlotRecommendations(rows, selectedDate) {
  const dayRows = rows.filter((r) => r.date === selectedDate && r.backendStatus !== "CANCELLED");
  const recs = [];
  const hourBuckets = computeHourBuckets(rows, selectedDate);
  const peak = hourBuckets.reduce((max, h) => (h.count > max.count ? h : max), { count: 0, hour: "—" });

  if (peak.count >= 3) {
    recs.push({
      sev: "warning",
      msg: `Spread bookings away from ${peak.hour}:00 — ${peak.count} appointments clustered`,
      saved: 0,
      conf: 86,
    });
  }

  const delayed = dayRows.filter((r) => r.delayed).length;
  if (delayed >= 2) {
    recs.push({
      sev: "danger",
      msg: `${delayed} appointments past reporting time — reschedule or call in`,
      saved: 0,
      conf: 88,
    });
  }

  const outsidePeak = dayRows.filter(
    (r) => r.vehicle?.ownership_type === "outside" && parseInt(r.slot, 10) >= 10 && parseInt(r.slot, 10) <= 12
  ).length;
  if (outsidePeak >= 2) {
    recs.push({
      sev: "success",
      msg: "Move outside vehicles to early-morning slots (07:00–09:00)",
      saved: 42000,
      conf: 82,
    });
  }

  const loadingHeavy = dayRows.filter((r) => r.type === "Loading" && r.gate === "G1").length;
  if (loadingHeavy >= 4) {
    recs.push({
      sev: "warning",
      msg: "G1 loading lane overloaded — shift unloadings to G2/G3",
      saved: 0,
      conf: 84,
    });
  }

  if (recs.length === 0) {
    recs.push({
      sev: "success",
      msg: "Slot distribution looks balanced for the selected day",
      saved: 0,
      conf: 75,
    });
  }

  return recs.slice(0, 4);
}

export async function createBookingFromForm(form, bundleOptions = {}) {
  const errors = validateBookingForm(form, 3);
  if (Object.keys(errors).length) {
    throw new Error(Object.values(errors).join("; "));
  }

  const bundle = await fetchAppointmentsBundle({
    includeQueue: bundleOptions.includeQueue ?? false,
    includeDocks: bundleOptions.includeDocks ?? false,
  });
  const bookingRef =
    form.previewBookingRef || generatePreviewBookingRef(form.date, bundle.rows);
  const plate = (form.plate || "").trim().toUpperCase() || bookingRef;

  const vehicleType = String(form.vehicleType || "Truck").toUpperCase().replace(/\s+/g, "_");
  const normalizedType = vehicleType === "TRUCK" || vehicleType in { TRAILER: 1, CONTAINER: 1, TANKER: 1, LCV: 1, TEMPO: 1, CUSTOM: 1 }
    ? vehicleType
    : "TRUCK";

  const vehicle = await ymsApi.createVehicle({
    vehicle_number: plate,
    display_name: plate,
    vehicle_type: normalizedType,
    ownership_type: form.ownershipType || "company",
    operation_type: form.reqType || "Loading",
    material_type: "GENERAL",
    transporter_name: (form.transporter || form.createdBy || "TBD").trim(),
    driver_name: (form.driverName || "").trim() || null,
    driver_phone: (form.driverPhone || "").trim() || null,
    registration_source: "appointment",
    status: "SCHEDULED",
    created_by: "appointments-ui",
  });

  const reportingIso = `${form.date}T${form.slot}:00`;
  const recs = await computeBookingRecommendations(form, bundle.rows, bundle.docks);
  const gate = form.gate || recs.gate?.gate || pickGateForSlot(bundle.rows, form.date, form.slot);

  const appointment = await ymsApi.createAppointment({
    booking_reference: bookingRef,
    vehicle_id: vehicle.id,
    customer_name: form.createdBy || "Operations",
    shipment_reference: formatShipmentReference(form.reqType, form.material, form.delivery),
    booking_date: form.date,
    reporting_time: new Date(reportingIso).toISOString(),
    scheduled_slot: form.slot,
    gate_number: gate,
    priority: PRIORITY_MAP[form.priority] ?? 0,
    status: "SCHEDULED",
    remarks: buildRemarks(form),
    created_by: form.createdByUser || "appointments-ui",
  });

  notifyYmsDataChanged();
  return { vehicle, appointment, bookingRef, recommendations: recs };
}

export async function rescheduleAppointment(appointmentId, { date, slot, gate }) {
  const reportingIso = `${date}T${slot}:00`;
  const result = await ymsApi.updateAppointment(appointmentId, {
    booking_date: date,
    reporting_time: new Date(reportingIso).toISOString(),
    scheduled_slot: slot,
    gate_number: gate,
    created_by: "appointments-ui",
  });
  notifyYmsDataChanged();
  return result;
}

export async function cancelAppointment(appointmentId, vehicleId) {
  const appt = await ymsApi.updateAppointment(appointmentId, {
    status: "CANCELLED",
    remarks: "Cancelled from appointments UI",
    created_by: "appointments-ui",
  });
  if (vehicleId) {
    try {
      const vehicle = await ymsApi.getVehicle(vehicleId);
      if (vehicle.status !== "CANCELLED" && vehicle.status !== "EXITED") {
        await ymsApi.transitionVehicle(vehicleId, {
          status: "CANCELLED",
          event_note: "Appointment cancelled",
          created_by: "appointments-ui",
        });
      }
    } catch {
      /* vehicle may already be terminal */
    }
  }
  notifyYmsDataChanged();
  return appt;
}

function generateQueueNumber() {
  return `Q-${Date.now().toString(36).toUpperCase().slice(-7)}`;
}

/**
 * Mark arrived — gate flow: ARRIVED then entry approved (queue created, WAITING).
 */
export async function markAppointmentArrived(appointmentId, vehicleId, options = {}) {
  if (!appointmentId) throw new Error("Appointment id required");
  if (!vehicleId) throw new Error("Vehicle id required for gate entry");

  const appt = await ymsApi.getAppointment(appointmentId);
  const queues = await ymsApi.listQueueEntries();
  if (queues.some((q) => q.appointment_id === appointmentId)) {
    throw new Error("Already checked in — queue entry exists");
  }

  const gateId = options.gate || appt.gate_number || "G1";
  const queueType = options.queueType || options.reqType || "STANDARD";

  if (appt.status === "SCHEDULED") {
    await ymsApi.gateMarkArrived(vehicleId, {
      gate_id: gateId,
      created_by: "appointments-ui",
    });
  } else if (appt.status !== "ARRIVED") {
    throw new Error(`Cannot mark arrived — appointment is ${appt.status}`);
  }

  const result = await ymsApi.gateApproveEntry(vehicleId, {
    gate_id: gateId,
    created_by: "appointments-ui",
    queue_number: generateQueueNumber(),
    queue_type: queueType,
  });

  notifyYmsDataChanged();
  return result;
}

export async function markAppointmentInProgress(vehicleId) {
  if (!vehicleId) throw new Error("Vehicle id required");

  const vehicle = await ymsApi.getVehicle(vehicleId);
  if (vehicle.status !== "READY_FOR_LOADING") {
    throw new Error(
      `Cannot start loading — vehicle must be READY_FOR_LOADING (current: ${vehicle.status}). ` +
        "Complete gate entry, queue call, dock assignment, and resource readiness first."
    );
  }

  const readiness = await fetchResourceReadiness(vehicleId);
  if (!readiness?.ready) {
    const missing = (readiness?.missing || []).join(", ") || "resources";
    throw new Error(`Cannot start loading — missing: ${missing}`);
  }

  const queues = await ymsApi.listQueueEntries();
  const active = queues.find(
    (q) =>
      q.vehicle_id === vehicleId &&
      !["EXITED", "CANCELLED", "COMPLETED"].includes(q.status)
  );
  if (!active?.dock_id) {
    throw new Error("Cannot start loading — vehicle is not assigned to a dock");
  }

  const result = await ymsApi.transitionVehicle(vehicleId, {
    status: "LOADING",
    event_note: "Loading started from appointments",
    created_by: "appointments-ui",
  });
  notifyYmsDataChanged();
  return result;
}

export async function markAppointmentCompleted(vehicleId) {
  if (!vehicleId) throw new Error("Vehicle id required");

  const vehicle = await ymsApi.getVehicle(vehicleId);
  if (vehicle.status !== "LOADING") {
    throw new Error(
      `Cannot complete — vehicle must be LOADING (current: ${vehicle.status})`
    );
  }

  const result = await ymsApi.transitionVehicle(vehicleId, {
    status: "COMPLETED",
    event_note: "Loading completed from appointments",
    created_by: "appointments-ui",
  });
  notifyYmsDataChanged();
  return result;
}

export default {
  fetchAppointmentsBundle,
  fetchAppointmentHistory,
  createBookingFromForm,
  rescheduleAppointment,
  cancelAppointment,
  markAppointmentArrived,
  markAppointmentInProgress,
  markAppointmentCompleted,
  mapAppointmentRow,
  resolveOperationalStatus,
  computeKpis,
  computeHourBuckets,
  buildSlotRecommendations,
  generatePreviewBookingRef,
  estimateOperationDuration,
  computeExpectedCompletion,
  computeGateSlotCapacity,
  appointmentCardLabel,
  displayVehiclePlate,
  buildLifecycleTimeline,
  filterAuditHistory,
  HOURS,
  GATES,
};
