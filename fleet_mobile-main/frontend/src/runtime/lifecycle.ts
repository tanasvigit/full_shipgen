import { subscribeAppState, isForeground } from "@/src/runtime/appState";
import { initConnectivity, subscribeNetwork } from "@/src/runtime/connectivity";
import { flushOfflineQueue } from "@/src/offline/processor";
import { offlineQueue } from "@/src/offline/queue";
import { realtimeClient } from "@/src/realtime/client";
import { realtimeSubscriptions } from "@/src/realtime/subscriptions";
import { triggerScopedResync } from "@/src/realtime/resync";
import { queryClient } from "@/src/query/client";
import { trackingEngine } from "@/src/tracking/engine";
import type { TrackingMode } from "@/src/tracking/policy";
import { logEvent } from "@/src/services/observability";
import { startBackgroundTracking, stopBackgroundTracking } from "@/src/tracking/background/task";
import {
  getRuntimeSession,
  setRuntimeSession,
  type RuntimeSession,
} from "@/src/runtime/session";

export { getRuntimeSession } from "@/src/runtime/session";
export type { RuntimeSession } from "@/src/runtime/session";

let started = false;

export async function startRuntime(next: RuntimeSession) {
  setRuntimeSession(next);
  if (started) {
    await stopRuntime();
  }
  started = true;

  await initConnectivity();
  await offlineQueue.ensureLoaded();

  try {
    await realtimeClient.connect();
    await realtimeSubscriptions.startSession({
      companyUuid: next.companyUuid,
      driverPublicId: next.driverPublicId,
    });
  } catch {
    logEvent("socket.disconnected", { reason: "runtime_start_degraded" });
  }

  await flushOfflineQueue(next.companyUuid);
  await triggerScopedResync(queryClient, next.companyUuid, "runtime.start");
}

export async function stopRuntime() {
  await trackingEngine.stop();
  await realtimeSubscriptions.stopSession();
  realtimeClient.disconnect();
  setRuntimeSession(null);
  started = false;
}

export async function onOrgSwitch(previousCompanyUuid: string | null, next: RuntimeSession) {
  if (previousCompanyUuid) {
    await offlineQueue.purgeTenant(previousCompanyUuid);
  }
  await stopRuntime();
  await startRuntime(next);
}

export function initRuntimeOrchestrator() {
  const unsubNetwork = subscribeNetwork((online) => {
    const current = getRuntimeSession();
    if (!current) return;
    if (online) {
      void realtimeClient.connect().catch(() => undefined);
      void flushOfflineQueue(current.companyUuid).then(() =>
        triggerScopedResync(queryClient, current.companyUuid, "network.online")
      );
    }
  });

  const unsubAppState = subscribeAppState((state) => {
    const current = getRuntimeSession();
    if (!current) return;
    if (isForeground(state)) {
      void realtimeClient.connect().catch(() => undefined);
      void flushOfflineQueue(current.companyUuid);
      void triggerScopedResync(queryClient, current.companyUuid, "app.foreground");
      trackingEngine.setMode("active_trip");
    } else {
      trackingEngine.setMode("background_low_power");
    }
  });

  return () => {
    unsubNetwork();
    unsubAppState();
  };
}

export async function bindTrackingOrder(orderId: string, mode: TrackingMode = "active_trip") {
  const current = getRuntimeSession();
  if (!current) return;
  current.activeOrderId = orderId;
  await trackingEngine.start(orderId, current.companyUuid, current.userId, mode);
  await startBackgroundTracking(orderId);
}

export async function unbindTracking() {
  const current = getRuntimeSession();
  if (current) {
    current.activeOrderId = undefined;
  }
  await stopBackgroundTracking();
  await trackingEngine.stop();
}
