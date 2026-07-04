import { describe, expect, it } from "vitest";
import { computeLoadingCompleteState } from "@/src/lib/loadingCompleteState";

describe("loadingCompleteState", () => {
  it("detects awaiting release after loading completed without dock release", () => {
    const state = computeLoadingCompleteState(
      [
        {
          vehicle_id: "v1",
          event_type: "LOADING_STARTED",
          event_time: "2026-06-26T10:00:00Z",
        },
        {
          vehicle_id: "v1",
          event_type: "LOADING_COMPLETED",
          event_time: "2026-06-26T10:30:00Z",
        },
      ],
      "v1",
      null,
    );
    expect(state.awaitingRelease).toBe(true);
  });

  it("clears awaiting release after dock released", () => {
    const state = computeLoadingCompleteState(
      [
        {
          vehicle_id: "v1",
          event_type: "LOADING_STARTED",
          event_time: "2026-06-26T10:00:00Z",
        },
        {
          vehicle_id: "v1",
          event_type: "LOADING_COMPLETED",
          event_time: "2026-06-26T10:30:00Z",
        },
        {
          vehicle_id: "v1",
          event_type: "DOCK_RELEASED",
          event_time: "2026-06-26T10:35:00Z",
        },
      ],
      "v1",
      null,
    );
    expect(state.awaitingRelease).toBe(false);
  });
});
