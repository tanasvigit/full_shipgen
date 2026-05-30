import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";
import { waitForApiSettle } from "../helpers/network";

test.describe("Registry", () => {
  test("browse extensions and filter", async ({ page }) => {
    await gotoRoute(page, "/registry");
    await expectPageRoot(page, "registry-page");
    await waitForApiSettle(page);

    const search = page.locator('[data-testid="registry-search"]');
    if (await search.isVisible()) {
      await search.fill("fleet");
      await page.waitForTimeout(400);
    }

    const installBtn = page.getByRole("button", { name: /install/i }).first();
    if (await installBtn.isVisible()) {
      await installBtn.click();
      const dialog = page.getByRole("alertdialog").or(page.getByRole("dialog"));
      if (await dialog.isVisible()) {
        await page.getByRole("button", { name: /cancel/i }).first().click();
      }
    }
  });
});
