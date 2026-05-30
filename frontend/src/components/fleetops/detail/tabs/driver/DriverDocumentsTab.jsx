import { filesService } from "@/services/files";
import AttachmentList from "@/components/fleetops/documents/AttachmentList";
import { useDetailTabData } from "@/hooks/fleetops/useDetailTabData";

export default function DriverDocumentsTab({ driverApi, enabled }) {
  const { data: files, loading } = useDetailTabData(
    `driver-docs-${driverApi?.uuid || driverApi?.id}`,
    async () => {
      const raw = driverApi?.files || driverApi?.documents || [];
      return filesService.normalizeList(raw);
    },
    { enabled: enabled && Boolean(driverApi) },
  );

  return (
    <div className="p-4">
      <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4">
        <div className="text-sm text-[#374151]">
          License:{" "}
          <span className="font-mono text-[#0A0E1A]">
            {driverApi?.drivers_license_number || driverApi?.license_number || "—"}
          </span>
        </div>
        {loading ? (
          <p className="text-sm text-[#4B5563]">Loading documents…</p>
        ) : (
          <AttachmentList files={files || []} testId="driver-documents-list" />
        )}
      </div>
    </div>
  );
}
