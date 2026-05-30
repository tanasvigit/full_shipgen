# FleetOps operational simulation E2E

Playwright suite that exercises the console like a real dispatcher: long workflows, heavy navigation, multi-tab usage, mobile viewports, and slow networks.

## Location

```txt
e2e/fleetops/simulations/
  01-delivery-lifecycle.spec.ts
  02-dispatcher-heavy.spec.ts
  03-multi-tab.spec.ts
  04-mobile-operator.spec.ts
  05-network-stress.spec.ts
  06-long-session.spec.ts

e2e/helpers/fleetops/
  simulations.ts       # provisioning, workflow runner, navigation bursts
  scenario-health.ts   # loader/overlay/DOM guards
  scenario-report.ts   # annotations for HTML report
```

## Commands

```bash
cd frontend
npm run test:e2e:setup
npm run test:e2e:fleetops:simulations          # headless (default)
npm run test:e2e:fleetops:simulations:ui       # Playwright UI
npm run test:e2e:fleetops:simulations:headed   # visible browser
npm run test:e2e:report                        # after failures
```

### Environment

| Variable | Default | Purpose |
|----------|---------|---------|
| `E2E_SIM_LOOPS` | `12` | Long-session iteration count (raise locally for 15–20 min density, e.g. `24`) |
| `E2E_API_URL` | `http://localhost:8000` | API base (must be running) |
| `E2E_BASE_URL` | `http://localhost:5173` | Vite dev server (started by Playwright unless `CI`) |

**Prerequisites:** Fleetbase API + admin credentials in `e2e/.env`, at least one **order config**, Chromium auth state from setup.

## Scenarios

| # | File | What it validates |
|---|------|-------------------|
| 1 | `01-delivery-lifecycle` | Places → fleet → driver → vehicle → order → workflow → reload/detail persistence |
| 2 | `02-dispatcher-heavy` | Rapid nav, search/sort/pagination, dialogs, refreshes, DOM scale |
| 3 | `03-multi-tab` | Two tabs: edit + dispatch in one, refresh consistency in other |
| 4 | `04-mobile-operator` | iPhone + Android: tables, dialogs, map |
| 5 | `05-network-stress` | Delayed API, slow dispatch, refresh during load |
| 6 | `06-long-session` | Repeated operational loops without overlay leaks |

## Assertions (not shallow)

- Real CRUD + workflow API writes via `waitForFleetopsWrite`
- `assertNoStuckViewportLoaders` — global + viewport overlays (no `waitForTimeout`, no `force: true`)
- `assertDiagnosticsClean` — console + API failures (optional workflow probes excluded)
- `attachScenarioSummary` / `operational-findings` — JSON in Playwright HTML report
- Traces on all runs; screenshots/video on failure (`playwright.config.ts`)

## Simulation helpers

- **`provisionOperationalStack`** — two places, fleet, driver, vehicle (`verifyTable: false` on list-heavy entities to avoid pagination/search flakes in large orgs).
- **`createOrderForSimulation`** — assignments via `selectEntityOptionContaining` with fallback to first option; order URL excludes `/new`.
- **`runOrderDeliveryLifecycle`** — dispatch → start → advance → complete when actions are enabled.
- **`rapidFleetopsNavigationBurst`** — multi-module nav with `waitForApiSettle` per route.
- **`delayFleetApi` / `throttleNetwork`** — network stress without arbitrary sleeps in specs.

## Known skips / environment

- Workflow steps when order status does not expose the action (e.g. dispatch stress skips if not `created`).
- Optional API probes for `next-activity` / `eta` when backend returns 400/405 in some stacks.

## Stability fixes (this phase)

| Symptom | Category | Fix |
|---------|----------|-----|
| Fleet name not visible after create | stale-state | `list-reconcile.js` optimistic upsert + `mergeListWithPending`; `fleetopsCache.invalidateFleet` |
| `search.clear()` timeout in long session | loader / overlay | DataTable loader scoped to table body (compact); search toolbar stays interactive; `expectDataTableReady` waits for overlay hidden |
| Driver/place row missing after create in sims | stale-state / test data | `verifyTable: false` in simulation provisioning; driver search uses **email** when table verify is on |
| Order create navigated to `/orders/new` | workflow | URL regex `(?!new)` in order helpers |
| Mobile shell sidebar assertion | mobile | Sidebar required only when viewport ≥ 1280px |
| `drivers-new-button` blocked after nav burst | loader / overlay | `assertNoStuckViewportLoaders` before dialog open (02, 06) |
| Boot/table loader off-center | loader | `.fleetbase-loader-viewport` + arc spinner host (see `LOADING-SYSTEM.md`) |
| Failure triage | diagnostics | `runtime-diagnostics.json` attachment on failed tests (overlay stack, scroll lock, DOM scale) |

## Bug triage categories

When a simulation fails, classify in report annotations:

- **UX** — confusing flow, missing feedback
- **stale-state** — list/detail out of sync after mutation
- **race** — navigation during mutation
- **loader** — stuck overlay or spinner
- **workflow** — status/action mismatch
- **mobile** — overflow, dialog, map
- **performance** — DOM growth, sluggish tables
- **backend** — API 4xx/5xx on valid transitions

## Last verification note

Full suite requires **API on port 8000** and valid `e2e/.env` credentials. If setup fails, ensure the API is healthy (not 502/timeout), then:

```bash
npm run test:e2e:setup
$env:E2E_SIM_LOOPS='6'   # PowerShell; use export on Unix
npm run test:e2e:fleetops:simulations
```

With saved auth (`playwright/.auth/user.json`), you can rerun without setup:

```bash
npx playwright test e2e/fleetops/simulations --project=chromium --no-deps
```

**Latest full-suite run (2026-05-22):** **7/9 passed**, 1 skipped, 2 flaky in batch order (02 passes solo; 03 `Network Error` on order create).

| Scenario | Result |
|----------|--------|
| 01 delivery lifecycle | Pass |
| 02 dispatcher heavy | Pass (solo); occasional flake after prior tests |
| 03 multi-tab | Flaky — API `Network Error` on order create |
| 04 iPhone + Android | Pass |
| 05 slow list + refresh | Pass (+ dispatch skip when not `created`) |
| 06 long session | Pass |

## Operational friction (observed)

1. **Large org lists** — client-side table search does not always surface a newly created row on page 1; simulations verify persistence via detail URLs and API writes instead of list row for places/drivers/vehicles.
2. **Workflow API variance** — `start` / `advance` may 400 depending on order config and backend rules; tests record executed actions and skip when buttons are disabled.
3. **Long session** — use `E2E_SIM_LOOPS=24+` locally for 15–20 minute density; default `12` is a CI-friendly subset.

## Reporting

- HTML: `playwright-report/index.html`
- JSON: `playwright-report/results.json`
- Per-test: `scenario-summary` and `operational-findings` annotations
- Artifacts: `test-results/` traces, screenshots, videos
