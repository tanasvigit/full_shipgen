import BrandLoaderContent from "@/components/loaders/Spinner/BrandLoaderContent";

export default function SuspenseFallback({ message = "Loading module…" }) {
  return (
    <div
      className="fleetbase-loader-viewport fleetbase-loader-viewport--brand fleetbase-loader-fade-in"
      data-testid="suspense-fallback"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <BrandLoaderContent message={message} spinnerTestId="suspense-fallback-spinner" />
    </div>
  );
}
