/** Ember IAM ability slugs and React route alias mapping. */

export const IAM_PERMISSION_ALIASES = {
  "users.view": "iam view user",
  "users.create": "iam create user",
  "users.update": "iam update user",
  "users.delete": "iam delete user",
  "users.export": "iam export user",
  "users.deactivate": "iam deactivate user",
  "users.activate": "iam activate user",
  "users.verify": "iam verify user",
  "users.change-password": "iam change-password-for user",
  "roles.view": "iam view role",
  "roles.create": "iam create role",
  "roles.update": "iam update role",
  "roles.delete": "iam delete role",
  "groups.view": "iam view group",
  "groups.create": "iam create group",
  "groups.update": "iam update group",
  "groups.delete": "iam delete group",
  "roles.export": "iam export role",
  "policies.view": "iam view policy",
  "policies.create": "iam create policy",
  "policies.update": "iam update policy",
  "policies.delete": "iam delete policy",
  "policies.export": "iam export policy",
};

/** Reserved role names (Ember roles/index). */
export function isReservedRoleName(name) {
  const n = String(name || "").trim().toLowerCase();
  return n === "administrator" || n.startsWith("admin");
}

export function resolveIamPermissionCandidates(permission) {
  if (!permission) return [];
  const alias = IAM_PERMISSION_ALIASES[permission];
  return alias && alias !== permission ? [permission, alias] : [permission];
}

export function hasIamPermission(permissionMap, permission, { isAdmin = false } = {}) {
  if (!permission) return true;
  if (isAdmin) return true;
  if (!permissionMap?.size) return false;
  return resolveIamPermissionCandidates(permission).some((p) => permissionMap.has(p));
}

/** Build Spatie-style slug: iam {action} {resource} */
export function iamAbility(action, resource) {
  return `iam ${action} ${resource}`;
}
