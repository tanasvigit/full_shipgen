import { useQuery } from "@tanstack/react-query";
import { fetchVehicleMonitorBundle } from "@/src/services/vehicleMonitorService";
import { useYardAuth } from "@/src/contexts/YardAuthContext";
import { hasDocksModuleAccess, hasQueueModuleAccess } from "@/src/lib/moduleAccess";

export function useVehicleMonitor() {
  const { can } = useYardAuth();
  const includeQueue = hasQueueModuleAccess(can);
  const includeDocks = hasDocksModuleAccess(can);

  return useQuery({
    queryKey: ["yard", "vehicles", "monitor", includeQueue, includeDocks],
    queryFn: () => fetchVehicleMonitorBundle({ includeQueue, includeDocks }),
    refetchInterval: 30_000,
  });
}
