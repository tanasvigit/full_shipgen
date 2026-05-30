import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DeviceEventEmitter } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { authService, type MobileOrganization, type MobileUser } from "@/src/services/authService";
import { getStoredSession, type AuthSession } from "@/src/lib/api";
import { refreshOnOrgSwitch, resetAllQueries } from "@/src/query/invalidation";
import { stopRuntime } from "@/src/runtime/lifecycle";
import { offlineQueue } from "@/src/offline/queue";
import { createPermissionResolver } from "@/src/services/permissions";
import { captureError, clearObservabilityContext } from "@/src/services/observability";
import type { UserDTO } from "@/src/types/api/auth";

type AuthContextValue = {
  authReady: boolean;
  isAuthenticated: boolean;
  session: AuthSession | null;
  user: MobileUser | null;
  organizations: MobileOrganization[];
  activeOrganization: MobileOrganization | null;
  login: (email: string, password: string) => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  canFleetops: (action: string, resource: string) => boolean;
  permissionReason: (action: string, resource: string) => string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<MobileUser | null>(null);
  const [organizations, setOrganizations] = useState<MobileOrganization[]>([]);
  const [activeOrganization, setActiveOrganization] = useState<MobileOrganization | null>(null);
  const clearingRef = useRef(false);

  const clearSession = useCallback(async () => {
    if (clearingRef.current) return;
    clearingRef.current = true;
    try {
      resetAllQueries(queryClient);
      void stopRuntime();
      clearObservabilityContext();
      setSession(null);
      setUser(null);
      setOrganizations([]);
      setActiveOrganization(null);
    } finally {
      clearingRef.current = false;
    }
  }, [queryClient]);

  const refresh = useCallback(async () => {
    try {
      const currentSession = await getStoredSession();
      if (!currentSession?.token) {
        await clearSession();
        return;
      }
      const result = await authService.bootstrap();
      setSession(result.session);
      setUser(result.me);
      setOrganizations(result.organizations);
      setActiveOrganization(result.activeOrg);
    } catch (error) {
      captureError(error, { operation: "auth.refresh" });
      await clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    refresh().finally(() => setAuthReady(true));
  }, [refresh]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("fleetbase:unauthorized", () => {
      void clearSession();
    });
    return () => sub.remove();
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      await authService.login(email, password);
      await refresh();
    },
    [refresh]
  );

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      const previousCompany = activeOrganization?.uuid || activeOrganization?.id || null;
      const result = await authService.switchOrganization(organizationId);
      const nextCompany = result.activeOrg?.uuid || result.activeOrg?.id || null;
      if (previousCompany) {
        await offlineQueue.purgeTenant(previousCompany);
      }
      await refreshOnOrgSwitch(queryClient, previousCompany, nextCompany);
      await refresh();
    },
    [activeOrganization?.id, activeOrganization?.uuid, queryClient, refresh]
  );

  const logout = useCallback(async () => {
    await authService.logout();
    await clearSession();
  }, [clearSession]);

  const permissionResolver = useMemo(
    () => createPermissionResolver(user?.raw as UserDTO | undefined),
    [user?.raw]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      authReady,
      isAuthenticated: Boolean(session?.token),
      session,
      user,
      organizations,
      activeOrganization,
      login,
      switchOrganization,
      logout,
      refresh,
      canFleetops: permissionResolver.canFleetops,
      permissionReason: permissionResolver.reasonForFleetops,
    }),
    [
      activeOrganization,
      authReady,
      login,
      logout,
      organizations,
      permissionResolver.canFleetops,
      permissionResolver.reasonForFleetops,
      refresh,
      session,
      switchOrganization,
      user,
    ]
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
