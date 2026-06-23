import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { resolveConsoleAdmin } from "@/lib/consoleAccess";
import { SESSION_SCOPE } from "@/lib/sessionScope";

/**
 * PMS permissions for console sidebar when the Parking engine is embedded.
 */
export function useParkingPermissions() {
  const { user, isAuthenticated, isParkingOnlySession, sessionScope, hasPermission, canFleetops } = useAuth();
  const isConsoleAdmin = resolveConsoleAdmin(user, { canFleetops, hasPermission });
  const [permissions, setPermissions] = useState([]);
  const [role, setRole] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const parkingOnly = isParkingOnlySession || sessionScope === SESSION_SCOPE.PARKING_ONLY;

      if (!parkingOnly && !isConsoleAdmin) {
        if (!cancelled) {
          setPermissions([]);
          setReady(true);
        }
        return;
      }

      if (!parkingOnly && !isAuthenticated) {
        if (!cancelled) {
          setPermissions([]);
          setReady(true);
        }
        return;
      }

      try {
        const { restoreSession } = await import("@pms/api/auth");
        const me = await restoreSession();
        if (!cancelled) {
          setPermissions(me?.permissions || []);
          setRole(me?.role || null);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setPermissions([]);
          setRole(null);
          setReady(true);
        }
      }
    }

    setReady(false);
    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isConsoleAdmin, isParkingOnlySession, sessionScope, user?.id]);

  const can = useCallback(
    (permission) => {
      if (!permission) return true;
      if (isConsoleAdmin && sessionScope !== SESSION_SCOPE.PARKING_ONLY) return true;
      return permissions.includes(permission);
    },
    [isConsoleAdmin, permissions, sessionScope],
  );

  const effectiveRole =
    role || (isConsoleAdmin && sessionScope !== SESSION_SCOPE.PARKING_ONLY ? "admin" : role);

  return { can, ready, permissions, role: effectiveRole, isConsoleAdmin };
}
