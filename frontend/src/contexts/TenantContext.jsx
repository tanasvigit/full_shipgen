import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  applyTenantTheme,
  DEFAULT_BRANDING,
  DEFAULT_PREFERENCES,
  loadBranding,
  loadOnboardingState,
  loadPreferences,
  saveBranding,
  saveOnboardingState,
  savePreferences,
} from "@/lib/tenant/storage";
import { DEFAULT_PLAN_ID, resolvePlan } from "@/lib/subscription/plans";

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  const { activeOrganization, user } = useAuth();
  const orgId = activeOrganization?.id || activeOrganization?.uuid || "default";

  const [branding, setBrandingState] = useState(() => loadBranding(orgId));
  const [preferences, setPreferencesState] = useState(() => loadPreferences(orgId));
  const [onboarding, setOnboardingState] = useState(() => loadOnboardingState(orgId));

  useEffect(() => {
    setBrandingState(loadBranding(orgId));
    setPreferencesState(loadPreferences(orgId));
    setOnboardingState(loadOnboardingState(orgId));
  }, [orgId]);

  useEffect(() => {
    applyTenantTheme(branding);
  }, [branding]);

  const planId =
    activeOrganization?.plan ||
    activeOrganization?.raw?.subscription_plan ||
    activeOrganization?.raw?.plan ||
    DEFAULT_PLAN_ID;
  const plan = useMemo(() => resolvePlan(planId), [planId]);

  const updateBranding = useCallback(
    (patch) => {
      setBrandingState((prev) => {
        const next = { ...prev, ...patch };
        saveBranding(orgId, next);
        return next;
      });
    },
    [orgId],
  );

  const updatePreferences = useCallback(
    (patch) => {
      setPreferencesState((prev) => {
        const next = { ...prev, ...patch };
        savePreferences(orgId, next);
        return next;
      });
    },
    [orgId],
  );

  const markOnboardingStep = useCallback(
    (stepId, done = true) => {
      setOnboardingState((prev) => {
        const next = {
          ...prev,
          steps: { ...prev.steps, [stepId]: done },
        };
        saveOnboardingState(orgId, next);
        return next;
      });
    },
    [orgId],
  );

  const completeOnboarding = useCallback(() => {
    setOnboardingState((prev) => {
      const next = { ...prev, completed: true };
      saveOnboardingState(orgId, next);
      return next;
    });
  }, [orgId]);

  const tenantProfile = useMemo(
    () => ({
      orgId,
      orgName: activeOrganization?.name || "Organization",
      userId: user?.id,
      userEmail: user?.email,
      planId: plan.id,
      planName: plan.name,
    }),
    [orgId, activeOrganization?.name, user?.id, user?.email, plan.id, plan.name],
  );

  const value = useMemo(
    () => ({
      orgId,
      tenantProfile,
      branding,
      preferences,
      plan,
      onboarding,
      updateBranding,
      updatePreferences,
      markOnboardingStep,
      completeOnboarding,
      resetBranding: () => updateBranding(DEFAULT_BRANDING),
      resetPreferences: () => updatePreferences(DEFAULT_PREFERENCES),
    }),
    [
      orgId,
      tenantProfile,
      branding,
      preferences,
      plan,
      onboarding,
      updateBranding,
      updatePreferences,
      markOnboardingStep,
      completeOnboarding,
    ],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
