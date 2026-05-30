# Fleetbase Mobile App — Complete Technical Documentation

## 1) Document Purpose

This document provides end-to-end, implementation-level documentation for the `fleet_mobile-main` app as it exists in this repository.

It covers:

- Product scope and current architecture
- Folder-by-folder code map
- Navigation and screen-by-screen behavior
- Authentication/session lifecycle
- API integration and endpoint usage
- Order workflow semantics (start, advance, complete, POD, tracking)
- Data models and mapping
- UI system (theme/components)
- Storage/security details
- Build/run/deploy notes
- Known limitations and troubleshooting

---

## 2) App Identity and Scope

### 2.1 What this app is

- A React Native (Expo Router) mobile operations app focused on **driver workflows** and fleet operations views.
- Primary runtime location: `fleet_mobile-main/frontend`.
- Backend target: Fleetbase internal API namespace (`/int/v1`) by default.

### 2.2 What this app is not

- Not a full replacement for the desktop console.
- Not currently implementing native map SDK integration (uses `StylizedMap` placeholder visuals).
- Not currently using live websocket client wiring in app code (poll/refresh + API sync patterns are used).

### 2.3 Existing docs in repo

- Base readme: `fleet_mobile-main/README.md`
- End-to-end Day 4 flow: `fleet_mobile-main/docs/END-TO-END-GUIDE.md`
- Legacy PRD (static demo history): `fleet_mobile-main/memory/PRD.md`  
  Note: This PRD mentions mock/static data; current implementation is API-connected.

---

## 3) Technology Stack

From `frontend/package.json`:

- Expo SDK `~54.0.34`
- React `19.1.0`
- React Native `0.81.5`
- Expo Router `~6.0.22`
- TypeScript `~5.9.3`
- Navigation: `@react-navigation/*`
- Storage: `@react-native-async-storage/async-storage`, `expo-secure-store`
- Icons: `@expo/vector-icons`

Build config:

- `frontend/app.json`
  - `newArchEnabled: true`
  - `expo-router` plugin enabled
  - typed routes experiment enabled
- `frontend/tsconfig.json`
  - strict mode enabled
  - alias: `@/* -> ./`

---

## 4) Repository and Folder Structure

## 4.1 Top-level (`fleet_mobile-main`)

- `README.md`: quick start and API notes
- `docs/`: documentation
- `design_guidelines.json`: design tokens/intent guidance
- `memory/PRD.md`: historical feature intent
- `frontend/`: actual Expo application

## 4.2 Frontend app layout (`fleet_mobile-main/frontend`)

- `app/`: Expo Router route tree
- `src/`: application logic, hooks, API, components, theme, types, storage
- `assets/`: images/icons/fonts
- `app.json`: Expo app metadata/config
- `expo-env.d.ts`: Expo type reference

## 4.3 Route tree (`app/`)

Root:

- `app/_layout.tsx` — global shell, splash/font loading, auth provider
- `app/index.tsx` — login screen

Tabs group (`app/(tabs)/`):

- `_layout.tsx` — authenticated tab shell
- `dashboard.tsx`
- `orders.tsx`
- `tracking.tsx`
- `fleet.tsx`
- `profile.tsx`

Entity/detail and module routes:

- `order/[id].tsx`
- `driver/[id].tsx`
- `vehicle/[id].tsx`
- `route/[id].tsx`
- `drivers.tsx`
- `routes.tsx`
- `places.tsx`
- `issues.tsx`
- `fuel.tsx`
- `notifications.tsx`
- `+html.tsx` (web HTML wrapper and style reset)

## 4.4 Core source folders (`src/`)

- `contexts/` — auth context
- `hooks/` — data/query hooks and font hook
- `lib/` — API/auth/workflow/tracking/POD/mappers
- `components/` — reusable UI components
- `data/` — TypeScript domain types
- `theme.ts` — colors/spacing/radius/status helpers
- `utils/storage/` — cross-platform storage wrappers

---

## 5) Application Boot and Runtime Lifecycle

## 5.1 Root layout

File: `app/_layout.tsx`

Boot sequence:

