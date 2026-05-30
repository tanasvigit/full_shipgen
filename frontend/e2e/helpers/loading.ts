import { expect, type Locator, type Page } from "@playwright/test";

export const ARC_SPINNER_CLASS = "fleetbase-arc-spinner";
export const ARC_SPIN_ANIMATION = "fleetbase-arc-spin";
export const ARC_SPIN_DURATION = "0.9s";

/** SVG arc spinner structure per LOADING-SYSTEM.md */
export async function assertArcSpinnerStructure(spinner: Locator) {
  await expect(spinner).toBeVisible();
  await expect(spinner).toHaveClass(new RegExp(ARC_SPINNER_CLASS));

  const host = spinner.locator("xpath=ancestor::span[contains(@class,'fleetbase-arc-spinner-host')][1]");
  if ((await host.count()) > 0) {
    await expect(host).toHaveClass(/fleetbase-arc-spinner-host/);
    await expect(host).toHaveClass(/fleetbase-loader-fade-in/);
  } else {
    const fadedAncestor = spinner.locator("xpath=ancestor::*[contains(@class,'fleetbase-loader-fade-in')][1]");
    await expect(fadedAncestor).toBeAttached();
  }

  const track = spinner.locator("circle.fleetbase-arc-spinner__track");
  const arc = spinner.locator("circle.fleetbase-arc-spinner__arc");
  await expect(track).toHaveCount(1);
  await expect(arc).toHaveCount(1);

  await expect(arc).toHaveAttribute("stroke-linecap", "round");

  const dash = await arc.getAttribute("stroke-dasharray");
  expect(dash?.replace(/\s+/g, " ").trim()).toMatch(/^94(\s+125\.66)?$/);
}

/** CSS animation contract (transform-only, 0.9s linear loop) */
export async function assertArcSpinnerCssAnimation(spinner: Locator) {
  const styles = await spinner.evaluate((el) => {
    const s = getComputedStyle(el);
    return {
      animationName: s.animationName,
      animationDuration: s.animationDuration,
      animationTimingFunction: s.animationTimingFunction,
      animationIterationCount: s.animationIterationCount,
      transformOrigin: s.transformOrigin,
      willChange: s.willChange,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  });

  if (styles.reducedMotion) {
    expect(styles.animationName === "none" || styles.animationDuration === "0s").toBeTruthy();
    return;
  }

  expect(styles.animationName).toContain(ARC_SPIN_ANIMATION);
  expect(styles.animationDuration).toBe(ARC_SPIN_DURATION);
  expect(styles.animationTimingFunction).toBe("linear");
  expect(styles.animationIterationCount).toBe("infinite");
  expect(styles.willChange).toBe("transform");

  const originCentered = await spinner.evaluate((el) => {
    const s = getComputedStyle(el);
    const origin = s.transformOrigin;
    if (/center/i.test(origin)) return true;
    const parts = origin.split(/\s+/);
    if (parts.length < 2) return false;
    const ox = Number.parseFloat(parts[0]);
    const oy = Number.parseFloat(parts[1]);
    const w = el.clientWidth || el.getBoundingClientRect().width;
    const h = el.clientHeight || el.getBoundingClientRect().height;
    return Math.abs(ox - w / 2) <= 1 && Math.abs(oy - h / 2) <= 1;
  });
  expect(originCentered).toBe(true);
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

/** Transform matrix changes across animation frames (real rotation, not static) */
export async function assertArcSpinnerRotates(spinner: Locator) {
  const rotated = await spinner.evaluate(async (el) => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return true;

    const angle = () => {
      const t = getComputedStyle(el).transform;
      if (!t || t === "none") return 0;
      const m = new DOMMatrixReadOnly(t);
      return Math.atan2(m.b, m.a);
    };

    const a0 = angle();
    await new Promise<void>((resolve) => {
      let frames = 0;
      const tick = () => {
        frames += 1;
        if (frames >= 24) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const a1 = angle();
    return Math.abs(a1 - a0) > 0.04;
  });

  expect(rotated).toBe(true);
}

export async function assertArcSpinnerFully(spinner: Locator) {
  await assertArcSpinnerStructure(spinner);
  await assertArcSpinnerCssAnimation(spinner);
  await assertArcSpinnerRotates(spinner);
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
