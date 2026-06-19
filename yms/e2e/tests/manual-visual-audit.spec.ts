/**
 * HUMAN-VISIBLE Playwright QA audit
 *
 * Watch the browser: navigation, clicks, dialogs, drawers, exports.
 *
 * Run (headed — required):
 *   npx playwright test tests/manual-visual-audit.spec.ts --headed
 *
 * Or with dedicated config (headless: false, slowMo, video on):
 *   npx playwright test -c playwright.manual-visual-audit.config.ts
 *
 *   npm run manual-visual-audit
 */
import { test, expect, type Page, type Locator } from "@playwright/test";
import fs from "fs";
import path from "path";
import { VISUAL_AUDIT_PATHS } from "../playwright.manual-visual-audit.config";

const SHOTS = VISUAL_AUDIT_PATHS.screenshots;
const PAUSE_MS = 1500;
const HOLD_OPEN_MS = 30_000;

const NAV_SECTION: Record<string, string> = {
  "nav-dashboard": "control",
  "nav-queue": "control",
  "nav-yard": "control",
  "nav-ai": "control",
  "nav-appointments": "operations",
  "nav-gate": "operations",
  "nav-docks": "operations",
  "nav-loading": "operations",
  "nav-vehicles": "resources",
  "nav-equipment": "resources",
  "nav-labor": "resources",
  "nav-operations-dashboard": "reports",
  "nav-delay-analysis": "reports",
  "nav-detention": "reports",
  "nav-kpis": "reports",
  "nav-users": "administration",
  "nav-roles": "administration",
  "nav-settings": "administration",
};

const NAV_ROUTES: Record<string, string> = {
  "nav-dashboard": "/",
  "nav-queue": "/queue",
  "nav-yard": "/yard",
  "nav-ai": "/ai",
  "nav-appointments": "/appointments",
  "nav-gate": "/gate",
  "nav-docks": "/docks",
  "nav-loading": "/loading",
  "nav-vehicles": "/vehicles",
  "nav-equipment": "/equipment",
  "nav-labor": "/labor",
  "nav-operations-dashboard": "/operations-dashboard",
  "nav-delay-analysis": "/reports/delay-analysis",
  "nav-detention": "/detention",
  "nav-kpis": "/kpis",
  "nav-users": "/admin/users",
  "nav-roles": "/admin/roles",
  "nav-settings": "/settings",
};

let shotSeq = 0;

test.describe.configure({ mode: "serial" });
test.setTimeout(3_600_000);

test.use({
  headless: false,
  video: "on",
  screenshot: "on",
  trace: "retain-on-failure",
  viewport: { width: 1920, height: 1080 },
  launchOptions: {
    slowMo: 1000,
    args: ["--start-maximized"],
  },
});

test.beforeAll(() => {
  fs.mkdirSync(SHOTS, { recursive: true });
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  YARD.OS — HUMAN-VISIBLE VISUAL QA AUDIT");
  console.log("  Browser: headed · slowMo 1000ms · video ON");
  console.log("  Screenshots:", SHOTS);
  console.log("══════════════════════════════════════════════════════════\n");
});

async function pause(page: Page, ms = PAUSE_MS) {
  await page.waitForTimeout(ms);
}

async function announce(step: string) {
  console.log(`\n▶ ${step}`);
}

async function snap(page: Page, label: string, fullPage = true) {
  shotSeq += 1;
  const safe = label.replace(/[^\w.-]+/g, "_").slice(0, 80);
  const file = path.join(SHOTS, `${String(shotSeq).padStart(4, "0")}__${safe}.png`);
  await page.screenshot({ path: file, fullPage });
  console.log(`  📸 ${path.basename(file)}`);
}

async function scrollNaturally(page: Page) {
  const steps = 4;
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((step) => {
      const max = document.body.scrollHeight;
      window.scrollTo({ top: (max * step) / 4, behavior: "smooth" });
    }, i);
    await pause(page, 1200);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await pause(page, 800);
}

async function closeOverlays(page: Page) {
  await page.keyboard.press("Escape");
  await pause(page, 600);
  const cancel = page.locator('[data-testid="dialog-cancel-btn"], button:has-text("Cancel")').first();
  if (await cancel.isVisible().catch(() => false)) {
    await cancel.click().catch(() => {});
    await pause(page, 600);
  }
}

