/** Status buckets aligned with console ORDER_TRANSITIONS — backend is source of truth. */

export const ASSIGNED_STATUSES = ["created", "dispatched", "assigned", "scheduled"] as const;
export const ACTIVE_STATUSES = ["en_route", "arrived", "delivered", "in_transit", "started"] as const;
export const COMPLETED_STATUSES = ["completed", "canceled", "cancelled"] as const;

export type DriverOrderBucket = "assigned" | "active" | "completed";

export function normalizeStatus(status: string) {
  return String(status || "created").toLowerCase().replace(/\s+/g, "_");
}

export function orderBucket(status: string): DriverOrderBucket | null {
  const s = normalizeStatus(status);
  if (COMPLETED_STATUSES.includes(s as (typeof COMPLETED_STATUSES)[number])) {
    return "completed";
  }
  if (ACTIVE_STATUSES.includes(s as (typeof ACTIVE_STATUSES)[number])) {
    return "active";
  }
  if (ASSIGNED_STATUSES.includes(s as (typeof ASSIGNED_STATUSES)[number])) {
    return "assigned";
  }
  return null;
}

export function matchesDriverBucket(status: string, bucket: DriverOrderBucket) {
  return orderBucket(status) === bucket;
}

export function resolveEffectiveOrderStatus(order: {
  status?: string;
  dispatched?: boolean;
  dispatchedAt?: string | null;
  dispatched_at?: string | null;
  started?: boolean;
  startedAt?: string | null;
  started_at?: string | null;
}) {
  const status = normalizeStatus(order.status);
  const dispatched = Boolean(order.dispatched || order.dispatchedAt || order.dispatched_at);
  const started = Boolean(order.started || order.startedAt || order.started_at);

  if (started && (status === "created" || status === "dispatched")) {
    return "started";
  }
  if (dispatched && status === "created") {
    return "dispatched";
  }
  return status;
}

export function canStartTrip(
  statusOrOrder: string | Parameters<typeof resolveEffectiveOrderStatus>[0]
) {
  const status =
    typeof statusOrOrder === "string"
      ? normalizeStatus(statusOrOrder)
      : resolveEffectiveOrderStatus(statusOrOrder);
  return status === "dispatched";
}

export function canCompleteOrder(status: string) {
  return ["started", "en_route", "enroute", "arrived", "delivered"].includes(normalizeStatus(status));
}

export function isTerminalStatus(status: string) {
  return COMPLETED_STATUSES.includes(normalizeStatus(status) as (typeof COMPLETED_STATUSES)[number]);
}
