import { expect, type Page } from "@playwright/test";
import { sel, sidebarLink } from "./selectors";

export async function expectConsoleShell(page: Page) {
  await expect(page.getByTestId("console-layout")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("console-header")).toBeVisible({ timeout: 30_000 });
  const vp = page.viewportSize();
  const sidebar = page.getByTestId("console-sidebar");
  if (vp && vp.width >= 1280) {
    await expect(sidebar).toBeVisible({ timeout: 30_000 });
  } else {
    await expect(sidebar).toBeAttached();
  }
}

export async function gotoRoute(page: Page, path: string, options: { pageTestId?: string } = {}) {
  await page.goto(path, { waitUntil: "load", timeout: 60_000 });

  if (await page.getByTestId("login-page").isVisible().catch(() => false)) {
    throw new Error(
      "Redirected to login — re-run setup (npx playwright test --project=setup) or check e2e/.env credentials.",
    );
  }

  if (options.pageTestId) {
    await expect(page.getByTestId(options.pageTestId)).toBeVisible({ timeout: 45_000 });
  }

  await expect(page.getByTestId("console-layout")).toBeVisible({ timeout: 30_000 });
  await expectConsoleShell(page);
}

/** Navigate and wait for page root only (for slow API-heavy screens). */
export async function gotoPageRoot(page: Page, path: string, pageTestId: string) {
  await page.goto(path, { waitUntil: "load", timeout: 60_000 });
  if (await page.getByTestId("login-page").isVisible().catch(() => false)) {
    throw new Error("Redirected to login — check e2e/.env and run auth setup.");
  }
  await expect(page.getByTestId(pageTestId)).toBeVisible({ timeout: 45_000 });
}

export async function gotoViaSidebar(page: Page, slug: string, expectedPath: string) {
  await page.locator(sidebarLink(slug)).click();
  await page.waitForURL((url) => url.pathname === expectedPath || url.pathname.startsWith(`${expectedPath}/`));
}

export async function expectPageRoot(page: Page, testId: string) {
  await expect(page.getByTestId(testId)).toBeVisible();
  await expect(page.getByTestId("page-header")).toBeVisible();
}

export async function openCommandPalette(page: Page) {
  await page.getByTestId("command-palette-trigger").click();
  await expect(page.getByTestId("command-palette-input")).toBeVisible();
}

export async function switchOrganizationIfAvailable(page: Page) {
  const switcher = page.getByTestId("org-switcher");
  if (!(await switcher.isVisible())) return;
  await switcher.click();
  const options = page.locator('[data-testid^="org-option-"]');
  const count = await options.count();
  if (count > 1) {
    await options.nth(1).click();
    await expect(page.getByTestId("console-layout")).toBeVisible();
  } else {
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("org-switcher")).toBeVisible();
  }
}
