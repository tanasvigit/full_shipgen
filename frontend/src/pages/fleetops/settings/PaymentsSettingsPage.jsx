import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useFleetopsSettings } from "@/hooks/fleetops/useFleetopsSettings";
import { fleetopsService } from "@/services/fleetops";

export default function PaymentsSettingsPage() {
  const { value, loading, save } = useFleetopsSettings("payments");
  const [form, setForm] = useState({});
  const [stripeConnected, setStripeConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [onboarding, setOnboarding] = useState(false);

  useEffect(() => {
    setForm(value || {});
  }, [value]);

  useEffect(() => {
    fleetopsService.hasStripeConnectAccount().then(setStripeConnected).catch(() => setStripeConnected(false));
  }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      await save(form);
      toast.success("Payment settings saved");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const startStripeOnboard = async () => {
    setOnboarding(true);
    try {
      const session = await fleetopsService.getStripeAccountSession();
      const url = session?.url || session?.link;
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else toast.message("Stripe session created — check admin email for link");
      setStripeConnected(await fleetopsService.hasStripeConnectAccount().catch(() => false));
    } catch (err) {
      toast.error(err?.friendlyMessage || "Stripe onboarding unavailable");
    } finally {
      setOnboarding(false);
    }
  };

  return (
    <div className="p-6" data-testid="fleetops-settings-payments-page">
      <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4 max-w-2xl">
        <h2 className="font-semibold text-[#0A0E1A]">Customer payments</h2>
        <p className="text-sm text-[#4B5563]">
          Stripe status:{" "}
          <span className="font-mono" data-testid="fleetops-settings-stripe-status">
            {stripeConnected ? "connected" : "not connected"}
          </span>
        </p>
        <div className="flex items-center justify-between">
          <Label>Portal payments enabled</Label>
          <Switch
            checked={Boolean(form.enabled ?? form.payments_enabled)}
            onCheckedChange={(v) => setForm((p) => ({ ...p, enabled: v }))}
            data-testid="fleetops-settings-payments-enabled"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Input
            value={form.currency || "USD"}
            onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
            data-testid="fleetops-settings-payments-currency"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={saving || loading} data-testid="fleetops-settings-payments-save">
            Save
          </Button>
          <Button variant="outline" disabled={onboarding} onClick={startStripeOnboard} data-testid="fleetops-settings-stripe-onboard">
            {onboarding ? "Opening…" : "Stripe onboard"}
          </Button>
        </div>
      </div>
    </div>
  );
}
