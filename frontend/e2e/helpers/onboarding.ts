import { expect, type Page } from "@playwright/test";
import { clearClientSession } from "./auth";

export async function mockInstallerInitialize(
  page: Page,
  { shouldInstall = false, shouldOnboard = false }: { shouldInstall?: boolean; shouldOnboard?: boolean } = {},
) {
  await page.route("**/int/v1/installer/initialize", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        shouldInstall,
        shouldOnboard,
        defaultTheme: "dark",
      }),
    });
  });
}

export async function mockShouldOnboard(page: Page, shouldOnboard: boolean) {
  await mockInstallerInitialize(page, { shouldInstall: false, shouldOnboard });
  await page.route("**/int/v1/onboard/should-onboard", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ should_onboard: shouldOnboard }),
    });
  });
}

export async function startLoggedOutOnOnboard(page: Page, shouldOnboard = true) {
  await mockShouldOnboard(page, shouldOnboard);
  await page.goto("/auth");
  await clearClientSession(page);
  await page.reload();
  await page.goto("/auth/onboard");
  await expect(page.getByTestId("onboard-page")).toBeVisible();
}

export async function fillOnboardingForm(page: Page, suffix = "default") {
  await page.getByTestId("onboard-name").fill("Prasanth Kumar");
  await page.getByTestId("onboard-email").fill(`prasanth+${suffix}@techliv.net`);
  await page.getByTestId("onboard-phone").fill("+919999999999");
  await page.getByTestId("onboard-organization-name").fill("Techliv Logistics");
  await page.getByTestId("onboard-password").fill("Shipgen@E2e2026!");
  await page.getByTestId("onboard-password-confirmation").fill("Shipgen@E2e2026!");
}

