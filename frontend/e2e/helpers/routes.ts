/**
 * Canonical console routes aligned with src/App.jsx and page data-testid attributes.
 */
export type RouteSpec = {
  path: string;
  testId: string;
  module: string;
  /** Sidebar link test id slug (label lowercased, spaces to dashes) */
  sidebarSlug?: string;
  requiresPermission?: string;
  /** Skip route audit when path needs dynamic :id */
  dynamic?: boolean;
};

export const AUTH_ROUTES = [
  { path: "/auth", testId: "login-page", module: "auth" },
  { path: "/auth/forgot-password", testId: "forgot-password-page", module: "auth" },
  { path: "/auth/two-fa", testId: "two-fa-page", module: "auth" },
] as const;

export const PROTECTED_ROUTES: RouteSpec[] = [
  { path: "/", testId: "dashboard-page", module: "console", sidebarSlug: "dashboard" },
  { path: "/notifications", testId: "notifications-page", module: "console", sidebarSlug: "notifications" },
  { path: "/account", testId: "account-page", module: "console", sidebarSlug: "account" },
  { path: "/settings", testId: "settings-page", module: "console", sidebarSlug: "settings" },

  { path: "/fleet-ops/operations/orders", testId: "orders-list-page", module: "fleetops", sidebarSlug: "orders" },
  { path: "/fleet-ops/operations/orders/new", testId: "order-new-page", module: "fleetops" },
  { path: "/fleet-ops/operations/routing", testId: "routes-list-page", module: "fleetops", sidebarSlug: "routing" },
  { path: "/fleet-ops/operations/routes", testId: "routes-list-page", module: "fleetops", sidebarSlug: "routes" },
  { path: "/fleet-ops/operations/orchestrator", testId: "orchestrator-page", module: "fleetops", sidebarSlug: "orchestrator" },
  { path: "/fleet-ops/operations/schedule", testId: "schedule-planner-page", module: "fleetops", sidebarSlug: "schedule" },
  { path: "/fleet-ops/operations/service-rates", testId: "service-rates-list-page", module: "fleetops", sidebarSlug: "service-rates" },
  { path: "/fleet-ops/management/drivers", testId: "drivers-list-page", module: "fleetops", sidebarSlug: "drivers" },
  { path: "/fleet-ops/management/vehicles", testId: "vehicles-list-page", module: "fleetops", sidebarSlug: "vehicles" },
  { path: "/fleet-ops/management/places", testId: "places-list-page", module: "fleetops", sidebarSlug: "places" },
  { path: "/fleet-ops/management/fleets", testId: "fleets-list-page", module: "fleetops", sidebarSlug: "fleets" },

  { path: "/iam/users", testId: "users-list-page", module: "iam", sidebarSlug: "users", requiresPermission: "users.view" },
  { path: "/iam/roles", testId: "roles-list-page", module: "iam", sidebarSlug: "roles", requiresPermission: "roles.view" },
  { path: "/iam/groups", testId: "groups-list-page", module: "iam", sidebarSlug: "groups", requiresPermission: "groups.view" },
  { path: "/iam/policies", testId: "policies-list-page", module: "iam", sidebarSlug: "policies", requiresPermission: "policies.view" },

  { path: "/storefront", testId: "storefront-home", module: "storefront" },
  { path: "/storefront/products", testId: "products-list-page", module: "storefront", sidebarSlug: "products" },
  { path: "/storefront/products/new", testId: "product-new-page", module: "storefront" },
  { path: "/storefront/catalogs", testId: "catalogs-list-page", module: "storefront", sidebarSlug: "catalogs" },
  { path: "/storefront/customers", testId: "customers-list-page", module: "storefront", sidebarSlug: "customers" },
  { path: "/storefront/networks", testId: "networks-list-page", module: "storefront", sidebarSlug: "networks" },
  { path: "/storefront/promotions", testId: "promotions-page", module: "storefront", sidebarSlug: "push-promotions" },
  { path: "/storefront/coupons", testId: "coupons-list-page", module: "storefront", sidebarSlug: "coupons" },
  { path: "/storefront/checkout", testId: "checkout-preview-page", module: "storefront", sidebarSlug: "checkout-preview" },

  { path: "/ledger", testId: "ledger-home", module: "ledger" },
  { path: "/ledger/billing/invoices", testId: "invoices-list-page", module: "ledger", sidebarSlug: "invoices" },
  { path: "/ledger/payments/transactions", testId: "transactions-list-page", module: "ledger", sidebarSlug: "transactions" },
  { path: "/ledger/payments/wallets", testId: "wallets-list-page", module: "ledger", sidebarSlug: "wallets" },
  { path: "/ledger/reports", testId: "ledger-reports-page", module: "ledger", sidebarSlug: "reports" },
  { path: "/ledger/accounting/chart-of-accounts", testId: "chart-of-accounts-page", module: "ledger", sidebarSlug: "chart-of-accounts" },
  { path: "/ledger/accounting/journal", testId: "journal-entries-page", module: "ledger", sidebarSlug: "journal-entries" },

  { path: "/developers", testId: "developers-home", module: "developers" },
  { path: "/developers/api-keys", testId: "api-keys-list-page", module: "developers", sidebarSlug: "api-keys" },
  { path: "/developers/webhooks", testId: "webhooks-list-page", module: "developers", sidebarSlug: "webhooks" },
  { path: "/developers/events", testId: "events-list-page", module: "developers", sidebarSlug: "event-types" },
  { path: "/developers/logs", testId: "logs-list-page", module: "developers", sidebarSlug: "request-logs" },
  { path: "/developers/sockets", testId: "sockets-list-page", module: "developers", sidebarSlug: "realtime-sockets" },

  { path: "/pallet", testId: "pallet-home", module: "pallet" },
  { path: "/pallet/inventory", testId: "inventory-list-page", module: "pallet", sidebarSlug: "stock-levels" },
  { path: "/pallet/warehouses", testId: "warehouses-list-page", module: "pallet", sidebarSlug: "warehouses" },
  { path: "/pallet/transfers", testId: "transfers-list-page", module: "pallet", sidebarSlug: "transfers" },
  { path: "/pallet/suppliers", testId: "suppliers-list-page", module: "pallet", sidebarSlug: "suppliers" },
  { path: "/pallet/purchase-orders", testId: "purchase-orders-list-page", module: "pallet", sidebarSlug: "purchase-orders" },

  { path: "/registry", testId: "registry-page", module: "registry", sidebarSlug: "browse-extensions" },
];

