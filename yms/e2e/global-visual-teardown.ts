import { execSync } from "child_process";
import path from "path";

export default async function globalTeardown() {
  const script = path.join(__dirname, "scripts", "generate-visual-audit-report.mjs");
  const results = path.join(__dirname, "..", "..", "playwright-visual-audit", "visual-audit-results.json");
  if (!require("fs").existsSync(results)) {
    console.warn("No visual-audit-results.json — skipping report generation");
    return;
  }
  try {
    execSync(`node "${script}"`, { stdio: "inherit", cwd: __dirname });
  } catch (e) {
    console.error("Visual audit report generation failed:", e);
  }
}
