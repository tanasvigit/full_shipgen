const ORDERS_LIST_PARAMS = { limit: 500 } as const;

export const queryKeys = {
  auth: (companyUuid: string | null) => ["auth", companyUuid] as const,
  orders: (companyUuid: string | null, params: Record<string, unknown> = ORDERS_LIST_PARAMS) =>
    ["orders", companyUuid, params] as const,
  order: (companyUuid: string | null, ref: string) => ["order", companyUuid, ref] as const,
  nextActivity: (companyUuid: string | null, orderRef: string) =>
    ["nextActivity", companyUuid, orderRef] as const,
  fleet: (companyUuid: string | null) => ["fleet", companyUuid] as const,
};

export { ORDERS_LIST_PARAMS };

