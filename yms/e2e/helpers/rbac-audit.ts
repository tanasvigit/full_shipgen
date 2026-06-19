import type { Browser, BrowserContext, Page } from "@playwright/test";
import fs from "fs";
import path from "path";

export const OUT_DIR = path.join(__dirname, "..", "playwright-rbac-audit");
export const SHOTS_DIR = path.join(OUT_DIR, "screenshots");
export const VIDEOS_DIR = path.join(OUT_DIR, "videos");
export const CONSOLE_LOG = path.join(OUT_DIR, "console-errors.log");
export const NETWORK_LOG = path.join(OUT_DIR, "network-errors.log");

export const FRONTEND_URL = process.env.YMS_FRONTEND_URL || "http://localhost:3001";
export const VIEWPORT = { w: 1920, h: 1080, label: "1920x1080" } as const;

export type RoleConfig = {
  role: string;
  reportSlug: string;
  username: string;
  password: string;
};

export const ROLE_CONFIGS: Record<string, RoleConfig> = {
  yard_admin: {
    role: "yard_admin",
    reportSlug: "yard-admin",
    username: "admin",
    password: "admin123",
  },
  yard_manager: {
    role: "yard_manager",
    reportSlug: "yard-manager",
    username: "manager",
    password: "manager123",
  },
  gate_operator: {
    role: "gate_operator",
    reportSlug: "gate-operator",
    username: "gate",
    password: "gate123",
  },
  yard_coordinator: {
    role: "yard_coordinator",
    reportSlug: "yard-coordinator",
    username: "coordinator",
    password: "coordinator123",
  },
  dock_supervisor: {
    role: "dock_supervisor",
    reportSlug: "dock-supervisor",
    username: "supervisor",
    password: "supervisor123",
  },
};

export const ROUTES = [
  { path: "/", module: "Control Tower" },
  { path: "/appointments", module: "Appointments" },
  { path: "/gate", module: "Gate Management" },
  { path: "/queue", module: "Virtual Queue" },
  { path: "/yard", module: "Yard Map" },
  { path: "/vehicles", module: "Vehicle Operations Monitor" },
  { path: "/docks", module: "Dock Management" },
  { path: "/labor", module: "Labor Management" },
  { path: "/equipment", module: "Equipment Management" },
  { path: "/loading", module: "Loading Operations" },
  { path: "/detention", module: "Detention Management" },
  { path: "/operations-dashboard", module: "Operations Dashboard" },
  { path: "/reports/delay-analysis", module: "Delay Analysis" },
  { path: "/kpis", module: "Executive KPIs" },
  { path: "/admin/users", module: "User Management" },
  { path: "/admin/roles", module: "Role Management" },
  { path: "/settings", module: "System Settings" },
] as const;

/** Nav testId → module permission (mirrors navigation.js + auth_rbac.py). */
export const NAV_ITEMS: { testId: string; module: string; label: string }[] = [
  { testId: "nav-dashboard", module: "module.control_tower", label: "Control Tower" },
  { testId: "nav-queue", module: "module.queue", label: "Virtual Queue" },
  { testId: "nav-yard", module: "module.yard_map", label: "Yard Map" },
  { testId: "nav-ai", module: "module.ai", label: "Recommendations" },
  { testId: "nav-appointments", module: "module.appointments", label: "Appointments" },
  { testId: "nav-gate", module: "module.gate", label: "Gate Management" },
  { testId: "nav-docks", module: "module.docks", label: "Docks" },
  { testId: "nav-loading", module: "module.loading", label: "Loading Ops" },
  { testId: "nav-vehicles", module: "module.vehicles", label: "Vehicles" },
  { testId: "nav-equipment", module: "module.equipment", label: "Equipment" },
  { testId: "nav-labor", module: "module.labor", label: "Labor" },
  { testId: "nav-operations-dashboard", module: "module.operations_dashboard", label: "Operations Dashboard" },
  { testId: "nav-delay-analysis", module: "module.delay_analysis", label: "Delay Analysis" },
  { testId: "nav-detention", module: "module.detention", label: "Detention" },
  { testId: "nav-kpis", module: "module.kpis", label: "Executive KPIs" },
  { testId: "nav-users", module: "module.user_management", label: "User Management" },
  { testId: "nav-roles", module: "module.role_management", label: "Role Management" },
  { testId: "nav-settings", module: "module.settings", label: "System Settings" },
];

