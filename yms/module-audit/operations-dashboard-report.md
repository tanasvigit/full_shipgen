# Operations Dashboard — Module Audit Report

**Generated:** 2026-06-17T12:33:57.994Z
**Route:** `/operations-dashboard`
**Module score:** 83/100
**Note:** Functional `audit.spec.ts` used legacy localStorage auth (invalid). JWT RBAC evidence preferred.

## Checklist

| Check | Status | Evidence |
|-------|--------|----------|
| Route loads | **WARN** | JWT yard_admin: not reached (audit timeout) |
| API requests succeed (admin context) | **PASS** | No API failures on load |
| Drawers open/close | **N/A** | No drawer test |
| Forms validate / workflows | **N/A** | No form flow tested |
| Action buttons | **WARN** | 0 working, 0 broken, 0 total audited |
| RBAC direct URL | **PASS** | yard_admin: FAIL; yard_manager: FAIL; gate_operator: BLOCKED_AS_EXPECTED; yard_coordinator: FAIL |
| No console errors | **PASS** | Clean or warnings only |
| Responsive layout | **PASS** | mobile-small:PASS, mobile-small:PASS, mobile-small:SKIP, mobile-small:SKIP, mobile-small:SKIP, mobile-medium:PASS, mobile-medium:PASS, mobile-medium:SKIP, mobile-medium:SKIP, mobile-medium:SKIP, mobile-large:PASS, mobile-large:PASS, mobile-large:SKIP, mobile-large:SKIP, mobile-large:SKIP, tablet:PASS, tablet:PASS, tablet:SKIP, tablet:SKIP, tablet:SKIP, laptop:PASS, laptop:PASS, laptop:SKIP, laptop:SKIP, laptop:SKIP, laptop-hd:PASS, laptop-hd:PASS, laptop-hd:SKIP, laptop-hd:SKIP, laptop-hd:SKIP, desktop:PASS, desktop:PASS, desktop:SKIP, desktop:SKIP, desktop:SKIP |

## Issues

### critical
_None_

### high
- JWT admin audit did not reach /operations-dashboard (timeout)

### medium
_None_

### low
_None_
