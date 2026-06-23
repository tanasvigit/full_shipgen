import { ymsRequest } from "@/src/lib/ymsApi";

export type DetentionRow = {
  id: string;
  detentionRef: string;
  plate: string;
  transporter: string;
  status: string;
  cost: number;
  actualHours: number;
  category: string;
  billingDate?: string | null;
  remarks?: string | null;
};

export type DetentionBundle = {
  records: DetentionRow[];
  summary: {
    today: number;
    disputedCount: number;
    recordCount: number;
  };
};

export { canUpdateDetentionStatus, DETENTION_STATUS_OPTIONS } from "@/src/lib/detentionActions";

function mapDetentionRow(row: Record<string, unknown>): DetentionRow {
  return {
    id: String(row.id),
    detentionRef: String(row.detention_ref || row.detentionRef || "—"),
    plate: String(row.plate || row.vehicle_number || "—"),
    transporter: String(row.transporter || row.transporter_name || "—"),
    status: String(row.status || "Pending"),
    cost: Number(row.cost ?? 0),
    actualHours: Number(row.actual_hours ?? row.actualHours ?? 0),
    category: String(row.category || "—"),
    billingDate: row.billing_date
      ? String(row.billing_date).slice(0, 10)
      : row.billingDate
        ? String(row.billingDate).slice(0, 10)
        : null,
    remarks: row.remarks ? String(row.remarks) : null,
  };
}

export async function fetchDetentionBundle(): Promise<DetentionBundle> {
  const payload = await ymsRequest<{
    records?: Record<string, unknown>[];
    summary?: Record<string, unknown>;
  }>("/detention");

  const records = (payload?.records ?? []).map(mapDetentionRow);
  const summary = payload?.summary ?? {};

  return {
    records,
    summary: {
      today: Number(summary.today ?? 0),
      disputedCount: Number(summary.disputedCount ?? summary.disputed_count ?? 0),
      recordCount: Number(summary.recordCount ?? summary.record_count ?? records.length),
    },
  };
}

export async function updateDetentionStatus(detentionId: string, status: string, remarks?: string) {
  const row = await ymsRequest<Record<string, unknown>>(`/detention/${detentionId}/status`, {
    method: "PATCH",
    body: {
      status,
      remarks: remarks?.trim() || undefined,
      created_by: "mobile-detention",
    },
  });
  return mapDetentionRow(row);
}
