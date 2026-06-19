# Detention Management — Module Audit Report

**Generated:** 2026-06-17T12:33:57.992Z
**Route:** `/detention`
**Module score:** 69/100
**Note:** Functional `audit.spec.ts` used legacy localStorage auth (invalid). JWT RBAC evidence preferred.

## Checklist

| Check | Status | Evidence |
|-------|--------|----------|
| Route loads | **FAIL** | JWT yard_admin: not reached (audit timeout) |
| API requests succeed (admin context) | **PASS** | No API failures on load |
| Drawers open/close | **FAIL** | detention-drawer: open=false close=false |
| Forms validate / workflows | **PASS** | detention-review: SKIP |
| Action buttons | **WARN** | 0 working, 0 broken, 1 total audited |
| RBAC direct URL | **PASS** | yard_admin: FAIL; yard_manager: FAIL; gate_operator: BLOCKED_AS_EXPECTED; yard_coordinator: FAIL |
| No console errors | **PASS** | Clean or warnings only |
| Responsive layout | **PASS** | mobile-small:PASS, mobile-small:PASS, mobile-small:SKIP, mobile-small:SKIP, mobile-small:SKIP, mobile-medium:PASS, mobile-medium:PASS, mobile-medium:SKIP, mobile-medium:PASS, mobile-medium:SKIP, mobile-large:PASS, mobile-large:PASS, mobile-large:SKIP, mobile-large:SKIP, mobile-large:SKIP, tablet:PASS, tablet:PASS, tablet:SKIP, tablet:SKIP, tablet:SKIP, laptop:PASS, laptop:PASS, laptop:SKIP, laptop:SKIP, laptop:SKIP, laptop-hd:PASS, laptop-hd:PASS, laptop-hd:PASS, laptop-hd:SKIP, laptop-hd:SKIP, desktop:PASS, desktop:PASS, desktop:SKIP, desktop:SKIP, desktop:SKIP |

## Button audit (functional sweep)

| Label | testId | Result |
|-------|--------|--------|
| Sign in | login-submit | NO_ACTION |

## Issues

### critical
_None_

### high
- JWT admin audit did not reach /detention (timeout)

### medium
_None_

### low
_None_

## Screenshots
- [`../e2e/screenshots/detention.png`](../e2e/screenshots/detention.png)
- [`screenshots/detention.png`](screenshots/detention.png)
