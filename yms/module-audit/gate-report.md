# Gate Management — Module Audit Report

**Generated:** 2026-06-17T12:33:57.962Z
**Route:** `/gate`
**Module score:** 79/100
**Note:** Functional `audit.spec.ts` used legacy localStorage auth (invalid). JWT RBAC evidence preferred.

## Checklist

| Check | Status | Evidence |
|-------|--------|----------|
| Route loads | **PASS** | JWT yard_admin: ACCESSIBLE |
| API requests succeed (admin context) | **PASS** | No API failures on load |
| Drawers open/close | **N/A** | No drawer test |
| Forms validate / workflows | **FAIL** | gate-manual-lookup: FAIL |
| Action buttons | **WARN** | 0 working, 0 broken, 1 total audited |
| RBAC direct URL | **PASS** | yard_admin: ACCESSIBLE; yard_manager: BLOCKED_AS_EXPECTED; gate_operator: ACCESSIBLE; yard_coordinator: BLOCKED_AS_EXPECTED |
| No console errors | **PASS** | Clean or warnings only |
| Responsive layout | **PASS** | mobile-small:PASS, mobile-small:SKIP, mobile-small:PASS, mobile-small:SKIP, mobile-small:SKIP, mobile-medium:PASS, mobile-medium:PASS, mobile-medium:PASS, mobile-medium:SKIP, mobile-medium:SKIP, mobile-large:PASS, mobile-large:SKIP, mobile-large:PASS, mobile-large:SKIP, mobile-large:SKIP, tablet:PASS, tablet:SKIP, tablet:PASS, tablet:SKIP, tablet:SKIP, laptop:PASS, laptop:SKIP, laptop:PASS, laptop:SKIP, laptop:SKIP, laptop-hd:PASS, laptop-hd:SKIP, laptop-hd:PASS, laptop-hd:SKIP, laptop-hd:SKIP, desktop:PASS, desktop:SKIP, desktop:PASS, desktop:SKIP, desktop:SKIP |

## Admin JWT audit
- Status: **ACCESSIBLE**
- URL after navigation: `/gate`

## Button audit (RBAC runs)

| Role | Control | Status | Detail |
|------|---------|--------|--------|
| yard_admin | brand-home | PASS |  |
| yard_admin | menu-control | PASS |  |
| yard_admin | menu-operations | PASS |  |
| yard_admin | menu-resources | PASS |  |
| yard_admin | menu-reports | PASS |  |
| yard_admin | menu-administration | PASS |  |
| yard_admin | topnav-alert | PASS |  |
| yard_admin | topnav-notif | PASS |  |
| yard_admin | topnav-user | PASS |  |
| yard_admin | dashboard-refresh | PASS |  |
| yard_admin | daily-report-btn | PASS |  |
| yard_admin | event-feed-toggle | PASS |  |
| yard_admin | btn-12 | PASS |  |
| gate_operator | brand-home | PASS |  |

## Button audit (functional sweep)

| Label | testId | Result |
|-------|--------|--------|
| Sign in | login-submit | NO_ACTION |

## Issues

### critical
_None_

### high
_None_

### medium
- Form gate-manual-lookup: locator.fill: Timeout 12000ms exceeded.
Call log:
[2m  - waiting for locator('[data-testid="gate-lookup-input"]')[22m


### low
_None_

## Screenshots
- [`../e2e/screenshots/gate.png`](../e2e/screenshots/gate.png)
- [`screenshots/gate.png`](screenshots/gate.png)
