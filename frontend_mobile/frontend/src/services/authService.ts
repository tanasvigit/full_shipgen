import { apiRequest, getStoredOrganization, getStoredSession, setStoredOrganization, setStoredSession, unwrapEntity, unwrapList } from "@/src/lib/api";
import type { LoginRequestDTO, LoginResponseDTO, OrganizationDTO, UserDTO } from "@/src/types/api/auth";
import type { DriverDTO } from "@/src/types/api/fleet";
import {
  captureError,
  clearObservabilityContext,
  logEvent,
  setObservabilityContext,
} from "@/src/services/observability";
import { createPermissionResolver } from "@/src/services/permissions";
import { twoFaUiEnabled } from "@/src/lib/features";

export type MobileUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  isAdmin: boolean;
  raw: UserDTO;
};

export type MobileOrganization = {
  id: string;
  uuid: string;
  name: string;
  role: string;
  raw: OrganizationDTO;
};

function mapOrganization(org: OrganizationDTO): MobileOrganization {
  return {
    id: String(org?.uuid || org?.id || org?.public_id || ""),
    uuid: String(org?.uuid || org?.id || ""),
    name: org?.name || org?.company_name || "Organization",
    role: org?.role || org?.pivot?.role || "Member",
    raw: org,
  };
}

function mapUser(user: UserDTO): MobileUser {
  const perms = createPermissionResolver(user);
  return {
    id: String(user?.id || user?.uuid || user?.public_id || ""),
    name: user?.name || user?.full_name || "User",
    email: user?.email || "",
    role:
      (typeof user?.role === "object" ? user?.role?.name : undefined) ||
      user?.role_name ||
      user?.company_role ||
      (typeof user?.role === "string" ? user?.role : undefined) ||
      "Member",
    permissions: [...perms.permissions],
    isAdmin: perms.isAdmin,
    raw: user,
  };
}

const BOOTSTRAP_ATTEMPTS = 3;
const BOOTSTRAP_BASE_DELAY_MS = 400;

function isDriverAccount(user: UserDTO) {
  return (
    String(user?.type || "").toLowerCase() === "driver" ||
    String(user?.role_name || "").toLowerCase() === "driver" ||
    (typeof user?.role === "object" && String(user.role?.name || "").toLowerCase() === "driver")
  );
}

async function enrichDriverProfile(me: MobileUser): Promise<MobileUser> {
  if (me.raw?.driver?.uuid || me.raw?.driver?.public_id || me.raw?.driver_uuid) {
    return me;
  }
  if (!isDriverAccount(me.raw)) {
    return me;
  }

  try {
    const payload = await apiRequest("/drivers?limit=100");
    const drivers = unwrapList<DriverDTO>(payload, ["drivers"]);
    const userUuid = String(me.raw?.uuid || me.id || "");
    const linked = drivers.find((driver) => String(driver?.user_uuid || "") === userUuid);
    if (!linked) {
      logEvent("auth.bootstrap.driver_not_linked", { userUuid });
      return me;
    }
    return {
      ...me,
      raw: {
        ...me.raw,
        driver: linked,
        driver_uuid: linked.uuid,
      },
    };
  } catch (error) {
    captureError(error, { operation: "auth.bootstrap.enrichDriverProfile" });
    return me;
  }
}

