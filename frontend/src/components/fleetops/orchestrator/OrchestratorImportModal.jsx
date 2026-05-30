import { useState } from "react";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { filesService } from "@/services/files";
import { fleetopsService } from "@/services/fleetops";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { toast } from "sonner";

export default function OrchestratorImportModal({ open, onOpenChange, onImported }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [orderIdsText, setOrderIdsText] = useState("");

  const handleSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = {};
      if (file) {
        const uploaded = await filesService.upload(file);
        const uuid = uploaded?.uuid || uploaded?.id;
        if (!uuid) throw new Error("Upload did not return a file id.");
        body.file_uuid = uuid;
      }
      const ids = orderIdsText
        .split(/[\s,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (ids.length) body.order_ids = ids;
      if (!body.file_uuid && !body.order_ids?.length) {
        throw new Error("Upload a file or enter order IDs.");
      }
      await fleetopsService.importOrchestratorOrders(body);
      toast.success("Orders imported into orchestrator pool");
      onImported?.();
      onOpenChange(false);
      setFile(null);
      setOrderIdsText("");
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
      title="Import orders to orchestrator"
      description="Upload a spreadsheet or paste order public IDs."
      submitLabel={busy ? "Importing…" : "Import"}
      onSubmit={handleSubmit}
      busy={busy}
      error={error}
      testId="orchestrator-import-dialog"
    >
      <div className="space-y-4">
        <div>
          <Label htmlFor="orch-import-file">Spreadsheet (CSV / Excel)</Label>
          <Input
            id="orch-import-file"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            data-testid="orchestrator-import-file"
          />
        </div>
        <div>
          <Label htmlFor="orch-import-ids">Order IDs (comma or newline separated)</Label>
          <Textarea
            id="orch-import-ids"
            value={orderIdsText}
            onChange={(e) => setOrderIdsText(e.target.value)}
            rows={4}
            className="font-mono text-xs"
            data-testid="orchestrator-import-ids"
          />
        </div>
      </div>
    </FleetOpsFormDialog>
  );
}
