import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createFleetopsPermissionChecker, normalizePermissionNames } from "@/lib/fleetops/permissions";

/**
 * Permissive fallback when ability object is merged defensively in UI.
 * Export for tests and optional `ability ?? FLEETOPS_ABILITY_FALLBACK`.
 */
/** Dev-only: set VITE_FLEETOPS_PERMISSIVE=true to allow-all when permissions empty. */
const PERMISSIVE =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_FLEETOPS_PERMISSIVE === "true";

export const FLEETOPS_ABILITY_FALLBACK = {
  can: () => PERMISSIVE,
  cannot: () => false,
  role: "operator",
  isAdmin: false,
  isDispatcher: true,
  isViewer: false,
  isDriver: false,
  canViewOrder: true,
  canCreateOrder: true,
  canUpdateOrder: true,
  canDeleteOrder: true,
  canDispatchOrder: true,
  canCancelOrder: true,
  canAssignDriver: true,
  canExportOrder: true,
  canImportOrder: true,
  canBulkManage: true,
  canListOrderConfig: true,
  canViewOrderConfig: true,
  canCreateOrderConfig: true,
  canUpdateOrderConfig: true,
  canDeleteOrderConfig: true,
  canCloneOrderConfig: true,
  canEditRoute: true,
  canCommentOrder: true,
};

/**
 * FleetOps ability checks — `fleet-ops {action} {resource}` (Spatie).
 * Uses the same wildcard + read-alias rules as backend Auth::can().
 */
export function useFleetopsAbility() {
  const { user } = useAuth();
  const permissionsLoaded = Boolean(user?.permissions?.length);

  const isAdmin = Boolean(user?.isAdmin);

  const checker = useMemo(
    () => createFleetopsPermissionChecker(normalizePermissionNames(user?.permissions), { isAdmin }),
    [user?.permissions, isAdmin],
  );

  const can = useCallback(
    (action, resource = "order") => {
      if (isAdmin) return true;
      if (!permissionsLoaded && PERMISSIVE) return true;
      return checker.can(action, resource);
    },
    [checker, permissionsLoaded, isAdmin],
  );

  const cannot = useCallback((action, resource = "order") => !can(action, resource), [can]);

  const role = useMemo(() => {
    const r = user?.role || user?.type || user?.company_user?.role || "operator";
    return String(r).toLowerCase();
  }, [user]);

  const isAdminResolved = isAdmin || role === "admin" || can("see", "admin");
  const isDispatcher = isAdminResolved || role === "dispatcher" || can("dispatch", "order");
  const isViewer = role === "viewer" && !isDispatcher;
  const isDriver = role === "driver";

  const canListOrderConfig = can("list", "order-config") || can("see", "order-config");
  const canCreateOrderConfig = can("create", "order-config");

  return {
    can,
    cannot,
    role,
    isAdmin: isAdminResolved,
    isDispatcher,
    isViewer,
    isDriver,
    canViewOrder: can("view", "order") || can("list", "order"),
    canCreateOrder: can("create", "order"),
    canUpdateOrder: can("update", "order"),
    canDeleteOrder: can("delete", "order"),
    canDispatchOrder: can("dispatch", "order"),
    canCancelOrder: can("cancel", "order"),
    canAssignDriver: can("assign", "driver") || can("update", "order"),
    canExportOrder: can("export", "order") || can("view", "order"),
    canImportOrder: can("import", "order") || can("create", "order"),
    canBulkManage: isDispatcher && (can("dispatch", "order") || can("update", "order")),
    canListOrderConfig,
    canViewOrderConfig: can("view", "order-config") || canListOrderConfig,
    canCreateOrderConfig,
    canUpdateOrderConfig: can("update", "order-config"),
    canDeleteOrderConfig: can("delete", "order-config"),
    canCloneOrderConfig: can("clone", "order-config") || canCreateOrderConfig,
    canEditRoute: can("update", "order") || can("update", "route"),
    canCommentOrder: can("create", "comment") || can("update", "order"),
  };
}

/** @deprecated alias — use useFleetopsAbility */
export function useSafeFleetopsAbility() {
  return useFleetopsAbility();
}
