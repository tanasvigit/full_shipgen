import LoadingButton from "@/components/loaders/indicators/LoadingButton";
import { Button } from "@/components/ui/button";

export default function StickySaveBar({
  visible,
  dirty,
  busy,
  onSave,
  onDiscard,
  saveLabel = "Save changes",
  testId = "sticky-save-bar",
}) {
  if (!visible || !dirty) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/[0.08] bg-white/95 backdrop-blur-sm px-6 py-3 flex items-center justify-between gap-4 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.12)]"
      data-testid={testId}
      role="region"
      aria-label="Unsaved changes"
    >
      <p className="text-sm text-[#374151]">Unsaved changes</p>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={onDiscard} disabled={busy} data-testid={`${testId}-discard`}>
          Discard
        </Button>
        <LoadingButton type="button" loading={busy} onClick={onSave} className="bg-[#0066FF] hover:bg-[#0040CC]" data-testid={`${testId}-save`}>
          {saveLabel}
        </LoadingButton>
      </div>
    </div>
  );
}
