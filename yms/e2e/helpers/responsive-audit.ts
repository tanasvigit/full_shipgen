import type { Page } from "@playwright/test";

/** JWT demo accounts mapped to production role codes */
export const DEMO_USERS: Record<
  string,
  { username: string; password: string; label: string }
> = {
  yard_admin: { username: "admin", password: "admin123", label: "Yard Admin" },
  yard_manager: { username: "manager", password: "manager123", label: "Yard Manager" },
  gate_operator: { username: "gate", password: "gate123", label: "Gate Operator" },
  yard_coordinator: {
    username: "coordinator",
    password: "coordinator123",
    label: "Yard Coordinator",
  },
  dock_supervisor: {
    username: "supervisor",
    password: "supervisor123",
    label: "Dock Supervisor",
  },
};

export async function loginAsRole(page: Page, role = "yard_admin"): Promise<void> {
  const creds = DEMO_USERS[role] ?? DEMO_USERS.yard_admin;

  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByTestId("login-form").waitFor({ state: "visible", timeout: 20_000 });
  await page.getByTestId("login-username").fill(creds.username);
  await page.getByTestId("login-password").fill(creds.password);
  await page.getByTestId("login-submit").click();

  await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 30_000 }).catch(() => {});

  const loginError = page.getByTestId("login-error");
  if (await loginError.isVisible().catch(() => false)) {
    throw new Error(`Login failed for ${creds.username}: ${await loginError.innerText()}`);
  }

  const shell = page.locator('[data-testid="topnav"], [data-testid="page-title"], [data-testid="app-main"]');
  await shell.first().waitFor({ state: "visible", timeout: 45_000 });
  await page.waitForLoadState("networkidle", { timeout: 25_000 }).catch(() => {});
}

export async function detectLayoutIssues(page: Page): Promise<string[]> {
  const issues: string[] = [];

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      hScroll: doc.scrollWidth > doc.clientWidth + 2,
      bodyHScroll: body.scrollWidth > body.clientWidth + 2,
      viewportW: doc.clientWidth,
      scrollW: doc.scrollWidth,
    };
  });

  if (metrics.hScroll || metrics.bodyHScroll) {
    issues.push(
      `Horizontal overflow (scroll ${metrics.scrollW}px vs viewport ${metrics.viewportW}px)`
    );
  }

  const clippedControls = await page.evaluate(() => {
    const isInScrollContainer = (el: Element | null): boolean => {
      let node: Element | null = el;
      while (node && node !== document.body) {
        const style = window.getComputedStyle(node);
        if (style.overflowX === "auto" || style.overflowX === "scroll") return true;
        node = node.parentElement;
      }
      return false;
    };

    let clipped = 0;
    document.querySelectorAll('[data-testid="page-title"], [data-testid="topnav"], [data-testid="mobile-nav-toggle"]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && (r.right < 0 || r.left > window.innerWidth)) {
        if (!isInScrollContainer(el)) clipped += 1;
      }
    });
    return clipped;
  });
  if (clippedControls > 0) {
    issues.push(`${clippedControls} critical control(s) clipped outside viewport`);
  }

  const chartWarnings = await page
    .locator("text=/width\\(-1\\)|height\\(-1\\)/i")
    .count()
    .catch(() => 0);
  if (chartWarnings > 0) {
    issues.push("Recharts dimension warning detected");
  }

  const errorBoundary = page.locator("text=/Something went wrong|Unhandled Runtime Error/i");
  if (await errorBoundary.first().isVisible().catch(() => false)) {
    issues.push("Error boundary visible");
  }

  return issues;
}
