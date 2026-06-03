import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";
import { expectDataTableReady } from "../helpers/page";

test.describe("IAM users lifecycle", () => {
  test("users list — tabs, server table, create and invite dialogs", async ({ page }) => {
    await gotoRoute(page, "/iam/users");
    await expectPageRoot(page, "users-list-page");
    await expectDataTableReady(page, "users-table");

    await expect(page.getByTestId("users-list-tabs")).toBeVisible();
    await page.getByTestId("users-tab-drivers").click();
    await expect(page).toHaveURL(/\/iam\/users\/drivers/);
    await expectDataTableReady(page, "users-table");

    await page.getByTestId("users-tab-customers").click();
    await expect(page).toHaveURL(/\/iam\/users\/customers/);

    const invite = page.getByTestId("users-invite-button");
    if (await invite.isVisible()) {
      await invite.click();
      await expect(page.getByTestId("invite-user-dialog")).toBeVisible();
      await page.getByTestId("invite-user-dialog-cancel").click();
    }

    const create = page.getByTestId("users-create-button");
    if (await create.isVisible()) {
      await create.click();
      await expect(page.getByTestId("user-form-dialog")).toBeVisible();
      await expect(page.getByTestId("user-form-role")).toBeVisible();
      await page.getByTestId("user-form-dialog").getByRole("button", { name: /cancel/i }).click();
    }
  });

  test("user detail — profile fields and permissions entry", async ({ page }) => {
    await gotoRoute(page, "/iam/users");
    await expectDataTableReady(page, "users-table");

    const firstRow = page.locator('[data-testid^="users-table-row-"]').first();
    if (!(await firstRow.isVisible())) {
      test.skip();
      return;
    }

    await firstRow.click();
    await expectPageRoot(page, "user-detail-page");
    await expect(page.getByTestId("user-name")).toBeVisible();

    const viewPerms = page.getByTestId("user-view-permissions");
    if (await viewPerms.isVisible()) {
      await viewPerms.click();
      await expect(page.getByTestId("user-permissions-dialog")).toBeVisible();
      await page.getByRole("button", { name: /done/i }).click();
    }
  });
});
