/**
 * Resolve whether the signed-in Shipgen user is a console administrator.
 * Matches FleetOps ability logic (type admin, Administrator role, see admin).
 */
export function resolveConsoleAdmin(user, { canFleetops, hasPermission } = {}) {
  if (!user || user.isYardOnly) return false;
  if (user.isAdmin) return true;

  const type = String(user?.raw?.type || user?.type || "").toLowerCase();
  if (type === "admin") return true;

  const role = String(
    user?.role ||
      user?.raw?.role_name ||
      user?.raw?.role?.name ||
      (typeof user?.raw?.role === "string" ? user.raw.role : "") ||
      "",
  ).toLowerCase();
  if (role === "admin" || role === "administrator") return true;

  if (typeof canFleetops === "function" && canFleetops("see", "admin")) return true;
  if (typeof hasPermission === "function" && hasPermission("roles.view") && hasPermission("users.view")) {
    return true;
  }

  return false;
}

export function canAccessYardEngine(ctx) {
  if (ctx.sessionScope === "yard-only") return true;
  if (ctx.isConsoleAdmin) return true;
  return ctx.canYardModule("*");
}
