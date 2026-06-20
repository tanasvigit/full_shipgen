import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DeviceEventEmitter } from "react-native";
import { ymsAuthService, type YardUser } from "@/src/services/ymsAuthService";
import { getStoredYardSession, type YardSession } from "@/src/lib/ymsApi";
import { setActiveModule } from "@/src/lib/appModule";

type YardAuthContextValue = {
  yardReady: boolean;
  isYardAuthenticated: boolean;
  session: YardSession | null;
  user: YardUser | null;
  login: (email: string, password: string) => Promise<YardUser>;
  logout: (options?: { notifyServer?: boolean }) => Promise<void>;
  refresh: () => Promise<void>;
  can: (permission: string) => boolean;
  isGateOperator: boolean;
  isYardAdmin: boolean;
};

const YardAuthContext = createContext<YardAuthContextValue | null>(null);

export function YardAuthProvider({ children }: { children: React.ReactNode }) {
  const [yardReady, setYardReady] = useState(false);
  const [session, setSession] = useState<YardSession | null>(null);
  const [user, setUser] = useState<YardUser | null>(null);

  const clearSession = useCallback(async () => {
    setSession(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const current = await getStoredYardSession();
      if (!current?.accessToken) {
        await clearSession();
        return;
      }
      const result = await ymsAuthService.bootstrap();
      setSession(result.session);
      setUser(result.me);
    } catch {
      await clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    refresh().finally(() => setYardReady(true));
  }, [refresh]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener("shipgen:yard-unauthorized", () => {
      void clearSession();
    });
    return () => sub.remove();
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await ymsAuthService.login(email, password);
      setSession(result.session);
      setUser(result.me);
      await setActiveModule("yard");
      return result.me as YardUser;
    },
    []
  );

  const logout = useCallback(async (options?: { notifyServer?: boolean }) => {
    await ymsAuthService.logout(options);
    await setActiveModule(null);
    await clearSession();
  }, [clearSession]);

  const can = useCallback(
    (permission: string) => {
      if (!user) return false;
      if (user.permissions.includes("*")) return true;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      yardReady,
      isYardAuthenticated: Boolean(session?.accessToken && user),
      session,
      user,
      login,
      logout,
      refresh,
      can,
      isGateOperator: user?.role === "gate_operator",
      isYardAdmin: user?.role === "yard_admin",
    }),
    [yardReady, session, user, login, logout, refresh, can]
  );

  return <YardAuthContext.Provider value={value}>{children}</YardAuthContext.Provider>;
}

export function useYardAuth() {
  const ctx = useContext(YardAuthContext);
  if (!ctx) throw new Error("useYardAuth must be used within YardAuthProvider");
  return ctx;
}
