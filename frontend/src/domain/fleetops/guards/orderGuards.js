import { isTerminalOrderStatus, normalizeStatus } from "../status";
import { ORDER_TRANSITIONS } from "../transitions/orderTransitions";

export function canEditOrder(status) {
  return !isTerminalOrderStatus(status);
}

export function canTransitionOrder(status, transitionId, context = {}) {
  const t = ORDER_TRANSITIONS[transitionId];
  if (!t) return false;
  const s = normalizeStatus(status);
  if (t.requiresNextActivity && !context.hasNextActivity) return false;
  return t.from?.includes(s) ?? false;
}

export function getAvailableTransitions(status, context = {}) {
  const s = normalizeStatus(status);
  return Object.values(ORDER_TRANSITIONS).filter((t) => {
    if (t.requiresNextActivity && !context.hasNextActivity) return false;
    return t.from?.includes(s);
  });
}
