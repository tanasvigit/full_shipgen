#!/usr/bin/env node
/**
 * Pre-release verification: build artifacts + critical files exist.
 */
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist", "index.html");

const required = [
  "src/contexts/TenantContext.jsx",
  "src/contexts/PlatformContext.jsx",
  "src/contexts/DemoModeContext.jsx",
  "src/lib/runtimeConfig.js",
  "src/lib/subscription/plans.js",
  "src/lib/fleetops/permissiveMode.js",
  "docs/SAAS-RELEASE.md",
  "docs/FLEETOPS-ROLE-QA.md",
  "docs/FLEETOPS-QA-HARDENING.md",
];

let failed = false;

for (const rel of required) {
  const full = path.join(root, rel);
  if (!existsSync(full)) {
    console.error(`Missing: ${rel}`);
    failed = true;
  }
}

console.log("Running production build…");
try {
  execSync("npm run build", { cwd: root, stdio: "inherit" });
} catch {
  failed = true;
}

if (!existsSync(dist)) {
  console.error("Build did not produce dist/index.html");
  failed = true;
}

if (failed) {
  process.exit(1);
}

console.log("Release verification passed.");
