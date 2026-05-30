import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";

test.describe("FleetOps Day 3 — Dashboard", () => {
  test("fleet metrics widget renders expected counters", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("fleet-metrics-widget")).toBeVisible();
    await expect(page.getByTestId("fleet-metric-orders")).toBeVisible();
    await expect(page.getByTestId("fleet-metric-drivers")).toBeVisible();
    await expect(page.getByTestId("fleet-metric-vehicles")).toBeVisible();
    await expect(page.getByTestId("fleet-metric-routes")).toBeVisible();
  });
});
