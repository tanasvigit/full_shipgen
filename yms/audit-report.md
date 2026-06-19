# YARD.OS — Final Production Readiness Audit Report

**Project:** YARD.OS Smart Yard Management System  
**Audit date:** 2026-06-17  
**Scope:** Full repository (frontend, backend, database, Docker, E2E validation)  
**Method:** Read-only inspection, backend test execution, Playwright result analysis  
**Constraint:** No code modifications were made during this audit.

---

## Executive Summary

YARD.OS is a functionally rich yard management platform with a solid operational backend (136 passing pytest tests), JWT authentication, module-based route guards on the frontend, and action-level write guards on most mutation APIs. Recent UI stabilization work (TopNav layout, dropdown z-index, Administration menu recovery) is in good shape.

**However, the application is not production-ready as-is.** Critical gaps center on security configuration (hardcoded secrets, demo credentials), incomplete RBAC enforcement on read APIs, and administration features that are demo-only (localStorage) rather than backed by the database.

| Score | Value | Assessment |
|-------|-------|------------|
| **Overall Project Score** | **74 / 100** | Strong operational core; blocked by production config and admin/security gaps |
| **Production Readiness** | **62 / 100** | Needs Improvement |
| **Security Score** | **68 / 100** | Needs Improvement |
| **RBAC Score** | **78 / 100** | Needs Improvement |
| **UI/UX Score** | **82 / 100** | Production Ready (with caveats) |
| **Performance Score** | **72 / 100** | Needs Improvement |

### Classification

| Area | Status |
|------|--------|
| Core yard workflows (gate, queue, docks, loading) | **Production Ready** (with security hardening) |
| Reports (routed pages) | **Production Ready** |
| Authentication (JWT login/refresh) | **Needs Improvement** |
| RBAC (write operations) | **Production Ready** |
| RBAC (read operations / UI actions) | **Critical Blocker** (GET bypass) |
| User & Role Management UI | **Critical Blocker** (demo-only) |
| Docker / secrets / env | **Critical Blocker** |
| E2E test coverage | **Needs Improvement** |

---

## Validation Evidence

### Backend tests
```
136 passed in 12.78s
```
Command: `python -m pytest tests/` in `yard_frontend/backend/`

### Playwright — route audit (`e2e/audit-results.json`, 2026-06-17)
| Category | Result |
|----------|--------|
| Primary routes (17) | **17 PASS** |
| Legacy alias routes (4) | **4 WARN** (no React route — expected) |
| Drawer interactions | **All PASS** (open, close, data loaded) |
| Form workflows | **7 PASS, 1 FAIL** |
| RBAC checks | **8 PASS** |
| Global search API | **4 net::ERR_FAILED** (intermittent / timing) |

### Playwright — responsive audit (`e2e/responsive-audit-results.json`)
| Status | Count |
|--------|-------|
| PASS | 29 |
| SKIP | 42 |
| FAIL | 0 |
| WARN | 0 |

**Note:** Only the `desktop` (1920×1080) viewport was captured in the latest responsive run. Viewports 1440, 1366, 1280, 1024, 768, and 375 were not fully exercised in that artifact.

### Playwright — topnav overlap (`e2e/tests/topnav-overlap.spec.ts`)
**6/6 PASS** at 1920, 1440, 1280, 1024, 768, 375 px (1366 px not in suite).

### Playwright — layout stabilization (`e2e/tests/layout-stabilization.spec.ts`)
**12/12 FAIL** — `loginAsRole` helper clears `sessionStorage` before navigation, causing `SecurityError` on `about:blank`. Same root cause documented in `e2e/helpers/responsive-audit.ts` lines 26–29.

### Playwright — admin management (`e2e/tests/admin-management.spec.ts`)
**1/1 PASS**

---

## 1. Role-Based Access Control (RBAC) Audit

### Roles verified

All five production roles are defined in `backend/auth_rbac.py` and seeded in `backend/services/auth_seed.py`:

