import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";

test.describe("IAM policies lifecycle", () => {
  test("policies list — filters, search, create dialog", async ({ page }) => {
    await gotoRoute(page, "/iam/policies");
    await expectPageRoot(page, "policies-list-page");

    await expect(page.getByTestId("policies-search")).toBeVisible();
    await expect(page.getByTestId("policies-filter-service")).toBeVisible();
    await expect(page.getByTestId("policies-filter-type")).toBeVisible();

    const create = page.getByTestId("policies-new-button");
    if (await create.isVisible()) {
      await create.click();
      await expect(page.getByTestId("create-policy-dialog")).toBeVisible();
      await page.getByTestId("create-policy-dialog-cancel").click();
    }
  });

  test("policies list — permission matrix when policy selected", async ({ page }) => {
    await gotoRoute(page, "/iam/policies");
    await expectPageRoot(page, "policies-list-page");

    const first = page.locator('[data-testid^="policy-item-"]').first();
    if (!(await first.isVisible())) {
      test.skip();
      return;
    }

    await first.click();
    const matrix = page.getByTestId("policy-permission-matrix");
    const viewDialog = page.getByTestId("view-policy-permissions-dialog");
    if (await matrix.isVisible()) {
      await expect(page.getByTestId("policy-save")).toBeVisible();
    } else if (await viewDialog.isVisible()) {
      await page.getByRole("button", { name: /done/i }).click();
    }
  });
});
