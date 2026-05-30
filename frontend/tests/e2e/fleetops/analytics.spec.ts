import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";

test.describe("FleetOps Day 3 — Analytics", () => {
  test("reports list loads safely", async ({ page }) => {
    await page.goto("/fleet-ops/analytics/reports");
    await expect(page.getByTestId("report-list-page").or(page.getByTestId("report-forbidden"))).toBeVisible();
  });

  test("report detail view has safe result or empty state", async ({ page }) => {
    await page.goto("/fleet-ops/analytics/reports");
    if (await page.getByTestId("report-forbidden").isVisible().catch(() => false)) return;
    const row = page.getByTestId("report-table").locator("tbody tr").first();
    if (!(await row.isVisible())) {
      test.skip();
      return;
    }
    await row.click();
    await expect(page.getByTestId("report-detail-page")).toBeVisible();
    await expect(page.getByTestId("report-results-table").or(page.getByTestId("report-empty-state"))).toBeVisible();
  });
});
