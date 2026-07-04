export type AppointmentApiRow = {
  id: string;
  booking_reference?: string | null;
  vehicle_id?: string | null;
  customer_name?: string | null;
  shipment_reference?: string | null;
  booking_date?: string | null;
  reporting_time?: string | null;
  scheduled_slot?: string | null;
  gate_number?: string | null;
  status?: string | null;
  remarks?: string | null;
};

export type VehicleApiRow = {
  id: string;
  vehicle_number?: string | null;
  transporter_name?: string | null;
  status?: string | null;
};

export type AppointmentRow = {
  id: string;
  bookingRef: string;
  vehicleId?: string | null;
  plate: string;
  transporter: string;
  type: string;
  slot: string;
  date: string;
  gate: string;
  status: string;
  delayed: boolean;
};

export function parseRequestType(shipmentReference?: string | null, remarks?: string | null) {
  const ref = String(shipmentReference || "");
  const rm = String(remarks || "");
  if (ref.startsWith("Loading|") || ref.startsWith("[Loading]")) return "Loading";
  if (ref.startsWith("Unloading|") || ref.startsWith("[Unloading]")) return "Unloading";
  if (ref.startsWith("Transit|") || ref.startsWith("[Transit]")) return "Transit";
  if (ref.startsWith("Inter-Warehouse|") || ref.startsWith("[Inter-Warehouse]")) return "Inter-Warehouse";
  if (rm.includes("Request: Loading")) return "Loading";
  if (rm.includes("Request: Unloading")) return "Unloading";
  if (rm.includes("Request: Transit")) return "Transit";
  if (rm.includes("Request: Inter-Warehouse")) return "Inter-Warehouse";
  if (/unloading/i.test(ref)) return "Unloading";
  if (/inter-warehouse/i.test(ref)) return "Inter-Warehouse";
  if (/transit/i.test(ref)) return "Transit";
  return "Loading";
}

