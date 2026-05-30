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
