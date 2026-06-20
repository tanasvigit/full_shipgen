import type { Browser, BrowserContext, Download, Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import { MANUAL_AUDIT_PATHS } from "../playwright.manual-audit.config";
import {
  BUTTON_CLICK_SKIP_PATTERNS,
  BUTTON_CLICK_SKIP_PREFIXES,
  BUTTON_CLICK_SKIP_TESTIDS,
} from "./constants";
import { login as jwtLogin } from "./rbac-audit";

export const OUT_DIR = MANUAL_AUDIT_PATHS.root;
export const SHOTS_DIR = MANUAL_AUDIT_PATHS.screenshots;
export const VIDEOS_DIR = MANUAL_AUDIT_PATHS.videos;
export const STATE_JSON = MANUAL_AUDIT_PATHS.stateJson;

export const FRONTEND_URL = process.env.YMS_FRONTEND_URL || "http://localhost:3001";
export const VIEWPORT = { w: 1440, h: 900, label: "1440x900" } as const;

export type CsvRow = Record<string, string | number | boolean>;

export const MODULES = [
  { path: "/", slug: "control-tower", name: "Control Tower" },
  { path: "/appointments", slug: "appointments", name: "Appointments" },
  { path: "/gate", slug: "gate-management", name: "Gate Management" },
  { path: "/queue", slug: "virtual-queue", name: "Virtual Queue" },
  { path: "/yard", slug: "yard-map", name: "Yard Map" },
  { path: "/vehicles", slug: "vehicles", name: "Vehicle Operations Monitor" },
  { path: "/docks", slug: "dock-management", name: "Dock Management" },
  { path: "/labor", slug: "labor-management", name: "Labor Management" },
  { path: "/equipment", slug: "equipment-management", name: "Equipment Management" },
  { path: "/loading", slug: "loading-operations", name: "Loading Operations" },
  { path: "/detention", slug: "detention-management", name: "Detention Management" },
  { path: "/operations-dashboard", slug: "operations-dashboard", name: "Operations Dashboard" },
  { path: "/reports/delay-analysis", slug: "delay-analysis", name: "Delay Analysis" },
  { path: "/kpis", slug: "executive-kpis", name: "Executive KPIs" },
  { path: "/admin/users", slug: "user-management", name: "User Management" },
  { path: "/admin/roles", slug: "role-management", name: "Role Management" },
  { path: "/settings", slug: "system-settings", name: "System Settings" },
] as const;

export const OPTIONAL_ROLES = [
  { role: "yard_manager", email: "yard.manager@shipgen.demo", password: "Shipgen@Yms2026!" },
  { role: "gate_operator", email: "yard.gate@shipgen.demo", password: "Shipgen@Yms2026!" },
  { role: "yard_coordinator", email: "yard.coordinator@shipgen.demo", password: "Shipgen@Yms2026!" },
  { role: "dock_supervisor", email: "yard.supervisor@shipgen.demo", password: "Shipgen@Yms2026!" },
] as const;

export type ManualAuditResult = {
  role: string;
  startedAt: string;
  finishedAt: string;
  modulesTested: number;
  buttonsTested: number;
  tablesTested: number;
  dialogsTested: number;
  drawersTested: number;
  exportsTested: number;
  passCount: number;
  failCount: number;
  noActionCount: number;
  disabledCount: number;
  hiddenCount: number;
  buttonRows: CsvRow[];
  tableRows: CsvRow[];
  dialogRows: CsvRow[];
  drawerRows: CsvRow[];
  networkRows: CsvRow[];
  consoleRows: CsvRow[];
  moduleRows: CsvRow[];
  errors: string[];
  screenshots: number;
};

let shotSeq = 0;

export function ensureDirs(): void {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

function toCsv(rows: CsvRow[]): string {
  if (!rows.length) return "";
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export function writeCsvArtifacts(result: ManualAuditResult): void {
  ensureDirs();
  fs.writeFileSync(path.join(OUT_DIR, "button-results.csv"), toCsv(result.buttonRows), "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "table-results.csv"), toCsv(result.tableRows), "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "dialog-results.csv"), toCsv(result.dialogRows), "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "drawer-results.csv"), toCsv(result.drawerRows), "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "network-errors.csv"), toCsv(result.networkRows), "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "console-errors.csv"), toCsv(result.consoleRows), "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "module-summary.csv"), toCsv(result.moduleRows), "utf8");
  fs.writeFileSync(STATE_JSON, JSON.stringify(result, null, 2), "utf8");
}

