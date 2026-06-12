# Order status flow

**Canonical documentation** (full diagram, transitions, web/mobile mapping, API reference):

→ [`frontend/src/domain/fleetops/ORDER-STATUS-FLOW.md`](../../../../frontend/src/domain/fleetops/ORDER-STATUS-FLOW.md)

## Quick reference

```
created → assigned → dispatched → en_route → arrived → delivered → completed
                                              ↘ canceled / failed
```

## Backend files

| File | Role |
|------|------|
| `src/Support/FleetOps.php` | Default transport `order_config.flow` for new companies |
| `src/Models/OrderConfig.php` | Flow lookup, `getStartedActivity()`, `resolveWorkflowStatusCode()` |
| `src/Models/Order.php` | `dispatch()`, `complete()`, `cancel()`, `updateActivity()` |
| `src/Http/Controllers/Api/v1/OrderController.php` | `startOrder`, `updateActivity`, `complete` |
| `src/Observers/OrderObserver.php` | Sets `started` flag when status becomes `en_route` / `started` |

**Terminal statuses:** `completed`, `canceled`, `failed` — not `delivered`.

When editing workflow JSON or status handling, update the canonical doc above.

## Migrate existing companies

```bash
php artisan fleetops:upgrade-transport-order-config-flows --dry-run
php artisan fleetops:upgrade-transport-order-config-flows
```

See the canonical doc for `--company=` and `--force` options.
