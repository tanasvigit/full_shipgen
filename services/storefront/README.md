# storefront-service (Phase 3)

Storefront (networks, catalogs, checkouts) runs as a **separate container**:

```env
FLEETBASE_SERVICE=storefront
GATEWAY_TRUST_INTERNAL_JWT=true
SESSION_DRIVER=redis
```

## Routes

- `/storefront/int/v1/*`
- `/storefront/v1/*` (customer-facing API)

Depends on **fleetops-api** for orders (observers/models); FleetOps HTTP routes are not exposed on this container.

## Monolith (`application`)

- Registry + storefront/Ledger **schedules** still register on monolith boot (routes disabled there).

## Verify

```bash
docker exec fleetbase-storefront-service-1 php artisan route:list --path=storefront/int/v1/networks
docker exec fleetbase-application-1 php artisan route:list --path=storefront/int/v1/networks
```
