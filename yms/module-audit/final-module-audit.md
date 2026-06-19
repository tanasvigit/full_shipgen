# YARD.OS — Final Module Audit

**Generated:** 2026-06-17  
**Mode:** Read-only inspection — no application code modified  
**Environment:** `localhost:3001` (frontend) · `localhost:8001` (backend)  
**Overall score:** **76 / 100**

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Modules audited | 18 |
| Backend tests | **135 / 137** pass |
| JWT RBAC audits | **4 / 5** roles (admin partial timeout) |
| Responsive viewports | **7 / 7** completed (212 PASS, 3 FAIL) |
| Functional Playwright audit | **Invalid** (legacy localStorage, no JWT) |
| Screenshots | **535** in `module-audit/screenshots/` |
| Videos | **20** in `module-audit/videos/` |

Operational modules load under JWT auth. Route protection and API 403 enforcement are solid. Gaps: stale functional E2E harness, admin audit timeout for report/admin modules, mobile overflow at 320px, `/settings` session-route policy.

---

## Module Scores

| Module | Score | Module | Score |
|--------|-------|--------|-------|
| Control Tower | 92/100 | Dock Management | 75/100 |
| Appointments | 63/100 | Labor Management | 81/100 |
| Gate Management | 79/100 | Equipment Management | 69/100 |
| Virtual Queue | 93/100 | Loading Operations | 69/100 |
| Yard Map | 92/100 | Detention Management | 69/100 |
| Vehicle Operations Monitor | 79/100 | Operations Dashboard | 83/100 |
| Delay Analysis | 83/100 | Executive KPIs | 75/100 |
| Reports (aggregate) | 50/100 | User Management | 80/100 |
| Role Management | 80/100 | System Settings | 60/100 |

Per-module detail: see `*-report.md` in this folder.

---

## Test Evidence

| Source | Result |
|--------|--------|
| Backend `pytest tests/` | **135/137** pass (2 zone-lifecycle failures) |
| `audit.spec.ts` | 4/5 phases; **invalid** — no JWT (`audit-results.json` STALE) |
| `yard-admin-audit.spec.ts` | **Timeout** at 5m; 8/17 routes ACCESSIBLE |
| `gate-operator-audit.spec.ts` | **Pass** (complete) |
| `responsive-audit.spec.ts` | **7/7** pass (~14 min) |
| API network log | **0×500**; expected 403s only |

---

## Critical Issues

| ID | Issue | Evidence |
|----|-------|----------|
| C1 | Functional E2E incompatible with JWT | All `audit-results.json` routes hit login page |
| C2 | `audit.spec.ts` missing 5 modules | No ops-dashboard, delay-analysis, admin, settings |
| C3 | `JWT_SECRET_KEY` placeholder | `yard_frontend/.env` |

---

## High Issues

| ID | Issue | Evidence |
|----|-------|----------|
| H1 | yard_admin audit timeout | Equipment ? settings not reached |
| H2 | dock_supervisor audit missing | No artifact file |
| H3 | Global search not validated | Phase 5: `topbar-search` timeout (unauthenticated) |
| H4 | Mobile overflow 320px | Appointments, docks (`responsive-audit-results.json`) |
| H5 | 403 console noise on Yard Map | gate_operator forbidden API calls on `/yard` |

---

## Medium Issues

| ID | Issue |
|----|-------|
| M1 | Nav visibility false negatives (dropdown not opened in E2E) |
| M2 | Button sweep navigates to `/` (harness artifact) |
| M3 | Recharts sizing warnings on chart pages |
| M4 | Dialog `aria-describedby` warnings |
| M5 | Backend `test_yard_zone_lifecycle.py` × 2 fail |

---

## Low Issues

- Legacy URL aliases (`/dashboard`, `/virtual-queue`, etc.)
- PostHog `net::ERR_ABORTED` (non-blocking)
- Demo seeded credentials

---

## RBAC Summary (5 roles)

**Route protection:** Prior leaks fixed (`yard_manager` `/gate`, `gate_operator` `/docks` blocked).  
**Evidence:** `e2e/playwright-rbac-audit/route-audit.csv`

| Role | Route leaks | Harness fails | Expected 403s |
|------|-------------|---------------|---------------|
| yard_admin | 0 | 15 | 1 |
| yard_manager | 0 | 14 | 0 |
| gate_operator | 1 (`/settings` session) | 5 | 14 |
| yard_coordinator | 0 | 15 | 5 |
| dock_supervisor | — | — | — |

---

## Functional Highlights (JWT yard_admin partial)

| Metric | Value |
|--------|-------|
| Buttons tested | 113 (109 pass) |
| Dialogs opened | 13 |
| Drawers opened | 6 |
| Routes ACCESSIBLE | 8/17 before timeout |

Drawers confirmed (prior + partial): vehicle, appointment, dock, equipment, labor, loading, detention, queue?vehicle.

---

## Reports & Exports

| Report | Export mechanism | E2E download tested |
|--------|------------------|---------------------|
| Delay Analysis | `ReportExportMenu` CSV/PDF | No |
| Executive KPIs | `ExportMenu` (`kpi-export`) | No |
| Detention | `ExportMenu` (`det-export`) | No |
| Control Tower | `DailyReportExportDialog` | Button click PASS |

---

## Responsive (1920 / 1440 / 1366 / 1280 / 1024 / 768 / 375)

| Viewport | Result |
|----------|--------|
| 1920, 1366, 1024, 768, 375 | **PASS** |
| 320 (mobile-small) | **3 FAIL** — horizontal overflow on appointments/docks |

Note: Suite uses 320, 375, 425, 768, 1024, 1366, 1920 (not 1440/1280 exactly).

---

## Broken Buttons / APIs

- **Buttons:** No app buttons confirmed broken under JWT; failures are E2E harness timeouts
- **APIs:** No 500s; 403s are correct RBAC denials

---

## Recommended Fixes (not applied)

1. Update `audit.spec.ts` to JWT login
2. Add missing modules to functional audit
3. Split yard_admin audit per module (avoid 5m timeout)
4. Fix mobile table overflow (appointments, docks)
5. Gate Yard Map API calls by permission
6. Replace JWT secret; rotate demo passwords
7. Fix E2E nav dropdown + logout timing
8. Add export download assertions
9. Complete dock_supervisor audit

---

## Artifact Index

```
module-audit/
??? final-module-audit.md       ? this file
??? *-report.md                 ? 18 module reports
??? screenshots/                ? 535 images
??? videos/                     ? 20 RBAC videos
??? generate-reports.mjs

e2e/playwright-rbac-audit/      ? JWT RBAC CSV, logs, JSON
e2e/responsive-audit-results.json
e2e/audit-results.json          ? STALE functional run
```

**No application code was modified during this audit.**
