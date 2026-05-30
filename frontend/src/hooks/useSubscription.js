import { useMemo } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { isWithinLimit, planHasFeature } from "@/lib/subscription/plans";

/**
 * Subscription + feature gating for the active tenant.
 */
export function useSubscription(usage = {}) {
  const { plan } = useTenant();

  return useMemo(
    () => ({
      plan,
      can: (featureKey) => planHasFeature(plan, featureKey),
      cannot: (featureKey) => !planHasFeature(plan, featureKey),
      withinLimit: (limitKey, count = 0) => isWithinLimit(plan, limitKey, count),
      seats: plan.seats,
      limits: plan.limits,
      usage,
    }),
    [plan, usage],
  );
}
