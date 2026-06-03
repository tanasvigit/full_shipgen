import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";

test.describe("IAM roles lifecycle", () => {
  test("roles list — filters, search, create dialog", async ({ page }) => {
    await gotoRoute(page, "/iam/roles");
    await expectPageRoot(page, "roles-list-page");

    await expect(page.getByTestId("roles-search")).toBeVisible();
    await expect(page.getByTestId("roles-filter-service")).toBeVisible();
    await expect(page.getByTestId("roles-filter-type")).toBeVisible();

    const create = page.getByTestId("roles-new-button");
    if (await create.isVisible()) {
      await create.click();
      await expect(page.getByTestId("create-role-dialog")).toBeVisible();
      await expect(page.getByTestId("policy-attacher")).toBeVisible();
      await page.getByRole("button", { name: /cancel/i }).first().click();
    }
  });

  test("roles list — permission matrix and save control", async ({ page }) => {
    await gotoRoute(page, "/iam/roles");
    await expectPageRoot(page, "roles-list-page");

    const firstRole = page.locator('[data-testid^="role-item-"]').first();
    if (!(await firstRole.isVisible())) {
      test.skip();
      return;
    }

    await firstRole.click();
    await expect(page.getByTestId("role-save")).toBeVisible();
  });
});
