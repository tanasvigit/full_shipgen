import type { Page } from "@playwright/test";
import { YMS_DEMO_PASSWORD } from "./rbac-audit";

/** JWT demo accounts mapped to production role codes */
export const DEMO_USERS: Record<
  string,
  { email: string; password: string; label: string }
> = {
  yard_admin: { email: "yard.admin@shipgen.demo", password: YMS_DEMO_PASSWORD, label: "Yard Admin" },
  yard_manager: { email: "yard.manager@shipgen.demo", password: YMS_DEMO_PASSWORD, label: "Yard Manager" },
  gate_operator: { email: "yard.gate@shipgen.demo", password: YMS_DEMO_PASSWORD, label: "Gate Operator" },
  yard_coordinator: {
    email: "yard.coordinator@shipgen.demo",
    password: YMS_DEMO_PASSWORD,
    label: "Yard Coordinator",
  },
  dock_supervisor: {
    email: "yard.supervisor@shipgen.demo",
    password: YMS_DEMO_PASSWORD,
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
  await page.getByTestId("login-email").fill(creds.email);
  await page.getByTestId("login-password").fill(creds.password);
  await page.getByTestId("login-submit").click();

  await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 30_000 }).catch(() => {});

  const loginError = page.getByTestId("login-error");
  if (await loginError.isVisible().catch(() => false)) {
    throw new Error(`Login failed for ${creds.email}: ${await loginError.innerText()}`);
  }

  const shell = page.locator('[data-testid="topnav"], [data-testid="page-title"], [data-testid="app-main"]');
  await shell.first().waitFor({ state: "visible", timeout: 45_000 });
  await page.waitForLoadState("networkidle", { timeout: 25_000 }).catch(() => {});
}
