import { apiRequest, getStoredOrganization, getStoredSession, setStoredOrganization, setStoredSession, unwrapEntity, unwrapList } from "@/src/lib/api";
import type { LoginRequestDTO, LoginResponseDTO, OrganizationDTO, UserDTO } from "@/src/types/api/auth";
import {
  captureError,
  clearObservabilityContext,
  logEvent,
  setObservabilityContext,
} from "@/src/services/observability";
import { createPermissionResolver } from "@/src/services/permissions";

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
      const token = payload?.token || payload?.access_token || payload?.bearer_token || null;
      const requiresTwoFactor = Boolean(payload?.requires_2fa || payload?.two_fa_required);
      if (!token && !requiresTwoFactor) {
        throw new Error("Login succeeded but no token was returned.");
      }
      await setStoredSession({ token, requiresTwoFactor });
      logEvent("auth.login.success", { email });
      return { token, requiresTwoFactor };
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

    const me = mapUser(unwrapEntity<UserDTO>(meResponse, ["user", "me"]) as UserDTO);
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

  async logout() {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch (error) {
      captureError(error, { operation: "auth.logout" });
    } finally {
      await setStoredSession(null);
      await setStoredOrganization(null);
      clearObservabilityContext();
      logEvent("auth.logout");
    }
  },
};

