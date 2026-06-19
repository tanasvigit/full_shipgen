import { test, expect } from "@playwright/test";
import {
  ALIAS_ROUTES,
  APP_ROUTES,
  RBAC_CHECKS,
  SEARCH_QUERIES,
  YMS_ROLES,
} from "../helpers/constants";
import {
  resetAuditState,
  saveAuditState,
  getAuditState,
  loadFromDisk,
  hydrateAuditFromDisk,
} from "../helpers/audit-state";
import { attachPageListeners } from "../helpers/listeners";
import {
  auditVisibleButtons,
  checkHealth,
  gotoRoute,
  openDrawerByRow,
  runGlobalSearch,
  setYmsRole,
  switchRole,
  validateRoute,
  waitForPageReady,
} from "../helpers/page-audit";

const FRONTEND_URL = process.env.YMS_FRONTEND_URL || "http://localhost:3001";
const API_URL = process.env.YMS_API_URL || "http://localhost:8001";

function ensureAudit(): ReturnType<typeof getAuditState> {
  hydrateAuditFromDisk();
  const existing = loadFromDisk();
  if (existing?.meta?.startedAt) return getAuditState();
  return resetAuditState(FRONTEND_URL, API_URL);
}

test.describe.serial("Smart Yard — Full Application Audit", () => {
  test.beforeAll(async () => {
    const fs = await import("fs");
    const path = await import("path");
    const resultsPath = path.join(__dirname, "..", "audit-results.json");
    if (fs.existsSync(resultsPath)) fs.unlinkSync(resultsPath);
    const audit = resetAuditState(FRONTEND_URL, API_URL);
    audit.meta.healthy = await checkHealth(FRONTEND_URL, API_URL);
    saveAuditState();
  });

  test("phase 1 — routes", async ({ page }) => {
    test.setTimeout(300_000);
    const audit = ensureAudit();
    audit.routes = [];
    if (!audit.meta.healthy.frontend) test.skip(true, "Frontend down");

    await setYmsRole(page, "operations");
    const listeners = attachPageListeners(page, "/");
    try {
      for (const route of APP_ROUTES) {
        listeners.currentRoute = route.path;
        await gotoRoute(page, route.path, listeners);
        const v = await validateRoute(page, route.path, route.name, false);
        audit.routes.push({
          path: route.path,
          name: route.name,
          status: v.status,
          issues: v.issues,
          screenshot: v.screenshot,
        });
      }
      for (const route of ALIAS_ROUTES) {
        listeners.currentRoute = route.path;
        await gotoRoute(page, route.path, listeners);
        const v = await validateRoute(page, route.path, route.name, true);
        const is404ish = !(await page.locator('[data-testid="page-title"]').isVisible().catch(() => false));
        audit.routes.push({
          path: route.path,
          name: route.name,
          status: is404ish ? "WARN" : v.status,
          issues: is404ish
            ? ["No React route (expected alias — use /queue, /yard, /loading)"]
            : v.issues,
          screenshot: v.screenshot,
          alias: true,
        });
      }
    } finally {
      saveAuditState();
      listeners.detach();
    }
  });

  test("phase 2 — buttons", async ({ page }) => {
    test.setTimeout(600_000);
    const audit = ensureAudit();
    audit.buttons = [];
    await setYmsRole(page, "operations");
    const listeners = attachPageListeners(page, "/");
    try {
      for (const route of APP_ROUTES) {
        await gotoRoute(page, route.path, listeners);
        await auditVisibleButtons(page, route.path, listeners);
      }
    } finally {
      saveAuditState();
      listeners.detach();
    }
    expect(audit.buttons.length).toBeGreaterThan(0);
  });

  test("phase 3 — drawers", async ({ page }) => {
    test.setTimeout(300_000);
    const audit = ensureAudit();
    audit.drawers = [];
    await setYmsRole(page, "operations");
    const listeners = attachPageListeners(page, "/");
    const plans = [
      { drawer: "vehicle-drawer", route: "/vehicles", row: '[data-testid^="veh-row-"]' },
      { drawer: "appointment-drawer", route: "/appointments", row: '[data-testid^="appt-row-"]' },
      { drawer: "dock-drawer", route: "/docks", row: '[data-testid^="dock-card-"], [data-testid^="bay-"]' },
      { drawer: "equipment-drawer", route: "/equipment", row: '[data-testid^="eq-card-"]' },
      { drawer: "labor-drawer", route: "/labor", row: '[data-testid^="team-row-"]' },
      { drawer: "loading-op-drawer", route: "/loading", row: '[data-testid^="op-row-"]' },
      { drawer: "detention-drawer", route: "/detention", row: '[data-testid^="det-row-"]' },
    ];
    try {
      for (const plan of plans) {
        listeners.currentRoute = plan.route;
        const errorsBefore = audit.consoleErrors.length;
        const result = await openDrawerByRow(page, plan.route, plan.row, plan.drawer);
        audit.drawers.push({
          drawer: plan.drawer,
          route: plan.route,
          opens: result.opens,
          closes: result.closes,
          dataLoaded: result.dataLoaded,
          consoleErrors: audit.consoleErrors.length - errorsBefore,
          detail: result.opens ? undefined : "No row to click",
        });
      }
      const q = await openDrawerByRow(page, "/queue", '[data-testid^="queue-row-"]', "vehicle-drawer");
      if (q.opens) {
        audit.drawers.push({
          drawer: "vehicle-drawer",
          route: "/queue",
          opens: true,
          closes: q.closes,
          dataLoaded: q.dataLoaded,
          consoleErrors: 0,
        });
      }
    } finally {
      saveAuditState();
      listeners.detach();
    }
  });

  test("phase 4 — forms", async ({ page }) => {
    test.setTimeout(300_000);
    const audit = ensureAudit();
    audit.forms = [];
    await setYmsRole(page, "operations");
    const listeners = attachPageListeners(page, "/");
    try {
      await testFormAppointments(page, listeners);
      await testFormGate(page, listeners);
      await testFormQueue(page, listeners);
      await testFormDocks(page, listeners);
      await testFormLoading(page, listeners);
      await testFormEquipment(page, listeners);
      await testFormLabor(page, listeners);
      await testFormDetention(page, listeners);
    } finally {
      saveAuditState();
      listeners.detach();
    }
  });

  test("phase 5 — search and RBAC", async ({ page }) => {
    test.setTimeout(300_000);
    const audit = ensureAudit();
    audit.search = [];
    audit.rbac = [];
    await setYmsRole(page, "operations");
    const listeners = attachPageListeners(page, "/");
    try {
      for (const q of SEARCH_QUERIES) {
        listeners.currentRoute = `/ (search: ${q.term})`;
        const r = await runGlobalSearch(page, q.term);
        audit.search.push({
          term: q.term,
          status: r.ok ? "PASS" : "FAIL",
          hasResults: r.hasResults,
          detail: r.detail,
        });
      }

      for (const check of RBAC_CHECKS) {
        await setYmsRole(page, check.role);
        await page.reload();
        await waitForPageReady(page);
        listeners.currentRoute = `${check.route} [${check.role}]`;
        await gotoRoute(page, check.route, listeners);

        if ("expectDisabledOrHidden" in check && check.expectDisabledOrHidden) {
          const btn = page.locator(`[data-testid="${check.actionTestId}"]`).first();
          const visible = await btn.isVisible().catch(() => false);
          const disabled = visible ? await btn.isDisabled().catch(() => true) : true;
          audit.rbac.push({
            id: check.id,
            role: check.role,
            status: !visible || disabled ? "PASS" : "FAIL",
            detail:
              visible && !disabled
                ? "Approve visible/enabled for read_only"
                : "Correctly hidden or disabled",
          });
        }

        if ("expectVisible" in check) {
          const missing: string[] = [];
          for (const tid of check.expectVisible) {
            if (!(await page.locator(`[data-testid="${tid}"]`).first().isVisible().catch(() => false))) {
              missing.push(tid);
            }
          }
          audit.rbac.push({
            id: check.id,
            role: check.role,
            status: missing.length === 0 ? "PASS" : "FAIL",
            detail: missing.length ? `Missing: ${missing.join(", ")}` : undefined,
          });
        }
      }

      for (const role of YMS_ROLES) {
        await gotoRoute(page, "/", listeners);
        await switchRole(page, role);
        await waitForPageReady(page);
        audit.rbac.push({
          id: `role-switch-${role}`,
          role,
          status: "PASS",
          detail: "Dashboard loads after role switch",
        });
      }
    } finally {
      saveAuditState();
      listeners.detach();
    }
    console.log(`Audit phases complete — see PLAYWRIGHT_AUDIT_REPORT.md`);
  });
});

