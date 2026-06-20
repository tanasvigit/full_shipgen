import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useYardPermissions } from "@/hooks/useYardPermissions";
import { canAccessPath, getDefaultEngineHome } from "@/lib/engineAccess";

export default function EngineScopeGuard({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, sessionScope, hasPermission, canFleetops } = useAuth();
  const { can: canYardModule, ready: yardReady } = useYardPermissions();

  const ctx = useMemo(
    () => ({
      isAdmin: Boolean(user?.isAdmin),
      sessionScope,
      hasPermission,
      canFleetops,
      canYardModule,
      userPermissions: user?.permissions,
    }),
    [user?.isAdmin, user?.permissions, sessionScope, hasPermission, canFleetops, canYardModule],
  );

  useEffect(() => {
    if (sessionScope === "yard-only") {
      if (!location.pathname.startsWith("/yard")) {
        navigate("/yard", { replace: true });
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
