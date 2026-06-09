/** Normalized operational status helpers — single source of truth. */

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

export const TERMINAL_ORDER_STATUSES = ["delivered", "completed", "canceled", "cancelled", "failed"];

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
  const status = normalizeStatus(order.status);
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

/** Client-side filter after mapOrder — mapped rows already carry effective status. */
export function matchesOrderStatusFilter(mappedOrder, filterStatus) {
  if (!filterStatus || filterStatus === "all") return true;
  return normalizeStatus(mappedOrder?.status) === normalizeStatus(filterStatus);
}

export function isTerminalOrderStatus(status) {
  return TERMINAL_ORDER_STATUSES.includes(normalizeStatus(status));
}

/** Drop workflow schema tokens so filters/kanban only show real order statuses. */
export function sanitizeOrderStatusList(list) {
  const normalized = [...new Set((list || []).map((s) => normalizeStatus(s)).filter(Boolean))];
  const filtered = normalized.filter((s) => !WORKFLOW_SCHEMA_FIELD_CODES.has(s));
  return filtered.length ? filtered : [...DEFAULT_LIST_STATUSES];
}
