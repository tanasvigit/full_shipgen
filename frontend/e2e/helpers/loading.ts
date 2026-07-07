import { expect, type Locator, type Page } from "@playwright/test";

export const LOGO_LOADER_CLASS = "fleetbase-logo-loader";
export const LOGO_STREAK_ANIMATION = "fleetbase-logo-streak-flow";
export const LOGO_SWOOSH_ANIMATION = "fleetbase-logo-swoosh-flow";

/** @deprecated use LOGO_LOADER_CLASS */
export const ARC_SPINNER_CLASS = LOGO_LOADER_CLASS;
/** @deprecated use LOGO_STREAK_ANIMATION */
export const ARC_SPIN_ANIMATION = LOGO_STREAK_ANIMATION;
export const ARC_SPIN_DURATION = "0.55s";

export async function assertLogoLoaderStructure(spinner: Locator) {
  await expect(spinner).toBeVisible();
  await expect(spinner).toHaveClass(new RegExp(LOGO_LOADER_CLASS));

  const host = spinner.locator("xpath=ancestor::span[contains(@class,'fleetbase-logo-loader-host')][1]");
  if ((await host.count()) > 0) {
    await expect(host).toHaveClass(/fleetbase-logo-loader-host/);
    await expect(host).toHaveClass(/fleetbase-loader-fade-in/);
  }

  await expect(spinner.locator(".fleetbase-logo-loader__streaks")).toHaveCount(1);
  await expect(spinner.locator(".fleetbase-logo-loader__swoosh")).toHaveCount(1);
  await expect(spinner.locator(".fleetbase-logo-loader__mark")).toHaveCount(1);
}

export async function assertLogoLoaderCssAnimation(spinner: Locator) {
  const streakStyles = await spinner.locator(".fleetbase-logo-loader__streaks").evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      animationName: s.animationName,
      animationDuration: s.animationDuration,
      animationIterationCount: s.animationIterationCount,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  });

  if (streakStyles.reducedMotion) {
    expect(streakStyles.animationName === "none" || streakStyles.animationDuration === "0s").toBeTruthy();
    return;
  }

  expect(streakStyles.animationName).toContain(LOGO_STREAK_ANIMATION);
  expect(streakStyles.animationDuration).toBe(ARC_SPIN_DURATION);
  expect(streakStyles.animationIterationCount).toBe("infinite");

  const swooshStyles = await spinner.locator(".fleetbase-logo-loader__swoosh").evaluate((el) => {
    const s = getComputedStyle(el);
    return { animationName: s.animationName };
  });
  expect(swooshStyles.animationName).toContain(LOGO_SWOOSH_ANIMATION);
}

/** Logo loader streaks/swoosh translate across frames (not a rotating arc). */
export async function assertLogoLoaderAnimates(spinner: Locator) {
  const moved = await spinner.locator(".fleetbase-logo-loader__streaks").evaluate(async (el) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return true;

    const matrixAt = () => {
      const t = getComputedStyle(el).transform;
      if (!t || t === "none") return { x: 0, y: 0 };
      const m = new DOMMatrixReadOnly(t);
      return { x: m.m41, y: m.m42 };
    };

    const a0 = matrixAt();
    await new Promise<void>((resolve) => {
      let frames = 0;
      const tick = () => {
        frames += 1;
        if (frames >= 24) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const a1 = matrixAt();
    return Math.abs(a1.x - a0.x) > 2 || Math.abs(a1.y - a0.y) > 0.5;
  });

  expect(moved).toBe(true);
}

/** @deprecated use assertLogoLoaderStructure */
export async function assertArcSpinnerStructure(spinner: Locator) {
  await assertLogoLoaderStructure(spinner);
}

/** @deprecated use assertLogoLoaderCssAnimation */
export async function assertArcSpinnerCssAnimation(spinner: Locator) {
  await assertLogoLoaderCssAnimation(spinner);
}

/** @deprecated use assertLogoLoaderAnimates */
export async function assertArcSpinnerRotates(spinner: Locator) {
  await assertLogoLoaderAnimates(spinner);
}

export async function assertLogoLoaderFully(spinner: Locator) {
  await assertLogoLoaderStructure(spinner);
  await assertLogoLoaderCssAnimation(spinner);
  await assertLogoLoaderAnimates(spinner);
}

export async function assertArcSpinnerFully(spinner: Locator) {
  await assertLogoLoaderFully(spinner);
}

/** Spinner centered within a scoped container (e.g. table body overlay). */
export async function assertSpinnerCenteredInContainer(
  page: Page,
  spinnerTestId: string,
  containerTestId: string,
) {
  const box = await page.getByTestId(spinnerTestId).boundingBox();
  const container = await page.getByTestId(containerTestId).boundingBox();
  expect(box).not.toBeNull();
  expect(container).not.toBeNull();
  const cx = box!.x + box!.width / 2;
  const cy = box!.y + box!.height / 2;
  const tx = container!.x + container!.width / 2;
  const ty = container!.y + container!.height / 2;
  expect(Math.abs(cx - tx)).toBeLessThan(container!.width * 0.12);
  expect(Math.abs(cy - ty)).toBeLessThan(container!.height * 0.12);
}

/** Viewport-fixed loader overlay is centered on screen (refresh / table reload). */
export async function assertSpinnerInViewportCenter(page: Page, spinnerTestId: string) {
  const box = await page.getByTestId(spinnerTestId).boundingBox();
  expect(box).not.toBeNull();
  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();
  const cx = box!.x + box!.width / 2;
  const cy = box!.y + box!.height / 2;
  const vx = viewport!.width / 2;
  const vy = viewport!.height / 2;
  expect(Math.abs(cx - vx)).toBeLessThan(viewport!.width * 0.08);
  expect(Math.abs(cy - vy)).toBeLessThan(viewport!.height * 0.08);
}

/** Delay matching FleetOps list GET so table section overlay stays visible past debounce. */
export async function delayFleetOpsListGet(page: Page, resource: "drivers" | "vehicles" | "places" | "orders", delayMs: number) {
  const pattern = new RegExp(`/int/v1/.*${resource}(\\?|$|/)`, "i");
  await page.route(pattern, async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await route.continue();
  });
}

export async function waitForRouteProgressActive(page: Page, timeout = 8_000) {
  await page.waitForFunction(
    () => document.querySelector('[data-testid="route-progress-loader"]')?.getAttribute("data-active") === "true",
    { timeout },
  );
}

export async function assertRouteProgressBarAnimation(page: Page) {
  const bar = page.getByTestId("route-progress-loader").locator(".fleetbase-route-progress__bar");
  await expect(bar).toBeAttached();

  const styles = await bar.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      animationName: s.animationName,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  });

  if (styles.reducedMotion) {
    expect(styles.animationName === "none" || styles.animationName === "").toBeTruthy();
    return;
  }

  expect(styles.animationName).toContain("fleetbase-progress-indeterminate");
}
