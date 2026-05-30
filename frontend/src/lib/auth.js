import { apiClient, unwrapEntity, unwrapList } from "@/lib/api";
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
  return {
    id: user?.id || user?.uuid || user?.public_id,
    name: user?.name || user?.full_name || "User",
    email: user?.email || "",
    role: roleName,
    isAdmin: Boolean(user?.is_admin || String(user?.type || "").toLowerCase() === "admin"),
    avatarInitials: (user?.name || "U")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    avatarColor: "bg-blue-600",
    permissions: resolveEffectivePermissions(user),
    policies: user?.policies || [],
    raw: user,
  };
};

export const authService = {
  getAuth() {
    return authStorage.get();
  },

  clearSession() {
    authStorage.clear();
    orgStorage.clear();
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
    const token = payload?.token || payload?.access_token || payload?.bearer_token;
    const requiresTwoFactor = Boolean(payload?.requires_2fa || payload?.two_fa_required);

    if (!token && !requiresTwoFactor) {
      throw new Error("Login succeeded but no token was returned.");
    }

    const auth = { token: token || null, requiresTwoFactor };
    authStorage.set(auth);
    return auth;
  },

  async validateTwoFactor(code) {
    await apiClient.post("/two-fa/validate", { code });
    const response = await apiClient.post("/two-fa/verify", { code });
    const payload = response.data || {};
    const token = payload?.token || payload?.access_token || payload?.bearer_token;
    if (token) {
      authStorage.set({ token, requiresTwoFactor: false });
    }
    return payload;
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
