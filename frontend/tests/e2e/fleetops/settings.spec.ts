import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";

test.describe("FleetOps Day 3 — Settings", () => {
  test("navigator settings save + reload persistence shell", async ({ page }) => {
    await page.goto("/fleet-ops/settings/navigator");
    await expect(page.getByTestId("fleetops-settings-navigator-page")).toBeVisible();
    const input = page.getByTestId("fleetops-settings-navigator-deepLinkBase");
    await input.fill(`https://nav.example/${Date.now()}`);
    await page.getByTestId("fleetops-settings-navigator-save").click();
    await page.reload();
    await expect(page.getByTestId("fleetops-settings-navigator-page")).toBeVisible();
  });

  test("settings sections are reachable", async ({ page }) => {
    const routes = [
      "/fleet-ops/settings",
      "/fleet-ops/settings/routing",
      "/fleet-ops/settings/orchestrator",
      "/fleet-ops/settings/scheduling",
    ];
    for (const path of routes) {
      await page.goto(path);
      await expect(page.getByTestId("fleetops-settings-layout")).toBeVisible();
    }
  });
});
