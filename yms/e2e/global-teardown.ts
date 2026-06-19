import { execSync } from "child_process";
import path from "path";
import { hydrateAuditFromDisk, saveAuditState } from "./helpers/audit-state";

export default async function globalTeardown() {
  hydrateAuditFromDisk();
  saveAuditState();
  const script = path.join(__dirname, "scripts", "generate-report.mjs");
  try {
    execSync(`node "${script}"`, { stdio: "inherit", cwd: __dirname });
  } catch (e) {
    console.error("Report generation failed:", e);
  }
}
