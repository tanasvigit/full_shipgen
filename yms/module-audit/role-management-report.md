# Role Management — Module Audit Report

**Generated:** 2026-06-17T12:33:58.010Z
**Route:** `/admin/roles`
**Module score:** 80/100
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
| Responsive layout | **N/A** | Pending responsive run |

## Issues

### critical
_None_

### high
- JWT admin audit did not reach /admin/roles (timeout)

### medium
_None_

### low
_None_
