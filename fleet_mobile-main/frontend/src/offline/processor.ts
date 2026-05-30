import { offlineQueue } from "@/src/offline/queue";
import type { QueueItem } from "@/src/offline/types";
import { isRetryableError, nextRetryDelayMs, shouldDeadLetter } from "@/src/offline/retryPolicy";
import { getNetworkOnline, refreshNetworkState } from "@/src/offline/network";
import { workflowService } from "@/src/services/workflowService";
import { trackingService } from "@/src/services/trackingService";
import { podService } from "@/src/services/podService";
import { captureError, logEvent } from "@/src/services/observability";
import { resolveConflictFromError } from "@/src/offline/conflicts/resolver";

let flushing = false;

async function executeItem(item: QueueItem) {
  const orderId = String(item.payload.orderId || "");

  switch (item.type) {
    case "workflow.start":
      await workflowService.start(orderId);
      return;
    case "workflow.advance":
      await workflowService.advance(orderId, String(item.payload.activityCode || ""));
      return;
    case "workflow.complete":
      await workflowService.complete(orderId);
      return;
    case "tracking.upload":
      await trackingService.uploadOrderLocation(
        orderId,
        Number(item.payload.latitude),
        Number(item.payload.longitude)
      );
      return;
    case "pod.signature":
      await podService.captureSignature(orderId, String(item.payload.value || ""));
      return;
    case "pod.photo":
      await podService.capturePhoto(orderId, String(item.payload.value || ""));
      return;
    case "pod.qr":
      await podService.captureQr(orderId, String(item.payload.value || ""));
      return;
    default:
      throw new Error(`Unsupported queue item type: ${item.type}`);
  }
}

export async function flushOfflineQueue(companyUuid?: string) {
  if (flushing) return { processed: 0, failed: 0 };
  const online = getNetworkOnline() || (await refreshNetworkState());
  if (!online) return { processed: 0, failed: 0 };

  flushing = true;
  logEvent("queue.flush.started", { companyUuid });

  let processed = 0;
  let failed = 0;

  try {
    await offlineQueue.ensureLoaded();
    const pending = offlineQueue.getPending(companyUuid).sort((a, b) => a.createdAt - b.createdAt);

    for (const item of pending) {
      await offlineQueue.updateState(item.id, "syncing", { lastAttemptAt: Date.now() });
      try {
        await executeItem(item);
        await offlineQueue.remove(item.id);
        processed += 1;
      } catch (error) {
        failed += 1;
        const retries = item.retries + 1;
        const orderId = String(item.payload.orderId || "");

        if (!isRetryableError(error)) {
          await resolveConflictFromError({
            companyUuid: item.companyUuid,
            orderId,
            queueItemId: item.id,
            error,
          });
          await offlineQueue.updateState(item.id, "dead-letter", { retries });
        } else if (shouldDeadLetter(retries)) {
          await offlineQueue.updateState(item.id, "dead-letter", { retries });
        } else {
          await offlineQueue.updateState(item.id, "failed", { retries });
          await new Promise((resolve) => setTimeout(resolve, nextRetryDelayMs(retries)));
        }
        captureError(error, { operation: "queue.flush", itemId: item.id, type: item.type });
      }
    }
  } finally {
    flushing = false;
    logEvent("queue.flush.completed", { companyUuid, processed, failed });
  }

  return { processed, failed };
}

export async function enqueueOfflineItem(input: Parameters<typeof offlineQueue.enqueue>[0]) {
  const item = await offlineQueue.enqueue(input);
  const online = getNetworkOnline() || (await refreshNetworkState());
  if (online) {
    void flushOfflineQueue(input.companyUuid);
  }
  return item;
}
