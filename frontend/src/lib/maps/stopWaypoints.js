import { extractStopsFromOrder } from "@/lib/fleetops/routing/extractStopsFromOrders";

/** Build ordered stop coordinates for routing from an order record. */
export function stopWaypointsFromOrder(order, rawOrder) {
  const stops = extractStopsFromOrder(rawOrder || order);
  return stops
    .filter((stop) => stop.lat != null && stop.lng != null)
    .map((stop) => [Number(stop.lat), Number(stop.lng)]);
}

/** Build stop coordinates from mapped order pickup/dropoff fields. */
export function stopWaypointsFromMappedOrder(order) {
  const points = [];
  if (order?.pickup?.lat != null && order?.pickup?.lng != null) {
    points.push([Number(order.pickup.lat), Number(order.pickup.lng)]);
  }
  if (order?.dropoff?.lat != null && order?.dropoff?.lng != null) {
    points.push([Number(order.dropoff.lat), Number(order.dropoff.lng)]);
  }
  return points;
}
