import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe("FleetOps Phase 3 — Fleet", () => {
  test("fleet drivers tab shows assign/remove panel", async ({ page }) => {
    await page.goto("/fleet-ops/management/fleets");
    if (await page.getByTestId("fleets-empty").isVisible().catch(() => false)) {
      test.skip();
      return;
    }
    await waitForApiSettle(page);
    const card = page.locator('[data-testid^="fleet-card-"]').first();
    if (!(await card.isVisible())) {
      test.skip();
      return;
    }
    await card.click();
    await expect(page.getByTestId("fleet-detail-page")).toBeVisible({ timeout: 20_000 });
    await page.getByTestId("fleet-tab-drivers").click();
    await expect(page.getByTestId("fleet-members-panel")).toBeVisible();
  });
});
