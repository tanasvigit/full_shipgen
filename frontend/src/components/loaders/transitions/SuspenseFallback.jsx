import ArcSpinner from "@/components/loaders/Spinner/ArcSpinner";

export default function SuspenseFallback({ message = "Loading module…" }) {
  return (
    <div
      className="fleetbase-loader-viewport flex-col gap-3 bg-[var(--loader-overlay)] backdrop-blur-[2px] fleetbase-loader-fade-in"
      data-testid="suspense-fallback"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <ArcSpinner size="lg" testId="suspense-fallback-spinner" />
      <p className="text-sm font-medium text-[var(--loader-message)]">{message}</p>
    </div>
  );
}
