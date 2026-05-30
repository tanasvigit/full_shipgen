import { enqueueOfflineItem } from "@/src/offline/processor";
import { trackingService } from "@/src/services/trackingService";
import { getNetworkOnline } from "@/src/offline/network";
import { logEvent } from "@/src/services/observability";
import type { TrackPoint } from "@/src/tracking/batching";

export async function uploadTrackPoint(params: {
  companyUuid: string;
  userId: string;
  orderId: string;
  point: TrackPoint;
}) {
  const { companyUuid, userId, orderId, point } = params;
  const dedupeKey = `tracking:${companyUuid}:${orderId}:${Math.round(point.latitude * 1000)}:${Math.round(point.longitude * 1000)}`;

  if (!getNetworkOnline()) {
    await enqueueOfflineItem({
      companyUuid,
      userId,
      type: "tracking.upload",
      payload: {
        orderId,
        latitude: point.latitude,
        longitude: point.longitude,
      },
      dedupeKey,
    });
    return { queued: true };
  }

  const started = Date.now();
  try {
    await trackingService.uploadOrderLocation(orderId, point.latitude, point.longitude);
    logEvent("tracking.batch.upload", {
      orderId,
      latencyMs: Date.now() - started,
      queued: false,
    });
    return { queued: false };
  } catch (error) {
    await enqueueOfflineItem({
      companyUuid,
      userId,
      type: "tracking.upload",
      payload: {
        orderId,
        latitude: point.latitude,
        longitude: point.longitude,
      },
      dedupeKey,
    });
    throw error;
  }
}
