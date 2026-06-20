import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

import { YMS_DEMO_USERS, fillYmsLoginForm } from "../helpers/demo-credentials";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByTestId("login-form").waitFor({ state: "visible", timeout: 20_000 });
  await fillYmsLoginForm(page, YMS_DEMO_USERS.yard_admin.email, YMS_DEMO_USERS.yard_admin.password);
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 30_000 });
  await page.locator('[data-testid="topnav"]').waitFor({ state: "visible", timeout: 20_000 });
}

const VIEWPORTS = [
  { width: 1920, height: 1080, label: "1920" },
  { width: 1440, height: 900, label: "1440" },
  { width: 1280, height: 800, label: "1280" },
  { width: 1024, height: 768, label: "1024" },
  { width: 768, height: 1024, label: "768" },
  { width: 375, height: 812, label: "375" },
];

const SHOT_DIR = path.join(__dirname, "..", "screenshots", "topnav-overlap");

test.describe("Top navbar overlap and dropdown visibility", () => {
  for (const vp of VIEWPORTS) {
    test(`navigation layout @ ${vp.label}px`, async ({ page }) => {
      fs.mkdirSync(path.join(SHOT_DIR, vp.label), { recursive: true });
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await loginAsAdmin(page);
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.locator('[data-testid="topnav"]').waitFor({ state: "visible", timeout: 20_000 });

      const topNav = page.locator('[data-testid="topnav"]');
      await expect(topNav).toBeVisible();
      await expect(page.getByTestId("quick-book-appointment")).toHaveCount(0);

      if (vp.width >= 1024) {
        const controlMenu = page.getByTestId("menu-control");
        const reportsMenu = page.getByTestId("menu-reports");
        const adminMenu = page.getByTestId("menu-administration");
        await expect(controlMenu).toBeVisible();
        await expect(reportsMenu).toBeVisible();
        await expect(adminMenu).toBeVisible();

        await reportsMenu.click();
        const reportsItem = page.getByTestId("nav-operations-dashboard");
        await expect(reportsItem).toBeVisible();

        const menuMetrics = await page.evaluate(() => {
          const topNavEl = document.querySelector('[data-testid="topnav"]');
          const menuEl = document.querySelector('[data-testid="nav-operations-dashboard"]');
          const navRect = topNavEl?.getBoundingClientRect();
          const menuRect = menuEl?.getBoundingClientRect();
          const menuParent = menuEl?.closest("[data-radix-popper-content-wrapper]");
          const z = menuParent ? window.getComputedStyle(menuParent).zIndex : "";
          return {
            navBottom: navRect?.bottom ?? 0,
            menuTop: menuRect?.top ?? 0,
            menuHeight: menuRect?.height ?? 0,
            zIndex: z,
          };
        });

        expect(menuMetrics.menuHeight).toBeGreaterThan(0);
        expect(menuMetrics.menuTop).toBeGreaterThanOrEqual(menuMetrics.navBottom - 1);
        expect(Number.parseInt(menuMetrics.zIndex || "0", 10)).toBeGreaterThanOrEqual(9999);
      } else {
        await expect(page.getByTestId("mobile-nav-toggle")).toBeVisible();
        await expect(page.getByTestId("menu-reports")).not.toBeVisible();
      }

      const overlapCount = await page.evaluate(() => {
        const ids = [
          "brand-home",
          "menu-control",
          "menu-operations",
          "menu-resources",
          "menu-reports",
          "menu-administration",
          "topnav-alert",
          "topnav-notif",
          "topnav-user",
          "mobile-nav-toggle",
        ];
        const rects = ids
          .map((id) => {
            const el = document.querySelector(`[data-testid="${id}"]`);
            if (!el) return null;
            const style = window.getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden") return null;
            const rect = el.getBoundingClientRect();
            if (rect.width <= 0 || rect.height <= 0) return null;
            return { id, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
          })
          .filter(Boolean);

        let overlaps = 0;
        for (let i = 0; i < rects.length; i += 1) {
          for (let j = i + 1; j < rects.length; j += 1) {
            const a = rects[i];
            const b = rects[j];
            const intersects =
              a.left < b.right &&
              a.right > b.left &&
              a.top < b.bottom &&
              a.bottom > b.top;
            if (intersects) overlaps += 1;
          }
        }
        return overlaps;
      });

      expect(overlapCount).toBe(0);

      await page.screenshot({
        path: path.join(SHOT_DIR, vp.label, "topnav.png"),
        fullPage: false,
      });
    });
  }
});
