import { expect, type Locator, type Page } from "@playwright/test";

/** Expand collapsed FleetOps form sections so hidden selects can be exercised. */
export async function expandClosedFormSections(scope: Locator) {
  for (let pass = 0; pass < 4; pass++) {
    const closed = scope.locator('[data-state="closed"]');
    const count = await closed.count();
    if (count === 0) break;
    for (let i = 0; i < count; i++) {
      const section = closed.nth(i);
      const trigger = section.locator("button").first();
      if (await trigger.isVisible().catch(() => false)) {
        await trigger.click();
      }
    }
    await scope.page().waitForTimeout(150);
  }
}

/**
 * Click each visible combobox in scope and assert the Radix listbox opens with options.
 * Closes with Escape before moving to the next control.
 */
export async function assertAllSelectDropdownsOpen(
  page: Page,
  scope: Locator,
  options: { label?: string } = {},
) {
  await expandClosedFormSections(scope);

  const failures: string[] = [];
  let exercised = 0;
  let index = 0;

  // Re-query each iteration — Escape can close the parent dialog if pressed twice.
  while (index < 32) {
    const triggers = scope.getByRole("combobox");
    const count = await triggers.count();
    if (index >= count) break;

    const trigger = triggers.nth(index);
    index += 1;

    const visible = await trigger.isVisible().catch(() => false);
    if (!visible) continue;
    if (await trigger.isDisabled().catch(() => false)) continue;

    const testId = (await trigger.getAttribute("data-testid")) || `combobox-${index}`;
    const name = options.label ? `${options.label} · ${testId}` : testId;

    try {
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click({ timeout: 10_000 });

      const listbox = page.getByRole("listbox").last();
      await expect(listbox).toBeVisible({ timeout: 8_000 });
      const optionCount = await listbox.getByRole("option").count();
      if (optionCount < 1) {
        failures.push(`${name}: listbox had no options`);
      } else {
        await expect(listbox.getByRole("option").first()).toBeVisible();
      }

      // Blur select without sending Escape (which may close stacked modals).
      const dismissTarget = scope.locator('[class*="font-semibold"]').first();
      if (await dismissTarget.isVisible().catch(() => false)) {
        await dismissTarget.click({ force: true });
      } else {
        await page.mouse.click(8, 8);
      }
      await expect(listbox).toBeHidden({ timeout: 5_000 });
      exercised += 1;
    } catch (err) {
      failures.push(`${name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (failures.length) {
    throw new Error(`Select dropdown(s) failed to open:\n${failures.join("\n")}`);
  }

  expect(exercised).toBeGreaterThan(0);
}

/** Radix dropdown-menu (e.g. detail drawer “more” menu). */
export async function assertDropdownMenuOpens(page: Page, trigger: Locator) {
  await trigger.click();
  const menu = page.getByRole("menu").last();
  await expect(menu).toBeVisible({ timeout: 8_000 });
  const items = menu.getByRole("menuitem");
  await expect(items.first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden({ timeout: 5_000 });
}
