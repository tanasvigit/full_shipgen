import { memo } from "react";
import ArcSpinner from "@/components/loaders/Spinner/ArcSpinner";
import { cn } from "@/lib/utils";

function GlobalLoaderOverlay({ bootstrap, auth, global, message }) {
  const visible = bootstrap || auth || global;
  if (!visible) return null;

  return (
    <div
      className={cn(
        "fleetbase-loader-viewport fleetbase-loader-viewport--interactive z-[99999]",
        "bg-[var(--loader-overlay)] backdrop-blur-[2px]",
        "fleetbase-loader-fade-in",
      )}
      data-testid="global-loader"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <ArcSpinner size="lg" testId="global-loader-spinner" />
        <p className="text-sm font-medium text-[var(--loader-message)]" data-testid="global-loader-message">
          {message}
        </p>
      </div>
    </div>
  );
}

export default memo(GlobalLoaderOverlay);
