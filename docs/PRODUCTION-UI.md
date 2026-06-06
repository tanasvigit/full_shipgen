# Production UI — React only

**Production deployment runbook:** [RELEASE.md](../RELEASE.md) at the repo root.

The legacy **Ember console** (`console/`) and Ember engine packages have been removed from this repo.

| Layer | Path | Deploy |
|-------|------|--------|
| **UI** | `frontend/` | Local Vite dev (`npm run dev` → **5173**) or static `dist/` + nginx for prod |
| **API** | `api/` + `packages/*/server` | Gateway :8000 → `iam`, `fleetops`, `pallet`, `ledger`, `storefront`, `application` (registry); `httpd` :8001 |

## Local Docker

```bash
docker compose up -d --build
```

After editing `packages/*`, sync **vendor** in running containers (mounted code ≠ image vendor until refresh):

```powershell
.\scripts\refresh-microservices.ps1
# Full API image rebuild:
.\scripts\refresh-microservices.ps1 -Rebuild
```

- API: http://localhost:8000  
- UI (separate terminal): `cd frontend && npm run dev` → http://localhost:5173  

Set in `api/.env`:

```env
CONSOLE_HOST=http://localhost:5173
FRONTEND_HOSTS=http://localhost:5173,http://localhost:8000
```

See [frontend/docs/DEPLOYMENT.md](../frontend/docs/DEPLOYMENT.md) for production builds.

## Microservices roadmap

To move from the modular monolith to services (IAM, FleetOps, Pallet, etc.), see **[MICROSERVICES-ARCHITECTURE.md](./MICROSERVICES-ARCHITECTURE.md)** and [docker/gateway/README.md](../docker/gateway/README.md).

## Backend packages kept

PHP APIs only (no Ember `addon/` trees):

- `packages/core-api`
- `packages/fleetops/server`
- `packages/storefront/server`
- `packages/ledger/server`
- `packages/registry-bridge/server`
- `packages/pallet/server` (warehouse / inventory — wired in `api/composer.json`)

## Pallet API

After pulling these changes, refresh Composer inside the API container:

```bash
docker compose run --rm application composer update fleetbase/pallet-api --no-interaction
docker compose exec application php artisan migrate
```

React routes under `/pallet` use `pallet/int/v1` (see `frontend/src/lib/env.js`).
