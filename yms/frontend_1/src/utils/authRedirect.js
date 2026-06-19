import { firstAccessiblePath, resolveRouteModule } from "../constants/navigation";
import { hasPermission } from "../constants/permissions";

/** Post-login destination — never honor `from` unless the role has module access. */
export function resolvePostLoginPath(permissions, fromPath) {
  const from = typeof fromPath === "string" && fromPath !== "/login" ? fromPath : null;
  if (from) {
    const required = resolveRouteModule(from);
    if (!required || hasPermission(permissions, required)) {
      return from;
    }
  }
  return firstAccessiblePath((module) => hasPermission(permissions, module));
}
