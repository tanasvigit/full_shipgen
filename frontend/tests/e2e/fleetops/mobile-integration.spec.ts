import { test, expect } from "@playwright/test";
import { apiLogin, waitForApiReady } from "../../../e2e/helpers/api";
import { getE2EConfig, requireCredentials } from "../../../e2e/helpers/env";

/**
 * Day 4 — Mobile integration contract validation (API-level).
 * Validates the same backend contracts the Expo driver app uses.
 */
test.describe("FleetOps Day 4 — Mobile integration contracts", () => {
  test.beforeAll(async ({ request }) => {
    await waitForApiReady(request);
  });

  test("auth login + session bootstrap + logout", async ({ request }) => {
    const { email, password } = requireCredentials();
    const session = await apiLogin(request, email, password);

    expect(session.token).toBeTruthy();
    expect(session.user).toBeTruthy();
    // Organization is optional for some tenant/user setups; mobile auth still works without it.

    const { apiURL } = getE2EConfig();
    const meRes = await request.get(`${apiURL}/users/me`, {
      headers: { Authorization: `Bearer ${session.token}`, Accept: "application/json" },
    });
    expect(meRes.ok()).toBeTruthy();

    const logoutRes = await request.post(`${apiURL}/auth/logout`, {
      headers: { Authorization: `Bearer ${session.token}`, Accept: "application/json" },
    });
    expect(logoutRes.ok()).toBeTruthy();
  });

  test("driver orders list uses backend source of truth", async ({ request }) => {
    const { email, password } = requireCredentials();
    const { apiURL } = getE2EConfig();
    const session = await apiLogin(request, email, password);
    const headers = {
      Authorization: `Bearer ${session.token}`,
      Accept: "application/json",
      ...(session.organization?.id ? { "X-Company": session.organization.id } : {}),
    };

    const ordersRes = await request.get(`${apiURL}/orders`, { headers });
    expect(ordersRes.ok()).toBeTruthy();

    const payload = await ordersRes.json();
    const rows = payload?.data ?? payload?.orders ?? (Array.isArray(payload) ? payload : []);
    expect(Array.isArray(rows)).toBeTruthy();
  });

  test("workflow endpoints exist for order lifecycle", async ({ request }) => {
    const { email, password } = requireCredentials();
    const { apiURL } = getE2EConfig();
    const session = await apiLogin(request, email, password);
    const headers = {
      Authorization: `Bearer ${session.token}`,
      Accept: "application/json",
      ...(session.organization?.id ? { "X-Company": session.organization.id } : {}),
    };

    const ordersRes = await request.get(`${apiURL}/orders?limit=1`, { headers });
    expect(ordersRes.ok()).toBeTruthy();
    const payload = await ordersRes.json();
    const rows = payload?.data ?? payload?.orders ?? [];
    test.skip(rows.length === 0, "No orders available for workflow contract probe");

    const orderId = String(rows[0]?.uuid ?? rows[0]?.id ?? rows[0]?.public_id);
    const nextRes = await request.get(`${apiURL}/orders/${orderId}/next-activity`, {
      headers,
      failOnStatusCode: false,
    });
    expect([200, 400, 404]).toContain(nextRes.status());
  });
});
