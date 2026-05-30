import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";

test.describe("FleetOps Day 3 — Registries", () => {
  test("dashboard extension widgets render once", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
    await expect(page.getByTestId("fleet-metrics-widget")).toHaveCount(1, { timeout: 45_000 });
  });

  test("detail extension-safe rendering keeps detail stable", async ({ page }) => {
    await page.goto("/fleet-ops/service-areas");
    if (await page.getByTestId("service-area-forbidden").isVisible().catch(() => false)) return;
    const row = page.getByTestId("service-area-table").locator("tbody tr").first();
    if (!(await row.isVisible())) {
      test.skip();
      return;
    }
    await row.click();
    await expect(page.getByTestId("service-area-detail-page")).toBeVisible();
    await expect(page.getByTestId("service-area-relations")).toBeVisible();
  });
});