/** Primary list table test id per route (null = cards / custom layout). */
export const ROUTE_TABLE_BY_PATH: Record<string, string | null> = {
  "/fleet-ops/operations/orders": "orders-table",
  "/fleet-ops/management/drivers": "drivers-table",
  "/fleet-ops/management/vehicles": "vehicles-table",
  "/fleet-ops/management/places": "places-table",
  "/fleet-ops/management/fleets": "fleets-table",
  "/iam/users": "users-table",
  "/storefront/products": "products-table",
  "/storefront/customers": "customers-table",
  "/storefront/coupons": "coupons-table",
  "/ledger/billing/invoices": "invoices-table",
  "/ledger/payments/transactions": "transactions-table",
  "/ledger/accounting/chart-of-accounts": "accounts-table",
  "/pallet/inventory": "inventory-table",
  "/pallet/transfers": "transfers-table",
  "/pallet/purchase-orders": "po-table",
  "/developers/api-keys": "api-keys-table",
  "/developers/webhooks": "webhooks-table",
  "/developers/logs": "logs-table",
};

export const NAV_SMART_LINKS = [
  { id: "fleet-ops", path: "/fleet-ops/operations/orders" },
  { id: "storefront", path: "/storefront" },
  { id: "ledger", path: "/ledger" },
  { id: "developers", path: "/developers" },
  { id: "pallet", path: "/pallet" },
  { id: "registry", path: "/registry" },
  { id: "iam", path: "/iam/users" },
] as const;
