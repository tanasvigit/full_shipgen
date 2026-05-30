import SettingsSectionForm from "./SettingsSectionForm";

export default function SchedulingSettingsPage() {
  return (
    <SettingsSectionForm
      section="scheduling"
      title="Scheduling Settings"
      testIdPrefix="fleetops-settings-scheduling"
      fields={[
        { key: "defaultShiftHours", label: "Default shift hours" },
        { key: "allowOverlap", label: "Allow overlapping shifts", type: "switch" },
        { key: "timezone", label: "Scheduling timezone" },
      ]}
    />
  );
}