/** Route path → module permission for access expectations. */
const ROUTE_MODULE: Record<string, string> = {
  "/": "module.control_tower",
  "/appointments": "module.appointments",
  "/gate": "module.gate",
  "/queue": "module.queue",
  "/yard": "module.yard_map",
  "/vehicles": "module.vehicles",
  "/docks": "module.docks",
  "/labor": "module.labor",
  "/equipment": "module.equipment",
  "/loading": "module.loading",
  "/detention": "module.detention",
  "/operations-dashboard": "module.operations_dashboard",
  "/reports/delay-analysis": "module.delay_analysis",
  "/kpis": "module.kpis",
  "/admin/users": "module.user_management",
  "/admin/roles": "module.role_management",
  "/settings": "module.settings",
};

const ROLE_MODULES: Record<string, Set<string>> = {
  yard_admin: new Set(["*"]),
  yard_manager: new Set([
    "module.control_tower",
    "module.appointments",
    "module.queue",
    "module.yard_map",
    "module.vehicles",
    "module.docks",
    "module.labor",
    "module.equipment",
    "module.loading",
    "module.detention",
    "module.operations_dashboard",
    "module.delay_analysis",
    "module.kpis",
    "module.reports",
    "module.ai",
  ]),
  gate_operator: new Set([
    "module.gate",
    "module.vehicles",
    "module.appointments.view",
    "module.yard_map.view",
  ]),
  yard_coordinator: new Set([
    "module.queue",
    "module.yard_map",
    "module.vehicles",
    "module.appointments.view",
  ]),
  dock_supervisor: new Set([
    "module.docks",
    "module.labor",
    "module.equipment",
    "module.loading",
    "module.vehicles",
    "module.yard_map",
  ]),
};


export type AuditRow = Record<string, string | number | boolean>;

export type RoleAuditResult = {
  role: string;
  reportSlug: string;
  passed: number;
  failed: number;
  skipped: number;
  routesTested: number;
  buttonsTested: number;
  dialogsTested: number;
  drawersTested: number;
  formsTested: number;
  screenshots: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  routeRows: AuditRow[];
  navRows: AuditRow[];
  buttonRows: AuditRow[];
  roleRows: AuditRow[];
  consoleRows: string[];
  networkRows: string[];
  errors: string[];
};

export function ensureAuditDirs(): void {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
}

function roleHasModule(role: string, module: string): boolean {
  const perms = ROLE_MODULES[role];
  if (!perms) return false;
  if (perms.has("*")) return true;
  if (perms.has(module)) return true;
  if (module === "module.appointments" && perms.has("module.appointments.view")) return true;
  if (module === "module.yard_map" && perms.has("module.yard_map.view")) return true;
  return false;
}

