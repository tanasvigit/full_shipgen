type PermissionEntry = { name?: string; id?: string } | string;
type UserLike = {
  is_admin?: boolean;
  type?: string;
  permissions?: PermissionEntry[];
  role?: { permissions?: PermissionEntry[]; policies?: { permissions?: PermissionEntry[] }[] } | string;
  policies?: { permissions?: PermissionEntry[] }[];
};

const READ_ALIASES: Record<string, string[]> = {
  view: ["view", "see", "list"],
  see: ["see", "view", "list"],
  list: ["list", "see", "view"],
};

function asArray<T>(value: unknown): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [];
}

function normalizePermissionName(entry: PermissionEntry): string | null {
  if (typeof entry === "string") {
    const v = entry.trim();
    return v || null;
  }
  const v = String(entry?.name || entry?.id || "").trim();
  return v || null;
}

export function resolveEffectivePermissions(user: UserLike | null | undefined): Set<string> {
  const set = new Set<string>();
  if (!user) return set;

  const push = (entry: PermissionEntry) => {
    const name = normalizePermissionName(entry);
    if (name) set.add(name);
  };

  asArray<PermissionEntry>(user.permissions).forEach(push);

  if (typeof user.role === "object" && user.role) {
    asArray<PermissionEntry>(user.role.permissions).forEach(push);
    asArray<{ permissions?: PermissionEntry[] }>(user.role.policies).forEach((policy) => {
      asArray<PermissionEntry>(policy.permissions).forEach(push);
    });
  }

  asArray<{ permissions?: PermissionEntry[] }>(user.policies).forEach((policy) => {
    asArray<PermissionEntry>(policy.permissions).forEach(push);
  });

  return set;
}

export function isAdminUser(user: UserLike | null | undefined) {
  if (!user) return false;
  if (user.is_admin) return true;
  return String(user.type || "").toLowerCase() === "admin";
}

export function createPermissionResolver(user: UserLike | null | undefined) {
  const permissions = resolveEffectivePermissions(user);
  const isAdmin = isAdminUser(user);

  const has = (permission: string) => {
    if (!permission) return true;
    if (isAdmin) return true;
    return permissions.has(permission);
  };

  const canFleetops = (action: string, resource: string) => {
    if (isAdmin) return true;
    const a = String(action || "").toLowerCase();
    const r = String(resource || "").toLowerCase();
    const variants = READ_ALIASES[a] || [a];

    for (const v of variants) {
      if (has(`fleet-ops ${v} ${r}`)) return true;
      if (has(`fleet-ops * ${r}`)) return true;
    }
    if (has("fleet-ops *")) return true;
    if (has("fleet-ops * *")) return true;
    return false;
  };

  return {
    isAdmin,
    permissions,
    has,
    canFleetops,
    reasonForFleetops(action: string, resource: string) {
      if (canFleetops(action, resource)) return null;
      return `Requires permission: fleet-ops ${action} ${resource}`;
    },
  };
}

