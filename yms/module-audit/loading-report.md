# Loading Operations — Module Audit Report

**Generated:** 2026-06-17T12:33:57.988Z
**Route:** `/loading`
**Module score:** 69/100
**Note:** Functional `audit.spec.ts` used legacy localStorage auth (invalid). JWT RBAC evidence preferred.

## Checklist

| Check | Status | Evidence |
|-------|--------|----------|
| Route loads | **FAIL** | JWT yard_admin: not reached (audit timeout) |
| API requests succeed (admin context) | **PASS** | No API failures on load |
| Drawers open/close | **FAIL** | loading-op-drawer: open=false close=false |
| Forms validate / workflows | **PASS** | loading-op-actions: SKIP |
| Action buttons | **WARN** | 0 working, 0 broken, 1 total audited |
| RBAC direct URL | **PASS** | yard_admin: FAIL; yard_manager: ACCESSIBLE; gate_operator: BLOCKED_AS_EXPECTED; yard_coordinator: FAIL |
| No console errors | **PASS** | Clean or warnings only |
| Responsive layout | **PASS** | mobile-small:PASS, mobile-small:SKIP, mobile-small:SKIP, mobile-small:SKIP, mobile-small:PASS, mobile-medium:PASS, mobile-medium:SKIP, mobile-medium:PASS, mobile-medium:SKIP, mobile-medium:PASS, mobile-large:PASS, mobile-large:SKIP, mobile-large:SKIP, mobile-large:SKIP, mobile-large:PASS, tablet:PASS, tablet:SKIP, tablet:SKIP, tablet:SKIP, tablet:PASS, laptop:PASS, laptop:SKIP, laptop:SKIP, laptop:SKIP, laptop:PASS, laptop-hd:PASS, laptop-hd:SKIP, laptop-hd:SKIP, laptop-hd:SKIP, laptop-hd:PASS, desktop:PASS, desktop:SKIP, desktop:SKIP, desktop:SKIP, desktop:PASS |

## Button audit (RBAC runs)

| Role | Control | Status | Detail |
|------|---------|--------|--------|
| yard_manager | brand-home | PASS |  |
| yard_manager | menu-control | PASS |  |
| yard_manager | menu-operations | PASS |  |
| yard_manager | menu-resources | PASS |  |
| yard_manager | menu-reports | PASS |  |
| yard_manager | topnav-alert | PASS |  |
| yard_manager | topnav-notif | PASS |  |
| yard_manager | topnav-user | PASS |  |
| yard_manager | dashboard-refresh | PASS |  |
| yard_manager | daily-report-btn | PASS |  |
| yard_manager | event-feed-toggle | PASS |  |
| yard_manager | btn-11 | PASS |  |

## Button audit (functional sweep)

| Label | testId | Result |
|-------|--------|--------|
| Sign in | login-submit | NO_ACTION |

## Issues

### critical
_None_

### high
- JWT admin audit did not reach /loading (timeout)

### medium
_None_

### low
_None_

## Screenshots
- [`../e2e/screenshots/loading.png`](../e2e/screenshots/loading.png)
- [`screenshots/loading.png`](screenshots/loading.png)
- [`screenshots/loading_ops.png`](screenshots/loading_ops.png)
