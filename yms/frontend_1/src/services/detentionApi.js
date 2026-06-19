/**
 * Detention reporting — live costs derived from queue/yard events; workflow in backend.
 */

import ymsApi, { formatApiError, API_BASE } from "./ymsApi";
import { notifyYmsDataChanged } from "./gateManagementApi";
import { formatINR } from "./controlTowerApi";
import { matchesAnyValues } from "../utils/search";

export { formatINR };

export function mapDetentionRow(row) {
  return {
    detentionId: row.id,
    id: row.detention_ref,
    plate: row.plate,
    category: row.category,
    transporter: row.transporter,
    freeHours: Number(row.free_hours),
    actualHours: Number(row.actual_hours),
    rate: row.rate,
    cost: row.cost,
    status: row.status,
    date: typeof row.billing_date === "string" ? row.billing_date : String(row.billing_date).slice(0, 10),
    remarks: row.remarks,
    isEstimated: row.is_estimated,
    vehicleId: row.vehicle_id,
    queueEntryId: row.queue_entry_id,
    appointmentId: row.appointment_id,
    raw: row,
  };
}

export function filterRecords(records, { search, statusFilter, dateFilter }) {
  let list = records;
  const q = (search || "").trim().toLowerCase();

  if (statusFilter && statusFilter !== "all") {
    const statusMap = {
      approved: "Approved",
      disputed: "Disputed",
      pending: "Pending",
      paid: "Paid",
      reviewed: "Reviewed",
    };
    const target = statusMap[statusFilter.toLowerCase()] || statusFilter;
    list = list.filter((r) => r.status === target);
  }

  if (dateFilter === "today") {
    const today = new Date().toISOString().slice(0, 10);
    list = list.filter((r) => r.date === today);
  } else if (dateFilter === "mtd") {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    list = list.filter((r) => r.date >= monthStart);
  }

  if (q) {
    list = list.filter((r) =>
      matchesAnyValues([r.id, r.plate, r.category, r.transporter, r.status, r.date], q)
    );
  }

  return [...list].sort((a, b) => b.cost - a.cost);
}

export function toExportRows(records) {
  return records.map((r) => ({
    ticket: r.id,
    plate: r.plate,
    category: r.category,
    transporter: r.transporter,
    freeHours: `${r.freeHours}h`,
    actualHours: `${r.actualHours}h`,
    rate: `Rs ${r.rate}`,
    cost: `Rs ${r.cost.toLocaleString("en-IN")}`,
    status: r.status,
    date: r.date,
    remarks: r.remarks || "",
  }));
}

export function buildInvoicePayload(record) {
  return {
    detentionRef: record.id,
    plate: record.plate,
    transporter: record.transporter,
    category: record.category,
    billingDate: record.date,
    freeHours: record.freeHours,
    actualHours: record.actualHours,
    billableHours: Math.max(0, record.actualHours - record.freeHours),
    ratePerHour: record.rate,
    totalInr: record.cost,
    status: record.status,
    estimated: record.isEstimated,
    formula: "(ActualWaitTime - FreeWaitTime) × Rate",
  };
}

export async function fetchDetentionBundle() {
  const url = `${API_BASE}/detention`;
  try {
    const data = await ymsApi.getDetentionDashboard();
    return {
      records: (data.records || []).map(mapDetentionRow),
      summary: data.summary,
      config: data.config,
    };
  } catch (err) {
    const message = formatApiError(err, url);
    const wrapped = new Error(message);
    wrapped.status = err.status;
    wrapped.url = url;
    wrapped.cause = err;
    throw wrapped;
  }
}

export async function fetchDetentionDetail(detentionId) {
  const row = await ymsApi.getDetention(detentionId);
  const mapped = mapDetentionRow(row);
  return { ...mapped, events: row.events || [] };
}

async function afterMutation() {
  notifyYmsDataChanged();
}

export async function approveRecord(detentionId, remarks) {
  const result = await ymsApi.updateDetentionStatus(detentionId, { status: "Approved", remarks });
  await afterMutation();
  return result;
}

export async function disputeRecord(detentionId, remarks) {
  const result = await ymsApi.updateDetentionStatus(detentionId, { status: "Disputed", remarks });
  await afterMutation();
  return result;
}

export async function markReviewed(detentionId, remarks) {
  const result = await ymsApi.updateDetentionStatus(detentionId, { status: "Reviewed", remarks });
  await afterMutation();
  return result;
}

export async function markPaid(detentionId, remarks) {
  const result = await ymsApi.updateDetentionStatus(detentionId, { status: "Paid", remarks });
  await afterMutation();
  return result;
}

export default {
  fetchDetentionBundle,
  fetchDetentionDetail,
  filterRecords,
  toExportRows,
  buildInvoicePayload,
  approveRecord,
  disputeRecord,
  markReviewed,
  markPaid,
  formatINR,
};
