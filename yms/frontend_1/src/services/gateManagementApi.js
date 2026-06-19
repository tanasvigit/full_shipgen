/**
 * Gate Management — entry & exit verification over /api/gate + ymsApi.
 */

import ymsApi from "./ymsApi";
import { parseRequestType, slotFromReportingTime } from "./appointmentsApi";
import { formatDockLabel } from "../utils/display";
import { notifyYmsDataChanged } from "./ymsSync";

export const GATE_ID = "G1";
export { notifyYmsDataChanged, YMS_SYNC_EVENT, onYmsDataChanged } from "./ymsSync";

export const ACTIVITY_TABS = [
  "APPROACHING",
  "ARRIVED",
  "CHECKED_IN",
  "WAITING",
  "LOADING_PIPELINE",
  "EXIT_HOLDING",
  "EXIT_VERIFIED",
  "EXITED",
  "REJECTED",
];

export function normalizeQuery(q) {
  return String(q || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export function mapGateContextFromApi(ctx) {
  if (!ctx?.vehicle) return null;
  const vehicle = ctx.vehicle;
  const appointment = ctx.appointment;
  const queue = ctx.queueEntry;
  const journey = ctx.journey || {};
  const materialParts = (appointment?.shipment_reference || "").split("|");
  const material = materialParts.length >= 2 ? materialParts[1] : appointment?.shipment_reference || "—";

  return {
    vehicle,
    appointment,
    queueEntry: queue,
    journey,
    events: ctx.events || [],
    verification: ctx.verification,
    vehicleId: vehicle.id,
    appointmentId: appointment?.id,
    queueEntryId: queue?.id,
    activityTab: ctx.activityTab,
    entryChecks: ctx.entryChecks || [],
    exitChecks: ctx.exitChecks || [],
    entryApproved: ctx.entryApproved,
    exitApproved: ctx.exitApproved,
    gateId: ctx.gateId || GATE_ID,
    display: {
      plate: vehicle.vehicle_number || "—",
      vehicleReference: vehicle.vehicle_reference || "—",
      vehicleType: vehicle.vehicle_type || "—",
      driver: vehicle.driver_name || "—",
      driverPhone: vehicle.driver_phone || "—",
      transporter: vehicle.transporter_name || "—",
      material,
      appointment: appointment?.booking_reference || "—",
      slot: appointment?.scheduled_slot || slotFromReportingTime(appointment?.reporting_time),
      gate: appointment?.gate_number || GATE_ID,
      dock: formatDockLabel(journey?.dock),
      status: vehicle.status || appointment?.status || "—",
      reqType: parseRequestType(appointment?.shipment_reference, appointment?.remarks),
    },
  };
}

export function canApproveEntry(checks) {
  return (checks || []).every((c) => c.passed);
}

export function canApproveExit(checks) {
  return (checks || []).every((c) => c.passed);
}

export async function fetchGateBundle(gateId = GATE_ID) {
  const [dashboard, exitDashboard, exitHolding] = await Promise.all([
    ymsApi.getGateDashboard(gateId),
    ymsApi.gateExitHoldingDashboard(gateId),
    ymsApi.gateExitHolding(gateId),
  ]);
  return {
    kpis: dashboard.kpis,
    exitKpis: exitDashboard.kpis || {},
    activity: dashboard.activity || [],
    exitHolding: exitHolding || [],
    gateId: dashboard.gateId || gateId,
  };
}

export async function lookupGateVehicle(query, gateId = GATE_ID) {
  const ctx = await ymsApi.gateLookup({ query, gate_id: gateId });
  return mapGateContextFromApi(ctx);
}

export async function scanAtGate(query, scanType, gateId = GATE_ID) {
  const ctx = await ymsApi.gateScan({
    query,
    gate_id: gateId,
    scan_type: scanType,
    created_by: "gate-ui",
  });
  return mapGateContextFromApi(ctx);
}

export function generateQueueNumber() {
  return `Q-${Date.now().toString(36).toUpperCase().slice(-7)}`;
}

export async function approveEntry(ctx, options = {}) {
  if (!ctx?.vehicleId) throw new Error("No vehicle selected");
  const gateId = options.gateId || ctx.gateId || GATE_ID;
  const result = await ymsApi.gateApproveEntry(ctx.vehicleId, {
    gate_id: gateId,
    created_by: "gate-ui",
    queue_number: options.queueNumber || generateQueueNumber(),
    queue_type: options.queueType || ctx.display?.reqType || "Loading",
  });
  return mapGateContextFromApi(result);
}

export async function rejectEntry(ctx, reason, gateId = GATE_ID) {
  if (!ctx?.vehicleId) throw new Error("No vehicle selected");
  await ymsApi.gateRejectEntry(ctx.vehicleId, {
    gate_id: gateId,
    reason,
    created_by: "gate-ui",
  });
}

export async function markArrivedAtGate(ctx, gateId = GATE_ID) {
  if (!ctx?.vehicleId) throw new Error("No vehicle selected");
  const result = await ymsApi.gateMarkArrived(ctx.vehicleId, {
    gate_id: gateId,
    created_by: "gate-ui",
  });
  return mapGateContextFromApi(result);
}

export async function fetchExitVerification(vehicleId, gateId = GATE_ID) {
  return ymsApi.gateExitVerificationDetail(vehicleId, gateId);
}

export async function updateExitChecklist(vehicleId, patch, gateId = GATE_ID) {
  return ymsApi.gateUpdateExitChecklist(vehicleId, { gate_id: gateId, ...patch });
}

export async function verifyExit(vehicleId, options = {}) {
  const gateId = options.gateId || GATE_ID;
  return ymsApi.gateVerifyExit(vehicleId, {
    gate_id: gateId,
    created_by: options.createdBy || "gate-ui",
    remarks: options.remarks || null,
  });
}

export async function gateOut(vehicleId, gateId = GATE_ID) {
  return ymsApi.gateGateOut(vehicleId, {
    gate_id: gateId,
    created_by: "gate-ui",
  });
}

export async function rejectExit(ctx, reason, gateId = GATE_ID) {
  if (!ctx?.vehicleId) throw new Error("No vehicle selected");
  await ymsApi.gateRejectExit(ctx.vehicleId, {
    gate_id: gateId,
    reason,
    created_by: "gate-ui",
  });
}

export async function updateExitClearances(vehicleId, patch, gateId = GATE_ID) {
  return updateExitChecklist(vehicleId, patch, gateId);
}

/** @deprecated use approveEntry */
export const approveCheckIn = approveEntry;
/** @deprecated use rejectEntry */
export const rejectCheckIn = rejectEntry;
/** @deprecated use canApproveEntry */
export const canApproveCheckIn = (checks) =>
  canApproveEntry(
    (checks || []).map((c) => ({
      passed: c.state === "pass" || c.state === "warning",
      label: c.label,
    }))
  );

export default {
  fetchGateBundle,
  lookupGateVehicle,
  scanAtGate,
  approveEntry,
  rejectEntry,
  markArrivedAtGate,
  fetchExitVerification,
  updateExitChecklist,
  verifyExit,
  gateOut,
  rejectExit,
  updateExitClearances,
  canApproveEntry,
  canApproveExit,
  GATE_ID,
  ACTIVITY_TABS,
};
