import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  buildOrdersListApiParams,
  ordersListSearchParamsFromState,
  parseOrdersListSearchParams,
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
        if (queryState.status !== "all") {
          rows = rows.filter((o) => String(o.status).toLowerCase() === queryState.status.toLowerCase());
        }
        if (queryState.without_driver) {
          rows = rows.filter((o) => !o.driverId);
        }
        setOrders(rows);
        setMeta({
          total: rows.length,
          page: queryState.page,
          perPage: queryState.limit,
          lastPage: Math.max(1, Math.ceil(rows.length / queryState.limit)),
        });
        setLoading(false);
        return;
      }
      if (!background) setLoading(true);
      try {
        invalidateCachedQuery("fleetops:orders");
        const apiParams = buildOrdersListApiParams(queryState);
        delete apiParams.query;
        delete apiParams.search;
        apiParams.page = 1;
        apiParams.limit = Math.max(Number(apiParams.limit) || 25, 500);
        const { rows, meta: pageMeta } = await fleetopsService.listOrdersPage(apiParams);
        setOrders(rows.map(mapOrder));
        setMeta(pageMeta);
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
