import { useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { hasIamPermission, iamAbility, resolveIamPermissionCandidates } from "@/lib/iam/permissions";

export function useIamAbility() {
  const { hasPermission, user } = useAuth();

  const can = useCallback(
    (action, resource) => {
      const slug = iamAbility(action, resource);
      return hasPermission(slug) || hasPermission(`${resource}s.${action}`);
    },
    [hasPermission],
  );

  const cannot = useCallback((action, resource) => !can(action, resource), [can]);

  return useMemo(
    () => ({
      can,
      cannot,
      isAdmin: Boolean(user?.isAdmin),
      canViewUser: can("view", "user"),
      canCreateUser: can("create", "user"),
      canUpdateUser: can("update", "user"),
      canDeleteUser: can("delete", "user"),
      canExportUser: can("export", "user"),
      canDeactivateUser: can("deactivate", "user"),
      canActivateUser: can("activate", "user"),
      canVerifyUser: can("verify", "user"),
      canChangePasswordForUser: can("change-password-for", "user"),
      canViewRole: can("view", "role"),
      canCreateRole: can("create", "role"),
      canUpdateRole: can("update", "role"),
      canDeleteRole: can("delete", "role"),
      canExportRole: can("export", "role"),
      canViewGroup: can("view", "group"),
      canCreateGroup: can("create", "group"),
      canUpdateGroup: can("update", "group"),
      canDeleteGroup: can("delete", "group"),
      canViewPolicy: can("view", "policy"),
      canCreatePolicy: can("create", "policy"),
      canUpdatePolicy: can("update", "policy"),
      canDeletePolicy: can("delete", "policy"),
      canExportPolicy: can("export", "policy"),
    }),
    [can, cannot, user?.isAdmin],
  );
}

export function useIamPermission(permission) {
  const { user } = useAuth();
  const permissionMap = useMemo(() => {
    const set = new Set();
    (user?.permissions || []).forEach((p) => {
      if (typeof p === "string") set.add(p);
      else if (p?.name) set.add(p.name);
    });
    return set;
  }, [user?.permissions]);

  return hasIamPermission(permissionMap, permission, { isAdmin: user?.isAdmin });
}

export { resolveIamPermissionCandidates };
