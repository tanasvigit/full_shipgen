import { authStatePath } from '../utils/env';
import { seededUsers } from '../utils/testData';
import { expect, test } from '../fixtures/test';

test.skip(({ isMobile }) => isMobile, 'Desktop auth coverage runs separately from mobile responsiveness.');

test('redirects unauthenticated users away from protected routes', async ({ page, app }) => {
  app.annotate(test.info(), {
    route: '/admin/dashboard',
    page: 'Login',
    severity: 'high',
    coverage: ['auth', 'protected-routes', 'redirects'],
  });

  await page.goto('/admin/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByTestId('login-form')).toBeVisible();
});

test('validates login fields and shows invalid credential errors', async ({ page, runtime, app }) => {
  app.annotate(test.info(), {
    route: '/login',
    page: 'Login',
    severity: 'high',
    coverage: ['auth', 'forms', 'error-states'],
  });

  await page.goto('/login');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('login-error')).toContainText('Please enter email and password');

  await page.getByTestId('login-toggle-password').click();
  await expect(page.getByTestId('login-password')).toHaveAttribute('type', 'text');
  await page.getByTestId('login-toggle-password').click();
  await expect(page.getByTestId('login-password')).toHaveAttribute('type', 'password');

  runtime.allowResponse('/auth/login', [401]);
  runtime.allowConsole('Failed to load resource: the server responded with a status of 401 (Unauthorized)');
  await page.getByTestId('login-email').fill('admin@parkflow.com');
  await page.getByTestId('login-password').fill('wrong-password');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('login-error')).toContainText('Invalid credentials');
});

for (const role of Object.keys(seededUsers) as Array<keyof typeof seededUsers>) {
  test(`logs in and logs out as ${role}`, async ({ app }) => {
    app.annotate(test.info(), {
      route: seededUsers[role].dashboardPath,
      page: seededUsers[role].dashboardHeading,
      severity: 'high',
      coverage: ['auth', 'navigation'],
    });

    await app.loginAs(role);
    await app.logout();
  });
}

test('persists an authenticated operator session after reload', async ({ page, app }) => {
  app.annotate(test.info(), {
    route: seededUsers.operator.dashboardPath,
    page: seededUsers.operator.dashboardHeading,
    severity: 'high',
    coverage: ['auth', 'session-persistence'],
  });

  await app.loginAs('operator');
  await page.reload();
  await expect(page).toHaveURL(/\/operator\/dashboard$/);
  await expect(page.getByRole('heading', { name: seededUsers.operator.dashboardHeading })).toBeVisible();
});

test('redirects stale tokens back to login', async ({ page, runtime, app }) => {
  app.annotate(test.info(), {
    route: '/operator/dashboard',
    page: 'Login',
    severity: 'high',
    coverage: ['auth', 'session-expiration', 'redirects'],
  });

  runtime.allowResponse('/auth/me', [401]);
  runtime.allowConsole('Failed to load resource: the server responded with a status of 401 (Unauthorized)');
  runtime.allowRequestFailure(/fonts\.gstatic\.com/);
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('parkflow_token', 'expired-token');
  });
  await page.goto('/operator/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

test.describe('authorization', () => {
  test.use({ storageState: authStatePath('operator') });

  test('redirects operators away from admin-only pages', async ({ page, app }) => {
    app.annotate(test.info(), {
      route: '/admin/users',
      page: seededUsers.operator.dashboardHeading,
      severity: 'high',
      coverage: ['auth', 'authorization', 'protected-routes'],
    });

    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/operator\/dashboard$/);
    await expect(page.getByRole('heading', { name: seededUsers.operator.dashboardHeading })).toBeVisible();
  });
});
