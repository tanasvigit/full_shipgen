import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  buildUsersListApiParams,
  parseUsersListSearchParams,
  usersListSearchParamsFromState,
} from "@/lib/iam/usersListQuery";
import { iamService } from "@/services/iam";
import { mapUser } from "@/lib/mappers";

export function useIamListPage({ listKind = "all", enabled = true } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryState = useMemo(() => parseUsersListSearchParams(searchParams), [searchParams]);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 25, lastPage: 1 });

  const patchQuery = useCallback(
    (patch) => {
      const next = usersListSearchParamsFromState(queryState, patch);
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
        const apiParams = buildUsersListApiParams(queryState, { listKind });
        const { rows, meta: pageMeta } = await iamService.listUsersPage(apiParams);
        setUsers(rows.map(mapUser));
        setMeta(pageMeta);
      } finally {
        if (!background) setLoading(false);
      }
    },
    [queryState, listKind, enabled],
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    queryState,
    patchQuery,
    users,
    loading,
    meta,
    reload: () => load({ background: false }),
    refreshBackground: () => load({ background: true }),
  };
}
