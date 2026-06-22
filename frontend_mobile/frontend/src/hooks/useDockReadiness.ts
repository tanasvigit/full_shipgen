import { useQuery } from "@tanstack/react-query";
import { fetchResourceReadiness } from "@/src/services/dockService";

export function useDockReadiness(vehicleId: string | null | undefined, enabled: boolean) {
  const normalizedVehicleId =
    vehicleId && vehicleId !== "null" && vehicleId !== "undefined" ? vehicleId : null;

  return useQuery({
    queryKey: ["yard", "docks", "readiness", normalizedVehicleId],
    queryFn: () => fetchResourceReadiness(normalizedVehicleId!),
    enabled: Boolean(normalizedVehicleId) && enabled,
    staleTime: 5_000,
  });
}
