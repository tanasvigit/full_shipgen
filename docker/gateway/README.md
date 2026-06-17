# API Gateway (Phase 0–1)

Path-based gateway in front of the monolith. Public API URL: **http://localhost:8000** (service `gateway`).

| Port | Service | Purpose |
|------|---------|---------|
| **8000** | `gateway` | Production entry (React `VITE_API_HOST`) |
| **8001** | `httpd` | Debug bypass (direct nginx → monolith) |

| Upstream | Container |
|----------|-----------|
| IAM paths | `iam-service` |
| `/int/v1/fleet-ops`, `/int/v1/orders`, `/int/v1/routes`, … (non-IAM `/int/v1/*`) | `fleetops-service` |
| `/fleet-ops` (public API) | `fleetops-service` |
| `/pallet/` | `pallet-service` |
| `/ledger` | `ledger-service` |
| `/storefront/` | `storefront-service` |
| `/registry/v1/*` (rewritten to `~registry/v1/*`), `~registry` | `application` (monolith) |

## Behaviour

- **IAM paths** (`/int/v1/auth`, users, companies, …) → monolith, cookies only.
- **Domain paths** (fleet-ops, pallet, ledger, storefront, registry) → `auth_request` introspects session, injects `X-Service-Authorization` (internal JWT).
- **`GET /int/v1/gateway/auth`** — gateway-only; requires `X-Gateway-Internal-Secret`.

## Configure

In `api/.env` (and `docker-compose` `application` environment):

```env
GATEWAY_INTERNAL_SECRET=shipgen-gateway-dev-secret
GATEWAY_JWT_SECRET=shipgen-jwt-dev-secret-change-in-prod
GATEWAY_JWT_TTL=900
GATEWAY_TRUST_INTERNAL_JWT=false
```

Gateway container receives the same `GATEWAY_INTERNAL_SECRET` (via compose / `docker-entrypoint.sh` envsubst).

## Rebuild after nginx changes

```bash
docker compose build gateway
docker compose up -d gateway
```

## After editing `packages/*`

Containers mirror packages into `vendor/`. Refresh affected packages and restart:

```bash
docker exec -w /fleetbase/api fleetbase-application-1 sh -c "rm -rf vendor/fleetbase/core-api vendor/fleetbase/fleetops-api vendor/fleetbase/pallet-api vendor/fleetbase/storefront-api vendor/fleetbase/ledger-api vendor/fleetbase/registry-bridge && composer update fleetbase/core-api fleetbase/fleetops-api fleetbase/pallet-api fleetbase/storefront-api fleetbase/ledger-api fleetbase/registry-bridge --no-scripts"
docker compose restart application iam-service fleetops-service gateway
```

Or refresh vendor and reload Octane workers (required — FrankenPHP keeps old PHP in memory):

```bash
for svc in application iam-service fleetops-service storefront-service ledger-service pallet-service; do
  docker exec -w /fleetbase/api "fleetbase-${svc}-1" sh -c "composer reinstall fleetbase/core-api --no-interaction && php artisan config:clear && php artisan config:cache && php artisan octane:reload"
done
```

For production images, rebuild `fleetbase-api-onprem:local` (`docker compose build application`).

## Split a service

Edit `nginx.conf.template`: change `proxy_pass http://monolith` to `http://fleetops-service:8000` (etc.) in the matching `location` block.

## Plan

[docs/MICROSERVICES-ARCHITECTURE.md](../../docs/MICROSERVICES-ARCHITECTURE.md)
