import { useState } from "react";
import FleetOpsFormDialog from "@/components/fleetops/FleetOpsFormDialog";
import { filesService } from "@/services/files";
import { fleetopsService } from "@/services/fleetops";
import { parseFleetopsApiError } from "@/lib/fleetops/parseApiErrors";
import { toast } from "sonner";

export default function OrderImportDialog({ open, onOpenChange, onImported }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);

  const handleSubmit = async () => {
    if (!file) {
      setError("Choose a CSV or Excel file to import.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const uploaded = await filesService.upload(file);
      const uuid = uploaded?.uuid || uploaded?.id;
      if (!uuid) throw new Error("Upload did not return a file id.");
      await fleetopsService.importOrdersFromFiles([uuid]);
      toast.success("Orders imported");
      onImported?.();
      onOpenChange(false);
      setFile(null);
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
      onOpenChange={(next) => {
        if (!next) setFile(null);
        onOpenChange(next);
      }}
      title="Import orders"
      description="Upload a CSV or Excel spreadsheet. Orders are processed via the FleetOps import pipeline."
      submitLabel="Import"
      busyLabel="Importing…"
      busy={busy}
      error={error}
      onSubmit={handleSubmit}
      testId="order-import-dialog"
      size="lg"
    >
      <div className="space-y-3">
        <input
          type="file"
          accept=".csv,.tsv,.xls,.xlsx"
          data-testid="order-import-file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-[#374151] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-[#EEF0F4] file:text-[#0A0E1A]"
        />
        {file && (
          <p className="text-xs text-[#4B5563] font-mono">
            Selected: {file.name} ({Math.round(file.size / 1024)} KB)
          </p>
        )}
      </div>
    </FleetOpsFormDialog>
  );
}
