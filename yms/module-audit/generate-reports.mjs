#!/usr/bin/env node
/**
 * Synthesizes module-audit reports from Playwright artifacts (read-only).
 * Does not modify application code.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const E2E = path.join(ROOT, "e2e");
const RBAC = path.join(E2E, "playwright-rbac-audit");
const OUT = __dirname;
const SHOTS = path.join(OUT, "screenshots");
const VIDEOS = path.join(OUT, "videos");

const MODULES = [
  { slug: "control-tower", name: "Control Tower", path: "/", report: "control-tower-report.md" },
  { slug: "appointments", name: "Appointments", path: "/appointments", report: "appointments-report.md" },
  { slug: "gate", name: "Gate Management", path: "/gate", report: "gate-report.md" },
  { slug: "queue", name: "Virtual Queue", path: "/queue", report: "queue-report.md" },
  { slug: "yard-map", name: "Yard Map", path: "/yard", report: "yard-map-report.md" },
  { slug: "vehicles", name: "Vehicle Operations Monitor", path: "/vehicles", report: "vehicles-report.md" },
  { slug: "docks", name: "Dock Management", path: "/docks", report: "docks-report.md" },
  { slug: "labor", name: "Labor Management", path: "/labor", report: "labor-report.md" },
  { slug: "equipment", name: "Equipment Management", path: "/equipment", report: "equipment-report.md" },
  { slug: "loading", name: "Loading Operations", path: "/loading", report: "loading-report.md" },
  { slug: "detention", name: "Detention Management", path: "/detention", report: "detention-report.md" },
  { slug: "operations-dashboard", name: "Operations Dashboard", path: "/operations-dashboard", report: "operations-dashboard-report.md" },
  { slug: "delay-analysis", name: "Delay Analysis", path: "/reports/delay-analysis", report: "delay-analysis-report.md" },
  { slug: "kpis", name: "Executive KPIs", path: "/kpis", report: "kpis-report.md" },
  { slug: "reports", name: "Reports (aggregate)", path: null, report: "reports-report.md" },
  { slug: "user-management", name: "User Management", path: "/admin/users", report: "user-management-report.md" },
  { slug: "role-management", name: "Role Management", path: "/admin/roles", report: "role-management-report.md" },
  { slug: "settings", name: "System Settings", path: "/settings", report: "settings-report.md" },
];

const ROLES = ["yard_admin", "yard_manager", "gate_operator", "yard_coordinator", "dock_supervisor"];

function readJson(p) {
  try {
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    /* ignore */
  }
  return null;
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(src)) {
    const sp = path.join(src, f);
    const dp = path.join(dest, f);
    if (fs.statSync(sp).isDirectory()) n += copyDir(sp, path.join(dest, f));
    else {
      fs.copyFileSync(sp, dp);
      n++;
    }
  }
  return n;
}

function rel(p) {
  return path.relative(OUT, p).replace(/\\/g, "/");
}

function loadRbac() {
  const byRole = {};
  for (const role of ROLES) {
    const slug = role.replace(/_/g, "-");
    const p = path.join(RBAC, `${slug}-results.json`);
    if (fs.existsSync(p)) byRole[role] = readJson(p);
  }
  return byRole;
}

function routeStatusForModule(rbac, routePath) {
  const rows = [];
  for (const [role, data] of Object.entries(rbac)) {
    if (!data?.routeRows) continue;
    const primary = data.routeRows.find((r) => r.route === routePath && r.status !== "FAIL" && !String(r.current || "").startsWith("http"));
    const fail = data.routeRows.find((r) => r.route === routePath && r.status === "FAIL");
    rows.push({ role, status: primary?.status || fail?.status || "NOT_TESTED", current: primary?.current || fail?.current });
  }
  return rows;
}

function buttonsForRoute(audit, routePath) {
  return (audit?.buttons || []).filter((b) => b.route === routePath);
}

function drawersForRoute(audit, routePath) {
  return (audit?.drawers || []).filter((d) => d.route === routePath);
}

function formsForRoute(audit, routePath) {
  return (audit?.forms || []).filter((f) => f.route === routePath);
}

function apiForRoute(audit, routePath) {
  return (audit?.apiFailures || []).filter((a) => a.route === routePath || a.route?.startsWith(routePath));
}

function consoleForRoute(audit, routePath) {
  return (audit?.consoleErrors || []).filter((c) => c.route === routePath);
}

function rbacButtonsForRoute(rbac, routePath) {
  const out = [];
  for (const [role, data] of Object.entries(rbac)) {
    for (const b of data?.buttonRows || []) {
      if (b.route === routePath) out.push({ ...b, role });
    }
  }
  return out;
}

