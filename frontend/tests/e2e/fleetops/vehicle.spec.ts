import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe("FleetOps Phase 3 — Vehicle", () => {
  test("devices tab attach controls and work-orders tab load", async ({ page }) => {
    await page.goto("/fleet-ops/management/vehicles");
    if (await page.getByTestId("vehicle-forbidden").isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    await waitForApiSettle(page);
    const row = page.getByTestId("vehicles-table").locator("tbody tr").first();
    if (!(await row.isVisible())) {
      test.skip();
      return;
    }
    await row.click();
    await expect(page.getByTestId("vehicle-detail-page")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("vehicle-tab-devices").click();
    await expect(page.getByTestId("vehicle-devices-tab")).toBeVisible();
    await page.getByTestId("vehicle-tab-work-orders").click();
    await expect(page.getByTestId("vehicle-work-orders-tab")).toBeVisible();
  });
});
