import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Order } from "@/src/data/types";
import { useAuth } from "@/src/contexts/AuthContext";
import { matchesDriverBucket, type DriverOrderBucket } from "@/src/lib/orderStatus";
import { ordersService } from "@/src/services/ordersService";
import { ORDERS_LIST_PARAMS, queryKeys } from "@/src/query/keys";
import { captureError } from "@/src/services/observability";

function matchesOrderRef(order: Order, ref: string) {
  const key = String(ref || "").trim();
  if (!key) return false;
  return order.id === key || order.code === key;
}

export function useDriverOrders() {
  const { isAuthenticated, authReady, activeOrganization } = useAuth();
  const companyUuid = activeOrganization?.uuid || null;

  const query = useQuery({
    queryKey: queryKeys.orders(companyUuid, ORDERS_LIST_PARAMS),
    queryFn: () => ordersService.list(ORDERS_LIST_PARAMS),
    enabled: authReady && isAuthenticated,
  });
  const orders = useMemo(() => query.data || [], [query.data]);
  const loading = query.isLoading || query.isFetching;
  const error = query.error instanceof Error ? query.error.message : null;

  const helpers = useMemo(
    () => ({
      findOrder: (ref: string) => orders.find((item) => matchesOrderRef(item, ref)),
      ordersForBucket: (bucket: DriverOrderBucket) =>
        orders.filter((order) => matchesDriverBucket(order.status, bucket)),
    }),
    [orders],
  );

  return { orders, ...helpers, loading, error, refresh: query.refetch };
}

export async function fetchOrderById(orderId: string, hints?: { code?: string }): Promise<Order | null> {
  try {
    return await ordersService.findById(orderId, hints);
  } catch (error) {
    captureError(error, { operation: "orders.findById", orderId, code: hints?.code });
    throw error;
  }
}
