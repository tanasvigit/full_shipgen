# Fleetbase Mobile API Compatibility Matrix

This matrix defines the canonical contracts used by `fleet_mobile-main/frontend`.
Primary target is internal API namespace: `/int/v1`.

## Base assumptions

- **Base URL:** `EXPO_PUBLIC_API_BASE_URL` (default: `http://192.168.0.171:8000/int/v1`)
- **Auth header:** `Authorization: Bearer <token>`
- **Tenant header:** `X-Company: <uuid>`
- **JSON wrappers vary** by endpoint (`data`, `order`, `orders`, raw array)

## Wrapper normalization rules

- `unwrapEntity(payload, ["user","me","order","activity","next_activity"])`
- `unwrapList(payload, ["orders","organizations","companies","drivers","vehicles","routes","places","issues","fuel_logs","notifications"])`

---

## Auth + Session

| Purpose | Method | Internal `/int/v1` | Expected request | Response shape | Fallback |
|---|---|---|---|---|---|
| Login | `POST` | `/auth/login` | `{ identity, password, remember }` | `{ token }` (or access token variants) | None |
| Current user | `GET` | `/users/me` | headers only | `{ user }` or user object | None |
| Organizations | `GET` | `/auth/organizations` | headers only | `organizations[]` / `companies[]` / array | None |
| Logout | `POST` | `/auth/logout` | headers only | status/error envelope | Local session clear always |

## Orders

| Purpose | Method | Internal `/int/v1` | Request | Response | Fallback |
|---|---|---|---|---|---|
| List | `GET` | `/orders?limit=500` | query + headers | `{ orders: [...] }` or list wrappers | none |
| Detail | `GET` | `/orders/{idOrPublicId}` | headers | `{ order }` or entity | try uuid then public_id/code |

## Workflow (server-driven)

| Purpose | Method | Internal `/int/v1` | Request | Response | Fallback |
|---|---|---|---|---|---|
| Next activity | `GET` | `/orders/next-activity/{id}` | headers | activity array/entity | normalize to first item |
| Apply activity | `PATCH` | `/orders/update-activity/{id}` | `{ activity: <full activity object> }` | status/entity envelope | none |
| Legacy start | `PATCH` | `/orders/start` | `{ order: <uuid> }` | status envelope | not used by mobile UI |

> Important: mobile does not hardcode `start/advance/complete` endpoints.  
> It derives action payload from `next-activity` and applies via `update-activity`.

## Tracking

| Purpose | Method | Internal `/int/v1` | Request | Response | Fallback |
|---|---|---|---|---|---|
| Upload location | `POST` | `/orders/{id}/track` | `{ latitude, longitude, lat, lng }` | status envelope | retry with `PATCH` on 404 |

## POD

| Purpose | Method | Internal `/int/v1` | Request | Response | Fallback |
|---|---|---|---|---|---|
| Signature | `POST` | `/orders/{id}/capture-signature` | `{ signature }` | status envelope | retry `PATCH` on 404 |
| Photo | `POST` | `/orders/{id}/capture-photo` | `{ photo }` | status envelope | retry `PATCH` on 404 |
| QR | `POST` | `/orders/{id}/capture-qr` | `{ qr }` | status envelope | retry `PATCH` on 404 |

## Fleet module collections

| Resource | Method | Internal `/int/v1` | Notes |
|---|---|---|---|
| Drivers | `GET` | `/drivers` | list wrappers vary |
| Vehicles | `GET` | `/vehicles` | list wrappers vary |
| Routes | `GET` | `/routes` | list wrappers vary |
| Places | `GET` | `/places` | list wrappers vary |
| Issues | `GET` | `/issues` | list wrappers vary |
| Fuel logs | `GET` | `/fuel-logs` | list wrappers vary |
| Notifications | `GET` | `/notifications` | list wrappers vary |

---

## `/int/v1` vs `/v1` note

- Mobile app phase-1 remains aligned to **internal** contracts (`/int/v1`).
- `/v1` consumable APIs are referenced only for future compatibility and must not replace working `/int/v1` routes without backend validation.

---

## Client architecture mapping (Phase 1.1)

| Domain | Service module | Query / mutation hooks |
|---|---|---|
| Auth | `src/services/authService.ts` | `AuthContext.refresh`, org switch |
| Orders | `src/services/ordersService.ts` | `useDriverOrders`, `useOrderQuery` |
| Workflow | `src/services/workflowService.ts` | `useNextActivityQuery`, `useStartTripMutation`, `useAdvanceActivityMutation`, `useCompleteOrderMutation` |
| Tracking | `src/services/trackingService.ts` | `useTrackingMutation` |
| POD | `src/services/podService.ts` | `usePodMutation` |
| Fleet | `src/services/fleetService.ts` | `useFleetData` |

### Cache invalidation rules

- Keys are tenant-scoped: `["orders", companyUuid, params]`.
- Workflow mutations invalidate via `refreshOrderScope` (orders list + order detail + next activity).
- Org switch evicts previous tenant keys via `refreshOnOrgSwitch`.
- Logout/unauthorized clears all queries via `resetAllQueries`.

See also: `docs/ARCHITECTURE.md`.

