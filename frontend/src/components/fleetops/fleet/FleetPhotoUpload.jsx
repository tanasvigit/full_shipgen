import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { filesService } from "@/services/files";
import { fleetopsService } from "@/services/fleetops";
import { useFleetopsPermission } from "@/hooks/fleetops/useFleetopsPermission";
import { toast } from "sonner";
import { Camera, Loader2 } from "lucide-react";
import { parseApiError } from "@/lib/errors";

export default function FleetPhotoUpload({ fleetId, photoUrl, onUpdated }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const { can } = useFleetopsPermission();
  const canEdit = can("update", "fleet");

  const upload = async (file) => {
    if (!file || !fleetId) return;
    setBusy(true);
    try {
      const uploaded = await filesService.upload(file, { type: "image" });
      const imageId = uploaded?.uuid || uploaded?.id;
      await fleetopsService.updateFleet(fleetId, { imageId });
      toast.success("Fleet photo updated");
      onUpdated?.();
    } catch (err) {
      toast.error(parseApiError(err, "Photo upload failed"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-4" data-testid="fleet-photo-upload">
      <div className="h-16 w-16 rounded-md border border-black/[0.08] bg-[#F5F6F8] overflow-hidden grid place-items-center">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-6 w-6 text-[#9CA3AF]" />
        )}
      </div>
      {canEdit && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => upload(e.target.files?.[0])}
            data-testid="fleet-photo-input"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            data-testid="fleet-photo-change"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Camera className="h-3.5 w-3.5 mr-1" />}
            {photoUrl ? "Change photo" : "Upload photo"}
          </Button>
        </>
      )}
    </div>
  );
}
