import type { APIRequestContext } from "@playwright/test";
import { getE2EConfig } from "./env";

export type SessionPayload = {
  token: string;
  user: Record<string, unknown>;
  organization: { id: string; uuid: string; name: string } | null;
};

export async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<SessionPayload> {
  const { apiURL } = getE2EConfig();

  const loginRes = await request.post(`${apiURL}/auth/login`, {
    data: { identity: email, password, remember: true },
  });

  if (!loginRes.ok()) {
    const body = await loginRes.text();
    throw new Error(`API login failed (${loginRes.status()}): ${body}`);
  }

  const loginJson = (await loginRes.json()) as {
    token?: string;
    isEnabled?: boolean;
    twoFaSession?: string;
  };

  if (loginJson.isEnabled && loginJson.twoFaSession) {
    throw new Error("E2E user has 2FA enabled. Use an account without 2FA for automated tests.");
  }

  const token = loginJson.token;
  if (!token) {
    throw new Error("API login succeeded but no token was returned.");
  }

  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };

  const [meRes, orgsRes] = await Promise.all([
    request.get(`${apiURL}/users/me`, { headers }),
    request.get(`${apiURL}/auth/organizations`, { headers }),
  ]);

  if (!meRes.ok()) {
    throw new Error(`users/me failed (${meRes.status()}): ${await meRes.text()}`);
  }
  if (!orgsRes.ok()) {
    throw new Error(`auth/organizations failed (${orgsRes.status()}): ${await orgsRes.text()}`);
  }

  const mePayload = (await meRes.json()) as { user?: Record<string, unknown> };
  const user = mePayload.user ?? (mePayload as Record<string, unknown>);
  const orgsPayload = (await orgsRes.json()) as {
    organizations?: unknown[];
    companies?: unknown[];
    data?: unknown[];
  };

  const orgList =
    orgsPayload.organizations ??
    orgsPayload.companies ??
    (Array.isArray(orgsPayload.data) ? orgsPayload.data : []);

  const firstOrg = (orgList[0] ?? null) as Record<string, unknown> | null;
  const organization = firstOrg
    ? {
        id: String(firstOrg.uuid ?? firstOrg.id ?? firstOrg.public_id ?? ""),
        uuid: String(firstOrg.uuid ?? firstOrg.id ?? ""),
        name: String(firstOrg.name ?? firstOrg.company_name ?? "Organization"),
      }
    : null;

  return { token, user, organization };
}

/** Wait until API accepts login requests (any non-network response). */
export async function waitForApiReady(request: APIRequestContext, timeoutMs = 30_000) {
  const { apiURL } = getE2EConfig();
  const deadline = Date.now() + timeoutMs;
  let lastError = "unknown";

  while (Date.now() < deadline) {
    try {
      const res = await request.post(`${apiURL}/auth/login`, {
        data: { identity: "__e2e_probe__", password: "x" },
        failOnStatusCode: false,
        timeout: 10_000,
      });
      if (res.status() >= 200 && res.status() < 500) {
        return;
      }
      lastError = `status ${res.status()}`;
    } catch (e) {
      lastError = String(e);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error(`API not ready at ${apiURL} within ${timeoutMs}ms (${lastError})`);
}
