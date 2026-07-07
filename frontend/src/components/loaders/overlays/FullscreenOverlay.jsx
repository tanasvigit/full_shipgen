import { memo } from "react";
import BrandLoaderContent from "@/components/loaders/Spinner/BrandLoaderContent";
import { cn } from "@/lib/utils";

function FullscreenOverlay({ open, message = "Loading…", testId = "fullscreen-loader" }) {
  if (!open) return null;

  return (
    <div
      className={cn(
        "fleetbase-loader-viewport fleetbase-loader-viewport--brand fleetbase-loader-fade-in",
        "z-[99990]",
      )}
      data-testid={testId}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <BrandLoaderContent message={message} messageTestId={`${testId}-message`} />
    </div>
  );
}

export default memo(FullscreenOverlay);
