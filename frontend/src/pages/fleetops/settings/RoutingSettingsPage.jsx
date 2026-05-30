import SettingsSectionForm from "./SettingsSectionForm";

export default function RoutingSettingsPage() {
  return (
    <SettingsSectionForm
      section="routing"
      title="Routing Settings"
      testIdPrefix="fleetops-settings-routing"
      fields={[
        { key: "defaultProfile", label: "Default route profile" },
        { key: "trafficAware", label: "Traffic-aware routing", type: "switch" },
        { key: "optimizeStops", label: "Optimize stop sequence", type: "switch" },
      ]}
    />
  );
}
