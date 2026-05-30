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

export function normalizeStatus(value) {
  return String(value || "created")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export function isTerminalOrderStatus(status) {
  return TERMINAL_ORDER_STATUSES.includes(normalizeStatus(status));
}
