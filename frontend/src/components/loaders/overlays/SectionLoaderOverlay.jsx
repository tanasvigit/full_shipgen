import { memo } from "react";
import ArcSpinner from "@/components/loaders/Spinner/ArcSpinner";
import { cn } from "@/lib/utils";

/** Inline section / card / table overlay */
function SectionLoaderOverlay({
  loading,
  message,
  testId = "section-loader",
  compact = false,
  className,
}) {
  if (!loading) return null;

  const viewport = !compact;

  return (
    <div
      className={cn(
        viewport
          ? "fleetbase-loader-viewport fleetbase-loader-viewport--interactive bg-[var(--loader-overlay)] backdrop-blur-[2px]"
          : "absolute inset-0 z-10 min-h-[4rem] bg-[var(--loader-overlay)]/90 rounded-[inherit]",
        "flex flex-col items-center justify-center gap-2 fleetbase-loader-fade-in",
        className,
      )}
      data-testid={testId}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <ArcSpinner size={compact ? "sm" : "md"} testId={`${testId}-spinner`} />
      {message && !compact && (
        <span className="text-sm font-medium text-[var(--loader-message)]">{message}</span>
      )}
    </div>
  );
}

export default memo(SectionLoaderOverlay);
