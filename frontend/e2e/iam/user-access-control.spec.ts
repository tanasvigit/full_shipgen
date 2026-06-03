import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";

test.describe("IAM user access control", () => {
  test("create user dialog shows policy attacher and permission matrix", async ({ page }) => {
    await gotoRoute(page, "/iam/users");
    await expectPageRoot(page, "users-list-page");
    const create = page.getByTestId("users-create-button");
    if (!(await create.isVisible())) {
      test.skip();
      return;
    }
    await create.click();
    await expect(page.getByTestId("user-form-dialog")).toBeVisible();
    await expect(page.getByTestId("user-policy-attacher")).toBeVisible();
    await expect(page.getByTestId("user-permission-matrix")).toBeVisible();
    await page.getByTestId("user-form-dialog").getByRole("button", { name: /cancel/i }).click();
  });

  test("user detail access control card when permitted", async ({ page }) => {
    await gotoRoute(page, "/iam/users");
    await expectPageRoot(page, "users-list-page");
    const firstRow = page.locator('[data-testid^="users-table-row-"]').first();
    if (!(await firstRow.isVisible({ timeout: 8000 }))) {
      test.skip();
      return;
    }
    await firstRow.click();
    await expectPageRoot(page, "user-detail-page");
    const accessCard = page.getByTestId("user-access-control-card");
    if (await accessCard.isVisible()) {
      await expect(page.getByTestId("user-policy-attacher")).toBeVisible();
      await expect(page.getByTestId("user-view-permissions")).toBeVisible();
    }
  });
});