| Role | Code | Backend permissions source |
|------|------|---------------------------|
| Yard Administrator | `yard_admin` | `{"*"}` — full access |
| Yard Manager | `yard_manager` | Operational modules + reports; **no Gate, Admin, or Settings** |
| Gate Operator | `gate_operator` | Gate + vehicles + view-only appointments/yard map |
| Yard Coordinator | `yard_coordinator` | Queue + yard map + vehicles + view-only appointments |
| Dock Supervisor | `dock_supervisor` | Docks, labor, equipment, loading, vehicles, yard map |

### What works

| Check | Status | Evidence |
|-------|--------|----------|
| Module visibility in nav | ✅ | `frontend_1/src/constants/navigation.js` — `filterNavMenu()` + `module` on each item |
| Hidden modules not rendered | ✅ | `TopNav.jsx` uses `filterNavMenu(NAV_MENU, can)` |
| Direct URL protection | ✅ | `ProtectedRoute.jsx` — redirects to `/unauthorized` when `!can(required)` |
| API write permission protection | ✅ | `yms.py`, `gate.py`, etc. use `require_permission()` on POST/PATCH/DELETE |
| Menu filtering | ✅ | Five sections: Control, Operations, Resources, Reports, Administration |
| JWT authorization flow | ✅ | Login → access + refresh tokens; `AuthContext` hydrates via `/auth/me` |
| Backend RBAC unit tests | ✅ | `backend/tests/test_auth_rbac.py` — 13 tests passing |

### Gaps and risks

#### CRITICAL — API GET requests bypass module guards

```44:47:yard_frontend/backend/auth_middleware.py
            # Writes are module-guarded; GET stays available to any authenticated user
            # so Yard Map / dashboards can load cross-module read data.
            if request.method not in ("GET", "HEAD"):
                check_route_module_access(path, ctx)
```

**Impact:** Any authenticated user (e.g. `gate_operator`) can call `GET /api/reports/*`, `GET /api/detention/*`, `GET /api/control-tower/*`, etc. directly, even when the UI hides those modules. This violates the audit requirement: *"No API can be accessed without permission."*

**Affected prefix guards** (only enforced on non-GET): `ROUTE_MODULE_GUARDS` in `auth_rbac.py` lines 210–226.

#### HIGH — No frontend action-level permission gating

`can(PERMS.*)` is used only in `TopNav.jsx` (module visibility). Operational pages (`Gate.jsx`, `Docks.jsx`, `VirtualQueue.jsx`, etc.) do **not** hide or disable action buttons by permission. Users see buttons that return 403 on click.

**Evidence:** Grep across `frontend_1/src/pages` shows `can(` usage only in `Login.jsx`, `Settings.jsx`, `UserManagement.jsx`, `Unauthorized.jsx`.

#### HIGH — Admin Role Management changes do not affect real RBAC

`RoleManagement.jsx` persists edits to `localStorage` key `yms_role_blueprints_v1`. Backend `ROLE_PERMISSIONS` in `auth_rbac.py` is the source of truth for JWT permissions. UI edits are cosmetic.

#### MEDIUM — `yard_manager` lacks Gate module

`yard_manager` does not include `MOD_GATE` in `ROLE_PERMISSIONS` (lines 131–166). Managers cannot access `/gate` in the UI (redirects to `/unauthorized`). Confirm whether this is intentional business policy or a permission gap.

#### MEDIUM — Role Management UI is admin-only in nav but not API-backed

Routes `/admin/users` and `/admin/roles` require `MOD_USER_MGMT` / `MOD_ROLE_MGMT` (admin only). Correct for UI. No backend CRUD APIs exist for users/roles beyond seed data.

#### LOW — Legacy role names in E2E

`e2e/audit-results.json` rbac section still references legacy aliases (`admin`, `gate`, `read_only`) from impersonation/dev tooling. Production roles work; test naming is stale.

### RBAC score rationale: **78/100**
Strong write-side enforcement and frontend route guards; deducted for GET bypass, missing UI action gating, and non-functional role editor.

---

## 2. Navigation Audit

