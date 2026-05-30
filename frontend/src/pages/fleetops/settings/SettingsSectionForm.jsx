import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFleetopsSettings } from "@/hooks/fleetops/useFleetopsSettings";

export default function SettingsSectionForm({ section, title, fields, testIdPrefix }) {
  const { value, loading, save } = useFleetopsSettings(section);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(value || {});
  }, [value]);

  const onSave = async () => {
    setSaving(true);
    try {
      await save(form);
      toast.success(`${title} settings saved`);
    } catch (error) {
      toast.error(error?.friendlyMessage || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6" data-testid={`${testIdPrefix}-page`}>
      <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4">
        <h2 className="font-semibold text-[#0A0E1A]">{title}</h2>
        {fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider font-mono text-[#374151]">{field.label}</Label>
            {field.type === "switch" ? (
              <Switch
                checked={Boolean(form[field.key])}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, [field.key]: checked }))}
                data-testid={`${testIdPrefix}-${field.key}`}
              />
            ) : (
              <Input
                value={form[field.key] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder || ""}
                className="bg-[#F1F2F5] border-black/[0.08]"
                data-testid={`${testIdPrefix}-${field.key}`}
              />
            )}
          </div>
        ))}
        <Button onClick={onSave} disabled={saving || loading} data-testid={`${testIdPrefix}-save`}>
          Save
        </Button>
      </div>
    </div>
  );
}
