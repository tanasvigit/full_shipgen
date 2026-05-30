import { test, expect } from "../fixtures/test";
import { gotoRoute, openCommandPalette, switchOrganizationIfAvailable } from "../helpers/navigation";
import { sel } from "../helpers/selectors";
import { NAV_SMART_LINKS } from "../helpers/routes";
import { waitForApiSettle } from "../helpers/network";

test.describe("Navigation shell", () => {
  test.beforeEach(async ({ page }) => {
    await gotoRoute(page, "/");
  });

  test("header smart nav modules", async ({ page }) => {
    for (const link of NAV_SMART_LINKS) {
      await page.locator(`[data-testid="nav-${link.id}"]`).click();
      await page.waitForURL((url) => {
        const prefix = link.path === "/" ? "/" : link.path.split("/").slice(0, 2).join("/");
        return url.pathname === link.path || url.pathname.startsWith(`${prefix}/`) || url.pathname === prefix;
      });
      await waitForApiSettle(page);
    }
  });

  test("command palette opens and accepts input", async ({ page }) => {
    await openCommandPalette(page);
    await page.locator(sel.commandPaletteInput).fill("orders");
    await expect(page.locator(sel.commandPaletteInput)).toHaveValue("orders");
    await page.keyboard.press("Escape");
  });

  test("notifications tray opens", async ({ page }) => {
    await page.locator(sel.notificationsTrigger).click();
    await expect(page.locator('[data-testid="notifications-view-all"]')).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("browser back from orders to dashboard", async ({ page }) => {
    await page.locator('[data-testid="nav-fleet-ops"]').click();
    await page.waitForURL(/fleet-ops/);
    await page.goBack();
    await expect(page).toHaveURL("/");
  });

  test("org switcher is interactive when multiple orgs", async ({ page }) => {
    await switchOrganizationIfAvailable(page);
    await expect(page.locator(sel.consoleLayout)).toBeVisible();
  });

  test("user menu account and settings links", async ({ page }) => {
    await page.locator('[data-testid="user-menu-trigger"]').click();
    await page.locator('[data-testid="menu-account"]').click();
    await expect(page.locator('[data-testid="account-page"]')).toBeVisible();
    await page.locator('[data-testid="user-menu-trigger"]').click();
    await page.locator('[data-testid="menu-settings"]').click();
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible();
  });
});
