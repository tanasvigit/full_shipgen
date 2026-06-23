import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { authStatePath, toAppOrigin, type AppRole } from './env';
import { seededUsers } from './testData';

interface LoginResponse {
  access_token: string;
}

interface CreateTicketPayload {
  vehicleNumber: string;
  category: '2 Wheeler' | '4 Wheeler' | 'Heavy Vehicles';
  entryType: 'Paid Entry' | 'Free Entry';
  paymentMethod?: 'Cash' | 'UPI' | 'Card';
  pay_now?: boolean;
}

export async function fetchAccessToken(request: APIRequestContext, role: AppRole): Promise<string> {
  const response = await request.post('auth/login', {
    data: {
      email: seededUsers[role].email,
      password: seededUsers[role].password,
    },
  });

  expect(response.ok(), `Expected seeded login for ${role} to succeed`).toBeTruthy();
  const body = (await response.json()) as LoginResponse;
  return body.access_token;
}

export async function writeStorageStateForRole(request: APIRequestContext, role: AppRole) {
  const token = await fetchAccessToken(request, role);
  const outputPath = authStatePath(role);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(
    outputPath,
    JSON.stringify(
      {
        cookies: [],
        origins: [
          {
            origin: toAppOrigin(),
            localStorage: [{ name: 'parkflow_token', value: token }],
          },
        ],
      },
      null,
      2,
    ),
  );
}

export async function loginViaUi(page: Page, role: AppRole) {
  const account = seededUsers[role];

  await page.goto('/login');
  await page.getByTestId(`quick-login-${role}`).click();
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(new RegExp(`${account.dashboardPath.replace(/\//g, '\\/')}$`));
  await expect(page.getByRole('heading', { name: account.dashboardHeading })).toBeVisible();
}

export async function logoutViaUi(page: Page) {
  await page.getByTestId('logout-button').click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function createTicketViaApi(
  request: APIRequestContext,
  role: Extract<AppRole, 'admin' | 'operator'>,
  payload: CreateTicketPayload,
) {
  const token = await fetchAccessToken(request, role);
  const response = await request.post('tickets', {
    data: payload,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(response.ok(), 'Expected automation ticket seeding to succeed').toBeTruthy();
  return response.json();
}
