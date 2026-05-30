import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "@/lib/auth";
import { toApiError } from "@/lib/api";
import { createFleetopsPermissionChecker } from "@/lib/fleetops/permissions";
import { loadingManager, MESSAGES } from "@/services/loading-manager";

const AuthContext = createContext(null);

const toPermissionMap = (permissions = []) => {
  const map = new Set();
  permissions.forEach((permission) => {
    if (typeof permission === "string") {
      map.add(permission);
      return;
    }
    const key = permission?.name || permission?.id;
    if (key) {
      map.add(key);
    }
  });
  return map;
};

export function AuthProvider({ children }) {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [activeOrganization, setActiveOrganization] = useState(null);

  const resetSession = useCallback(() => {
    authService.clearSession();
    setSession(null);
    setUser(null);
    setOrganizations([]);
    setActiveOrganization(null);
  }, []);

  const bootstrap = useCallback(async () => {
    const auth = authService.getAuth();
    if (!auth?.token) {
      loadingManager.setAuth(false);
      loadingManager.setBootstrap(false);
      setAuthReady(true);
      return;
    }
    loadingManager.setAuth(true, MESSAGES.auth);
    try {
      setSession(auth);
      const { me, organizations: orgs, activeOrg } = await authService.bootstrap();
      setUser(me);
      setOrganizations(orgs);
      setActiveOrganization(activeOrg);
    } catch {
      resetSession();
    } finally {
      loadingManager.setAuth(false);
      loadingManager.setBootstrap(false);
      setAuthReady(true);
    }
  }, [resetSession]);

  useEffect(() => {
    bootstrap();
    const onUnauthorized = () => resetSession();
    window.addEventListener("fleetbase:unauthorized", onUnauthorized);
    return () => window.removeEventListener("fleetbase:unauthorized", onUnauthorized);
  }, [bootstrap, resetSession]);

  const login = useCallback(async (credentials) => {
    try {
      const auth = await authService.login(credentials);
      if (auth.requiresTwoFactor) {
        setSession(auth);
        return { requiresTwoFactor: true };
      }
      const { me, organizations: orgs, activeOrg } = await authService.bootstrap();
      setSession(auth);
      setUser(me);
      setOrganizations(orgs);
      setActiveOrganization(activeOrg);
      return { requiresTwoFactor: false };
    } catch (error) {
      throw toApiError(error);
    }
  }, []);

  const completeTwoFactor = useCallback(async (code) => {
    try {
      await authService.validateTwoFactor(code);
      const auth = authService.getAuth();
      const { me, organizations: orgs, activeOrg } = await authService.bootstrap();
      setSession(auth);
      setUser(me);
      setOrganizations(orgs);
      setActiveOrganization(activeOrg);
    } catch (error) {
      throw toApiError(error);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    resetSession();
  }, [resetSession]);

  const switchOrganization = useCallback(async (organizationId) => {
    try {
      const { organizations: orgs, activeOrg } = await authService.switchOrganization(organizationId);
      const { me } = await authService.bootstrap();
      setUser(me);
      setOrganizations(orgs);
      setActiveOrganization(activeOrg);
    } catch (error) {
      throw toApiError(error);
    }
  }, []);

  const permissionMap = useMemo(() => toPermissionMap(user?.permissions), [user?.permissions]);
  const fleetopsChecker = useMemo(
    () => createFleetopsPermissionChecker(permissionMap, { isAdmin: Boolean(user?.isAdmin) }),
    [permissionMap, user?.isAdmin],
  );
  const hasPermission = useCallback(
    (permission) => {
      if (!permission) return true;
      if (user?.isAdmin) return true;
      if (!permissionMap || permissionMap.size === 0) {
        return import.meta.env?.VITE_FLEETOPS_PERMISSIVE === "true";
      }
      if (permission.startsWith("fleet-ops ")) {
        const parts = permission.split(/\s+/);
        if (parts.length >= 3) {
          return fleetopsChecker.can(parts[1], parts[2]);
        }
        if (parts[1] === "*") {
          return true;
        }
      }
      return permissionMap.has(permission);
    },
    [permissionMap, fleetopsChecker, user?.isAdmin],
  );

  const value = useMemo(
    () => ({
      authReady,
      isAuthenticated: Boolean(session?.token),
      requiresTwoFactor: Boolean(session?.requiresTwoFactor),
      session,
      user,
      organizations,
      activeOrganization,
      login,
      completeTwoFactor,
      logout,
      switchOrganization,
      hasPermission,
      refresh: bootstrap,
    }),
    [
      authReady,
      session,
      user,
      organizations,
      activeOrganization,
      login,
      completeTwoFactor,
      logout,
      switchOrganization,
      hasPermission,
      bootstrap,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
