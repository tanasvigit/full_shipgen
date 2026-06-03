import { test, expect } from "../fixtures/test";
import { gotoRoute, expectPageRoot } from "../helpers/navigation";
import { expectDataTableReady, searchDataTable } from "../helpers/page";
import {
  attachFirstPolicyIfAvailable,
  fillCreateUserForm,
  iamUserSeed,
  listRoleOptions,
  openCreateUserDialog,
  pickPreferredRole,
  selectRoleByLabel,
  submitCreateUserForm,
  toggleFirstDirectPermission,
} from "../helpers/iam/userForm";

test.describe("IAM create user", () => {
  test.beforeEach(async ({ page }) => {
    await gotoRoute(page, "/iam/users");
    await expectPageRoot(page, "users-list-page");
  });

  test("role dropdown lists assignable roles", async ({ page }) => {
    const create = page.getByTestId("users-create-button");
    if (!(await create.isVisible())) {
      test.skip(true, "Current user cannot create IAM users");
      return;
    }

    await openCreateUserDialog(page);
    const roleLabels = await listRoleOptions(page);
    expect(roleLabels.length).toBeGreaterThan(0);
    roleLabels.forEach((label) => {
      expect(label.length).toBeGreaterThan(0);
    });

    await page.getByTestId("user-form-dialog").getByRole("button", { name: /cancel/i }).click();
  });

  test("creates user with role, profile, policy, and direct permission", async ({ page }) => {
    const create = page.getByTestId("users-create-button");
    if (!(await create.isVisible())) {
      test.skip(true, "Current user cannot create IAM users");
      return;
    }

    const seed = iamUserSeed("IAMUser");
    const country = "US";

    await openCreateUserDialog(page);

    const roleLabels = await listRoleOptions(page);
    const { label: roleLabel } = pickPreferredRole(roleLabels);

    await fillCreateUserForm(page, {
      name: seed.name,
      email: seed.email,
      phone: seed.phone,
      country,
      roleLabel,
    });

    await attachFirstPolicyIfAvailable(page);
    await toggleFirstDirectPermission(page);

    await submitCreateUserForm(page);

    await expectDataTableReady(page, "users-table");
    await searchDataTable(page, seed.email, "users-table");

    const row = page.locator('[data-testid^="users-table-row-"]').filter({ hasText: seed.email }).first();
    await expect(row).toBeVisible({ timeout: 20_000 });
    await row.click();

    await expectPageRoot(page, "user-detail-page");
    await expect(page.getByTestId("user-email")).toHaveValue(seed.email);
    await expect(page.getByTestId("user-name")).toHaveValue(seed.name);

    const roleTrigger = page.getByTestId("user-role-select");
    await expect(roleTrigger).toContainText(roleLabel, { timeout: 10_000 });

    const accessCard = page.getByTestId("user-access-control-card");
    if (await accessCard.isVisible()) {
      await expect(page.getByTestId("user-policy-attacher")).toBeVisible();
    }
  });

  test("can assign each listed role when creating users", async ({ page }) => {
    test.setTimeout(180_000);
    const create = page.getByTestId("users-create-button");
    if (!(await create.isVisible())) {
      test.skip(true, "Current user cannot create IAM users");
      return;
    }

    await openCreateUserDialog(page);
    const roleLabels = await listRoleOptions(page);
    expect(roleLabels.length).toBeGreaterThan(0);

    const rolesToExercise = roleLabels.slice(0, Math.min(roleLabels.length, 6));

    for (let i = 0; i < rolesToExercise.length; i += 1) {
      const roleLabel = rolesToExercise[i];
      const seed = iamUserSeed(`Role${i}`);

      if (i > 0) {
        await openCreateUserDialog(page);
      }

      await fillCreateUserForm(page, {
        name: `Fleet IAM ${roleLabel.replace(/[^a-zA-Z\s]/g, "").slice(0, 40)}`,
        email: seed.email,
        phone: seed.phone,
        country: "US",
      });
      await selectRoleByLabel(page, roleLabel);

      await submitCreateUserForm(page);

      await expectDataTableReady(page, "users-table");
      await searchDataTable(page, seed.email, "users-table");

      const row = page.locator('[data-testid^="users-table-row-"]').filter({ hasText: seed.email }).first();
      await expect(row).toBeVisible({ timeout: 25_000 });
      await row.click();
      await expectPageRoot(page, "user-detail-page");
      await expect(page.getByTestId("user-role-select")).toContainText(roleLabel, { timeout: 10_000 });
      await page.goto("/iam/users");
      await expectPageRoot(page, "users-list-page");
    }
  });
});
