import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { orderChannelId } from "@/domain/fleetops/realtime/socketConfig";
import { useFleetopsRealtimeChannel } from "@/hooks/fleetops/useFleetopsRealtimeChannel";
import { createSyntheticEvent, normalizeOperationalEvents } from "@/domain/fleetops/events/transformers";

const LIVE_EVENTS = new Set([
  "order.updated",
  "order.dispatched",
  "order.started",
  "order.completed",
  "order.canceled",
  "order.cancelled",
  "order.tracking_updated",
  "order.location_updated",
  "order.driver_changed",
  "order.vehicle_changed",
  "order.proof_uploaded",
  "order.comment_added",
  "order.delay_detected",
  "waypoint.activity",
  "entity.activity",
  "order.assigned",
  "order.webhook_failed",
  "order.webhook_retried",
]);

/**
 * Order drawer realtime — timeline inserts, refetch triggers, SLA/ETA refresh signals.
 */
export function useOrderRealtime({ rawOrder, enabled, onRefetch, debounceMs = 300 }) {
  const [liveEvents, setLiveEvents] = useState([]);
  const [syncState, setSyncState] = useState("synced");
  const channel = rawOrder ? orderChannelId(rawOrder) : null;

  const handleMessage = useCallback(
    (message) => {
      const event = message?.event || message?.type;
      if (!event) return;

      if (message._synthetic || event === "poll.tick") {
        setSyncState("polling");
        onRefetch?.();
        return;
      }

      setSyncState("live");

      const toastMessages = {
        "order.dispatched": "Order dispatched",
        "order.driver_changed": "Driver assignment updated",
        "order.assigned": "Driver assigned",
        "order.completed": "Delivery completed",
        "order.canceled": "Order canceled",
        "order.cancelled": "Order canceled",
        "order.proof_uploaded": "Proof uploaded",
        "order.comment_added": "New comment",
      };
      if (toastMessages[event]) {
        toast.info(toastMessages[event], { duration: 3500 });
      }

      if (LIVE_EVENTS.has(event) || String(event).startsWith("order.")) {
        const normalized = normalizeOperationalEvents([
          {
            code: event.replace(/^order\./, ""),
            title: message?.data?.title || event.replace(/\./g, " "),
            created_at: message?.data?.created_at || new Date().toISOString(),
            detail: message?.data?.description || JSON.stringify(message?.data || {}),
            properties: message?.data,
          },
        ]);
        if (normalized.length) {
          setLiveEvents((prev) => [...normalized, ...prev].slice(0, 200));
        }
      }

      const reloadable =
        event === "order.updated" ||
        [
          "order.completed",
          "order.created",
          "order.dispatched",
          "order.started",
          "order.canceled",
          "order.cancelled",
          "order.driver_changed",
          "order.assigned",
          "order.vehicle_changed",
          "order.tracking_updated",
          "order.location_updated",
          "waypoint.activity",
          "entity.activity",
        ].includes(event);

      if (reloadable) {
        onRefetch?.();
      }
    },
    [onRefetch],
  );

  useFleetopsRealtimeChannel(channel, handleMessage, {
    enabled: enabled && Boolean(channel),
    debounceMs,
    pollIntervalMs: channel ? 20000 : 0,
  });

  useEffect(() => {
    if (!enabled) setLiveEvents([]);
  }, [enabled, rawOrder?.uuid, rawOrder?.id]);

  return { liveEvents, syncState, channel };
}
