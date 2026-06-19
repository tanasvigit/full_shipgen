import { computePauseState, pausedMsFromState } from "./loadingPauseEngine";

describe("loadingPauseEngine", () => {
  test("detects active pause and duration", () => {
    const now = new Date("2026-06-03T14:00:00Z").getTime();
    const pausedSince = new Date("2026-06-03T13:40:00Z").toISOString();
    const events = [
      { vehicle_id: "v1", event_type: "LOADING_PAUSED", event_time: pausedSince, event_note: "Weather" },
    ];
    const state = computePauseState(events, { vehicleId: "v1" }, now);
    expect(state.paused).toBe(true);
    expect(state.pauseReason).toBe("Weather");
    expect(state.pausedDurationMin).toBe(20);
    expect(state.totalPausedMin).toBe(20);
  });

  test("accumulates paused intervals across resume", () => {
    const events = [
      { vehicle_id: "v1", event_type: "LOADING_PAUSED", event_time: "2026-06-03T13:00:00Z" },
      { vehicle_id: "v1", event_type: "LOADING_RESUMED", event_time: "2026-06-03T13:10:00Z" },
      { vehicle_id: "v1", event_type: "LOADING_PAUSED", event_time: "2026-06-03T13:30:00Z" },
    ];
    const now = new Date("2026-06-03T13:45:00Z").getTime();
    const state = computePauseState(events, { vehicleId: "v1" }, now);
    expect(state.paused).toBe(true);
    expect(state.totalPausedMin).toBe(25);
    expect(pausedMsFromState(state, now)).toBe(25 * 60000);
  });
});