async function safeClick(locator: Locator, label: string) {
  if (!(await locator.isVisible().catch(() => false))) return false;
  if (!(await locator.isEnabled().catch(() => false))) return false;
  console.log(`  🖱 click: ${label}`);
  await locator.click();
  return true;
}

async function loginAsAdmin(page: Page) {
  await announce("Login — yard_admin");
  await page.goto("/login");
  await pause(page);
  await snap(page, "login-page");
  await page.getByTestId("login-username").fill("admin");
  await pause(page, 800);
  await page.getByTestId("login-password").fill("admin123");
  await pause(page, 800);
  await page.getByTestId("login-submit").click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 45_000 });
  await pause(page);
  await snap(page, "post-login-home");
}

async function goNav(page: Page, testId: string, label: string) {
  await announce(`Navigate → ${label}`);
  await page.keyboard.press("Escape");
  await pause(page, 400);

  const section = NAV_SECTION[testId];
  if (section) {
    await safeClick(page.getByTestId(`menu-${section}`), `Open ${section} menu`);
    await pause(page);
  }

  const link = page.getByTestId(testId).first();
  if (await link.isVisible().catch(() => false)) {
    await safeClick(link, label);
  } else {
    console.log(`  ↪ fallback goto ${NAV_ROUTES[testId]}`);
    await page.goto(NAV_ROUTES[testId] || "/");
  }

  await page.waitForLoadState("networkidle").catch(() => {});
  await pause(page);
  await expect(page.getByTestId("topnav")).toBeVisible();
  await snap(page, `module-${testId}`);
}

async function tryExportDropdown(page: Page, testIdPrefix: string) {
  const trigger = page.getByTestId(`${testIdPrefix}-trigger`);
  if (await safeClick(trigger, `Export menu (${testIdPrefix})`)) {
    await pause(page);
    await snap(page, `export-menu-${testIdPrefix}`);
    await page.keyboard.press("Escape");
    await pause(page, 600);
  }
}

async function openFirstDrawer(page: Page, selectors: string[], drawerTestId: string, label: string) {
  for (const sel of selectors) {
    const btn = page.locator(sel).first();
    if (await safeClick(btn, label)) {
      await pause(page);
      const drawer = page.getByTestId(drawerTestId);
      if (await drawer.isVisible().catch(() => false)) {
        await snap(page, `drawer-${drawerTestId}`);
        await scrollNaturally(page);
        await closeOverlays(page);
        return true;
      }
    }
  }
  return false;
}

async function auditControlTower(page: Page) {
  await goNav(page, "nav-dashboard", "Control Tower");
  await scrollNaturally(page);
  await safeClick(page.getByTestId("dashboard-refresh"), "Refresh dashboard");
  await pause(page);
  if (await safeClick(page.getByTestId("daily-report-btn"), "Daily report export")) {
    await pause(page);
    const dlg = page.getByTestId("daily-report-dialog");
    if (await dlg.isVisible().catch(() => false)) {
      await snap(page, "dialog-daily-report");
      await safeClick(page.getByTestId("daily-report-cancel"), "Cancel daily report");
      await pause(page);
    }
  }
  await safeClick(page.getByTestId("event-feed-toggle"), "Event feed toggle");
  await pause(page);
  const alertRow = page.locator('[data-testid^="alert-row-"]').first();
  await safeClick(alertRow, "Alert row");
  await pause(page);
  await closeOverlays(page);
}

async function auditAppointments(page: Page) {
  await goNav(page, "nav-appointments", "Appointments");
  await scrollNaturally(page);
  for (const f of ["all", "loading", "unloading"]) {
    const tab = page.getByTestId(`filter-${f}`);
    await safeClick(tab, `Filter ${f}`);
    await pause(page);
  }
  await tryExportDropdown(page, "export");
  if (await safeClick(page.getByTestId("book-appointment-btn"), "Book appointment")) {
    await pause(page);
    const dlg = page.getByRole("dialog", { name: /book appointment/i });
    if (await dlg.isVisible().catch(() => false)) {
      await snap(page, "dialog-book-slot");
      await safeClick(page.getByTestId("dialog-next-btn"), "Book dialog next");
      await pause(page);
      await snap(page, "dialog-book-slot-step2");
      await closeOverlays(page);
    }
  }
  const apptRow = page.locator('[data-testid^="appt-row-"]').first();
  if (await safeClick(apptRow, "Appointment row")) {
    await pause(page);
    if (await page.getByTestId("appointment-drawer").isVisible().catch(() => false)) {
      await snap(page, "drawer-appointment");
      await scrollNaturally(page);
      await closeOverlays(page);
    }
  }
}

