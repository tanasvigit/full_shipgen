import type { APIRequestContext } from "@playwright/test";
import { apiLogin, type SessionPayload } from "../api";
import { getE2EConfig, requireCredentials } from "../env";

function adminHeaders(session: SessionPayload) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.token}`,
    Accept: "application/json",
  };
  if (session.organization?.id) {
    headers["X-Company"] = session.organization.id;
  }
  return headers;
}

export async function loginAsAdmin(request: APIRequestContext): Promise<SessionPayload> {
  const { email, password } = requireCredentials();
  return apiLogin(request, email, password);
}

/**
 * IAM create often issues an invite (pending, no password). Admin must set password + activate before login works.
 */
export async function provisionUserForLogin(
  request: APIRequestContext,
  adminSession: SessionPayload,
  { email, password }: { email: string; password: string },
): Promise<string> {
  const { apiURL } = getE2EConfig();
  const headers = adminHeaders(adminSession);

  const listRes = await request.get(`${apiURL}/users`, {
    headers,
    params: { query: email, limit: 25 },
  });
  if (!listRes.ok()) {
    throw new Error(`users list failed (${listRes.status()}): ${await listRes.text()}`);
  }

  const listJson = (await listRes.json()) as Record<string, unknown>;
  const rows = (listJson.users ?? listJson.data ?? []) as Array<Record<string, unknown>>;
  const target = rows.find((u) => String(u.email || "").toLowerCase() === email.toLowerCase());
  if (!target) {
    throw new Error(`User ${email} not found after create`);
  }

  const userId = String(target.uuid || target.id);
  const pwRes = await request.post(`${apiURL}/auth/change-user-password`, {
    headers,
    data: { user: userId, password, password_confirmation: password },
  });
  if (!pwRes.ok()) {
    throw new Error(`change-user-password failed (${pwRes.status()}): ${await pwRes.text()}`);
  }

  const sessionStatus = String(target.session_status || target.status || "");
  if (sessionStatus !== "active") {
    const actRes = await request.patch(`${apiURL}/users/activate/${userId}`, { headers });
    if (!actRes.ok()) {
      throw new Error(`activate user failed (${actRes.status()}): ${await actRes.text()}`);
    }
  }

  if (!target.email_verified_at) {
    const verifyRes = await request.patch(`${apiURL}/users/verify/${userId}`, { headers });
    if (!verifyRes.ok()) {
      throw new Error(`verify user failed (${verifyRes.status()}): ${await verifyRes.text()}`);
    }
  }

  const verify = await apiLogin(request, email, password);
  if (!verify.token) {
    throw new Error("User still cannot log in after password + activate provisioning");
  }

  return userId;
}
