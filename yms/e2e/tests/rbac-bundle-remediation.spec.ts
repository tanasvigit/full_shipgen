import { test, expect, type Page } from "@playwright/test";
import path from "path";
import fs from "fs";

const SHOTS_DIR = path.join(__dirname, "..", "playwright-rbac-remediation", "screenshots");

import { YMS_DEMO_USERS, fillYmsLoginForm } from "../helpers/demo-credentials";

const ROLES = YMS_DEMO_USERS;

type RoleKey = keyof typeof ROLES;

async function login(page: Page, role: RoleKey) {
  const { email, password } = ROLES[role];
  await page.goto("/login");
  await fillYmsLoginForm(page, email, password);
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });
}

function trackForbidden(page: Page, patterns: RegExp[], bucket: string[]) {
  page.on("response", (res) => {
    if (res.status() !== 403) return;
    const url = res.url();
    if (patterns.some((p) => p.test(url))) bucket.push(`403 ${url}`);
  });
  page.on("pageerror", (err) => bucket.push(`pageerror: ${err.message}`));
}

test.beforeAll(() => {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
});

async function assertVehiclesLoad(page: Page, role: RoleKey) {
  const errors: string[] = [];
  trackForbidden(
    page,
    [/\/api\/appointments/, /\/api\/queue/, /\/api\/docks/, /\/api\/yard/],
    errors
  );

  await login(page, role);
  await page.goto("/vehicles");
  await expect(page.getByRole("heading", { name: /vehicle operations monitor/i })).toBeVisible({
    timeout: 30_000,
  });
  await page.waitForTimeout(1500);
  await expect(page.locator("text=/cannot access module|Failed to load/i")).toHaveCount(0);
  expect(errors, `${role}: ${errors.join("; ")}`).toEqual([]);
  await page.screenshot({ path: path.join(SHOTS_DIR, `${role}-vehicles.png`), fullPage: true });
}

test.describe("RBAC bundle remediation", () => {
  for (const role of [
    "yard_admin",
    "yard_manager",
    "gate_operator",
    "yard_coordinator",
    "dock_supervisor",
  ] as RoleKey[]) {
    test(`${role}: Vehicles page without cross-module 403`, async ({ page }) => {
      await assertVehiclesLoad(page, role);
    });
  }

  test("dock_supervisor: dock drawer without appointments/queue 403", async ({ page }) => {
    const errors: string[] = [];
    trackForbidden(page, [/\/api\/appointments/, /\/api\/queue/], errors);

    await login(page, "dock_supervisor");
    await page.goto("/docks");
    await expect(page.getByRole("heading", { name: /dock management/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.locator('[data-testid^="dock-card-"]').first().click();
    await expect(page.getByTestId("dock-drawer")).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1500);
    expect(errors, errors.join("; ")).toEqual([]);
    await page.screenshot({
      path: path.join(SHOTS_DIR, "dock_supervisor-dock-drawer.png"),
      fullPage: true,
    });
  });

  test("dock_supervisor: labor, equipment, loading drawers", async ({ page }) => {
    const errors: string[] = [];
    trackForbidden(page, [/\/api\/appointments/, /\/api\/queue/], errors);

    await login(page, "dock_supervisor");

    await page.goto("/labor");
    await expect(page.getByRole("heading", { name: /labor management/i })).toBeVisible({
      timeout: 30_000,
    });
    const teamView = page.locator('[data-testid^="team-view-"]').first();
    if (await teamView.count()) {
      await teamView.click();
      await expect(page.getByTestId("labor-drawer")).toBeVisible();
      await page.keyboard.press("Escape");
    }

    await page.goto("/equipment");
    const eqView = page.locator('[data-testid^="eq-view-"]').first();
    if (await eqView.count()) {
      await eqView.click();
      await expect(page.getByTestId("equipment-drawer")).toBeVisible();
      await page.keyboard.press("Escape");
    }

    await page.goto("/loading");
    const opRow = page.locator('[data-testid^="op-row-"]').first();
    if (await opRow.count()) {
      await opRow.click();
      await expect(page.getByTestId("loading-op-drawer")).toBeVisible();
    }

    expect(errors, errors.join("; ")).toEqual([]);
  });

  test("gate_operator: appointments without queue/docks 403", async ({ page }) => {
    const errors: string[] = [];
    trackForbidden(page, [/\/api\/queue/, /\/api\/docks/], errors);
    await login(page, "gate_operator");
    await page.goto("/appointments");
    await expect(page.getByRole("heading", { name: /^appointments$/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.waitForTimeout(1500);
    expect(errors, errors.join("; ")).toEqual([]);
  });

  test("yard_coordinator: appointments without docks 403", async ({ page }) => {
    const errors: string[] = [];
    trackForbidden(page, [/\/api\/docks/], errors);
    await login(page, "yard_coordinator");
    await page.goto("/appointments");
    await expect(page.getByRole("heading", { name: /^appointments$/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.waitForTimeout(1500);
    expect(errors, errors.join("; ")).toEqual([]);
  });

  test("yard_admin: book dialog loads bundle without 403", async ({ page }) => {
    const errors: string[] = [];
    page.on("response", (res) => {
      if (res.status() === 403 && /\/api\/(queue|docks)/.test(res.url())) {
        errors.push(`403 ${res.url()}`);
      }
    });

    await login(page, "yard_admin");
    await page.goto("/appointments");
    await page.getByTestId("book-appointment-btn").click();
    await expect(page.getByRole("dialog", { name: /book appointment/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.waitForTimeout(2000);
    expect(errors, errors.join("; ")).toEqual([]);
    await page.screenshot({
      path: path.join(SHOTS_DIR, "yard_admin-book-dialog.png"),
      fullPage: true,
    });
  });
});
