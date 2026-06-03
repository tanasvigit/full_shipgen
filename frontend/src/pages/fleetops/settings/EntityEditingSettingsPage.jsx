import SettingsSectionForm from "./SettingsSectionForm";

export default function EntityEditingSettingsPage() {
  return (
    <SettingsSectionForm
      section="entityEditing"
      title="Entity editing"
      testIdPrefix="fleetops-settings-entity-editing"
      fields={[
        { key: "drivers_editable", label: "Drivers editable in console", type: "switch" },
        { key: "vehicles_editable", label: "Vehicles editable", type: "switch" },
        { key: "places_editable", label: "Places editable", type: "switch" },
        { key: "orders_editable", label: "Orders editable", type: "switch" },
      ]}
    />
  );
}
