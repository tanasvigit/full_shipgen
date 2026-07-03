import { useState } from "react";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { filesService } from "@/services/files";
import { fleetopsService } from "@/services/fleetops";
import {
  parseCsvToOrchestratorRows,
  parseOrderIdsText,
  summarizeOrchestratorImportResult,
  summarizeOrchestratorPoolValidation,
} from "@/lib/fleetops/orchestratorImport";
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
      const ids = parseOrderIdsText(orderIdsText);
      if (file) {
        const name = file.name.toLowerCase();
        if (name.endsWith(".csv") || name.endsWith(".tsv")) {
          const rows = parseCsvToOrchestratorRows(await file.text());
          if (!rows.length) throw new Error("No rows found in spreadsheet.");
          body.rows = rows;
        } else {
          const uploaded = await filesService.upload(file);
          const uuid = uploaded?.uuid || uploaded?.id;
          if (!uuid) throw new Error("Upload did not return a file id.");
          body.file_uuid = uuid;
        }
      }
      if (ids.length) body.order_ids = ids;
      if (!body.rows?.length && !body.file_uuid && !body.order_ids?.length) {
        throw new Error("Upload a file or enter order IDs.");
      }

      let result;
      if (body.order_ids?.length && !body.rows?.length && !body.file_uuid) {
        const validation = await fleetopsService.validateOrchestratorPoolOrders(body.order_ids);
        const summary = summarizeOrchestratorPoolValidation(validation);
        if (summary.tone === "warning") toast.warning(summary.message);
        else if (summary.tone === "error") throw new Error(summary.message);
        else toast.success(summary.message);
        onImported?.();
        onOpenChange(false);
        setFile(null);
        setOrderIdsText("");
        return;
      }

      result = await fleetopsService.importOrchestratorOrders(body);
      const summary = summarizeOrchestratorImportResult(result);
      if (summary.tone === "warning") toast.warning(summary.message);
      else if (summary.tone === "error") throw new Error(summary.message);
      else toast.success(summary.message);
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
