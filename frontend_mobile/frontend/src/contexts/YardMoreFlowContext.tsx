import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "expo-router";
import { activeYardModuleKey, YARD_NO_MODULE_BAR_KEYS } from "@/src/lib/yardModuleNavigation";

type YardMoreFlowContextValue = {
  inMoreFlow: boolean;
  startMoreFlow: () => void;
  endMoreFlow: () => void;
};

const YardMoreFlowContext = createContext<YardMoreFlowContextValue | null>(null);

export function YardMoreFlowProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [inMoreFlow, setInMoreFlow] = useState(false);

  useEffect(() => {
    const key = activeYardModuleKey(pathname);
    if (!key) return;
    if (YARD_NO_MODULE_BAR_KEYS.has(key) && key !== "more") {
      setInMoreFlow(false);
    }
  }, [pathname]);

  const startMoreFlow = useCallback(() => {
    setInMoreFlow(true);
  }, []);

  const endMoreFlow = useCallback(() => {
    setInMoreFlow(false);
  }, []);

  const value = useMemo(
    () => ({ inMoreFlow, startMoreFlow, endMoreFlow }),
    [endMoreFlow, inMoreFlow, startMoreFlow],
  );

  return <YardMoreFlowContext.Provider value={value}>{children}</YardMoreFlowContext.Provider>;
}

export function useYardMoreFlow() {
  const context = useContext(YardMoreFlowContext);
  if (!context) {
    throw new Error("useYardMoreFlow must be used within YardMoreFlowProvider");
  }
  return context;
}
