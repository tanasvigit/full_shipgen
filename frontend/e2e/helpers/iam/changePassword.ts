import { expect, type Page } from "@playwright/test";
import { E2E_USER_PASSWORD } from "./userForm";
import { expectDataTableReady, searchDataTable } from "../page";
import { waitForApiSettle } from "../network";

export async function dismissOnboardingChecklist(page: Page) {
  const checklist = page.getByTestId("onboarding-checklist");
  if (await checklist.isVisible().catch(() => false)) {
    await checklist.getByRole("button", { name: "Dismiss checklist" }).click();
    await expect(checklist).toBeHidden({ timeout: 10_000 });
  }
}

export async function waitChangePasswordDialogReady(page: Page) {
  await expect(page.getByTestId("change-user-password-dialog")).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("change-password-new")).toBeVisible();
}

export type ChangePasswordFromListOptions = {
  searchQuery: string;
  password?: string;
  tableTestId?: string;
};

export async function findUsersTableRow(page: Page, searchQuery: string, tableTestId = "users-table") {
  await expectDataTableReady(page, tableTestId);
  await searchDataTable(page, searchQuery, tableTestId);
  await waitForApiSettle(page, { timeout: 15_000 });

  const row = page
    .locator(`[data-testid^="${tableTestId}-row-"]`)
    .filter({ hasText: new RegExp(searchQuery, "i") })
    .first();
  await expect(row).toBeVisible({ timeout: 25_000 });
  return row;
}

export async function openChangePasswordFromUsersList(
  page: Page,
  { searchQuery, tableTestId = "users-table" }: Pick<ChangePasswordFromListOptions, "searchQuery" | "tableTestId">,
) {
  const row = await findUsersTableRow(page, searchQuery, tableTestId);
  const rowTestId = await row.getAttribute("data-testid");
  const userKey = rowTestId?.replace(`${tableTestId}-row-`, "") ?? "";
  expect(userKey.length).toBeGreaterThan(0);

  await dismissOnboardingChecklist(page);
  await expect(page.getByTestId("users-table-loader-overlay")).toBeHidden({ timeout: 45_000 });

  await page.getByTestId(`user-row-actions-${userKey}`).click();
  const changePasswordItem = page.getByTestId("user-row-change-password");
  if (!(await changePasswordItem.isVisible())) {
    return { row, userKey, canChangePassword: false as const };
  }

  await changePasswordItem.click();
  await expect(page.getByTestId("change-user-password-dialog")).toBeVisible({ timeout: 10_000 });
  await waitChangePasswordDialogReady(page);
  return { row, userKey, canChangePassword: true as const };
}

export async function submitChangePasswordDialog(page: Page, password = E2E_USER_PASSWORD) {
  await page.getByTestId("change-password-new").fill(password);
  await page.getByTestId("change-password-confirm").fill(password);

  const responsePromise = page.waitForResponse(
    (res) => res.url().includes("change-user-password") && res.request().method() === "POST",
    { timeout: 30_000 },
  );
  await page.getByTestId("change-password-submit").click();
  const response = await responsePromise;
  expect(response.ok(), `change-user-password failed: ${await response.text()}`).toBeTruthy();
  await expect(page.getByTestId("change-user-password-dialog")).toBeHidden({ timeout: 15_000 });
}

export async function changePasswordFromUsersList(
  page: Page,
  { searchQuery, password = E2E_USER_PASSWORD, tableTestId = "users-table" }: ChangePasswordFromListOptions,
) {
  const opened = await openChangePasswordFromUsersList(page, { searchQuery, tableTestId });
  if (!opened.canChangePassword) {
    throw new Error("CHANGE_PASSWORD_UNAVAILABLE");
  }
  await submitChangePasswordDialog(page, password);
}

export async function readUserEmailFromRow(row: import("@playwright/test").Locator) {
  const email = await row.locator(".text-\\[11px\\]").first().textContent();
  return email?.trim() ?? "";
}