1. Prevent splash autohide.
2. Load icon fonts via `useIconFonts()`.
3. Hide splash after fonts/error ready.
4. Wrap app with `AuthProvider`.
5. Render `Stack` with `headerShown: false`.

## 5.2 Auth gate

File: `app/(tabs)/_layout.tsx`

- Shows centered loader until `authReady`.
- If not authenticated, redirects to `/` (login).
- If authenticated, renders 5-tab interface:
  - Dashboard
  - Orders
  - Tracking
  - Fleet
  - Profile

---

## 6) Authentication and Session Model

## 6.1 Context contract

File: `src/contexts/AuthContext.tsx`

Exposed state:

- `authReady`
- `isAuthenticated`
- `session`
- `user`
- `organizations`
- `activeOrganization`

Exposed actions:

- `login(email, password)`
- `logout()`
- `refresh()`

## 6.2 Auth service

File: `src/lib/auth.ts`

### Login flow

`authService.login(email, password)`:

- `POST /auth/login` with `{ identity, password, remember: true }`
- stores token in secure session storage (`setStoredSession`)

### Bootstrap flow

`authService.bootstrap()`:

- `GET /users/me`
- `GET /auth/organizations`
- maps user and orgs
- stores active org into local storage (`setStoredOrganization`)

### Logout flow

`authService.logout()`:

- `POST /auth/logout` (best-effort)
- clears session + org storage in `finally`

## 6.3 Unauthorized handling

File: `src/lib/api.ts` + `AuthContext.tsx`

- On 401, API client clears session/org and emits `fleetbase:unauthorized`.
- AuthProvider listens via `DeviceEventEmitter` and resets local auth state.

---

## 7) API Layer

File: `src/lib/api.ts`

## 7.1 Base URL

```ts
const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://192.168.0.171:8000/int/v1").replace(/\/$/, "");
```

Default target is internal Fleetbase API (`/int/v1`).

## 7.2 Request behavior

- Adds headers:
  - `Accept: application/json`
  - `Content-Type: application/json`
  - `Authorization: Bearer <token>` if present
  - `X-Company` from stored active org if present
- JSON body serialization if `options.body` exists
- Safe parse of response text to JSON/string

## 7.3 Error behavior

- Wraps in `ApiError` with:
  - `message`
  - `status`
  - `payload`
- Message extraction priority:
  1. `payload.errors[0]`
  2. `payload.error`
  3. `payload.message`

## 7.4 Payload helpers

- `unwrapList(payload, candidates)`
- `unwrapEntity(payload, candidates)`

Used across modules to normalize backend response shape differences.

---

## 8) Storage Architecture

Files:

- `src/utils/storage/storage-base.ts`
- `src/utils/storage/index.ts` (native)
- `src/utils/storage/index.web.ts` (web)

Storage keys:

- `fleet_mobile.auth` (secure)
- `fleet_mobile.org` (non-secure)

Behavior:

- Native secure storage: `expo-secure-store`
- Native standard storage: `AsyncStorage`
- Web secure methods fallback to `AsyncStorage`
- Read methods return fallback on errors; write methods return boolean success

---

## 9) Domain Models and Type System

File: `src/data/types.ts`

Primary types:

- `Order`
- `Driver`
- `Vehicle`
- `Route`
- `Place`
- `Issue`
- `FuelLog`
- `NotificationItem`

Order status union includes:

- `created`, `dispatched`, `started`, `en_route`, `arrived`, `delivered`, `completed`, `canceled`, etc.

---

## 10) Data Fetching Hooks

## 10.1 `useDriverOrders`

File: `src/hooks/useDriverOrders.ts`

Behavior:

- Fetches orders from `GET /orders?limit=500`
- Maps via `mapBackendOrder`
- Exposes:
  - `orders`
  - `loading`
  - `error`
  - `refresh()`
  - `findOrder(ref)` (matches uuid or code/public id)
  - `ordersForBucket(bucket)`

`fetchOrderById(orderId, hints?)`:

- Tries candidate identifiers (id and optional code)
- Calls `GET /orders/{candidate}`
- Returns `null` on 404, throws on other errors