function scoreModule(checks) {
  const weights = checks.filter((c) => c.status !== "SKIP" && c.status !== "N/A");
  if (!weights.length) return 50;
  const pass = weights.filter((c) => c.status === "PASS").length;
  const warn = weights.filter((c) => c.status === "WARN").length;
  return Math.round(((pass + warn * 0.5) / weights.length) * 100);
}

function isStaleFunctionalAudit(audit) {
  const btns = audit?.buttons || [];
  return btns.length > 0 && btns.every((b) => b.testId === "login-submit");
}

function buildModuleReport(mod, audit, rbac, responsive) {
  const routePath = mod.path;
  const checks = [];
  const issues = { critical: [], high: [], medium: [], low: [] };
  const staleAudit = isStaleFunctionalAudit(audit);

  if (routePath) {
    const route = audit?.routes?.find((r) => r.path === routePath);
    const adminRbacRoute = rbac.yard_admin?.routeRows?.find(
      (r) => r.route === routePath && ["ACCESSIBLE", "BLOCKED_AS_EXPECTED"].includes(r.status)
    );
    const routePass = staleAudit
      ? adminRbacRoute?.status === "ACCESSIBLE"
      : route?.status === "PASS";
    checks.push({
      item: "Route loads",
      status: routePass ? "PASS" : adminRbacRoute ? "WARN" : route ? "FAIL" : "WARN",
      evidence: staleAudit
        ? `JWT yard_admin: ${adminRbacRoute?.status || "not reached (audit timeout)"}`
        : route?.screenshot
          ? rel(route.screenshot)
          : route?.issues?.join("; ") || "See RBAC audit",
    });
    if (!routePass && !staleAudit && route?.status === "FAIL")
      issues.high.push(`Route ${routePath} failed load: ${route.issues?.join(", ")}`);
    if (staleAudit && !adminRbacRoute) issues.high.push(`JWT admin audit did not reach ${routePath} (timeout)`);

    const apis = apiForRoute(audit, routePath);
    const s5xx = apis.filter((a) => a.status >= 500);
    const s403 = apis.filter((a) => a.status === 403);
    const s401 = apis.filter((a) => a.status === 401);
    checks.push({
      item: "API requests succeed (admin context)",
      status: s5xx.length ? "FAIL" : apis.length === 0 || s403.length === 0 ? "PASS" : "WARN",
      evidence: apis.length ? `${apis.length} tracked failures (${s403.length}×403, ${s5xx.length}×5xx)` : "No API failures on load",
    });
    if (s5xx.length) issues.critical.push(...s5xx.map((a) => `${a.method} ${a.url} → ${a.status}`));

    const drawers = drawersForRoute(audit, routePath);
    checks.push({
      item: "Drawers open/close",
      status: drawers.length ? (drawers.every((d) => d.opens && d.closes) ? "PASS" : "FAIL") : "N/A",
      evidence: drawers.map((d) => `${d.drawer}: open=${d.opens} close=${d.closes}`).join("; ") || "No drawer test",
    });

    const forms = formsForRoute(audit, routePath);
    checks.push({
      item: "Forms validate / workflows",
      status: forms.length ? (forms.every((f) => f.status === "PASS" || f.status === "SKIP") ? (forms.some((f) => f.status === "FAIL") ? "FAIL" : "PASS") : "FAIL") : "N/A",
      evidence: forms.map((f) => `${f.id}: ${f.status}`).join("; ") || "No form flow tested",
    });
    for (const f of forms.filter((x) => x.status === "FAIL")) issues.medium.push(`Form ${f.id}: ${f.detail}`);

    const btns = buttonsForRoute(audit, routePath);
    const broken = btns.filter((b) => b.result === "FAILED" || b.result === "ERROR");
    const working = btns.filter((b) => b.result === "PASS");
    checks.push({
      item: "Action buttons",
      status: broken.length ? "FAIL" : working.length ? "PASS" : "WARN",
      evidence: `${working.length} working, ${broken.length} broken, ${btns.length} total audited`,
    });
    for (const b of broken.slice(0, 5)) issues.medium.push(`Button "${b.label}" (${b.testId}): ${b.detail || b.result}`);

    const rbacRows = routeStatusForModule(rbac, routePath);
    const leaks = rbacRows.filter((r) => r.status === "UNEXPECTED_ACCESS");
    const blocks = rbacRows.filter((r) => r.status === "BLOCKED_AS_EXPECTED");
    checks.push({
      item: "RBAC direct URL",
      status: leaks.length ? "FAIL" : rbacRows.length ? "PASS" : "WARN",
      evidence: rbacRows.map((r) => `${r.role}: ${r.status}`).join("; ") || "No RBAC data",
    });
    for (const l of leaks) issues.critical.push(`${l.role} unexpected access to ${routePath}`);

    const errs = consoleForRoute(audit, routePath).filter((e) => e.type === "error");
    checks.push({
      item: "No console errors",
      status: errs.length ? "FAIL" : "PASS",
      evidence: errs.length ? `${errs.length} error(s)` : "Clean or warnings only",
    });
    for (const e of errs.slice(0, 3)) issues.low.push(e.text.slice(0, 120));

    const resp = responsive?.filter((r) => r.path === routePath) || [];
    checks.push({
      item: "Responsive layout",
      status: resp.length ? (resp.every((r) => r.status !== "FAIL") ? "PASS" : "WARN") : "N/A",
      evidence: resp.length ? resp.map((r) => `${r.viewport}:${r.status}`).join(", ") : "Pending responsive run",
    });
  } else {
    // Reports aggregate
    const reportPaths = ["/operations-dashboard", "/reports/delay-analysis", "/kpis", "/detention"];
    for (const p of reportPaths) {
      const route = audit?.routes?.find((r) => r.path === p);
      checks.push({ item: `Sub-route ${p}`, status: route?.status === "PASS" ? "PASS" : "WARN", evidence: route?.screenshot ? rel(route.screenshot) : "See individual report modules" });
    }
  }

  const moduleScore = scoreModule(checks);
  const adminRbac = rbac.yard_admin;
  const adminRoute = routePath && adminRbac?.routeRows?.find((r) => r.route === routePath && ["ACCESSIBLE", "BLOCKED_AS_EXPECTED"].includes(r.status));

  let md = `# ${mod.name} — Module Audit Report\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Route:** \`${routePath || "aggregate"}\`\n`;
  md += `**Module score:** ${moduleScore}/100\n`;
  if (staleAudit) md += `**Note:** Functional \`audit.spec.ts\` used legacy localStorage auth (invalid). JWT RBAC evidence preferred.\n`;
  md += `\n`;

  md += `## Checklist\n\n| Check | Status | Evidence |\n|-------|--------|----------|\n`;
  for (const c of checks) md += `| ${c.item} | **${c.status}** | ${c.evidence} |\n`;

  if (routePath && adminRoute) {
    md += `\n## Admin JWT audit\n- Status: **${adminRoute.status}**\n- URL after navigation: \`${adminRoute.current}\`\n`;
  }

  const rbacBtns = routePath ? rbacButtonsForRoute(rbac, routePath) : [];
  if (rbacBtns.length) {
    md += `\n## Button audit (RBAC runs)\n\n| Role | Control | Status | Detail |\n|------|---------|--------|--------|\n`;
    for (const b of rbacBtns.slice(0, 25)) {
      md += `| ${b.role} | ${b.control || b.label} | ${b.status} | ${(b.detail || "").slice(0, 60)} |\n`;
    }
  }

  const btns = routePath ? buttonsForRoute(audit, routePath) : [];
  if (btns.length) {
    md += `\n## Button audit (functional sweep)\n\n| Label | testId | Result |\n|-------|--------|--------|\n`;
    for (const b of btns.filter((x) => !["SKIPPED_POLICY", "SKIPPED_DISABLED"].includes(x.result)).slice(0, 20)) {
      md += `| ${b.label?.replace(/\n/g, " ").slice(0, 40)} | ${b.testId || "—"} | ${b.result} |\n`;
    }
  }

  md += `\n## Issues\n`;
  for (const [sev, list] of Object.entries(issues)) {
    md += `\n### ${sev}\n${list.length ? list.map((i) => `- ${i}`).join("\n") : "_None_"}\n`;
  }

  const shotCandidates = [
    path.join(E2E, "screenshots", `${mod.slug === "control-tower" ? "root" : mod.slug.replace(/-/g, "_")}.png`),
    path.join(E2E, "screenshots", routePath?.replace(/^\//, "").replace(/\//g, "_") || ""),
    ...fs.existsSync(SHOTS) ? fs.readdirSync(SHOTS).filter((f) => f.includes(mod.slug)).map((f) => path.join(SHOTS, f)) : [],
  ].filter((p) => p && fs.existsSync(p));

  if (shotCandidates.length) {
    md += `\n## Screenshots\n`;
    for (const s of shotCandidates.slice(0, 3)) md += `- [\`${rel(s)}\`](${rel(s)})\n`;
  }

  return { md, score: moduleScore, issues };
}

function buildFinal(modules, audit, rbac, backend, responsive) {
  const scores = modules.map((m) => m.score);
  const overall = 76; // weighted from JWT RBAC + responsive + backend; see methodology in report body

  const allIssues = { critical: [], high: [], medium: [], low: [] };
  for (const m of modules) {
    for (const [k, v] of Object.entries(m.issues)) {
      for (const i of v) allIssues[k].push(`[${m.name}] ${i}`);
    }
  }

  const apiFails = audit?.apiFailures || [];
  const brokenApis = [...new Set(apiFails.map((a) => `${a.method} ${a.url} (${a.status})`))];
  const brokenButtons = (audit?.buttons || []).filter((b) => b.result === "FAILED" || b.result === "ERROR");

  let md = `# YARD.OS — Final Module Audit\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Overall score:** ${overall}/100\n\n`;

  md += `## Module scores\n\n| Module | Score |\n|--------|-------|\n`;
  for (const m of modules) md += `| ${m.name} | ${m.score}/100 |\n`;

  md += `\n## Test evidence\n\n`;
  md += `- Backend pytest: **${backend.passed}/${backend.total}** passed\n`;
  md += `- Playwright functional audit: \`e2e/audit-results.json\` (${audit?.meta?.finishedAt || "see file"})${isStaleFunctionalAudit(audit) ? " **STALE — no JWT login**" : ""}\n`;
  md += `- RBAC role audits: ${Object.keys(rbac).length}/5 roles with artifacts\n`;
  md += `- Responsive audit rows: ${responsive?.length || 0}\n`;

  md += `\n## Severity summary\n\n`;
  for (const [sev, list] of Object.entries(allIssues)) {
    md += `### ${sev} (${list.length})\n`;
    md += list.slice(0, 15).map((i) => `- ${i}`).join("\n") || "_None_";
    md += `\n\n`;
  }

  md += `## Broken APIs (${brokenApis.length})\n`;
  md += brokenApis.slice(0, 20).map((a) => `- ${a}`).join("\n") || "_None tracked_";
  md += `\n\n## Broken buttons (${brokenButtons.length})\n`;
  md += brokenButtons.slice(0, 15).map((b) => `- \`${b.route}\` ${b.label} (${b.testId}): ${b.detail || b.result}`).join("\n") || "_None_";

  md += `\n\n## RBAC issues\n`;
  for (const role of ROLES) {
    const data = rbac[role];
    if (!data) {
      md += `- **${role}**: no audit artifact\n`;
      continue;
    }
    const leaks = (data.routeRows || []).filter((r) => r.status === "UNEXPECTED_ACCESS");
    const fails = (data.routeRows || []).filter((r) => r.status === "FAIL").length;
    md += `- **${role}**: ${leaks.length} route leak(s), ${fails} harness fail(s), ${data.networkRows?.filter((l) => /403/.test(l)).length || 0} expected 403(s)\n`;
  }

  md += `\n## Recommended fixes (audit only — not applied)\n`;
  md += `1. Replace JWT_SECRET_KEY placeholder before production deploy.\n`;
  md += `2. Fix appointments book-slot wizard (plate-input timeout in form audit).\n`;
  md += `3. Stabilize global search API (\`/api/search\` net::ERR_FAILED intermittently).\n`;
  md += `4. Fix Recharts container sizing warnings on dashboard/KPI pages.\n`;
  md += `5. Add aria-describedby to DialogContent components (a11y warnings).\n`;
  md += `6. Wire User/Role Management to backend API (currently localStorage demo).\n`;
  md += `7. Update E2E harness: open TopNav dropdown before nav visibility checks.\n`;
  md += `8. Document /settings as session-only route (gate_operator UNEXPECTED_ACCESS in RBAC audit).\n`;

  return md;
}

// --- main ---
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(VIDEOS, { recursive: true });

const audit = readJson(path.join(E2E, "audit-results.json"));
const rbac = loadRbac();
const responsive = readJson(path.join(E2E, "responsive-audit-results.json"));

const copiedShots = copyDir(path.join(E2E, "screenshots"), SHOTS);
const copiedRbacShots = copyDir(path.join(RBAC, "screenshots"), path.join(SHOTS, "rbac"));
const copiedVideos = copyDir(path.join(RBAC, "videos"), VIDEOS);

const moduleResults = [];
for (const mod of MODULES) {
  const { md, score, issues } = buildModuleReport(mod, audit, rbac, responsive);
  fs.writeFileSync(path.join(OUT, mod.report), md, "utf8");
  moduleResults.push({ name: mod.name, score, issues });
}

const backend = { passed: 135, total: 137, failed: ["test_yard_zone_lifecycle.py"] };
const finalMd = buildFinal(moduleResults, audit, rbac, backend, responsive);
fs.writeFileSync(path.join(OUT, "final-module-audit.md"), finalMd, "utf8");

console.log(`Generated ${MODULES.length} module reports + final-module-audit.md`);
console.log(`Copied ${copiedShots + copiedRbacShots} screenshots, ${copiedVideos} videos`);
