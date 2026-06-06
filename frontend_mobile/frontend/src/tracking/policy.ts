export type TrackingMode = "idle" | "active_trip" | "navigating" | "background_low_power";

export type TrackingPolicy = {
  mode: TrackingMode;
  intervalMs: number;
  accuracy: "low" | "balanced" | "high";
};

export function resolveTrackingPolicy(mode: TrackingMode): TrackingPolicy {
  switch (mode) {
    case "active_trip":
      return { mode, intervalMs: 15_000, accuracy: "high" };
    case "navigating":
      return { mode, intervalMs: 10_000, accuracy: "high" };
    case "background_low_power":
      return { mode, intervalMs: 60_000, accuracy: "low" };
    case "idle":
    default:
      return { mode: "idle", intervalMs: 0, accuracy: "balanced" };
  }
}
