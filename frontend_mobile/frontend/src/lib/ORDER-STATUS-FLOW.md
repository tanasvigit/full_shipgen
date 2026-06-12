# Order status flow

**Canonical documentation** (full diagram, transitions, backend mapping, API reference):

→ [`frontend/src/domain/fleetops/ORDER-STATUS-FLOW.md`](../../../../frontend/src/domain/fleetops/ORDER-STATUS-FLOW.md)

## Quick reference

```
created → assigned → dispatched → en_route → arrived → delivered → completed
                                              ↘ canceled / failed
```

## Mobile implementation

| File | Role |
|------|------|
| [`orderStatus.ts`](./orderStatus.ts) | `resolveEffectiveOrderStatus`, buckets, `canStartTrip`, `canCompleteOrder` |
| [`orderMapper.ts`](./orderMapper.ts) | Maps API orders through effective status |
| [`StatusBadge.tsx`](../components/StatusBadge.tsx) | Human-readable labels |
| [`app/order/[id].tsx`](../../app/order/[id].tsx) | Start trip, advance, complete actions |

Keep `orderStatus.ts` aligned with web [`status.js`](../../../../frontend/src/domain/fleetops/status.js).
