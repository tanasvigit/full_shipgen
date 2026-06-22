import { ymsRequest } from "@/src/lib/ymsApi";

export const GATE_ID = "G1";
export const GATE_CREATED_BY = "mobile-gate";

export type GateCheck = {
  id: string;
  label: string;
  passed: boolean;
  hint?: string;
  field?: string;
};

export type GateActivityRow = {
  vehicleId: string;
  appointmentId?: string | null;
  queueEntryId?: string | null;
  plate?: string;
  vehicleReference?: string;
  appointment?: string;
  transporter?: string;
  driver?: string;
  slot?: string;
  status?: string;
  activityTab?: string;
  gateId?: string;
};

export type GateVehicleContext = {
  vehicleId: string;
  appointmentId?: string | null;
  queueEntryId?: string | null;
  activityTab?: string;
  gateId: string;
  entryChecks: GateCheck[];
  exitChecks: GateCheck[];
  entryApproved: boolean;
  exitApproved: boolean;
  display: {
    plate: string;
    transporter: string;
    driver: string;
    appointment: string;
    slot: string;
    status: string;
  };
};

function slotFromReportingTime(value?: string | null) {
  if (!value) return "—";
  const hour = Number(String(value).slice(11, 13));
  if (Number.isNaN(hour)) return "—";
  if (hour < 12) return "AM";
  if (hour < 17) return "PM";
  return "EVE";
}

export function mapGateContextFromApi(ctx: Record<string, any> | null | undefined): GateVehicleContext | null {
  if (!ctx?.vehicle?.id) return null;
  const vehicle = ctx.vehicle;
  const appointment = ctx.appointment;
  const materialParts = String(appointment?.shipment_reference || "").split("|");

  return {
    vehicleId: vehicle.id,
    appointmentId: appointment?.id ?? null,
    queueEntryId: ctx.queueEntry?.id ?? ctx.queue_entry?.id ?? null,
    activityTab: ctx.activityTab ?? ctx.activity_tab,
    gateId: ctx.gateId || ctx.gate_id || GATE_ID,
    entryChecks: ctx.entryChecks || ctx.entry_checks || [],
    exitChecks: ctx.exitChecks || ctx.exit_checks || [],
    entryApproved: Boolean(ctx.entryApproved ?? ctx.entry_approved),
    exitApproved: Boolean(ctx.exitApproved ?? ctx.exit_approved),
    display: {
      plate: vehicle.vehicle_number || "—",
      transporter: vehicle.transporter_name || "—",
      driver: vehicle.driver_name || "—",
      appointment: appointment?.booking_reference || "—",
      slot: appointment?.scheduled_slot || slotFromReportingTime(appointment?.reporting_time),
      status: vehicle.status || appointment?.status || "—",
    },
  };
}

export function lookupQueryFromRow(row: GateActivityRow) {
  return row.plate || row.appointment || row.vehicleReference || row.vehicleId;
}

export function generateQueueNumber() {
  return `Q-${Date.now().toString(36).toUpperCase().slice(-7)}`;
}

export async function lookupGateVehicle(query: string, gateId = GATE_ID) {
  const ctx = await ymsRequest<Record<string, unknown>>("/gate/lookup", {
    method: "POST",
    body: { query: query.trim(), gate_id: gateId },
  });
  return mapGateContextFromApi(ctx);
}

export async function markVehicleArrived(vehicleId: string, gateId = GATE_ID) {
  const ctx = await ymsRequest<Record<string, unknown>>(`/gate/vehicles/${vehicleId}/arrived`, {
    method: "POST",
    body: { gate_id: gateId, created_by: GATE_CREATED_BY },
  });
  return mapGateContextFromApi(ctx);
}

export async function approveGateEntry(
  vehicleId: string,
  options: { gateId?: string; queueNumber?: string; queueType?: string } = {},
) {
  const ctx = await ymsRequest<Record<string, unknown>>(`/gate/vehicles/${vehicleId}/approve-entry`, {
    method: "POST",
    body: {
      gate_id: options.gateId || GATE_ID,
      created_by: GATE_CREATED_BY,
      queue_number: options.queueNumber || generateQueueNumber(),
      queue_type: options.queueType || "Loading",
    },
  });
  return mapGateContextFromApi(ctx);
}

export async function rejectGateEntry(vehicleId: string, reason: string, gateId = GATE_ID) {
  await ymsRequest(`/gate/vehicles/${vehicleId}/reject-entry`, {
    method: "POST",
    body: { gate_id: gateId, created_by: GATE_CREATED_BY, reason },
  });
}

export async function updateExitChecklist(
  vehicleId: string,
  patch: Record<string, boolean | string | null | undefined>,
  gateId = GATE_ID,
) {
  return ymsRequest<Record<string, unknown>>(`/gate/vehicles/${vehicleId}/exit-checklist`, {
    method: "PATCH",
    body: { gate_id: gateId, ...patch },
  });
}

export async function verifyGateExit(vehicleId: string, gateId = GATE_ID, remarks?: string | null) {
  const ctx = await ymsRequest<Record<string, unknown>>(`/gate/vehicles/${vehicleId}/verify-exit`, {
    method: "POST",
    body: { gate_id: gateId, created_by: GATE_CREATED_BY, remarks: remarks ?? null },
  });
  return mapGateContextFromApi(ctx);
}

export async function gateOutVehicle(vehicleId: string, gateId = GATE_ID) {
  return ymsRequest<Record<string, unknown>>(`/gate/vehicles/${vehicleId}/gate-out`, {
    method: "POST",
    body: { gate_id: gateId, created_by: GATE_CREATED_BY },
  });
}

export async function rejectGateExit(vehicleId: string, reason: string, gateId = GATE_ID) {
  await ymsRequest(`/gate/vehicles/${vehicleId}/reject-exit`, {
    method: "POST",
    body: { gate_id: gateId, created_by: GATE_CREATED_BY, reason },
  });
}

export async function recordGateScan(
  query: string,
  options: { gateId?: string; scanType?: string } = {},
) {
  return ymsRequest<Record<string, unknown>>("/gate/scan", {
    method: "POST",
    body: {
      query: query.trim(),
      gate_id: options.gateId || GATE_ID,
      scan_type: options.scanType || "BARCODE",
      created_by: GATE_CREATED_BY,
    },
  });
}