async function auditGate(page: Page) {
  await goNav(page, "nav-gate", "Gate Management");
  await scrollNaturally(page);
  await safeClick(page.getByTestId("gate-refresh"), "Gate refresh");
  await pause(page);
  const row = page.locator("tbody tr").first();
  await safeClick(row, "Gate activity row");
  await pause(page);
  if (await page.getByTestId("vehicle-drawer").isVisible().catch(() => false)) {
    await snap(page, "drawer-vehicle-gate");
    await closeOverlays(page);
  }
}

async function auditQueue(page: Page) {
  await goNav(page, "nav-queue", "Virtual Queue");
  await scrollNaturally(page);
  await tryExportDropdown(page, "export");
  const row = page.locator('[data-testid^="queue-row-"]').first();
  if (await safeClick(row, "Queue row")) {
    await pause(page);
  }
}

async function auditYardMap(page: Page) {
  await goNav(page, "nav-yard", "Yard Map");
  await scrollNaturally(page);
  const counter = page.locator('[data-testid^="zone-counter-"]').first();
  await safeClick(counter, "Zone counter filter");
  await pause(page);
  const zone = page.locator('[data-testid^="zone-"]').first();
  await safeClick(zone, "Zone tile");
  await pause(page);
  const dockCard = page.locator('[data-testid^="bay-"], [data-testid^="dock-card-"]').first();
  if (await safeClick(dockCard, "Dock bay")) {
    await pause(page);
    if (await page.getByTestId("dock-drawer").isVisible().catch(() => false)) {
      await snap(page, "drawer-dock-yard");
      await closeOverlays(page);
    }
  }
}

async function auditDocks(page: Page) {
  await goNav(page, "nav-docks", "Dock Management");
  await scrollNaturally(page);
  for (const f of ["all", "available", "occupied"]) {
    await safeClick(page.getByTestId(`dock-filter-${f}`), `Dock filter ${f}`);
    await pause(page);
  }
  await openFirstDrawer(page, ['[data-testid^="dock-card-"]', '[data-testid^="bay-"]'], "dock-drawer", "Dock card");
  if (await safeClick(page.getByTestId("create-dock-btn"), "Create dock")) {
    await pause(page);
    const dlg = page.getByTestId("create-dock-dialog");
    if (await dlg.isVisible().catch(() => false)) {
      await snap(page, "dialog-create-dock");
      await closeOverlays(page);
    }
  }
}

async function auditVehicles(page: Page) {
  await goNav(page, "nav-vehicles", "Vehicles");
  await scrollNaturally(page);
  await tryExportDropdown(page, "export");
  const statusFilter = page.locator('[data-testid^="veh-filter-"]').first();
  await safeClick(statusFilter, "Vehicle filter");
  await pause(page);
  const row = page.locator('[data-testid^="veh-row-"]').first();
  if (await safeClick(row, "Vehicle row")) {
    await pause(page);
    if (await page.getByTestId("vehicle-drawer").isVisible().catch(() => false)) {
      await snap(page, "drawer-vehicle");
      await closeOverlays(page);
    }
  }
}

async function auditLoading(page: Page) {
  await goNav(page, "nav-loading", "Loading Ops");
  await scrollNaturally(page);
  await openFirstDrawer(page, ['[data-testid^="op-row-"]'], "loading-op-drawer", "Loading op row");
}

async function auditEquipment(page: Page) {
  await goNav(page, "nav-equipment", "Equipment");
  await scrollNaturally(page);
  await safeClick(page.locator('[data-testid^="eq-filter-"]').first(), "Equipment status filter");
  await pause(page);
  await openFirstDrawer(page, ['[data-testid^="eq-view-"]', '[data-testid^="eq-card-"]'], "equipment-drawer", "Equipment view");
  if (await safeClick(page.getByTestId("add-equipment-btn"), "Add equipment")) {
    await pause(page);
    await closeOverlays(page);
  }
}

async function auditLabor(page: Page) {
  await goNav(page, "nav-labor", "Labor");
  await scrollNaturally(page);
  await openFirstDrawer(page, ['[data-testid^="team-view-"]', '[data-testid^="team-row-"]'], "labor-drawer", "Labor team view");
  if (await safeClick(page.getByTestId("create-team-btn"), "Create team")) {
    await pause(page);
    await closeOverlays(page);
  }
}

