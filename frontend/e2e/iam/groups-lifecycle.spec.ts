import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";
import { expectDataTableReady } from "../helpers/page";

test.describe("IAM groups lifecycle", () => {
  test("groups list — search, table, create dialog", async ({ page }) => {
    await gotoRoute(page, "/iam/groups");
    await expectPageRoot(page, "groups-list-page");
    await expect(page.getByTestId("groups-search")).toBeVisible();

    const create = page.getByTestId("groups-new-button");
    if (await create.isVisible()) {
      await create.click();
      await expect(page.getByTestId("create-group-dialog")).toBeVisible();
      await expect(page.getByTestId("field-defaultRole")).toBeVisible();
      await page.getByTestId("create-group-dialog-cancel").click();
    }
  });

  test("group detail — members section when group exists", async ({ page }) => {
    await gotoRoute(page, "/iam/groups");
    await expectDataTableReady(page, "groups-table");

    const firstRow = page.locator('[data-testid^="groups-table-row-"]').first();
    if (!(await firstRow.isVisible())) {
      test.skip();
      return;
    }

    await firstRow.click();
    await expectPageRoot(page, "group-detail-page");
    await expect(page.getByTestId("group-members-table")).toBeVisible();

    const add = page.getByTestId("group-add-members");
    if (await add.isVisible()) {
      await add.click();
      await expect(page.getByTestId("add-group-members-dialog")).toBeVisible();
      await page.getByRole("button", { name: /cancel/i }).first().click();
    }
  });
});
