import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SESSION_SCOPE } from "@/lib/sessionScope";
import { resolveConsoleAdmin } from "@/lib/consoleAccess";
import { hasPermission as yardHasPermission, MOD } from "@yard/constants/permissions";
import { clearTokens, getAccessToken, getRefreshToken } from "@yard/services/authStorage";

const ALL_YARD_MODULES = Object.values(MOD);

async function loadYardPermissionsFromSession({ isShipgenAdmin, isYardOnlySession, shipgenToken }) {
  const { platformLogin, fetchAuthMe } = await import("@yard/services/authApi");
  const hasYardSession = getAccessToken() || getRefreshToken();

  if (isYardOnlySession) {
    if (!hasYardSession) return [];
    try {
      const me = await fetchAuthMe({ silent: true });
      return me?.permissions || [];
    } catch {
      clearTokens();
      return [];
    }
  }

  if (isShipgenAdmin) {
    if (!hasYardSession && shipgenToken) {
      try {
        await platformLogin(shipgenToken);
      } catch {
        clearTokens();
        return [];
      }
    } else if (!hasYardSession) {
      return [];
    }

    try {
      const me = await fetchAuthMe({ silent: true });
      return me?.permissions?.length ? me.permissions : ["*"];
    } catch {
      clearTokens();
      if (!shipgenToken) return [];
      try {
        await platformLogin(shipgenToken);
        const me = await fetchAuthMe({ silent: true });
        return me?.permissions?.length ? me.permissions : ["*"];
      } catch {
        clearTokens();
        return [];
      }
    }
  }

  return [];
}

/**
 * Yard module permissions for console sidebar/header (reads YMS JWT session).
 * Only Shipgen admins and yard-only sessions receive Yard engine access.
 */
export function useYardPermissions() {
  const { user, isAuthenticated, isYardOnlySession, sessionScope, hasPermission, canFleetops } = useAuth();
  const isConsoleAdmin = resolveConsoleAdmin(user, { canFleetops, hasPermission });
  const [permissions, setPermissions] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const yardOnly = isYardOnlySession || sessionScope === SESSION_SCOPE.YARD_ONLY;

      if (!yardOnly && !isConsoleAdmin) {
        if (!cancelled) {
          setPermissions([]);
          setReady(true);
        }
        return;
      }

      if (!yardOnly && !isAuthenticated) {
        if (!cancelled) {
          setPermissions([]);
          setReady(true);
        }
        return;
      }

      const { authStorage } = await import("@/lib/storage");
      const shipgenToken = authStorage.get()?.token;
      const perms = await loadYardPermissionsFromSession({
        isShipgenAdmin: isConsoleAdmin,
        isYardOnlySession: yardOnly,
        shipgenToken,
      });

      if (!cancelled) {
        setPermissions(yardOnly ? perms : isConsoleAdmin ? ["*"] : perms);
        setReady(true);
      }
    }

    setReady(false);
    load();
    return () => {
      cancelled = true;
    };
  }, [isConsoleAdmin, isAuthenticated, isYardOnlySession, sessionScope, user?.id]);

  const can = useCallback(
    (modulePermission) => {
      if (isConsoleAdmin && sessionScope !== SESSION_SCOPE.YARD_ONLY) return true;
      if (modulePermission === "*") {
        return ALL_YARD_MODULES.some((mod) => yardHasPermission(permissions, mod));
      }
      return yardHasPermission(permissions, modulePermission);
    },
    [isConsoleAdmin, permissions, sessionScope],
  );

  return { can, ready, permissions, isShipgenAdmin: isConsoleAdmin };
}
