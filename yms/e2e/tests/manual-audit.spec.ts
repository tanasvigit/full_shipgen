import { test, expect } from "@playwright/test";
import { OUT_DIR, runManualAudit } from "../helpers/manual-audit";

test.describe.configure({ mode: "serial" });
test.setTimeout(3_600_000);

test.use({ video: "on" });

test("yard_admin complete visual manual audit", async ({ browser }) => {
  const result = await runManualAudit(browser, "yard_admin", "yard.admin@shipgen.demo", "Shipgen@Yms2026!");
  expect(result.modulesTested).toBeGreaterThanOrEqual(17);
  console.log(`Manual audit complete. Artifacts: ${OUT_DIR}`);
  console.log(
    `PASS=${result.passCount} FAIL=${result.failCount} NO_ACTION=${result.noActionCount} screenshots=${result.screenshots}`
  );
});
