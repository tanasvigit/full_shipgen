import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { filesService } from "@/services/files";
import { fleetopsService } from "@/services/fleetops";
import { useFleetopsAbility } from "@/hooks/fleetops/useFleetopsAbility";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export default function PlaceDocumentsTab({ placeId, enabled = true }) {
  const ability = useFleetopsAbility();
  const canEdit = ability.canUpdateOrder;
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !placeId) return;
    setLoading(true);
    try {
      const meta = await fleetopsService.getPlaceMeta(placeId);
      setDocuments(Array.isArray(meta.documents) ? meta.documents : []);
    } finally {
      setLoading(false);
    }
  }, [placeId, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const uploaded = await filesService.upload(file);
      const entry = {
        id: uploaded?.uuid || uploaded?.id,
        name: file.name,
        uploaded_at: new Date().toISOString(),
      };
      const next = [entry, ...documents];
      await fleetopsService.updatePlaceMeta(placeId, { documents: next });
      setDocuments(next);
      toast.success("Document uploaded");
    } catch (err) {
      toast.error(err?.friendlyMessage || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 space-y-4" data-testid="place-documents-tab">
      {canEdit && (
        <div className="flex items-center gap-2">
          <Input
            type="file"
            disabled={busy}
            onChange={(e) => upload(e.target.files?.[0])}
            data-testid="place-document-upload"
          />
          <Upload className="h-4 w-4 text-[#6B7280]" />
        </div>
      )}
      <div className="bg-white border border-black/[0.08] rounded-md divide-y divide-black/[0.08]">
        {loading ? (
          <div className="p-6 text-sm text-[#4B5563]">Loading…</div>
        ) : documents.length === 0 ? (
          <div className="p-6 text-sm text-[#4B5563] text-center">No documents uploaded.</div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="px-4 py-3 text-sm flex justify-between gap-2">
              <span className="font-mono text-xs">{doc.name}</span>
              <a
                className="text-[#0066FF] text-xs"
                href={filesService.downloadUrl?.(doc.id) || "#"}
                target="_blank"
                rel="noreferrer"
              >
                Download
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