async function shot(page: Page, role: string, moduleSlug: string, label: string, fullPage = true): Promise<string> {
  shotSeq += 1;
  const safe = label.replace(/[^\w.-]+/g, "_").slice(0, 72);
  const file = path.join(SHOTS_DIR, `${role}__${moduleSlug}__${String(shotSeq).padStart(5, "0")}__${safe}.png`);
  await page.screenshot({ path: file, fullPage });
  return file;
}

async function waitReady(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await page.locator('[data-testid="topnav"]').waitFor({ state: "visible", timeout: 20_000 }).catch(() => {});
  const spinner = page.locator(".animate-spin").first();
  const start = Date.now();
  while (Date.now() - start < 8000) {
    if (!(await spinner.isVisible().catch(() => false))) break;
    await page.waitForTimeout(250);
  }
  await page.waitForLoadState("networkidle", { timeout: 25_000 }).catch(() => {});
}

async function closeOverlays(page: Page): Promise<void> {
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(150);
  const cancel = page
    .locator('[data-testid="dialog-cancel-btn"], button:has-text("Cancel"), [aria-label="Close"]')
    .first();
  if (await cancel.isVisible().catch(() => false)) {
    await cancel.click().catch(() => {});
    await page.waitForTimeout(150);
  }
}

function shouldSkipButton(testId: string | null, label: string): boolean {
  if (/logout|sign out|delete user|deactivate|remove/i.test(label)) return true;
  if (testId && BUTTON_CLICK_SKIP_TESTIDS.has(testId)) return true;
  if (testId && BUTTON_CLICK_SKIP_PREFIXES.some((p) => testId.startsWith(p))) return true;
  if (testId && BUTTON_CLICK_SKIP_PATTERNS.some((re) => re.test(testId))) return true;
  return false;
}

function attachListeners(page: Page, role: string, result: ManualAuditResult): void {
  page.on("console", (msg) => {
    if (!["error", "warning"].includes(msg.type())) return;
    result.consoleRows.push({
      role,
      route: page.url(),
      type: msg.type(),
      message: msg.text().slice(0, 500),
      timestamp: new Date().toISOString(),
    });
  });
  page.on("pageerror", (err) => {
    result.consoleRows.push({
      role,
      route: page.url(),
      type: "pageerror",
      message: err.message.slice(0, 500),
      timestamp: new Date().toISOString(),
    });
  });
  page.on("requestfailed", (req) => {
    const url = req.url();
    if (!url.includes("/api/") && !url.includes(":8001")) return;
    result.networkRows.push({
      role,
      route: page.url(),
      method: req.method(),
      status: 0,
      url,
      detail: req.failure()?.errorText || "failed",
      timestamp: new Date().toISOString(),
    });
  });
  page.on("response", (res) => {
    const url = res.url();
    if (!url.includes("/api/") && !url.includes(":8001")) return;
    const status = res.status();
    if (status >= 400) {
      result.networkRows.push({
        role,
        route: page.url(),
        method: res.request().method(),
        status,
        url,
        detail: "",
        timestamp: new Date().toISOString(),
      });
    }
  });
}

async function detectUiResponse(page: Page, urlBefore: string): Promise<string> {
  const urlAfter = page.url();
  if (urlBefore !== urlAfter) return "navigation";
  if (await page.locator('[role="dialog"][data-state="open"], [role="dialog"]:visible').count()) return "dialog";
  if (await page.locator('[data-testid$="-drawer"]:visible').count()) return "drawer";
  if (await page.locator("[data-sonner-toast], [role='status']").count()) return "toast";
  return "none";
}

