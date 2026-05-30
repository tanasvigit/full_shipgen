# Fleetbase Mobile — Phase 1 Architecture

## Layering

```text
Screens (app/*)
  -> Hooks (src/hooks/*, src/hooks/mutations/*)
    -> Services (src/services/*)
      -> API client (src/lib/api.ts)
```

Screens must not call `apiRequest` directly. All HTTP behavior lives in `src/services/*`.

## Service layer rules

- One service per domain: auth, orders, workflow, tracking, pod, fleet.
- Services own endpoint paths, payload shapes, and response unwrapping.
- Services may log workflow/API diagnostics via `observability`.
- UI never imports `@/src/lib/api` except auth storage helpers in context/bootstrap code.

## React Query conventions

### Query keys (tenant-scoped)

Always include `companyUuid` as the second segment:

```ts
["orders", companyUuid, { limit: 500 }]
["order", companyUuid, orderRef]
["nextActivity", companyUuid, orderRef]
["fleet", companyUuid]
```

Use helpers from `src/query/keys.ts`.

### Invalidation

Use `src/query/invalidation.ts` only:

- `refreshOrderScope` after workflow mutations
- `refreshOnOrgSwitch` when changing organization
- `resetAllQueries` on logout/unauthorized
- `resetTenantQueries` when evicting one tenant

Never call `queryClient.clear()` from screens.

### Mutations

Workflow/tracking/POD mutations live in `src/hooks/mutations/*`:

- optimistic update orders list when safe (start/complete)
- rollback list snapshot on error
- invalidate scoped keys on settled

## Auth + org safety

- Organization persisted in storage (`fleet_mobile.org`).
- Bootstrap restores saved org when still available.
- Unauthorized events clear session once (race guarded).
- Observability context tags user/company when bootstrap succeeds.

## Permissions

Mobile resolver mirrors console behavior:

- direct + role + policy merge
- wildcard checks (`fleet-ops *`, `fleet-ops * order`)
- admin bypass

UI shows disabled reasons; backend remains authoritative.

## Development diagnostics

`src/dev/diagnostics.ts` is `__DEV__` gated:

- org snapshot logger
- permission inspector
- query cache snapshot logger
- workflow debug logger

Accessible from Profile screen in development builds.

---

## Phase 2 — Realtime, offline, tracking

### Realtime (`src/realtime/*`)

- SocketCluster client with reconnect backoff
- Subscriptions: `company.{uuid}`, `company.{uuid}.orders`, `driver.{public_id}`, `order.{public_id}`
- Events normalized in `eventRouter.ts`, applied via `query/eventInvalidation.ts`
- REST resync fallback in `resync.ts` (debounced)

### Offline queue (`src/offline/*`)

- Persisted queue in AsyncStorage
- Replay order: FIFO per tenant
- Workflow / tracking / POD operations enqueue on network failure
- Flush on: reconnect, foreground, runtime start, post-mutation settle

### Tracking (`src/tracking/*`)

- Policy-based intervals (`idle`, `active_trip`, `navigating`, `background_low_power`)
- GPS via `expo-location` with simulator fallback
- Deduped uploads + offline queue integration

### Runtime orchestration (`src/runtime/*`)

- `RuntimeProvider` starts socket + queue flush after auth
- Network + app state listeners trigger resync and queue flush
- Org switch purges previous tenant queue items

### POD (`src/pod/*`)

- Local staging with lifecycle states
- Upload retries via offline queue

---

## Phase 3 — Production completion

### Maps (`src/maps/*`)

- Native `react-native-maps` via `TripMap`
- Web fallback to `StylizedMap`
- Route polylines + marker auto-fit

### Sync UX (`src/sync/*`, `useSyncStatus`)

- Global banner: offline, pending queue, realtime degraded, tracking paused
- Order-level sync chips + conflict panel

### Conflicts (`src/offline/conflicts/*`)

- Backend-wins classification for non-retryable queue failures
- Actionable recovery UI (refresh/dismiss)

### Background tracking (`src/tracking/background/*`)

- Expo `TaskManager` + `Location.startLocationUpdatesAsync`
- Integrated with runtime bind/unbind

### POD UI (`src/pod/ui/*`)

- Signature canvas, camera capture, QR scanner
- Upload progress states

### Analytics (`src/analytics/*`)

- PII-safe event tracking via observability breadcrumbs
