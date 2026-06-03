import { expect, type Page } from "@playwright/test";
import { getE2EConfig } from "../env";
import { e2eUnique } from "../fleetops/test-data";
import { waitForApiSettle } from "../network";

/** Password that satisfies Fleetbase CreateUserRequest rules. */
export const E2E_USER_PASSWORD = "Shipgen@E2e2026!";

/** Unique IAM user seed using the same email domain as the E2E admin (avoids disposable-domain blocks). */
export function iamUserSeed(prefix: string) {
  const base = e2eUnique(prefix);
  const adminEmail = getE2EConfig().email || "";
  const domain = adminEmail.includes("@") ? adminEmail.split("@")[1] : "tanasvi.com";
  const safePrefix = prefix.replace(/[^a-zA-Z]/g, "") || "User";
  return {
    ...base,
    /** API name rule: letters/spaces only — no digits (see CreateUserRequest regex). */
    name: `Fleet IAM ${safePrefix}`,
    email: `e2e.iam.${prefix.toLowerCase().replace(/\s+/g, ".")}.${base.slug}@${domain}`,
  };
}

export type CreateUserFormValues = {
  name: string;
  email: string;
  phone: string;
  country?: string;
  password?: string;
  passwordConfirmation?: string;
  roleLabel?: string | RegExp;
};

export async function openCreateUserDialog(page: Page) {
  const create = page.getByTestId("users-create-button");
  await expect(create).toBeVisible({ timeout: 15_000 });
  await create.click();
  await expect(page.getByTestId("user-form-dialog")).toBeVisible({ timeout: 15_000 });
}

export async function listRoleOptions(page: Page): Promise<string[]> {
  await page.getByTestId("user-form-role").click();
  const options = page.getByRole("option");
  await expect(options.first()).toBeVisible({ timeout: 10_000 });
  const labels = await options.allTextContents();
  await page.keyboard.press("Escape");
  return labels.map((t) => t.trim()).filter(Boolean);
}

export async function selectRoleByLabel(page: Page, roleLabel: string | RegExp) {
  await page.getByTestId("user-form-role").click();
  const option = page.getByRole("option", { name: roleLabel, exact: true }).first();
  await expect(option).toBeVisible({ timeout: 10_000 });
  const label = (await option.textContent())?.trim() || String(roleLabel);
  await option.click();
  return label;
}

export async function attachFirstPolicyIfAvailable(page: Page): Promise<boolean> {
  const select = page.getByTestId("policy-attacher-select");
  if (!(await select.isVisible().catch(() => false))) return false;
  await select.click();
  const option = page.getByRole("option").first();
  if (!(await option.isVisible({ timeout: 3000 }).catch(() => false))) {
    await page.keyboard.press("Escape");
    return false;
  }
  await option.click();
  await expect(page.getByTestId("policy-attacher")).toBeVisible();
  return true;
}

export async function toggleFirstDirectPermission(page: Page): Promise<boolean> {
  const toggle = page.locator('[data-testid^="user-perm-toggle-"]').first();
  if (!(await toggle.isVisible({ timeout: 5000 }).catch(() => false))) return false;
  if (!(await toggle.isEnabled())) return false;
  await toggle.click();
  return true;
}

export async function fillCreateUserForm(page: Page, values: CreateUserFormValues) {
  const password = values.password ?? E2E_USER_PASSWORD;
  const passwordConfirmation = values.passwordConfirmation ?? password;

  await page.getByTestId("user-form-name").fill(values.name);
  await page.getByTestId("user-form-email").fill(values.email);
  await page.getByTestId("user-form-phone").fill(values.phone);
  if (values.country) {
    await page.getByTestId("user-form-country").fill(values.country);
  }
  const passwordField = page.getByTestId("user-form-password");
  if (await passwordField.isVisible().catch(() => false)) {
    await passwordField.fill(password);
    await page.getByTestId("user-form-password-confirm").fill(passwordConfirmation);
  }

  if (values.roleLabel) {
    await selectRoleByLabel(page, values.roleLabel);
  }
}

export async function submitCreateUserForm(page: Page) {
  const dialog = page.getByTestId("user-form-dialog");
  const submit = page.getByTestId("user-form-submit");
  await expect(submit).toBeEnabled();
  await submit.click();

  const errorEl = page.getByTestId("user-form-error");
  const result = await Promise.race([
    dialog.waitFor({ state: "hidden", timeout: 60_000 }).then(() => "ok" as const),
    errorEl.waitFor({ state: "visible", timeout: 60_000 }).then(() => "err" as const),
  ]);

  if (result === "err") {
    const msg = (await errorEl.textContent())?.trim() || "Create user failed";
    throw new Error(msg);
  }

  await waitForApiSettle(page);
}

/**
 * Resolve a dispatcher-capable IAM role label from the create-user dropdown.
 * Tries exact "Dispatcher", then any label containing "Dispatcher", then "Operations Manager".
 */
export function resolveDispatcherRoleLabel(roleLabels: string[]): string {
  const trimmed = roleLabels.map((l) => l.trim()).filter(Boolean);
  const exact = trimmed.find((l) => /^dispatcher$/i.test(l));
  if (exact) return exact;
  const partial = trimmed.find((l) => /dispatcher/i.test(l));
  if (partial) return partial;
  const operationsManager = trimmed.find((l) => /operations manager/i.test(l));
  if (operationsManager) return operationsManager;
  throw new Error(
    `No Dispatcher-like role in IAM dropdown. Found: ${trimmed.slice(0, 12).join(", ")}${trimmed.length > 12 ? "…" : ""}`,
  );
}

/** Prefer common org roles; fall back to first option. */
export function pickPreferredRole(roleLabels: string[]): { label: string; index: number } {
  const preferred = [
    /operations manager/i,
    /administrator/i,
    /fleet manager/i,
    /driver/i,
    /dispatcher/i,
  ];
  for (const pattern of preferred) {
    const idx = roleLabels.findIndex((l) => pattern.test(l));
    if (idx >= 0) return { label: roleLabels[idx], index: idx };
  }
  if (!roleLabels.length) throw new Error("No roles available in create-user form");
  return { label: roleLabels[0], index: 0 };
}
