import { enqueueOfflineItem } from "@/src/offline/processor";
import { getNetworkOnline } from "@/src/offline/network";
import { isRetryableError } from "@/src/offline/retryPolicy";
import type { QueueItemType } from "@/src/offline/types";

export async function runOrQueue<T>(params: {
  companyUuid: string;
  userId: string;
  type: QueueItemType;
  payload: Record<string, unknown>;
  dedupeKey?: string;
  execute: () => Promise<T>;
}) {
  if (!getNetworkOnline()) {
    await enqueueOfflineItem({
      companyUuid: params.companyUuid,
      userId: params.userId,
      type: params.type,
      payload: params.payload,
      dedupeKey: params.dedupeKey,
    });
    return { queued: true as const, result: null };
  }

  try {
    const result = await params.execute();
    return { queued: false as const, result };
  } catch (error) {
    if (!isRetryableError(error)) throw error;
    await enqueueOfflineItem({
      companyUuid: params.companyUuid,
      userId: params.userId,
      type: params.type,
      payload: params.payload,
      dedupeKey: params.dedupeKey,
    });
    return { queued: true as const, result: null };
  }
}
