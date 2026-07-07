import { memo } from "react";
import BrandLoaderContent from "@/components/loaders/Spinner/BrandLoaderContent";
import { cn } from "@/lib/utils";

function GlobalLoaderOverlay({ bootstrap, auth, global, message }) {
  const visible = bootstrap || auth || global;
  if (!visible) return null;

  const brandSplash = bootstrap || auth;
  const statusMessage = message || "Loading…";

  return (
    <div
      className={cn(
        "fleetbase-loader-viewport fleetbase-loader-viewport--interactive z-[99999]",
        brandSplash ? "fleetbase-loader-viewport--brand" : "fleetbase-loader-viewport--stacked bg-[var(--loader-overlay)] backdrop-blur-[2px]",
        "fleetbase-loader-fade-in",
      )}
      data-testid="global-loader"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={statusMessage}
    >
      <BrandLoaderContent
        message={statusMessage}
        spinnerTestId="global-loader-spinner"
        messageTestId="global-loader-message"
      />
    </div>
  );
}

export default memo(GlobalLoaderOverlay);
