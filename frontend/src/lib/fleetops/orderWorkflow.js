/**
 * @deprecated Import from `@/domain/fleetops` — thin re-export for backward compatibility.
 */
export {
  ORDER_TRANSITIONS as ORDER_ACTIONS,
  getAvailableTransitions as getAvailableOrderActions,
  executeOrderTransition,
  optimisticPatchForTransition,
  getTransitionById,
} from "@/domain/fleetops/workflows/orderWorkflow";

export { canEditOrder } from "@/domain/fleetops/guards/orderGuards";

export { isTerminalOrderStatus as isTerminalStatus, ORDER_STATUSES as ORDER_LIFECYCLE_STATUSES } from "@/domain/fleetops/status";
