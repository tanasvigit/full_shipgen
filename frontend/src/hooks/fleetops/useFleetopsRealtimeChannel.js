import { useEffect, useRef } from "react";
import { fleetopsRealtimeManager } from "@/domain/fleetops/realtime/registry";

/**
 * Lifecycle-managed channel subscription with automatic unsubscribe.
 */
export function useFleetopsRealtimeChannel(channelId, onMessage, options = {}) {
  const { enabled = true, debounceMs = 0, pollIntervalMs = 0 } = options;
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    if (!enabled || !channelId) return undefined;

    const unsubscribe = fleetopsRealtimeManager.subscribe(
      channelId,
      (msg, ctx) => {
        if (handlerRef.current) handlerRef.current(msg, ctx);
      },
      { debounceMs, pollIntervalMs },
    );

    return unsubscribe;
  }, [channelId, enabled, debounceMs, pollIntervalMs]);
}