async function auditDetention(page: Page) {
  await goNav(page, "nav-detention", "Detention");
  await scrollNaturally(page);
  await tryExportDropdown(page, "export");
  const row = page.locator('[data-testid^="det-row-"]').first();
  if (await safeClick(row, "Detention row")) {
    await pause(page);
    if (await page.getByTestId("detention-drawer").isVisible().catch(() => false)) {
      await snap(page, "drawer-detention");
      await closeOverlays(page);
    }
  }
}

async function auditAi(page: Page) {
  await goNav(page, "nav-ai", "AI Recommendations");
  await scrollNaturally(page);
  await expect(page.getByTestId("ai-hero-banner")).toBeVisible();
}

async function auditKpis(page: Page) {
  await goNav(page, "nav-kpis", "Executive KPIs");
  await scrollNaturally(page);
  await safeClick(page.getByTestId("kpi-refresh"), "KPI refresh");
  await pause(page);
  await tryExportDropdown(page, "export");
}

async function auditOpsDashboard(page: Page) {
  await goNav(page, "nav-operations-dashboard", "Operations Dashboard");
  await scrollNaturally(page);
}

async function auditDelayAnalysis(page: Page) {
  await goNav(page, "nav-delay-analysis", "Delay Analysis");
  await scrollNaturally(page);
  await tryExportDropdown(page, "report-export");
}

async function auditUsers(page: Page) {
  await goNav(page, "nav-users", "User Management");
  await scrollNaturally(page);
  if (await safeClick(page.getByTestId("add-user-btn"), "Add user")) {
    await pause(page);
    await closeOverlays(page);
  }
}

async function auditRoles(page: Page) {
  await goNav(page, "nav-roles", "Role Management");
  await scrollNaturally(page);
}

async function auditSettings(page: Page) {
  await goNav(page, "nav-settings", "System Settings");
  await scrollNaturally(page);
  const roleSelect = page.getByTestId("impersonate-role-select");
  if (await roleSelect.isVisible().catch(() => false)) {
    await roleSelect.click();
    await pause(page);
    await snap(page, "settings-impersonate-dropdown");
    await page.keyboard.press("Escape");
  }
}

async function auditTopNavMenus(page: Page) {
  await announce("Top navigation — section menus");
  await page.goto("/");
  await pause(page);
  for (const section of ["control", "operations", "resources", "reports", "administration"]) {
    const menu = page.getByTestId(`menu-${section}`);
    if (await safeClick(menu, `Menu ${section}`)) {
      await pause(page);
      await snap(page, `topnav-menu-${section}`);
      await page.keyboard.press("Escape");
      await pause(page, 600);
    }
  }
  await safeClick(page.getByTestId("topnav-notif"), "Notifications");
  await pause(page);
  await safeClick(page.getByTestId("topnav-user"), "User menu");
  await pause(page);
  await snap(page, "topnav-user-menu");
  await page.keyboard.press("Escape");
}

test("Human-visible full application walkthrough (yard_admin)", async ({ page }) => {
  await loginAsAdmin(page);
  await auditTopNavMenus(page);

  await auditControlTower(page);
  await auditQueue(page);
  await auditYardMap(page);
  await auditAi(page);

  await auditAppointments(page);
  await auditGate(page);
  await auditDocks(page);
  await auditLoading(page);

  await auditVehicles(page);
  await auditEquipment(page);
  await auditLabor(page);

  await auditOpsDashboard(page);
  await auditDelayAnalysis(page);
  await auditDetention(page);
  await auditKpis(page);

  await auditUsers(page);
  await auditRoles(page);
  await auditSettings(page);

  await announce("Audit complete — final screenshot");
  await page.goto("/");
  await pause(page);
  await snap(page, "audit-complete-dashboard");

  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  ✅ VISUAL QA AUDIT FINISHED");
  console.log(`  Screenshots saved: ${SHOTS}`);
  console.log(`  Video: test-results/manual-visual-audit-artifacts/`);
  console.log(`  Browser stays open ${HOLD_OPEN_MS / 1000}s — review the UI now`);
  console.log("══════════════════════════════════════════════════════════\n");

  await pause(page, HOLD_OPEN_MS);
});
