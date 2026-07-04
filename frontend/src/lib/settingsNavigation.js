/** Console pages surfaced under Settings instead of the main console sidebar. */

export const SETTINGS_CONSOLE_LINKS = [
  {
    id: "notifications",
    label: "Notifications",
    to: "/notifications",
    description: "Alerts and activity inbox for your workspace",
  },
  {
    id: "account",
    label: "Account",
    to: "/account",
    description: "Profile, security, and personal preferences",
  },
  {
    id: "onboarding",
    label: "Onboarding",
    to: "/onboarding",
    description: "Setup checklist and getting-started guides",
  },
  {
    id: "platform-health",
    label: "Platform health",
    to: "/admin/health",
    description: "API, websocket, and runtime diagnostics",
    adminOnly: true,
  },
];

export const SETTINGS_CONSOLE_ROUTES = new Set(SETTINGS_CONSOLE_LINKS.map((link) => link.to));

/**
 * @param {{ isConsoleAdmin?: boolean, isAdmin?: boolean }} ctx
 */
export function getSettingsConsoleLinks(ctx) {
  const isAdmin = Boolean(ctx.isConsoleAdmin ?? ctx.isAdmin);
  return SETTINGS_CONSOLE_LINKS.filter((link) => !link.adminOnly || isAdmin);
}

export function isSettingsConsolePath(pathname) {
  if (pathname.startsWith("/settings")) return true;
  if (pathname.startsWith("/notifications")) return true;
  if (pathname === "/account" || pathname.startsWith("/account/")) return true;
  if (pathname.startsWith("/onboarding")) return true;
  if (pathname.startsWith("/admin/health")) return true;
  return false;
}
