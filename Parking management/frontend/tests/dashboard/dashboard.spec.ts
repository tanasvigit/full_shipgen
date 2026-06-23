import { authStatePath } from '../utils/env';
import { expect, test } from '../fixtures/test';

test.skip(({ isMobile }) => isMobile, 'Desktop dashboard coverage runs separately from mobile responsiveness.');

test.describe('admin dashboard', () => {
  test.use({ storageState: authStatePath('admin') });

  test('renders analytics cards and dashboard actions', async ({ page, app }) => {
    app.annotate(test.info(), {
      route: '/admin/dashboard',
      page: 'Dashboard',
      severity: 'medium',
      coverage: ['dashboard', 'charts', 'buttons'],
    });

    await page.goto('/admin/dashboard');
    await expect(page.getByText('Vehicles Inside')).toBeVisible();
    await expect(page.getByText('Revenue Today')).toBeVisible();
    await expect(page.getByText('Revenue Analytics')).toBeVisible();

    await page.getByRole('button', { name: 'Export' }).click();
    await page.getByRole('button', { name: 'View All' }).first().click();
    await page.getByRole('button', { name: 'Configure' }).click();

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});

test.describe('supervisor dashboard', () => {
  test.use({ storageState: authStatePath('supervisor') });

  test('renders monitoring widgets and alert surfaces', async ({ page, app }) => {
    app.annotate(test.info(), {
      route: '/supervisor/dashboard',
      page: 'Supervisor Dashboard',
      severity: 'medium',
      coverage: ['dashboard', 'monitoring', 'alerts'],
    });

    await page.goto('/supervisor/dashboard');
    await expect(page.getByText('Live Occupancy', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Alerts & Issues' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'QR Scan Activity' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent Tickets Snapshot' })).toBeVisible();
    await expect(page.getByText('Active Operators').first()).toBeVisible();
  });
});

test.describe('operator dashboard', () => {
  test.use({ storageState: authStatePath('operator') });

  test('navigates through operator shortcut flows', async ({ page, app }) => {
    app.annotate(test.info(), {
      route: '/operator/dashboard',
      page: 'Operator Dashboard',
      severity: 'medium',
      coverage: ['dashboard', 'navigation', 'operator-flows'],
    });

    await page.goto('/operator/dashboard');
    await expect(page.getByText('Tickets Today')).toBeVisible();

    await page.getByRole('link', { name: 'New Ticket Issue a parking ticket with QR code' }).click();
    await expect(page).toHaveURL(/\/operator\/new-ticket$/);

    await page.goBack();
    await page.getByRole('link', { name: 'Collect Payment Record payment for unpaid tickets' }).click();
    await expect(page).toHaveURL(/\/operator\/collect-payment$/);

    await page.goBack();
    await page.getByRole('link', { name: 'Vehicle Search Look up active or past tickets' }).click();
    await expect(page).toHaveURL(/\/operator\/vehicle-search$/);
  });
});
