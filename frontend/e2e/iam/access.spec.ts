import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";
import { expectListSurface, expectDataTableReady, searchDataTable } from "../helpers/page";

test.describe("IAM", () => {
  test("users list — search and invite dialog", async ({ page }) => {
    await gotoRoute(page, "/iam/users");
    await expectPageRoot(page, "users-list-page");
    await expectDataTableReady(page, "users-table");
    await searchDataTable(page, " ", "users-table");

    const invite = page.getByRole("button", { name: /invite/i }).first();
    if (await invite.isVisible()) {
      await invite.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await page.getByRole("button", { name: /cancel/i }).first().click();
    }
  });

  test("roles list — tabs or table", async ({ page }) => {
    await gotoRoute(page, "/iam/roles");
    await expectPageRoot(page, "roles-list-page");
    await expectListSurface(page, { cardSelector: '[data-testid^="role-item-"]', emptyTestIds: [] });
  });

  test("groups list", async ({ page }) => {
    await gotoRoute(page, "/iam/groups");
    await expectPageRoot(page, "groups-list-page");
    await expectListSurface(page, {
      cardSelector: '[data-testid^="group-card-"]',
      emptyTestIds: ["groups-empty"],
    });
  });
});
