/**
 * Client-side effective permission list for view-only modal (role + policies + direct).
 */
export function computeEffectivePermissions(user) {
  const seen = new Map();
  const add = (p) => {
    if (!p) return;
    const key = String(p.id || p.name || p.slug || "");
    if (!key) return;
    seen.set(key, {
      id: p.id,
      name: p.name || p.slug,
      slug: p.slug || p.name,
      description: p.description || "",
    });
  };

  (user?.permissions || []).forEach(add);
  (user?.directPermissions || []).forEach(add);

  const policies = user?.policies || [];
  policies.forEach((pol) => {
    const perms = pol?.permissions || pol?.raw?.permissions || [];
    perms.forEach(add);
  });

  const role = user?.role;
  if (role && typeof role === "object") {
    (role.permissions || []).forEach(add);
  }

  return [...seen.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)));
}
