import { useMemo } from "react";
import type { Vehicle } from "@/src/data/types";
import { useAuth } from "@/src/contexts/AuthContext";
import { useFleetData } from "@/src/hooks/useFleetData";
import { isDriverUser, resolveDriverTrackId } from "@/src/lib/driver";

/** Assigned vehicle for the signed-in driver (API-scoped to session.driver). */
export function useDriverVehicle(): { driverMode: boolean; vehicle: Vehicle | null } {
  const { user } = useAuth();
  const driverMode = isDriverUser(user);
  const driverTrackId = resolveDriverTrackId(user);
  const { vehicles, drivers, findDriver } = useFleetData();

  const vehicle = useMemo(() => {
    if (!driverMode || !vehicles.length) return null;

    const linkedDriver =
      (driverTrackId ? findDriver(driverTrackId) : null) ||
      drivers.find((d) => d.id === driverTrackId) ||
      drivers[0];

    if (linkedDriver?.vehicleId) {
      const match = vehicles.find((v) => v.id === linkedDriver.vehicleId);
      if (match) return match;
    }

    return null;
  }, [driverMode, driverTrackId, vehicles, drivers, findDriver]);

  return { driverMode, vehicle };
}
