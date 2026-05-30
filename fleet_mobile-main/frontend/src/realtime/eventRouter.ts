export type RealtimeEventName =
  | "order.updated"
  | "order.completed"
  | "order.canceled"
  | "driver.assigned"
  | "driver.unassigned"
  | "tracking.updated"
  | "notification.created"
  | "unknown";

export type RealtimeMessage = {
  event: RealtimeEventName;
  rawEvent: string;
  data: Record<string, unknown>;
  channelId: string;
};

const EVENT_MAP: Record<string, RealtimeEventName> = {
  "order.updated": "order.updated",
  "order.completed": "order.completed",
  "order.canceled": "order.canceled",
  "order.cancelled": "order.canceled",
  "order.driver_assigned": "driver.assigned",
  "order.assigned": "driver.assigned",
  "order.driver_unassigned": "order.updated",
  "order.dispatched": "order.updated",
  "order.started": "order.updated",
  "order.tracking_updated": "tracking.updated",
  "order.location_updated": "tracking.updated",
  "tracking.updated": "tracking.updated",
  "notification.created": "notification.created",
};

export function normalizeRealtimeMessage(channelId: string, message: unknown): RealtimeMessage | null {
  const envelope = message as { event?: string; type?: string; data?: Record<string, unknown> };
  const rawEvent = String(envelope?.event || envelope?.type || "");
  if (!rawEvent) return null;

  const mapped = EVENT_MAP[rawEvent] || (rawEvent.startsWith("order.") ? "order.updated" : "unknown");

  return {
    event: mapped,
    rawEvent,
    data: (envelope?.data || {}) as Record<string, unknown>,
    channelId,
  };
}
