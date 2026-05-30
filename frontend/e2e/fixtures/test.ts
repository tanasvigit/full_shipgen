import { test as base, expect } from "@playwright/test";
import { attachDiagnostics } from "../helpers/network";
import { expectConsoleShell } from "../helpers/navigation";
import { attachRuntimeDiagnosticsOnFailure } from "../helpers/fleetops/scenario-diagnostics";

type FleetbaseFixtures = {
  diagnostics: ReturnType<typeof attachDiagnostics>;
};

export const test = base.extend<FleetbaseFixtures>({
  diagnostics: async ({ page }, use) => {
    const diagnostics = attachDiagnostics(page);
    await use(diagnostics);
  },
  page: async ({ page }, use, testInfo) => {
    await use(page);
    await attachRuntimeDiagnosticsOnFailure(page, testInfo);
  },
});

export { expect };

export async function expectAuthenticatedConsole(page: import("@playwright/test").Page) {
  await expectConsoleShell(page);
  await expect(page).not.toHaveURL(/\/auth/);
}