async function testFormAppointments(
  page: import("@playwright/test").Page,
  listeners: { currentRoute: string }
) {
  const audit = getAuditState();
  listeners.currentRoute = "/appointments";
  await gotoRoute(page, "/appointments");
  try {
    await page.locator('[data-testid="new-appointment-btn"]').click();
    await page.locator('[data-testid="book-slot-dialog"]').waitFor({ state: "visible", timeout: 8000 });
    await page.locator('[data-testid="pickup-input"]').fill("Audit Pickup");
    await page.locator('[data-testid="delivery-input"]').fill("Audit Delivery");
    await page.locator('[data-testid="dialog-next-btn"]').click();
    await page.locator('[data-testid="plate-input"]').waitFor({ state: "visible", timeout: 8000 });
    await page.locator('[data-testid="plate-input"]').fill("AUD-9999");
    await page.locator('[data-testid="dialog-next-btn"]').click();
    await page.waitForTimeout(400);
    const step2 = await page.locator('[data-testid="date-input"]').isVisible().catch(() => false);
    await page.locator('[data-testid="dialog-cancel-btn"]').click();
    audit.forms.push({
      id: "appointments-book-slot",
      route: "/appointments",
      status: step2 ? "PASS" : "FAIL",
      detail: step2 ? "Wizard step 1→2 OK" : "Could not advance book slot wizard",
    });
  } catch (e) {
    audit.forms.push({
      id: "appointments-book-slot",
      route: "/appointments",
      status: "FAIL",
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function testFormGate(
  page: import("@playwright/test").Page,
  listeners: { currentRoute: string }
) {
  const audit = getAuditState();
  await setYmsRole(page, "gate");
  listeners.currentRoute = "/gate";
  await page.reload();
  await gotoRoute(page, "/gate");
  try {
    await page.locator('[data-testid="gate-lookup-input"]').fill("AUDIT");
    await page.locator('[data-testid="gate-manual-lookup"]').click();
    await page.waitForTimeout(1500);
    audit.forms.push({
      id: "gate-manual-lookup",
      route: "/gate",
      status: "PASS",
      detail: "Lookup submitted without crash",
    });
  } catch (e) {
    audit.forms.push({
      id: "gate-manual-lookup",
      route: "/gate",
      status: "FAIL",
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function testFormQueue(
  page: import("@playwright/test").Page,
  listeners: { currentRoute: string }
) {
  const audit = getAuditState();
  await setYmsRole(page, "operations");
  listeners.currentRoute = "/queue";
  await page.reload();
  await gotoRoute(page, "/queue");
  const call = page.locator('[data-testid^="call-"]').first();
  if (!(await call.count())) {
    audit.forms.push({ id: "queue-call-in", route: "/queue", status: "SKIP", detail: "No queue rows" });
    return;
  }
  try {
    await call.click();
    await page.waitForTimeout(800);
    audit.forms.push({ id: "queue-call-in", route: "/queue", status: "PASS", detail: "Call-in clicked" });
  } catch (e) {
    audit.forms.push({
      id: "queue-call-in",
      route: "/queue",
      status: "FAIL",
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function testFormDocks(
  page: import("@playwright/test").Page,
  listeners: { currentRoute: string }
) {
  const audit = getAuditState();
  listeners.currentRoute = "/docks";
  await gotoRoute(page, "/docks");
  const card = page.locator('[data-testid^="dock-card-"]').first();
  if (!(await card.count())) {
    audit.forms.push({ id: "dock-assign-release", route: "/docks", status: "SKIP", detail: "No dock cards" });
    return;
  }
  try {
    await card.click();
    await page.locator('[data-testid="dock-drawer"]').waitFor({ state: "visible", timeout: 5000 });
    audit.forms.push({ id: "dock-assign-release", route: "/docks", status: "PASS", detail: "Dock drawer opened" });
    await page.keyboard.press("Escape");
  } catch (e) {
    audit.forms.push({
      id: "dock-assign-release",
      route: "/docks",
      status: "FAIL",
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function testFormLoading(
  page: import("@playwright/test").Page,
  listeners: { currentRoute: string }
) {
  const audit = getAuditState();
  listeners.currentRoute = "/loading";
  await gotoRoute(page, "/loading");
  const row = page.locator('[data-testid^="op-row-"]').first();
  if (!(await row.count())) {
    audit.forms.push({ id: "loading-op-actions", route: "/loading", status: "SKIP", detail: "No ops rows" });
    return;
  }
  try {
    await row.click();
    await page.locator('[data-testid="loading-op-drawer"]').waitFor({ state: "visible", timeout: 5000 });
    audit.forms.push({ id: "loading-start-complete", route: "/loading", status: "PASS", detail: "Drawer opened" });
    await page.keyboard.press("Escape");
  } catch (e) {
    audit.forms.push({
      id: "loading-start-complete",
      route: "/loading",
      status: "FAIL",
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function testFormEquipment(
  page: import("@playwright/test").Page,
  listeners: { currentRoute: string }
) {
  const audit = getAuditState();
  listeners.currentRoute = "/equipment";
  await gotoRoute(page, "/equipment");
  const card = page.locator('[data-testid^="eq-card-"]').first();
  if (!(await card.count())) {
    audit.forms.push({ id: "equipment-assign", route: "/equipment", status: "SKIP", detail: "No equipment cards" });
    return;
  }
  try {
    await card.click();
    await page.locator('[data-testid="equipment-drawer"]').waitFor({ state: "visible", timeout: 5000 });
    audit.forms.push({ id: "equipment-assign", route: "/equipment", status: "PASS", detail: "Drawer opened" });
    await page.keyboard.press("Escape");
  } catch (e) {
    audit.forms.push({
      id: "equipment-assign",
      route: "/equipment",
      status: "FAIL",
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function testFormLabor(
  page: import("@playwright/test").Page,
  listeners: { currentRoute: string }
) {
  const audit = getAuditState();
  listeners.currentRoute = "/labor";
  await gotoRoute(page, "/labor");
  const row = page.locator('[data-testid^="team-row-"]').first();
  if (!(await row.count())) {
    audit.forms.push({ id: "labor-assign", route: "/labor", status: "SKIP", detail: "No labor rows" });
    return;
  }
  try {
    await row.click();
    await page.locator('[data-testid="labor-drawer"]').waitFor({ state: "visible", timeout: 5000 });
    audit.forms.push({ id: "labor-assign", route: "/labor", status: "PASS", detail: "Drawer opened" });
    await page.keyboard.press("Escape");
  } catch (e) {
    audit.forms.push({
      id: "labor-assign",
      route: "/labor",
      status: "FAIL",
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}

async function testFormDetention(
  page: import("@playwright/test").Page,
  listeners: { currentRoute: string }
) {
  const audit = getAuditState();
  listeners.currentRoute = "/detention";
  await gotoRoute(page, "/detention");
  const row = page.locator('[data-testid^="det-row-"]').first();
  if (!(await row.count())) {
    audit.forms.push({ id: "detention-review", route: "/detention", status: "SKIP", detail: "No detention rows" });
    return;
  }
  try {
    await row.click();
    await page.locator('[data-testid="detention-drawer"]').waitFor({ state: "visible", timeout: 5000 });
    audit.forms.push({ id: "detention-review", route: "/detention", status: "PASS", detail: "Drawer opened" });
    await page.keyboard.press("Escape");
  } catch (e) {
    audit.forms.push({
      id: "detention-review",
      route: "/detention",
      status: "FAIL",
      detail: e instanceof Error ? e.message : String(e),
    });
  }
}
