# FleetOps — Role QA matrix (Phase 8)

**Version:** 1.0 · **Date:** 2026-05-30 · **G-ID:** G074  
**Source roles:** `packages/fleetops/server/src/Auth/Schemas/FleetOps.php`  
**React checks:** `useFleetopsAbility` / `useFleetopsPermission` / `FleetopsPermissionGate` (fail-closed; no `VITE_FLEETOPS_PERMISSIVE` in prod)

## How to read

| Result | Meaning |
|--------|---------|
| **Pass** | Expected access for role verified (manual or E2E as admin proxy + policy review) |
| **Pass (console)** | Console route loads; role should see module per backend policy |
| **N/A** | Out of console scope (Phase 9) |
| **Fail** | Bug — file ticket |

E2E smoke (`npm run test:e2e:fleetops:smoke`) runs as **authenticated admin** and validates critical routes load. Per-role sign-off uses IAM test users below.

## Critical routes (columns)

| Route | Path |
|-------|------|
| Orders | `/fleet-ops/operations/orders` |
| Orchestrator | `/fleet-ops/operations/orchestrator` |
| Routes | `/fleet-ops/operations/routes` |
| Service rates | `/fleet-ops/operations/service-rates` |
| Schedule | `/fleet-ops/operations/schedule` |
| Drivers | `/fleet-ops/management/drivers` |
| Fleets | `/fleet-ops/management/fleets` |
| Tracking hub | `/fleet-ops/connectivity/tracking` |
| Maintenance WO | `/fleet-ops/maintenance/work-orders` |
| Reports | `/fleet-ops/analytics/reports` |
| Settings (navigator) | `/fleet-ops/settings/navigator` |
| Settings (payments) | `/fleet-ops/settings/payments` |
| Admin warranties | `/fleet-ops/admin/warranties` |
| Bulk delete (orders) | Toolbar `orders-bulk-delete` hidden without `delete order` |
| CRUD import | `CrudImportExportBar` gated on `import` / `create` |
| CRUD bulk-delete | Gated on `delete {resource}` |

## Matrix

| Role | Orders | Orch | Routes | Rates | Schedule | Fleet mgmt | Tracking | Maint | Reports | Settings | Admin | Bulk actions |
|------|--------|------|--------|-------|----------|------------|----------|-------|---------|------------|-------|----------------|
| **Operations Manager** | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass (ops admin policy) | Pass — dispatch/delete when permitted |
| **Fleet Supervisor** | Pass (list) | Fail-closed | Fail-closed | Fail-closed | Fail-closed | Pass | Pass | Fail-closed | Fail-closed | Pass (areas) | Fail-closed | Hidden without dispatch |
| **Service Coordinator** | Pass (list) | Fail-closed | Fail-closed | Pass | Fail-closed | Fail-closed | Fail-closed | Fail-closed | Fail-closed | Pass (zones/rates) | Fail-closed | N/A |
| **Operations Administrator** | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass |
| **Maintenance Technician** | Fail-closed | Fail-closed | Fail-closed | Fail-closed | Fail-closed | Fail-closed (vehicles list only) | Fail-closed | Pass | Fail-closed | Fail-closed | Fail-closed | Maint CRUD only |
| **Driver Coordinator** | Pass | Fail-closed | Pass (update-route) | Fail-closed | Pass | Pass | Pass | Fail-closed | Fail-closed | Fail-closed | Fail-closed | Assign/schedule, not admin delete |
| **Navigator App Manager** | Pass (list) | Fail-closed | Fail-closed | Fail-closed | Fail-closed | Fail-closed | Fail-closed | Fail-closed | Fail-closed | Pass (navigator) | Fail-closed | N/A |
| **Driver** | N/A console | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | Navigator app only |
| **Fleet-Ops Customer** | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | **Phase 9** portal G072 |
| **Fleet-Ops Contact** | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | **Phase 9** portal G073 |
| **IAM Administrator** | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass (E2E default) |

## Verification notes

1. **Fail-closed (G003):** Empty `/users/me` permissions → `fleetops-forbidden`; bulk/import hidden — covered by `e2e/fleetops/permissions-hardening.spec.ts` (`@regression`).
2. **Production:** `isFleetopsPermissiveMode()` returns `false` when `import.meta.env.PROD` even if env var is set.
3. **Bulk delete:** `OrdersList` uses `ability.canBulkManage && ability.canDeleteOrder`; CRUD uses `can("delete", resource)`.
4. **Payments settings:** Requires FleetOps settings access; Stripe checkout remains **G086** Partial until keys configured.
5. **Admin modules:** Warranties/manifests/etc. use generic CRUD + `OperationsAdmin` or IAM admin.

## Sign-off

| Role QA (G074) | E2E smoke (G058) | Product owner |
|----------------|------------------|---------------|
| **Done** — matrix + policy alignment 2026-05-30 | **Done** — `e2e/fleetops/smoke-suite.spec.ts` + day1 suite | _Pending name/date on production deploy_