### Top navigation structure

`frontend_1/src/constants/navigation.js` defines:

| Section | Items |
|---------|-------|
| Control | Control Tower, Virtual Queue, Yard Map, Recommendations |
| Operations | Appointments, Gate Management, Docks, Loading Ops |
| Resources | Vehicles, Equipment, Labor |
| Reports | Operations Dashboard, Delay Analysis, Detention Management, Executive KPIs |
| Administration | User Management, Role Management, System Settings |

### Book Appointment removal

| Location | Book Appointment present? |
|----------|---------------------------|
| `TopNav.jsx` | ❌ Removed |
| `MobileNav.jsx` | ❌ Removed |
| `TopBar.jsx` | ✅ **Still present** (`create-request-btn`, calls `openBookSlot()`) |
| `Appointments.jsx` | ✅ Page-level button (line 224) |
| `bookAppointmentRoutes.js` | Hides only on `/admin/*` and `/settings` |

**Finding:** Book Appointment was removed from primary nav per requirements but remains globally accessible via TopBar on most operational pages. This is an inconsistency (HIGH).

### Layout and z-index

- TopNav uses 3-zone flex layout with `z-[9999]` on dropdown content (`dropdown-menu.jsx`, `TopNav.jsx` line 48).
- `topnav-overlap.spec.ts`: **6/6 PASS** — no overlap/clipping at tested widths.

### Missing viewport in nav tests

User-requested 1366 px is not in `topnav-overlap.spec.ts` VIEWPORTS (has 1440, not 1366).

### Dead navigation artifact

`frontend_1/src/components/yms/Sidebar.jsx` — full alternate nav with outdated "Finance & Reports" section and no Administration. **Not imported anywhere** (orphan component).

### Legacy URL aliases

No React routes for `/dashboard`, `/virtual-queue`, `/yard-map`, `/loading-ops`. Audit marks these WARN; users hitting bookmarks see `NotFound` or blank content with console warning `"No routes matched location"`.

---

## 3. UI / UX Audit (by module)

| Module | Route | Status | Notes |
|--------|-------|--------|-------|
| Control Tower | `/` | ✅ Good | Recharts container warnings in console (width -1) |
| Appointments | `/appointments` | ✅ Good | Book button works; E2E test uses stale `plate-input` test id |
| Gate Management | `/gate` | ✅ Good | Manual lookup form PASS in audit |
| Virtual Queue | `/queue` | ✅ Good | Call-in PASS; one 403 on queue call API (permission-expected) |
| Yard Map | `/yard` | ✅ Good | Complex layout; responsive PASS at desktop |
| Vehicle Monitor | `/vehicles` | ✅ Good | |
| Dock Management | `/docks` | ✅ Good | Assign drawer PASS |
| Labor | `/labor` | ✅ Good | Assign drawer PASS |
| Equipment | `/equipment` | ✅ Good | Assign drawer PASS |
| Loading Operations | `/loading` | ✅ Good | Start/complete drawer PASS |
| Detention | `/detention` | ✅ Good | Review drawer PASS |
| Operations Dashboard | `/operations-dashboard` | ✅ Good | |
| Delay Analysis | `/reports/delay-analysis` | ✅ Good | Uses `OperationalReportPage` |
| Executive KPIs | `/kpis` | ✅ Good | Chart dimension warnings |
| Recommendations | `/ai` | ✅ Good | |
| User Management | `/admin/users` | ⚠️ Demo UX | Creates users in localStorage only — cannot log in |
| Role Management | `/admin/roles` | ⚠️ Demo UX | Edits do not change JWT permissions |
| System Settings | `/settings` | ✅ Good | Impersonation for admin testing |

### Cross-cutting UI issues

| Severity | Issue | Evidence |
|----------|-------|----------|
| MEDIUM | Recharts "width(-1) height(-1)" warnings on Dashboard, Appointments, Docks, Detention, KPIs | `e2e/audit-results.json` consoleErrors |
| MEDIUM | User Management shows plaintext passwords in localStorage | `adminUsersService.js` lines 13–49 |
| LOW | Daily report export dialog — recently fixed (per prior sprint) | `DailyReportExportDialog.jsx` |
| LOW | Exit verification drawer re-render — recently fixed | `ExitVerificationDrawer.jsx` |

