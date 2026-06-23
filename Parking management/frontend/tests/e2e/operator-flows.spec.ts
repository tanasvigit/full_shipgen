import { createTicketViaApi } from '../utils/auth';
import { authStatePath } from '../utils/env';
import { buildAutomationVehicle } from '../utils/testData';
import { expect, test } from '../fixtures/test';

test.skip(({ isMobile }) => isMobile, 'Desktop operator flow coverage runs separately from mobile responsiveness.');

test.describe('operator transactional flows', () => {
  test.use({ storageState: authStatePath('operator') });

  test('creates a paid ticket, searches it, and loads the print preview', async ({ page, app }) => {
    const vehicleNumber = buildAutomationVehicle('AP');

    app.annotate(test.info(), {
      route: '/operator/new-ticket',
      page: 'New Ticket',
      severity: 'high',
      coverage: ['ticketing', 'search', 'qr', 'printing'],
    });

    await page.goto('/operator/new-ticket');
    await page.getByTestId('vehicle-number-input').fill(vehicleNumber);
    await page.getByTestId('vehicle-type-select').selectOption('4 Wheeler');
    await page.getByTestId('entry-type-select').selectOption('Paid Entry');
    await page.getByTestId('payment-method-select').selectOption('UPI');
    await page.getByTestId('generate-ticket-button').click();

    const preview = page.getByTestId('ticket-preview');
    await expect(preview).toContainText(vehicleNumber);
    await expect(preview).toContainText('Amount Paid');

    await page.goto('/operator/vehicle-search');
    await page.getByTestId('vehicle-search-input').fill(vehicleNumber);
    const resultRow = page.getByTestId('vehicle-search-result-row').filter({ hasText: vehicleNumber }).first();
    await expect(resultRow).toContainText('Paid');

    await page.goto('/operator/recent-tickets');
    await expect(page.getByTestId('recent-ticket-row').filter({ hasText: vehicleNumber }).first()).toBeVisible();

    await page.goto('/operator/qr-print');
    await page.getByTestId('qr-print-ticket-option').filter({ hasText: vehicleNumber }).first().click();
    await expect(page.getByTestId('ticket-preview')).toContainText(vehicleNumber);
    await expect(page.getByTestId('ticket-print-button')).toBeVisible();
  });

  test('collects payment for an unpaid ticket seeded by API', async ({ page, api, app }) => {
    const vehicleNumber = buildAutomationVehicle('MH');
    const createdTicket = (await createTicketViaApi(api, 'operator', {
      vehicleNumber,
      category: 'Heavy Vehicles',
      entryType: 'Paid Entry',
      paymentMethod: 'Cash',
      pay_now: false,
    })) as { id: string };

    app.annotate(test.info(), {
      route: '/operator/collect-payment',
      page: 'Collect Payment',
      severity: 'high',
      coverage: ['payments', 'search', 'crud'],
    });

    await page.goto('/operator/collect-payment');
    await page.getByTestId('collect-payment-search-input').fill(vehicleNumber);

    const unpaidRow = page.getByTestId('unpaid-ticket-row').filter({ hasText: vehicleNumber }).first();
    await expect(unpaidRow).toContainText(createdTicket.id);
    await unpaidRow.getByTestId('collect-payment-button').click();
    await expect(page.getByTestId('unpaid-ticket-row').filter({ hasText: vehicleNumber })).toHaveCount(0);

    await page.goto('/operator/vehicle-search');
    await page.getByTestId('vehicle-search-input').fill(vehicleNumber);
    await expect(page.getByTestId('vehicle-search-result-row').filter({ hasText: vehicleNumber }).first()).toContainText(
      'Paid',
    );
  });
});
