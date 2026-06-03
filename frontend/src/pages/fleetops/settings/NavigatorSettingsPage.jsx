import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFleetopsSettings } from "@/hooks/fleetops/useFleetopsSettings";
import { fleetopsService } from "@/services/fleetops";

export default function NavigatorSettingsPage() {
  const { value, loading, save } = useFleetopsSettings("navigator");
  const [form, setForm] = useState({});
  const [linkApp, setLinkApp] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(value || {});
  }, [value]);

  useEffect(() => {
    fleetopsService.getNavigatorLinkApp().then(setLinkApp).catch(() => setLinkApp(null));
  }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      await save(form);
      toast.success("Navigator settings saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deepLink = linkApp?.url || linkApp?.link || form.deepLinkBase || "";
  const qrPayload = form.qrPayload || deepLink || "";

  return (
    <div className="p-6" data-testid="fleetops-settings-navigator-page">
      <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4 max-w-2xl">
        <h2 className="font-semibold text-[#0A0E1A]">Navigator admin</h2>
        <div className="flex items-center justify-between">
          <Label>Navigator app enabled</Label>
          <Switch
            checked={Boolean(form.enabled)}
            onCheckedChange={(v) => setForm((p) => ({ ...p, enabled: v }))}
            data-testid="fleetops-settings-navigator-enabled"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Invite link template</Label>
          <Input
            value={form.inviteTemplate || ""}
            onChange={(e) => setForm((p) => ({ ...p, inviteTemplate: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Deep link base URL</Label>
          <Input
            value={form.deepLinkBase || deepLink}
            onChange={(e) => setForm((p) => ({ ...p, deepLinkBase: e.target.value }))}
            data-testid="fleetops-settings-navigator-deepLinkBase"
          />
        </div>
        <div className="space-y-1.5">
          <Label>QR payload</Label>
          <Input
            value={form.qrPayload || qrPayload}
            onChange={(e) => setForm((p) => ({ ...p, qrPayload: e.target.value }))}
            data-testid="fleetops-settings-navigator-qr"
          />
        </div>
        {deepLink && (
          <div className="p-3 bg-[#F5F6F8] rounded border border-black/[0.08] text-xs font-mono break-all" data-testid="fleetops-settings-navigator-link-preview">
            App link: {deepLink}
          </div>
        )}
        <Button onClick={onSave} disabled={saving || loading} data-testid="fleetops-settings-navigator-save">
          Save
        </Button>
      </div>
    </div>
  );
}
