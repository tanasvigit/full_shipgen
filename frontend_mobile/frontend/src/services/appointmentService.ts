import { ymsRequest } from "@/src/lib/ymsApi";
import {
  buildBookingRemarks,
  formatShipmentReference,
  generateBookingRef,
  mapAppointmentRow,
  slotToReportingTime,
  todayIsoDate,
  type AppointmentApiRow,
  type AppointmentRow,
  type BookAppointmentForm,
  type VehicleApiRow,
} from "@/src/lib/appointmentActions";
import { parseYmsList } from "@/src/services/queueService";

export const APPOINTMENT_CREATED_BY = "mobile-appointments";

export type AppointmentsBundle = {
  rows: AppointmentRow[];
  date: string;
};

export async function fetchAppointmentsForDate(date = todayIsoDate()): Promise<AppointmentsBundle> {
  const [appointmentsPayload, vehiclesPayload] = await Promise.all([
    ymsRequest<unknown>(
      `/appointments?date_from=${encodeURIComponent(date)}&date_to=${encodeURIComponent(date)}&limit=500`,
    ),
    ymsRequest<unknown>("/vehicles?limit=500"),
  ]);

  const appointments = parseYmsList(appointmentsPayload) as AppointmentApiRow[];
  const vehicles = parseYmsList(vehiclesPayload) as VehicleApiRow[];
  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  const rows = appointments
    .map((appointment) => mapAppointmentRow(appointment, vehicleMap.get(String(appointment.vehicle_id || ""))))
    .sort((a, b) => `${a.slot}-${a.bookingRef}`.localeCompare(`${b.slot}-${b.bookingRef}`));

  return { rows, date };
}

export async function createBooking(form: BookAppointmentForm) {
  const plate = form.plate.trim().toUpperCase();
  const bookingRef = generateBookingRef(form.date);
  const reportingIso = new Date(slotToReportingTime(form.date, form.slot)).toISOString();

  const vehicle = await ymsRequest<{ id: string }>("/vehicles", {
    method: "POST",
    body: {
      vehicle_number: plate,
      display_name: plate,
      vehicle_type: "TRUCK",
      ownership_type: "company",
      operation_type: form.reqType,
      material_type: "GENERAL",
      transporter_name: form.transporter.trim(),
      driver_name: form.driverName.trim() || null,
      registration_source: "appointment",
      status: "SCHEDULED",
    },
  });

  const appointment = await ymsRequest<AppointmentApiRow>("/appointments", {
    method: "POST",
    body: {
      booking_reference: bookingRef,
      vehicle_id: vehicle.id,
      customer_name: form.transporter.trim(),
      shipment_reference: formatShipmentReference(form.reqType, form.material.trim()),
      booking_date: form.date,
      reporting_time: reportingIso,
      scheduled_slot: form.slot,
      gate_number: form.gate,
      priority: 0,
      status: "SCHEDULED",
      remarks: buildBookingRemarks(form),
      created_by: APPOINTMENT_CREATED_BY,
    },
  });

  return mapAppointmentRow(appointment, {
    id: vehicle.id,
    vehicle_number: plate,
    transporter_name: form.transporter.trim(),
    status: "SCHEDULED",
  });
}

export async function cancelAppointment(appointmentId: string) {
  return ymsRequest<AppointmentApiRow>(`/appointments/${appointmentId}`, {
    method: "PATCH",
    body: {
      status: "CANCELLED",
      remarks: "Cancelled from mobile",
      created_by: APPOINTMENT_CREATED_BY,
    },
  });
}

export async function rescheduleAppointment(
  appointmentId: string,
  patch: { date: string; slot: string; gate: string },
) {
  const reportingIso = new Date(slotToReportingTime(patch.date, patch.slot)).toISOString();
  return ymsRequest<AppointmentApiRow>(`/appointments/${appointmentId}`, {
    method: "PATCH",
    body: {
      booking_date: patch.date,
      reporting_time: reportingIso,
      scheduled_slot: patch.slot,
      gate_number: patch.gate,
      created_by: APPOINTMENT_CREATED_BY,
    },
  });
}