## 10.2 `useFleetData`

File: `src/hooks/useFleetData.ts`

Aggregates multiple collections in parallel:

- `/orders`
- `/drivers`
- `/vehicles`
- `/routes`
- `/places`
- `/issues`
- `/fuel-logs`
- `/notifications`

Returns datasets + helper finders:

- `findOrder`, `findDriver`, `findVehicle`, `findRoute`

---

## 11) Mapping and Status Semantics

## 11.1 Backend order mapper

File: `src/lib/orderMapper.ts`

- Normalizes backend order object into mobile `Order` shape
- Uses:
  - `uuid`/`public_id` for IDs
  - customer/place fallbacks
  - payload item mapping
  - timeline normalization

## 11.2 Status bucketing

File: `src/lib/orderStatus.ts`

Buckets:

- `assigned`: created/dispatched/assigned/scheduled
- `active`: started/en_route/arrived/delivered/in_transit
- `completed`: completed/canceled/cancelled

Guards:

- `canStartTrip(status)`: dispatched only
- `canCompleteOrder(status)`: started/en_route/enroute/arrived/delivered
- `isTerminalStatus(status)`: completed/canceled/cancelled

---

## 12) Workflow Engine in Mobile

File: `src/lib/orderWorkflow.ts`

This is critical and intentionally adapted to internal API behavior.

## 12.1 Why current implementation exists

Comment in code explains:

- Internal API route shape differs from consumable docs.
- Direct start endpoint can fail/404/500 depending on config/route tier.
- Reliable approach is activity-driven:
  1. fetch next activity
  2. apply activity

## 12.2 Implemented calls

- `GET /orders/next-activity/{orderId}`
- `PATCH /orders/update-activity/{orderId}` with `{ activity: <full activity object> }`

Exposed functions:

- `getNextActivity(orderId)`
- `startTrip(orderId)` — applies first next activity
- `advanceActivity(orderId, activityCode)` — matches by code or falls back first
- `completeOrder(orderId)` — chooses activity with `complete === true` or falls back first

---

## 13) Tracking and POD APIs

## 13.1 Tracking

File: `src/lib/tracking.ts`

- Attempts:
  - `POST /orders/{id}/track`
  - fallback `PATCH /orders/{id}/track` if 404
- Payload:
  - `{ latitude, longitude, lat, lng }`

## 13.2 Proof of Delivery (POD)

File: `src/lib/pod.ts`

Endpoints (with POST then PATCH fallback on 404):

- `/orders/{id}/capture-signature` body `{ signature }`
- `/orders/{id}/capture-photo` body `{ photo }`
- `/orders/{id}/capture-qr` body `{ qr }`

---

## 14) UI System

## 14.1 Theme

File: `src/theme.ts`

- Color palette with semantic groups
- Spacing tokens (`xs`..`xxxl`)
- Radius tokens (`sm`..`pill`)
- Typography presets
- `statusColor(status)` resolver for badge rendering

## 14.2 Reusable components

- `ScreenHeader`: top bar with optional back/right action
- `StatusBadge`: semantic badge from status string
- `KpiCard`: dashboard metric card
- `StylizedMap`: non-GPS map-like visual with markers and route overlays

---

## 15) Route-by-Route Functional Documentation

## 15.1 `/` — Login

File: `app/index.tsx`

Features:

- Email/password sign-in
- simple SSO button currently wired to same login handler
- redirect to `/(tabs)/orders` if already authenticated
- default seeded input values for convenience

Data dependencies:

- `useAuth().login`

## 15.2 `/(tabs)/dashboard`

File: `app/(tabs)/dashboard.tsx`

Features:

- KPI cards
- Weekly revenue chart (client-generated sample series)
- Quick links to fleet modules
- Active orders list
- Online drivers strip
- Recent activity feed

Data dependencies:

- `useFleetData()`

## 15.3 `/(tabs)/orders`

File: `app/(tabs)/orders.tsx`

Features:

- Search (client-side over code/customer/pickup/dropoff)
- Filter chips: Assigned / Active / Completed
- Pull-to-refresh
- Row navigation to `/order/[id]`

