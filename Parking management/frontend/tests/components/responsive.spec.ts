import { authStatePath, testEnv } from '../utils/env';
import { expect, test } from '../fixtures/test';

test.describe('responsive behavior', () => {
  test.skip(({ isMobile }) => !isMobile, 'Responsive checks target the mobile project only.');

  test.use({ storageState: authStatePath('operator') });

  test('supports mobile sidebar navigation', async ({ page, app }) => {
    app.annotate(test.info(), {
      route: '/operator/dashboard',
      page: 'Operator Dashboard',
      severity: 'medium',
      coverage: ['responsive', 'navigation', 'mobile'],
    });

    await page.goto('/operator/dashboard');
    await page.getByTestId('header-menu-button').click();
    await expect(page.getByTestId('mobile-sidebar-overlay')).toBeVisible();

    await page.getByTestId('nav-link-operator-new-ticket').click();
    await expect(page).toHaveURL(/\/operator\/new-ticket$/);
    await expect(page.getByTestId('page-header').getByRole('heading', { name: 'New Ticket' })).toBeVisible();
  });

  test('renders the login form cleanly on mobile', async ({ browser, app }) => {
    app.annotate(test.info(), {
      route: '/login',
      page: 'Login',
      severity: 'medium',
      coverage: ['responsive', 'auth', 'mobile'],
    });

    const context = await browser.newContext({ baseURL: testEnv.baseURL });
    const page = await context.newPage();

    await page.goto('/login');
    await expect(page.getByTestId('login-card')).toBeVisible();
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('quick-login-admin')).toBeVisible();
    await expect(page.getByTestId('quick-login-supervisor')).toBeVisible();
    await expect(page.getByTestId('quick-login-operator')).toBeVisible();

    await context.close();
  });
});
