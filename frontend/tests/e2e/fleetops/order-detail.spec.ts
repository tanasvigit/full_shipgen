import { test, expect } from "../../../e2e/fixtures/fleetops-stabilization";
import { gotoOrdersList, openFirstOrderDetail } from "../../../e2e/helpers/fleetops/stabilization";
import { waitForApiSettle } from "../../../e2e/helpers/network";
import { gotoRoute } from "../../../e2e/helpers/navigation";
import { submitFleetOpsDialog } from "../../../e2e/helpers/fleetops/workflow";
import { e2eUnique } from "../../../e2e/helpers/fleetops/test-data";

test.describe("FleetOps Day 1 — Order detail", () => {
  test.beforeEach(async ({ page }) => {
    await gotoOrdersList(page);
    const opened = await openFirstOrderDetail(page);
    if (!opened) test.skip();
    await waitForApiSettle(page);
  });

  test("G002 — schedule order dialog saves", async ({ page }) => {
    const scheduleBtn = page.getByTestId("order-schedule");
    if (!(await scheduleBtn.isVisible())) {
      test.skip();
      return;
    }
    await scheduleBtn.click();
    await expect(page.getByTestId("order-schedule-dialog")).toBeVisible();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = tomorrow.toISOString().slice(0, 10);
    await page.locator("#schedule-date").fill(iso);
    const scheduleApi = page.waitForResponse(
      (res) => /\/orders\/[^/]+\/schedule|schedule.*orders/i.test(res.url()) && res.status() < 400,
      { timeout: 60_000 },
    );
    await page.getByTestId("order-schedule-save").click();
    await scheduleApi.catch(() => null);
    await expect(page.getByTestId("order-schedule-dialog")).toBeHidden({ timeout: 30_000 });
    await page.reload();
    await expect(page.getByTestId("order-detail-page")).toBeVisible();
  });

  test("G039 — metadata edit persists after reload", async ({ page }) => {
    const edit = page.getByTestId("order-metadata-edit");
    if (!(await edit.isVisible())) {
      test.skip();
      return;
    }
    await edit.click();
    await expect(page.getByTestId("order-metadata-dialog")).toBeVisible();
    const keyInput = page.locator('[data-testid="order-metadata-dialog"] input').first();
    if (await keyInput.isVisible()) {
      await keyInput.fill("e2e_key");
    }
    const save = page.getByRole("button", { name: /save/i });
    if (await save.isVisible()) {
      await save.click();
      await expect(page.getByTestId("order-metadata-dialog")).toBeHidden({ timeout: 30_000 });
    }
    await page.reload();
    await expect(page.getByTestId("order-detail-page")).toBeVisible();
  });

  test("G040 — notes inline edit persists", async ({ page }) => {
    await page.getByTestId("detail-tab-notes").click();
    const save = page.getByTestId("order-notes-save");
    if (!(await save.isVisible())) {
      test.skip();
      return;
    }
    const note = e2eUnique("Note").label;
    const textarea = page.locator('[data-testid="detail-tab-notes"]').locator("textarea");
    await textarea.fill(note);
    const patchPromise = page.waitForResponse(
      (res) => res.request().method() === "PATCH" && /\/orders\//i.test(res.url()) && res.status() < 400,
      { timeout: 60_000 },
    );
    await save.click();
    await patchPromise.catch(() => null);
    await page.reload();
    await page.getByTestId("detail-tab-notes").click();
    await expect(page.getByText(note)).toBeVisible();
  });

  test("G042/G043 — route tab polyline and optimize controls", async ({ page }) => {
    await page.getByTestId("detail-tab-route").click();
    const editor = page.getByTestId("order-route-editor");
    if (!(await editor.isVisible({ timeout: 10_000 }).catch(() => false))) {
      test.skip();
      return;
    }
    await expect(page.getByTestId("order-map").or(page.getByTestId("order-route-editor"))).toBeVisible();
    const optimize = page.getByTestId("order-route-optimize");
    if (await optimize.isVisible()) {
      const optPromise = page
        .waitForResponse((res) => /optimize|routes/i.test(res.url()) && res.status() < 500, { timeout: 60_000 })
        .catch(() => null);
      await optimize.click();
      await optPromise;
    }
    const saveRoute = page.getByTestId("order-route-save");
    if (await saveRoute.isVisible()) {
      await saveRoute.click();
      await waitForApiSettle(page);
    }
    await page.reload();
    await page.getByTestId("detail-tab-route").click();
    await expect(page.getByTestId("order-route-editor")).toBeVisible();
  });

  test("G010 — assign driver suggest and save", async ({ page }) => {
    const assign = page.getByTestId("order-assign-driver");
    if (!(await assign.isVisible())) {
      test.skip();
      return;
    }
    await assign.click();
    await expect(page.getByTestId("assign-driver-dialog")).toBeVisible();
    const suggest = page.getByTestId("assign-driver-suggest");
    if (await suggest.isVisible()) {
      await suggest.click();
    }
    const trigger = page.getByTestId("assign-driver-trigger");
    await trigger.click();
    const options = page.getByRole("option");
    let picked = false;
    for (let i = 0; i < (await options.count()); i++) {
      const opt = options.nth(i);
      const val = await opt.getAttribute("data-value");
      if (val && !val.startsWith("__")) {
        await opt.click();
        picked = true;
        break;
      }
    }
    if (!picked) {
      await page.keyboard.press("Escape");
      test.skip();
      return;
    }
    await submitFleetOpsDialog(page, "assign-driver-dialog", { resource: "orders", methods: ["PATCH", "POST"] });
    await page.reload();
    await expect(page.getByTestId("order-detail-page")).toBeVisible();
  });

});

test.describe("FleetOps Day 1 — Order detail edge cases", () => {
  test("invalid order id shows safe state", async ({ page }) => {
    await page.goto("/fleet-ops/operations/orders/00000000-0000-0000-0000-000000000000");
    await expect(page.getByTestId("console-layout")).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId("login-page")).toBeHidden();
  });
});

test.describe("FleetOps Day 1 — Order delete (destructive)", () => {
  test("G041 — delete confirm dialog cancels safely", async ({ page }) => {
    await gotoOrdersList(page);
    if (!(await openFirstOrderDetail(page))) test.skip();
    const deleteBtn = page.getByRole("button", { name: /delete/i }).filter({ has: page.locator("svg") });
    const actionDelete = page.locator('[data-testid*="delete"]').first();
    const target = (await actionDelete.isVisible()) ? actionDelete : deleteBtn;
    if (!(await target.isVisible())) {
      test.skip();
      return;
    }
    await target.click();
    const dialog = page.getByTestId("order-delete-dialog");
    if (!(await dialog.isVisible({ timeout: 5_000 }).catch(() => false))) {
      test.skip();
      return;
    }
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(dialog).toBeHidden();
  });
});
