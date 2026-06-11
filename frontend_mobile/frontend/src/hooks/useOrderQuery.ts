import { useQuery } from "@tanstack/react-query";
import { useCompanyScope } from "@/src/hooks/useCompanyScope";
import { useDriverOrders } from "@/src/hooks/useDriverOrders";
import { orderNeedsCoordinateRefresh } from "@/src/lib/orderDetail";
import { ordersService } from "@/src/services/ordersService";
import { queryKeys } from "@/src/query/keys";

export function useOrderQuery(orderRef: string, hints?: { code?: string }) {
  const { companyUuid, enabled } = useCompanyScope();
  const { findOrder } = useDriverOrders();
  const cached = findOrder(orderRef);

  return useQuery({
    queryKey: queryKeys.order(companyUuid, orderRef),
    queryFn: () => ordersService.findById(orderRef, hints),
    enabled: enabled && Boolean(orderRef),
    initialData: cached ?? undefined,
    placeholderData: cached ?? undefined,
    staleTime: orderNeedsCoordinateRefresh(cached) ? 0 : 30_000,
    refetchOnMount: true,
  });
}
