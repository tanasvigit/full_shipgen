import { mapPolicy } from "@/lib/mappers";
import { resolveGrantedPermissionIds } from "@/lib/iam/permissionMatrix";

/** Policy records → API id list for `user.policies[]`. */
export function resolvePolicyIds(policies = []) {
  return policies
    .map((p) => p?.raw?.id || p?.raw?.uuid || p?.id || p?.uuid)
    .filter(Boolean)
    .map(String);
}

/** Selected permission id set → API `user.permissions[]`. */
export function resolvePermissionIds(selectedIds) {
  if (selectedIds instanceof Set) return [...selectedIds].map(String);
  return (selectedIds || []).map(String).filter(Boolean);
}

/** Hydrate policy objects from catalog by id. */
export function hydratePoliciesFromIds(catalog = [], ids = []) {
  const idSet = new Set(ids.map(String));
  return catalog.filter((p) => idSet.has(String(p.id || p.uuid)));
}

/** Raw user.policies from GET /users/:id → policy records for attacher. */
export function policiesFromUserRaw(user) {
  const rows = Array.isArray(user?.policies) ? user.policies : [];
  return rows.map((p) => (p?.name ? p : mapPolicy(p).raw || p));
}

/** Direct permission IDs from user.permissions (not effective). */
export function directPermissionIdsFromUser(user, permissionRows = []) {
  return resolveGrantedPermissionIds({ permissions: user?.permissions || [] }, permissionRows);
}
