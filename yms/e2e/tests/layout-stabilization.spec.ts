import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { loginAsRole } from "../helpers/responsive-audit";

const ROUTES = [
  { path: "/docks", name: "docks", role: "dock_supervisor", kpi: '[data-testid="dock-kpi-total"]' },
  { path: "/loading", name: "loading", role: "dock_supervisor", kpi: '[data-testid="loading-kpi-active"]' },
  { path: "/ai", name: "ai", role: "yard_admin", kpi: '[data-testid="ai-hero-banner"]' },
];

const VIEWPORTS = [
  { width: 768, height: 1024, label: "tablet" },
  { width: 1024, height: 768, label: "laptop" },
  { width: 1366, height: 768, label: "laptop-hd" },
  { width: 1920, height: 1080, label: "desktop" },
];

const SHOT_DIR = path.join(__dirname, "..", "screenshots", "layout-stabilization");

test.describe("Layout stabilization — header clearance", () => {
  for (const vp of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${route.name} @ ${vp.label} (${vp.width}px)`, async ({ page }) => {
        fs.mkdirSync(path.join(SHOT_DIR, vp.label), { recursive: true });

        await page.setViewportSize({ width: vp.width, height: vp.height });
        await loginAsRole(page, route.role);
        await page.goto(route.path, { waitUntil: "domcontentloaded" });
        await page.locator('[data-testid="topbar"]').waitFor({ state: "visible", timeout: 20_000 });
        await page.locator('[data-testid="page-content"]').waitFor({ state: "visible", timeout: 15_000 });
        await page.waitForTimeout(600);

        const metrics = await page.evaluate(() => {
          const nav = document.querySelector('[data-testid="topnav"]');
          const bar = document.querySelector('[data-testid="topbar"]');
          const content = document.querySelector('[data-testid="page-content"]');
          const navRect = nav?.getBoundingClientRect();
          const barRect = bar?.getBoundingClientRect();
          const contentRect = content?.getBoundingClientRect();
          const headerH = parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue("--yms-app-header-height")
          ) || navRect?.height || 0;

          return {
            navBottom: navRect?.bottom ?? 0,
            barTop: barRect?.top ?? 0,
            barBottom: barRect?.bottom ?? 0,
            contentTop: contentRect?.top ?? 0,
            headerH,
            hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
          };
        });

        expect(metrics.barTop).toBeGreaterThanOrEqual(metrics.headerH - 2);
        expect(metrics.contentTop).toBeGreaterThanOrEqual(metrics.barBottom - 2);

        const kpi = page.locator(route.kpi).first();
        await expect(kpi).toBeVisible();
        const kpiBox = await kpi.boundingBox();
        expect(kpiBox).not.toBeNull();
        if (kpiBox) {
          expect(kpiBox.y).toBeGreaterThanOrEqual(metrics.barBottom - 4);
          expect(kpiBox.height).toBeGreaterThan(0);
        }

        expect(metrics.hScroll).toBe(false);

        await page.screenshot({
          path: path.join(SHOT_DIR, vp.label, `${route.name}.png`),
          fullPage: true,
        });
      });
    }
  }
});
