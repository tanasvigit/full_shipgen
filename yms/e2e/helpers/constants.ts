/** Routes from App.js plus user-requested aliases (may 404). */
export const APP_ROUTES = [
  { path: "/", name: "Control Tower (Dashboard)", group: "control" },
  { path: "/appointments", name: "Appointments", group: "operations" },
  { path: "/gate", name: "Gate", group: "operations" },
  { path: "/queue", name: "Virtual Queue", group: "control" },
  { path: "/yard", name: "Yard Map", group: "control" },
  { path: "/docks", name: "Docks", group: "operations" },
  { path: "/vehicles", name: "Vehicles", group: "operations" },
  { path: "/loading", name: "Loading Ops", group: "operations" },
  { path: "/detention", name: "Detention", group: "reports" },
  { path: "/equipment", name: "Equipment", group: "resources" },
  { path: "/labor", name: "Labor", group: "resources" },
  { path: "/ai", name: "AI Insights", group: "reports" },
  { path: "/kpis", name: "Executive KPIs", group: "reports" },
] as const;

/** Legacy / doc aliases — not in React Router; audit records 404 vs redirect. */
export const ALIAS_ROUTES = [
  { path: "/dashboard", name: "Alias /dashboard" },
  { path: "/virtual-queue", name: "Alias /virtual-queue" },
  { path: "/yard-map", name: "Alias /yard-map" },
  { path: "/loading-ops", name: "Alias /loading-ops" },
] as const;

export const YMS_ROLES = [
  "admin",
  "operations",
  "gate",
  "supervisor",
  "read_only",
] as const;

export type YmsRole = (typeof YMS_ROLES)[number];

export const DRAWER_TEST_IDS = [
  "vehicle-drawer",
  "appointment-drawer",
  "dock-drawer",
  "equipment-drawer",
  "labor-drawer",
  "loading-op-drawer",
  "detention-drawer",
] as const;

export const SEARCH_QUERIES = [
  { term: "vehicle", label: "vehicle" },
  { term: "appointment", label: "appointment" },
  { term: "dock", label: "dock" },
  { term: "labor", label: "labor" },
  { term: "equipment", label: "equipment" },
  { term: "detention", label: "detention" },
] as const;

/** Buttons skipped during blind click sweep (destructive / RBAC / auth). */
export const BUTTON_CLICK_SKIP_TESTIDS = new Set([
  "logout-btn",
  "dialog-submit-btn",
  "appt-cancel",
  "drawer-cancel-btn",
  "gate-manual-lookup",
  "approve-checkin-btn",
  "reset-queue-btn",
  "brand-home",
  "quick-new-request",
  "topnav-alert",
  "topnav-notif",
  "topnav-user",
]);

export const BUTTON_CLICK_SKIP_PREFIXES = ["menu-", "nav-"];

export const BUTTON_CLICK_SKIP_PATTERNS = [
  /^role-/,
  /^promote-/,
  /^demote-/,
  /^call-/,
  /^ai-apply-/,
];

export const FORM_FLOWS = [
  {
    id: "appointments-book-slot",
    route: "/appointments",
    role: "operations" as YmsRole,
    steps: async () => ({ open: "new-appointment-btn", dialog: "book-slot-dialog" }),
  },
  {
    id: "gate-manual-lookup",
    route: "/gate",
    role: "gate" as YmsRole,
    testIds: ["gate-lookup-input", "gate-manual-lookup"],
  },
  {
    id: "gate-approve",
    route: "/gate",
    role: "gate" as YmsRole,
    testIds: ["approve-checkin-btn"],
    optional: true,
  },
  {
    id: "queue-call-in",
    route: "/queue",
    role: "operations" as YmsRole,
    testIds: ["call-"],
    prefix: true,
    optional: true,
  },
  {
    id: "dock-open",
    route: "/docks",
    role: "operations" as YmsRole,
    testIds: ["dock-card-", "bay-"],
    prefix: true,
    optional: true,
  },
  {
    id: "loading-op-row",
    route: "/loading",
    role: "operations" as YmsRole,
    testIds: ["op-row-"],
    prefix: true,
    optional: true,
  },
  {
    id: "equipment-card",
    route: "/equipment",
    role: "operations" as YmsRole,
    testIds: ["eq-card-"],
    prefix: true,
    optional: true,
  },
  {
    id: "labor-row",
    route: "/labor",
    role: "operations" as YmsRole,
    testIds: ["team-row-"],
    prefix: true,
    optional: true,
  },
  {
    id: "detention-row",
    route: "/detention",
    role: "supervisor" as YmsRole,
    testIds: ["det-row-"],
    prefix: true,
    optional: true,
  },
] as const;

export const RBAC_CHECKS = [
  {
    id: "read_only-cannot-approve-gate",
    role: "read_only" as YmsRole,
    route: "/gate",
    actionTestId: "approve-checkin-btn",
    expectDisabledOrHidden: true,
  },
  {
    id: "gate-role-on-gate-page",
    role: "gate" as YmsRole,
    route: "/gate",
    expectVisible: ["gate-manual-lookup", "gate-lookup-input"],
  },
  {
    id: "admin-role-dashboard",
    role: "admin" as YmsRole,
    route: "/",
    expectVisible: ["dashboard-refresh", "topnav"],
  },
] as const;
