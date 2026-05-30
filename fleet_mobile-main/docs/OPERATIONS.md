# Fleetbase Mobile — Operations Runbook

## Runtime health signals

| Signal | Where | Action |
|--------|-------|--------|
| Socket degraded | Sync banner / dev diagnostics | Verify socket host/port/TLS |
| Queue pending | Sync banner `Sync pending (N)` | Check network, tap Retry |
| Dead-letter items | Sync banner error state | Review conflict panel, refresh order |
| Tracking paused | Sync banner | Confirm location permissions |
| Sentry errors | `EXPO_PUBLIC_SENTRY_DSN` | Inspect workflow/queue/tracking tags |

## Tenant isolation incidents

If cross-org data appears:

1. Confirm `X-Company` header in API logs
2. Verify org switch purged queue (`offlineQueue.purgeTenant`)
3. Confirm query keys include `companyUuid`
4. Force logout to `resetAllQueries`

## Workflow incidents

Mobile uses server-driven activities only:

1. `GET /orders/next-activity/{id}`
2. `PATCH /orders/update-activity/{id}`

Never re-enable hardcoded start/complete endpoints.

## Background tracking

- Foreground engine: `src/tracking/engine.ts`
- Background task: `src/tracking/background/task.ts`
- Requires OS permissions + disclosure in store listings
