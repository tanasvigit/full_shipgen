import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";
import { clearClientSession, loginViaUIWithCredentials, logoutViaUI } from "../helpers/auth";
import { loginAsAdmin, provisionUserForLogin } from "../helpers/iam/usersApi";
import { sel } from "../helpers/selectors";
import {
  E2E_USER_PASSWORD,
  fillCreateUserForm,
  iamUserSeed,
  listRoleOptions,
  openCreateUserDialog,
  resolveDispatcherRoleLabel,
  submitCreateUserForm,
} from "../helpers/iam/userForm";

test.describe("IAM dispatcher user login", () => {
  test("admin creates dispatcher user then new user logs in via UI", async ({ page, request }) => {
    test.setTimeout(120_000);

    const seed = iamUserSeed("Dispatcher");
    const password = E2E_USER_PASSWORD;
    let dispatcherRole = "";

    await gotoRoute(page, "/iam/users");
    await expectPageRoot(page, "users-list-page");

    const create = page.getByTestId("users-create-button");
    if (!(await create.isVisible())) {
      test.skip(true, "Current user cannot create IAM users");
      return;
    }

    await openCreateUserDialog(page);
    const roleLabels = await listRoleOptions(page);
    dispatcherRole = resolveDispatcherRoleLabel(roleLabels);

    await fillCreateUserForm(page, {
      name: "Fleet Dispatcher",
      email: seed.email,
      phone: seed.phone,
      country: "US",
      roleLabel: dispatcherRole,
      password,
      passwordConfirmation: password,
    });
    await submitCreateUserForm(page);

    const adminSession = await loginAsAdmin(request);
    await provisionUserForLogin(request, adminSession, { email: seed.email, password });

    await logoutViaUI(page);
    await clearClientSession(page);
    await expect(page).toHaveURL(/\/auth/, { timeout: 20_000 });

    await page.locator(sel.loginEmail).fill(seed.email);
    await page.locator(sel.loginPassword).fill("WrongPassword!9");
    await page.locator(sel.loginSubmit).click();
    await expect(page.locator(sel.loginError)).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/auth/);

    await loginViaUIWithCredentials(page, seed.email, password);

    await expect(page.getByTestId("console-layout")).toBeVisible();
    await expect(page.locator(sel.loginError)).toHaveCount(0);

    await page.goto("/fleet-ops/operations/orders");
    await expect(page.getByTestId("orders-list-page")).toBeVisible({ timeout: 45_000 });

    await page.goto("/iam/users");
    const onIamUsers = await page
      .getByTestId("users-list-page")
      .isVisible({ timeout: 8000 })
      .catch(() => false);
    if (onIamUsers) {
      await expect(page.getByTestId("users-create-button")).toHaveCount(0);
    } else {
      await expect(page).not.toHaveURL(/\/iam\/users/);
    }
  });
});
