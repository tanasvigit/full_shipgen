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

export async function suggestBestDriverForOrder(order, drivers = []) {
  return fleetopsService.suggestBestDriver(drivers, order);
}
