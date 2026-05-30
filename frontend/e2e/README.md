# Fleetbase React Console — Playwright E2E

Production-style end-to-end tests for the Vite + React frontend (`frontend/`).

## Prerequisites

1. **Fleetbase API** running (e.g. Docker on `http://localhost:8000`)
2. **CORS** allows `http://localhost:5173` (`FRONTEND_HOSTS` in `api/.env`)
3. **Admin user** without 2FA for automation

## Setup

```bash
cd frontend
npm install
npm run test:e2e:install
cp e2e/.env.example e2e/.env
# Edit e2e/.env — set E2E_USER_EMAIL and E2E_USER_PASSWORD (use identity = email)
```

## Run modes

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | **Headed** Chromium — browser window visible |
| `npm run test:e2e:ui` | **Playwright UI** — interactive runner, time travel |
| `npm run test:e2e:debug` | **Debug** — step through with inspector |
| `npm run test:e2e:report` | Open HTML report after a run |
| `npm run test:e2e:fleetops` | **FleetOps only** — headed browser |
| `npm run test:e2e:fleetops:ui` | **FleetOps only** — Playwright UI mode (watch tests run) |
| `npm run test:e2e:fleetops:crud` | **FleetOps CRUD** — full create/edit/persist suite |
| `npm run test:e2e:fleetops:crud:ui` | **FleetOps CRUD** — interactive UI mode |
| `npm run test:e2e:loading` | **Loading system** — global + arc animation specs |
| `npm run test:e2e:loading:animation` | **Arc spinner animation** only |
| `npm run test:e2e:fleetops:simulations` | **Operational simulations** — lifecycle, heavy usage, multi-tab, mobile, network, long session |
| `npm run test:e2e:fleetops:simulations:ui` | Simulations in Playwright UI mode |
| `npm run test:e2e:day1` | **Day 1.5 stabilization** — `tests/e2e/fleetops/*` (dispatcher MVP QA) |
| `npm run test:e2e:day1:regression` | **Day 1 regression only** — full dispatcher workflow |
| `npm run test:e2e:day1:headed` | Day 1 suite with headed browser |

Playwright starts Vite automatically (`npm run dev`) unless a server is already on port 5173.

### FleetOps UI tests (interactive, visible browser)

```bash
cd frontend
npm run test:e2e:setup          # once — saves playwright/.auth/user.json
npm run test:e2e:fleetops:ui    # Playwright UI + visible Chromium
```

**Important:** Pass the **spec file**, not the folder. `playwright test e2e/fleetops --ui` can fail on Windows with “Unable to read …/e2e/fleetops”. Use:

```bash
npx playwright test e2e/fleetops/ui-complete.spec.ts --ui --project=chromium
```

| Script | Purpose |
|--------|---------|
| `npm run test:e2e:fleetops:ui` | UI mode, slow visual debugging |
| `npm run test:e2e:fleetops:headed` | Headed run with 700ms slowMo between actions |
| `npm run test:e2e:fleetops` | Headed FleetOps suite (normal speed) |

In Playwright UI: run **setup** first if `user.json` is missing, then run **chromium** tests. Enable **Show browser** in the toolbar.

## Folder structure

```
e2e/
  auth.setup.ts          # Saves session to playwright/.auth/admin.json
  auth/                  # Login, logout, guest redirects
  navigation/            # Header, sidebar, command palette
  routes/                # Route-by-route audit (all pages)
  fleetops/              # Orders, drivers, vehicles, …
    crud/                # Full CRUD persistence specs (see docs/FLEETOPS-CRUD-E2E.md)
    simulations/         # Operational simulation suite (see docs/FLEETOPS-SIMULATIONS-E2E.md)
  iam/
  storefront/
  ledger/
  pallet/
  developers/
  registry/
  global/                # Cross-cutting UI behavior
  fixtures/test.ts       # Extended test + diagnostics
  helpers/               # auth, api, navigation, network, page, routes
playwright.config.ts
playwright-report/       # HTML report (gitignored)
test-results/            # traces, screenshots, video (gitignored)
```

## Auth model

- **Setup project** logs in via API (`identity` + password), injects `localStorage`, saves `storageState`.
- **chromium** project reuses that session for all authenticated specs.
- **chromium-guest** runs login / unauthorized tests without storage.

## Debugging failures

1. `npm run test:e2e:report` — open trace, screenshot, video per test
2. `npm run test:e2e:debug` — pause on failure
3. Check `test-results/` for `trace.zip` → `npx playwright show-trace test-results/.../trace.zip`
4. Console and API failures are collected in route audit / diagnostics

## Coverage summary

| Area | Specs | Notes |
|------|-------|-------|
| Auth | `auth/login`, `auth/guest`, `auth/session` | 2FA page exists; automate only without 2FA |
| Navigation | `navigation/shell` | Smart nav, palette, back, org switcher |
| Route audit | `routes/route-audit` | Every static route + `data-testid` |
| FleetOps | `fleetops/*` | Orders views, CRUD navigation, management |
| IAM | `iam/access` | Users, roles, groups |
| Storefront | `storefront/catalog` | Catalog, checkout preview |
| Ledger | `ledger/finance` | Invoices, wallets, accounting |
| Pallet | `pallet/inventory` | Inventory, warehouses, POs |
| Developers | `developers/platform` | API keys, webhooks, logs |
| Registry | `registry/marketplace` | Browse; install uses cancel |
| Global UI | `global/ui-behavior` | Dashboard, pagination, layout |

### Remaining gaps

- **2FA complete flow** — needs dedicated test user + TOTP bypass env
- **Permission-denied user** — needs low-privilege fixture account
- **Dynamic detail routes** (`:id`) — covered when list rows exist; may skip on empty DB
- **Destructive mutations** (delete, install extension) — intentionally cancel in-dialog only
- **Forgot password** — UI only (no email assertion)
- **Webhook detail** — visited only when webhooks list has rows

## CI

See `.github/workflows/frontend-playwright.yml` at repo root.
