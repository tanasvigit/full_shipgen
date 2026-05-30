/** Stable selectors — prefer data-testid, then roles. */
export const sel = {
  loginPage: '[data-testid="login-page"]',
  loginEmail: '[data-testid="login-email"]',
  loginPassword: '[data-testid="login-password"]',
  loginSubmit: '[data-testid="login-form-submit-button"]',
  loginError: '[data-testid="login-error"]',
  twoFaPage: '[data-testid="two-fa-page"]',
  consoleLayout: '[data-testid="console-layout"]',
  consoleMain: '[data-testid="console-main"]',
  consoleHeader: '[data-testid="console-header"]',
  consoleSidebar: '[data-testid="console-sidebar"]',
  pageHeader: '[data-testid="page-header"]',
  dataTable: '[data-testid="data-table"]',
  menuLogout: '[data-testid="menu-logout"]',
  commandPaletteTrigger: '[data-testid="command-palette-trigger"]',
  commandPaletteInput: '[data-testid="command-palette-input"]',
  orgSwitcher: '[data-testid="org-switcher"]',
  notificationsTrigger: '[data-testid="notifications-trigger"]',
};

export function sidebarLink(slug: string) {
  return `[data-testid="sidebar-link-${slug}"]`;
}

export function pageRoot(testId: string) {
  return `[data-testid="${testId}"]`;
}

export function dataTableSearch(testId = "data-table") {
  return `[data-testid="${testId}-search"]`;
}