Data dependencies:

- `useDriverOrders()`
- `matchesDriverBucket()`

## 15.4 `/order/[id]` — Order Detail + Workflow

File: `app/order/[id].tsx`

Features:

- Full order details (status, route, assignment, items, timeline)
- Workflow actions:
  - Start trip
  - Advance activity
  - Complete
- POD action buttons (signature/photo/qr)
- Tracking shortcut button

Resilience behaviors:

- If fetch returns null after action, keeps prior order in state and updates local status fallback
- Uses `fetchOrderById(order.id, { code })` for robustness

## 15.5 `/(tabs)/tracking`

File: `app/(tabs)/tracking.tsx`

Features:

- Active orders map markers
- Auto sync location every 20s (and manual sync)
- Trip selection strip
- Detail card navigation to order

Data/API:

- `useDriverOrders()`
- `uploadOrderLocation()`

## 15.6 `/(tabs)/fleet`

File: `app/(tabs)/fleet.tsx`

Features:

- Vehicle list + type filtering
- Fuel bar indicator
- Module chips for drivers/routes/places/issues/fuel
- Vehicle detail navigation

Data dependencies:

- `useFleetData()`

## 15.7 `/vehicle/[id]`

File: `app/vehicle/[id].tsx`

Features:

- Vehicle profile and status
- Fuel, maintenance, assigned driver
- Related stats (orders/issues/refuels)

## 15.8 `/drivers` and `/driver/[id]`

Files:

- `app/drivers.tsx`
- `app/driver/[id].tsx`

Features:

- Driver list with status and meta
- Driver detail with contact actions, assigned vehicle, recent orders

## 15.9 `/routes` and `/route/[id]`

Files:

- `app/routes.tsx`
- `app/route/[id].tsx`

Features:

- Route list with stops/distance/duration/status
- Route detail with waypoint progression and assignment cards

## 15.10 `/places`

File: `app/places.tsx`

Features:

- Place list by type (warehouse/hub/customer)
- Address/city/order count metadata

## 15.11 `/issues`

File: `app/issues.tsx`

Features:

- Issue list with priority coloring
- Status mapped to `StatusBadge` semantics
- Navigation to related vehicle when available

## 15.12 `/fuel`

File: `app/fuel.tsx`

Features:

- Fuel totals (cost, gallons, entries)
- Refuel logs with station/driver/date metadata

## 15.13 `/notifications`

File: `app/notifications.tsx`

Features:

- Notification list with read/unread styling
- Mark-all-as-read local state action

## 15.14 `/(tabs)/profile`

File: `app/(tabs)/profile.tsx`

Features:

- User card and role badge
- Workspace section
- Module shortcuts
- Preference toggles (local UI state)
- Logout action with redirect to `/`

---

## 16) Navigation Rules and Guards

- Tabs are auth-gated in `/(tabs)/_layout.tsx`
- Unauthorized state always routes back to `/`
- Detail pages rely on IDs from list state + fallback API fetch
- Header back uses `router.back()`

---

## 17) Environment and Configuration

Required env:

- `EXPO_PUBLIC_API_BASE_URL`  
  Example: `http://192.168.0.171:8000/int/v1`

Important:

- Use LAN IP (not localhost) when running on a physical device.
- Restart Expo after env change.

---

## 18) Running the App

From `fleet_mobile-main/frontend`:

```bash
yarn install
yarn start
```

Optional:

- `yarn android`
- `yarn ios`
- `yarn web`
- `yarn lint`

---

## 19) Integration Contract Summary

Endpoints actively used by current mobile app:

- Auth/session:
  - `POST /auth/login`
  - `GET /users/me`
  - `GET /auth/organizations`
  - `POST /auth/logout`
- Orders:
  - `GET /orders?limit=500`
  - `GET /orders/{id}`
  - `GET /orders/next-activity/{id}`
  - `PATCH /orders/update-activity/{id}`
- Tracking:
  - `POST|PATCH /orders/{id}/track`
