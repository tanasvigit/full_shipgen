import { describe, expect, it } from "vitest";
import {
  alertSeverityTone,
  buildOverviewKpis,
  formatAlertHeadline,
  mapLiveEvents,
  summarizeDockUtilization,
} from "@/src/lib/overviewMetrics";

describe("overviewMetrics", () => {
  it("summarizes dock utilization", () => {
    const summary = summarizeDockUtilization([
      { status: "AVAILABLE" },
      { status: "OCCUPIED" },
      { status: "OCCUPIED" },
      { status: "DELAYED" },
    ]);
    expect(summary.total).toBe(4);
    expect(summary.occupied).toBe(2);
    expect(summary.utilizationPct).toBe(50);
  });

  it("builds primary and secondary KPI cards", () => {
    const { primary, secondary } = buildOverviewKpis({
      ops: {
        appointmentsToday: 12,
        vehiclesEnteredToday: 8,
        vehiclesExitedToday: 5,
        vehiclesInYard: 20,
        vehiclesWaiting: 6,
        vehiclesLoading: 4,
        vehiclesInExitHolding: 1,
        avgTurnaroundMinutes: 95,
        avgWaitingMinutes: 38,
        avgLoadingMinutes: 52,
        slaCompliancePct: 91,
      },
      dockSummary: { total: 10, occupied: 7, available: 2, delayed: 1, utilizationPct: 70 },
      alertSummary: { critical: 1, warning: 2, total: 3 },
      yardUtilizationPct: 68,
    });

    expect(primary.find((kpi) => kpi.key === "in_yard")?.value).toBe("20");
    expect(primary.find((kpi) => kpi.key === "avg_wait")?.value).toBe("38m");
    expect(primary.find((kpi) => kpi.key === "docks_busy")?.value).toBe("70%");
    expect(primary.find((kpi) => kpi.key === "attention")?.value).toBe("3");
    expect(secondary.find((kpi) => kpi.key === "exited_today")?.value).toBe("5");
  });

  it("formats alert headlines with vehicle context", () => {
    expect(
      formatAlertHeadline({
        alertType: "LOADING_DELAY",
        vehicle: "TN01AB1234",
        durationMin: 45,
      }),
    ).toContain("TN01AB1234");
  });

  it("maps alert severity tones", () => {
    expect(alertSeverityTone("CRITICAL")).toBe("danger");
    expect(alertSeverityTone("WARNING")).toBe("warning");
  });

  it("maps recent yard events", () => {
    const rows = mapLiveEvents([
      {
        id: "e2",
        event_type: "VEHICLE_CHECKED_IN",
        event_time: "2026-06-18T10:00:00Z",
      },
      {
        id: "e1",
        event_type: "DOCK_ASSIGNED",
        event_time: "2026-06-18T09:00:00Z",
        event_note: "Dock D3",
      },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].message).toContain("check-in");
  });
});
