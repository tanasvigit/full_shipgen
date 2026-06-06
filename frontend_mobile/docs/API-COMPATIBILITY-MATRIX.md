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
| Login | `POST` | `/auth/login` | `{ identity, password, remember }` | `{ token }` or `{ twoFaSession, isEnabled }` | None |
| 2FA resend | `POST` | `/two-fa/resend` | `{ identity, token }` | `{ clientToken }` | None |
| 2FA verify | `POST` | `/two-fa/verify` | `{ code, token, clientToken }` | `{ authToken }` | None |
| Current user | `GET` | `/users/me` | headers only | `{ user }` or user object | None |
| Organizations | `GET` | `/auth/organizations` | headers only | `organizations[]` / `companies[]` / array | None |
| Logout | `POST` | `/auth/logout` | headers only | status/error envelope | Local session clear always |

## Orders

| Purpose | Method | Internal `/int/v1` | Request | Response | Fallback |
|---|---|---|---|---|---|
| List | `GET` | `/orders?limit=500&driver={driverId}` | query + headers | `{ orders: [...] }` or list wrappers | client filter fallback |
| Detail | `GET` | `/orders/{idOrPublicId}` | headers | `{ order }` or entity | try uuid then public_id/code |
| ETA | `GET` | `/orders/{id}/eta` | headers | eta object or envelope | none |
| Tracker | `GET` | `/orders/{id}/tracker` | headers | tracker object | none |
| Proofs | `GET` | `/orders/{id}/proofs` | headers | proofs collection | optional `subjectId` segment |

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
| Upload location | `POST` | `/drivers/{driverId}/track` | `{ latitude, longitude, lat, lng }` | driver resource | retry with `PATCH` on 404 |
| Toggle online | `POST` | `/drivers/{driverId}/toggle-online` | `{ online?: boolean }` | driver resource | none |
| Driver profile | `GET` | `/drivers/{driverId}` | headers | `{ driver }` | sync online status |

## POD

| Purpose | Method | Internal `/int/v1` | Request | Response | Fallback |
|---|---|---|---|---|---|
| Signature | `POST` | `/orders/{id}/capture-signature` | `{ signature }` | proof resource | retry `PATCH` on 404 |
| Photo | `POST` | `/orders/{id}/capture-photo` | `{ photos: [base64] }` | proof resource | retry `PATCH` on 404 |
| QR | `POST` | `/orders/{id}/capture-qr` | `{ code }` | proof resource | retry `PATCH` on 404 |

## Fleet module collections

| Resource | Method | Internal `/int/v1` | Notes |
|---|---|---|---|
| Drivers | `GET` | `/drivers` | list wrappers vary |
| Vehicles | `GET` | `/vehicles` | list wrappers vary |
| Routes | `GET` | `/routes` | list wrappers vary |
| Places | `GET` | `/places` | list wrappers vary |
| Issues | `GET` | `/issues` | list wrappers vary |
| Issue create | `POST` | `/issues` | `{ issue: { driver, report, location, priority } }` | issue resource |
| Fuel logs | `GET` | `/fuel-reports` | list wrappers vary |
| Fuel create | `POST` | `/fuel-reports` | `{ fuel_report: { driver, odometer, volume } }` | fuel report resource |
| Notifications | `GET` | `/notifications` | list wrappers vary |
| Mark read | `PUT` | `/notifications/mark-as-read` | `{ notification: id }` | status envelope |
| Mark all read | `PUT` | `/notifications/mark-all-read` | headers | status envelope |
| Device register | `POST` | `/user-devices/register` or `/user-devices` | `{ token, platform }` | device uuid |
| Manifests | `GET` | `/fleet-ops/manifests?driver_id=` | query filters | paginated manifests |
| Manifest stop | `PATCH` | `/fleet-ops/manifest-stops/{id}` | `{ manifest_stop: { status } }` | stop resource |

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

