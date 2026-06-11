import { useQuery } from "@tanstack/react-query";
import { useCompanyScope } from "@/src/hooks/useCompanyScope";
import { mapDriverFromApi } from "@/src/lib/fleetMapper";
import { useFleetData } from "@/src/hooks/useFleetData";
import { driverService } from "@/src/services/driverService";
import type { DriverDTO } from "@/src/types/api/fleet";

export function useDriverQuery(driverRef: string) {
  const { companyUuid } = useCompanyScope();
  const { findDriver } = useFleetData();
  const cached = findDriver(driverRef);

  return useQuery({
    queryKey: ["driver", companyUuid, driverRef],
    queryFn: async () => {
      const payload = await driverService.getById(driverRef);
      return mapDriverFromApi(payload as DriverDTO);
    },
    enabled: Boolean(driverRef),
    initialData: cached,
    staleTime: cached ? 30_000 : 0,
  });
}
