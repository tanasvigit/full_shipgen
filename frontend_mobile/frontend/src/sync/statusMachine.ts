import { getNetworkOnline } from "@/src/offline/network";
import { realtimeClient } from "@/src/realtime/client";
import { getRuntimeSession } from "@/src/runtime/session";
import { trackingEngine } from "@/src/tracking/engine";
import { isLocationTrackingEnabledSync } from "@/src/utils/preferences";

export type SyncConnectivity = "online" | "offline";
export type SyncRealtime = "connected" | "degraded" | "idle";
export type SyncQueue = "idle" | "pending" | "syncing" | "failed";

export type SyncSnapshot = {
  connectivity: SyncConnectivity;
  realtime: SyncRealtime;
  queue: SyncQueue;
  pendingCount: number;
  deadLetterCount: number;
  trackingPaused: boolean;
  label: string;
  severity: "ok" | "warn" | "error";
};

export function shouldExpectTrackingRunning() {
  const session = getRuntimeSession();
  if (!session?.activeOrderId) return false;
  const driverId = session.driverTrackId || session.driverPublicId;
  if (!driverId) return false;
  return isLocationTrackingEnabledSync();
}

export function deriveSyncSnapshot(input: {
  pendingCount: number;
  deadLetterCount: number;
  syncing: boolean;
  trackingRunning: boolean;
  trackingExpected?: boolean;
}) {
  const online = getNetworkOnline();
  const socket = realtimeClient.getStatus().state;

  const connectivity: SyncConnectivity = online ? "online" : "offline";
  const realtime: SyncRealtime =
    socket === "connected" ? "connected" : socket === "degraded" ? "degraded" : "idle";

  let queue: SyncQueue = "idle";
  if (input.syncing) queue = "syncing";
  else if (input.deadLetterCount > 0) queue = "failed";
  else if (input.pendingCount > 0) queue = "pending";

  const trackingExpected = input.trackingExpected ?? shouldExpectTrackingRunning();
  const trackingPaused = trackingExpected && !input.trackingRunning;

  let label = "All changes synced";
  let severity: SyncSnapshot["severity"] = "ok";

  if (connectivity === "offline") {
    label = `Offline mode · ${input.pendingCount} pending`;
    severity = "warn";
  } else if (queue === "syncing") {
    label = "Syncing changes...";
    severity = "warn";
  } else if (queue === "pending") {
    label = `Sync pending (${input.pendingCount})`;
    severity = "warn";
  } else if (queue === "failed") {
    label = `Sync failed (${input.deadLetterCount})`;
    severity = "error";
  } else if (realtime === "degraded") {
    label = "Realtime disconnected · using refresh fallback";
    severity = "warn";
  } else if (trackingPaused) {
    label = "Tracking paused";
    severity = "warn";
  }

  return {
    connectivity,
    realtime,
    queue,
    pendingCount: input.pendingCount,
    deadLetterCount: input.deadLetterCount,
    trackingPaused,
    label,
    severity,
  } satisfies SyncSnapshot;
}

export function getTrackingRunning() {
  return trackingEngine.getState().running;
}
