import type { Order } from "@/src/data/types";
import { isTerminalStatus } from "@/src/lib/orderStatus";

type OpsPermissions = {
  canUpdateOrder: boolean;
  canDispatchOrder: boolean;
  canCreateOrder: boolean;
};

export function canAssignOrder(
  order: Order,
  permissions: OpsPermissions,
  driverMode: boolean
) {
  if (driverMode || !permissions.canUpdateOrder) return false;
  return !isTerminalStatus(order.status);
}

export function canDispatchOrderAction(
  order: Order,
  permissions: OpsPermissions,
  driverMode: boolean
) {
  if (driverMode || !permissions.canDispatchOrder) return false;
  if (isTerminalStatus(order.status)) return false;
  if (order.dispatched) return false;
  return Boolean(order.driverId);
}

export function canCancelOrderAction(
  order: Order,
  permissions: OpsPermissions,
  driverMode: boolean
) {
  if (driverMode || !permissions.canUpdateOrder) return false;
  return !isTerminalStatus(order.status);
}

export function showOpsToolbar(
  order: Order,
  permissions: OpsPermissions,
  driverMode: boolean
) {
  return (
    canAssignOrder(order, permissions, driverMode) ||
    canDispatchOrderAction(order, permissions, driverMode) ||
    canCancelOrderAction(order, permissions, driverMode)
  );
}
