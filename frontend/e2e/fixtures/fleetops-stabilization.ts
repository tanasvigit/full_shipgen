import { test as base, expect } from "@playwright/test";
import {
  attachStabilizationDiagnostics,
  assertStabilizationSuiteClean,
  installUnhandledRejectionProbe,
  type StabilizationDiagnostics,
} from "../helpers/fleetops/stabilization";
import { attachRuntimeDiagnosticsOnFailure } from "../helpers/fleetops/scenario-diagnostics";

type FleetopsStabilizationFixtures = {
  stabilization: StabilizationDiagnostics;
};

export const test = base.extend<FleetopsStabilizationFixtures>({
  stabilization: [
    async ({ page }, use) => {
      await installUnhandledRejectionProbe(page);
      const stabilization = attachStabilizationDiagnostics(page);
      await use(stabilization);
      await assertStabilizationSuiteClean(page, stabilization);
    },
    { auto: true },
  ],
  page: async ({ page }, use, testInfo) => {
    await use(page);
    await attachRuntimeDiagnosticsOnFailure(page, testInfo);
  },
});

export { expect };