async function withBootstrapRetry<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= BOOTSTRAP_ATTEMPTS; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt >= BOOTSTRAP_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, BOOTSTRAP_BASE_DELAY_MS * attempt));
      logEvent("auth.bootstrap.retry", { operation, attempt });
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Bootstrap failed: ${operation}`);
}

export const authService = {
  async login(email: string, password: string) {
    try {
      const body: LoginRequestDTO = { identity: email, password, remember: true };
      const payload = await apiRequest<LoginResponseDTO>("/auth/login", {
        method: "POST",
        body,
        auth: false,
      });
      const twoFaSession = payload?.twoFaSession || null;
      const requiresTwoFactor = Boolean(
        payload?.requires_2fa || payload?.two_fa_required || payload?.isEnabled || twoFaSession
      );
      if (requiresTwoFactor) {
        if (!twoFaUiEnabled) {
          throw new Error(
            "This account requires two-factor authentication, but it is not enabled in this app build. Contact your administrator."
          );
        }
        if (!twoFaSession) {
          throw new Error(
            "Two-factor authentication is enabled but the verification session could not be started. Try again."
          );
        }
        await setStoredSession({
          token: null,
          requiresTwoFactor: true,
          twoFaSession,
          twoFaIdentity: payload?.identity || email,
          twoFaMethod: payload?.method || "email",
          twoFaClientToken: null,
        });
        await authService.beginTwoFactorSession();
        logEvent("auth.login.2fa_required", { email });
        return { requiresTwoFactor: true, twoFaSession };
      }
      const token = payload?.token || payload?.access_token || payload?.bearer_token || null;
      if (!token) {
        throw new Error("Login succeeded but no token was returned.");
      }
      await setStoredSession({ token, requiresTwoFactor: false });
      logEvent("auth.login.success", { email });
      return { token, requiresTwoFactor: false };
    } catch (error) {
      captureError(error, { operation: "auth.login", email });
      throw error;
    }
  },

  async bootstrap() {
    const session = await getStoredSession();
    if (!session?.token) {
      return { session: null, me: null, organizations: [], activeOrg: null };
    }

    const savedOrg = await getStoredOrganization();

    const [meResponse, orgsResponse] = await withBootstrapRetry("session", () =>
      Promise.all([apiRequest("/users/me"), apiRequest("/auth/organizations")])
    );

    const me = await enrichDriverProfile(
      mapUser(unwrapEntity<UserDTO>(meResponse, ["user", "me"]) as UserDTO)
    );
    const organizations = unwrapList<OrganizationDTO>(orgsResponse, ["organizations", "companies"]).map(
      mapOrganization
    );
    const activeOrg =
      organizations.find(
        (org) =>
          org.id === savedOrg?.id ||
          org.uuid === savedOrg?.uuid ||
          org.id === savedOrg?.uuid ||
          org.uuid === savedOrg?.id
      ) ||
      organizations[0] ||
      null;

    await setStoredOrganization(activeOrg ? { id: activeOrg.id, uuid: activeOrg.uuid } : null);

    setObservabilityContext({
      userId: me.id,
      email: me.email,
      companyUuid: activeOrg?.uuid || activeOrg?.id,
    });

    return { session, me, organizations, activeOrg };
  },

  async switchOrganization(organizationId: string) {
    await apiRequest("/auth/switch-organization", {
      method: "POST",
      body: { next: organizationId },
    });
    const orgsResponse = await apiRequest("/auth/organizations");
    const organizations = unwrapList<OrganizationDTO>(orgsResponse, ["organizations", "companies"]).map(mapOrganization);
    const activeOrg =
      organizations.find((org) => org.id === organizationId || org.uuid === organizationId) ||
      organizations[0] ||
      null;
    await setStoredOrganization(activeOrg ? { id: activeOrg.id, uuid: activeOrg.uuid } : null);
    setObservabilityContext({
      companyUuid: activeOrg?.uuid || activeOrg?.id,
    });
    return { organizations, activeOrg };
  },

  async beginTwoFactorSession() {
    const session = await getStoredSession();
    const identity = session?.twoFaIdentity;
    const token = session?.twoFaSession;
    if (!identity || !token) {
      throw new Error("Two-factor session expired. Sign in again.");
    }
    if (session?.twoFaClientToken) {
      return session.twoFaClientToken;
    }
    const validated = await apiRequest<{ clientToken?: string; expired?: boolean }>("/two-fa/validate", {
      method: "POST",
      body: { identity, token },
      auth: false,
    });
    if (validated?.expired) {
      throw new Error("Verification session expired. Sign in again.");
    }
    const clientToken = validated?.clientToken;
    if (!clientToken) {
      throw new Error("Unable to start verification. Try again.");
    }
    await setStoredSession({
      ...session,
      requiresTwoFactor: true,
      twoFaClientToken: clientToken,
    });
    return clientToken;
  },

  async resendTwoFactorCode() {
    const session = await getStoredSession();
    const identity = session?.twoFaIdentity;
    const token = session?.twoFaSession;
    if (!identity || !token) {
      throw new Error("Two-factor session expired. Sign in again.");
    }
    const resend = await apiRequest<{ clientToken?: string }>("/two-fa/resend", {
      method: "POST",
      body: { identity, token },
      auth: false,
    });
    const clientToken = resend?.clientToken;
    if (!clientToken) {
      throw new Error("Unable to resend verification code.");
    }
    await setStoredSession({
      ...session,
      requiresTwoFactor: true,
      twoFaClientToken: clientToken,
    });
    logEvent("auth.2fa.resent", { identity });
    return clientToken;
  },

  async verifyTwoFactor(code: string) {
    const session = await getStoredSession();
    const identity = session?.twoFaIdentity;
    const token = session?.twoFaSession;
    if (!identity || !token) {
      throw new Error("Two-factor session expired. Sign in again.");
    }
    let clientToken = session?.twoFaClientToken || null;
    if (!clientToken) {
      clientToken = await authService.beginTwoFactorSession();
    }
    const verify = await apiRequest<{ authToken?: string }>("/two-fa/verify", {
      method: "POST",
      body: { code, token, clientToken },
      auth: false,
    });
    const authToken = verify?.authToken;
    if (!authToken) {
      throw new Error("Invalid verification code.");
    }
    await setStoredSession({ token: authToken, requiresTwoFactor: false });
    logEvent("auth.2fa.verified", { identity });
    return authToken;
  },

  async clearLocalSession() {
    await setStoredSession(null);
    await setStoredOrganization(null);
    clearObservabilityContext();
  },

  async logout(options: { notifyServer?: boolean } = {}) {
    const notifyServer = options.notifyServer !== false;
    const session = await getStoredSession();

    if (notifyServer && session?.token) {
      try {
        await apiRequest("/auth/logout", { method: "POST" });
      } catch (error) {
        captureError(error, { operation: "auth.logout" });
      }
    }

    await authService.clearLocalSession();
    logEvent("auth.logout", { notifyServer: notifyServer && Boolean(session?.token) });
  },
};

