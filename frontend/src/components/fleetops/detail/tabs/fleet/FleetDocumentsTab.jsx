import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import AttachmentList from "@/components/fleetops/documents/AttachmentList";
import { filesService } from "@/services/files";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { parseApiError } from "@/lib/errors";

const FLEET_SUBJECT_TYPE = "fleet-ops:fleet";

export default function FleetDocumentsTab({ fleetId, enabled = true }) {
  const { can } = useFleetopsPermission();
  const canEdit = can("update", "fleet");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !fleetId) return;
    setLoading(true);
    try {
      const rows = await filesService.listForSubject(fleetId, FLEET_SUBJECT_TYPE);
      setFiles(filesService.normalizeList(rows));
    } finally {
      setLoading(false);
    }
  }, [fleetId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      await filesService.upload(file, {
        subjectUuid: fleetId,
        subjectType: FLEET_SUBJECT_TYPE,
      });
      await load();
      toast.success("Document uploaded");
    } catch (err) {
      toast.error(parseApiError(err, "Upload failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 space-y-4" data-testid="fleet-documents-tab">
      {canEdit && (
        <div className="flex items-center gap-2">
          <Input
            type="file"
            disabled={busy}
            onChange={(e) => upload(e.target.files?.[0])}
            data-testid="fleet-document-upload"
          />
          <Upload className="h-4 w-4 text-[#6B7280]" />
        </div>
      )}
      <div className="bg-white border border-black/[0.08] rounded-md p-5">
        {loading ? (
          <p className="text-sm text-[#4B5563]">Loading documents…</p>
        ) : (
          <AttachmentList files={files} testId="fleet-documents-list" />
        )}
      </div>
    </div>
  );
}
