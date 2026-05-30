import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { validateRuntimeConfig, getRuntimeConfigSummary } from "@/lib/runtimeConfig";
import { runPlatformHealthCheck } from "@/services/platformHealth";

const PlatformContext = createContext(null);

const HEALTH_POLL_MS = 120000;

export function PlatformProvider({ children }) {
  const { isAuthenticated, authReady } = useAuth();
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [configIssues, setConfigIssues] = useState([]);
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const refreshInFlight = useRef(false);

  useEffect(() => {
    setConfigIssues(validateRuntimeConfig());
  }, []);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const refreshHealth = useCallback(async () => {
    if (refreshInFlight.current) return health;
    if (!authReady || !isAuthenticated) {
      return null;
    }
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return health;
    }

    refreshInFlight.current = true;
    setHealthLoading(true);
    try {
      const result = await runPlatformHealthCheck();
      setHealth(result);
      return result;
    } catch {
      setHealth({
        api: { ok: false, degraded: true, error: "Health check failed", settings: null },
        websocket: { ok: false, state: "unknown", degraded: true },
        checkedAt: new Date().toISOString(),
        healthy: false,
        degraded: true,
      });
      return null;
    } finally {
      refreshInFlight.current = false;
      setHealthLoading(false);
    }
  }, [authReady, isAuthenticated]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return undefined;
    void refreshHealth();
    const id = setInterval(() => void refreshHealth(), HEALTH_POLL_MS);
    return () => clearInterval(id);
  }, [authReady, isAuthenticated, refreshHealth]);

  const isDegraded = useMemo(() => {
    if (!online) return true;
    if (!health) return false;
    return Boolean(health.degraded || !health.healthy);
  }, [online, health]);

  const value = useMemo(
    () => ({
      online,
      configIssues,
      configSummary: getRuntimeConfigSummary(),
      health,
      healthLoading,
      refreshHealth,
      isDegraded,
    }),
    [online, configIssues, health, healthLoading, refreshHealth, isDegraded],
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform must be used within PlatformProvider");
  return ctx;
}