export function slotFromReportingTime(reportingTime?: string | null) {
  if (!reportingTime) return "09:00";
  const d = new Date(reportingTime);
  if (Number.isNaN(d.getTime())) return "09:00";
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function normalizeLegacySlot(slot?: string | null) {
  if (!slot) return null;
  if (slot === "AM") return "09:00";
  if (slot === "PM") return "14:00";
  if (slot === "EVE") return "18:00";
  return normalizeBookingTimeSlot(slot) || slot;
}

export function dateFromReportingTime(reportingTime?: string | null) {
  if (!reportingTime) return new Date().toISOString().slice(0, 10);
  return new Date(reportingTime).toISOString().slice(0, 10);
}

export function isAppointmentDelayed(appointment: AppointmentApiRow, vehicle?: VehicleApiRow | null) {
  if (!appointment.reporting_time) return false;
  const status = String(vehicle?.status || appointment.status || "").toUpperCase();
  if (["COMPLETED", "EXITED", "CANCELLED"].includes(status)) return false;
  return new Date(appointment.reporting_time).getTime() < Date.now() && status === "SCHEDULED";
}

export function mapAppointmentRow(
  appointment: AppointmentApiRow,
  vehicle?: VehicleApiRow | null,
): AppointmentRow {
  const date = appointment.booking_date || dateFromReportingTime(appointment.reporting_time);
  const status = String(vehicle?.status || appointment.status || "SCHEDULED").toUpperCase();

  return {
    id: appointment.id,
    bookingRef: appointment.booking_reference || "—",
    vehicleId: appointment.vehicle_id ?? null,
    plate: vehicle?.vehicle_number || "—",
    transporter: vehicle?.transporter_name || appointment.customer_name || "—",
    type: parseRequestType(appointment.shipment_reference, appointment.remarks),
    slot: normalizeLegacySlot(appointment.scheduled_slot) || slotFromReportingTime(appointment.reporting_time),
    date,
    gate: appointment.gate_number || "G1",
    status: isAppointmentDelayed(appointment, vehicle) ? "DELAYED" : status,
    delayed: isAppointmentDelayed(appointment, vehicle),
  };
}

export function filterAppointmentsByDate(rows: AppointmentRow[], date: string) {
  return rows.filter((row) => row.date === date);
}

export function filterAppointmentsBySlot(rows: AppointmentRow[], slot: string | "ALL") {
  if (slot === "ALL") return rows;
  return rows.filter((row) => row.slot === slot);
}

export type AppointmentKpiFilter = "all" | "scheduled" | "delayed";

export function filterAppointmentsByKpi(rows: AppointmentRow[], kpi: AppointmentKpiFilter) {
  if (kpi === "scheduled") return rows.filter((row) => row.status === "SCHEDULED");
  if (kpi === "delayed") return rows.filter((row) => row.delayed);
  return rows;
}

export function groupAppointmentsBySlot(rows: AppointmentRow[]) {
  const groups = new Map<string, AppointmentRow[]>();
  for (const row of rows) {
    const key = row.slot || "—";
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

export function appointmentLookupQuery(row: AppointmentRow) {
  const plate = String(row.plate || "").trim();
  if (plate && plate !== "—" && !/^TBD-/i.test(plate)) return plate;
  return row.bookingRef || row.id;
}

export function todayIsoDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function appointmentDayKpis(rows: AppointmentRow[]) {
  return {
    total: rows.length,
    scheduled: rows.filter((r) => r.status === "SCHEDULED").length,
    arrived: rows.filter((r) => ["ARRIVED", "CHECKED_IN"].includes(r.status)).length,
    inYard: rows.filter((r) =>
      ["WAITING", "CALLED", "DOCK_ASSIGNED", "LOADING", "READY_FOR_LOADING"].includes(r.status),
    ).length,
    delayed: rows.filter((r) => r.delayed).length,
  };
}

/** Align with YMS web console REQUEST_TYPES (appointmentsApi.js). */
export const BOOKING_REQUEST_TYPES = [
  "Loading",
  "Unloading",
  "Transit",
  "Inter-Warehouse",
] as const;

/** 30-minute slots from 07:00 through 19:30 — matches YMS web BookSlotDialog. */
export function buildBookingTimeSlotOptions() {
  const slots: string[] = [];
  for (let i = 0; i < 24; i += 1) {
    const hour = 7 + Math.floor(i / 2);
    if (hour >= 20) break;
    slots.push(`${String(hour).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`);
  }
  return slots;
}

export const BOOKING_TIME_SLOT_OPTIONS = buildBookingTimeSlotOptions();

export const BOOKING_SLOT_MIN_MINUTES = 7 * 60;
export const BOOKING_SLOT_MAX_MINUTES = 19 * 60 + 30;

export function normalizeBookingTimeSlot(value: string) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function isValidBookingTimeSlot(value: string) {
  const normalized = normalizeBookingTimeSlot(value);
  if (!normalized) return false;
  const [hour, minute] = normalized.split(":").map(Number);
  const total = hour * 60 + minute;
  return total >= BOOKING_SLOT_MIN_MINUTES && total <= BOOKING_SLOT_MAX_MINUTES;
}

export const BOOKING_GATES = ["G1", "G2", "G3", "G4"] as const;
export const BOOKING_MATERIALS = [
  "General Cargo",
  "Steel Coils",
  "FMCG Cartons",
  "Cement Bags",
  "Pharma — Cold",
] as const;

export const BOOKING_MATERIAL_CUSTOM = "Custom" as const;

export function isPresetMaterial(material: string) {
  return (BOOKING_MATERIALS as readonly string[]).includes(material);
}

export type BookAppointmentForm = {
  plate: string;
  transporter: string;
  driverName: string;
  reqType: (typeof BOOKING_REQUEST_TYPES)[number];
  material: string;
  slot: string;
  gate: string;
  date: string;
  notes: string;
};

export function slotToReportingTime(date: string, slot: string) {
  const normalized = normalizeBookingTimeSlot(slot) || "09:00";
  return `${date}T${normalized}:00`;
}

export function formatShipmentReference(reqType: string, material: string) {
  return `${reqType}|${material}|Yard`;
}

export function buildBookingRemarks(form: BookAppointmentForm) {
  return [
    `Request: ${form.reqType}`,
    `Vehicle Type: Truck`,
    `Category: company`,
    form.notes.trim() ? `Notes: ${form.notes.trim()}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function generateBookingRef(date: string) {
  const compact = date.replace(/-/g, "");
  const suffix = Date.now().toString(36).toUpperCase().slice(-4);
  return `APT-${compact}-${suffix}`;
}

export function validateBookingForm(form: BookAppointmentForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.plate.trim()) errors.plate = "Plate is required";
  if (!form.transporter.trim()) errors.transporter = "Transporter is required";
  const material = form.material.trim();
  if (!material || material === BOOKING_MATERIAL_CUSTOM) {
    errors.material = "Material type is required";
  }
  if (!form.date.trim()) errors.date = "Date is required";
  if (!isValidBookingTimeSlot(form.slot)) {
    errors.slot = "Enter a valid time (HH:mm) between 07:00 and 19:30";
  }
  return errors;
}

export function canCancelAppointment(status: string) {
  return ["SCHEDULED", "DRAFT", "DELAYED"].includes(String(status).toUpperCase());
}

export function canRescheduleAppointment(status: string) {
  return !["CANCELLED", "EXITED", "COMPLETED"].includes(String(status).toUpperCase());
}
