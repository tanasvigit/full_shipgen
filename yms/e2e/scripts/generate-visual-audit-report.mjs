#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..", "..", "playwright-visual-audit");
const RESULTS = path.join(ROOT, "visual-audit-results.json");
const CONSOLE_LOG = path.join(ROOT, "console-errors.log");
const NETWORK_LOG = path.join(ROOT, "network-errors.log");
const UI_FINDINGS = path.join(ROOT, "ui-findings.md");
const FINAL_REPORT = path.join(ROOT, "final-audit-report.md");

function load() {
  if (!fs.existsSync(RESULTS)) {
    console.error("No visual-audit-results.json — run visual audit first");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(RESULTS, "utf8"));
}

function computeStabilityScore(d) {
  let score = 100;
  const critical = d.uiFindings.filter((f) => f.severity === "critical").length;
  const high = d.uiFindings.filter((f) => f.severity === "high").length;
  const medium = d.uiFindings.filter((f) => f.severity === "medium").length;
  const low = d.uiFindings.filter((f) => f.severity === "low").length;
  score -= critical * 15;
  score -= high * 8;
  score -= medium * 4;
  score -= low * 2;
  const uniqueConsole = new Set(d.consoleErrors.map((e) => e.text.slice(0, 80))).size;
  score -= Math.min(15, uniqueConsole * 1.5);
  const uniqueNetwork = new Set(d.networkErrors.map((e) => e.url.split("?")[0])).size;
  score -= Math.min(10, uniqueNetwork * 2);
  if (!d.meta.healthy.frontend) score -= 10;
  if (!d.meta.healthy.backend) score -= 10;
  return Math.max(0, Math.round(score));
}

function main() {
  const d = load();
  d.stabilityScore = computeStabilityScore(d);
  fs.writeFileSync(RESULTS, JSON.stringify(d, null, 2));

  const consoleLines = d.consoleErrors.map(
    (e, i) =>
      `[${i + 1}] route=${e.route} type=${e.type}\n  ${e.text}${e.location ? `\n  at ${e.location}` : ""}`
  );
  fs.writeFileSync(CONSOLE_LOG, consoleLines.join("\n\n") || "No console errors captured.\n", "utf8");

  const networkLines = d.networkErrors.map(
    (e, i) => `[${i + 1}] route=${e.route}\n  ${e.method} ${e.status} ${e.url}`
  );
  fs.writeFileSync(NETWORK_LOG, networkLines.join("\n\n") || "No network failures captured.\n", "utf8");

  const findingsMd = `# UI Findings — YARD.OS Visual Audit

_Generated: ${d.meta.finishedAt || new Date().toISOString()}_

**Stability score:** ${d.stabilityScore}/100

## Summary

| Severity | Count |
|----------|------:|
| Critical | ${d.uiFindings.filter((f) => f.severity === "critical").length} |
| High | ${d.uiFindings.filter((f) => f.severity === "high").length} |
| Medium | ${d.uiFindings.filter((f) => f.severity === "medium").length} |
| Low | ${d.uiFindings.filter((f) => f.severity === "low").length} |

---

${d.uiFindings.length === 0 ? "_No UI issues recorded._\n" : d.uiFindings.map((f, i) => `### ${i + 1}. [${f.severity.toUpperCase()}] ${f.title}

- **Module:** ${f.module}
- **URL:** ${f.url}
- **Screenshot:** ${f.screenshot ? `\`screenshots/${path.basename(f.screenshot)}\`` : "_none_"}
- **Console:** ${f.consoleSnippet || "_n/a_"}
- **Network:** ${f.networkSnippet || "_n/a_"}

**Reproduction steps:**
${f.steps.map((s, j) => `${j + 1}. ${s}`).join("\n")}
`).join("\n")}
`;

  fs.writeFileSync(UI_FINDINGS, findingsMd, "utf8");

  const emptyTables = d.tablesInspected.filter((t) => t.empty);
  const failedDrawers = d.drawersTested.filter((x) => !x.ok);

  const finalMd = `# YARD.OS Final Visual Audit Report

_Generated: ${d.meta.finishedAt || new Date().toISOString()}_

## Executive summary

| Metric | Value |
|--------|------:|
| **Overall stability score** | **${d.stabilityScore}/100** |
| Frontend health | ${d.meta.healthy.frontend ? "OK" : "FAIL"} |
| Backend health | ${d.meta.healthy.backend ? "OK" : "FAIL"} |
| Modules tested | ${d.modulesTested.length} |
| Screens visited | ${d.screensVisited.length} |
| Buttons tested | ${d.buttonsTested} |
| Drawers tested | ${d.drawersTested.length} |
| Modals tested | ${d.modalsTested.length} |
| Tables inspected | ${d.tablesInspected.length} |
| Console errors | ${d.consoleErrors.length} |
| Network errors | ${d.networkErrors.length} |
| UI findings | ${d.uiFindings.length} |

**Frontend:** ${d.meta.frontendUrl}  
**Backend:** ${d.meta.apiUrl}  
**Mode:** Headed browser with session video

---

## Modules tested

${[...new Set(d.modulesTested)].map((m) => `- ${m}`).join("\n") || "_None_"}

---

## Screens visited

${d.screensVisited.map((s) => `- \`${s.path}\` — ${s.name} (${s.screenshot || "no screenshot"})`).join("\n") || "_None_"}

