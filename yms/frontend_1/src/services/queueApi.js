/**
 * Virtual Queue — enriched metrics, overrides, and drawer detail.
 */

import { request } from "./ymsApi";
import { notifyYmsDataChanged } from "./gateManagementApi";

export const QUEUE_DISPLAY_STATUSES = [
  "WAITING",
  "READY_TO_CALL",
  "CALLED",
  "REPORTING_TO_DOCK",
  "DOCK_ASSIGNED",
  "RESOURCE_PENDING",
  "READY_FOR_LOADING",
];

export const DETENTION_RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export const QUEUE_AGING_LEVELS = ["NORMAL", "WARNING", "CRITICAL"];

export function riskAccent(level) {
  switch (level) {
    case "CRITICAL":
      return "danger";
    case "HIGH":
      return "danger";
    case "MEDIUM":
      return "warning";
    default:
      return "success";
  }
}

export function agingAccent(level) {
  switch (level) {
    case "CRITICAL":
      return "danger";
    case "WARNING":
      return "warning";
    default:
      return "success";
  }
}

export function mapQueueRow(row) {
  if (!row) return null;
  return {
    id: row.queueEntryId,
    queueEntryId: row.queueEntryId,
    vehicleId: row.vehicleId,
    appointmentId: row.appointmentId,
    dockId: row.dockId,
    plate: row.plate || "—",
    transporter: row.transporter || "—",
    category: row.category || "Outside",
    material: row.material || "—",
    bookingRef: row.bookingRef || "—",
    vehicleType: row.vehicleType || "—",
    waitingMin: row.waitingMin ?? 0,
    detentionCost: row.detentionCost ?? 0,
    detentionRisk: row.detentionRisk || "LOW",
    queueAging: row.queueAging || "NORMAL",
    zone: row.gateNumber || "—",
    dockCode: row.dockCode || "—",
    status: row.displayStatus || row.status,
    displayStatus: row.displayStatus || row.status,
    vehicleStatus: row.vehicleStatus,
    priorityScore: row.priorityScore ?? 0,
    queueRank: row.queueRank ?? 0,
    queueNumber: row.queueNumber,
    queueType: row.queueType,
    expectedCallTime: row.expectedCallTime,
    laborTeam: row.laborTeam,
    equipment: row.equipment,
    recommendedDock: row.recommendedDock,
    checkinTime: row.checkinTime,
  };
}

export async function fetchQueueBundle() {
  const data = await request("/queue/bundle");
  return {
    entries: (data.entries || []).map(mapQueueRow),
    summary: data.summary || {},
  };
}

export async function getQueueEntryDetail(queueEntryId) {
  return request(`/queue/entries/${queueEntryId}/detail`);
}

export async function overrideQueueEntry(queueEntryId, { targetRank, reason, supervisor }) {
  const result = await request(`/queue/entries/${queueEntryId}/override`, {
    method: "POST",
    body: JSON.stringify({
      target_rank: targetRank,
      reason,
      supervisor,
      created_by: "supervisor",
    }),
  });
  notifyYmsDataChanged();
  return result;
}

export default {
  fetchQueueBundle,
  getQueueEntryDetail,
  overrideQueueEntry,
  mapQueueRow,
  QUEUE_DISPLAY_STATUSES,
};
