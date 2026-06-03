import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  buildPoliciesListApiParams,
  parsePoliciesListSearchParams,
  policiesListSearchParamsFromState,
} from "@/lib/iam/policiesListQuery";
import { iamService } from "@/services/iam";
import { mapPolicy } from "@/lib/mappers";

export function usePoliciesListPage({ enabled = true } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryState = useMemo(() => parsePoliciesListSearchParams(searchParams), [searchParams]);

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 25, lastPage: 1 });

  const patchQuery = useCallback(
    (patch) => {
      const next = policiesListSearchParamsFromState(queryState, patch);
      setSearchParams(next, { replace: true });
    },
    [queryState, setSearchParams],
  );

  const load = useCallback(
    async (opts = {}) => {
      const { background = false } = opts;
      if (!enabled) return;
      if (!background) setLoading(true);
      try {
        const apiParams = buildPoliciesListApiParams(queryState);
        const { rows, meta: pageMeta } = await iamService.listPoliciesPage(apiParams);
        setPolicies(rows.map(mapPolicy));
        setMeta(pageMeta);
      } finally {
        if (!background) setLoading(false);
      }
    },
    [queryState, enabled],
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    queryState,
    patchQuery,
    policies,
    loading,
    meta,
    reload: () => load({ background: false }),
    refreshBackground: () => load({ background: true }),
  };
}
