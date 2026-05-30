# Fleetbase Mobile — Parity Validation (Phase 3)

## Validated flows

| Domain | Mobile behavior | Backend authority |
|--------|-----------------|-------------------|
| Auth/login | `/auth/login`, bootstrap `/users/me` | ✅ |
| Org switch | persisted org + tenant cache purge | ✅ |
| Orders list | tenant-scoped React Query | ✅ |
| Workflow | `next-activity` → `update-activity` | ✅ |
| Tracking | `/orders/{id}/track` + queue | ✅ |
| POD | capture endpoints + staging | ✅ |
| Realtime | SocketCluster + scoped invalidation | ✅ |
| Offline | persisted queue replay | ✅ |

## Intentional differences (current)

1. **Geocoding** — map coordinates use deterministic placeholders when API places lack lat/lng (until place coordinates are wired).
2. **Background tracking** — Expo TaskManager-based; not identical to Navigator native module packaging.
3. **Supervisor KPIs** — mobile dashboard remains driver-focused vs full console analytics.
4. **Fleet admin CRUD** — limited on mobile; console remains system of record for bulk ops.

## Phase 3 acceptance checklist

- [x] Real maps on native (fallback on web)
- [x] Background tracking task registered
- [x] Sync status visible (banner/chips)
- [x] Conflict recovery UX
- [x] POD signature/photo/QR components
- [x] Release docs + EAS profile
- [x] Analytics event hooks
- [x] Unit tests extended
