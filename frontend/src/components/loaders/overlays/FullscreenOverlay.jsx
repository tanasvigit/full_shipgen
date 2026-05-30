import { memo } from "react";
import ArcSpinner from "@/components/loaders/Spinner/ArcSpinner";
import { cn } from "@/lib/utils";

function FullscreenOverlay({ open, message = "Loading…", testId = "fullscreen-loader" }) {
  if (!open) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[99990] flex items-center justify-center",
        "bg-[var(--loader-overlay)] backdrop-blur-[2px] fleetbase-loader-fade-in",
      )}
      data-testid={testId}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-3">
        <ArcSpinner size="lg" />
        <span className="text-sm font-medium text-[var(--loader-message)]">{message}</span>
      </div>
    </div>
  );
}

export default memo(FullscreenOverlay);
