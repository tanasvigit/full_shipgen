import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useYardPermissions } from "@/hooks/useYardPermissions";
import { canAccessPath, getDefaultEngineHome, getEngineDashboardRoute } from "@/lib/engineAccess";
import { useEngineAccessContext } from "@/hooks/useEngineAccessContext";
import { SESSION_SCOPE } from "@/lib/sessionScope";

export default function EngineScopeGuard({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionScope } = useAuth();
  const { can: canYardModule, ready: yardReady } = useYardPermissions();
  const ctx = useEngineAccessContext();

  useEffect(() => {
    const dashboardRoute = getEngineDashboardRoute(ctx);

    if (sessionScope === SESSION_SCOPE.YARD_ONLY) {
      if (!location.pathname.startsWith("/yard")) {
        navigate(dashboardRoute, { replace: true });
      }
      return;
    }

    if (sessionScope === SESSION_SCOPE.PARKING_ONLY) {
      if (!location.pathname.startsWith("/parking")) {
        navigate(dashboardRoute, { replace: true });
      }
      return;
    }

    if (location.pathname === "/" && dashboardRoute !== "/") {
      navigate(dashboardRoute, { replace: true });
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
