import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useYardPermissions } from "@/hooks/useYardPermissions";
import { useParkingPermissions } from "@/hooks/useParkingPermissions";
import { resolveConsoleAdmin } from "@/lib/consoleAccess";
import { getEngineDashboardRoute } from "@/lib/engineAccess";

/** Shared engine-access context for header, sidebar, and route guards. */
export function useEngineAccessContext() {
  const { user, sessionScope, hasPermission, canFleetops } = useAuth();
  const { can: canYardModule } = useYardPermissions();
  const { role: parkingRole } = useParkingPermissions();

  const isConsoleAdmin = useMemo(
    () => resolveConsoleAdmin(user, { canFleetops, hasPermission }),
    [user, canFleetops, hasPermission],
  );

  return useMemo(
    () => ({
      isConsoleAdmin,
      isAdmin: isConsoleAdmin,
      sessionScope,
      hasPermission,
      canFleetops,
      canYardModule,
      parkingRole,
      userPermissions: user?.permissions,
    }),
    [isConsoleAdmin, sessionScope, hasPermission, canFleetops, canYardModule, parkingRole, user?.permissions],
  );
}

export function useEngineDashboardRoute() {
  const ctx = useEngineAccessContext();
  return useMemo(() => getEngineDashboardRoute(ctx), [ctx]);
}

export function isDashboardPathActive(pathname, dashboardRoute) {
  if (dashboardRoute === "/") {
    return pathname === "/" || pathname.startsWith("/notifications");
  }
  return pathname === dashboardRoute || pathname.startsWith(`${dashboardRoute}/`);
}
