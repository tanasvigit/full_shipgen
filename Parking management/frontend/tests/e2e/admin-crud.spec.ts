import { authStatePath } from '../utils/env';
import { buildAutomationFloor, buildAutomationUser } from '../utils/testData';
import { expect, test } from '../fixtures/test';

test.skip(({ isMobile }) => isMobile, 'Desktop CRUD coverage runs separately from mobile responsiveness.');

test.describe('admin CRUD flows', () => {
  test.use({ storageState: authStatePath('admin') });

  test('creates, updates, deactivates, and deletes a user', async ({ page, app }) => {
    const user = buildAutomationUser();

    app.annotate(test.info(), {
      route: '/admin/users',
      page: 'Employee Management',
      severity: 'high',
      coverage: ['crud', 'forms', 'table', 'modal'],
    });

    await page.goto('/admin/users');
    await page.getByTestId('add-user-button').click();
    await page.getByTestId('user-form-name').fill(user.name);
    await page.getByTestId('user-form-email').fill(user.email);
    await page.getByTestId('user-form-password').fill(user.password);
    await page.getByTestId('user-form-role').selectOption('operator');
    await page.getByTestId('user-form-submit').click();

    await expect(page.getByTestId('user-modal')).toBeHidden({ timeout: 15_000 });
    await page.getByTestId('user-search-input').fill(user.email);

    const createdRow = page.getByTestId('user-row').filter({ hasText: user.email }).first();
    await expect(createdRow).toContainText(user.name, { timeout: 15_000 });

    await createdRow.getByTestId('user-actions-button').click();
    await page.getByTestId('edit-user-button').click();
    await page.getByTestId('user-form-name').fill(user.updatedName);
    await page.getByTestId('user-form-role').selectOption('supervisor');
    await page.getByTestId('user-form-submit').click();

    await expect(createdRow).toContainText(user.updatedName);
    await expect(createdRow).toContainText('Supervisor');

    page.once('dialog', (dialog) => dialog.accept());
    await createdRow.getByTestId('user-actions-button').click();
    await page.getByTestId('toggle-user-status-button').click();
    await expect(createdRow).toContainText('Inactive');

    page.once('dialog', (dialog) => dialog.accept());
    await createdRow.getByTestId('user-actions-button').click();
    await page.getByTestId('delete-user-button').click();
    await expect(createdRow).toHaveCount(0);
  });

  test('updates pricing and restores the original value', async ({ page, app }) => {
    app.annotate(test.info(), {
      route: '/admin/pricing',
      page: 'Pricing',
      severity: 'high',
      coverage: ['crud', 'pricing', 'forms'],
    });

    await page.goto('/admin/pricing');

    const twoWheelerCard = page.getByTestId('pricing-card').filter({ hasText: '2 Wheeler' }).first();
    const basePriceInput = twoWheelerCard.getByTestId('pricing-base-price-input');
    const saveButton = page.getByTestId('pricing-save-button');
    const originalValue = Number(await basePriceInput.inputValue());
    const updatedValue = originalValue + 1;

    await basePriceInput.fill(String(updatedValue));
    await saveButton.click();
    await expect(saveButton).toHaveText('Save Changes', { timeout: 15_000 });
    await page.reload();
    await expect(twoWheelerCard.getByTestId('pricing-base-price-input')).toHaveValue(String(updatedValue));

    const refreshedBasePriceInput = twoWheelerCard.getByTestId('pricing-base-price-input');
    await refreshedBasePriceInput.fill(String(originalValue));
    await saveButton.click();
    await expect(saveButton).toHaveText('Save Changes', { timeout: 15_000 });
    await page.reload();
    await expect(twoWheelerCard.getByTestId('pricing-base-price-input')).toHaveValue(String(originalValue));
  });

  test('creates, edits, and removes a parking floor', async ({ page, app }) => {
    const floor = buildAutomationFloor();

    app.annotate(test.info(), {
      route: '/admin/parking-floors',
      page: 'Floor Management',
      severity: 'high',
      coverage: ['crud', 'floors', 'forms', 'table'],
    });

    await page.goto('/admin/parking-floors');
    await page.getByTestId('floor-name-input').fill(floor.name);
    await page.getByTestId('floor-two-wheeler-input').fill(floor.twoWheelerCapacity);
    await page.getByTestId('floor-four-wheeler-input').fill(floor.fourWheelerCapacity);
    await page.getByTestId('floor-heavy-vehicle-input').fill(floor.heavyVehicleCapacity);
    await page.getByTestId('add-floor-button').click();

    const createdFloorRow = page.getByTestId('floor-row').filter({ hasText: floor.name }).first();
    await expect(createdFloorRow).toContainText(floor.name);

    await createdFloorRow.getByTestId('edit-floor-button').click();
    const editingFloorRow = page.getByTestId('floor-row').filter({ has: page.getByTestId('save-floor-button') }).first();
    await editingFloorRow.locator('input').nth(0).fill(floor.updatedName);
    await editingFloorRow.locator('input').nth(1).fill('14');
    await editingFloorRow.locator('input').nth(2).fill('10');
    await editingFloorRow.locator('input').nth(3).fill('6');
    await editingFloorRow.getByTestId('save-floor-button').click();

    const updatedFloorRow = page.getByTestId('floor-row').filter({ hasText: floor.updatedName }).first();
    await expect(updatedFloorRow).toContainText(floor.updatedName);
    await expect(updatedFloorRow).toContainText('0/14');

    page.once('dialog', (dialog) => dialog.accept());
    await updatedFloorRow.getByTestId('remove-floor-button').click();
    await expect(page.getByTestId('floor-row').filter({ hasText: floor.updatedName })).toHaveCount(0);
  });
});
