import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  buildGroupsListApiParams,
  parseGroupsListSearchParams,
  groupsListSearchParamsFromState,
} from "@/lib/iam/groupsListQuery";
import { iamService } from "@/services/iam";
import { mapGroup } from "@/lib/mappers";

export function useGroupsListPage({ enabled = true } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryState = useMemo(() => parseGroupsListSearchParams(searchParams), [searchParams]);

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, perPage: 25, lastPage: 1 });

  const patchQuery = useCallback(
    (patch) => {
      const next = groupsListSearchParamsFromState(queryState, patch);
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
        const apiParams = buildGroupsListApiParams(queryState);
        const { rows, meta: pageMeta } = await iamService.listGroupsPage(apiParams);
        setGroups(rows.map(mapGroup));
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
    groups,
    loading,
    meta,
    reload: () => load({ background: false }),
    refreshBackground: () => load({ background: true }),
  };
}
