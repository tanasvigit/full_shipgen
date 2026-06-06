import { useCallback, useEffect, useState } from "react";
import { bindTrackingOrder, unbindTracking } from "@/src/runtime/lifecycle";
import { trackingEngine } from "@/src/tracking/engine";
import type { TrackingMode } from "@/src/tracking/policy";

export function useTrackingEngine(orderId?: string, mode: TrackingMode = "active_trip") {
  const [status, setStatus] = useState("idle");

  const sync = useCallback(() => {
    const state = trackingEngine.getState();
    setStatus(state.running ? "syncing" : "idle");
  }, []);

  useEffect(() => {
    if (!orderId) {
      void unbindTracking();
      setStatus("idle");
      return;
    }

    void bindTrackingOrder(orderId, mode).then(sync);
    const timer = setInterval(sync, 2_000);

    return () => {
      clearInterval(timer);
      void unbindTracking();
    };
  }, [mode, orderId, sync]);

  return {
    status,
    engineState: trackingEngine.getState(),
    syncNow: sync,
  };
}
