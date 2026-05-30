import SettingsSectionForm from "./SettingsSectionForm";

export default function NavigatorSettingsPage() {
  return (
    <SettingsSectionForm
      section="navigator"
      title="Navigator Admin"
      testIdPrefix="fleetops-settings-navigator"
      fields={[
        { key: "enabled", label: "Navigator app enabled", type: "switch" },
        { key: "inviteTemplate", label: "Invite link template" },
        { key: "deepLinkBase", label: "Deep link base URL" },
        { key: "qrPayload", label: "QR payload string" },
      ]}
    />
  );
}
