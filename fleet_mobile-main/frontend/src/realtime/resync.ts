import type { QueryClient } from "@tanstack/react-query";
import { invalidateFleetAggregate, invalidateOrderLists, refreshOrderScope } from "@/src/query/invalidation";
import { logEvent } from "@/src/services/observability";

type StaleState = {
  lastResyncAt: number;
  lastOrderResyncAt: number;
};

const state: StaleState = {
  lastResyncAt: 0,
  lastOrderResyncAt: 0,
};

const DEBOUNCE_MS = 1_500;

export function getResyncTimestamps() {
  return { ...state };
}

export async function triggerScopedResync(
  queryClient: QueryClient,
  companyUuid: string | null,
  reason: string,
  orderRef?: string
) {
  if (!companyUuid) return;
  const now = Date.now();
  if (now - state.lastResyncAt < DEBOUNCE_MS) return;

  state.lastResyncAt = now;
  logEvent("resync.triggered", { reason, companyUuid, orderRef });

  const tasks: Promise<unknown>[] = [invalidateOrderLists(queryClient, companyUuid), invalidateFleetAggregate(queryClient, companyUuid)];

  if (orderRef) {
    const orderGap = now - state.lastOrderResyncAt;
    if (orderGap >= DEBOUNCE_MS) {
      state.lastOrderResyncAt = now;
      tasks.push(refreshOrderScope(queryClient, companyUuid, orderRef));
    }
  }

  await Promise.all(tasks);
  logEvent("resync.completed", { reason, companyUuid, orderRef });
}
