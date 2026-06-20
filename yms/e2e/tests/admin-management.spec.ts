import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

import { YMS_DEMO_USERS, fillYmsLoginForm } from "../helpers/demo-credentials";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByTestId("login-form").waitFor({ state: "visible", timeout: 20_000 });
  await fillYmsLoginForm(page, YMS_DEMO_USERS.yard_admin.email, YMS_DEMO_USERS.yard_admin.password);
  await page.waitForURL((url) => !url.pathname.endsWith("/login"), { timeout: 30_000 });
}

const SHOT_DIR = path.join(__dirname, "..", "screenshots", "admin-management");

test.describe("Admin management UX enhancements", () => {
  test("User management add/edit/status and role business view", async ({ page }) => {
    fs.mkdirSync(SHOT_DIR, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await loginAsAdmin(page);

    await page.goto("/admin/users", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "User Management" })).toBeVisible();
    await expect(page.getByTestId("add-user-btn")).toBeVisible();

    await page.getByTestId("add-user-btn").click();
    const createDialog = page.getByRole("dialog").first();
    await createDialog.getByLabel("Full Name", { exact: true }).fill("Demo Operations Lead");
    await createDialog.getByLabel("Username", { exact: true }).fill("demoops");
    await createDialog.getByLabel("Email", { exact: true }).fill("demoops@yardos.demo");
    await createDialog.locator("select").first().selectOption("yard_manager");
    await createDialog.getByLabel("Password", { exact: true }).fill("demo123");
    await createDialog.getByLabel("Confirm Password", { exact: true }).fill("demo123");
    await page.getByRole("button", { name: "Create User" }).click();
    await expect(page.getByText("Demo Operations Lead")).toBeVisible();

    await page.getByRole("button", { name: "Edit User" }).last().click();
    await page.getByLabel("Full Name").fill("Demo Ops Lead Updated");
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText("Demo Ops Lead Updated")).toBeVisible();

    await page.getByRole("button", { name: "Deactivate" }).last().click();
    await expect(page.getByText("Inactive").last()).toBeVisible();

    await page.screenshot({ path: path.join(SHOT_DIR, "users-after.png"), fullPage: true });

    await page.goto("/admin/roles", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Role Management" })).toBeVisible();
    await expect(page.getByText("Dock Supervisor")).toBeVisible();
    await expect(page.getByText("Modules Accessible")).toBeVisible();
    await expect(page.getByText("Actions Allowed")).toBeVisible();
    await expect(page.getByText("flow.assign_dock")).toHaveCount(0);
    await expect(page.getByText("dock.write")).toHaveCount(0);
    await expect(page.getByText("yard_event.write")).toHaveCount(0);

    await page.getByRole("tab", { name: "Access Matrix" }).click();
    await expect(page.getByRole("heading", { name: "Access Matrix" })).toBeVisible();
    await expect(page.getByText("Full Access").first()).toBeVisible();
    await expect(page.getByText("View Only").first()).toBeVisible();
    await expect(page.getByText("No Access").first()).toBeVisible();

    await page.screenshot({ path: path.join(SHOT_DIR, "roles-after.png"), fullPage: true });
  });
});
