import { memo } from "react";
import BrandLoaderContent from "@/components/loaders/Spinner/BrandLoaderContent";
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
            "fleetbase-loader-viewport fleetbase-loader-viewport--brand fleetbase-loader-viewport--interactive",
            "fleetbase-loader-fade-in",
          )}
          data-testid={testId}
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={message}
        >
          <BrandLoaderContent
            message={message}
            spinnerTestId={`${testId}-spinner`}
            messageTestId={`${testId}-message`}
          />
        </div>
      )}
    </div>
  );
}

export default memo(PageLoaderOverlay);
