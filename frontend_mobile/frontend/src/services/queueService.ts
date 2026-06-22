import { ymsRequest } from "@/src/lib/ymsApi";
import { summarizeDockAvailability } from "@/src/lib/queueActions";

export const QUEUE_CREATED_BY = "mobile-queue";

export type RecommendedDock = {
  dockId?: string;
  dockCode?: string;
  dockName?: string;
  score?: number;
  reason?: string;
  reasons?: string[];
};

export type QueueEntryRow = {
  queueEntryId: string;
  vehicleId?: string;
  appointmentId?: string;
  dockId?: string | null;
  plate?: string;
  transporter?: string;
  displayStatus?: string;
  queueRank?: number;
  waitingMin?: number;
  priorityScore?: number;
  status?: string;
  dockCode?: string;
  material?: string;
  bookingRef?: string;
  queueNumber?: string;
  recommendedDock?: RecommendedDock | null;
};

export type DockOption = {
  id: string;
  dockCode: string;
  dockName?: string;
  status?: string;
  zone?: string;
};

export type DockAvailabilitySummary = {
  available: number;
  occupied: number;
  delayed: number;
  maintenance: number;
  total: number;
};

export function parseYmsList(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items as Record<string, unknown>[];
    if (Array.isArray(record.data)) return record.data as Record<string, unknown>[];
  }
  return [];
}

function mapDock(row: Record<string, unknown>): DockOption {
  return {
    id: String(row.id),
    dockCode: String(row.dock_code || row.dockCode || "—"),
    dockName: String(row.dock_name || row.dockName || ""),
    status: String(row.status || ""),
    zone: row.zone ? String(row.zone) : undefined,
  };
}

export async function fetchDocks(limit = 100) {
  const payload = await ymsRequest<unknown>(`/docks?limit=${limit}`);
  return parseYmsList(payload).map(mapDock);
}

export async function fetchAvailableDocks() {
  const payload = await ymsRequest<unknown>(`/docks?status=AVAILABLE&limit=100`);
  return parseYmsList(payload).map(mapDock);
}

export async function callQueueEntry(queueEntryId: string) {
  return ymsRequest<Record<string, unknown>>(`/flow/queue-entries/${queueEntryId}/call`, {
    method: "POST",
    body: {},
  });
}

export async function assignDockToQueueEntry(queueEntryId: string, dockId: string) {
  return ymsRequest<Record<string, unknown>>(`/flow/queue-entries/${queueEntryId}/assign-dock`, {
    method: "POST",
    body: { dock_id: dockId },
  });
}

export async function fetchQueueEntryDetail(queueEntryId: string) {
  return ymsRequest<Record<string, unknown>>(`/queue/entries/${queueEntryId}/detail`);
}

export async function overrideQueueEntry(
  queueEntryId: string,
  input: { targetRank: number; reason: string; supervisor: string },
) {
  return ymsRequest<Record<string, unknown>>(`/queue/entries/${queueEntryId}/override`, {
    method: "POST",
    body: {
      target_rank: input.targetRank,
      reason: input.reason.trim(),
      supervisor: input.supervisor.trim(),
      created_by: QUEUE_CREATED_BY,
    },
  });
}
