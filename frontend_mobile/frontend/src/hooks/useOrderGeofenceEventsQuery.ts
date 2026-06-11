import { useQuery } from "@tanstack/react-query";
import { useCompanyScope } from "@/src/hooks/useCompanyScope";
import { mapGeofenceEvents } from "@/src/lib/orderTracker";
import { geofenceService } from "@/src/services/geofenceService";
import { queryKeys } from "@/src/query/keys";

export function useOrderGeofenceEventsQuery(
  driverUuid: string | undefined,
  orderRef: string | undefined,
  enabled: boolean
) {
  const { companyUuid } = useCompanyScope();

  return useQuery({
    queryKey: queryKeys.orderGeofences(companyUuid, driverUuid || "", orderRef || ""),
    queryFn: async () => {
      const events = await geofenceService.getEvents(
        driverUuid ? { driver_uuid: driverUuid } : undefined
      );
      return mapGeofenceEvents(events, orderRef);
    },
    enabled: enabled && Boolean(driverUuid),
    staleTime: 60_000,
  });
}
