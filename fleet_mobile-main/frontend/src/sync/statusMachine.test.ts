import { describe, expect, it, vi } from "vitest";
import { deriveSyncSnapshot } from "@/src/sync/statusMachine";

vi.mock("@/src/offline/network", () => ({
  getNetworkOnline: () => true,
}));

vi.mock("@/src/realtime/client", () => ({
  realtimeClient: {
    getStatus: () => ({ state: "connected", reconnectAttempts: 0 }),
  },
}));

vi.mock("@/src/tracking/engine", () => ({
  trackingEngine: {
    getState: () => ({ running: true, mode: "active_trip", orderId: "x" }),
  },
}));

describe("sync status machine", () => {
  it("reports pending queue state", () => {
    const snapshot = deriveSyncSnapshot({
      pendingCount: 3,
      deadLetterCount: 0,
      syncing: false,
      trackingRunning: true,
    });
    expect(snapshot.queue).toBe("pending");
    expect(snapshot.label).toContain("Sync pending (3)");
  });

  it("reports tracking paused when engine is not running", () => {
    const snapshot = deriveSyncSnapshot({
      pendingCount: 0,
      deadLetterCount: 0,
      syncing: false,
      trackingRunning: false,
    });
    expect(snapshot.trackingPaused).toBe(true);
    expect(snapshot.label).toContain("Tracking paused");
  });
});
