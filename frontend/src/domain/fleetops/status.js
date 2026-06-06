/** Normalized operational status helpers — single source of truth. */

export const ORDER_STATUSES = [
  "created",
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

/**
 * UI/workflow status when API `status` lags behind boolean flags
 * (e.g. dispatched=true but status still "created" after bulk dispatch).
 */
export function resolveEffectiveOrderStatus(order = {}) {
  const status = normalizeStatus(order.status);
  const dispatched = Boolean(order.dispatched || order.dispatchedAt || order.dispatched_at);
  const started = Boolean(order.started || order.startedAt || order.started_at);

  if (started && ["created", "dispatched"].includes(status)) {
    return "en_route";
  }
  if (dispatched && status === "created") {
    return "dispatched";
  }
  return status;
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
