import FileUploader from "@/components/files/FileUploader";
import AttachmentList from "@/components/fleetops/documents/AttachmentList";

export default function OrderDocumentsPanel({
  files,
  pendingFiles,
  editable,
  onUploaded,
}) {
  return (
    <div className="bg-white border border-black/[0.08] rounded-md p-5 space-y-4">
      <AttachmentList
        files={files}
        pending={pendingFiles}
        editable={editable}
        testId="order-files-list"
      />
      {editable && (
        <FileUploader testId="order-file-uploader" onUploaded={onUploaded} />
      )}
    </div>
  );
}