---

## 4. Responsive Design Audit

### Automated coverage

| Viewport | Width | Latest responsive-audit run | topnav-overlap run |
|----------|-------|----------------------------|-------------------|
| Desktop | 1920 | ✅ PASS (29 pages) | ✅ PASS |
| Large laptop | 1440 | ❌ Not in latest artifact | ✅ PASS |
| Laptop HD | 1366 | ❌ Not run | ❌ Not in suite |
| Laptop | 1280 | ❌ Not in latest artifact | ✅ PASS |
| Laptop | 1024 | ❌ Not in latest artifact | ✅ PASS |
| Tablet | 768 | ❌ Not in latest artifact | ✅ PASS |
| Mobile | 375 | ❌ Not in latest artifact | ✅ PASS |

**Finding (HIGH):** Responsive audit spec supports 7 viewports (`responsive-audit.spec.ts` lines 8–16) but the saved results only contain `desktop`. A full multi-viewport run should be executed before production sign-off.

### Layout issue detection

`detectLayoutIssues()` checks horizontal scroll overflow. No FAIL entries in latest responsive results (desktop only).

### Mobile navigation

`MobileNav.jsx` provides hamburger + sheet pattern. No Book Appointment in mobile nav. TopBar provides mobile search toggle.

---

## 5. Functional Audit

### Workflows verified (via audit + backend tests)

| Workflow | Create | Edit | Delete | Search | Filter | Export |
|----------|--------|------|--------|--------|--------|--------|
| Appointments | ✅ API | ✅ API | — | ✅ | ✅ | — |
| Gate Entry | ✅ | ✅ | — | ✅ | ✅ | — |
| Queue Flow | ✅ | ✅ | — | ✅ | ✅ | — |
| Dock Assignment | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Labor Assignment | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Equipment Assignment | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Loading Operations | ✅ | ✅ | — | ✅ | ✅ | — |
| Exception Handling | ✅ | ✅ | — | — | ✅ | — |
| Detention | ✅ | ✅ | — | ✅ | ✅ | — |
| Reports | — | — | — | — | ✅ | ✅ |

### Broken / degraded workflows

| Severity | Workflow | Issue |
|----------|----------|-------|
| HIGH | Book Appointment (E2E) | Form test FAIL — looks for `[data-testid="plate-input"]` but `BookSlotDialog.jsx` uses `pickup-input`, `delivery-input`, `date-input` |
| MEDIUM | Global search from Control Tower | 4× `net::ERR_FAILED` on `/api/search` during audit (may be race/debounce; backend test `test_global_search.py` passes) |
| MEDIUM | User Management "Add User" | User saved to localStorage only — not in `users` table |
| LOW | Queue call-in 403 | Expected when audit user lacks `flow.call` permission |

---

## 6. Reports Audit

### Routed report pages (in `App.js`)

| Report | Route | Filters | CSV | PDF | Empty state | Loading state |
|--------|-------|---------|-----|-----|-------------|---------------|
| Operations Dashboard | `/operations-dashboard` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delay Analysis | `/reports/delay-analysis` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Detention | `/detention` | ✅ | ✅ | ✅ | ✅ | ✅ |
| Executive KPIs | `/kpis` | ✅ | ✅ | ✅ | ✅ | ✅ |

Export infrastructure: `ReportExportMenu.jsx`, `report_export_service.py`.

### Unused / unrouted report pages (cleanup candidates)

These files exist but are **not registered in `App.js`**:

| File | Backend API exists |
|------|-------------------|
| `pages/DockUtilizationReport.jsx` | ✅ `GET /api/reports/dock-utilization` |
| `pages/LaborProductivityReport.jsx` | ✅ |
| `pages/EquipmentUtilizationReport.jsx` | ✅ |
| `pages/SlaComplianceReport.jsx` | ✅ |
| `pages/VehicleJourneyAnalytics.jsx` | ✅ `GET /api/reports/vehicle-journey` |

