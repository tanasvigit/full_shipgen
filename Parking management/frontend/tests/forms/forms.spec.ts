import { authStatePath } from '../utils/env';
import { buildAutomationUser } from '../utils/testData';
import { expect, test } from '../fixtures/test';

test.skip(({ isMobile }) => isMobile, 'Desktop form coverage runs separately from mobile responsiveness.');

test.describe('admin forms', () => {
  test.use({ storageState: authStatePath('admin') });

  test('validates user creation requirements and password length', async ({ page, app }) => {
    app.annotate(test.info(), {
      route: '/admin/users',
      page: 'Employee Management',
      severity: 'high',
      coverage: ['forms', 'validation', 'crud'],
    });

    await page.goto('/admin/users');
    await page.getByTestId('add-user-button').click();
    await page.getByTestId('user-form-submit').click();
    await expect(page.getByTestId('user-form-error')).toContainText('Name, email, and password are required');

    await page.getByTestId('user-form-name').fill('Playwright Validation');
    await page.getByTestId('user-form-email').fill('validation@parkflow.test');
    await page.getByTestId('user-form-password').fill('123');
    await page.getByTestId('user-form-submit').click();
    await expect(page.getByTestId('user-form-error')).toContainText('Password must be at least 6 characters');
  });

  test('resets the user modal when cancelled', async ({ page, app }) => {
    const user = buildAutomationUser();

    app.annotate(test.info(), {
      route: '/admin/users',
      page: 'Employee Management',
      severity: 'medium',
      coverage: ['forms', 'cancel', 'modal'],
    });

    await page.goto('/admin/users');
    await page.getByTestId('add-user-button').click();
    await page.getByTestId('user-form-name').fill(user.name);
    await page.getByTestId('user-form-email').fill(user.email);
    await page.getByTestId('user-form-password').fill(user.password);
    await page.getByTestId('user-form-cancel').click();

    await expect(page.getByTestId('user-modal')).toBeHidden();

    await page.getByTestId('add-user-button').click();
    await expect(page.getByTestId('user-form-name')).toHaveValue('');
    await expect(page.getByTestId('user-form-email')).toHaveValue('');
    await expect(page.getByTestId('user-form-password')).toHaveValue('');
  });
});

test.describe('operator forms', () => {
  test.use({ storageState: authStatePath('operator') });

  test('toggles payment method based on entry type', async ({ page, app }) => {
    app.annotate(test.info(), {
      route: '/operator/new-ticket',
      page: 'New Ticket',
      severity: 'medium',
      coverage: ['forms', 'conditional-fields', 'ticketing'],
    });

    await page.goto('/operator/new-ticket');
    await expect(page.getByTestId('payment-method-select')).toBeVisible();

    await page.getByTestId('entry-type-select').selectOption('Free Entry');
    await expect(page.getByTestId('payment-method-select')).toBeHidden();

    await page.getByTestId('entry-type-select').selectOption('Paid Entry');
    await expect(page.getByTestId('payment-method-select')).toBeVisible();
  });

  test('renders account settings profile and password forms', async ({ page, app }) => {
    app.annotate(test.info(), {
      route: '/operator/settings',
      page: 'Settings',
      severity: 'low',
      coverage: ['forms', 'settings'],
    });

    await page.goto('/operator/settings');
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Change Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update Password' })).toBeVisible();
  });
});
