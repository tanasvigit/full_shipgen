import SettingsSectionForm from "./SettingsSectionForm";

export default function AvatarsSettingsPage() {
  return (
    <SettingsSectionForm
      section="avatars"
      title="Avatars"
      testIdPrefix="fleetops-settings-avatars"
      fields={[
        { key: "avatarsEnabled", label: "Enable driver/vehicle avatars", type: "switch" },
        { key: "defaultAvatarUrl", label: "Default avatar URL" },
        { key: "gravatarEnabled", label: "Use Gravatar fallback", type: "switch" },
      ]}
    />
  );
}
