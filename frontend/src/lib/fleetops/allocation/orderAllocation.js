import { fleetopsService } from "@/services/fleetops";

/**
 * Order allocation layer — mirrors Ember order-allocation + vroom-allocation-engine.
 */

export async function allocateOrders({ orderIds = [], vehicleIds = [], engine = "greedy", options = {} } = {}) {
  return fleetopsService.runOrchestrator({
    mode: "allocate",
    order_ids: orderIds,
    vehicle_ids: vehicleIds,
    options: { engine, ...options },
  });
}

export async function assignDriversToOrders({ orderIds = [], driverIds = [], engine = "driver_assignment", options = {} } = {}) {
  return fleetopsService.runOrchestrator({
    mode: "assign_drivers",
    order_ids: orderIds,
    driver_ids: driverIds,
    options: { engine, ...options },
  });
}

export function pickAllocationEngine(engines = [], preferred = "greedy") {
  const list = Array.isArray(engines) ? engines : [];
  const ids = list.map((e) => (typeof e === "string" ? e : e?.id || e?.identifier || e?.name)).filter(Boolean);
  if (ids.includes(preferred)) return preferred;
  return ids[0] || preferred;
}

const defaultBestFitOptions = {
  require_active_shift: true,
  respect_scheduled_at: true,
  respect_skills: true,
};

function resolvePublicId(entity) {
  return entity?.publicId || entity?.public_id || entity?.id || null;
}

/**
 * Server-side best-fit driver assignment (orchestrator / DriverAssignmentEngine).
 */
export async function bestFitDriversToOrders({
  orderIds = [],
  driverIds = [],
  apply = true,
  options = {},
} = {}) {
  return fleetopsService.runOrchestrator({
    mode: "best_fit_drivers",
    order_ids: orderIds,
    driver_ids: driverIds,
    apply,
    options: { ...defaultBestFitOptions, ...options },
  });
}

/**
 * Suggest a single best-fit driver via orchestrator (preview — does not assign).
 */
export async function suggestBestDriverForOrder(order, drivers = []) {
  const orderId = resolvePublicId(order);
  if (!orderId) return null;

  try {
    const driverPool = drivers.map(resolvePublicId).filter(Boolean);
    const result = await bestFitDriversToOrders({
      orderIds: [orderId],
      driverIds: driverPool,
      apply: false,
    });

    const assignment = result?.assignments?.[0];
    const driverPublicId = assignment?.driver_id;
    if (!driverPublicId) return null;

    const matched = drivers.find((d) => resolvePublicId(d) === driverPublicId);
    if (matched) return matched;

    return { id: driverPublicId, public_id: driverPublicId, uuid: driverPublicId };
  } catch {
    return fleetopsService.suggestBestDriver(drivers, order);
  }
}
