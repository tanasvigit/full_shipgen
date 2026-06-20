import { test, expect, type Page } from "@playwright/test";
import path from "path";
import fs from "fs";

const OUT_DIR = path.join(__dirname, "..", "playwright-bug-fix");
const SHOTS_DIR = path.join(OUT_DIR, "screenshots");

import { YMS_DEMO_USERS, fillYmsLoginForm } from "../helpers/demo-credentials";

const ROLES = YMS_DEMO_USERS;

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await fillYmsLoginForm(page, email, password);
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });
}

test.beforeAll(() => {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
});

test.describe("Critical bug fix verification", () => {
  test("dock_supervisor: Yard Map loads without appointments 403", async ({ page }) => {
    const errors: string[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/api/appointments") && res.status() === 403) {
        errors.push(`403 ${res.url()}`);
      }
    });
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

    await login(page, ROLES.dock_supervisor.email, ROLES.dock_supervisor.password);
    await page.goto("/yard");
    await expect(page.getByRole("heading", { name: /yard control/i })).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2000);

    const errorBanner = page.locator("text=/Failed to load yard map|module\\.appointments/i");
    await expect(errorBanner).toHaveCount(0);
    expect(errors, `Unexpected errors: ${errors.join("; ")}`).toEqual([]);

    await page.screenshot({ path: path.join(SHOTS_DIR, "dock_supervisor-yard-map.png"), fullPage: true });
  });

  test("dock_supervisor: Docks, Loading, Equipment, Labor load without cross-module 403", async ({ page }) => {
    const errors: string[] = [];
    page.on("response", (res) => {
      if (res.status() !== 403) return;
      const url = res.url();
      if (url.includes("/api/appointments") || url.includes("/api/queue")) {
        errors.push(`403 ${url}`);
      }
    });
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

    await login(page, ROLES.dock_supervisor.email, ROLES.dock_supervisor.password);

    const routes = [
      { path: "/docks", heading: /dock management/i, shot: "dock_supervisor-docks.png" },
      { path: "/loading", heading: /loading operations/i, shot: "dock_supervisor-loading.png" },
      { path: "/equipment", heading: /equipment management/i, shot: "dock_supervisor-equipment.png" },
      { path: "/labor", heading: /labor management/i, shot: "dock_supervisor-labor.png" },
    ];

    for (const route of routes) {
      errors.length = 0;
      await page.goto(route.path);
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible({ timeout: 30_000 });
      await page.waitForTimeout(1500);
      const errorBanner = page.locator("text=/module\\.(appointments|queue)|Could not load|cannot access module/i");
      await expect(errorBanner).toHaveCount(0);
      expect(errors, `${route.path}: ${errors.join("; ")}`).toEqual([]);
      await page.screenshot({ path: path.join(SHOTS_DIR, route.shot), fullPage: true });
    }
  });

  test("yard_coordinator: Appointments loads without docks 403", async ({ page }) => {
    const errors: string[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/api/docks") && res.status() === 403) {
        errors.push(`403 ${res.url()}`);
      }
    });
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

    await login(page, ROLES.yard_coordinator.email, ROLES.yard_coordinator.password);
    await page.goto("/appointments");
    await expect(page.getByRole("heading", { name: /^appointments$/i })).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2000);

    const errorBanner = page.locator("text=/module\\.docks|Failed to load appointments/i");
    await expect(errorBanner).toHaveCount(0);
    expect(errors, `Unexpected errors: ${errors.join("; ")}`).toEqual([]);

    await page.screenshot({ path: path.join(SHOTS_DIR, "yard_coordinator-appointments.png"), fullPage: true });
  });

  test("gate_operator: Control Tower or home does not 403 on queue", async ({ page }) => {
    const errors: string[] = [];
    page.on("response", (res) => {
      if (res.url().includes("/api/queue") && res.status() === 403) {
        errors.push(`403 ${res.url()}`);
      }
    });
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

    await login(page, ROLES.gate_operator.email, ROLES.gate_operator.password);
    await page.getByTestId("brand-home").click();
    await page.waitForTimeout(2000);

    const queueError = page.locator("text=/module\\.queue|Unable to load dashboard/i");
    await expect(queueError).toHaveCount(0);
    expect(errors, `Unexpected errors: ${errors.join("; ")}`).toEqual([]);

    await page.screenshot({ path: path.join(SHOTS_DIR, "gate_operator-brand-home.png"), fullPage: true });
  });

  test("gate_operator: Yard Map loads without queue/docks 403", async ({ page }) => {
    const errors: string[] = [];
    page.on("response", (res) => {
      if (res.status() === 403) {
        const url = res.url();
        if (url.includes("/api/queue") || url.includes("/api/docks") || url.includes("/api/equipment") || url.includes("/api/labor")) {
          errors.push(`403 ${url}`);
        }
      }
    });
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

    await login(page, ROLES.gate_operator.email, ROLES.gate_operator.password);
    await page.goto("/yard");
    await expect(page.getByRole("heading", { name: /yard control/i })).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(2000);

    const errorBanner = page.locator("text=/Could not load yard control|module\\.queue|module\\.docks/i");
    await expect(errorBanner).toHaveCount(0);
    expect(errors, `Unexpected errors: ${errors.join("; ")}`).toEqual([]);

    await page.screenshot({ path: path.join(SHOTS_DIR, "gate_operator-yard-map.png"), fullPage: true });
  });

  test("gate_operator: Gate Activity row click does not white-screen", async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await login(page, ROLES.gate_operator.email, ROLES.gate_operator.password);
    await page.goto("/gate");
    await expect(page.getByRole("heading", { name: /gate management/i })).toBeVisible({ timeout: 30_000 });

    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      await rows.nth(i).click();
      await page.waitForTimeout(500);
      await expect(page.locator("#root")).not.toBeEmpty();
      await expect(page.getByRole("heading", { name: /gate management/i })).toBeVisible();
    }

    const viewButtons = page.getByRole("button", { name: "View" });
    const viewCount = await viewButtons.count();
    for (let i = 0; i < viewCount; i++) {
      await viewButtons.nth(i).click();
      await page.waitForTimeout(500);
      await expect(page.locator('[data-testid="vehicle-drawer"]')).toBeVisible();
      await page.keyboard.press("Escape");
    }

    expect(pageErrors, `React errors: ${pageErrors.join("; ")}`).toEqual([]);
    await page.screenshot({ path: path.join(SHOTS_DIR, "gate_operator-gate-activity.png"), fullPage: true });
  });

  test("logo renders in TopNav and Login", async ({ page }) => {
    await page.goto("/login");
    const loginLogo = page.locator('img[alt="ShipGen"]:visible').first();
    await expect(loginLogo).toBeVisible();
    const loginDims = await loginLogo.evaluate((img: HTMLImageElement) => ({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
    }));
    expect(loginDims.naturalWidth).toBeGreaterThan(0);
    expect(loginDims.naturalHeight).toBeGreaterThan(0);

    await page.screenshot({ path: path.join(SHOTS_DIR, "login-logo.png"), fullPage: true });

    await login(page, ROLES.yard_admin.email, ROLES.yard_admin.password);
    const topLogo = page.getByTestId("brand-home").locator('img[alt="ShipGen"]');
    await expect(topLogo).toBeVisible();
    const topDims = await topLogo.evaluate((img: HTMLImageElement) => ({
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    }));
    expect(topDims.naturalWidth).toBeGreaterThan(0);
    expect(topDims.naturalHeight).toBeGreaterThan(0);

    await page.screenshot({ path: path.join(SHOTS_DIR, "topnav-logo.png"), fullPage: false });
  });
});
