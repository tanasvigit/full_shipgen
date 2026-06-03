import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  buildRolesListApiParams,
  parseRolesListSearchParams,
  rolesListSearchParamsFromState,
} from "@/lib/iam/rolesListQuery";
import { iamService } from "@/services/iam";
import { mapRole } from "@/lib/mappers";

export function useRolesListPage({ enabled = true } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryState = useMemo(() => parseRolesListSearchParams(searchParams), [searchParams]);

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 25, lastPage: 1 });

  const patchQuery = useCallback(
    (patch) => {
      const next = rolesListSearchParamsFromState(queryState, patch);
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
        const apiParams = buildRolesListApiParams(queryState);
        const { rows, meta: pageMeta } = await iamService.listRolesPage(apiParams);
        setRoles(rows.map(mapRole));
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
    roles,
    loading,
    meta,
    reload: () => load({ background: false }),
    refreshBackground: () => load({ background: true }),
  };
}
