import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";

test.describe("FleetOps Phase 4 — Analytics reports", () => {
  test("reports new route and list new button", async ({ page }) => {
    await page.goto("/fleet-ops/analytics/reports");
    const forbidden = page.getByTestId("report-forbidden");
    if (await forbidden.isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    await expect(page.getByTestId("report-list-page")).toBeVisible();
    const newBtn = page.getByTestId("report-new-button");
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await expect(page.getByTestId("report-builder-page")).toBeVisible();
    }
  });
});
