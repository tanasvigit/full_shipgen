import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Upload, Trash2 } from "lucide-react";
import { fleetopsService } from "@/services/fleetops";
import { entitySupportsImportExport } from "@/lib/fleetops/crudImportExport";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";
import { toast } from "sonner";

/**
 * Export / import / bulk-delete toolbar for CRUD list pages (G094).
 */
export default function CrudImportExportBar({
  entityKey,
  selectedIds = [],
  onComplete,
  testPrefix,
}) {
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const { can } = useFleetopsPermission();
  const resource = entityKey.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");

  if (!entitySupportsImportExport(entityKey)) return null;

  const canExport = can("export", resource) || can("view", resource);
  const canImport = can("import", resource) || can("create", resource);
  const canBulkDelete = can("delete", resource);

  const handleExport = async () => {
    setBusy(true);
    try {
      const blob = await fleetopsService.exportResource(entityKey);
      fleetopsService.downloadExportBlob(blob, `${entityKey}-export.csv`);
      toast.success("Export downloaded");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Export failed");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await fleetopsService.importResource(entityKey, file);
      toast.success("Import submitted");
      onComplete?.();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Import failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) {
      toast.error("Select rows to delete");
      return;
    }
    if (!window.confirm(`Delete ${selectedIds.length} record(s)?`)) return;
    setBusy(true);
    try {
      await fleetopsService.bulkDeleteResource(entityKey, selectedIds);
      toast.success("Deleted");
      onComplete?.();
    } catch (err) {
      toast.error(err?.friendlyMessage || "Bulk delete failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-4" data-testid={`${testPrefix}-import-export-bar`}>
      {canExport && (
        <Button variant="outline" size="sm" disabled={busy} onClick={handleExport} data-testid={`${testPrefix}-export`}>
          <Download className="h-3.5 w-3.5 mr-1" /> Export
        </Button>
      )}
      {canImport && (
        <>
          <input ref={fileRef} type="file" className="hidden" accept=".csv,.xlsx,.xls,.json" onChange={handleImport} />
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            data-testid={`${testPrefix}-import`}
          >
            <Upload className="h-3.5 w-3.5 mr-1" /> Import
          </Button>
        </>
      )}
      {canBulkDelete && selectedIds.length > 0 && (
        <Button variant="outline" size="sm" disabled={busy} onClick={handleBulkDelete} data-testid={`${testPrefix}-bulk-delete`}>
          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete selected ({selectedIds.length})
        </Button>
      )}
    </div>
  );
}
