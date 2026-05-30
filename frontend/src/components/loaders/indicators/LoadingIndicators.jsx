import { memo } from "react";
import ArcSpinner from "@/components/loaders/Spinner/ArcSpinner";
import { cn } from "@/lib/utils";

export const InlineLoader = memo(function InlineLoader({ message, size = "sm", className, testId = "inline-loader" }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[var(--loader-message)]", className)} data-testid={testId}>
      <ArcSpinner size={size} />
      {message && <span className="text-xs">{message}</span>}
    </span>
  );
});

export const MapLoader = memo(function MapLoader({ message = "Loading map…", className }) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2",
        "bg-[var(--loader-overlay)] fleetbase-loader-fade-in",
        className,
      )}
      data-testid="map-loader"
      role="status"
    >
      <ArcSpinner size="md" />
      <span className="text-xs text-[var(--loader-message)]">{message}</span>
    </div>
  );
});

export const SearchLoader = memo(function SearchLoader({ className }) {
  return (
    <span className={cn("inline-flex", className)} data-testid="search-loader" aria-hidden>
      <ArcSpinner size="xs" />
    </span>
  );
});

export const PaginationLoader = memo(function PaginationLoader() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--loader-message)]" data-testid="pagination-loader">
      <ArcSpinner size="xs" />
      Loading…
    </span>
  );
});

export const UploadLoader = memo(function UploadLoader({ message = "Uploading…" }) {
  return (
    <div className="flex items-center gap-2 text-sm" data-testid="upload-loader" role="status">
      <ArcSpinner size="sm" />
      <span>{message}</span>
    </div>
  );
});

export const AsyncSelectLoader = memo(function AsyncSelectLoader() {
  return (
    <div className="py-2 px-3 flex justify-center" data-testid="async-select-loader">
      <ArcSpinner size="sm" />
    </div>
  );
});

export const SpecializedLoader = memo(function SpecializedLoader({
  variant = "default",
  message,
  testId,
}) {
  const labels = {
    route: "Optimizing routes…",
    eta: "Calculating ETAs…",
    report: "Generating report…",
    sync: "Syncing records…",
    websocket: "Reconnecting…",
    analytics: "Loading analytics…",
  };
  const label = message || labels[variant] || "Loading…";
  const id = testId || `${variant}-loader`;

  return (
    <div className="flex flex-col items-center gap-2 py-6" data-testid={id} role="status">
      <ArcSpinner size="md" />
      <span className="text-xs text-[var(--loader-message)]">{label}</span>
    </div>
  );
});
