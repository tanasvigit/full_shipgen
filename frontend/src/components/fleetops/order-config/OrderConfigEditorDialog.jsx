import { useEffect, useState } from "react";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import OrderConfigWorkflowBuilder from "./OrderConfigWorkflowBuilder";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { emptyOrderConfigForm, orderConfigFormFromRow } from "@/lib/fleetops/orderConfig";
import { fleetopsService } from "@/services/fleetops";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { toast } from "sonner";

export default function OrderConfigEditorDialog({
  open,
  onOpenChange,
  configRow,
  mode = "create",
  onSaved,
}) {
  const [form, setForm] = useState(emptyOrderConfigForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setForm(configRow ? orderConfigFormFromRow(configRow) : emptyOrderConfigForm());
    setError(null);
  }, [open, configRow]);

  const patch = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name?.trim()) {
      setError("Config name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...form,
        meta: { ...(form.meta || {}), status_colors: form.statusColors },
      };
      if (mode === "edit" && configRow?.id) {
        await fleetopsService.updateOrderConfig(configRow.id, payload);
        toast.success("Order config updated");
      } else {
        await fleetopsService.createOrderConfig(payload);
        toast.success("Order config created");
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      const msg = parseFleetopsApiError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <FleetOpsFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "edit" ? "Edit order config" : "New order config"}
      description="Define workflow statuses, transitions, and kanban columns for this order type."
      submitLabel={mode === "edit" ? "Save config" : "Create config"}
      busy={busy}
      error={error}
      onSubmit={handleSubmit}
      testId="order-config-editor-dialog"
      size="5xl"
    >
      <div className="space-y-6" data-testid="order-config-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => patch("name", e.target.value)}
              className="bg-[#F5F6F8]"
              data-testid="order-config-field-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Key</Label>
            <Input
              value={form.key}
              onChange={(e) => patch("key", e.target.value)}
              placeholder="delivery_default"
              className="bg-[#F5F6F8] font-mono"
              data-testid="order-config-field-key"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => patch("description", e.target.value)}
              rows={2}
              className="bg-[#F5F6F8]"
              data-testid="order-config-field-description"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={form.enabled} onCheckedChange={(v) => patch("enabled", v)} data-testid="order-config-field-enabled" />
            Enabled for new orders
          </label>
        </div>

        <OrderConfigWorkflowBuilder
          flow={form.flow}
          statusColors={form.statusColors}
          disabled={busy}
          onChange={(flow) => patch("flow", flow)}
          onStatusColorsChange={(statusColors) => patch("statusColors", statusColors)}
        />
      </div>
    </FleetOpsFormDialog>
  );
}
