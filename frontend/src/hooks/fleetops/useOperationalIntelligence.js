import { useMemo } from "react";
import { computeOperationalMetrics } from "@/domain/fleetops/intelligence/computeOperationalMetrics";
import {
  evaluateFleetDeliveryRisks,
  evaluateOrderDeliveryRisks,
} from "@/domain/fleetops/intelligence/evaluateDeliveryRisks";
import { buildDispatcherSuggestions } from "@/domain/fleetops/intelligence/dispatcherSuggestions";

/**
 * Derived operational intelligence from orders + drivers snapshots.
 */
export function useOperationalIntelligence(orders = [], drivers = []) {
  return useMemo(() => {
    const metrics = computeOperationalMetrics(orders, drivers);
    const risks = evaluateFleetDeliveryRisks(orders, drivers);
    const suggestions = buildDispatcherSuggestions(orders, drivers);
    const driverById = new Map(drivers.map((driver) => [String(driver.id), driver]));
    const riskByOrderId = new Map();
    for (const order of orders) {
      const driver = driverById.get(String(order.driverId));
      riskByOrderId.set(order.id, evaluateOrderDeliveryRisks(order, { driver }));
    }
    return { metrics, risks, suggestions, riskByOrderId };
  }, [orders, drivers]);
}