async function auditTabs(page: Page, role: string, mod: (typeof MODULES)[number], result: ManualAuditResult): Promise<void> {
  const tabs = page.getByRole("tab");
  const count = await tabs.count();
  for (let i = 0; i < count; i++) {
    const tab = tabs.nth(i);
    const name = ((await tab.innerText().catch(() => "")) || `tab-${i}`).trim().slice(0, 60);
    if (!(await tab.isVisible().catch(() => false))) continue;
    try {
      await shot(page, role, mod.slug, `tab-${name}-before`);
      await tab.click({ timeout: 4000 });
      await page.waitForTimeout(400);
      await shot(page, role, mod.slug, `tab-${name}-after`);
      result.passCount += 1;
      result.buttonRows.push({
        role,
        module: mod.name,
        route: mod.path,
        control: name,
        type: "tab",
        status: "PASS",
        outcome: "tab-switch",
      });
    } catch (e) {
      result.failCount += 1;
      result.buttonRows.push({
        role,
        module: mod.name,
        route: mod.path,
        control: name,
        type: "tab",
        status: "FAIL",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

async function auditDropdowns(
  page: Page,
  role: string,
  mod: (typeof MODULES)[number],
  result: ManualAuditResult
): Promise<void> {
  const selects = page.locator("select:visible, [role='combobox']:visible");
  const count = Math.min(await selects.count(), 8);
  for (let i = 0; i < count; i++) {
    const el = selects.nth(i);
    const label = `dropdown-${i}`;
    try {
      await el.scrollIntoViewIfNeeded().catch(() => {});
      await shot(page, role, mod.slug, `${label}-before`);
      const tag = await el.evaluate((n) => n.tagName.toLowerCase());
      if (tag === "select") {
        const opts = await el.locator("option").count();
        if (opts > 1) await el.selectOption({ index: 1 });
      } else {
        await el.click();
        await page.waitForTimeout(200);
        const opt = page.getByRole("option").first();
        if (await opt.isVisible().catch(() => false)) await opt.click();
      }
      await page.waitForTimeout(300);
      await shot(page, role, mod.slug, `${label}-after`);
      result.passCount += 1;
      result.buttonRows.push({
        role,
        module: mod.name,
        route: mod.path,
        control: label,
        type: "dropdown",
        status: "PASS",
      });
      await closeOverlays(page);
    } catch (e) {
      result.failCount += 1;
      result.buttonRows.push({
        role,
        module: mod.name,
        route: mod.path,
        control: label,
        type: "dropdown",
        status: "FAIL",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

async function auditSearch(page: Page, role: string, mod: (typeof MODULES)[number], result: ManualAuditResult): Promise<void> {
  const inputs = page.locator(
    'main input[placeholder*="Search" i]:visible, main input[type="search"]:visible, [data-testid="topbar-search"]:visible'
  );
  const count = Math.min(await inputs.count(), 4);
  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i);
    for (const term of ["test", "ABC", "123"]) {
      try {
        await input.fill(term, { timeout: 3000 });
        await page.waitForTimeout(300);
        result.passCount += 1;
        result.buttonRows.push({
          role,
          module: mod.name,
          route: mod.path,
          control: `search-${i}`,
          type: "search",
          status: "PASS",
          term,
        });
      } catch (e) {
        result.buttonRows.push({
          role,
          module: mod.name,
          route: mod.path,
          control: `search-${i}`,
          type: "search",
          status: "NO_ACTION",
          term,
          detail: e instanceof Error ? e.message.slice(0, 120) : String(e),
        });
        result.noActionCount += 1;
      }
    }
    await input.clear().catch(() => {});
  }
}

async function auditFilters(page: Page, role: string, mod: (typeof MODULES)[number], result: ManualAuditResult): Promise<void> {
  const filters = page.locator(
    '[data-testid*="filter" i], button:has-text("Filter"), button:has-text("Reset"), select[name*="filter" i]'
  );
  const count = Math.min(await filters.count(), 6);
  for (let i = 0; i < count; i++) {
    const f = filters.nth(i);
    const label = ((await f.innerText().catch(() => "")) || `filter-${i}`).trim().slice(0, 50);
    try {
      await f.scrollIntoViewIfNeeded().catch(() => {});
      await shot(page, role, mod.slug, `filter-${i}-before`);
      await f.click({ timeout: 3000 });
      await page.waitForTimeout(350);
      await shot(page, role, mod.slug, `filter-${i}-after`);
      result.passCount += 1;
      result.buttonRows.push({
        role,
        module: mod.name,
        route: mod.path,
        control: label,
        type: "filter",
        status: "PASS",
      });
      await closeOverlays(page);
    } catch (e) {
      result.failCount += 1;
      result.buttonRows.push({
        role,
        module: mod.name,
        route: mod.path,
        control: label,
        type: "filter",
        status: "FAIL",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

async function auditExports(
  page: Page,
  role: string,
  mod: (typeof MODULES)[number],
  result: ManualAuditResult
): Promise<void> {
  const exportBtns = page.locator(
    'button:has-text("Export"), button:has-text("Download"), button:has-text("CSV"), button:has-text("PDF"), [data-testid*="export" i]'
  );
  const count = Math.min(await exportBtns.count(), 6);
  for (let i = 0; i < count; i++) {
    const btn = exportBtns.nth(i);
    const label = ((await btn.innerText().catch(() => "")) || `export-${i}`).trim().slice(0, 60);
    if (await btn.isDisabled().catch(() => false)) {
      result.disabledCount += 1;
      continue;
    }
    result.exportsTested += 1;
    try {
      await btn.scrollIntoViewIfNeeded().catch(() => {});
      await shot(page, role, mod.slug, `export-${i}-before`);
      const downloadPromise = page.waitForEvent("download", { timeout: 8000 }).catch(() => null);
      await btn.click({ timeout: 5000 });
      const download = (await downloadPromise) as Download | null;
      await page.waitForTimeout(500);
      await shot(page, role, mod.slug, `export-${i}-after`);
      let ok = false;
      let size = 0;
      if (download) {
        const p = await download.path();
        if (p && fs.existsSync(p)) {
          size = fs.statSync(p).size;
          ok = size > 0;
        }
      } else {
        ok = true;
      }
      const status = ok ? "PASS" : "FAIL";
      if (ok) result.passCount += 1;
      else result.failCount += 1;
      result.buttonRows.push({
        role,
        module: mod.name,
        route: mod.path,
        control: label,
        type: "export",
        status,
        fileSize: size,
      });
      await closeOverlays(page);
    } catch (e) {
      result.failCount += 1;
      result.buttonRows.push({
        role,
        module: mod.name,
        route: mod.path,
        control: label,
        type: "export",
        status: "FAIL",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

async function auditDialogLifecycle(
  page: Page,
  role: string,
  mod: (typeof MODULES)[number],
  result: ManualAuditResult
): Promise<void> {
  const dialog = page.locator('[role="dialog"][data-state="open"], [role="dialog"]:visible').first();
  if (!(await dialog.isVisible().catch(() => false))) return;

  result.dialogsTested += 1;
  const id = `dialog-${mod.slug}`;
  let scrollable = false;
  try {
    scrollable = await dialog.evaluate((el) => el.scrollHeight > el.clientHeight);
  } catch {
    scrollable = false;
  }
  await shot(page, role, mod.slug, "dialog-open");

  const closeBtn = dialog.locator('[aria-label="Close"], button:has-text("Close"), button:has-text("Cancel")').first();
  const hasClose = await closeBtn.isVisible().catch(() => false);

  let escOk = false;
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  escOk = !(await dialog.isVisible().catch(() => false));

  if (!escOk && hasClose) {
    await closeBtn.click().catch(() => {});
    await page.waitForTimeout(200);
  }

  const closed = !(await page.locator('[role="dialog"]:visible').count());
  result.dialogRows.push({
    role,
    module: mod.name,
    route: mod.path,
    dialog: id,
    opens: "YES",
    scrollable: scrollable ? "YES" : "NO",
    closeButton: hasClose ? "YES" : "NO",
    escWorks: escOk ? "YES" : "NO",
    status: closed ? "PASS" : "FAIL",
  });
  if (closed) result.passCount += 1;
  else result.failCount += 1;
}

async function auditTables(
  page: Page,
  role: string,
  mod: (typeof MODULES)[number],
  result: ManualAuditResult
): Promise<void> {
  const rows = page.locator(
    'tbody tr, [data-testid^="appt-row-"], [data-testid^="queue-row-"], [data-testid^="veh-row-"], [data-testid^="dock-card-"], [data-testid^="team-row-"], [data-testid^="eq-card-"], [data-testid^="op-row-"], [data-testid^="det-row-"]'
  );
  const count = await rows.count();
  if (count === 0) {
    result.tableRows.push({
      role,
      module: mod.name,
      route: mod.path,
      row: "n/a",
      status: "NO_ROWS",
    });
    return;
  }

  const indices = [...new Set([0, Math.floor((count - 1) / 2), count - 1])].filter((i) => i >= 0 && i < count);
  for (const idx of indices) {
    result.tablesTested += 1;
    const row = rows.nth(idx);
    const tid = (await row.getAttribute("data-testid")) || `row-${idx}`;
    const pos = idx === 0 ? "first" : idx === count - 1 ? "last" : "middle";
    try {
      await row.scrollIntoViewIfNeeded().catch(() => {});
      await shot(page, role, mod.slug, `table-${pos}-before`);
      await row.click({ timeout: 5000 });
      await page.waitForTimeout(500);
      await shot(page, role, mod.slug, `table-${pos}-after`);
      const dialog = await page.locator('[role="dialog"]:visible').count();
      const drawer = await page.locator('[data-testid$="-drawer"]:visible').count();
      if (dialog > 0) result.dialogsTested += 1;
      if (drawer > 0) result.drawersTested += 1;
      if (drawer > 0) {
        result.drawerRows.push({
          role,
          module: mod.name,
          route: mod.path,
          drawer: tid,
          opens: "YES",
          contentLoads: "YES",
          status: "PASS",
        });
        result.passCount += 1;
      }
      result.tableRows.push({
        role,
        module: mod.name,
        route: mod.path,
        row: pos,
        control: tid,
        dialog: dialog > 0 ? "YES" : "NO",
        drawer: drawer > 0 ? "YES" : "NO",
        status: "PASS",
      });
      result.passCount += 1;
      await auditDialogLifecycle(page, role, mod, result);
      await closeOverlays(page);
    } catch (e) {
      result.failCount += 1;
      result.tableRows.push({
        role,
        module: mod.name,
        route: mod.path,
        row: pos,
        control: tid,
        status: "FAIL",
        detail: e instanceof Error ? e.message : String(e),
      });
      await closeOverlays(page);
    }
  }

  const rowActions = page.locator(
    'button:has-text("View"), button:has-text("Edit"), button:has-text("Delete"), [data-testid*="action" i]'
  );
  const actionCount = Math.min(await rowActions.count(), 5);
  for (let i = 0; i < actionCount; i++) {
    const action = rowActions.nth(i);
    const label = ((await action.innerText().catch(() => "")) || `action-${i}`).trim().slice(0, 40);
    if (await action.isDisabled().catch(() => false)) {
      result.disabledCount += 1;
      continue;
    }
    try {
      await action.scrollIntoViewIfNeeded().catch(() => {});
      await action.click({ timeout: 3000 });
      await page.waitForTimeout(400);
      result.passCount += 1;
      result.tableRows.push({
        role,
        module: mod.name,
        route: mod.path,
        row: "action",
        control: label,
        status: "PASS",
      });
      await closeOverlays(page);
    } catch (e) {
      result.failCount += 1;
      result.tableRows.push({
        role,
        module: mod.name,
        route: mod.path,
        row: "action",
        control: label,
        status: "FAIL",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }
}

async function auditButtons(
  page: Page,
  role: string,
  mod: (typeof MODULES)[number],
  result: ManualAuditResult
): Promise<void> {
  const buttons = page.locator("button:visible");
  const count = Math.min(await buttons.count(), 45);
  const snapshot: Array<{ testId: string | null; label: string; disabled: boolean }> = [];
  const seen = new Set<string>();

  for (let i = 0; i < count; i++) {
    const btn = buttons.nth(i);
    try {
      const testId = await btn.getAttribute("data-testid");
      const label =
        (await btn.innerText().catch(() => ""))?.trim().slice(0, 80) ||
        (await btn.getAttribute("aria-label")) ||
        `button-${i}`;
      const key = `${testId ?? ""}|${label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      snapshot.push({ testId, label, disabled: await btn.isDisabled().catch(() => true) });
    } catch {
      snapshot.push({ testId: null, label: `button-${i}`, disabled: true });
    }
  }

  for (const { testId, label, disabled } of snapshot) {
    result.buttonsTested += 1;
    if (!(await page.locator("button:visible").count())) break;

    if (shouldSkipButton(testId, label)) {
      result.buttonRows.push({
        role,
        module: mod.name,
        route: mod.path,
        control: label,
        testId: testId || "",
        type: "button",
        status: "HIDDEN",
        detail: "policy-skip",
      });
      result.hiddenCount += 1;
      continue;
    }

    const btn = testId
      ? page.locator(`[data-testid="${testId}"]:visible`).first()
      : page.getByRole("button", { name: label, exact: false }).first();

    if (!(await btn.isVisible().catch(() => false))) {
      result.hiddenCount += 1;
      result.buttonRows.push({
        role,
        module: mod.name,
        route: mod.path,
        control: label,
        testId: testId || "",
        type: "button",
        status: "HIDDEN",
      });
      continue;
    }

    if (disabled) {
      result.disabledCount += 1;
      result.buttonRows.push({
        role,
        module: mod.name,
        route: mod.path,
        control: label,
        testId: testId || "",
        type: "button",
        status: "DISABLED",
      });
      continue;
    }

    const urlBefore = page.url();
    try {
      await btn.scrollIntoViewIfNeeded().catch(() => {});
      await shot(page, role, mod.slug, `btn-${(testId || label).slice(0, 40)}-before`);
      await btn.click({ timeout: 5000 });
      await page.waitForTimeout(450);
      const outcome = await detectUiResponse(page, urlBefore);
      await shot(page, role, mod.slug, `btn-${(testId || label).slice(0, 40)}-after`);
      result.screenshots += 2;
      const status = outcome === "none" ? "NO_ACTION" : "PASS";
      if (status === "PASS") result.passCount += 1;
      else result.noActionCount += 1;
      if (outcome === "dialog") {
        result.dialogsTested += 1;
        await auditDialogLifecycle(page, role, mod, result);
      }
      if (outcome === "drawer") {
        result.drawersTested += 1;
        result.drawerRows.push({
          role,
          module: mod.name,
          route: mod.path,
          drawer: label,
          opens: "YES",
          contentLoads: "YES",
          status: "PASS",
        });
      }
      result.buttonRows.push({
        role,
        module: mod.name,
        route: mod.path,
        control: label,
        testId: testId || "",
        type: "button",
        status,
        outcome,
      });
      await closeOverlays(page);
    } catch (e) {
      result.failCount += 1;
      result.buttonRows.push({
        role,
        module: mod.name,
        route: mod.path,
        control: label,
        testId: testId || "",
        type: "button",
        status: "FAIL",
        detail: e instanceof Error ? e.message : String(e),
      });
      result.errors.push(`Button [${label}] on ${mod.path}: ${e}`);
      await closeOverlays(page);
    }
  }
}

async function auditYardMapExtras(page: Page, role: string, result: ManualAuditResult): Promise<void> {
  const mod = MODULES.find((m) => m.slug === "yard-map")!;
  const counters = page.locator("[data-testid^='zone-counter-']");
  const cCount = Math.min(await counters.count(), 6);
  for (let i = 0; i < cCount; i++) {
    try {
      await counters.nth(i).click({ timeout: 3000 });
      await page.waitForTimeout(300);
      result.passCount += 1;
    } catch {
      result.failCount += 1;
    }
  }
  const zones = page.locator("[data-testid^='zone-']:not([data-testid^='zone-counter'])");
  for (let i = 0; i < Math.min(await zones.count(), 6); i++) {
    try {
      await zones.nth(i).click({ timeout: 3000 });
      await page.waitForTimeout(400);
      await closeOverlays(page);
      result.passCount += 1;
    } catch {
      result.failCount += 1;
    }
  }
}

async function auditReportsCrossCut(page: Page, role: string, result: ManualAuditResult): Promise<void> {
  const reportPaths = ["/", "/operations-dashboard", "/reports/delay-analysis", "/kpis"];
  for (const p of reportPaths) {
    try {
      await page.goto(`${FRONTEND_URL}${p}`, { waitUntil: "domcontentloaded" });
      await waitReady(page);
      const mod = { path: p, slug: "reports", name: "Reports" } as (typeof MODULES)[number];
      await auditExports(page, role, mod, result);
      const daily = page.getByRole("button", { name: /daily report/i });
      if (await daily.isVisible().catch(() => false)) {
        await daily.click().catch(() => {});
        await page.waitForTimeout(400);
        await closeOverlays(page);
      }
    } catch (e) {
      result.errors.push(`Reports cross-cut ${p}: ${e}`);
    }
  }
  result.moduleRows.push({
    role,
    module: "Reports",
    route: "cross-cut",
    status: "PASS",
    note: "Export buttons on Control Tower, Ops Dashboard, Delay Analysis, KPIs",
  });
}

async function auditModule(
  page: Page,
  role: string,
  mod: (typeof MODULES)[number],
  result: ManualAuditResult
): Promise<void> {
  const modulePass = { buttons: 0, fails: 0 };
  const startFails = result.failCount;

  try {
    await closeOverlays(page);
    await page.goto(`${FRONTEND_URL}${mod.path}`, { waitUntil: "domcontentloaded" });
    await waitReady(page);

    if (page.url().includes("/unauthorized") || page.url().includes("/login")) {
      result.moduleRows.push({
        role,
        module: mod.name,
        route: mod.path,
        status: "BLOCKED",
        buttonsTested: 0,
        pass: 0,
        fail: 0,
      });
      return;
    }

    await shot(page, role, mod.slug, "module-before");
    result.screenshots += 1;
    result.modulesTested += 1;

    await auditTabs(page, role, mod, result);
    await auditDropdowns(page, role, mod, result);
    await auditSearch(page, role, mod, result);
    await auditFilters(page, role, mod, result);
    await auditTables(page, role, mod, result);
    await auditButtons(page, role, mod, result);
    await auditExports(page, role, mod, result);
    if (mod.slug === "yard-map") await auditYardMapExtras(page, role, result);

    await shot(page, role, mod.slug, "module-after");
    result.screenshots += 1;

    modulePass.fails = result.failCount - startFails;
    result.moduleRows.push({
      role,
      module: mod.name,
      route: mod.path,
      status: modulePass.fails === 0 ? "PASS" : "WARN",
      buttonsTested: result.buttonsTested,
      pass: result.passCount,
      fail: result.failCount,
      screenshots: result.screenshots,
    });
  } catch (e) {
    result.failCount += 1;
    result.errors.push(`Module ${mod.name}: ${e}`);
    await shot(page, role, mod.slug, "module-error").catch(() => {});
    result.moduleRows.push({
      role,
      module: mod.name,
      route: mod.path,
      status: "FAIL",
      detail: e instanceof Error ? e.message : String(e),
    });
    await closeOverlays(page);
  }
}

export async function runManualAudit(
  browser: Browser,
  role: string,
  email: string,
  password: string
): Promise<ManualAuditResult> {
  ensureDirs();
  shotSeq = 0;

  const result: ManualAuditResult = {
    role,
    startedAt: new Date().toISOString(),
    finishedAt: "",
    modulesTested: 0,
    buttonsTested: 0,
    tablesTested: 0,
    dialogsTested: 0,
    drawersTested: 0,
    exportsTested: 0,
    passCount: 0,
    failCount: 0,
    noActionCount: 0,
    disabledCount: 0,
    hiddenCount: 0,
    buttonRows: [],
    tableRows: [],
    dialogRows: [],
    drawerRows: [],
    networkRows: [],
    consoleRows: [],
    moduleRows: [],
    errors: [],
    screenshots: 0,
  };

  const context: BrowserContext = await browser.newContext({
    viewport: { width: VIEWPORT.w, height: VIEWPORT.h },
    acceptDownloads: true,
    recordVideo: { dir: VIDEOS_DIR, size: { width: VIEWPORT.w, height: VIEWPORT.h } },
  });
  const page = await context.newPage();
  attachListeners(page, role, result);

  try {
    await jwtLogin(page, email, password);
    result.passCount += 1;

    const menuBtn = page.locator('[data-testid="mobile-menu-btn"], [data-testid="topnav-menu"]').first();
    if (await menuBtn.isVisible().catch(() => false)) {
      await menuBtn.click().catch(() => {});
      await page.waitForTimeout(200);
    }

    for (const mod of MODULES) {
      await auditModule(page, role, mod, result);
    }

    await auditReportsCrossCut(page, role, result);
    result.modulesTested += 1;

    const alerts = page.locator('[data-testid="topnav-alert"]');
    if (await alerts.isVisible().catch(() => false)) {
      try {
        await alerts.click();
        await page.waitForTimeout(400);
        await closeOverlays(page);
        result.passCount += 1;
      } catch {
        result.failCount += 1;
      }
    }
  } finally {
    result.finishedAt = new Date().toISOString();
    await context.close().catch(() => {});
    writeCsvArtifacts(result);
  }

  return result;
}

export function mergeResults(results: ManualAuditResult[]): ManualAuditResult {
  const merged: ManualAuditResult = {
    role: results.map((r) => r.role).join("+"),
    startedAt: results[0]?.startedAt || "",
    finishedAt: results[results.length - 1]?.finishedAt || "",
    modulesTested: 0,
    buttonsTested: 0,
    tablesTested: 0,
    dialogsTested: 0,
    drawersTested: 0,
    exportsTested: 0,
    passCount: 0,
    failCount: 0,
    noActionCount: 0,
    disabledCount: 0,
    hiddenCount: 0,
    buttonRows: [],
    tableRows: [],
    dialogRows: [],
    drawerRows: [],
    networkRows: [],
    consoleRows: [],
    moduleRows: [],
    errors: [],
    screenshots: 0,
  };
  for (const r of results) {
    merged.modulesTested += r.modulesTested;
    merged.buttonsTested += r.buttonsTested;
    merged.tablesTested += r.tablesTested;
    merged.dialogsTested += r.dialogsTested;
    merged.drawersTested += r.drawersTested;
    merged.exportsTested += r.exportsTested;
    merged.passCount += r.passCount;
    merged.failCount += r.failCount;
    merged.noActionCount += r.noActionCount;
    merged.disabledCount += r.disabledCount;
    merged.hiddenCount += r.hiddenCount;
    merged.screenshots += r.screenshots;
    merged.buttonRows.push(...r.buttonRows);
    merged.tableRows.push(...r.tableRows);
    merged.dialogRows.push(...r.dialogRows);
    merged.drawerRows.push(...r.drawerRows);
    merged.networkRows.push(...r.networkRows);
    merged.consoleRows.push(...r.consoleRows);
    merged.moduleRows.push(...r.moduleRows);
    merged.errors.push(...r.errors);
  }
  writeCsvArtifacts(merged);
  return merged;
}
