import { useMemo } from "react";
import { evaluateOperationalWarnings, hasBlockingWarnings } from "@/domain/fleetops/warnings/evaluateWarnings";
import {
  evaluateDriverCompliance,
  evaluateVehicleCompliance,
  evaluateOrderCompliance,
} from "@/domain/fleetops/compliance/evaluateCompliance";

/**
 * Cross-entity operational warnings + compliance — domain-backed.
 */
export function useFleetopsWarnings({
  driver,
  vehicle,
  fleet,
  order,
  rawOrder,
  scheduleItems = [],
  shiftCandidate,
  fileMeta,
} = {}) {
  const warnings = useMemo(() => {
    const compliance = [
      ...evaluateDriverCompliance(driver?.raw || driver),
      ...evaluateVehicleCompliance(vehicle?.raw || vehicle),
      ...evaluateOrderCompliance(rawOrder || order?.raw || order),
    ];

    return evaluateOperationalWarnings({
      driver,
      vehicle,
      fleet,
      orderStatus: order?.status || rawOrder?.status,
      scheduleItems,
      shiftCandidate,
      fileMeta,
      compliance,
    });
  }, [driver, vehicle, fleet, order, rawOrder, scheduleItems, shiftCandidate, fileMeta]);

  return { warnings, hasBlocking: hasBlockingWarnings(warnings) };
}
