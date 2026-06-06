import { isTerminalOrderStatus, normalizeStatus, resolveEffectiveOrderStatus } from "../status";
import { ORDER_TRANSITIONS } from "../transitions/orderTransitions";

const workflowStatus = (status, context = {}) => {
  if (context.order && typeof context.order === "object") {
    return resolveEffectiveOrderStatus(context.order);
  }
  return normalizeStatus(status);
};

/** True when the API marks the order dispatched (status may still be `created`). */
export function isOrderAlreadyDispatched(orderOrRaw = {}) {
  if (!orderOrRaw || typeof orderOrRaw !== "object") return false;
  if (orderOrRaw.dispatchedAt || orderOrRaw.dispatched_at) return true;
  if (orderOrRaw.dispatched === true) return true;
  const status = normalizeStatus(orderOrRaw.status);
  return ["dispatched", "en_route", "started", "arrived", "delivered", "completed"].includes(status);
}

export function canEditOrder(status) {
  return !isTerminalOrderStatus(status);
}

export function canTransitionOrder(status, transitionId, context = {}) {
  const t = ORDER_TRANSITIONS[transitionId];
  if (!t) return false;
  const s = workflowStatus(status, context);
  if (t.id === "dispatch" && context.alreadyDispatched) return false;
  if (t.requiresNextActivity && !context.hasNextActivity) return false;
  return t.from?.includes(s) ?? false;
}

export function getAvailableTransitions(status, context = {}) {
  const s = workflowStatus(status, context);
  return Object.values(ORDER_TRANSITIONS).filter((t) => {
    if (t.id === "dispatch" && context.alreadyDispatched) return false;
    if (t.requiresNextActivity && !context.hasNextActivity) return false;
    return t.from?.includes(s);
  });
}
