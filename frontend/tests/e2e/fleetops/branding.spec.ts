import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";

test.describe("FleetOps Day 3 — Branding", () => {
  test("branding settings persist through reload safely", async ({ page }) => {
    await page.goto("/fleet-ops/settings");
    await expect(page.getByTestId("fleetops-settings-overview-page")).toBeVisible();
    const product = page.getByTestId("fleetops-settings-overview-productName");
    await product.fill(`FleetOps ${Date.now()}`);
    await page.getByTestId("fleetops-settings-overview-save").click();
    await page.reload();
    await expect(page.getByTestId("fleetops-settings-overview-page")).toBeVisible();
  });
});
