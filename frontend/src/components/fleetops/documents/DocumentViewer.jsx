import { categorizeFile, DOCUMENT_CATEGORIES } from "@/domain/fleetops/documents/categories";

/** Inline document preview chip — extensible for PDF/image viewers. */
export default function DocumentViewer({ file, testId = "document-viewer" }) {
  if (!file) return null;
  const category = categorizeFile(file);
  const label = DOCUMENT_CATEGORIES[category]?.label || "Document";

  return (
    <div
      className="inline-flex items-center gap-2 text-xs border border-black/[0.08] rounded-md px-2 py-1 bg-[#F9FAFB]"
      data-testid={testId}
      title={file.name}
    >
      <span className="font-mono text-[10px] uppercase text-[#6B7280]">{label}</span>
      <span className="truncate max-w-[180px]">{file.name}</span>
    </div>
  );
}
