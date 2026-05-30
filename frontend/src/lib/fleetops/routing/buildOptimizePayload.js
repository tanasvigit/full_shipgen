import { orderPublicIds } from "./extractStopsFromOrders";

/**
 * Build orchestrator / route optimization request body (Ember route-optimization + vroom parity).
 */
export function buildOptimizePayload({
  orders = [],
  orderIds = [],
  stops = [],
  engine = "greedy",
  mode = "optimize_routes",
  driverIds = [],
  vehicleIds = [],
  priorAssignments = [],
  options = {},
} = {}) {
  const ids = orderIds.length ? orderIds : orderPublicIds(orders);

  const payload = {
    mode,
    order_ids: ids,
    options: {
      engine,
      stops: stops.length ? stops : undefined,
      ...options,
    },
  };

  if (driverIds.length) payload.driver_ids = driverIds;
  if (vehicleIds.length) payload.vehicle_ids = vehicleIds;
  if (priorAssignments.length) payload.prior_assignments = priorAssignments;

  return payload;
}

export function buildAssignDriversPayload(orderIds, engine = "greedy", options = {}) {
  return buildOptimizePayload({
    orderIds,
    engine,
    mode: "assign_drivers",
    options,
  });
}

export function buildOptimizeRoutesPayload(orderIds, priorAssignments = [], options = {}) {
  return buildOptimizePayload({
    orderIds,
    mode: "optimize_routes",
    priorAssignments,
    options,
  });
}
