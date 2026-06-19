import { test, expect } from "@playwright/test";
import { ROLE_CONFIGS, runRoleAudit, writeRoleArtifacts } from "../helpers/rbac-audit";

test.setTimeout(300_000);
test.use({ video: "on" });

test("gate_operator full RBAC audit", async ({ browser }) => {
  const result = await runRoleAudit(browser, ROLE_CONFIGS.gate_operator);
  writeRoleArtifacts(result);
  expect(result.routesTested).toBeGreaterThan(0);
});
