import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createFleetopsPermissionChecker, normalizePermissionNames } from "@/lib/fleetops/permissions";

const PERMISSIVE =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_FLEETOPS_PERMISSIVE === "true";

/**
 * FleetOps permission checks — same resolver as useFleetopsAbility (Spatie format).
 */
export function useFleetopsPermission() {
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
