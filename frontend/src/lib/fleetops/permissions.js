/**
 * Canonical FleetOps permission checks — mirrors backend Auth::can() / Spatie naming.
 * Format: `fleet-ops {action} {resource}` with wildcards `fleet-ops * {resource}`, `fleet-ops *`.
 */

const SERVICE = "fleet-ops";

function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

/**
 * Merge direct, role, and policy permissions from /users/me — same as Ember current-user#getUserPermissions.
 * Backend Auth::can() uses CompanyUser::getAllPermissions(); /users/me only lists direct permissions on `user.permissions`.
 *
 * @param {Record<string, unknown> | null | undefined} user
 * @returns {Array<{ name?: string } | string>}
 */
export function resolveEffectivePermissions(user) {
  if (!user || typeof user !== "object") return [];

  const collected = [];
  const append = (list) => {
    for (const entry of asArray(list)) {
      if (entry) collected.push(entry);
    }
  };

  append(user.permissions);

  const role = user.role;
  if (role && typeof role === "object") {
    append(role.permissions);
    for (const policy of asArray(role.policies)) {
      append(policy?.permissions);
    }
  }

  for (const policy of asArray(user.policies)) {
    append(policy?.permissions);
  }

  const seen = new Set();
  const unique = [];
  for (const entry of collected) {
    const name = typeof entry === "string" ? entry.trim() : entry?.name?.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    unique.push(typeof entry === "string" ? { name: entry } : entry);
  }

  return unique;
}

/** Actions treated as equivalent for read access (backend seeds see/list/view). */
const READ_ACTION_ALIASES = {
  view: ["view", "see", "list"],
  list: ["list", "see", "view"],
  see: ["see", "view", "list"],
};

function actionVariants(action) {
  const key = String(action || "").toLowerCase();
  return READ_ACTION_ALIASES[key] || [key];
}

/**
 * @param {Set<string>} permissionSet — normalized permission names (direct + role + policies)
 * @param {{ isAdmin?: boolean }} [options] — mirrors Ember dynamic ability isAdmin bypass
 */
export function createFleetopsPermissionChecker(permissionSet, { isAdmin = false } = {}) {
  const has = (name) => {
    if (!name) return true;
    return permissionSet.has(name);
  };

  const can = (action, resource = "order") => {
    if (isAdmin) return true;
    if (!action) return true;

    const variants = actionVariants(action);
    for (const variant of variants) {
      const exact = `${SERVICE} ${variant} ${resource}`;
      if (has(exact)) return true;
      if (has(`${SERVICE} * ${resource}`)) return true;
    }

    if (has(`${SERVICE} *`)) return true;
    if (has(`${SERVICE} * *`)) return true;

    return false;
  };

  return { can, has };
}

export function normalizePermissionNames(permissions = []) {
  const set = new Set();
  for (const entry of permissions) {
    if (typeof entry === "string" && entry.trim()) {
      set.add(entry.trim());
      continue;
    }
    const name = entry?.name || entry?.id;
    if (name) set.add(String(name).trim());
  }
  return set;
}
