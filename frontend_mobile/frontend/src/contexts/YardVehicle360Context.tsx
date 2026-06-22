import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Vehicle360Sheet from "@/src/components/yard/Vehicle360Sheet";

export type Vehicle360Target = {
  vehicleId?: string | null;
  query?: string | null;
};

type YardVehicle360ContextValue = {
  openVehicle360: (target: Vehicle360Target) => void;
  closeVehicle360: () => void;
};

const YardVehicle360Context = createContext<YardVehicle360ContextValue | null>(null);

export function YardVehicle360Provider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [target, setTarget] = useState<Vehicle360Target | null>(null);

  const openVehicle360 = useCallback((next: Vehicle360Target) => {
    setTarget(next);
    setVisible(true);
  }, []);

  const closeVehicle360 = useCallback(() => {
    setVisible(false);
    setTarget(null);
  }, []);

  const value = useMemo(
    () => ({ openVehicle360, closeVehicle360 }),
    [closeVehicle360, openVehicle360],
  );

  return (
    <YardVehicle360Context.Provider value={value}>
      {children}
      <Vehicle360Sheet visible={visible} target={target} onClose={closeVehicle360} />
    </YardVehicle360Context.Provider>
  );
}

export function useYardVehicle360() {
  const ctx = useContext(YardVehicle360Context);
  if (!ctx) throw new Error("useYardVehicle360 must be used within YardVehicle360Provider");
  return ctx;
}
