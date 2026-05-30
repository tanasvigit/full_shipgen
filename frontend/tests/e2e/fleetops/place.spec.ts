import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";

test.describe("FleetOps Phase 3 — Place", () => {
  test("comments and documents tabs are functional UI", async ({ page }) => {
    await page.goto("/fleet-ops/management/places");
    await waitForApiSettle(page);
    const row = page.getByTestId("places-table").locator("tbody tr").first();
    if (!(await row.isVisible())) {
      test.skip();
      return;
    }
    await row.click();
    await expect(page.getByTestId("place-detail-page")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("tab", { name: /comments/i }).click();
    await expect(page.getByTestId("place-comments-tab")).toBeVisible();
    await expect(page.getByTestId("place-comment-input")).toBeVisible();
    await page.getByRole("tab", { name: /documents/i }).click();
    await expect(page.getByTestId("place-documents-tab")).toBeVisible();
  });
});
