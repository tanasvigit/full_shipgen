import type { PricingRule } from '../types';
import { apiRequest } from './client';
import { toNumber } from './mappers';

function normalizePricingRule(rule: PricingRule): PricingRule {
  return {
    ...rule,
    basePrice: toNumber(rule.basePrice),
    perHour: toNumber(rule.perHour),
    maxDaily: toNumber(rule.maxDaily),
  };
}

export function listPricing(): Promise<PricingRule[]> {
  return apiRequest<PricingRule[]>('/pricing').then((rules) => rules.map(normalizePricingRule));
}

export function updatePricing(
  ruleId: string,
  payload: Partial<Pick<PricingRule, 'basePrice' | 'perHour' | 'maxDaily' | 'isActive'>>,
): Promise<PricingRule> {
  return apiRequest<PricingRule>(`/pricing/${ruleId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then(normalizePricingRule);
}
