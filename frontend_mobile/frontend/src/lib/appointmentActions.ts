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
  if (rm.includes("Request: Loading")) return "Loading";
  if (rm.includes("Request: Unloading")) return "Unloading";
  if (/unloading/i.test(ref)) return "Unloading";
  return "Loading";
}

export function slotFromReportingTime(reportingTime?: string | null) {
  if (!reportingTime) return "—";
  const hour = Number(String(reportingTime).slice(11, 13));
  if (Number.isNaN(hour)) return "—";
  if (hour < 12) return "AM";
  if (hour < 17) return "PM";
  return "EVE";
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
    slot: appointment.scheduled_slot || slotFromReportingTime(appointment.reporting_time),
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

export const BOOKING_REQUEST_TYPES = ["Loading", "Unloading"] as const;
export const BOOKING_SLOTS = ["AM", "PM", "EVE"] as const;
export const BOOKING_GATES = ["G1", "G2", "G3", "G4"] as const;
export const BOOKING_MATERIALS = [
  "General Cargo",
  "Steel Coils",
  "FMCG Cartons",
  "Cement Bags",
  "Pharma — Cold",
] as const;

export type BookAppointmentForm = {
  plate: string;
  transporter: string;
  driverName: string;
  reqType: (typeof BOOKING_REQUEST_TYPES)[number];
  material: string;
  slot: (typeof BOOKING_SLOTS)[number];
  gate: string;
  date: string;
  notes: string;
};

export function slotToReportingTime(date: string, slot: string) {
  const hour = slot === "PM" ? "14" : slot === "EVE" ? "18" : "09";
  return `${date}T${hour}:00:00`;
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
  if (!form.material.trim()) errors.material = "Material is required";
  if (!form.date.trim()) errors.date = "Date is required";
  return errors;
}

export function canCancelAppointment(status: string) {
  return ["SCHEDULED", "DRAFT", "DELAYED"].includes(String(status).toUpperCase());
}

export function canRescheduleAppointment(status: string) {
  return !["CANCELLED", "EXITED", "COMPLETED"].includes(String(status).toUpperCase());
}
