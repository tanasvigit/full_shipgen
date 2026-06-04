# iam-service (Phase 1)

IAM runs as a **separate container** using the same API image as the monolith, with:

```env
FLEETBASE_SERVICE=iam
SESSION_DRIVER=redis
```

## What it serves

All `/int/v1` **core-api** routes (auth, users, companies, settings, files, webhooks, …). The API gateway proxies matching paths to `iam-service:8000`.

Session introspection for domain APIs: `GET /int/v1/gateway/auth` (gateway-only secret).

## What stays on the monolith (`application`)

- `FLEETBASE_SERVICE=monolith` — Registry + workers only (all other domains have dedicated services)
- OSRM integration, heavy domain logic

## Shared infrastructure

| Resource | Why |
|----------|-----|
| **MySQL `fleetbase`** | Same schema until per-service DB split (Phase 2a) |
| **Redis** | Shared PHP sessions so login on IAM works for fleet-ops on monolith |
| **`api/.env`** | Same `APP_KEY`, `GATEWAY_*` secrets (mounted into both containers) |

## Compose

```bash
docker compose up -d iam-service application gateway frontend
```

## Verify

```bash
# IAM login path via gateway
curl -s -o NUL -w "%{http_code}" http://localhost:8000/int/v1/settings/platform

# Gateway introspection (401 without session)
curl -s -o NUL -w "%{http_code}" -H "X-Gateway-Internal-Secret: shipgen-gateway-dev-secret" http://localhost:8000/int/v1/gateway/auth
```

## After `packages/core-api` changes

```bash
docker exec -w /fleetbase/api fleetbase-application-1 sh -c "rm -rf vendor/fleetbase/core-api && composer update fleetbase/core-api --no-scripts"
docker exec -w /fleetbase/api fleetbase-iam-service-1 sh -c "rm -rf vendor/fleetbase/core-api && composer update fleetbase/core-api --no-scripts"
docker compose restart application iam-service
```

Or rebuild: `docker compose build application`

## Next (Phase 2)

- Extract FleetOps to `fleetops-service`
- Point gateway `/int/v1/fleet-ops` to new upstream
- Optional: `iam` database schema on same MySQL host
