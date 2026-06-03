# FleetOps — QA, performance & security (Phase 8)

**Version:** 1.0 · **Date:** 2026-05-30

## E2E tags

| Tag | Command | Scope |
|-----|---------|--------|
| `@smoke` | `npm run test:e2e:fleetops:smoke` | Critical route shell loads (`e2e/fleetops/smoke-suite.spec.ts`) |
| `@regression` | `npm run test:e2e:fleetops:regression` | Permissions, pagination, routes/orchestrator depth |
| Day 1 full | `npm run test:e2e:day1` | `tests/e2e/fleetops/*` legacy stabilization suite |

Also: `geo.spec.ts`, `settings.spec.ts`, `platform.spec.ts`, `backend-modules.spec.ts` under `e2e/fleetops/` (run via `chromium` project or day scripts).

## Performance expectations

| Surface | Behavior | Code / config |
|---------|----------|----------------|
| **Orders list @ 10k+ rows** | Server-side pagination only; never load full dataset in browser | `useOrdersListPage` + API `page`/`limit`; default limit 25; URL-synced `limit` |
| **Tracking hub map** | Max **500** live markers rendered; excess positions dropped client-side | `FleetTrackingHub.jsx` — `MAX_MARKERS = 500` |
| **Routes list** | Client slice when API returns full array (legacy); prefer server paging when API supports | `RoutesList.jsx` `pageSize` 25 |

Load testing: run orders list against staging with ≥10k orders; confirm p95 list API &lt; 2s and UI remains responsive when paginating.

## Security audit (console)

| Area | Control | Status |
|------|---------|--------|
| **Empty permissions** | `FleetopsPermissionGate` + fail-closed `can()` | ✅ G003 |
| **Prod permissive bypass** | `isFleetopsPermissiveMode()` ignores env in `PROD` | ✅ Phase 8 |
| **Orders bulk delete/dispatch/import** | `OrdersBulkToolbar` props from `useFleetopsAbility` | ✅ |
| **CRUD import/export/bulk-delete** | `CrudImportExportBar` + `FleetopsCrudListPage` | ✅ |
| **Payments settings** | Authenticated console; Stripe onboard **G086** Partial | 🟡 |
| **Admin routes** | `/fleet-ops/admin/*` behind console auth + FleetOps gate | ✅ |
| **API authorization** | Server enforces Spatie permissions (client is not security boundary) | Required in deploy |

## Deferred (Phase 9)

- Customer portal engine hook (**G075**)
- Driver/customer invite flows (**G076**)
- Navigator POD (**G060**), full portals (**G071–G073**)