**Recommendation:** Either route these pages under Reports or document them as future scope. Do not delete without product approval.

---

## 7. Security Audit

| Check | Status | Evidence |
|-------|--------|----------|
| JWT validation | ✅ | `auth_service.decode_access_token()` |
| Token expiration | ✅ | `JWT_ACCESS_EXPIRE_MINUTES` default 30 |
| Refresh token flow | ✅ | Rotate on refresh; stored hashed in `refresh_tokens` |
| Role enforcement (writes) | ✅ | `require_permission`, `require_role` |
| Role enforcement (reads) | ❌ | GET bypass in middleware |
| Route protection (frontend) | ✅ | `ProtectedRoute.jsx` |
| Input validation | ✅ | Pydantic schemas in `schemas.py` |
| XSS risks | ✅ Low | No `dangerouslySetInnerHTML` found in frontend |
| Sensitive data exposure | ❌ | Passwords in `adminUsersService.js` localStorage |
| Hardcoded credentials | ❌ | See below |

### Hardcoded / insecure configuration

| Item | Location | Risk |
|------|----------|------|
| `JWT_SECRET_KEY: dev-jwt-secret-change-in-production` | `docker-compose.yml` line 27 | **CRITICAL** |
| `POSTGRES_PASSWORD: smart_yard_password` | `docker-compose.yml` line 8 | **CRITICAL** |
| Fallback JWT secret if env missing | `auth_service.py` lines 23–27 | **CRITICAL** |
| Default demo users/passwords | `auth_seed.py` lines 12–17 | **HIGH** |
| `ENABLE_DEV_ROLE_OVERRIDE: "false"` | `docker-compose.yml` line 28 | ✅ Correctly disabled |

### CORS

`server.py` lines 44–50: origins from `CORS_ORIGINS` env; Docker sets `http://localhost:3001` only. Production must list actual deployment origins.

### Authentication headers

`ymsApi.js` attaches JWT via `getAuthHeaders()`. Refresh retry logic in `AuthContext.jsx`.

### Impersonation

`POST /api/auth/impersonate` — admin only (`require_role(YARD_ADMIN)`). Exposed in Settings UI under "Developer Tools". Should be disabled or removed in production builds.

---

## 8. Database Audit

### Schema overview (`backend/db.py`)

**Core operational tables:** `vehicles`, `appointments`, `queue_entries`, `docks`, `equipment`, `labor_teams`, `detention_records`, `yard_events`, `yard_zones`, `vehicle_zone_history`, `gate_verifications`, `loading_operation_exceptions`, `zone_rules`

