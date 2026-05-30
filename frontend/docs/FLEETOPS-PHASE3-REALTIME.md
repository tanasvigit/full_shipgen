# FleetOps Phase 3 — Realtime operations

## Realtime engine

| Module | Role |
|--------|------|
| `domain/fleetops/realtime/manager.js` | `fleetopsRealtimeManager` — ref-counted SocketCluster subscriptions |
| `domain/fleetops/realtime/eventRouter.js` | Cache invalidation + `fleetops:realtime` window events |
| `domain/fleetops/realtime/socketConfig.js` | Channel naming (`order.{publicId}`, `company.{uuid}`) |
| `hooks/fleetops/useFleetopsRealtimeChannel.js` | React lifecycle wrapper |
| `hooks/fleetops/useOrderRealtime.js` | Order drawer live timeline + refetch |

### Connection

Uses `socketcluster-client` (npm). Configure via env:

- `VITE_SOCKETCLUSTER_HOST`
- `VITE_SOCKETCLUSTER_PORT` (default `38000`)
- `VITE_SOCKETCLUSTER_PATH` (default `/socketcluster/`)
- `VITE_SOCKETCLUSTER_SECURE`

If the socket is unreachable, the manager enters **degraded** mode and polls active channels every 15–20s.

### Extension hooks

```js
import { registerRealtimeHandler } from "@/domain/fleetops/detail/registry";

registerRealtimeHandler((message, { channelId }) => {
  // custom widget / tab updates
});
```

## Field-level dirty state

`useFormDirtyBridge(formRef, dialogOpen, key)` reads `formRef.current.isDirty()` from react-hook-form and blocks drawer close via `FleetopsDetailDirtyProvider`.

## Order drawer — Ember tab parity

New tabs (API-backed from `rawOrder`):

- Detail, Payload, Notes, Metadata, Purchase rate, Integrated vendor, Custom fields
- Activity timeline merges **live socket events** at the top
- Header `syncState`: `synced` | `live` | `polling`

## Testing

```bash
cd frontend
npm run build
npx playwright test e2e/fleetops --project=chromium --no-deps
```

With SocketCluster running, open an order drawer and verify the header shows `live` and activity events append without full reload.
