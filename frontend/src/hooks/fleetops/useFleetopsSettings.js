import { useFleetopsSettingsContext } from "@/contexts/fleetops/FleetopsSettingsContext";

export function useFleetopsSettings(sectionKey) {
  const { settings, loading, saveSection, reload } = useFleetopsSettingsContext();
  return {
    value: settings?.[sectionKey] || {},
    loading,
    reload,
    save: (values) => saveSection(sectionKey, values),
  };
}
