import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";

test.describe("FleetOps Day 3 — Custom fields", () => {
  test("custom fields list/detail and persistence shell", async ({ page }) => {
    await page.goto("/fleet-ops/custom-fields");
    await expect(page.getByTestId("custom-field-list-page").or(page.getByTestId("custom-field-forbidden"))).toBeVisible();
    if (await page.getByTestId("custom-field-forbidden").isVisible()) return;
    const newBtn = page.getByTestId("custom-field-new-button");
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await expect(page.getByTestId("custom-field-create-dialog")).toBeVisible();
      await page.getByRole("button", { name: /cancel/i }).first().click();
    }
    await page.reload();
    await expect(page.getByTestId("custom-field-list-page")).toBeVisible();
  });
});
