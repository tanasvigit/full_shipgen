import SettingsSectionForm from "./SettingsSectionForm";

export default function FleetopsSettingsHome() {
  return (
    <SettingsSectionForm
      section="branding"
      title="Branding and avatars"
      testIdPrefix="fleetops-settings-overview"
      fields={[
        { key: "productName", label: "Product name" },
        { key: "logoUrl", label: "Logo URL" },
        { key: "primaryColor", label: "Primary color", placeholder: "#0066FF" },
        { key: "accentColor", label: "Accent color", placeholder: "#00E5FF" },
        { key: "avatarsEnabled", label: "Enable avatars", type: "switch" },
      ]}
    />
  );
}
