/**
 * Subscription plan definitions — billing-ready architecture (no Stripe yet).
 * Plan id can be set on organization.raw.plan or via tenant preferences override.
 */

import { formatMoney } from "@/lib/formatMoney";

export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPrice: 7999,
    priceLabel: "₹7,999/mo",
    seats: 3,
    limits: {
      ordersPerMonth: 500,
      drivers: 10,
      vehicles: 10,
      orderConfigs: 2,
    },
    features: {
      bulkOps: false,
      importExport: false,
      orderConfigManager: false,
      operationalIntelligence: true,
      apiAccess: false,
      multiUser: true,
    },
  },
  professional: {
    id: "professional",
    name: "Professional",
    monthlyPrice: 24999,
    priceLabel: "₹24,999/mo",
    seats: 15,
    limits: {
      ordersPerMonth: 5000,
      drivers: 50,
      vehicles: 50,
      orderConfigs: 10,
    },
    features: {
      bulkOps: true,
      importExport: true,
      orderConfigManager: true,
      operationalIntelligence: true,
      apiAccess: true,
      multiUser: true,
    },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Custom",
    seats: 999,
    limits: {
      ordersPerMonth: Infinity,
      drivers: Infinity,
      vehicles: Infinity,
      orderConfigs: Infinity,
    },
    features: {
      bulkOps: true,
      importExport: true,
      orderConfigManager: true,
      operationalIntelligence: true,
      apiAccess: true,
      multiUser: true,
      sso: true,
      auditExport: true,
    },
  },
};

export const DEFAULT_PLAN_ID = "professional";

export function resolvePlan(planId) {
  return PLANS[planId] || PLANS[DEFAULT_PLAN_ID];
}

/** Tenant-aware monthly price label for billing UI. */
export function planPriceLabel(plan) {
  if (!plan) return "—";
  if (plan.monthlyPrice == null) return plan.priceLabel || "Custom";
  return `${formatMoney(plan.monthlyPrice)}/mo`;
}

export function planHasFeature(plan, featureKey) {
  return Boolean(plan?.features?.[featureKey]);
}

export function isWithinLimit(plan, limitKey, currentCount) {
  const max = plan?.limits?.[limitKey];
  if (max == null || max === Infinity) return true;
  return currentCount < max;
}
