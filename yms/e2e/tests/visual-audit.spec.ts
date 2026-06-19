import { test, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";
import { VISUAL_PATHS } from "../playwright.visual-audit.config";
import {
  addFinding,
  getVisualAudit,
  resetVisualAudit,
  saveVisualAudit,
  screenshotPath,
} from "../helpers/visual-audit-state";
import { checkHealth, closeOverlays, setYmsRole, waitForPageReady } from "../helpers/page-audit";

const MODULE_ROUTES: Array<{ path: string; name: string; module: string }> = [
  { path: "/", name: "Control Tower", module: "Control Tower" },
  { path: "/appointments", name: "Appointments", module: "Appointments" },
  { path: "/vehicles", name: "Vehicles", module: "Vehicles" },
  { path: "/gate", name: "Gate Management", module: "Gate" },
  { path: "/queue", name: "Virtual Queue", module: "Queue" },
  { path: "/docks", name: "Docks", module: "Docks" },
  { path: "/labor", name: "Labor", module: "Labor" },
  { path: "/equipment", name: "Equipment", module: "Equipment" },
  { path: "/loading", name: "Loading Operations", module: "Loading Operations" },
  { path: "/yard", name: "Yard Map", module: "Yard Map" },
  { path: "/detention", name: "Detention Management", module: "Detention" },
  { path: "/operations-dashboard", name: "Operations Dashboard", module: "Operations Dashboard" },
  { path: "/reports/delay-analysis", name: "Delay Analysis", module: "Delay Analysis" },
  { path: "/kpis", name: "Executive KPIs", module: "Executive KPIs" },
  { path: "/ai", name: "Recommendations", module: "Recommendations" },
];

const NAV_MENU_SECTIONS: Record<string, string[]> = {
  control: ["nav-dashboard", "nav-queue", "nav-yard", "nav-ai"],
  operations: ["nav-appointments", "nav-gate", "nav-docks", "nav-loading"],
  resources: ["nav-vehicles", "nav-equipment", "nav-labor"],
  reports: ["nav-operations-dashboard", "nav-delay-analysis", "nav-detention", "nav-kpis"],
};

async function validateScreen(
  page: Page,
  routePath: string
): Promise<{ status: "PASS" | "FAIL" | "WARN"; issues: string[] }> {
  const issues: string[] = [];
  const errorBoundary = page.locator("text=/Something went wrong|Unhandled Runtime Error/i");
  if (await errorBoundary.first().isVisible().catch(() => false)) {
    issues.push("Error boundary visible");
  }
  const bodyText = await page.locator("body").innerText().catch(() => "");
  if (bodyText.trim().length < 30) issues.push("Possible white screen");
  const title = page.locator('[data-testid="page-title"]');
  if (!(await title.isVisible().catch(() => false))) {
    const onDashboard =
      routePath === "/" &&
      (await page.locator('[data-testid="dashboard-refresh"]').isVisible().catch(() => false));
    if (!onDashboard) issues.push("Missing page-title");
  }
  const stillLoading = await page
    .locator("text=/Loading schedule|Loading bays|Loading live/i")
    .first()
    .isVisible()
    .catch(() => false);
  if (stillLoading) issues.push("Loading indicator still visible");
  return { status: issues.length === 0 ? "PASS" : "FAIL", issues };
}

let shotCounter = 0;

async function capture(page: Page, label: string): Promise<string> {
  shotCounter += 1;
  const file = screenshotPath(`${String(shotCounter).padStart(4, "0")}_${label}`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function capturePair(page: Page, action: string, fn: () => Promise<void>): Promise<void> {
  await capture(page, `${action}_before`);
  await fn();
  await page.waitForTimeout(400);
  await capture(page, `${action}_after`);
}

async function inspectTables(page: Page, route: string): Promise<void> {
  const audit = getVisualAudit();
  const tables = page.locator("table");
  const count = await tables.count();
  for (let i = 0; i < count; i++) {
    const table = tables.nth(i);
    const rows = table.locator("tbody tr");
    const rowCount = await rows.count();
    const empty = rowCount === 0 || (rowCount === 1 && (await rows.first().textContent())?.includes("No "));
    audit.tablesInspected.push({ route, rowCount, empty });
    if (empty && route !== "/ai") {
      const shot = await capture(page, `empty_table_${route.replace(/\//g, "_")}_${i}`);
      addFinding({
        id: `empty-table-${route}-${i}`,
        severity: "medium",
        module: route,
        url: page.url(),
        title: `Table appears empty on ${route}`,
        steps: [`Navigate to ${route}`, `Inspect table index ${i}`],
        screenshot: path.relative(VISUAL_PATHS.root, shot),
      });
    }
  }
}

async function testSearchAndFilters(page: Page, route: string): Promise<void> {
  const search = page.locator('main input[placeholder*="Search" i], main input[placeholder*="Filter" i]').first();
  if (await search.isVisible().catch(() => false)) {
    await capturePair(page, `${route.replace(/\//g, "_")}_search`, async () => {
      await search.fill("test");
      await page.waitForTimeout(600);
    });
    await search.clear().catch(() => {});
  }
  const sortable = page.locator("th button, th[role='button']").first();
  if (await sortable.isVisible().catch(() => false)) {
    await capturePair(page, `${route.replace(/\//g, "_")}_sort`, async () => {
      await sortable.click();
      await page.waitForTimeout(500);
    });
  }
  const nextPage = page.getByRole("button", { name: /next/i }).first();
  if (await nextPage.isVisible().catch(() => false) && (await nextPage.isEnabled())) {
    await capturePair(page, `${route.replace(/\//g, "_")}_pagination`, async () => {
      await nextPage.click();
      await page.waitForTimeout(500);
    });
  }
}

async function openDrawersOnPage(page: Page, route: string): Promise<void> {
  const audit = getVisualAudit();
  await closeOverlays(page);
  const row = page.locator("tbody tr").first();
  if (!(await row.isVisible().catch(() => false))) return;

  try {
    await capture(page, `drawer_open_${route.replace(/\//g, "_")}_before`);
    await closeOverlays(page);
    await row.click({ timeout: 5000 });
    await page.waitForTimeout(800);
    await capture(page, `drawer_open_${route.replace(/\//g, "_")}_after`);
  } catch (e) {
    await closeOverlays(page);
    addFinding({
      id: `drawer-click-${route}`,
      severity: "medium",
      module: route,
      url: page.url(),
      title: "Could not click table row (overlay or timeout)",
      steps: [`Go to ${route}`, "Click first table row"],
      consoleSnippet: String(e),
    });
    audit.drawersTested.push({ id: `row-drawer-${route}`, route, ok: false, detail: String(e) });
    return;
  }

  const drawer = page.locator('[role="dialog"][data-state="open"]').first();
  const opens = await drawer.isVisible().catch(() => false);
  audit.drawersTested.push({ id: `row-drawer-${route}`, route, ok: opens });
  if (!opens) {
    addFinding({
      id: `drawer-fail-${route}`,
      severity: "high",
      module: route,
      url: page.url(),
      title: "List row did not open drawer",
      steps: [`Go to ${route}`, "Click first table row"],
    });
  } else {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    await closeOverlays(page);
  }
}

async function auditYardMap(page: Page): Promise<void> {
  const audit = getVisualAudit();
  await page.goto("/yard");
  await waitForPageReady(page);
  await capture(page, "yard_map_initial");

  const counters = page.locator("[data-testid^='zone-counter-']");
  const counterCount = await counters.count();
  for (let i = 0; i < counterCount; i++) {
    const c = counters.nth(i);
    const tid = (await c.getAttribute("data-testid")) || `counter-${i}`;
    await capturePair(page, `yard_${tid}`, async () => {
      await c.click();
      await page.waitForTimeout(500);
    });
    audit.yardMapActions.push(`zone-counter: ${tid}`);
  }

  const zones = page.locator("[data-testid^='zone-']:not([data-testid^='zone-counter'])");
  const zoneCount = await zones.count();
  for (let i = 0; i < Math.min(zoneCount, 8); i++) {
    const z = zones.nth(i);
    const tid = (await z.getAttribute("data-testid")) || `zone-${i}`;
    await capturePair(page, `yard_${tid}`, async () => {
      await z.click();
      await page.waitForTimeout(700);
    });
    audit.yardMapActions.push(`map-zone: ${tid}`);
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(300);
  }

  const dots = page.locator("[data-testid^='yard-vehicle-dot-']");
  const dotCount = await dots.count();
  for (let i = 0; i < Math.min(dotCount, 5); i++) {
    const d = dots.nth(i);
    const tid = (await d.getAttribute("data-testid")) || `dot-${i}`;
    await capturePair(page, `yard_${tid}`, async () => {
      await d.click({ force: true });
      await page.waitForTimeout(600);
    });
    audit.yardMapActions.push(`vehicle-dot: ${tid}`);
  }

  await closeOverlays(page);
  const dockBtn = page.locator(".absolute.top-12.right-2 button").first();
  if (await dockBtn.isVisible().catch(() => false)) {
    try {
      await capture(page, "yard_dock_click_before");
      await closeOverlays(page);
      await dockBtn.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(600);
      await capture(page, "yard_dock_click_after");
      audit.yardMapActions.push("dock-click");
      await closeOverlays(page);
    } catch (e) {
      await closeOverlays(page);
      addFinding({
        id: "yard-dock-click",
        severity: "medium",
        module: "Yard Map",
        url: page.url(),
        title: "Dock tile click blocked by overlay",
        steps: ["Open Yard Map", "Click dock tile on map panel"],
        consoleSnippet: String(e),
      });
    }
  }

  await inspectTables(page, "/yard");
}

async function clickNavMenus(page: Page): Promise<void> {
  const audit = getVisualAudit();
  for (const [section, items] of Object.entries(NAV_MENU_SECTIONS)) {
    for (const testId of items) {
      await page.locator(`[data-testid="menu-${section}"]`).click();
      await page.waitForTimeout(250);
      const link = page.locator(`[data-testid="${testId}"]`).first();
      if (!(await link.isVisible().catch(() => false))) continue;
      await capturePair(page, `nav_${testId}`, async () => {
        await link.click();
        await waitForPageReady(page);
      });
      audit.navItemsClicked.push(testId);
      audit.modulesTested.push(testId);
    }
  }
}

test.describe.serial("YARD.OS Visual E2E Audit", () => {
  test("full headed visual audit with video", async ({ page }, testInfo) => {
    const frontendUrl = testInfo.project.use.baseURL || "http://localhost:3001";
    const apiUrl = process.env.YMS_API_URL || "http://localhost:8001";

    resetVisualAudit(frontendUrl, apiUrl);
    const audit = getVisualAudit();

    audit.meta.healthy = await checkHealth(frontendUrl, apiUrl);

    try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setYmsRole(page, "admin");

    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        const loc = msg.location();
        audit.consoleErrors.push({
          route: page.url(),
          type: msg.type(),
          text: msg.text(),
          location: loc?.url ? `${loc.url}:${loc.lineNumber}` : undefined,
        });
      }
    });

    page.on("response", (res) => {
      const url = res.url();
      if (!url.includes("/api/") && !url.includes(":8001")) return;
      if (res.status() >= 400) {
        audit.networkErrors.push({
          route: page.url(),
          method: res.request().method(),
          status: res.status(),
          url,
        });
      }
    });

    page.on("requestfailed", (req) => {
      const url = req.url();
      if (!url.includes("/api/") && !url.includes(":8001")) return;
      audit.networkErrors.push({
        route: page.url(),
        method: req.method(),
        status: 0,
        url: `${url} (${req.failure()?.errorText || "failed"})`,
      });
    });

    await page.goto("/");
    await waitForPageReady(page);
    await capture(page, "post_login_dashboard");

    await clickNavMenus(page);

    for (const route of MODULE_ROUTES) {
      try {
        await closeOverlays(page);
        await capture(page, `visit_${route.path.replace(/\//g, "_") || "home"}_before`);
        await page.goto(route.path);
        await waitForPageReady(page);
        const shot = await capture(page, `visit_${route.path.replace(/\//g, "_") || "home"}_after`);
        audit.screensVisited.push({
          path: route.path,
          name: route.name,
          url: page.url(),
          screenshot: path.relative(VISUAL_PATHS.root, shot),
        });
        if (!audit.modulesTested.includes(route.module)) audit.modulesTested.push(route.module);

        const routeResult = await validateScreen(page, route.path);
        if (routeResult.status !== "PASS") {
          const issueShot = await capture(page, `issue_${route.path.replace(/\//g, "_")}`);
          addFinding({
            id: `route-${route.path}`,
            severity: routeResult.status === "FAIL" ? "high" : "medium",
            module: route.module,
            url: page.url(),
            title: `Route issues on ${route.name}`,
            steps: [`Navigate to ${route.path}`],
            screenshot: path.relative(VISUAL_PATHS.root, issueShot),
            consoleSnippet: routeResult.issues.join("; "),
          });
        }

        await inspectTables(page, route.path);
        await testSearchAndFilters(page, route.path);
        await openDrawersOnPage(page, route.path);

        const buttons = page.locator("button:visible");
        const btnCount = Math.min(await buttons.count(), 10);
        for (let i = 0; i < btnCount; i++) {
          const btn = buttons.nth(i);
          const label = (await btn.textContent())?.trim().slice(0, 40) || `btn-${i}`;
          if (/logout|sign out|delete|remove/i.test(label)) continue;
          if (await btn.isDisabled()) continue;
          audit.buttonsTested += 1;
          try {
            await closeOverlays(page);
            await capture(page, `btn_${route.path.replace(/\//g, "_")}_${i}_before`);
            await btn.click({ timeout: 3000 });
            await page.waitForTimeout(400);
            await capture(page, `btn_${route.path.replace(/\//g, "_")}_${i}_after`);
            const dialog = page.locator('[role="dialog"][data-state="open"]');
            if (await dialog.isVisible().catch(() => false)) {
              audit.modalsTested.push({ id: label, route: route.path, ok: true });
            }
            await closeOverlays(page);
          } catch {
            await closeOverlays(page);
            addFinding({
              id: `btn-fail-${route.path}-${i}`,
              severity: "low",
              module: route.module,
              url: page.url(),
              title: `Button click issue: ${label}`,
              steps: [`On ${route.path}`, `Click button "${label}"`],
            });
          }
        }
      } catch (err) {
        await closeOverlays(page);
        const issueShot = await capture(page, `route_error_${route.path.replace(/\//g, "_")}`);
        addFinding({
          id: `route-error-${route.path}`,
          severity: "high",
          module: route.module,
          url: page.url(),
          title: `Route audit interrupted on ${route.name}`,
          steps: [`Navigate to ${route.path}`, "Continue module interactions"],
          screenshot: path.relative(VISUAL_PATHS.root, issueShot),
          consoleSnippet: String(err),
        });
      }
    }

    try {
      await auditYardMap(page);
    } catch (err) {
      await closeOverlays(page);
      addFinding({
        id: "yard-map-audit",
        severity: "medium",
        module: "Yard Map",
        url: page.url(),
        title: "Yard Map interaction audit error",
        steps: ["Open /yard", "Interact with zones, counters, vehicles, docks"],
        consoleSnippet: String(err),
      });
    }

    const alerts = page.locator('[data-testid="topnav-alert"]');
    if (await alerts.isVisible().catch(() => false)) {
      await capturePair(page, "topnav_alerts", async () => {
        await alerts.click();
        await page.waitForTimeout(500);
      });
      await closeOverlays(page);
    }
    } finally {
      saveVisualAudit();
      const video = testInfo.video;
      if (video?.path()) {
        const dest = path.join(VISUAL_PATHS.videos, "full-session.webm");
        fs.mkdirSync(VISUAL_PATHS.videos, { recursive: true });
        try {
          fs.copyFileSync(video.path(), dest);
        } catch {
          /* video may not be finalized yet */
        }
      }
      const artifactsDir = VISUAL_PATHS.artifacts;
      if (fs.existsSync(artifactsDir)) {
        const walk = (dir: string) => {
          for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, ent.name);
            if (ent.isDirectory()) walk(p);
            else if (ent.name.endsWith(".webm") && !fs.existsSync(path.join(VISUAL_PATHS.videos, "full-session.webm"))) {
              fs.mkdirSync(VISUAL_PATHS.videos, { recursive: true });
              fs.copyFileSync(p, path.join(VISUAL_PATHS.videos, "full-session.webm"));
            }
          }
        };
        walk(artifactsDir);
      }
    }
  });
});
