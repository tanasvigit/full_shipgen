import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";
import { apiLogin } from "../helpers/api";
import { loginAsAdmin, provisionUserForLogin } from "../helpers/iam/usersApi";
import {
  dismissOnboardingChecklist,
  findUsersTableRow,
  openChangePasswordFromUsersList,
  readUserEmailFromRow,
  submitChangePasswordDialog,
} from "../helpers/iam/changePassword";
import { E2E_USER_PASSWORD } from "../helpers/iam/userForm";

const TARGET_QUERY = process.env.E2E_IAM_USER_QUERY || "prasanth";

test.describe("IAM change user password", () => {
  test.beforeEach(async ({ page }) => {
    await gotoRoute(page, "/iam/users");
    await expectPageRoot(page, "users-list-page");
    await dismissOnboardingChecklist(page);
  });

  test.afterEach(async ({ page }) => {
    await page.keyboard.press("Escape");
    const dialog = page.getByTestId("change-user-password-dialog");
    if (await dialog.isVisible().catch(() => false)) {
      await page.getByTestId("change-user-password-dialog").getByRole("button", { name: /cancel/i }).click();
    }
  });

  test("admin changes password from users list row actions", async ({ page, request }) => {
    const opened = await openChangePasswordFromUsersList(page, { searchQuery: TARGET_QUERY });
    if (!opened.canChangePassword) {
      test.skip(true, "Current user cannot change passwords for IAM users");
      return;
    }

    const email = await readUserEmailFromRow(opened.row);
    expect(email).toMatch(/@/);

    await submitChangePasswordDialog(page, E2E_USER_PASSWORD);

    const adminSession = await loginAsAdmin(request);
    await provisionUserForLogin(request, adminSession, { email, password: E2E_USER_PASSWORD });

    const session = await apiLogin(request, email, E2E_USER_PASSWORD);
    expect(session.token).toBeTruthy();
  });

});
