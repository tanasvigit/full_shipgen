import { expect, type APIRequestContext, type Page } from "@playwright/test";
import path from "path";
import { apiLogin } from "./api";
import { getE2EConfig, requireCredentials } from "./env";
import { sel } from "./selectors";

const AUTH_KEY = "fleetbase.frontend.auth";
const ORG_KEY = "fleetbase.frontend.organization";

export const AUTH_STORAGE_PATH = path.join(process.cwd(), "playwright", ".auth", "user.json");

export async function injectSession(page: Page, session: Awaited<ReturnType<typeof apiLogin>>) {
  const { baseURL } = getE2EConfig();
  await page.goto(baseURL);
  await page.evaluate(
    ({ authKey, orgKey, token, org }) => {
      localStorage.setItem(authKey, JSON.stringify({ token, requiresTwoFactor: false }));
      if (org) {
        localStorage.setItem(orgKey, JSON.stringify(org));
      }
    },
    {
      authKey: AUTH_KEY,
      orgKey: ORG_KEY,
      token: session.token,
      org: session.organization,
    },
  );
}

export async function loginViaApi(request: APIRequestContext, browserPage: Page) {
  const { email, password } = requireCredentials();
  const session = await apiLogin(request, email, password);
  await injectSession(browserPage, session);
  await browserPage.reload();
  return session;
}

export async function loginViaUI(page: Page) {
  const { email, password } = requireCredentials();
  await loginViaUIWithCredentials(page, email, password);
}

export async function loginViaUIWithCredentials(page: Page, email: string, password: string) {
  await page.goto("/auth");
  await clearClientSession(page);
  await page.reload();
  await expect(page.locator(sel.loginPage)).toBeVisible({ timeout: 20_000 });
  await page.locator(sel.loginEmail).fill(email);
  await page.locator(sel.loginPassword).fill(password);
  await page.locator(sel.loginSubmit).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/auth"), { timeout: 45_000 });
  await expect(page.locator(sel.consoleLayout)).toBeVisible({ timeout: 30_000 });
}

export async function logoutViaUI(page: Page) {
  await page
    .locator('[data-testid$="-loader"], [data-testid$="-loader-overlay"], [data-testid$="-loader-spinner"]')
    .first()
    .waitFor({ state: "hidden", timeout: 20_000 })
    .catch(() => null);
  await page.locator('[data-testid="user-menu-trigger"]').click();
  await page.locator(sel.menuLogout).click();
  await page.waitForURL(/\/auth/);
}

export async function clearClientSession(page: Page) {
  await page.evaluate(
    ({ authKey, orgKey }) => {
      localStorage.removeItem(authKey);
      localStorage.removeItem(orgKey);
    },
    { authKey: AUTH_KEY, orgKey: ORG_KEY },
  );
}
