import { fleetopsService } from "@/services/fleetops";
import { buildAssignDriversPayload, buildOptimizeRoutesPayload } from "./buildOptimizePayload";
import { normalizeOptimizationResult } from "./normalizeOptimizationResult";
import { orderPublicIds } from "./extractStopsFromOrders";

/**
 * Full route optimization pipeline: assign drivers (if needed) → sequence routes → normalized result.
 */
export async function runRouteOptimization({ orders = [], orderIds = [], engine = "greedy" } = {}) {
  const ids = orderIds.length ? orderIds : orderPublicIds(orders);
  if (!ids.length) {
    throw new Error("Select at least one order");
  }

  let priorAssignments = [];
  let result;

  const needsAssignment = orders.some((o) => !o?.vehicle_assigned_uuid && !o?.vehicleId && !o?.driver_assigned_uuid && !o?.driverId);

  if (needsAssignment || engine !== "optimize_only") {
    const assignPayload = buildAssignDriversPayload(ids, engine);
    const assignResult = await fleetopsService.runOrchestrator(assignPayload);
    priorAssignments = assignResult?.assignments || [];
    result = assignResult;
  }

  const optimizePayload = buildOptimizeRoutesPayload(ids, priorAssignments, { engine });
  const optimizeResult = await fleetopsService.runOrchestrator(optimizePayload);

  const mergedAssignments = optimizeResult?.assignments?.length
    ? optimizeResult.assignments
    : result?.assignments || priorAssignments;

  return normalizeOptimizationResult(
    { ...optimizeResult, assignments: mergedAssignments },
    orders,
  );
}
