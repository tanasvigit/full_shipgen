import {
  HEALTH,
  buildLoadingSession,
  computeLoadingMetrics,
  resolveHealthFromRatio,
} from "./loadingProgressEngine";

describe("loadingProgressEngine", () => {
  const dock = { estimated_service_time_min: 75 };
  const vehicleId = "v1";

  test("progress caps at 99% until completed", () => {
    const started = new Date(Date.now() - 80 * 60000).toISOString();
    const session = {
      loading_started_at: started,
      loading_completed_at: null,
      estimated_duration_min: 75,
    };
    const m = computeLoadingMetrics(session, { isLoading: true });
    expect(m.progressPct).toBe(99);
    expect(m.health).toBe(HEALTH.DELAYED);
  });

  test("completed shows 100% progress", () => {
    const started = new Date("2026-06-03T10:00:00Z");
    const completed = new Date("2026-06-03T11:22:00Z");
    const session = {
      loading_started_at: started.toISOString(),
      loading_completed_at: completed.toISOString(),
      estimated_duration_min: 75,
    };
    const m = computeLoadingMetrics(session, { isCompleted: true });
    expect(m.progressPct).toBe(100);
    expect(m.actualDurationMin).toBe(82);
    expect(m.varianceMin).toBe(7);
    expect(m.varianceLabel).toBe("+7 min");
  });

  test("health transitions ON_TIME → AT_RISK → DELAYED", () => {
    expect(resolveHealthFromRatio(50)).toBe(HEALTH.ON_TIME);
    expect(resolveHealthFromRatio(80)).toBe(HEALTH.AT_RISK);
    expect(resolveHealthFromRatio(101)).toBe(HEALTH.DELAYED);
  });

  test("ETA and remaining labels", () => {
    const now = new Date("2026-06-03T10:30:00Z").getTime();
    const started = new Date("2026-06-03T10:00:00Z").toISOString();
    const session = {
      loading_started_at: started,
      loading_completed_at: null,
      estimated_duration_min: 75,
    };
    const m = computeLoadingMetrics(session, { now, isLoading: true });
    expect(m.etaCompletionLabel).toMatch(/^ETA /);
    expect(m.remainingLabel).toMatch(/min remaining/);
  });

  test("overdue label when elapsed exceeds estimate", () => {
    const now = Date.now();
    const started = new Date(now - 95 * 60000).toISOString();
    const session = {
      loading_started_at: started,
      loading_completed_at: null,
      estimated_duration_min: 75,
    };
    const m = computeLoadingMetrics(session, { now, isLoading: true });
    expect(m.health).toBe(HEALTH.DELAYED);
    expect(m.remainingLabel).toMatch(/Overdue by/);
    expect(m.delayMin).toBeGreaterThan(0);
  });

  test("buildLoadingSession reads dock estimated_service_time_min", () => {
    const events = [
      {
        vehicle_id: vehicleId,
        event_type: "LOADING_STARTED",
        event_time: "2026-06-03T10:00:00Z",
      },
    ];
    const session = buildLoadingSession({ events, vehicleId, dock });
    expect(session.estimated_duration_min).toBe(75);
    expect(session.loading_started_at).toBe("2026-06-03T10:00:00Z");
  });
});
