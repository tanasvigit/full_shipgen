import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEMO_RISKS,
  DEMO_SUGGESTIONS,
  getDemoDriversAnimated,
  getDemoOrders,
} from "@/lib/demo/demoDataset";

const DEMO_KEY = "fleetops.demoMode";

const DemoModeContext = createContext(null);

export function DemoModeProvider({ children }) {
  const [enabled, setEnabled] = useState(() => {
    try {
      return localStorage.getItem(DEMO_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, [enabled]);

  const setDemoMode = useCallback((on) => {
    setEnabled(on);
    try {
      localStorage.setItem(DEMO_KEY, on ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const demoOrders = useMemo(() => (enabled ? getDemoOrders() : []), [enabled, tick]);
  const demoDrivers = useMemo(() => (enabled ? getDemoDriversAnimated() : []), [enabled, tick]);

  const value = useMemo(
    () => ({
      isDemoMode: enabled,
      setDemoMode,
      toggleDemoMode: () => setDemoMode(!enabled),
      demoOrders,
      demoDrivers,
      demoRisks: enabled ? DEMO_RISKS : [],
      demoSuggestions: enabled ? DEMO_SUGGESTIONS : [],
    }),
    [enabled, setDemoMode, demoOrders, demoDrivers],
  );

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error("useDemoMode must be used within DemoModeProvider");
  return ctx;
}
