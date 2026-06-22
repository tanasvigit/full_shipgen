import { useQuery } from "@tanstack/react-query";
import { mapVehicle360Profile } from "@/src/lib/vehicle360";
import { fetchVehicleJourney } from "@/src/services/vehicleService";

export function useVehicleJourney(vehicleId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["yard", "vehicle", "journey", vehicleId],
    queryFn: async () => {
      const journey = await fetchVehicleJourney(vehicleId!);
      return mapVehicle360Profile(journey);
    },
    enabled: Boolean(vehicleId) && enabled,
  });
}
