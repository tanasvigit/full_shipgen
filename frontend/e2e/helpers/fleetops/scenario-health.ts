import { expect, type Page } from "@playwright/test";

/** No global overlay blocking interaction after network settles. */
export async function assertNoStuckViewportLoaders(page: Page, timeout = 45_000) {
  await expect(page.getByTestId("global-loader")).toBeHidden({ timeout });
  await expect(page.getByTestId("route-progress-loader")).toHaveCount(0);

  await page.waitForFunction(
    () => {
      const overlays = document.querySelectorAll(
        ".fleetbase-loader-viewport.fleetbase-loader-viewport--interactive",
      );
      return [...overlays].every((el) => {
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") return true;
        const opacity = Number.parseFloat(style.opacity);
        return opacity < 0.05;
      });
    },
    { timeout },
  );

  // Only viewport-blocking overlays must clear; compact table loaders may be visible during fetch.
  const stuckViewportSpinners = page.locator(
    ".fleetbase-loader-viewport--interactive [data-testid$='-overlay-spinner'], [data-testid='global-loader-spinner']",
  );
  const stuckCount = await stuckViewportSpinners.count();
  for (let i = 0; i < stuckCount; i++) {
    await expect(stuckViewportSpinners.nth(i)).toBeHidden({ timeout: 10_000 });
  }
}

/** Dialogs should not stack — at most one modal dialog visible. */
export async function assertSingleDialogSurface(page: Page) {
  const dialogs = page.getByRole("dialog");
  const n = await dialogs.count();
  expect(n).toBeLessThanOrEqual(1);
}

/** Soft performance guard — DOM node count should not explode during session sim. */
export async function assertDomScaleReasonable(page: Page, maxNodes = 12_000) {
  const nodeCount = await page.evaluate(() => document.querySelectorAll("*").length);
  expect(nodeCount).toBeLessThan(maxNodes);
}
