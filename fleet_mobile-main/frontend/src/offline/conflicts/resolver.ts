import { storage } from "@/src/utils/storage";
import {
  classifyConflict,
  conflictMessage,
  type ConflictKind,
  type ConflictRecord,
} from "@/src/offline/conflicts/policies";
import { logEvent } from "@/src/services/observability";

const CONFLICTS_KEY = "fleet_mobile.offline.conflicts";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function listConflicts(companyUuid?: string) {
  const rows = await storage.getItem<ConflictRecord[]>(CONFLICTS_KEY, []);
  if (!companyUuid) return rows;
  return rows.filter((row) => row.companyUuid === companyUuid);
}

export async function recordConflict(input: {
  companyUuid: string;
  orderId?: string;
  kind: ConflictKind;
  queueItemId?: string;
}) {
  const rows = await listConflicts();
  const record: ConflictRecord = {
    id: createId(),
    companyUuid: input.companyUuid,
    orderId: input.orderId,
    kind: input.kind,
    message: conflictMessage(input.kind),
    createdAt: Date.now(),
    queueItemId: input.queueItemId,
  };
  rows.unshift(record);
  await storage.setItem(CONFLICTS_KEY, rows.slice(0, 50));
  logEvent("sync.conflict", { kind: input.kind, orderId: input.orderId });
  return record;
}

export async function resolveConflictFromError(params: {
  companyUuid: string;
  orderId?: string;
  queueItemId?: string;
  error: unknown;
}) {
  const kind = classifyConflict(params.error);
  if (!kind) return null;
  return recordConflict({
    companyUuid: params.companyUuid,
    orderId: params.orderId,
    kind,
    queueItemId: params.queueItemId,
  });
}

export async function clearConflict(id: string) {
  const rows = await listConflicts();
  await storage.setItem(
    CONFLICTS_KEY,
    rows.filter((row) => row.id !== id)
  );
}

export async function clearConflictsForTenant(companyUuid: string) {
  const rows = await listConflicts();
  await storage.setItem(
    CONFLICTS_KEY,
    rows.filter((row) => row.companyUuid !== companyUuid)
  );
}
