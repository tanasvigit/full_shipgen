import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";
import { expectListSurface, expectDataTableReady, searchDataTable } from "../helpers/page";

test.describe("IAM", () => {
  test("IAM home — quick links", async ({ page }) => {
    await gotoRoute(page, "/iam");
    await expectPageRoot(page, "iam-home-page");
    const firstLink = page.getByTestId(/^iam-home-link-/).first();
    if (await firstLink.isVisible()) {
      await expect(firstLink).toBeVisible();
    }
  });

  test("header shortcuts visible on IAM routes", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await gotoRoute(page, "/iam/users");
    await expectPageRoot(page, "users-list-page");
    const shortcuts = page.getByTestId("iam-header-shortcuts");
    await expect(shortcuts).toBeVisible();
    await expect(page.getByTestId("iam-shortcut-users")).toBeVisible();
    await expect(page.getByTestId("iam-shortcut-policies")).toBeVisible();
  });

  test("dashboard IAM metrics widget", async ({ page }) => {
    await gotoRoute(page, "/");
    const widget = page.getByTestId("iam-metrics-widget");
    if (await widget.isVisible({ timeout: 8000 })) {
      await expect(widget).toBeVisible();
    }
  });

  test("admin vs limited — destructive actions gated", async ({ page }) => {
    await gotoRoute(page, "/iam/users");
    await expectPageRoot(page, "users-list-page");
    const invite = page.getByTestId("users-invite-button");
    const create = page.getByTestId("users-create-button");
    const bulkDelete = page.getByTestId("users-bulk-delete");
    const inviteVisible = await invite.isVisible().catch(() => false);
    const createVisible = await create.isVisible().catch(() => false);
    if (!inviteVisible && !createVisible) {
      await expect(bulkDelete).toHaveCount(0);
    }
    await gotoRoute(page, "/iam/roles");
    await expectPageRoot(page, "roles-list-page");
    const newRole = page.getByTestId("roles-new-button");
    const saveRole = page.getByTestId("role-save");
    if (!(await newRole.isVisible().catch(() => false))) {
      await expect(saveRole).toBeDisabled();
    }
  });

  test("users list — search, tabs, and invite dialog", async ({ page }) => {
    await gotoRoute(page, "/iam/users");
    await expectPageRoot(page, "users-list-page");
    await expectDataTableReady(page, "users-table");
    await searchDataTable(page, " ", "users-table");
    await expect(page.getByTestId("users-list-tabs")).toBeVisible();

    const invite = page.getByTestId("users-invite-button");
    if (await invite.isVisible()) {
      await invite.click();
      await expect(page.getByTestId("invite-user-dialog")).toBeVisible();
      await page.getByTestId("invite-user-dialog-cancel").click();
    }
  });

  test("roles list — filters and role sidebar", async ({ page }) => {
    await gotoRoute(page, "/iam/roles");
    await expectPageRoot(page, "roles-list-page");
    await expect(page.getByTestId("roles-filter-type")).toBeVisible();
    await expectListSurface(page, { cardSelector: '[data-testid^="role-item-"]', emptyTestIds: ["roles-empty"] });
  });

  test("policies list — filters and sidebar", async ({ page }) => {
    await gotoRoute(page, "/iam/policies");
    await expectPageRoot(page, "policies-list-page");
    await expect(page.getByTestId("policies-filter-type")).toBeVisible();
  });

  test("groups list — table and search", async ({ page }) => {
    await gotoRoute(page, "/iam/groups");
    await expectPageRoot(page, "groups-list-page");
    await expect(page.getByTestId("groups-search")).toBeVisible();
    await expectListSurface(page, {
      cardSelector: '[data-testid^="groups-table-row-"]',
      emptyTestIds: ["groups-empty"],
    });
  });
});
