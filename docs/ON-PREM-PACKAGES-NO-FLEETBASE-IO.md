# On-prem Fleetbase (no `fleetbase.io` runtime)

This fork runs the API from **`packages/`** in the monorepo, not from `fleetbase/fleetbase-api:latest` or `registry.fleetbase.io`.

## Quick start (Docker)

```powershell
# Windows (recommended)
powershell -File scripts/onprem.ps1
```

```bash
# Linux / macOS
sh scripts/onprem.sh
```

Or manually:

```bash
docker compose build application
docker compose up -d
```

- API: http://localhost:8000  
- Ember console: http://localhost:4200  
- React (separate): `cd frontend && npm run dev`

First `docker compose build` runs `composer update` for path packages inside the image (10–20+ minutes possible).

## Architecture

| Piece | Source |
|-------|--------|
| PHP packages | `packages/core-api`, `fleetops`, `registry-bridge`, `storefront`, `ledger` |
| Composer | `api/composer.json` path repos → `../packages/*` |
| API image | `docker/Dockerfile.onprem` → `fleetbase-api-onprem:local` |
| Live PHP edits | Volume `./packages:/fleetbase/packages` in compose |

## Required `api/.env`

```env
TELEMETRY_DISABLED=true
REGISTRY_PREINSTALLED_EXTENSIONS=true
CONSOLE_HOST=localhost
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:4200,localhost:5173,127.0.0.1:8000
MAIL_FROM_ADDRESS=noreply@yourcompany.local
```

Optional: `REGISTRY_HOST`, `FLEETBASE_BLOG_RSS_URL`, `TELEMETRY_ENDPOINT`.

### Self-hosted OSRM (routing)

```powershell
powershell -File scripts/setup-osrm.ps1   # first time: downloads map + builds graph
docker compose up -d osrm-backend osrm
```

- API: `OSRM_HOST=http://osrm-backend:5000` (in `api/.env` / compose)
- Browser: `OSRM_HOST` in `console/fleetbase.config.json` → `http://localhost:5000` (CORS proxy)
- Details: [docker/osrm/README.md](../docker/osrm/README.md)

## Host development (without Docker rebuild)

From `api/` after cloning:

```bash
composer update fleetbase/core-api fleetbase/fleetops-api fleetbase/registry-bridge fleetbase/storefront-api fleetbase/ledger-api -W
```

Path repos use `"symlink": false` so `vendor/fleetbase/*` copies from `packages/` (portable on Windows).

## CI / guard script

```bash
sh scripts/check-no-fleetbase-io-runtime.sh
# Windows:
powershell -File scripts/check-no-fleetbase-io-runtime.ps1
```

## What was removed or made opt-in

- Telemetry → off unless `TELEMETRY_ENDPOINT` + `TELEMETRY_DISABLED=false`
- Extension registry → no default host; preinstalled extensions or `REGISTRY_HOST`
- Blog RSS → `FLEETBASE_BLOG_RSS_URL` only
- Ember routing default → `OSRM_HOST` / `config.osrm.host`
- Mail defaults → `noreply@localhost` / your `MAIL_FROM_ADDRESS`

## Still optional (not `fleetbase.io`)

- Map tiles / S3 placeholder assets — configure or self-host (OSRM is self-hosted via compose by default)
- Ember console build uses `@fleetbase/*` from npm (build-time only)
- Google / Stripe / Twilio — only if you set keys

See also: [EXTERNAL-DEPENDENCIES-AND-OWNERSHIP-AUDIT.md](./EXTERNAL-DEPENDENCIES-AND-OWNERSHIP-AUDIT.md).
