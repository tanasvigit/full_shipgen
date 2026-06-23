import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useYardPermissions } from "@/hooks/useYardPermissions";
import { canAccessPath, getDefaultEngineHome } from "@/lib/engineAccess";
import { resolveConsoleAdmin } from "@/lib/consoleAccess";

export default function EngineScopeGuard({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, sessionScope, hasPermission, canFleetops } = useAuth();
  const { can: canYardModule, ready: yardReady } = useYardPermissions();

  const ctx = useMemo(
    () => ({
      isConsoleAdmin: resolveConsoleAdmin(user, { canFleetops, hasPermission }),
      isAdmin: resolveConsoleAdmin(user, { canFleetops, hasPermission }),
      sessionScope,
      hasPermission,
      canFleetops,
      canYardModule,
      userPermissions: user?.permissions,
    }),
    [user, sessionScope, hasPermission, canFleetops, canYardModule],
  );

  useEffect(() => {
    if (sessionScope === "yard-only") {
      if (!location.pathname.startsWith("/yard")) {
        navigate("/yard", { replace: true });
      }
      return;
    }

    if (sessionScope === "parking-only") {
      if (!location.pathname.startsWith("/parking")) {
        navigate("/parking", { replace: true });
      }
      return;
    }

    if (location.pathname.startsWith("/yard") && !yardReady) {
      return;
    }

    if (!canAccessPath(location.pathname, ctx)) {
      navigate(getDefaultEngineHome(ctx), { replace: true });
    }
  }, [location.pathname, sessionScope, yardReady, ctx, navigate]);

  return children;
}
