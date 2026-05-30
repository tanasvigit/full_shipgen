import { test, expect } from "@playwright/test";
import { requireCredentials } from "../helpers/env";
import { sel } from "../helpers/selectors";
import { clearClientSession } from "../helpers/auth";

test.describe("Authentication — guest", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth");
    await clearClientSession(page);
    await page.reload();
  });

  test("renders login form and links", async ({ page }) => {
    await expect(page.locator(sel.loginPage)).toBeVisible();
    await expect(page.locator(sel.loginEmail)).toBeVisible();
    await expect(page.locator(sel.loginPassword)).toBeVisible();
    await expect(page.locator('[data-testid="login-forgot-link"]')).toHaveAttribute("href", "/auth/forgot-password");
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.locator(sel.loginEmail).fill("invalid@example.com");
    await page.locator(sel.loginPassword).fill("wrong-password");
    await page.locator(sel.loginSubmit).click();
    await expect(page.locator(sel.loginError)).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/auth/);
  });

  test("successful UI login reaches dashboard", async ({ page }) => {
    const { email, password } = requireCredentials();
    await page.locator(sel.loginEmail).fill(email);
    await page.locator(sel.loginPassword).fill(password);
    await page.locator(sel.loginSubmit).click();
    await expect(page).toHaveURL("/", { timeout: 30_000 });
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
  });

  test("forgot password flow renders", async ({ page }) => {
    await page.locator('[data-testid="login-forgot-link"]').click();
    await expect(page.locator('[data-testid="forgot-password-page"]')).toBeVisible();
    await page.locator('[data-testid="forgot-email"]').fill("admin@example.com");
    await page.locator('[data-testid="forgot-submit"]').click();
    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible({ timeout: 10_000 });
  });
});
