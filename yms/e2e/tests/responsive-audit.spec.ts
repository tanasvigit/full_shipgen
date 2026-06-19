import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { RESPONSIVE_PATHS } from "../playwright.responsive.config";
import { loginAsRole, detectLayoutIssues, DEMO_USERS } from "../helpers/responsive-audit";
import { closeOverlays, waitForPageReady } from "../helpers/page-audit";

const VIEWPORTS = [
  { name: "mobile-small", width: 320, height: 568 },
  { name: "mobile-medium", width: 375, height: 667 },
  { name: "mobile-large", width: 425, height: 768 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "laptop-hd", width: 1366, height: 768 },
  { name: "desktop", width: 1920, height: 1080 },
] as const;

const PAGES: Array<{ path: string; name: string; roles?: string[] }> = [
  { path: "/login", name: "login", roles: [] },
  { path: "/", name: "control-tower", roles: ["yard_admin", "yard_manager"] },
  { path: "/appointments", name: "appointments", roles: ["yard_admin", "yard_manager"] },
  { path: "/gate", name: "gate-management", roles: ["yard_admin", "gate_operator"] },
  { path: "/queue", name: "virtual-queue", roles: ["yard_admin", "yard_coordinator"] },
  { path: "/yard", name: "yard-map", roles: ["yard_admin", "yard_coordinator"] },
  { path: "/vehicles", name: "vehicle-operations", roles: ["yard_admin", "yard_manager"] },
  { path: "/docks", name: "dock-management", roles: ["yard_admin", "dock_supervisor"] },
  { path: "/labor", name: "labor-management", roles: ["yard_admin", "dock_supervisor"] },
  { path: "/equipment", name: "equipment-management", roles: ["yard_admin", "dock_supervisor"] },
  { path: "/loading", name: "loading-operations", roles: ["yard_admin", "dock_supervisor"] },
  { path: "/detention", name: "detention-management", roles: ["yard_admin", "yard_manager"] },
  { path: "/operations-dashboard", name: "operations-dashboard", roles: ["yard_admin", "yard_manager"] },
  { path: "/reports/delay-analysis", name: "delay-analysis", roles: ["yard_admin", "yard_manager"] },
  { path: "/kpis", name: "executive-kpis", roles: ["yard_admin", "yard_manager"] },
];

type AuditRow = {
  viewport: string;
  page: string;
  role: string;
  path: string;
  status: "PASS" | "WARN" | "FAIL" | "SKIP";
  issues: string[];
  screenshot: string;
};

const results: AuditRow[] = [];

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

test.describe("YARD.OS responsive audit", () => {
  test.afterAll(async () => {
    ensureDir(path.dirname(RESPONSIVE_PATHS.reportJson));
    fs.writeFileSync(RESPONSIVE_PATHS.reportJson, JSON.stringify(results, null, 2));

    const pass = results.filter((r) => r.status === "PASS").length;
    const warn = results.filter((r) => r.status === "WARN").length;
    const fail = results.filter((r) => r.status === "FAIL").length;
    const skip = results.filter((r) => r.status === "SKIP").length;

    const md = [
      "# YARD.OS Responsive Audit Report",
      "",
      `Generated: ${new Date().toISOString()}`,
      "",
      "## Summary",
      "",
      `| Status | Count |`,
      `|--------|-------|`,
      `| PASS | ${pass} |`,
      `| WARN | ${warn} |`,
      `| FAIL | ${fail} |`,
      `| SKIP | ${skip} |`,
      "",
      "## Findings",
      "",
      "| Viewport | Page | Role | Status | Issues | Screenshot |",
      "|----------|------|------|--------|--------|------------|",
      ...results.map(
        (r) =>
          `| ${r.viewport} | ${r.page} | ${r.role} | ${r.status} | ${r.issues.join("; ") || "—"} | ${r.screenshot} |`
      ),
      "",
    ].join("\n");

    fs.writeFileSync(RESPONSIVE_PATHS.reportMd, md);
  });

  for (const vp of VIEWPORTS) {
    test(`viewport ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Login page (unauthenticated)
      {
        const loginPage = PAGES.find((p) => p.path === "/login")!;
        await page.goto(loginPage.path, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(400);
        const shotDir = path.join(RESPONSIVE_PATHS.screenshotsDir, vp.name);
        ensureDir(shotDir);
        const shot = path.join(shotDir, `${loginPage.name}.png`);
        await page.screenshot({ path: shot, fullPage: true });
        const issues = await detectLayoutIssues(page);
        results.push({
          viewport: vp.name,
          page: loginPage.name,
          role: "anonymous",
          path: loginPage.path,
          status: issues.length ? "WARN" : "PASS",
          issues,
          screenshot: shot,
        });
      }

      for (const role of Object.keys(DEMO_USERS)) {
        await loginAsRole(page, role);
        await closeOverlays(page);

        for (const route of PAGES.filter((p) => p.path !== "/login")) {
          if (route.roles && !route.roles.includes(role)) {
            await page.goto(route.path, { waitUntil: "domcontentloaded" });
            const unauthorized =
              (await page.url().includes("/unauthorized")) ||
              (await page.url().includes("/login"));
            results.push({
              viewport: vp.name,
              page: route.name,
              role,
              path: route.path,
              status: unauthorized ? "PASS" : "SKIP",
              issues: unauthorized ? [] : ["Expected redirect for role without access"],
              screenshot: "",
            });
            continue;
          }

          await page.goto(route.path, { waitUntil: "domcontentloaded" });
          await waitForPageReady(page);
          await closeOverlays(page);
          await page.waitForTimeout(500);

          const shotDir = path.join(RESPONSIVE_PATHS.screenshotsDir, vp.name, role);
          ensureDir(shotDir);
          const shot = path.join(shotDir, `${route.name}.png`);
          await page.screenshot({ path: shot, fullPage: true });

          const issues = await detectLayoutIssues(page);

          // Mobile/tablet: hamburger should exist
          if (vp.width < 1024 && route.path !== "/login") {
            const burger = page.getByTestId("mobile-nav-toggle");
            if (!(await burger.isVisible().catch(() => false))) {
              issues.push("Mobile nav toggle not visible below lg breakpoint");
            }
          }

          // Desktop: section menus visible
          if (vp.width >= 1024) {
            const desktopNav = page.locator('nav.hidden.lg\\:flex');
            if (!(await desktopNav.isVisible().catch(() => false))) {
              issues.push("Desktop section nav not visible at lg+");
            }
          }

          const status = issues.some((i) => i.includes("overflow") || i.includes("Error boundary"))
            ? "FAIL"
            : issues.length
              ? "WARN"
              : "PASS";

          results.push({
            viewport: vp.name,
            page: route.name,
            role,
            path: route.path,
            status,
            issues,
            screenshot: shot,
          });

          expect(issues.filter((i) => i.includes("Error boundary"))).toHaveLength(0);
        }

        await page.evaluate(() => {
          sessionStorage.clear();
          localStorage.clear();
        });
      }
    });
  }
});
