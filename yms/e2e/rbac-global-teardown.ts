import { execSync } from "child_process";
import path from "path";

export default async function rbacGlobalTeardown() {
  const script = path.join(__dirname, "scripts", "aggregate-rbac-audit.mjs");
  try {
    execSync(`node "${script}"`, { stdio: "inherit", cwd: __dirname });
  } catch (e) {
    console.error("RBAC report aggregation failed:", e);
  }
}
