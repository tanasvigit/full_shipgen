import { test, expect } from "@playwright/test";
import { ROLE_CONFIGS, runRoleAudit, writeRoleArtifacts } from "../helpers/rbac-audit";

test.setTimeout(300_000);
test.use({ video: "on" });

test("yard_admin full RBAC audit", async ({ browser }) => {
  const result = await runRoleAudit(browser, ROLE_CONFIGS.yard_admin);
  writeRoleArtifacts(result);
  expect(result.routesTested).toBeGreaterThan(0);
});
