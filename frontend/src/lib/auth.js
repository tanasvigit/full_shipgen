import { apiClient, unwrapEntity, unwrapList } from "@/lib/api";
import { env } from "@/lib/env";
import { features } from "@/lib/features";
import { resolveEffectivePermissions } from "@/lib/fleetops/permissions";
import { authStorage, orgStorage } from "@/lib/storage";

const mapOrganization = (org) => ({
  id: org?.uuid || org?.id || org?.public_id,
  uuid: org?.uuid || org?.id,
  name: org?.name || org?.company_name || "Organization",
  role: org?.role || org?.pivot?.role || "Member",
  plan: org?.plan || org?.subscription_plan || "N/A",
  raw: org,
});

const mapUser = (user) => {
  const roleName = user?.role?.name || user?.role_name || user?.company_role || user?.role || "Member";
  const roleNormalized = String(roleName).toLowerCase();
  const typeNormalized = String(user?.type || "").toLowerCase();
  return {
    id: user?.id || user?.uuid || user?.public_id,
    name: user?.name || user?.full_name || "User",
    email: user?.email || "",
    phone: user?.phone || "",
    timezone: user?.timezone || "",
    role: roleName,
    isAdmin: Boolean(
      user?.is_admin ||
        typeNormalized === "admin" ||
        roleNormalized === "admin" ||
        roleNormalized === "administrator",
    ),
    avatarInitials: (user?.name || "U")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    avatarColor: "bg-blue-600 text-white",
    permissions: resolveEffectivePermissions(user),
    policies: user?.policies || [],
    raw: user,
  };
};

