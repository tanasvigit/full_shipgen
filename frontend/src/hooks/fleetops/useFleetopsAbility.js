import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createFleetopsPermissionChecker,
  normalizePermissionNames,
  resolveEffectivePermissions,
} from "@/lib/fleetops/permissions";
import { isFleetopsPermissiveMode } from "@/lib/fleetops/permissiveMode";

/** Deny-all ability object for tests. Do not use in production UI paths. */
export const FLEETOPS_ABILITY_DENY_ALL = {
  can: () => false,
  cannot: () => true,
  role: "viewer",
  isAdmin: false,
  isDispatcher: false,
  isViewer: true,
  isDriver: false,
  permissionsResolved: true,
  permissionsUnknown: true,
  canViewOrder: false,
  canCreateOrder: false,
  canUpdateOrder: false,
  canDeleteOrder: false,
  canDispatchOrder: false,
  canCancelOrder: false,
  canAssignDriver: false,
  canExportOrder: false,
  canImportOrder: false,
  canBulkManage: false,
  canListOrderConfig: false,
  canViewOrderConfig: false,
  canCreateOrderConfig: false,
  canUpdateOrderConfig: false,
  canDeleteOrderConfig: false,
  canCloneOrderConfig: false,
  canEditRoute: false,
  canCommentOrder: false,
};

/** @deprecated Use FLEETOPS_ABILITY_DENY_ALL — permissive fallback removed (G003). */
export const FLEETOPS_ABILITY_FALLBACK = FLEETOPS_ABILITY_DENY_ALL;

/**
 * FleetOps ability checks — `fleet-ops {action} {resource}` (Spatie).
 * Fail-closed when permissions are empty unless VITE_FLEETOPS_PERMISSIVE=true.
 */
export function useFleetopsAbility() {
  const { user, authReady } = useAuth();

  const isAdmin = Boolean(user?.isAdmin);

  const effectivePermissions = useMemo(
    () => resolveEffectivePermissions(user),
    [user],
  );

  const permissionSet = useMemo(
    () => normalizePermissionNames(effectivePermissions),
    [effectivePermissions],
  );

  const permissionsResolved = authReady && Boolean(user);
  const permissionsEmpty = permissionSet.size === 0;
  const permissionsUnknown = permissionsResolved && permissionsEmpty && !isAdmin;

  const checker = useMemo(
    () => createFleetopsPermissionChecker(permissionSet, { isAdmin }),
    [permissionSet, isAdmin],
  );

  const can = useCallback(
    (action, resource = "order") => {
      if (isAdmin) return true;
      if (!permissionsResolved) return false;
      if (permissionsEmpty) return isFleetopsPermissiveMode();
      return checker.can(action, resource);
    },
    [checker, permissionsResolved, permissionsEmpty, isAdmin],
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
    permissionsResolved,
    permissionsUnknown,
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
