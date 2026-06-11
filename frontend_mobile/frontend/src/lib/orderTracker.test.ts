import { describe, expect, it } from "vitest";
import {
  formatEtaSeconds,
  mapGeofenceEvents,
  parseTrackerSummary,
  resolveDriverCoordinate,
  resolveOrderEtaLabel,
  unwrapTrackerPayload,
} from "@/src/lib/orderTracker";

describe("orderTracker", () => {
  it("unwraps nested tracker payloads", () => {
    const payload = {
      data: {
        driver_current_location: { type: "Point", coordinates: [-73.98, 40.72] },
        progress_percentage: 42,
        current_destination_eta: 900,
      },
    };
    expect(unwrapTrackerPayload(payload)?.progress_percentage).toBe(42);
  });

  it("parses tracker summary with driver coordinate and ETA", () => {
    const summary = parseTrackerSummary({
      driver_current_location: { type: "Point", coordinates: [-73.98, 40.72] },
      progress_percentage: 55,
      current_destination_eta: 1200,
      estimated_completion_time_formatted: "Jun 5, 2026 14:30",
    });

    expect(summary.driverCoordinate).toEqual({ latitude: 40.72, longitude: -73.98 });
    expect(summary.currentDestinationEta).toBe("20 min");
    expect(summary.progressPercent).toBe(55);
    expect(summary.estimatedCompletion).toBe("Jun 5, 2026 14:30");
  });

  it("formats ETA seconds for display", () => {
    expect(formatEtaSeconds(-1)).toBeNull();
    expect(formatEtaSeconds(0)).toBe("Arrived");
    expect(formatEtaSeconds(45)).toBe("< 1 min");
    expect(formatEtaSeconds(3600)).toBe("1h");
  });

  it("prefers tracker ETA over waypoint ETA map", () => {
    const label = resolveOrderEtaLabel(
      { current_destination_eta: 600 },
      { "wp-1": 3600, "wp-2": 7200 }
    );
    expect(label).toBe("10 min");
  });

  it("prefers fresh local GPS over tracker coordinate", () => {
    const local = {
      latitude: 1,
      longitude: 2,
      capturedAt: Date.now(),
    };
    const tracker = {
      driver_current_location: { type: "Point", coordinates: [10, 20] },
    };
    expect(resolveDriverCoordinate(local, tracker)).toEqual({ latitude: 1, longitude: 2 });
  });

  it("falls back to tracker coordinate when local GPS is stale", () => {
    const local = {
      latitude: 1,
      longitude: 2,
      capturedAt: Date.now() - 120_000,
    };
    const tracker = {
      driver_current_location: { type: "Point", coordinates: [-73.98, 40.72] },
    };
    expect(resolveDriverCoordinate(local, tracker)).toEqual({ latitude: 40.72, longitude: -73.98 });
  });

  it("maps geofence events and filters by order when present", () => {
    const rows = mapGeofenceEvents(
      [
        {
          id: "evt-1",
          event_type: "geofence.entered",
          occurred_at: "2026-06-05T10:00:00Z",
          geofence: { name: "Warehouse zone" },
          order: { uuid: "order-uuid", id: "ORD-1" },
        },
        {
          id: "evt-2",
          event_type: "geofence.exited",
          occurred_at: "2026-06-05T10:05:00Z",
          geofence: { name: "Other zone" },
          order: { uuid: "other-order", id: "ORD-2" },
        },
      ],
      "order-uuid"
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]?.label).toContain("entered");
    expect(rows[0]?.geofenceName).toBe("Warehouse zone");
  });
});
