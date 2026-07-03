import { describe, expect, it } from "vitest";
import { fleetTabHref, visibleFleetWorkspaceTabs } from "@/src/lib/fleetModules";

describe("fleetNavigation — driver issues & fuel", () => {
  const driverCanIssuesAndFuel = (action: string, resource: string) =>
    (action === "list" && resource === "issue") ||
    (action === "list" && resource === "fuel-report");

  it("links dashboard/profile Issues & Fuel to the fleet workspace tab", () => {
    expect(fleetTabHref("issues")).toEqual({
      pathname: "/(tabs)/fleet",
      params: { tab: "issues" },
    });
    expect(fleetTabHref("fuel")).toEqual({
      pathname: "/(tabs)/fleet",
      params: { tab: "fuel" },
    });
  });

  it("shows only issues and fuel modules for a driver with those permissions", () => {
    const tabs = visibleFleetWorkspaceTabs(driverCanIssuesAndFuel);
    const ids = tabs.map((tab) => tab.id);
    expect(ids).toContain("overview");
    expect(ids).toContain("issues");
    expect(ids).toContain("fuel");
    expect(ids).not.toContain("vehicles");
    expect(ids).not.toContain("drivers");
  });

  it("builds detail routes for list row navigation", () => {
    const issueId = "issue-abc-123";
    const fuelId = "fuel-xyz-456";
    expect(`/issue/${issueId}`).toBe("/issue/issue-abc-123");
    expect(`/fuel/${fuelId}`).toBe("/fuel/fuel-xyz-456");
  });
});
