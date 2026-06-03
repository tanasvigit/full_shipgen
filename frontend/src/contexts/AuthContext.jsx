import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "@/lib/auth";
import { toApiError } from "@/lib/api";
import { createFleetopsPermissionChecker } from "@/lib/fleetops/permissions";
import { resolveIamPermissionCandidates } from "@/lib/iam/permissions";
import { loadingManager, MESSAGES } from "@/services/loading-manager";
import { onboardingContextStorage } from "@/lib/onboarding/contextStorage";
import { logOnboardingDebug } from "@/lib/onboarding/debug";

const AuthContext = createContext(null);

const toPermissionMap = (permissions = []) => {
  const map = new Set();
  permissions.forEach((permission) => {
    if (typeof permission === "string") {
      map.add(permission);
      return;
    }
    const key = permission?.name || permission?.id;
    if (key) {
      map.add(key);
    }
  });
  return map;
};

export function AuthProvider({ children }) {
  const restoredOnboarding = onboardingContextStorage.load();
  const [authReady, setAuthReady] = useState(false);
  const [onboardingGateReady, setOnboardingGateReady] = useState(false);
  const [shouldInstall, setShouldInstall] = useState(false);
  const [shouldOnboard, setShouldOnboard] = useState(false);
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [activeOrganization, setActiveOrganization] = useState(null);
  const [onboardingSession, setOnboardingSession] = useState(
    restoredOnboarding?.session
      ? {
          session: restoredOnboarding.session,
          name: restoredOnboarding.name || "",
          email: restoredOnboarding.email || "",
          phone: restoredOnboarding.phone || "",
          organization_name: restoredOnboarding.organization_name || "",
        }
      : null,
  );
  const [onboardingDraft, setOnboardingDraft] = useState(() => ({
    name: restoredOnboarding.name || "",
    email: restoredOnboarding.email || "",
    phone: restoredOnboarding.phone || "",
    organization_name: restoredOnboarding.organization_name || "",
  }));

  const resetSession = useCallback(() => {
    authService.clearSession();
    setSession(null);
    setUser(null);
    setOrganizations([]);
    setActiveOrganization(null);
  }, []);

  const makeUnrecoverableError = useCallback((message, meta = {}) => {
    const err = new Error(message || "Onboarding unrecoverable error.");
    err.code = "ONBOARDING_UNRECOVERABLE";
    err.meta = meta;
    return err;
  }, []);

  const bootstrap = useCallback(async () => {
    const auth = authService.getAuth();
    if (!auth?.token) {
      loadingManager.setAuth(false);
      loadingManager.setBootstrap(false);
      setAuthReady(true);
      return;
    }
    loadingManager.setAuth(true, MESSAGES.auth);
    try {
      setSession(auth);
      const { me, organizations: orgs, activeOrg } = await authService.bootstrap();
      setUser(me);
      setOrganizations(orgs);
      setActiveOrganization(activeOrg);
    } catch {
      resetSession();
    } finally {
      loadingManager.setAuth(false);
      loadingManager.setBootstrap(false);
      setAuthReady(true);
    }
  }, [resetSession]);

  useEffect(() => {
    let active = true;
    authService
      .installerInitialize()
      .then((status) => {
        if (!active) return;
        setShouldInstall(Boolean(status?.shouldInstall));
        setShouldOnboard(Boolean(status?.shouldOnboard));
      })
      .catch(() => {
        if (!active) return;
        setShouldInstall(false);
        setShouldOnboard(false);
      })
      .finally(() => {
        if (!active) return;
        setOnboardingGateReady(true);
      });

    bootstrap();
    const onUnauthorized = () => resetSession();
    window.addEventListener("fleetbase:unauthorized", onUnauthorized);
    return () => {
      active = false;
      window.removeEventListener("fleetbase:unauthorized", onUnauthorized);
    };
  }, [bootstrap, resetSession]);

  const refreshInstallStatus = useCallback(async () => {
    try {
      const status = await authService.installerInitialize();
      setShouldInstall(Boolean(status?.shouldInstall));
      setShouldOnboard(Boolean(status?.shouldOnboard));
      return status;
    } catch {
      setShouldInstall(false);
      setShouldOnboard(false);
      return { shouldInstall: false, shouldOnboard: false };
    }
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const auth = await authService.login(credentials);
      if (auth.requiresTwoFactor) {
        setSession(auth);
        return { requiresTwoFactor: true };
      }
      const { me, organizations: orgs, activeOrg } = await authService.bootstrap();
      setSession(auth);
      setUser(me);
      setOrganizations(orgs);
      setActiveOrganization(activeOrg);
      return { requiresTwoFactor: false };
    } catch (error) {
      throw toApiError(error);
    }
  }, []);

  const clearOnboardingSession = useCallback(() => {
    onboardingContextStorage.clear();
    setOnboardingSession(null);
    setOnboardingDraft({ name: "", email: "", phone: "", organization_name: "" });
  }, []);

  const createOnboardingAccount = useCallback(async (payload) => {
    try {
      const result = await authService.createOnboardingAccount(payload);
      if (typeof result?.skipVerification !== "boolean") {
        throw makeUnrecoverableError("Malformed onboarding response.", { action: "create-account" });
      }
      if (result.skipVerification && result.token) {
        const auth = { token: result.token, requiresTwoFactor: false };
        authService.setAuth(auth);
        try {
          const { me, organizations: orgs, activeOrg } = await authService.bootstrap();
          setSession(auth);
          setUser(me);
          setOrganizations(orgs);
          setActiveOrganization(activeOrg);
          clearOnboardingSession();
          return { skipVerification: true, session: result.session, token: result.token };
        } catch (bootstrapError) {
          logOnboardingDebug("bootstrap_failure", {
            route: "/auth/onboard",
            action: "create-account",
            status: bootstrapError?.status,
            message: bootstrapError?.message,
          });
          resetSession();
          clearOnboardingSession();
          throw makeUnrecoverableError("Account created but sign-in failed. Please sign in manually.", {
            action: "create-account",
            reason: "bootstrap-failed",
          });
        }
      }

      if (result.skipVerification && !result.token) {
        throw makeUnrecoverableError("Malformed onboarding response: missing token.", { action: "create-account" });
      }
      if (!result.skipVerification && !result.session) {
        throw makeUnrecoverableError("Malformed onboarding response: missing session.", { action: "create-account" });
      }

      const pending = {
        session: result.session || null,
        email: payload?.email || "",
        phone: payload?.phone || "",
        name: payload?.name || "",
        organization_name: payload?.organization_name || "",
      };
      onboardingContextStorage.merge(pending);
      setOnboardingSession(pending);
      setOnboardingDraft({
        name: pending.name,
        email: pending.email,
        phone: pending.phone,
        organization_name: pending.organization_name,
      });
      return { skipVerification: false, session: pending.session };
    } catch (error) {
      logOnboardingDebug("action_failed", {
        route: "/auth/onboard",
        action: "create-account",
        status: error?.status || error?.response?.status || null,
        code: error?.code || null,
        message: error?.message,
      });
      throw toApiError(error);
    }
  }, [clearOnboardingSession, makeUnrecoverableError, resetSession]);

  const saveOnboardingDraft = useCallback((patch = {}) => {
    const next = {
      ...onboardingDraft,
      ...(patch?.name !== undefined ? { name: patch.name } : {}),
      ...(patch?.email !== undefined ? { email: patch.email } : {}),
      ...(patch?.phone !== undefined ? { phone: patch.phone } : {}),
      ...(patch?.organization_name !== undefined ? { organization_name: patch.organization_name } : {}),
    };
    setOnboardingDraft(next);
    onboardingContextStorage.merge(next);
  }, [onboardingDraft]);

  const verifyOnboardingCode = useCallback(async ({ session, code }) => {
    try {
      const result = await authService.verifyOnboardingEmail({ session, code });
      if (!result?.token) {
        throw makeUnrecoverableError("Malformed verify response: missing token.", { action: "verify" });
      }

      const auth = { token: result.token, requiresTwoFactor: false };
      authService.setAuth(auth);
      try {
        const { me, organizations: orgs, activeOrg } = await authService.bootstrap();
        setSession(auth);
        setUser(me);
        setOrganizations(orgs);
        setActiveOrganization(activeOrg);
        clearOnboardingSession();
        return result;
      } catch (bootstrapError) {
        logOnboardingDebug("bootstrap_failure", {
          route: "/auth/onboard/verify-email",
          action: "verify",
          status: bootstrapError?.status,
          message: bootstrapError?.message,
        });
        resetSession();
        clearOnboardingSession();
        throw makeUnrecoverableError("Verification completed but sign-in failed. Please sign in manually.", {
          action: "verify",
          reason: "bootstrap-failed",
        });
      }
    } catch (error) {
      logOnboardingDebug("action_failed", {
        route: "/auth/onboard/verify-email",
        action: "verify",
        status: error?.status || error?.response?.status || null,
        code: error?.code || null,
        message: error?.message,
      });
      throw toApiError(error);
    }
  }, [clearOnboardingSession, makeUnrecoverableError, resetSession]);

  const resendOnboardingEmail = useCallback(async ({ session, email }) => {
    try {
      return await authService.resendOnboardingEmail({ session, email });
    } catch (error) {
      logOnboardingDebug("action_failed", {
        route: "/auth/onboard/verify-email",
        action: "resend-email",
        status: error?.status || error?.response?.status || null,
        code: error?.code || null,
        message: error?.message,
      });
      throw toApiError(error);
    }
  }, []);

  const resendOnboardingSms = useCallback(async ({ session, phone }) => {
    try {
      return await authService.resendOnboardingSms({ session, phone });
    } catch (error) {
      logOnboardingDebug("action_failed", {
        route: "/auth/onboard/verify-email",
        action: "resend-sms",
        status: error?.status || error?.response?.status || null,
        code: error?.code || null,
        message: error?.message,
      });
      throw toApiError(error);
    }
  }, []);

  const completeTwoFactor = useCallback(async (code) => {
    try {
      await authService.validateTwoFactor(code);
      const auth = authService.getAuth();
      const { me, organizations: orgs, activeOrg } = await authService.bootstrap();
      setSession(auth);
      setUser(me);
      setOrganizations(orgs);
      setActiveOrganization(activeOrg);
    } catch (error) {
      throw toApiError(error);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    resetSession();
  }, [resetSession]);

  const switchOrganization = useCallback(async (organizationId) => {
    try {
      const { organizations: orgs, activeOrg } = await authService.switchOrganization(organizationId);
      const { me } = await authService.bootstrap();
      setUser(me);
      setOrganizations(orgs);
      setActiveOrganization(activeOrg);
    } catch (error) {
      throw toApiError(error);
    }
  }, []);

  const permissionMap = useMemo(() => toPermissionMap(user?.permissions), [user?.permissions]);
  const fleetopsChecker = useMemo(
    () => createFleetopsPermissionChecker(permissionMap, { isAdmin: Boolean(user?.isAdmin) }),
    [permissionMap, user?.isAdmin],
  );
  const hasPermission = useCallback(
    (permission) => {
      if (!permission) return true;
      if (user?.isAdmin) return true;
      if (!permissionMap || permissionMap.size === 0) {
        return (
          !import.meta.env?.PROD && import.meta.env?.VITE_FLEETOPS_PERMISSIVE === "true"
        );
      }
      if (permission.startsWith("fleet-ops ")) {
        const parts = permission.split(/\s+/);
        if (parts.length >= 3) {
          return fleetopsChecker.can(parts[1], parts[2]);
        }
        if (parts[1] === "*") {
          return true;
        }
      }
      return resolveIamPermissionCandidates(permission).some((p) => permissionMap.has(p));
    },
    [permissionMap, fleetopsChecker, user?.isAdmin],
  );

  const value = useMemo(
    () => ({
      authReady,
      onboardingGateReady,
      shouldInstall,
      shouldOnboard,
      isAuthenticated: Boolean(session?.token),
      requiresTwoFactor: Boolean(session?.requiresTwoFactor),
      session,
      onboardingSession,
      onboardingDraft,
      user,
      organizations,
      activeOrganization,
      login,
      createOnboardingAccount,
      saveOnboardingDraft,
      clearOnboardingSession,
      verifyOnboardingCode,
      resendOnboardingEmail,
      resendOnboardingSms,
      completeTwoFactor,
      logout,
      switchOrganization,
      refreshInstallStatus,
      hasPermission,
      refresh: bootstrap,
    }),
    [
      authReady,
      onboardingGateReady,
      shouldInstall,
      shouldOnboard,
      session,
      onboardingSession,
      onboardingDraft,
      user,
      organizations,
      activeOrganization,
      login,
      createOnboardingAccount,
      saveOnboardingDraft,
      clearOnboardingSession,
      verifyOnboardingCode,
      resendOnboardingEmail,
      resendOnboardingSms,
      completeTwoFactor,
      logout,
      switchOrganization,
      refreshInstallStatus,
      hasPermission,
      bootstrap,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
