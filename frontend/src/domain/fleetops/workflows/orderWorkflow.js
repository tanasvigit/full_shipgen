import { fleetopsService } from "@/services/fleetops";
import { getAvailableTransitions } from "../guards/orderGuards";
import { ORDER_TRANSITIONS } from "../transitions/orderTransitions";

export { ORDER_TRANSITIONS, getAvailableTransitions };

export function getTransitionById(id) {
  return ORDER_TRANSITIONS[id] || null;
}

/** Execute a domain transition against the API. */
export async function executeOrderTransition(orderId, transition, context = {}) {
  const id = String(orderId);
  switch (transition.method) {
    case "dispatch":
      return fleetopsService.dispatchOrder(id);
    case "start":
      return fleetopsService.startOrder(id);
    case "cancel":
      return fleetopsService.cancelOrder(id);
    case "complete":
      return fleetopsService.completeOrder(id);
    case "updateActivity": {
      const code = context.nextActivityCode;
      if (!code) throw new Error("No next activity available");
      return fleetopsService.updateOrderActivity(id, code);
    }
    default:
      throw new Error(`Unknown transition method: ${transition.method}`);
  }
}

/** Optimistic patch applied to raw order before API confirms. */
export function optimisticPatchForTransition(transition) {
  if (transition.to) return { status: transition.to };
  return {};
}
