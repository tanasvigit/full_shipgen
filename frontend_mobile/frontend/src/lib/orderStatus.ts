/**
 * Canonical order status helpers — aligned with frontend/src/domain/fleetops/status.js
 *
 * @see ./ORDER-STATUS-FLOW.md — canonical lifecycle diagram and cross-platform rules
 */

export const ORDER_STATUSES = [
  "created",
  "assigned",
  "dispatched",
  "en_route",
  "arrived",
  "delivered",
  "completed",
  "canceled",
  "cancelled",
  "failed",
  "delayed",
] as const;

export const TERMINAL_ORDER_STATUSES = ["completed", "canceled", "cancelled", "failed"] as const;

const STATUS_ALIASES: Record<string, string> = {
  started: "en_route",
  enroute: "en_route",
  in_transit: "en_route",
  cancelled: "canceled",
};

/** Driver app tabs — planning queue vs in-field vs closed. */
export const ASSIGNED_STATUSES = ["created", "assigned", "scheduled", "dispatched"] as const;
export const ACTIVE_STATUSES = ["en_route", "arrived", "delivered"] as const;
export const COMPLETED_STATUSES = [...TERMINAL_ORDER_STATUSES] as const;

export type DriverOrderBucket = "assigned" | "active" | "completed";

export function normalizeStatus(status: string) {
  return String(status || "created").toLowerCase().replace(/\s+/g, "_");
}

export function canonicalOrderStatus(status: string) {
  const normalized = normalizeStatus(status);
  return STATUS_ALIASES[normalized] || normalized;
}

function orderHasDriverAssigned(order: {
  has_driver_assigned?: boolean;
  hasDriverAssigned?: boolean;
  driver_assigned_uuid?: string | null;
  driverId?: string | null;
}) {
  return Boolean(
    order.has_driver_assigned ??
      order.hasDriverAssigned ??
      order.driver_assigned_uuid ??
      order.driverId
  );
}

export function resolveEffectiveOrderStatus(order: {
  status?: string;
  dispatched?: boolean;
  dispatchedAt?: string | null;
  dispatched_at?: string | null;
  started?: boolean;
  startedAt?: string | null;
  started_at?: string | null;
  has_driver_assigned?: boolean;
  hasDriverAssigned?: boolean;
  driver_assigned_uuid?: string | null;
  driverId?: string | null;
}) {
  const status = canonicalOrderStatus(order.status || "created");
  const dispatched = Boolean(order.dispatched || order.dispatchedAt || order.dispatched_at);
  const started = Boolean(order.started || order.startedAt || order.started_at);
  const hasDriver = orderHasDriverAssigned(order);

  if (started && !isTerminalStatus(status)) {
    if (["created", "assigned", "dispatched", "scheduled"].includes(status)) {
      return "en_route";
    }
  }
  if (dispatched && (status === "created" || status === "assigned")) {
    return "dispatched";
  }
  if (!dispatched && hasDriver && status === "created") {
    return "assigned";
  }
  return status;
}

export function orderStatusLabel(value: string) {
  const key = canonicalOrderStatus(value);
  const labels: Record<string, string> = {
    created: "Created",
    assigned: "Assigned",
    dispatched: "Dispatched",
    en_route: "En Route",
    arrived: "Arrived",
    delivered: "Delivered",
    completed: "Completed",
    delayed: "Delayed",
    canceled: "Canceled",
    failed: "Failed",
  };
  return labels[key] || key.replace(/_/g, " ");
}

export function orderBucket(status: string): DriverOrderBucket | null {
  const s = canonicalOrderStatus(status);
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

export function canStartTrip(
  statusOrOrder: string | Parameters<typeof resolveEffectiveOrderStatus>[0]
) {
  const status =
    typeof statusOrOrder === "string"
      ? canonicalOrderStatus(statusOrOrder)
      : resolveEffectiveOrderStatus(statusOrOrder);
  return status === "dispatched";
}

export function isTripInProgress(status: string) {
  return ["en_route", "arrived", "delivered"].includes(canonicalOrderStatus(status));
}

export function canCompleteOrder(status: string) {
  return isTripInProgress(status);
}

export function isTerminalStatus(status: string) {
  return TERMINAL_ORDER_STATUSES.includes(
    canonicalOrderStatus(status) as (typeof TERMINAL_ORDER_STATUSES)[number]
  );
}
