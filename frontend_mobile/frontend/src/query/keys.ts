const ORDERS_LIST_PARAMS = { limit: 500 } as const;

export const queryKeys = {
  auth: (companyUuid: string | null) => ["auth", companyUuid] as const,
  orders: (companyUuid: string | null, params: Record<string, unknown> = ORDERS_LIST_PARAMS) =>
    ["orders", companyUuid, params] as const,
  order: (companyUuid: string | null, ref: string) => ["order", companyUuid, ref] as const,
  orderTracker: (companyUuid: string | null, ref: string) => ["orderTracker", companyUuid, ref] as const,
  orderEta: (companyUuid: string | null, ref: string) => ["orderEta", companyUuid, ref] as const,
  orderGeofences: (companyUuid: string | null, driverUuid: string, orderRef: string) =>
    ["orderGeofences", companyUuid, driverUuid, orderRef] as const,
  route: (companyUuid: string | null, id: string) => ["route", companyUuid, id] as const,
  liveDrivers: (companyUuid: string | null) => ["liveDrivers", companyUuid] as const,
  nextActivity: (companyUuid: string | null, orderRef: string) =>
    ["nextActivity", companyUuid, orderRef] as const,
  fleet: (companyUuid: string | null) => ["fleet", companyUuid] as const,
  vehicle: (companyUuid: string | null, id: string) => ["vehicle", companyUuid, id] as const,
};

export { ORDERS_LIST_PARAMS };

