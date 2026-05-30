import { groupFilesByCategory, DOCUMENT_CATEGORIES } from "@/domain/fleetops/documents/categories";
import EmptyState from "@/components/common/EmptyState";
import { FileText } from "lucide-react";

export default function AttachmentList({
  files = [],
  pending = [],
  editable = false,
  onRetry,
  testId = "attachment-list",
}) {
  const all = [...pending.map((f) => ({ ...f, _pending: true })), ...files];
  if (!all.length) {
    return (
      <EmptyState
        icon={FileText}
        title="No documents"
        description={editable ? "Upload compliance, POD, or manifest files." : "No files attached."}
        testId={`${testId}-empty`}
      />
    );
  }

  const groups = groupFilesByCategory(all);

  return (
    <div className="space-y-4" data-testid={testId}>
      {Object.entries(DOCUMENT_CATEGORIES).map(([key, meta]) => {
        const items = groups[key] || [];
        if (!items.length) return null;
        return (
          <section key={key} data-testid={`${testId}-category-${key}`}>
            <div className="overline mb-2">{meta.label}</div>
            <ul className="space-y-2">
              {items.map((f) => (
                <li
                  key={f.id || f.uuid || f.name}
                  className="flex items-center justify-between text-sm border border-black/[0.06] rounded-md px-3 py-2"
                  data-testid={`${testId}-item`}
                >
                  <span className="font-mono text-xs truncate flex-1 mr-2">
                    {f.name}
                    {f._pending && (
                      <span className="ml-2 text-[10px] uppercase text-amber-700">Pending</span>
                    )}
                    {f._failed && (
                      <span className="ml-2 text-[10px] uppercase text-red-700">Failed</span>
                    )}
                  </span>
                  {f._failed && onRetry ? (
                    <button
                      type="button"
                      className="text-xs text-[#0066FF] hover:underline"
                      onClick={() => onRetry(f)}
                    >
                      Retry
                    </button>
                  ) : (
                    <a
                      href={f.url || "#"}
                      className="text-xs text-[#0066FF] hover:underline shrink-0"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
