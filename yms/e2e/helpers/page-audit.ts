import type { Page, Locator } from "@playwright/test";
import path from "path";
import { PATHS } from "../playwright.config";
import {
  BUTTON_CLICK_SKIP_PATTERNS,
  BUTTON_CLICK_SKIP_PREFIXES,
  BUTTON_CLICK_SKIP_TESTIDS,
} from "./constants";
import type { ButtonResult } from "./audit-state";
import type { PageListeners } from "./listeners";
import { getAuditState } from "./audit-state";

const PAGE_READY_TIMEOUT = 20_000;
const SPINNER_GRACE_MS = 6_000;

export async function setYmsRole(page: Page, role: string): Promise<void> {
  await page.addInitScript((r: string) => {
    localStorage.setItem("yms_role", r);
    localStorage.setItem("yms_user", "playwright-audit");
  }, role);
}

export async function gotoRoute(
  page: Page,
  routePath: string,
  listeners?: PageListeners
): Promise<void> {
  if (listeners) listeners.currentRoute = routePath;
  await page.goto(routePath, { waitUntil: "domcontentloaded" });
  await waitForPageReady(page);
}

export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.locator('[data-testid="topnav"]').waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
  const spinner = page.locator(".animate-spin").first();
  const start = Date.now();
  while (Date.now() - start < SPINNER_GRACE_MS) {
    if (!(await spinner.isVisible().catch(() => false))) break;
    await page.waitForTimeout(300);
  }
  await page.waitForLoadState("networkidle", { timeout: PAGE_READY_TIMEOUT }).catch(() => {});
}

export async function validateRoute(
  page: Page,
  routePath: string,
  name: string,
  alias = false
): Promise<{ status: "PASS" | "FAIL" | "WARN"; issues: string[]; screenshot?: string }> {
  const issues: string[] = [];
  const audit = getAuditState();

  const errorBoundary = page.locator("text=/Something went wrong|Unhandled Runtime Error/i");
  if (await errorBoundary.first().isVisible().catch(() => false)) {
    issues.push("Error boundary visible");
  }

  const bodyText = await page.locator("body").innerText().catch(() => "");
  if (bodyText.trim().length < 30 && !alias) {
    issues.push("Possible white screen (minimal body text)");
  }

  const title = page.locator('[data-testid="page-title"]');
  if (!alias && !(await title.isVisible().catch(() => false))) {
    const onDashboard = routePath === "/" && (await page.locator('[data-testid="dashboard-refresh"]').isVisible().catch(() => false));
    if (!onDashboard) {
      issues.push("Missing page-title (route may not have rendered)");
    }
  }

  const routeErrors = audit.consoleErrors.filter((e) => e.route === routePath && e.type === "error");
  if (routeErrors.length > 0) {
    issues.push(`${routeErrors.length} console error(s) on load`);
  }

  const routeApi = audit.apiFailures.filter((f) => f.route === routePath && f.status >= 500);
  if (routeApi.length > 0) {
    issues.push(`${routeApi.length} API 5xx on load`);
  }

  const stillLoading = await page.locator("text=/Loading schedule|Loading bays|Loading live/i").first().isVisible().catch(() => false);
  if (stillLoading) {
    issues.push("Infinite loading indicator still visible");
  }

  let status: "PASS" | "FAIL" | "WARN" = issues.length === 0 ? "PASS" : "FAIL";
  if (alias && issues.some((i) => i.includes("white screen") || i.includes("page-title"))) {
    status = "WARN";
  }

  const screenshot = await captureScreenshot(page, routePath);
  return { status, issues, screenshot };
}

