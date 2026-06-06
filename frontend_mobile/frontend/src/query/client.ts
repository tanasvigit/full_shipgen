import { QueryClient } from "@tanstack/react-query";
import { resetAllQueries, resetTenantQueries } from "@/src/query/invalidation";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** @deprecated Use resetAllQueries or resetTenantQueries from invalidation.ts */
export function clearTenantCache(companyUuid?: string | null) {
  if (!companyUuid) {
    resetAllQueries(queryClient);
    return;
  }
  resetTenantQueries(queryClient, companyUuid);
}

