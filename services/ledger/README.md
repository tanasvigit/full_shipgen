# ledger-service (Phase 3)

Ledger (billing, invoices, wallets, payment gateways) runs as a **separate container**:

```env
FLEETBASE_SERVICE=ledger
GATEWAY_TRUST_INTERNAL_JWT=true
SESSION_DRIVER=redis
```

## Routes

- `/ledger/int/v1/*` (internal console API)
- `/ledger/v1/*`, `/ledger/public/*` (as defined in package routes)

## Monolith (`application`)

- **Registry** extension routes only (`FLEETBASE_SERVICE=monolith`)
- Queue + scheduler (including ledger artisan commands registered at boot)

## Verify

```bash
docker exec fleetbase-ledger-service-1 php artisan route:list --path=ledger/int/v1/invoices
docker exec fleetbase-application-1 php artisan route:list --path=ledger/int/v1/invoices
```
