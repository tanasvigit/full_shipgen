# pallet-service (Phase 3)

Pallet (WMS / inventory) runs as a **separate container**:

```env
FLEETBASE_SERVICE=pallet
GATEWAY_TRUST_INTERNAL_JWT=true
SESSION_DRIVER=redis
```

## What it serves

- `/pallet/int/v1/*` (audits, warehouses, products, purchase orders, …)

Gateway `auth_request` → IAM, then forwards `X-Service-Authorization` (internal JWT).

## Dependencies

Pallet registers **core-api** and **fleetops-api** (models/observers) but does **not** expose FleetOps HTTP routes on this container.

## What stays on `application` (monolith)

- Registry + queue/scheduler
- Queue + scheduler

## Compose

```bash
docker compose up -d pallet-service iam-service fleetops-service application gateway frontend
```

## Verify

```bash
docker exec fleetbase-pallet-service-1 php artisan route:list --path=pallet/int/v1/warehouses
docker exec fleetbase-application-1 php artisan route:list --path=pallet/int/v1/warehouses
```

First should list routes; monolith should show **no matches**.

## After package changes

```bash
docker exec -w /fleetbase/api fleetbase-pallet-service-1 sh -c "rm -rf vendor/fleetbase/core-api vendor/fleetbase/fleetops-api vendor/fleetbase/pallet-api && composer update fleetbase/core-api fleetbase/fleetops-api fleetbase/pallet-api --no-scripts"
docker compose restart pallet-service application gateway
```
