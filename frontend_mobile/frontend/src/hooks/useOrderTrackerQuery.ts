import { useQuery } from "@tanstack/react-query";
import { useCompanyScope } from "@/src/hooks/useCompanyScope";
import { ordersService } from "@/src/services/ordersService";
import { queryKeys } from "@/src/query/keys";

const TRACKER_POLL_MS = 30_000;

export function useOrderTrackerQuery(orderRef: string | undefined, enabled: boolean) {
  const { companyUuid } = useCompanyScope();

  return useQuery({
    queryKey: queryKeys.orderTracker(companyUuid, orderRef || ""),
    queryFn: () => ordersService.getTracker(String(orderRef)),
    enabled: enabled && Boolean(orderRef),
    staleTime: 15_000,
    refetchInterval: enabled ? TRACKER_POLL_MS : false,
  });
}

export function useOrderEtaQuery(orderRef: string | undefined, enabled: boolean) {
  const { companyUuid } = useCompanyScope();

  return useQuery({
    queryKey: queryKeys.orderEta(companyUuid, orderRef || ""),
    queryFn: () => ordersService.getEta(String(orderRef)),
    enabled: enabled && Boolean(orderRef),
    staleTime: 30_000,
    refetchInterval: enabled ? 60_000 : false,
  });
}
