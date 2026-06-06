import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/src/query/keys";

const ORDERS_LIST_PARAMS = { limit: 500 } as const;

/** Remove every cached query (logout / unauthorized). */
export function resetAllQueries(queryClient: QueryClient) {
  queryClient.clear();
}

/** Remove queries scoped to one company uuid (org switch). */
export function resetTenantQueries(queryClient: QueryClient, companyUuid: string | null | undefined) {
  if (!companyUuid) {
    resetAllQueries(queryClient);
    return;
  }

  queryClient.removeQueries({
    predicate: (query) => {
      const key = query.queryKey;
      return Array.isArray(key) && key.includes(companyUuid);
    },
  });
}

export function invalidateOrderLists(
  queryClient: QueryClient,
  companyUuid: string | null,
  params: Record<string, unknown> = ORDERS_LIST_PARAMS
) {
  if (!companyUuid) return;
  return queryClient.invalidateQueries({
    queryKey: queryKeys.orders(companyUuid, params),
    exact: true,
  });
}

export function invalidateOrderDetail(
  queryClient: QueryClient,
  companyUuid: string | null,
  orderRef: string
) {
  if (!companyUuid || !orderRef) return;
  return queryClient.invalidateQueries({
    queryKey: queryKeys.order(companyUuid, orderRef),
    exact: true,
  });
}

export function invalidateNextActivity(
  queryClient: QueryClient,
  companyUuid: string | null,
  orderRef: string
) {
  if (!companyUuid || !orderRef) return;
  return queryClient.invalidateQueries({
    queryKey: queryKeys.nextActivity(companyUuid, orderRef),
    exact: true,
  });
}

export function invalidateFleetAggregate(queryClient: QueryClient, companyUuid: string | null) {
  if (!companyUuid) return;
  return queryClient.invalidateQueries({
    queryKey: queryKeys.fleet(companyUuid),
    exact: true,
  });
}

/** After workflow / POD / tracking mutations affecting one order. */
export async function refreshOrderScope(
  queryClient: QueryClient,
  companyUuid: string | null,
  orderRef: string
) {
  await Promise.all([
    invalidateOrderLists(queryClient, companyUuid),
    invalidateOrderDetail(queryClient, companyUuid, orderRef),
    invalidateNextActivity(queryClient, companyUuid, orderRef),
  ]);
}

export async function refreshOnOrgSwitch(
  queryClient: QueryClient,
  previousCompanyUuid: string | null,
  nextCompanyUuid: string | null
) {
  resetTenantQueries(queryClient, previousCompanyUuid);
  if (nextCompanyUuid) {
    await Promise.all([
      invalidateOrderLists(queryClient, nextCompanyUuid),
      invalidateFleetAggregate(queryClient, nextCompanyUuid),
    ]);
  }
}
