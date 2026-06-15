import * as Location from "expo-location";
import type { TrackingMode } from "@/src/tracking/policy";
import { resolveTrackingPolicy } from "@/src/tracking/policy";
import { ensureForegroundLocationPermission } from "@/src/tracking/permissions";
import { shouldAcceptPoint, type TrackPoint } from "@/src/tracking/batching";
import { uploadTrackPoint } from "@/src/tracking/uploader";
import { isLocationTrackingEnabled } from "@/src/utils/preferences";

type EngineContext = {
  companyUuid: string;
  userId: string;
  driverId: string;
  orderId: string;
};

class TrackingEngine {
  private timer: ReturnType<typeof setInterval> | null = null;
  private mode: TrackingMode = "idle";
  private context: EngineContext | null = null;
  private lastPoint: TrackPoint | null = null;

  getState() {
    return {
      mode: this.mode,
      orderId: this.context?.orderId || null,
      running: Boolean(this.timer),
      lastPoint: this.lastPoint,
    };
  }

  async start(orderId: string, companyUuid: string, userId: string, driverId: string, mode: TrackingMode = "active_trip") {
    if (!(await isLocationTrackingEnabled())) return;
    await this.stop();
    this.context = { companyUuid, userId, driverId, orderId };
    this.mode = mode;
    const policy = resolveTrackingPolicy(mode);
    if (policy.intervalMs <= 0) return;

    const granted = await ensureForegroundLocationPermission();
    if (!granted) return;

    await this.#tick();
    this.timer = setInterval(() => {
      void this.#tick();
    }, policy.intervalMs);
  }

  async stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.mode = "idle";
    this.context = null;
    this.lastPoint = null;
  }

  setMode(mode: TrackingMode) {
    if (!this.context) return;
    const { orderId, companyUuid, userId, driverId } = this.context;
    void this.start(orderId, companyUuid, userId, driverId, mode);
  }

  async #tick() {
    if (!this.context) return;

    let latitude: number | null = null;
    let longitude: number | null = null;

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      latitude = position.coords.latitude;
      longitude = position.coords.longitude;
    } catch {
      return;
    }

    if (latitude === null || longitude === null) return;

    const point: TrackPoint = {
      latitude,
      longitude,
      capturedAt: Date.now(),
    };

    if (!shouldAcceptPoint(this.lastPoint, point)) return;
    this.lastPoint = point;

    try {
      await uploadTrackPoint({
        companyUuid: this.context.companyUuid,
        userId: this.context.userId,
        driverId: this.context.driverId,
        orderId: this.context.orderId,
        point,
      });
    } catch {
      // uploadTrackPoint queues retries; avoid unhandled rejections on tick.
    }
  }
}

export const trackingEngine = new TrackingEngine();
