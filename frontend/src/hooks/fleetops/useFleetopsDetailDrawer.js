import { useCallback, useMemo } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import {
  FLEETOPS_DETAIL_ENTITIES,
  getEntityConfig,
  resolveEntityFromSearchParams,
} from "@/domain/fleetops/detail/registry";

/**
 * URL-synced detail drawer state (?driver=, ?order=, etc.)
 * Supports browser back, deep links, and list→drawer navigation without full page routes.
 */
export function useFleetopsDetailDrawer(entityKey) {
  const config = getEntityConfig(entityKey);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const entityId = config ? searchParams.get(config.param) : null;
  const open = Boolean(entityId);

  const openDetail = useCallback(
    (id, options = {}) => {
      if (!config || !id) return;
      const next = new URLSearchParams(searchParams);
      next.set(config.param, String(id));
      if (options.tab) next.set(`${config.param}Tab`, options.tab);
      setSearchParams(next, { replace: options.replace ?? false });
    },
    [config, searchParams, setSearchParams],
  );

  const closeDetail = useCallback(() => {
    if (!config) return;
    const next = new URLSearchParams(searchParams);
    next.delete(config.param);
    next.delete(`${config.param}Tab`);
    setSearchParams(next, { replace: true });
  }, [config, searchParams, setSearchParams]);

  const setDetailTab = useCallback(
    (tab) => {
      if (!config || !entityId) return;
      const next = new URLSearchParams(searchParams);
      if (tab) next.set(`${config.param}Tab`, tab);
      else next.delete(`${config.param}Tab`);
      setSearchParams(next, { replace: true });
    },
    [config, entityId, searchParams, setSearchParams],
  );

  const activeTab = config ? searchParams.get(`${config.param}Tab`) || null : null;

  const openRelated = useCallback(
    (relatedKey, relatedId) => {
      const related = getEntityConfig(relatedKey);
      if (!related || !relatedId) return;
      const next = new URLSearchParams(searchParams);
      next.set(related.param, String(relatedId));
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  return {
    config,
    entityKey,
    entityId,
    open,
    activeTab,
    openDetail,
    closeDetail,
    setDetailTab,
    openRelated,
    location,
    navigate,
  };
}

/** Active drawer across all entity types (for host renderer). */
export function useActiveFleetopsDetail() {
  const [searchParams] = useSearchParams();
  return useMemo(() => resolveEntityFromSearchParams(searchParams), [searchParams]);
}

export { FLEETOPS_DETAIL_ENTITIES };
