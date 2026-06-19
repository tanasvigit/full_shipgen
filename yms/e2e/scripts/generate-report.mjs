#!/usr/bin/env node
/**
 * Regenerates PLAYWRIGHT_AUDIT_REPORT.md from audit-results.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsPath = path.join(__dirname, "..", "audit-results.json");
const reportPath = path.join(__dirname, "..", "..", "..", "PLAYWRIGHT_AUDIT_REPORT.md");
const screenshotsDir = path.join(__dirname, "..", "screenshots");

function load() {
  if (!fs.existsSync(resultsPath)) {
    console.error("No audit-results.json — run: npm run audit");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(resultsPath, "utf8"));
}

function section(title, lines) {
  if (!lines.length) return `## ${title}\n\n_None._\n\n`;
  return `## ${title}\n\n${lines.join("\n")}\n\n`;
}

function main() {
  const d = load();
  const routesPass = d.routes.filter((r) => r.status === "PASS").length;
  const routesFail = d.routes.filter((r) => r.status === "FAIL").length;
  const btnPass = d.buttons.filter((b) => b.result === "PASS").length;
  const btnNoAction = d.buttons.filter((b) => b.result === "NO_ACTION").length;
  const btnFail = d.buttons.filter(
    (b) =>
      b.result === "FAILED" ||
      (b.result === "ERROR" && !String(b.detail || "").includes("opened drawer"))
  ).length;
  const drawersOk = d.drawers.filter((x) => x.opens && x.closes).length;
  const formsPass = d.forms.filter((f) => f.status === "PASS").length;

  const failedRoutes = d.routes
    .filter((r) => r.status !== "PASS")
    .map(
      (r) =>
        `- **${r.path}** (${r.name}) — ${r.status}: ${r.issues.join("; ") || "see screenshot"}`
    );

  const passedRoutes = d.routes
    .filter((r) => r.status === "PASS")
    .map((r) => `- \`${r.path}\` — ${r.name}`);

  const failedButtons = d.buttons
    .filter((b) => b.result === "FAILED" || b.result === "ERROR")
    .map((b) => `- \`${b.route}\` **${b.label}** (\`${b.testId ?? "—"}\`) — ${b.result}${b.detail ? `: ${b.detail}` : ""}`);

  const noActionButtons = d.buttons
    .filter((b) => b.result === "NO_ACTION")
    .slice(0, 50)
    .map((b) => `- \`${b.route}\` ${b.label}`);

  const failedDrawers = d.drawers
    .filter((x) => !x.opens || !x.closes)
    .map((x) => `- **${x.drawer}** @ \`${x.route}\` — opens:${x.opens} closes:${x.closes} — ${x.detail ?? ""}`);

  const passedDrawers = d.drawers
    .filter((x) => x.opens && x.closes)
    .map((x) => `- ${x.drawer} @ ${x.route}`);

  const failedForms = d.forms.filter((f) => f.status === "FAIL");
  const passedForms = d.forms.filter((f) => f.status === "PASS");

  const apiByStatus = {};
  for (const a of d.apiFailures) {
    const k = a.status || "network";
    apiByStatus[k] = (apiByStatus[k] || 0) + 1;
  }

  const uniqueApi = [...new Map(d.apiFailures.map((a) => [`${a.method} ${a.status} ${a.url}`, a])).values()];

  const fixes = [];
  if (routesFail) fixes.push("Fix failed routes and API errors on initial load (see Failed Routes).");
  if (btnFail) fixes.push("Review failed button clicks — may need guards, loading states, or testids.");
  if (failedDrawers.length) fixes.push("Ensure list rows open drawers and Escape closes them.");
  if (failedForms.length) fixes.push("Complete form flows — seed data or fix submit handlers.");
  if (d.apiFailures.some((a) => a.status >= 500)) fixes.push("Investigate backend 5xx (detention, equipment search columns, etc.).");
  if (d.runtimeExceptions.length) fixes.push("Fix uncaught exceptions (null `.includes`, object-as-child, etc.).");
  if (d.rbac.some((r) => r.status === "FAIL")) fixes.push("Align RBAC: frontend disable vs API 403 for read_only.");

  let screenshotList = "";
  if (fs.existsSync(screenshotsDir)) {
    screenshotList = fs
      .readdirSync(screenshotsDir)
      .filter((f) => f.endsWith(".png"))
      .map((f) => `- \`yard_frontend/e2e/screenshots/${f}\``)
      .join("\n");
  }

  const md = `# Playwright Audit Report — Smart Yard / YMS

_Generated: ${d.meta.finishedAt || new Date().toISOString()}_

**Frontend:** ${d.meta.frontendUrl}  
**Backend:** ${d.meta.apiUrl}  
**Health:** frontend=${d.meta.healthy.frontend} backend=${d.meta.healthy.backend}

---

# Executive Summary

| Metric | Count |
|--------|------:|
| Routes tested | ${d.routes.length} |
| Routes passed | ${routesPass} |
| Routes failed/warn | ${routesFail + d.routes.filter((r) => r.status === "WARN").length} |
| Buttons tested | ${d.buttons.length} |
| Buttons PASS (navigation/overlay) | ${btnPass} |
| Buttons NO_ACTION | ${btnNoAction} |
| Buttons FAILED/ERROR | ${btnFail} |
| Drawers tested | ${d.drawers.length} |
| Drawers OK (open+close) | ${drawersOk} |
| Forms tested | ${d.forms.length} |
| Forms PASS | ${formsPass} |
| API failures captured | ${d.apiFailures.length} |
| Console errors | ${d.consoleErrors.length} |
| Runtime exceptions | ${d.runtimeExceptions.length} |
| Search queries | ${d.search.length} |
| RBAC checks | ${d.rbac.length} |

---

# Routes That Work

${passedRoutes.length ? passedRoutes.join("\n") : "_None recorded._"}

---

${section("Failed Routes", failedRoutes)}

${section("Failed Buttons", failedButtons)}

### Buttons with no visible effect (sample)

${noActionButtons.length ? noActionButtons.join("\n") : "_None._"}

---

${section("Failed Drawers", failedDrawers)}

### Drawers OK

${passedDrawers.length ? passedDrawers.join("\n") : "_None._"}

---

## Failed Forms

${failedForms.length ? failedForms.map((f) => `- **${f.id}** @ \`${f.route}\` — ${f.detail ?? ""}`).join("\n") : "_None._"}

## Forms OK

${passedForms.length ? passedForms.map((f) => `- ${f.id} @ ${f.route}`).join("\n") : "_None._"}

---

## API Failures

Summary by status: ${JSON.stringify(apiByStatus)}

${uniqueApi.slice(0, 80).map((a) => `- \`${a.method}\` **${a.status}** \`${a.url}\` (during \`${a.route}\`)`).join("\n") || "_None._"}

---

## Console Errors

${d.consoleErrors.slice(0, 60).map((e) => `- [\`${e.route}\`] **${e.type}**: ${e.text.slice(0, 200)}${e.location ? ` _(${e.location})_` : ""}`).join("\n") || "_None._"}

${d.consoleErrors.length > 60 ? `\n_…and ${d.consoleErrors.length - 60} more in audit-results.json_\n` : ""}

---

## Runtime Exceptions

${d.runtimeExceptions.map((e) => `- [\`${e.route}\`] ${e.message}\n  \`\`\`\n  ${(e.stack || "").split("\n").slice(0, 6).join("\n  ")}\n  \`\`\``).join("\n\n") || "_None._"}

---

## Search Audit

${d.search.map((s) => `- **${s.term}**: ${s.status} — results:${s.hasResults} ${s.detail ?? ""}`).join("\n") || "_Not run._"}

---

## RBAC Issues

${d.rbac.filter((r) => r.status === "FAIL").map((r) => `- **${r.id}** (${r.role}): ${r.detail}`).join("\n") || "_None._"}

### RBAC passed

${d.rbac.filter((r) => r.status === "PASS").map((r) => `- ${r.id}`).join("\n") || "_None._"}

---

## Screenshots

${screenshotList || "_No screenshots directory._"}

---

## Recommended Fixes

${fixes.map((f, i) => `${i + 1}. ${f}`).join("\n") || "1. Re-run audit after deploying fixes: `cd yard_frontend/e2e && npm run audit`"}

---

## Raw data

Full JSON: \`yard_frontend/e2e/audit-results.json\`  
HTML report: \`yard_frontend/e2e/playwright-report/index.html\`
`;

  fs.writeFileSync(reportPath, md, "utf8");
  console.log("Wrote", reportPath);
}

main();
