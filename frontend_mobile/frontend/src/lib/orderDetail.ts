import type { Order } from "@/src/data/types";

/** True when list cache may lack coordinates — detail fetch should refresh. */
export function orderNeedsCoordinateRefresh(order: Order | null | undefined) {
  if (!order) return false;
  const hasAddress = order.pickup !== "—" || order.dropoff !== "—";
  const hasCoordinate = Boolean(order.pickupCoordinate || order.dropoffCoordinate);
  return hasAddress && !hasCoordinate;
}
