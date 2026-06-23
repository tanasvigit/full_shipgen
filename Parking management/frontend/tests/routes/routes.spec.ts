import { authStatePath, type AppRole } from '../utils/env';
import { routesByRole } from '../utils/routeInventory';
import { expect, test } from '../fixtures/test';

test.skip(({ isMobile }) => isMobile, 'Desktop route smoke coverage runs separately from mobile responsiveness.');

function navTestIdForPath(routePath: string): string {
  return `nav-link-${routePath.replaceAll('/', '-').replace(/^-/, '')}`;
}

for (const role of Object.keys(routesByRole) as AppRole[]) {
  test.describe(`${role} route coverage`, () => {
    test.use({ storageState: authStatePath(role) });

    for (const route of routesByRole[role]) {
      test(`loads ${route.path} without runtime failures`, async ({ page, app }) => {
        app.annotate(test.info(), {
          route: route.path,
          page: route.heading,
          severity: 'medium',
          coverage: ['route', 'navigation', ...route.coverage],
        });

        await page.goto(route.path);
        await expect(page).toHaveURL(new RegExp(`${route.path.replace(/\//g, '\\/')}$`));
        await expect(page.getByTestId('page-header').getByRole('heading', { name: route.heading })).toBeVisible();
        await expect(page.getByTestId('page-header')).toBeVisible();
      });
    }

    test(`supports sidebar navigation and browser history for ${role}`, async ({ page, app }) => {
      const [firstRoute, secondRoute, thirdRoute] = routesByRole[role];

      app.annotate(test.info(), {
        route: firstRoute.path,
        page: firstRoute.heading,
        severity: 'medium',
        coverage: ['route', 'navigation', 'history'],
      });

      await page.goto(firstRoute.path);
      await page.getByTestId(navTestIdForPath(secondRoute.path)).click();
      await expect(page).toHaveURL(new RegExp(`${secondRoute.path.replace(/\//g, '\\/')}$`));
      await expect(page.getByTestId('page-header').getByRole('heading', { name: secondRoute.heading })).toBeVisible();

      await page.getByTestId(navTestIdForPath(thirdRoute.path)).click();
      await expect(page).toHaveURL(new RegExp(`${thirdRoute.path.replace(/\//g, '\\/')}$`));
      await expect(page.getByTestId('page-header').getByRole('heading', { name: thirdRoute.heading })).toBeVisible();

      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`${secondRoute.path.replace(/\//g, '\\/')}$`));

      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`${firstRoute.path.replace(/\//g, '\\/')}$`));

      await page.goForward();
      await expect(page).toHaveURL(new RegExp(`${secondRoute.path.replace(/\//g, '\\/')}$`));
    });
  });
}
