import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe("FleetOps Phase 3 — Driver", () => {
  test("assign-order modal and schedule tab with driver APIs", async ({ page }) => {
    await page.goto("/fleet-ops/management/drivers");
    if (await page.getByTestId("driver-forbidden").isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    await waitForApiSettle(page);
    const row = page.getByTestId("drivers-table").locator("tbody tr").first();
    if (!(await row.isVisible())) {
      test.skip();
      return;
    }
    await row.click();
    await expect(page.getByTestId("driver-detail-page")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("driver-assign-order").click();
    await expect(page.getByTestId("assign-order-to-driver-dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await page.getByTestId("driver-tab-schedule").click();
    await expect(page.getByTestId("driver-schedule-tab")).toBeVisible();
  });
});
