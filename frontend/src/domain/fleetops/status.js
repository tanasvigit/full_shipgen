/**
 * Normalized operational status helpers — single source of truth.
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
];

/** Closed orders — no further driver or dispatch workflow actions. */
export const TERMINAL_ORDER_STATUSES = ["completed", "canceled", "cancelled", "failed"];

/** Legacy API / workflow codes mapped to canonical display statuses. */
const STATUS_ALIASES = {
  started: "en_route",
  enroute: "en_route",
  in_transit: "en_route",
  cancelled: "canceled",
};

/**
 * Raw DB `status` values to request when filtering by canonical `en_route`.
 * Refined client-side via {@link resolveEffectiveOrderStatus} (e.g. `started` + dispatched → en_route).
 */
export const EN_ROUTE_API_STATUS_VALUES = [
  "en_route",
  "enroute",
  "started",
  "in_transit",
  "dispatched",
  "created",
  "assigned",
];

/** Order-config workflow JSON keys — not valid status filter chips. */
export const WORKFLOW_SCHEMA_FIELD_CODES = new Set([
  "key",
  "code",
  "color",
  "logic",
  "events",
  "status",
  "actions",
  "details",
  "options",
  "complete",
  "entities",
  "sequence",
  "activities",
  "internalid",
  "internal_id",
  "pod_method",
  "require_pod",
]);

const DEFAULT_LIST_STATUSES = ORDER_STATUSES.filter((s) => s !== "cancelled");

export function normalizeStatus(value) {
  return String(value || "created")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export function canonicalOrderStatus(value) {
  const normalized = normalizeStatus(value);
  return STATUS_ALIASES[normalized] || normalized;
}

function orderHasDriverAssigned(order = {}) {
  return Boolean(
    order.has_driver_assigned ??
      order.hasDriverAssigned ??
      order.driver_assigned_uuid ??
      order.driverId,
  );
}

/**
 * UI/workflow status when API `status` lags behind assignment/dispatch flags.
 * - created + driver, not dispatched → assigned
 * - created + dispatched flag → dispatched
 * - started flag with early status → en_route
 */
export function resolveEffectiveOrderStatus(order = {}) {
  const status = canonicalOrderStatus(order.status);
  const dispatched = Boolean(order.dispatched || order.dispatchedAt || order.dispatched_at);
  const started = Boolean(order.started || order.startedAt || order.started_at);
  const hasDriver = orderHasDriverAssigned(order);

  if (started && !isTerminalOrderStatus(status)) {
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

export function orderStatusLabel(value) {
  return (
    {
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
    }[canonicalOrderStatus(value)] || String(value || "Unknown").replace(/_/g, " ")
  );
}

/** Client-side filter after mapOrder — compares canonical effective status. */
export function matchesOrderStatusFilter(mappedOrder, filterStatus) {
  if (!filterStatus || filterStatus === "all") return true;
  const effective = resolveEffectiveOrderStatus({
    status: mappedOrder?.apiStatus ?? mappedOrder?.status,
    started: mappedOrder?.started,
    started_at: mappedOrder?.startedAt,
    dispatched: mappedOrder?.dispatched,
    dispatched_at: mappedOrder?.dispatchedAt,
    driver_assigned_uuid: mappedOrder?.driverId,
    has_driver_assigned: mappedOrder?.hasDriverAssigned,
  });
  return canonicalOrderStatus(effective) === canonicalOrderStatus(filterStatus);
}

export function isTerminalOrderStatus(status) {
  return TERMINAL_ORDER_STATUSES.includes(canonicalOrderStatus(status));
}

/** Drop workflow schema tokens so filters/kanban only show real order statuses. */
export function sanitizeOrderStatusList(list) {
  const normalized = [...new Set((list || []).map((s) => canonicalOrderStatus(s)).filter(Boolean))];
  const filtered = normalized.filter((s) => !WORKFLOW_SCHEMA_FIELD_CODES.has(s));
  return filtered.length ? filtered : [...DEFAULT_LIST_STATUSES];
}