export async function captureScreenshot(page: Page, slug: string): Promise<string> {
  const safe = slug.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "root";
  const dir = PATHS.screenshotsDir;
  const file = path.join(dir, `${safe}.png`);
  const { mkdirSync } = await import("fs");
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

function shouldSkipButton(testId: string | null): boolean {
  if (!testId) return false;
  if (BUTTON_CLICK_SKIP_TESTIDS.has(testId)) return true;
  if (BUTTON_CLICK_SKIP_PREFIXES.some((p) => testId.startsWith(p))) return true;
  return BUTTON_CLICK_SKIP_PATTERNS.some((re) => re.test(testId));
}

const MAX_BUTTONS_PER_ROUTE = 50;

export async function auditVisibleButtons(
  page: Page,
  routePath: string,
  listeners: PageListeners
): Promise<void> {
  const audit = getAuditState();
  listeners.currentRoute = routePath;

  const buttons = page.locator("button:visible");
  const count = Math.min(await buttons.count(), MAX_BUTTONS_PER_ROUTE);
  const seen = new Set<string>();

  // Snapshot metadata first — DOM changes after each click make nth(i) stale.
  const snapshot: Array<{ testId: string | null; label: string; disabled: boolean }> = [];
  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i);
    try {
      const testId = await btn.getAttribute("data-testid", { timeout: 3000 });
      const label =
        (await btn.innerText({ timeout: 3000 }).catch(() => ""))?.trim().slice(0, 80) ||
        (await btn.getAttribute("aria-label", { timeout: 2000 }).catch(() => null)) ||
        `button-index-${i}`;
      const disabled = await btn.isDisabled().catch(() => true);
      const key = `${testId ?? ""}|${label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      snapshot.push({ testId, label, disabled });
    } catch {
      snapshot.push({ testId: null, label: `button-index-${i}`, disabled: true });
    }
  }

  for (const { testId, label, disabled } of snapshot) {
    if (shouldSkipButton(testId)) {
      audit.buttons.push({
        route: routePath,
        label,
        testId,
        result: "SKIPPED_POLICY",
        detail: "Excluded from blind click sweep",
      });
      continue;
    }

    if (disabled) {
      audit.buttons.push({ route: routePath, label, testId, result: "SKIPPED_DISABLED" });
      continue;
    }

    const btn = testId
      ? page.locator(`[data-testid="${testId}"]:visible`).first()
      : page.getByRole("button", { name: label, exact: false }).first();

    if ((await btn.count()) === 0) {
      audit.buttons.push({
        route: routePath,
        label,
        testId,
        result: "SKIPPED_DISABLED",
        detail: "Not found after snapshot",
      });
      continue;
    }

    const errorsBefore = listeners.consoleCount();
    const urlBefore = page.url();
    let result: ButtonResult = "NO_ACTION";
    let detail: string | undefined;

    try {
      await btn.scrollIntoViewIfNeeded().catch(() => {});
      await btn.click({ timeout: 4000, force: false });
      await page.waitForTimeout(500);
      await closeOverlays(page);

      const urlAfter = page.url();
      const drawer = await page.locator('[data-testid$="-drawer"]:visible').count();
      const dialog = await page.locator('[role="dialog"]:visible, [data-testid$="-dialog"]:visible').count();
      const newErrors = listeners.consoleCount() - errorsBefore;

      if (newErrors > 0) {
        result = "ERROR";
        detail = `${newErrors} new console error(s)`;
      } else if (urlBefore !== urlAfter || drawer > 0 || dialog > 0) {
        result = "PASS";
        detail = drawer > 0 ? "opened overlay" : urlBefore !== urlAfter ? "navigation" : "opened dialog";
      } else {
        result = "NO_ACTION";
      }
    } catch (err) {
      result = "FAILED";
      detail = err instanceof Error ? err.message : String(err);
      await closeOverlays(page).catch(() => {});
    }

    audit.buttons.push({ route: routePath, label, testId, result, detail });
  }

  // Clickable cards / rows with data-testid (non-button)
  const clickables = page.locator(
    '[data-testid^="appt-row-"], [data-testid^="dock-card-"], [data-testid^="eq-card-"], [data-testid^="team-row-"], [data-testid^="op-row-"], [data-testid^="det-row-"], [data-testid^="veh-row-"], [data-testid^="queue-row-"], [data-testid^="incoming-row-"], [data-testid^="bay-"]'
  );
  const cCount = Math.min(await clickables.count(), 3);
  for (let i = 0; i < cCount; i++) {
    const el = clickables.nth(i);
    const testId = await el.getAttribute("data-testid");
    const label = testId || `clickable-${i}`;
    if (!testId || seen.has(`card-${testId}`)) continue;
    seen.add(`card-${testId}`);
    const errorsBefore = listeners.consoleCount();
    try {
      await el.click({ timeout: 4000 });
      await page.waitForTimeout(500);
      const drawer = await page.locator('[data-testid$="-drawer"]:visible').count();
      const newErrors = listeners.consoleCount() - errorsBefore;
      audit.buttons.push({
        route: routePath,
        label: `[card] ${label}`,
        testId,
        result: newErrors > 0 ? "ERROR" : drawer > 0 ? "PASS" : "NO_ACTION",
        detail: drawer > 0 ? "opened drawer" : undefined,
      });
      await closeOverlays(page);
    } catch (err) {
      audit.buttons.push({
        route: routePath,
        label: `[card] ${label}`,
        testId,
        result: "FAILED",
        detail: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

export async function closeOverlays(page: Page): Promise<void> {
  await page.keyboard.press("Escape");
  await page.waitForTimeout(200);
  const closeBtn = page.locator('[data-testid="dialog-cancel-btn"], button:has-text("Close"), [aria-label="Close"]').first();
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click().catch(() => {});
  }
}

export async function switchRole(page: Page, role: string): Promise<void> {
  await page.locator('[data-testid="topnav-user"]').click();
  await page.locator(`[data-testid="role-${role}"]`).click();
  await page.waitForTimeout(400);
  await page.keyboard.press("Escape");
}

export async function openDrawerByRow(
  page: Page,
  routePath: string,
  rowSelector: string,
  drawerTestId: string
): Promise<{ opens: boolean; closes: boolean; dataLoaded: boolean }> {
  await gotoRoute(page, routePath);
  const row = page.locator(rowSelector).first();
  const hasRow = (await row.count()) > 0;
  if (!hasRow) {
    return { opens: false, closes: false, dataLoaded: false };
  }
  await row.click();
  await page.waitForTimeout(600);
  const drawer = page.locator(`[data-testid="${drawerTestId}"]`);
  const opens = await drawer.isVisible().catch(() => false);
  const dataLoaded =
    opens &&
    (await drawer.innerText().then((t) => t.trim().length > 40).catch(() => false));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  const closes = !(await drawer.isVisible().catch(() => true));
  return { opens, closes, dataLoaded };
}

export async function runGlobalSearch(
  page: Page,
  term: string
): Promise<{ hasResults: boolean; ok: boolean; detail?: string }> {
  await gotoRoute(page, "/");
  const input = page.locator('[data-testid="topbar-search"]');
  await input.click();
  await input.fill(term);
  await page.waitForTimeout(1200);
  const dropdown = page.locator('[data-testid="jump-to-dropdown"]');
  const visible = await dropdown.isVisible().catch(() => false);
  const items = await dropdown.locator("button, a, [role='option'], li").count().catch(() => 0);
  const filterOnPage = await page.locator('[data-testid="filter-indicator"]').isVisible().catch(() => false);
  const hasResults = visible && items > 0;
  const ok = !visible || hasResults || filterOnPage;
  await page.locator('[data-testid="topbar-search-clear"]').click().catch(() => {});
  return {
    hasResults: hasResults || filterOnPage,
    ok,
    detail: visible ? `${items} jump-to item(s)` : "dropdown not shown (may filter in-page only)",
  };
}

export async function checkHealth(frontendUrl: string, apiUrl: string): Promise<{ frontend: boolean; backend: boolean }> {
  let frontend = false;
  let backend = false;
  try {
    const r = await fetch(frontendUrl, { signal: AbortSignal.timeout(8000) });
    frontend = r.ok;
  } catch {
    frontend = false;
  }
  const probes = [`${apiUrl}/health`, `${apiUrl}/api/health`, `${apiUrl}/docs`];
  for (const url of probes) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (r.ok) {
        backend = true;
        break;
      }
    } catch {
      /* try next */
    }
  }
  return { frontend, backend };
}