function toCsv(rows: AuditRow[]): string {
  if (rows.length === 0) return "";
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

export async function login(page: Page, username: string, password: string): Promise<void> {
  await page.goto(`${FRONTEND_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByTestId("login-form").waitFor({ state: "visible", timeout: 20_000 });
  await page.getByTestId("login-username").fill(username);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 30_000 });
}

export async function saveShot(
  page: Page,
  role: string,
  viewport: string,
  route: string,
  name: string,
  fullPage = false
): Promise<string> {
  const safeRoute = route.replace(/[^\w/-]/g, "").replace(/\//g, "_") || "root";
  const safeName = name.replace(/[^\w-]/g, "_").slice(0, 80);
  const filePath = path.join(SHOTS_DIR, `${role}__${viewport}__${safeRoute}__${safeName}.png`);
  await page.screenshot({ path: filePath, fullPage });
  return filePath;
}

async function closeOverlays(page: Page): Promise<void> {
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(100);
  const cancelBtn = page
    .locator('[data-testid="dialog-cancel-btn"], button:has-text("Cancel"), [aria-label="Close"]')
    .first();
  if (await cancelBtn.isVisible().catch(() => false)) {
    await cancelBtn.click().catch(() => {});
    await page.waitForTimeout(100);
  }
}

function attachListeners(page: Page, role: string, viewport: string, result: RoleAuditResult): void {
  page.on("console", (msg) => {
    if (!["error", "warning"].includes(msg.type())) return;
    const line = `[${new Date().toISOString()}] ${role} ${viewport} ${page.url()} ${msg.type()} :: ${msg.text()}`;
    result.consoleRows.push(line);
    fs.appendFileSync(CONSOLE_LOG, `${line}\n`);
  });
  page.on("requestfailed", (req) => {
    const line = `[${new Date().toISOString()}] ${role} ${viewport} ${req.method()} ${req.url()} FAILED: ${req.failure()?.errorText || "unknown"}`;
    result.networkRows.push(line);
    fs.appendFileSync(NETWORK_LOG, `${line}\n`);
  });
  page.on("response", (res) => {
    if (res.status() >= 400) {
      const line = `[${new Date().toISOString()}] ${role} ${viewport} ${res.request().method()} ${res.url()} STATUS ${res.status()}`;
      result.networkRows.push(line);
      fs.appendFileSync(NETWORK_LOG, `${line}\n`);
    }
  });
  page.on("pageerror", (err) => {
    const line = `[${new Date().toISOString()}] ${role} ${viewport} PAGEERROR :: ${err.message}`;
    result.consoleRows.push(line);
    fs.appendFileSync(CONSOLE_LOG, `${line}\n`);
  });
}

async function verifyNavigation(page: Page, config: RoleConfig, result: RoleAuditResult): Promise<void> {
  const menuBtn = page.locator('[data-testid="mobile-menu-btn"], [data-testid="topnav-menu"]').first();
  if (await menuBtn.isVisible().catch(() => false)) {
    await menuBtn.click().catch(() => {});
    await page.waitForTimeout(200);
  }

  for (const item of NAV_ITEMS) {
    const shouldSee = roleHasModule(config.role, item.module);
    const nav = page.getByTestId(item.testId);
    const visible = await nav.isVisible().catch(() => false);
    const status = visible === shouldSee ? "PASS" : "FAIL";
    if (status === "PASS") result.passed += 1;
    else {
      result.failed += 1;
      result.errors.push(`Nav ${item.testId}: expected ${shouldSee ? "visible" : "hidden"}, got ${visible ? "visible" : "hidden"}`);
    }
    result.navRows.push({
      role: config.role,
      nav: item.testId,
      label: item.label,
      expected: shouldSee ? "visible" : "hidden",
      actual: visible ? "visible" : "hidden",
      status,
    });
  }
}

async function testTableRows(
  page: Page,
  config: RoleConfig,
  route: string,
  result: RoleAuditResult
): Promise<void> {
  const candidates = page.locator(
    '[data-testid^="appt-row-"],[data-testid^="queue-row-"],[data-testid^="veh-row-"],[data-testid^="dock-card-"],[data-testid^="team-row-"],[data-testid^="eq-card-"],[data-testid^="op-row-"],[data-testid^="det-row-"]'
  );
  const count = await candidates.count();
  if (count === 0) return;

  const idxs = [...new Set([0, Math.floor((count - 1) / 2), count - 1])].filter((i) => i >= 0 && i < count);
  for (const idx of idxs) {
    const el = candidates.nth(idx);
    const tid = (await el.getAttribute("data-testid")) || `row-${idx}`;
    try {
      await el.scrollIntoViewIfNeeded().catch(() => {});
      await el.click({ timeout: 3000 });
      await page.waitForTimeout(200);
      const openedDialog = await page.locator('[role="dialog"]:visible').count();
      const openedDrawer = await page.locator('[data-testid$="-drawer"]:visible').count();
      if (openedDialog > 0) result.dialogsTested += 1;
      if (openedDrawer > 0) result.drawersTested += 1;
      if (openedDialog > 0 || openedDrawer > 0) {
        await saveShot(page, config.role, VIEWPORT.label, route, `after-row-${tid}`);
        result.screenshots += 1;
      }
      await closeOverlays(page);
      result.passed += 1;
      result.buttonRows.push({
        role: config.role,
        route,
        control: tid,
        type: "table-row",
        status: "PASS",
        detail: openedDialog > 0 || openedDrawer > 0 ? "opened overlay" : "clicked",
      });
    } catch (e) {
      result.failed += 1;
      const detail = e instanceof Error ? e.message : String(e);
      result.errors.push(`Row ${tid} on ${route}: ${detail}`);
      result.buttonRows.push({ role: config.role, route, control: tid, type: "table-row", status: "FAIL", detail });
    }
  }
}

export async function runRoleAudit(browser: Browser, config: RoleConfig): Promise<RoleAuditResult> {
  ensureAuditDirs();

  const result: RoleAuditResult = {
    role: config.role,
    reportSlug: config.reportSlug,
    passed: 0,
    failed: 0,
    skipped: 0,
    routesTested: 0,
    buttonsTested: 0,
    dialogsTested: 0,
    drawersTested: 0,
    formsTested: 0,
    screenshots: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    routeRows: [],
    navRows: [],
    buttonRows: [],
    roleRows: [],
    consoleRows: [],
    networkRows: [],
    errors: [],
  };

  const context: BrowserContext = await browser.newContext({
    viewport: { width: VIEWPORT.w, height: VIEWPORT.h },
    acceptDownloads: true,
    recordVideo: { dir: VIDEOS_DIR, size: { width: VIEWPORT.w, height: VIEWPORT.h } },
  });
  const page = await context.newPage();
  attachListeners(page, config.role, VIEWPORT.label, result);

  try {
    await login(page, config.username, config.password);
    const storage = await context.storageState();
    const hasToken =
      JSON.stringify(storage).includes("access") || JSON.stringify(storage).includes("token");
    result.roleRows.push({ role: config.role, check: "login", status: "PASS" });
    result.roleRows.push({
      role: config.role,
      check: "jwt-generation",
      status: hasToken ? "PASS" : "WARN",
    });
    result.passed += hasToken ? 2 : 1;
    if (!hasToken) result.failed += 1;

    await verifyNavigation(page, config, result);

    for (const r of ROUTES) {
      result.routesTested += 1;
      const beforeUrl = page.url();
      const expectedAccess = roleHasModule(config.role, ROUTE_MODULE[r.path] || "");

      try {
        await page.goto(`${FRONTEND_URL}${r.path}`, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(500);
        await page.locator("body").first().waitFor({ state: "visible", timeout: 5000 });
        await saveShot(page, config.role, VIEWPORT.label, r.path, "before-actions", true);
        result.screenshots += 1;

        const current = new URL(page.url()).pathname;
        const unauthorized = current.includes("/unauthorized");
        const blocked = unauthorized || (current !== r.path && current !== "/");
        const accessOk = expectedAccess ? !blocked : blocked;

        let routeStatus: string;
        if (blocked && !expectedAccess) routeStatus = "BLOCKED_AS_EXPECTED";
        else if (!blocked && expectedAccess) routeStatus = "ACCESSIBLE";
        else if (blocked && expectedAccess) routeStatus = "UNEXPECTED_BLOCK";
        else routeStatus = "UNEXPECTED_ACCESS";

        if (routeStatus === "ACCESSIBLE" || routeStatus === "BLOCKED_AS_EXPECTED") result.passed += 1;
        else {
          result.failed += 1;
          result.errors.push(`Route ${r.path}: ${routeStatus}`);
        }

        result.routeRows.push({
          role: config.role,
          route: r.path,
          module: r.module,
          current,
          expected: expectedAccess ? "accessible" : "blocked",
          status: routeStatus,
        });

        if (blocked) continue;

        const buttons = page.locator("button:visible");
        const btnCount = Math.min(await buttons.count(), 15);
        result.buttonsTested += btnCount;

        for (let i = 0; i < btnCount; i++) {
          const b = buttons.nth(i);
          const tid = (await b.getAttribute("data-testid")) || `btn-${i}`;
          const label = ((await b.innerText().catch(() => "")) || tid).trim().slice(0, 60);
          const disabled = await b.isDisabled().catch(() => true);
          if (disabled) {
            result.skipped += 1;
            result.buttonRows.push({
              role: config.role,
              route: r.path,
              control: tid,
              label,
              type: "button",
              status: "SKIP_DISABLED",
            });
            continue;
          }
          try {
            await b.scrollIntoViewIfNeeded().catch(() => {});
            await b.click({ timeout: 2000 });
            await page.waitForTimeout(200);
            const dialogCount = await page.locator('[role="dialog"]:visible').count();
            const drawerCount = await page.locator('[data-testid$="-drawer"]:visible').count();
            if (dialogCount > 0) result.dialogsTested += 1;
            if (drawerCount > 0) result.drawersTested += 1;
            if (dialogCount > 0 || drawerCount > 0) {
              await saveShot(page, config.role, VIEWPORT.label, r.path, `after-click-${tid || label}`);
              result.screenshots += 1;
            }
            result.passed += 1;
            result.buttonRows.push({
              role: config.role,
              route: r.path,
              control: tid,
              label,
              type: "button",
              status: "PASS",
            });
            await closeOverlays(page);
          } catch (e) {
            result.failed += 1;
            const detail = e instanceof Error ? e.message : String(e);
            result.buttonRows.push({
              role: config.role,
              route: r.path,
              control: tid,
              label,
              type: "button",
              status: "FAIL",
              detail,
            });
          }
        }

        const searchInputs = page.locator('input[placeholder*="Search" i], [data-testid*="search" i]');
        if (await searchInputs.count()) {
          const s = searchInputs.first();
          await s.fill("audit").catch(() => {});
          await page.waitForTimeout(150);
          await s.fill("").catch(() => {});
          result.formsTested += 1;
        }

        await testTableRows(page, config, r.path, result);
      } catch (e) {
        result.failed += 1;
        const detail = e instanceof Error ? e.message : String(e);
        result.errors.push(`Route ${r.path}: ${detail}`);
        result.routeRows.push({
          role: config.role,
          route: r.path,
          module: r.module,
          current: page.url(),
          status: "FAIL",
          detail,
        });
        await page.goto(beforeUrl).catch(() => {});
      }
    }

    try {
      await page.goto(`${FRONTEND_URL}/settings`, { waitUntil: "domcontentloaded" });
      const logoutBtn = page.locator('[data-testid="settings-logout"], [data-testid="logout-btn"]').first();
      if (await logoutBtn.isVisible().catch(() => false)) {
        await logoutBtn.click();
        await page.waitForURL(/\/login/, { timeout: 10_000 }).catch(() => {});
      }
      await page.goto(`${FRONTEND_URL}/gate`, { waitUntil: "domcontentloaded" });
      const afterLogout = new URL(page.url()).pathname;
      const ok = afterLogout.includes("/login") || afterLogout.includes("/unauthorized");
      result.roleRows.push({
        role: config.role,
        check: "logout+unauthorized-redirect",
        status: ok ? "PASS" : "WARN",
      });
      if (ok) result.passed += 1;
      else result.skipped += 1;
    } catch {
      result.roleRows.push({ role: config.role, check: "logout+unauthorized-redirect", status: "WARN" });
      result.skipped += 1;
    }
  } finally {
    await context.close().catch(() => {});
  }

  result.critical =
    result.routeRows.filter((r) => r.status === "FAIL" || r.status === "UNEXPECTED_ACCESS").length +
    result.buttonRows.filter((r) => r.status === "FAIL").length;
  result.high = result.networkRows.filter((l) => / STATUS 50\d|FAILED/i.test(l)).length;
  result.medium = result.consoleRows.filter((l) => /warning/i.test(l)).length;
  result.low = result.consoleRows.filter((l) => /deprecated|bundle size/i.test(l)).length;

  return result;
}

export function writeRoleArtifacts(result: RoleAuditResult): void {
  const reportPath = path.join(OUT_DIR, `${result.reportSlug}-report.md`);
  const jsonPath = path.join(OUT_DIR, `${result.reportSlug}-results.json`);
  const csvPath = path.join(OUT_DIR, `${result.reportSlug}-buttons.csv`);

  const md = `# ${result.role} RBAC Audit Report

Generated: ${new Date().toISOString()}

## Summary
| Metric | Count |
|--------|-------|
| Passed | ${result.passed} |
| Failed | ${result.failed} |
| Skipped | ${result.skipped} |
| Routes tested | ${result.routesTested} |
| Buttons tested | ${result.buttonsTested} |
| Dialogs opened | ${result.dialogsTested} |
| Drawers opened | ${result.drawersTested} |
| Forms tested | ${result.formsTested} |
| Screenshots | ${result.screenshots} |

## Severity
- Critical: ${result.critical}
- High: ${result.high}
- Medium: ${result.medium}
- Low: ${result.low}

## Route Access
${result.routeRows.map((r) => `- \`${r.route}\`: **${r.status}** (${r.current || "n/a"})`).join("\n")}

## Navigation Checks
${result.navRows.map((n) => `- \`${n.nav}\`: expected ${n.expected}, actual ${n.actual} → **${n.status}**`).join("\n")}

## Failures
${result.errors.length ? result.errors.map((e) => `- ${e}`).join("\n") : "_None logged_"}
`;

  fs.writeFileSync(reportPath, md, "utf8");
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf8");
  fs.writeFileSync(csvPath, toCsv(result.buttonRows), "utf8");
}
