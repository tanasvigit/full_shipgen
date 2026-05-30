import { memo } from "react";
import ArcSpinner from "@/components/loaders/Spinner/ArcSpinner";
import { cn } from "@/lib/utils";

function PageLoaderOverlay({
  loading,
  message = "Loading…",
  testId = "page-loader",
  className,
  children,
}) {
  return (
    <div className={cn("relative min-h-[12rem]", className)} aria-busy={loading}>
      {children}
      {loading && (
        <div
          className={cn(
            "fleetbase-loader-viewport fleetbase-loader-viewport--interactive",
            "flex flex-col gap-2 bg-[var(--loader-overlay)] backdrop-blur-[2px] fleetbase-loader-fade-in",
          )}
          data-testid={testId}
          role="status"
          aria-live="polite"
        >
          <ArcSpinner size="md" testId={`${testId}-spinner`} />
          {message && (
            <p className="text-xs font-medium text-[var(--loader-message)]" data-testid={`${testId}-message`}>
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(PageLoaderOverlay);