---

## Navigation items clicked

${d.navItemsClicked.map((n) => `- \`${n}\``).join("\n") || "_None_"}

---

## Buttons tested

Total interactive button clicks attempted: **${d.buttonsTested}**

---

## Drawers tested

${d.drawersTested.map((x) => `- ${x.ok ? "OK" : "FAIL"} \`${x.id}\` @ ${x.route}${x.detail ? ` — ${x.detail}` : ""}`).join("\n") || "_None_"}

---

## Modals tested

${d.modalsTested.map((m) => `- OK \`${m.id}\` @ ${m.route}`).join("\n") || "_None_"}

---

## Tables inspected

${d.tablesInspected.map((t) => `- \`${t.route}\` — ${t.rowCount} rows${t.empty ? " **(empty)**" : ""}`).join("\n") || "_None_"}

${emptyTables.length ? `\n### Empty tables (${emptyTables.length})\n\n${emptyTables.map((t) => `- ${t.route}`).join("\n")}\n` : ""}

---

## Yard Map interactions

${d.yardMapActions.map((a) => `- ${a}`).join("\n") || "_Not run_"}

---

## Errors found

### Console (${d.consoleErrors.length})

See \`console-errors.log\`. Sample:

${d.consoleErrors.slice(0, 15).map((e) => `- [\`${e.route}\`] ${e.type}: ${e.text.slice(0, 120)}`).join("\n") || "_None_"}

### Network (${d.networkErrors.length})

See \`network-errors.log\`. Sample:

${d.networkErrors.slice(0, 15).map((e) => `- \`${e.method}\` **${e.status}** ${e.url}`).join("\n") || "_None_"}

### UI findings (${d.uiFindings.length})

See \`ui-findings.md\` for full reproduction steps.

${d.uiFindings.slice(0, 20).map((f) => `- **[${f.severity}]** ${f.title} — ${f.screenshot ? `screenshots/${path.basename(f.screenshot)}` : "no screenshot"}`).join("\n") || "_None_"}

---

## Evidence

| Artifact | Location |
|----------|----------|
| Screenshots | \`playwright-visual-audit/screenshots/\` |
| Session video | \`playwright-visual-audit/videos/full-session.webm\` |
| Console log | \`playwright-visual-audit/console-errors.log\` |
| Network log | \`playwright-visual-audit/network-errors.log\` |
| Raw JSON | \`playwright-visual-audit/visual-audit-results.json\` |

---

## Stability assessment

**Score: ${d.stabilityScore}/100**

${d.stabilityScore >= 85 ? "Application appears stable for demo/UAT with minor polish items." : d.stabilityScore >= 70 ? "Application is usable but has notable UI/console/network issues to address." : "Application has significant stability or data issues requiring attention before release."}

${failedDrawers.length ? `\n**Drawer failures:** ${failedDrawers.length}` : ""}
${emptyTables.length ? `\n**Empty tables:** ${emptyTables.length}` : ""}
`;

  fs.writeFileSync(FINAL_REPORT, finalMd, "utf8");
  console.log("Wrote visual audit outputs to", ROOT);
}

main();
