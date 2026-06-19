import { execSync } from "child_process";
import path from "path";

export default async function globalTeardown() {
  const script = path.join(__dirname, "scripts", "generate-manual-audit-report.mjs");
  try {
    execSync(`node "${script}"`, { stdio: "inherit", cwd: __dirname });
  } catch (e) {
    console.error("Manual audit report generation failed:", e);
  }
}
