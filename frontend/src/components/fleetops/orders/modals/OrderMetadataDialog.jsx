import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fleetopsService } from "@/services/fleetops";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { toast } from "sonner";

export default function OrderMetadataDialog({ open, onOpenChange, orderId, meta = {}, onSaved }) {
  const [json, setJson] = useState("{}");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setJson(JSON.stringify(meta || {}, null, 2));
  }, [open, meta]);

  const handleSave = async () => {
    setBusy(true);
    try {
      const parsed = JSON.parse(json);
      await fleetopsService.patchOrder(orderId, { meta: parsed });
      toast.success("Metadata updated");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof SyntaxError ? "Invalid JSON" : parseFleetopsApiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" data-testid="order-metadata-dialog">
        <DialogHeader>
          <DialogTitle>Edit metadata</DialogTitle>
        </DialogHeader>
        <Textarea value={json} onChange={(e) => setJson(e.target.value)} rows={12} className="font-mono text-xs" />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
