import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fleetopsService } from "@/services/fleetops";

const SECTIONS = ["navigator", "notifications", "routing", "orchestrator", "scheduling", "branding", "avatars"];
const FleetopsSettingsContext = createContext(null);

export function FleetopsSettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const next = {};
    for (const section of SECTIONS) {
      next[section] = await fleetopsService.listSettingsSection(section).catch(() => ({}));
    }
    setSettings(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSection = useCallback(async (section, values) => {
    const saved = await fleetopsService.saveSettingsSection(section, values);
    setSettings((prev) => ({ ...prev, [section]: saved || values }));
    return saved || values;
  }, []);

  const value = useMemo(
    () => ({
      settings,
      loading,
      reload: load,
      saveSection,
    }),
    [settings, loading, load, saveSection],
  );

  return <FleetopsSettingsContext.Provider value={value}>{children}</FleetopsSettingsContext.Provider>;
}

export function useFleetopsSettingsContext() {
  const ctx = useContext(FleetopsSettingsContext);
  if (!ctx) throw new Error("useFleetopsSettingsContext must be used within FleetopsSettingsProvider");
  return ctx;
}
