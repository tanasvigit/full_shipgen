import { describe, expect, it } from "vitest";
import {
  detentionKpiFilter,
  dockChipNavigation,
  dockSummaryFilter,
  equipmentSummaryStatus,
  gateKpiSelection,
  laborSummaryStatus,
  loadingOpsKpiFocus,
  overviewKpiNavigation,
  vehicleSummaryCategory,
} from "@/src/lib/kpiNavigation";
import { filterDetentionByKpi } from "@/src/lib/detentionActions";

describe("kpiNavigation", () => {
  const allowAll = () => true;
  const denyAll = () => false;

  it("maps overview KPIs to routes when permitted", () => {
    expect(overviewKpiNavigation("in_yard", allowAll)).toEqual({
      pathname: "/(yard)/vehicles",
      params: { category: "inYard" },
    });
    expect(overviewKpiNavigation("docks_busy", allowAll)).toEqual({
      pathname: "/(yard)/docks",
      params: { filter: "active" },
    });
    expect(overviewKpiNavigation("in_yard", denyAll)).toBeNull();
  });

  it("maps gate KPI taps to pipeline tabs", () => {
    expect(gateKpiSelection("waiting")).toEqual({ mode: "entry", tab: "WAITING" });
    expect(gateKpiSelection("exitedToday")).toEqual({ mode: "entry", tab: "EXITED" });
  });

  it("maps dock summary chips to filters and dock navigation", () => {
    expect(dockSummaryFilter("occupied")).toBe("active");
    expect(dockSummaryFilter("loading")).toBe("loading");
    expect(dockChipNavigation("Available", allowAll)).toEqual({
      pathname: "/(yard)/docks",
      params: { filter: "available" },
    });
    expect(dockChipNavigation("Available", denyAll)).toBeNull();
  });

  it("maps module summary helpers", () => {
    expect(vehicleSummaryCategory("waiting")).toBe("waiting");
    expect(laborSummaryStatus("onDuty")).toBe("ON_DUTY");
    expect(equipmentSummaryStatus("inUse")).toBe("IN_USE");
    expect(loadingOpsKpiFocus("exceptions")).toBe("exceptions");
    expect(detentionKpiFilter("disputed")).toBe("disputed");
  });

  it("filters detention rows by KPI selection", () => {
    const today = new Date().toISOString().slice(0, 10);
    const rows = [
      { status: "Disputed", billingDate: today },
      { status: "Pending", billingDate: "2020-01-01" },
      { status: "Approved", billingDate: today },
    ];
    expect(filterDetentionByKpi(rows, detentionKpiFilter("disputed"))).toHaveLength(1);
    expect(filterDetentionByKpi(rows, detentionKpiFilter("today"))).toHaveLength(2);
  });
});