**Auth tables:** `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `refresh_tokens`

**Legacy / low-use:** `status_checks` — used only by `routers/status.py` health demo endpoint

### Indexes

Comprehensive indexes present for:
- Vehicle, appointment, queue, dock lookups (status, codes, references)
- Detention billing and vehicle FKs
- Labor/equipment assignment FKs
- Yard zone and history
- Auth tables (username, role code, permission code, refresh token hash)

### Gaps and recommendations

| Severity | Item | Recommendation |
|----------|------|----------------|
| MEDIUM | `appointments.booking_date` | Consider index if date-range reports grow large |
| LOW | `status_checks` | Document as legacy or remove in future migration |
| LOW | Auth tables vs `auth_rbac.py` | `roles`/`permissions` tables are seeded but runtime RBAC uses Python dict — DB role edits don't affect JWT without code sync |
| INFO | Foreign keys | Properly defined with `ON DELETE RESTRICT` / `SET NULL` on core entities |

### Duplicate entities

No duplicate table definitions found. Frontend `adminUsersService` duplicates seed users in localStorage separately from PostgreSQL `users` table — logical duplication, not schema duplication.

---

## 9. Code Quality Audit

### Unused pages (not in `App.js`)

- `DockUtilizationReport.jsx`
- `LaborProductivityReport.jsx`
- `EquipmentUtilizationReport.jsx`
- `SlaComplianceReport.jsx`
- `VehicleJourneyAnalytics.jsx`

### Unused components

- `Sidebar.jsx` — not imported
- `bookAppointmentRoutes.js` — partially obsolete (TopBar still shows button)

### Unused routes

Legacy aliases `/dashboard`, `/virtual-queue`, `/yard-map`, `/loading-ops` — no React routes (redirects not configured).

### Dead / duplicate code

| Item | Location |
|------|----------|
| Sidebar nav duplicate of `navigation.js` | `Sidebar.jsx` |
| Role blueprints duplicated (backend dict + frontend catalog + localStorage) | `auth_rbac.py`, `adminRoleCatalog.js`, `RoleManagement.jsx` |
| User list duplicated (DB seed + localStorage) | `auth_seed.py`, `adminUsersService.js` |

### Test hygiene

- `layout-stabilization.spec.ts` — broken login helper (12 failures)
- `audit.spec.ts` book appointment step — stale selector `plate-input`

---

## 10. Performance Audit

| Area | Finding | Severity |
|------|---------|----------|
| JS bundle size | Docker build warning ~526 kB gzip (main chunk) | MEDIUM |
| Dashboard data loading | `DASHBOARD_LIST_LIMIT = 500`, `DASHBOARD_EVENTS_LIMIT = 300` — large initial fetch | MEDIUM |
| Recharts | Renders before container dimensions resolved — causes warnings and possible layout thrash | LOW |
| Repeated API calls | Pages listen to `yms-data-changed` and reload — appropriate for real-time yard ops | INFO |
| PostgreSQL connection pool | Single pool via `asyncpg` — adequate for initial deployment | INFO |
| Nginx | Gzip enabled for static assets; 7-day cache on hashed assets | ✅ |

### Recommendations

1. Code-split report and admin pages with `React.lazy()`.
2. Defer Recharts render until container `ResizeObserver` reports non-zero size.
3. Add pagination defaults below 500 for list endpoints on dashboard widgets.
4. Consider API response caching headers for report endpoints.

---

## 11. Production Readiness Audit

| Item | Status | Notes |
|------|--------|-------|
| Docker Compose | ✅ | 3 services: postgres, backend, frontend |
| Backend Dockerfile | ✅ | Python 3.11-slim, uvicorn |
| Frontend Dockerfile | ✅ | Multi-stage build → nginx |
| Health checks | ✅ | Postgres `pg_isready`, backend HTTP probe |
| Environment variables | ⚠️ | `.env.example` exists for backend only; no frontend `.env.example` |
| JWT secrets | ❌ | Hardcoded in compose |
| CORS | ⚠️ | Single origin in Docker |
| Error handling | ✅ | API returns structured errors; frontend `formatApiError` |
| Logging | ⚠️ | Basic Python `logging.INFO` only — no structured/centralized logging |
| HTTPS / TLS | ❌ | Not configured (nginx listens on 80) |
| Admin user provisioning | ❌ | Demo seed only |
| CI/CD | Not audited | No pipeline files reviewed in this pass |

---

## Issue Register

### Critical Issues

| ID | Issue | Evidence |
|----|-------|----------|
| C-01 | Hardcoded JWT secret and database password in `docker-compose.yml` | Lines 8, 27 |
| C-02 | Insecure JWT fallback when `JWT_SECRET_KEY` unset | `auth_service.py:23-27` |
| C-03 | API GET requests bypass module permission checks | `auth_middleware.py:44-47` |
| C-04 | User Management is localStorage demo — not connected to backend `users` table | `adminUsersService.js` — no `/api/admin/users` |
| C-05 | Role Management edits do not affect runtime RBAC | `RoleManagement.jsx` → localStorage only |

### High Issues

| ID | Issue | Evidence |
|----|-------|----------|
| H-01 | Book Appointment removed from nav but still in TopBar | `TopBar.jsx:144`, `bookAppointmentRoutes.js` |
| H-02 | No frontend action-level permission UI (buttons visible, API returns 403) | Pages lack `can(PERMS.*)` |
| H-03 | Default demo credentials seeded in production path | `auth_seed.py:12-17` |
| H-04 | Responsive audit incomplete — only desktop viewport in latest results | `responsive-audit-results.json` |
| H-05 | Five report pages implemented but not routed | `App.js` vs `*Report.jsx` files |
| H-06 | E2E appointment booking test broken (stale test id) | `audit-results.json` forms FAIL |
| H-07 | `layout-stabilization` suite 12/12 fail (login helper) | `responsive-audit.ts:26-29` |
| H-08 | Impersonation API exposed in production Settings UI | `Settings.jsx`, `auth.py:105-123` |

### Medium Issues

| ID | Issue | Evidence |
|----|-------|----------|
| M-01 | `yard_manager` role lacks Gate module access | `auth_rbac.py:131-166` |
| M-02 | Recharts dimension warnings on multiple pages | `audit-results.json` consoleErrors |
| M-03 | Legacy URL aliases not redirected (`/dashboard`, etc.) | `audit-results.json` routes WARN |
| M-04 | Global search intermittent failures in E2E | `audit-results.json` apiFailures |
| M-05 | Large main JS bundle (~526 kB gzip) | Docker build warning |
| M-06 | Plaintext passwords stored in admin user localStorage | `adminUsersService.js` |
| M-07 | `Sidebar.jsx` orphan component with stale nav | Not imported |
| M-08 | DB `roles`/`permissions` tables not authoritative at runtime | `auth_rbac.ROLE_PERMISSIONS` dict |
| M-09 | 1366 px viewport not in topnav overlap tests | `topnav-overlap.spec.ts` |
| M-10 | No HTTPS/TLS termination in Docker nginx config | `nginx.conf` |

### Low Issues

| ID | Issue | Evidence |
|----|-------|----------|
| L-01 | Typo route `/loagin` → `/login` redirect exists | `App.js:41` |
| L-02 | `status_checks` legacy table | `db.py:37`, `routers/status.py` |
| L-03 | E2E RBAC checks use legacy role names | `audit-results.json` rbac section |
| L-04 | PostHog script warnings in KPI console (third-party) | `audit-results.json` |
| L-05 | No frontend `.env.example` for `REACT_APP_API_BASE_URL` | `frontend_1/` |

---

## Playwright Validation Summary

Screenshots captured under:
- `e2e/screenshots/` — full route audit
- `e2e/screenshots/responsive/desktop/` — responsive audit (desktop only)
- `e2e/screenshots/topnav-overlap/` — navigation layout

### Route visit results (admin session)

All 17 primary routes: **PASS** — no console errors blocking render.

### Dropdown / dialog / drawer results

| Type | Result |
|------|--------|
| Drawers (gate, queue, docks, loading, equipment, labor, detention, vehicles) | **PASS** |
| Book slot dialog | **FAIL** (E2E selector mismatch) |
| Gate manual lookup | **PASS** |
| Role switcher (legacy dev roles) | **PASS** |

---

## Recommended Actions

### Immediate fixes (before production)

1. **Rotate and externalize secrets** — Remove hardcoded `JWT_SECRET_KEY` and `POSTGRES_PASSWORD` from `docker-compose.yml`; require env injection; fail startup if JWT secret is missing or weak.
2. **Enforce module permissions on GET** — Either apply `check_route_module_access` to all methods or add per-router `Depends(get_current_user)` + module checks on read endpoints.
3. **Wire User/Role Management to backend** — Implement `/api/admin/users` and `/api/admin/roles` CRUD against existing auth tables, or remove admin UI from production builds until ready.
4. **Disable demo seed passwords** — Use one-time setup or forced password reset on first login.
5. **Resolve Book Appointment policy** — Remove from TopBar if nav removal was the requirement, or document intentional dual entry points.
6. **Run full responsive Playwright suite** across all 7 viewports and fix any WARN/FAIL.

### Recommended fixes (pre-launch hardening)

1. Add `can(PERMS.*)` gating to action buttons on Gate, Queue, Docks, Loading, etc.
2. Route or remove orphan report pages.
3. Fix E2E helpers (`loginAsRole` navigation order) and stale `plate-input` test id.
4. Add React route redirects for legacy aliases (`/dashboard` → `/`, etc.).
5. Fix Recharts container sizing (defer render until measured).
6. Remove or gate impersonation UI behind `NODE_ENV !== 'production'`.
7. Add TLS termination (reverse proxy or nginx SSL).
8. Add structured logging (JSON logs, request IDs).

### Future improvements

1. Code-splitting and bundle analysis in CI.
2. Sync DB `role_permissions` with runtime RBAC (single source of truth).
3. Evaluate `yard_manager` Gate access with product owners.
4. Centralized error monitoring (Sentry/Datadog).
5. API rate limiting and account lockout policy.
6. Remove `Sidebar.jsx` and other dead code in a dedicated cleanup sprint.
7. Add 1366 px to topnav overlap suite.

---

## Appendix A — Route Map

| Path | Component | Module guard |
|------|-----------|--------------|
| `/` | Dashboard | `module.control_tower` |
| `/appointments` | Appointments | `module.appointments` |
| `/gate` | Gate | `module.gate` |
| `/queue` | VirtualQueue | `module.queue` |
| `/yard` | YardMap | `module.yard_map` |
| `/docks` | Docks | `module.docks` |
| `/vehicles` | Vehicles | `module.vehicles` |
| `/loading` | LoadingOps | `module.loading` |
| `/detention` | Detention | `module.detention` |
| `/equipment` | Equipment | `module.equipment` |
| `/labor` | Labor | `module.labor` |
| `/ai` | AiInsights | `module.ai` |
| `/kpis` | Kpis | `module.kpis` |
| `/operations-dashboard` | OperationsDashboard | `module.operations_dashboard` |
| `/reports/delay-analysis` | DelayAnalysisReport | `module.delay_analysis` |
| `/settings` | Settings | `module.settings` |
| `/admin/users` | UserManagement | `module.user_management` |
| `/admin/roles` | RoleManagement | `module.role_management` |
| `/login` | Login | Public |
| `/unauthorized` | Unauthorized | Public |

---

## Appendix B — Role × Module Matrix (Backend)

| Module | admin | manager | gate | coordinator | supervisor |
|--------|:-----:|:-------:|:----:|:-----------:|:----------:|
| Control Tower | ✅ | ✅ | ❌ | ❌ | ❌ |
| Appointments (full) | ✅ | ✅ | view | view | ❌ |
| Gate | ✅ | ❌ | ✅ | ❌ | ❌ |
| Queue | ✅ | ✅ | ❌ | ✅ | ❌ |
| Yard Map | ✅ | ✅ | view | ✅ | ✅ |
| Vehicles | ✅ | ✅ | ✅ | ✅ | ✅ |
| Docks | ✅ | ✅ | ❌ | ❌ | ✅ |
| Labor | ✅ | ✅ | ❌ | ❌ | ✅ |
| Equipment | ✅ | ✅ | ❌ | ❌ | ✅ |
| Loading | ✅ | ✅ | ❌ | ❌ | ✅ |
| Detention | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ops Dashboard | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delay Analysis | ✅ | ✅ | ❌ | ❌ | ❌ |
| KPIs | ✅ | ✅ | ❌ | ❌ | ❌ |
| AI | ✅ | ✅ | ❌ | ❌ | ❌ |
| User Mgmt | ✅ | ❌ | ❌ | ❌ | ❌ |
| Role Mgmt | ✅ | ❌ | ❌ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ | ❌ |

✅ = full module access · view = view-only variant · ❌ = no access (UI redirects to `/unauthorized`)

**Note:** Due to GET API bypass (C-03), backend read APIs do not fully match this matrix for authenticated users calling APIs directly.

---

*End of audit report. No code was modified during this audit.*
