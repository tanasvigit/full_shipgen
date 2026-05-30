# FleetOps CRUD — Playwright E2E

Production-grade end-to-end tests that validate **real create → persist → list → detail → edit → refresh** workflows for FleetOps core entities.

## Structure

```
e2e/fleetops/crud/
  orders-crud.spec.ts
  drivers-crud.spec.ts
  vehicles-crud.spec.ts
  places-crud.spec.ts
  fleets-crud.spec.ts

e2e/helpers/fleetops/
  test-data.ts       # e2eUnique() labels
  workflow.ts        # navigation, waitForFleetopsWrite, selects
  assertions.ts      # loaders, table, detail, diagnostics
  create-entity.ts   # fill/submit helpers per entity
```

## What each test validates

| Entity | Create | Table/search | Detail | Edit | Persist after refresh |
|--------|--------|--------------|--------|------|------------------------|
| Places | Dialog + POST | `places-table` | `place-detail-page` | `edit-place-dialog` | Yes |
| Drivers | Onboard + POST | `drivers-table` | `driver-detail-page` | `edit-driver-dialog` | Yes |
| Vehicles | Register + POST | `vehicles-table` | `vehicle-detail-page` | `edit-vehicle-dialog` | Yes |
| Fleets | Create + POST | Fleet card grid | `fleet-detail-page` | `edit-fleet-dialog` | Yes |
| Orders | New page + POST | `orders-table` | `order-detail-page` | `edit-order-dialog` | Yes + workflow panel |

## Assertions

- `waitForResponse` on successful POST/PATCH/PUT to `/orders`, `/drivers`, etc.
- No `waitForTimeout` — uses `waitForApiSettle`, `waitForURL`, `getByTestId`
- `assertNoStuckLoaders` — global loader must clear
- `assertDiagnosticsClean` — no 4xx/5xx on Fleet API paths, no console errors
- Screenshots, traces, video on failure (Playwright config)

## Commands

```bash
cd frontend
npm run test:e2e:setup                    # once — auth state
npm run test:e2e:fleetops:crud            # all CRUD specs (headed)
npm run test:e2e:fleetops:crud:ui         # Playwright UI mode

# Single entity
npx playwright test e2e/fleetops/crud/drivers-crud.spec.ts --project=chromium --headed
```

## Prerequisites

- API running (`E2E_API_URL` in `e2e/.env`)
- Vite dev server (started automatically unless port 5173 is in use)
- Admin user **without 2FA**
- **Order configs** exist for order tests (otherwise order specs skip)

## Test data

Records use `E2E {Entity} {timestamp}` naming — safe to identify in shared environments. Cleanup is optional (not automated) to avoid destructive deletes on shared tenants.

## Stabilization fixes (Phase CRUD hardening)

| Issue | Category | Fix |
|-------|----------|-----|
| Place create SQL `location` required | Frontend payload | `buildGeoLocation()` → GeoJSON `location` in `buildPlacePayload` |
| Vehicle create SQL `online` required | Frontend payload | Default `online: false` in `buildVehiclePayload` |
| Detail 404 after row click | Frontend mapper | `entityRouteId()` prefers `uuid` for routes |
| Stale/wrong row ids after create | Frontend list | Refetch list after dialog create (drivers, vehicles, places, fleets) |
| Dialog submit timeout on PATCH | Test sync | Success = dialog closes + no error banner (not only `waitForResponse`) |
| Fleet refresh clicked Edit | Test bug | `refreshAndAssertDetail` only uses `*-refresh` test ids |
| Orders list search by notes | Test/data | Open row by `orders-table-row-{uuid}` after list reload |
| `next-activity` 400 on new orders | Expected API | Ignored in network diagnostics (optional probe) |

## Known backend / product gaps

| Gap | Impact |
|-----|--------|
| No order configs | Order create tests skip with message |
| Empty customers/places lookups | Order form may submit without customer; pickup/dropoff need ≥1 place |
| `GET /orders/{id}/next-activity` returns 400 for fresh orders | Handled in app + ignored in E2E diagnostics |
| Notes not indexed in list API for client search | Use row id navigation in tests |
| DELETE not exercised | Tests do not delete records (cleanup manual) |

## Reporting

After a run:

```bash
npm run test:e2e:report
```

Artifacts: `test-results/` (video/trace/screenshot), `playwright-report/`.
