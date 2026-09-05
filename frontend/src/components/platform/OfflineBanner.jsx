import { usePlatform } from "@/contexts/PlatformContext";

export default function OfflineBanner() {
  const { online, isDegraded, health } = usePlatform();

  if (online && !isDegraded) return null;

  // Use explicit degraded flags — websocket `ok` is false while idle/connecting on Yard.
  const apiDegraded = Boolean(health?.api?.degraded) || (Boolean(health) && health.api?.ok === false);
  const wsDegraded = Boolean(health?.websocket?.degraded);

  const message = !online
    ? "You are offline. Changes will sync when connectivity returns."
    : apiDegraded
      ? "API connection is degraded. Some data may be stale."
      : wsDegraded
        ? "Realtime connection is reconnecting…"
        : "Connection is degraded.";

  return (
    <div
      className="bg-amber-500 text-amber-950 text-xs font-medium text-center py-1.5 px-4 z-[120]"
      role="status"
      data-testid="platform-offline-banner"
    >
      {message}
    </div>
  );
}
