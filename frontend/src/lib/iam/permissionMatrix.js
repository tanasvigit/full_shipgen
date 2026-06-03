import { mapPermission } from "@/lib/mappers";

export const PERM_MATRIX_ACTIONS = ["view", "create", "update", "delete", "dispatch", "cancel", "impersonate", "manage"];

export function moduleKeyFromSlug(slug) {
  const s = String(slug || "");
  const i = s.lastIndexOf(".");
  return i > 0 ? s.slice(0, i) : "general";
}

export function actionFromSlug(slug) {
  const s = String(slug || "");
  const i = s.lastIndexOf(".");
  const raw = i > 0 ? s.slice(i + 1) : s;
  const a = raw.toLowerCase();
  if (PERM_MATRIX_ACTIONS.includes(a)) return a;
  return "manage";
}

export function resolveGrantedPermissionIds(entity, permissionRows) {
  const mappedAll = permissionRows.map(mapPermission);
  const raw = entity?.permissions || entity?.permission_records || entity?.assigned_permissions || [];
  const out = new Set();
  raw.forEach((item) => {
    if (item && typeof item === "object" && (item.id || item.uuid)) {
      out.add(String(item.id || item.uuid));
      return;
    }
    const slug = typeof item === "string" ? item : item?.slug || item?.name;
    if (!slug) return;
    const hit = mappedAll.find((m) => m.slug === slug || String(m.id) === slug);
    if (hit?.id) out.add(String(hit.id));
  });
  return out;
}

export function buildPermissionMatrixModules(permsMapped) {
  const m = new Set();
  permsMapped.forEach((p) => m.add(moduleKeyFromSlug(p.slug)));
  return [...m].sort();
}

export function buildPermissionMatrixActions(permsMapped) {
  const a = new Set();
  permsMapped.forEach((p) => a.add(actionFromSlug(p.slug)));
  return PERM_MATRIX_ACTIONS.filter((x) => a.has(x));
}

export function findMatrixPermission(permsMapped, module, action) {
  return permsMapped.find((p) => moduleKeyFromSlug(p.slug) === module && actionFromSlug(p.slug) === action);
}