- POD:
  - `POST|PATCH /orders/{id}/capture-signature`
  - `POST|PATCH /orders/{id}/capture-photo`
  - `POST|PATCH /orders/{id}/capture-qr`
- Fleet datasets:
  - `/drivers`, `/vehicles`, `/routes`, `/places`, `/issues`, `/fuel-logs`, `/notifications`

---

## 20) Known Limitations / Implementation Notes

1. `useFleetData` independently loads full collections on each consuming screen; there is no centralized caching layer yet.
2. `StylizedMap` is synthetic UI, not GPS map SDK.
3. Notification read state is local-only in `notifications.tsx`.
4. Several “add/create” buttons are present as UI affordances but not fully wired to create flows.
5. SSO button on login currently reuses standard credential login handler.
6. Legacy `memory/PRD.md` still describes static demo assumptions; code now uses live API.

---

## 21) Troubleshooting Guide

## 21.1 Login fails

Check:

- API reachable at configured base URL
- valid credentials
- org endpoint returns at least one org

## 21.2 “There is nothing to see here” on Start Trip

Cause:

- Incorrect endpoint shape (internal API path mismatch).

Current fix in code:

- workflow uses `next-activity` + `update-activity`.

## 21.3 “Order not found” after workflow action

Mitigation implemented:

- detail screen preserves previous order state if refetch fails
- falls back by code/id matching

Operational steps:

- refresh Orders tab
- check Active bucket
- verify order exists in console

## 21.4 No orders visible for driver

Check:

- order dispatched
- assigned driver matches logged-in user identity
- same company context (`X-Company`)

## 21.5 Mobile cannot reach backend

Check:

- device and API host are on same network
- use LAN IP in `EXPO_PUBLIC_API_BASE_URL`
- backend CORS/network/firewall settings

---

## 22) Suggested Roadmap for Hardening

1. Introduce global data cache (React Query or equivalent) to avoid repeated full loads.
2. Add websocket client for live order/driver updates.
3. Replace `StylizedMap` with real map + polyline + location updates.
4. Add typed API client contracts per endpoint.
5. Wire create/edit flows for fleet modules.
6. Add robust offline mode + sync queue for tracking and POD.
7. Add test suite:
   - unit tests for mappers/workflow/status bucketing
   - integration tests for auth/bootstrap/order actions
   - e2e mobile UI tests

---

## 23) File Index (Quick Reference)

Core runtime:

- `frontend/app/_layout.tsx`
- `frontend/app/(tabs)/_layout.tsx`
- `frontend/src/contexts/AuthContext.tsx`

API/auth:

- `frontend/src/lib/api.ts`
- `frontend/src/lib/auth.ts`
- `frontend/src/utils/storage/*`

Orders/workflow:

- `frontend/src/hooks/useDriverOrders.ts`
- `frontend/src/lib/orderWorkflow.ts`
- `frontend/src/lib/orderMapper.ts`
- `frontend/src/lib/orderStatus.ts`
- `frontend/app/(tabs)/orders.tsx`
- `frontend/app/order/[id].tsx`

Tracking/POD:

- `frontend/src/lib/tracking.ts`
- `frontend/src/lib/pod.ts`
- `frontend/app/(tabs)/tracking.tsx`

Fleet modules:

- `frontend/src/hooks/useFleetData.ts`
- `frontend/app/(tabs)/fleet.tsx`
- `frontend/app/drivers.tsx`
- `frontend/app/driver/[id].tsx`
- `frontend/app/routes.tsx`
- `frontend/app/route/[id].tsx`
- `frontend/app/vehicle/[id].tsx`
- `frontend/app/places.tsx`
- `frontend/app/issues.tsx`
- `frontend/app/fuel.tsx`
- `frontend/app/notifications.tsx`

UI system:

- `frontend/src/theme.ts`
- `frontend/src/components/ScreenHeader.tsx`
- `frontend/src/components/StatusBadge.tsx`
- `frontend/src/components/KpiCard.tsx`
- `frontend/src/components/StylizedMap.tsx`

---

## 24) Documentation Version

- Generated for current repo state on: 2026-05-29
- Owner context: Fleetbase mobile integration Day 4 stream

