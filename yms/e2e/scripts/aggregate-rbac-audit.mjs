#!/usr/bin/env node
/**
 * Aggregates per-role RBAC audit JSON into final-rbac-audit.md and summary CSVs.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "playwright-rbac-audit");
const SHOTS_DIR = path.join(OUT_DIR, "screenshots");
const VIDEOS_DIR = path.join(OUT_DIR, "videos");
const FINAL_MD = path.join(OUT_DIR, "final-rbac-audit.md");

const ROLE_SLUGS = [
  "yard-admin",
  "yard-manager",
  "gate-operator",
  "yard-coordinator",
  "dock-supervisor",
];

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count += countFiles(path.join(dir, entry.name));
    else count += 1;
  }
  return count;
}

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join("\n");
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function loadPlaywrightStats() {
  const resultsPath = path.join(__dirname, "..", "test-results", "rbac-playwright-results.json");
  const fallbackPath = path.join(__dirname, "..", "test-results", "playwright-results.json");
  const resolved = fs.existsSync(resultsPath) ? resultsPath : fallbackPath;
  if (!fs.existsSync(resolved)) {
    return { passed: 0, failed: 0, skipped: 0 };
  }
  try {
    const data = JSON.parse(fs.readFileSync(resolved, "utf8"));
    const stats = data.stats || {};
    const rbacTitles = [
      "auth-audit",
      "yard-admin-audit",
      "yard-manager-audit",
      "gate-operator-audit",
      "yard-coordinator-audit",
      "dock-supervisor-audit",
    ];
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    const walk = (suites) => {
      for (const suite of suites || []) {
        for (const spec of suite.specs || []) {
          const file = spec.file || suite.file || "";
          if (!rbacTitles.some((t) => file.includes(t))) continue;
          for (const t of spec.tests || []) {
            const last = t.results?.[t.results.length - 1];
            if (!last) continue;
            if (last.status === "passed") passed += 1;
            else if (last.status === "skipped") skipped += 1;
            else failed += 1;
          }
        }
        walk(suite.suites);
      }
    };
    walk(data.suites);

    if (passed + failed + skipped === 0) {
      return {
        passed: stats.expected ?? 0,
        failed: stats.unexpected ?? 0,
        skipped: stats.skipped ?? 0,
      };
    }
    return { passed, failed, skipped };
  } catch {
    return { passed: 0, failed: 0, skipped: 0 };
  }
}

function main() {
  const roleResults = [];
  const allRouteRows = [];
  const allButtonRows = [];
  const allNavRows = [];

  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let totalCritical = 0;
  let totalHigh = 0;
  let totalMedium = 0;
  let totalLow = 0;
  let rolesCompleted = 0;

  for (const slug of ROLE_SLUGS) {
    const data = loadJson(path.join(OUT_DIR, `${slug}-results.json`));
    if (!data) continue;
    rolesCompleted += 1;
    roleResults.push(data);
    totalPassed += data.passed || 0;
    totalFailed += data.failed || 0;
    totalSkipped += data.skipped || 0;
    totalCritical += data.critical || 0;
    totalHigh += data.high || 0;
    totalMedium += data.medium || 0;
    totalLow += data.low || 0;
    allRouteRows.push(...(data.routeRows || []));
    allButtonRows.push(...(data.buttonRows || []));
    allNavRows.push(...(data.navRows || []));
  }

  const screenshotCount = countFiles(SHOTS_DIR);
  const videoCount = countFiles(VIDEOS_DIR);
  const pwStats = loadPlaywrightStats();

  fs.writeFileSync(path.join(OUT_DIR, "role-access-matrix.csv"), toCsv(allNavRows), "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "button-results.csv"), toCsv(allButtonRows), "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "route-audit.csv"), toCsv(allRouteRows), "utf8");

  const rbacFailures = allRouteRows.filter(
    (r) => r.status === "UNEXPECTED_ACCESS" || r.status === "UNEXPECTED_BLOCK"
  ).length;
  const stabilityScore = Math.max(
    0,
    100 - Math.min(50, Math.round((totalFailed / Math.max(1, totalPassed + totalFailed)) * 100))
  );
  const rbacScore = Math.max(0, 100 - rbacFailures * 10 - totalCritical);
  const securityScore = Math.max(0, 100 - totalHigh - rbacFailures * 8);
  const uiScore = Math.max(0, 100 - Math.min(40, totalMedium + totalFailed));

  const roleSummaries = roleResults
    .map(
      (r) =>
        `### ${r.role}\n- Passed: ${r.passed} | Failed: ${r.failed} | Skipped: ${r.skipped}\n- Report: [\`${r.reportSlug}-report.md\`](./${r.reportSlug}-report.md)\n`
    )
    .join("\n");

  const md = `# YARD.OS Final RBAC + Functional Playwright Audit

Generated: ${new Date().toISOString()}

## Test Summary (Playwright)
| Metric | Count |
|--------|-------|
| Passed | ${pwStats.passed} |
| Failed | ${pwStats.failed} |
| Skipped | ${pwStats.skipped} |

## Interaction Summary (all roles)
| Metric | Count |
|--------|-------|
| Passed | ${totalPassed} |
| Failed | ${totalFailed} |
| Skipped | ${totalSkipped} |
| Roles completed | ${rolesCompleted} / ${ROLE_SLUGS.length} |

## Artifacts
| Artifact | Count |
|----------|-------|
| Screenshots | ${screenshotCount} |
| Videos | ${videoCount} |

## Severity Summary
| Level | Count |
|-------|-------|
| Critical | ${totalCritical} |
| High | ${totalHigh} |
| Medium | ${totalMedium} |
| Low | ${totalLow} |

## Scores
- Overall Stability Score: ${stabilityScore}/100
- RBAC Score: ${rbacScore}/100
- Security Score: ${securityScore}/100
- UI Score: ${uiScore}/100

## Per-Role Reports
${roleSummaries || "_No role results found — run role audit specs first._"}

## Output Files
- \`screenshots/\` — per-role interaction captures
- \`videos/\` — per-role session recordings
- \`yard-admin-report.md\` … \`dock-supervisor-report.md\`
- \`role-access-matrix.csv\`, \`button-results.csv\`, \`route-audit.csv\`
- \`console-errors.log\`, \`network-errors.log\`

## Notes
- Each role runs as an independent Playwright test (5 min timeout).
- Individual page/button failures are logged and do not abort the role audit.
- A failure in one role does not block other roles (parallel-safe).
`;

  fs.writeFileSync(FINAL_MD, md, "utf8");
  console.log(`Aggregated RBAC audit → ${FINAL_MD}`);
  console.log(`Roles: ${rolesCompleted}/${ROLE_SLUGS.length}, screenshots: ${screenshotCount}, videos: ${videoCount}`);
}

main();
