import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  applyOrdersListStatusFilter,
  buildOrdersListApiParams,
  ordersListSearchParamsFromState,
  parseOrdersListSearchParams,
  reconcileOrdersListMetaAfterStatusFilter,
} from "@/lib/fleetops/ordersListQuery";
import { fleetopsService } from "@/services/fleetops";
import { mapOrder } from "@/lib/mappers";
import { invalidateCachedQuery } from "@/hooks/fleetops/useFleetopsQueryCache";

export function useOrdersListPage({ enabled = true, isDemoMode = false, demoOrders = [] } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryState = useMemo(() => parseOrdersListSearchParams(searchParams), [searchParams]);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 25, lastPage: 1 });

  const patchQuery = useCallback(
    (patch) => {
      const next = ordersListSearchParamsFromState(queryState, patch);
      setSearchParams(next, { replace: true });
    },
    [queryState, setSearchParams],
  );

  const load = useCallback(
    async (opts = {}) => {
      const { background = false } = opts;
      if (isDemoMode) {
        let rows = demoOrders.map(mapOrder);
        rows = applyOrdersListStatusFilter(rows, queryState.status);
        if (queryState.without_driver) {
          rows = rows.filter((o) => !o.driverId);
        }
        if (queryState.search?.trim()) {
          const term = queryState.search.trim().toLowerCase();
          rows = rows.filter(
            (o) =>
              String(o.publicId || "").toLowerCase().includes(term) ||
              String(o.customer?.name || "").toLowerCase().includes(term),
          );
        }
        const total = rows.length;
        const perPage = queryState.limit;
        const lastPage = Math.max(1, Math.ceil(total / perPage));
        const page = Math.min(queryState.page, lastPage);
        const start = (page - 1) * perPage;
        setOrders(rows.slice(start, start + perPage));
        setMeta({ total, page, perPage, lastPage });
        setLoading(false);
        return;
      }
      if (!background) setLoading(true);
      try {
        invalidateCachedQuery("fleetops:orders");
        const apiParams = buildOrdersListApiParams(queryState);
        const { rows, meta: pageMeta } = await fleetopsService.listOrdersPage(apiParams);
        const mapped = rows.map(mapOrder);
        const filtered = applyOrdersListStatusFilter(mapped, queryState.status);
        const nextMeta = reconcileOrdersListMetaAfterStatusFilter({
          pageMeta,
          filteredRows: filtered,
          fetchedRowCount: rows.length,
          queryState,
        });

        setOrders(filtered);
        setMeta(nextMeta);
      } finally {
        if (!background) setLoading(false);
      }
    },
    [queryState, isDemoMode, demoOrders],
  );

  useEffect(() => {
    if (!enabled) return;
    load();
  }, [enabled, load]);

  return {
    queryState,
    patchQuery,
    orders,
    loading,
    meta,
    reload: () => load({ background: false }),
    refreshBackground: () => load({ background: true }),
  };
}
