import SettingsSectionForm from "./SettingsSectionForm";

export default function OrchestratorSettingsPage() {
  return (
    <SettingsSectionForm
      section="orchestrator"
      title="Orchestrator Settings"
      testIdPrefix="fleetops-settings-orchestrator"
      fields={[
        { key: "autoDispatch", label: "Auto dispatch", type: "switch" },
        { key: "maxBatchSize", label: "Max batch size" },
        { key: "fallbackToManual", label: "Fallback to manual queue", type: "switch" },
      ]}
    />
  );
}
