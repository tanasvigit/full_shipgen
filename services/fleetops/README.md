# fleetops-service (Phase 2)

FleetOps runs as a **separate container** using the same API image:

```env
FLEETBASE_SERVICE=fleetops
GATEWAY_TRUST_INTERNAL_JWT=true
SESSION_DRIVER=redis
```

## What it serves

- `/int/v1/fleet-ops/*`
- `/fleet-ops/*` (public/driver API)

The gateway runs `auth_request` against IAM, then forwards `X-Service-Authorization` (internal JWT). FleetOps validates that JWT via `TrustInternalServiceJwt` (no shared PHP session file required).

## What stays on `application` (monolith)

- Registry + queue/scheduler (Pallet, Ledger, Storefront have dedicated services)
- Queue worker + scheduler (including FleetOps artisan schedules)

## Shared

| Resource | Notes |
|----------|--------|
| MySQL `fleetbase` | Same DB until schema split |
| Redis | Sessions for IAM login; JWT for FleetOps API calls |
| OSRM | `OSRM_HOST=http://osrm-backend:5000` on fleetops-service |

## Compose

```bash
docker compose up -d fleetops-service iam-service application gateway
```

## Verify

```bash
# FleetOps route on fleetops container only
docker exec fleetbase-fleetops-service-1 php artisan route:list --path=int/v1/fleet-ops/live

# Monolith should not expose fleet-ops HTTP routes
docker exec fleetbase-application-1 php artisan route:list --path=int/v1/fleet-ops/live
```

## After package changes

```bash
docker exec -w /fleetbase/api fleetbase-fleetops-service-1 sh -c "rm -rf vendor/fleetbase/core-api vendor/fleetbase/fleetops-api && composer update fleetbase/core-api fleetbase/fleetops-api --no-scripts"
docker compose restart fleetops-service application iam-service gateway
```
