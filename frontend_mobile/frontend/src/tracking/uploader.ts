import { enqueueOfflineItem } from "@/src/offline/processor";
import { isPermissionDenied } from "@/src/lib/api";
import { trackingService } from "@/src/services/trackingService";
import { getNetworkOnline } from "@/src/offline/network";
import { logEvent } from "@/src/services/observability";
import type { TrackPoint } from "@/src/tracking/batching";

export async function uploadTrackPoint(params: {
  companyUuid: string;
  userId: string;
  driverId: string;
  orderId: string;
  point: TrackPoint;
}) {
  const { companyUuid, userId, driverId, orderId, point } = params;
  const dedupeKey = `tracking:${companyUuid}:${driverId}:${Math.round(point.latitude * 1000)}:${Math.round(point.longitude * 1000)}`;

  if (!getNetworkOnline()) {
    await enqueueOfflineItem({
      companyUuid,
      userId,
      type: "tracking.upload",
      payload: {
        driverId,
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
    await trackingService.uploadDriverLocation(driverId, point.latitude, point.longitude);
    logEvent("tracking.batch.upload", {
      orderId,
      latencyMs: Date.now() - started,
      queued: false,
    });
    return { queued: false };
  } catch (error) {
    const status = (error as { status?: number })?.status;
    const payload = (error as { payload?: unknown })?.payload;
    if (status && isPermissionDenied(status, payload)) {
      logEvent("tracking.upload.permission_denied", { driverId, orderId, status });
      return { queued: false, skipped: true };
    }

    await enqueueOfflineItem({
      companyUuid,
      userId,
      type: "tracking.upload",
      payload: {
        driverId,
        orderId,
        latitude: point.latitude,
        longitude: point.longitude,
      },
      dedupeKey,
    });
    throw error;
  }
}
