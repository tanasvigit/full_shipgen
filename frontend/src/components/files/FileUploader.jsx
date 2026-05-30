import { useRef } from "react";
import { Upload, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/uploads/useFileUpload";
import { UploadLoader } from "@/components/loaders/indicators/LoadingIndicators";
import { cn } from "@/lib/utils";

export default function FileUploader({
  onUploaded,
  onFilesChange,
  accept = "docs",
  label = "Attachments",
  testId = "file-uploader",
  className,
}) {
  const inputRef = useRef(null);
  const { items, busy, upload, retry, remove } = useFileUpload({
    accept,
    onUploaded: (file) => {
      onUploaded?.(file);
      onFilesChange?.();
    },
  });

  return (
    <div className={cn("space-y-3", className)} data-testid={testId}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-[#374151]">{label}</span>
        {busy && <UploadLoader />}
      </div>

      <div
        className="border-2 border-dashed border-black/[0.12] rounded-md p-6 text-center bg-[#F5F6F8]/50 hover:border-[#0066FF]/40 transition-colors cursor-pointer"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        data-testid={`${testId}-dropzone`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto text-[#4B5563] mb-2" strokeWidth={1.5} />
        <p className="text-sm text-[#374151]">Drag files here or click to upload</p>
        <p className="text-[11px] font-mono text-[#6B7280] mt-1">Images & PDF · max 10MB</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => {
            upload(e.target.files);
            e.target.value = "";
          }}
          data-testid={`${testId}-input`}
        />
      </div>

      {items.length > 0 && (
        <ul className="space-y-2" data-testid={`${testId}-list`}>
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 text-sm border border-black/[0.08] rounded-md px-3 py-2 bg-white"
              data-testid={`${testId}-item-${item.id}`}
            >
              <span className="flex-1 truncate font-mono text-xs">{item.name}</span>
              {item.status === "uploading" && (
                <span className="text-xs text-[#4B5563]">{item.progress ?? 0}%</span>
              )}
              {item.status === "error" && (
                <>
                  <span className="text-xs text-[#B91C1C] truncate max-w-[140px]">{item.error}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => retry(item.id)}>
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(item.id)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
