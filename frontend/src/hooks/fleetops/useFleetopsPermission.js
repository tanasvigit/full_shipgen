import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  createFleetopsPermissionChecker,
  normalizePermissionNames,
  resolveEffectivePermissions,
} from "@/lib/fleetops/permissions";
import { isFleetopsPermissiveMode } from "@/lib/fleetops/permissiveMode";

/**
 * FleetOps permission checks — same resolver as useFleetopsAbility (Spatie format).
 */
export function useFleetopsPermission() {
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

  return {
    canViewOrder: can("view", "order"),
    canCreateOrder: can("create", "order"),
    canUpdateOrder: can("update", "order"),
    canDeleteOrder: can("delete", "order"),
    canDispatchOrder: can("dispatch", "order"),
    canCancelOrder: can("cancel", "order"),
    canAssignDriver: can("assign", "driver") || can("update", "order"),
    canExportOrder: can("export", "order") || can("view", "order"),
    canImportOrder: can("import", "order") || can("create", "order"),
    can,
  };
}
