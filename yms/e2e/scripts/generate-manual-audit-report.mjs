#!/usr/bin/env node
/**
 * Generates final-manual-audit.md from playwright-manual-audit/audit-state.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "playwright-manual-audit");
const STATE_JSON = path.join(OUT_DIR, "audit-state.json");
const FINAL_MD = path.join(OUT_DIR, "final-manual-audit.md");

function readJson() {
  if (!fs.existsSync(STATE_JSON)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(STATE_JSON, "utf8"));
}

function countStatus(rows, field = "status") {
  const counts = { PASS: 0, FAIL: 0, NO_ACTION: 0, DISABLED: 0, HIDDEN: 0 };
  for (const r of rows || []) {
    const s = String(r[field] || "").toUpperCase();
    if (s in counts) counts[s] += 1;
    else if (s === "WARN" || s === "SKIP_DISABLED") counts.DISABLED += 1;
  }
  return counts;
}

function topFailures(rows, limit = 15) {
  return (rows || [])
    .filter((r) => String(r.status).toUpperCase() === "FAIL")
    .slice(0, limit)
    .map((r) => `- **${r.module || r.route || "?"}** — ${r.control || r.dialog || r.row || "?"}: ${r.detail || ""}`)
    .join("\n");
}

function score(pass, fail, total) {
  if (total === 0) return 0;
  const raw = Math.round((pass / total) * 100);
  const penalty = Math.min(30, fail * 2);
  return Math.max(0, Math.min(100, raw - penalty));
}

const data = readJson();
if (!data) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    FINAL_MD,
    `# YARD.OS Manual Visual Audit\n\n_No audit-state.json found. Run \`npm run manual-audit\` first._\n`,
    "utf8"
  );
  process.exit(0);
}

const btnCounts = countStatus(data.buttonRows);
const modPass = (data.moduleRows || []).filter((m) => m.status === "PASS").length;
const modWarn = (data.moduleRows || []).filter((m) => m.status === "WARN").length;
const modFail = (data.moduleRows || []).filter((m) => m.status === "FAIL").length;
const net401 = (data.networkRows || []).filter((n) => n.status === 401).length;
const net403 = (data.networkRows || []).filter((n) => n.status === 403).length;
const net404 = (data.networkRows || []).filter((n) => n.status === 404).length;
const net500 = (data.networkRows || []).filter((n) => Number(n.status) >= 500).length;
const consoleErrors = (data.consoleRows || []).filter((c) => c.type === "error" || c.type === "pageerror").length;
const brokenButtons = (data.buttonRows || []).filter((b) => b.status === "FAIL").length;
const brokenDialogs = (data.dialogRows || []).filter((d) => d.status === "FAIL").length;
const brokenDrawers = (data.drawerRows || []).filter((d) => d.status === "FAIL").length;
const brokenExports = (data.buttonRows || []).filter((b) => b.type === "export" && b.status === "FAIL").length;

const totalInteractions =
  data.passCount + data.failCount + data.noActionCount + data.disabledCount + data.hiddenCount;
const overall = score(data.passCount, data.failCount, totalInteractions);

const md = `# YARD.OS Complete Visual Manual Audit

**Generated:** ${new Date().toISOString()}  
**Role:** ${data.role}  
**Started:** ${data.startedAt}  
**Finished:** ${data.finishedAt}

## Executive Summary

| Metric | Count |
|--------|------:|
| Modules tested | ${data.modulesTested} |
| Buttons tested | ${data.buttonsTested} |
| Tables tested | ${data.tablesTested} |
| Dialogs tested | ${data.dialogsTested} |
| Drawers tested | ${data.drawersTested} |
| Exports tested | ${data.exportsTested} |
| Screenshots captured | ${data.screenshots} |
| **PASS** | **${data.passCount}** |
| **FAIL** | **${data.failCount}** |
| NO_ACTION | ${data.noActionCount} |
| DISABLED | ${data.disabledCount} |
| HIDDEN/SKIP | ${data.hiddenCount} |
| **Overall application score** | **${overall}/100** |

## Module Results

| Module | Route | Status |
|--------|-------|--------|
${(data.moduleRows || [])
  .map((m) => `| ${m.module} | \`${m.route}\` | **${m.status}** |`)
  .join("\n")}

- Modules PASS: ${modPass}
- Modules WARN: ${modWarn}
- Modules FAIL: ${modFail}

## Button Audit

| Status | Count |
|--------|------:|
| PASS | ${btnCounts.PASS} |
| FAIL | ${btnCounts.FAIL} |
| NO_ACTION | ${btnCounts.NO_ACTION} |
| DISABLED | ${btnCounts.DISABLED} |
| HIDDEN | ${btnCounts.HIDDEN} |

### Broken Buttons (sample)

${topFailures(data.buttonRows) || "_None_"}

## Dialogs & Drawers

| Type | Tested | Broken |
|------|-------:|-------:|
| Dialogs | ${data.dialogsTested} | ${brokenDialogs} |
| Drawers | ${data.drawersTested} | ${brokenDrawers} |

### Broken Dialogs

${topFailures(data.dialogRows) || "_None_"}

## Exports / Downloads

- Exports tested: ${data.exportsTested}
- Broken exports: ${brokenExports}

## Network Issues

| Status | Count |
|--------|------:|
| 401 | ${net401} |
| 403 | ${net403} |
| 404 | ${net404} |
| 500+ | ${net500} |
| Failed (0) | ${(data.networkRows || []).filter((n) => n.status === 0).length} |

See \`network-errors.csv\` for full list.

## Console Issues

- Errors/warnings captured: ${data.consoleRows?.length || 0}
- Hard errors/pageerrors: ${consoleErrors}

See \`console-errors.csv\` for full list.

## Artifacts

| File | Description |
|------|-------------|
| \`screenshots/\` | Before/after module and interaction shots |
| \`videos/\` | Session recordings |
| \`button-results.csv\` | Per-button outcomes |
| \`table-results.csv\` | Table row/action results |
| \`dialog-results.csv\` | Dialog lifecycle checks |
| \`drawer-results.csv\` | Drawer open/close results |
| \`network-errors.csv\` | API failures |
| \`console-errors.csv\` | JS console capture |
| \`module-summary.csv\` | Per-module summary |

## Logged Errors

${data.errors?.length ? data.errors.map((e) => `- ${e}`).join("\n") : "_None_"}

---

_Test-only audit. Application code was not modified._
`;

fs.writeFileSync(FINAL_MD, md, "utf8");
console.log(`Wrote ${FINAL_MD}`);
