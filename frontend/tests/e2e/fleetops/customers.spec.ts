import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe("FleetOps Phase 3 — Customers", () => {
  test("customers route lists and detail page loads", async ({ page }) => {
    await page.goto("/fleet-ops/management/customers");
    await expect(
      page.getByTestId("customer-list-page").or(page.getByTestId("customer-forbidden")),
    ).toBeVisible();
    if (await page.getByTestId("customer-forbidden").isVisible()) {
      test.skip();
      return;
    }
    await expect(page.getByTestId("customer-table").or(page.getByTestId("customer-empty"))).toBeVisible();
    await waitForApiSettle(page);
    const row = page.getByTestId("customer-table").locator("tbody tr").first();
    if (await row.isVisible()) {
      await row.click();
      await expect(page.getByTestId("customer-detail-page")).toBeVisible();
    }
  });
});