export const authService = {
  async installerInitialize() {
    const response = await apiClient.get("/installer/initialize", { loading: false });
    const data = response?.data || {};
    return {
      shouldInstall: Boolean(data?.installerEnabled) && Boolean(data?.shouldInstall),
      shouldOnboard: Boolean(data?.shouldOnboard),
      defaultTheme: data?.defaultTheme || "dark",
      installerEnabled: Boolean(data?.installerEnabled),
      runtimeSetupReady: Boolean(data?.runtimeSetupReady),
    };
  },

  async installerCreateDb() {
    const response = await apiClient.post("/installer/createdb", {}, {
      loading: false,
      timeout: env.INSTALLER_API_TIMEOUT_MS,
    });
    return response?.data || {};
  },

  async installerMigrate() {
    const response = await apiClient.post("/installer/migrate", {}, {
      loading: false,
      timeout: env.INSTALLER_API_TIMEOUT_MS,
    });
    return response?.data || {};
  },

  async installerSeed() {
    const response = await apiClient.post("/installer/seed", {}, {
      loading: false,
      timeout: env.INSTALLER_API_TIMEOUT_MS,
    });
    return response?.data || {};
  },

  async shouldOnboard() {
    const response = await apiClient.get("/onboard/should-onboard", { loading: false });
    return Boolean(response?.data?.should_onboard);
  },

  getAuth() {
    return authStorage.get();
  },

  clearSession() {
    authStorage.clear();
    orgStorage.clear();
  },

  setAuth(auth) {
    authStorage.set(auth);
  },

  async login({ email, password, remember = true }) {
    const response = await apiClient.post(
      "/auth/login",
      {
        identity: email,
        password,
        remember,
      },
      { loading: false },
    );
    const payload = response.data || {};
    const twoFaSession = payload?.twoFaSession || null;
    const requiresTwoFactor = Boolean(
      payload?.requires_2fa ||
        payload?.two_fa_required ||
        payload?.isEnabled ||
        twoFaSession,
    );

    if (requiresTwoFactor) {
      if (!features.twoFaEnabled) {
        throw new Error(
          "This account requires two-factor authentication, but it is not enabled in this console build. Contact your administrator.",
        );
      }
      if (!twoFaSession) {
        throw new Error("Two-factor authentication is enabled but the verification session could not be started. Try again.");
      }
      const auth = {
        token: null,
        requiresTwoFactor: true,
        twoFaSession,
        twoFaIdentity: payload?.identity || email,
        twoFaMethod: payload?.method || "email",
        twoFaClientToken: null,
        remember,
      };
      authStorage.set(auth);
      return auth;
    }

    const token = payload?.token || payload?.access_token || payload?.bearer_token;
    if (!token) {
      throw new Error("Login succeeded but no token was returned.");
    }

    const auth = { token, requiresTwoFactor: false };
    authStorage.set(auth);
    return auth;
  },

  async createOnboardingAccount(payload) {
    const response = await apiClient.post("/onboard/create-account", payload, { loading: false });
    const data = response?.data || {};
    return {
      status: data?.status,
      session: data?.session || null,
      token: data?.token || null,
      skipVerification: Boolean(data?.skipVerification),
    };
  },

  async verifyOnboardingEmail({ session, code }) {
    const response = await apiClient.post(
      "/onboard/verify-email",
      { session, code },
      { loading: false },
    );
    const data = response?.data || {};
    return {
      status: data?.status,
      token: data?.token || null,
      verified_at: data?.verified_at || null,
    };
  },

  async resendOnboardingEmail({ session, email }) {
    const response = await apiClient.post(
      "/onboard/send-verification-email",
      { session, email },
      { loading: false },
    );
    return response?.data || {};
  },

  async resendOnboardingSms({ session, phone }) {
    const response = await apiClient.post(
      "/onboard/send-verification-sms",
      { session, phone },
      { loading: false },
    );
    return response?.data || {};
  },

  async beginTwoFactorSession() {
    const auth = authStorage.get();
    const identity = auth?.twoFaIdentity;
    const token = auth?.twoFaSession;
    if (!identity || !token) {
      throw new Error("Two-factor session expired. Sign in again.");
    }
    if (auth?.twoFaClientToken) {
      return auth.twoFaClientToken;
    }
    const response = await apiClient.post(
      "/two-fa/validate",
      { identity, token },
      { loading: false },
    );
    const payload = response.data || {};
    if (payload?.expired) {
      throw new Error("Verification session expired. Sign in again.");
    }
    const clientToken = payload?.clientToken;
    if (!clientToken) {
      throw new Error("Unable to start verification. Try again.");
    }
    authStorage.set({ ...auth, twoFaClientToken: clientToken });
    return clientToken;
  },

  async resendTwoFactorCode() {
    const auth = authStorage.get();
    const identity = auth?.twoFaIdentity;
    const token = auth?.twoFaSession;
    if (!identity || !token) {
      throw new Error("Two-factor session expired. Sign in again.");
    }
    const response = await apiClient.post(
      "/two-fa/resend",
      { identity, token },
      { loading: false },
    );
    const clientToken = response.data?.clientToken;
    if (!clientToken) {
      throw new Error("Unable to resend verification code.");
    }
    authStorage.set({ ...auth, twoFaClientToken: clientToken });
    return clientToken;
  },

  async verifyTwoFactor(code) {
    const auth = authStorage.get();
    const identity = auth?.twoFaIdentity;
    const token = auth?.twoFaSession;
    if (!identity || !token) {
      throw new Error("Two-factor session expired. Sign in again.");
    }
    let clientToken = auth?.twoFaClientToken || null;
    if (!clientToken) {
      clientToken = await this.beginTwoFactorSession();
    }
    const response = await apiClient.post(
      "/two-fa/verify",
      { code, token, clientToken },
      { loading: false },
    );
    const authToken = response.data?.authToken || response.data?.token;
    if (!authToken) {
      throw new Error("Invalid verification code.");
    }
    authStorage.set({ token: authToken, requiresTwoFactor: false });
    return authToken;
  },

  async cancelTwoFactorSession() {
    const auth = authStorage.get();
    if (auth?.twoFaSession && auth?.twoFaIdentity) {
      try {
        await apiClient.post(
          "/two-fa/invalidate",
          { identity: auth.twoFaIdentity, token: auth.twoFaSession },
          { loading: false, silent: true },
        );
      } catch {
        // Best-effort cleanup.
      }
    }
    authStorage.clear();
  },

  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      this.clearSession();
    }
  },

  async bootstrap() {
    const silent = { loading: false };
    const [meResponse, orgsResponse] = await Promise.all([
      apiClient.get("/users/me", silent),
      apiClient.get("/auth/organizations", silent),
    ]);

    const me = mapUser(unwrapEntity(meResponse.data, ["user", "me"]));
    const organizations = unwrapList(orgsResponse.data, ["organizations", "companies"]).map(mapOrganization);

    const selectedOrg = orgStorage.get();
    const activeOrg =
      organizations.find((org) => org.id === selectedOrg?.id) ||
      organizations[0] ||
      null;

    if (activeOrg) {
      orgStorage.set(activeOrg);
    }

    return { me, organizations, activeOrg };
  },

  async switchOrganization(companyId) {
    await apiClient.post("/auth/switch-organization", { next: companyId });
    const orgsResponse = await apiClient.get("/auth/organizations");
    const organizations = unwrapList(orgsResponse.data, ["organizations", "companies"]).map(mapOrganization);
    const activeOrg = organizations.find((org) => org.id === companyId || org.uuid === companyId) || organizations[0] || null;
    if (activeOrg) {
      orgStorage.set(activeOrg);
    }
    return { organizations, activeOrg };
  },
};
