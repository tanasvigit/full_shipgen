# Fleetbase — Original App Low-Level Design (Consolidated LLD)

> **Purpose:** Provide a single, end-to-end Low-Level Design (LLD) for the **original Fleetbase application** by consolidating and cross-referencing:
>
> - `documents/BACKEND-LOW-LEVEL-REQUIREMENTS.md` (backend/API/runtime source of truth)
> - `documents/LOW-LEVEL-REQUIREMENTS.md` (console UX/runtime patterns + route/screen specs)
>
> This document is intentionally **exhaustive and “inch-by-inch”**, but it does **not duplicate** the full text of the source documents. Instead it **indexes, normalizes terminology**, and provides a **traceable map** across:
> architecture → routes/screens → data models → API endpoints → permissions → realtime → jobs/webhooks → test surface.

---

## 0. How to read this LLD

### 0.1 Golden sources

- **Backend truth** (routes, middleware, resources, models, jobs, sockets, directives):  
  `documents/BACKEND-LOW-LEVEL-REQUIREMENTS.md` (abbrev **BACKEND-LLRD**)
- **Console truth** (screens, routes, modals, runtime patterns, extension slots, test cases):  
  `documents/LOW-LEVEL-REQUIREMENTS.md` (abbrev **CONSOLE-LLRD**)

### 0.2 What “original app” means here

- **Backend:** `api/` Laravel shell + Composer packages under `packages/*`
- **Console:** Fleetbase Console (historically Ember, with parity requirements). In this repo you also have a React console implementation under `frontend/` that mirrors those requirements.
- **FleetOps:** orders/drivers/vehicles/routes/maps and the workflow engine.
- **Storefront, Ledger, Pallet, Registry bridge:** additional engines/extensions mounted under their prefixes.
- **Realtime:** SocketCluster-based pub/sub.

### 0.3 Repository map (high-level)

- **Laravel shell:** `api/`
- **Core platform package:** `packages/core-api/`
- **FleetOps package:** `packages/fleetops/server/`
- **Storefront package:** `packages/storefront/server/`
- **Ledger package:** `packages/ledger/server/`
- **Pallet package:** `packages/pallet/server/`
- **Registry bridge:** `packages/registry-bridge/server/`
- **Console (React):** `frontend/` (parity target for console LLRD)
- **Driver mobile (Expo):** `fleet_mobile-main/frontend/` (field execution client)

---

## 1. Architecture (system, runtime, deployment)

### 1.1 Layered architecture

Reference: BACKEND-LLRD “Part 0 — Backend system architecture”.

- Clients: Console (SPA), mobile driver app, SDK/integrations, webhooks consumers
- API: Laravel app composed from packages
- Infra: MySQL, Redis, SocketCluster

### 1.2 URL tiers (internal vs consumable vs extension prefixes)

Reference: BACKEND-LLRD “URL tiers (all packages)”.

- **Internal console tier**: `fleetbase.protected`  
  Typical path: `/int/v1/...`
- **Public/consumable tier**: `fleetbase.api`  
  Typical path: `/v1/...`
- **Extension prefixes**: `storefront`, `ledger`, `pallet`, `~registry` with internal mounts like `/storefront/int/v1/...`

**LLD rule:** When documenting an endpoint, always specify:
- Tier (`fleetbase.protected` vs `fleetbase.api`)
- Full path including prefix + version
- Auth requirements (session token/cookie vs API key)
- Tenancy header requirements (`X-Company`)

### 1.3 Deployment/runtime services

Reference: BACKEND-LLRD “Part II — Infrastructure & runtime”.

- MySQL 8.x for data
- Redis for cache + queue
- SocketCluster for realtime broadcasting (see Part VII-G)

---

## 2. Authentication, tenancy, and request shaping

### 2.1 Auth mechanisms

Reference: BACKEND-LLRD “Part I — API contracts & authentication”.

- Internal console: Sanctum SPA auth (token/cookie; session)
- Consumable: API credentials via Basic-auth-once flow (middleware `AuthenticateOnceWithBasicAuth`)
- Optional: 2FA (TwoFa controller / settings)

### 2.2 Multi-tenancy (company isolation)

Reference: BACKEND-LLRD “Multi-tenancy” + Part VII-H.

- Primary isolation: `company_uuid`
- Active company resolved by session and/or `X-Company`
- Directive system can additionally enforce row-level access rules

### 2.3 Response shapes

Reference: BACKEND-LLRD “Response shape”.

Document per resource:
- List wrapper (`{ data: [...] }` vs `{ orders: [...] }` etc.)
- Entity wrapper (`{ user: ... }`, `{ order: ... }`)
- Error wrapper (common pattern: `{ errors: [...] }` or `{ error: ... }`)

---

## 3. Authorization model (roles, policies, permissions, directives)

### 3.1 Permission naming convention

Reference: BACKEND-LLRD Part VII-B.

Format:

- \(service\) \(action\) \(resource\)
- Example: `fleet-ops dispatch order`
- Wildcards: `fleet-ops *`, `fleet-ops * order`

### 3.2 Where authorization is enforced

Reference: BACKEND-LLRD Part I (middleware) + Part VII-H.

Pipeline (simplified):
- Session & company context bound
- `AuthorizationGuard` checks permission
- Directive rules apply row-level query constraints
- Http Filter applies query-string filters

### 3.3 Console behavior

Reference: CONSOLE-LLRD platform runtime patterns + feature specs.

- Route gates: `abilities.cannot('fleet-ops view order')` → toast + redirect
- UI gating: hide actions/buttons/tabs unless permission granted
- Extension tabs: must declare `@permission`

---

## 4. Realtime (SocketCluster)

Reference: BACKEND-LLRD Part VII-G and CONSOLE-LLRD “Realtime & sockets” sections per feature.

### 4.1 Transport and connection

- SocketCluster broker
- Default path: `/socketcluster/`
- Internal clients authenticate with session + company scope

### 4.2 Canonical channels

Reference: BACKEND-LLRD Part VII-G “Channels”.

- `company.{company_uuid}` — broad updates: orders, notifications, chat
- `order.{order_uuid}` — order detail updates: status, ETA, timeline
- `driver.{driver_uuid}` — driver app: assignments, pings, route updates

### 4.3 UI expectations

Reference: CONSOLE-LLRD FLEETOPS-ORDERS §8.

- Order detail subscribes on enter; unsubscribes on leave
- Events trigger debounced refresh of view and map routing

---

## 5. FleetOps domain (the “original app” core)

### 5.1 Primary aggregates

Reference: BACKEND-LLRD Part IV-B and CONSOLE-LLRD FLEETOPS-* specs.

- Order
- Driver
- Vehicle
- Fleet
- Place
- Route
- Payload / Entities
- Proofs
- Positions / Tracking
- Order configs (workflow definitions)

### 5.2 Order workflow engine (Flow / Activity graph)

Reference: BACKEND-LLRD Part IV-C.

- `order_configs.flow` stores a JSON graph of activities
- Runtime classes interpret the graph:
  - `Fleetbase\\FleetOps\\Flow\\Flow`
  - `Fleetbase\\FleetOps\\Flow\\Activity`
  - `Logic` + conditions

**LLD rule:** “status” is not only a string enum; it is the *current activity code* from config.

### 5.3 Lifecycle phases (canonical)

Reference: BACKEND-LLRD Part IV-B.

- Create (created)
- Dispatch (dispatched)
- Start (started / en_route depending on config)
- Activity progression (update-activity)
- Complete (completed)
- Cancel (canceled)

---

## 6. Console (original UX spec) — global patterns

Reference: CONSOLE-LLRD Part II “Platform runtime patterns”.

### 6.1 Navigation & route resolution

- Host routes + engine mounts
- URL query params persist list state and drawer state

### 6.2 CRUD patterns

- List pages: table/map/kanban (FleetOps orders) or standard tabular lists
- Detail pages: header actions + tabs + map panel where applicable
- Modals: confirm, forms, import/export

### 6.3 Loading and error handling

- Skeletons on load; retry actions
- Standard error handling: parse first error string, show `serverError`

---

## 7. FleetOps Orders — “inch-by-inch” (console spec summary)

Reference: CONSOLE-LLRD “Feature spec: FLEETOPS-ORDERS”.

### 7.1 Screens

- Orders list: `/fleet-ops/operations/orders`
- Order detail: `/fleet-ops/operations/orders/:public_id`
- Create order: `/fleet-ops/operations/orders/new`

### 7.2 Journeys

- J-D1: find and open order
- J-D2: bulk dispatch
- J-D3: cancel order
- J-D4: create order

### 7.3 List layouts

- Map mode (markers + list overlay + drawer)
- Table mode (column filters, bulk toolbar)
- Kanban mode (status columns)

### 7.4 Detail layout

Regions:
- Header summary + action menu
- Tabs: overview + extension tabs
- Map and panels (stack on mobile)

### 7.5 Workflow actions (canonical transition catalog)

Reference: BACKEND-LLRD Part IV-B/IV-C + console transition catalog.

- Dispatch: created → dispatched
- Start: dispatched → started/en_route
- Advance activity: next-activity → update-activity
- Complete: en_route/arrived/delivered → completed
- Cancel: multiple → canceled

### 7.6 Realtime expectations

Reference: CONSOLE-LLRD §8 + BACKEND VII-G.

- Subscribe `order.{uuid}` in detail
- Update timeline + status + map route on `order.updated`

---

## 8. FleetOps Drivers — “inch-by-inch” (console spec summary)

Reference: CONSOLE-LLRD “Feature spec: FLEETOPS-DRIVERS”.

Document includes:
- Drivers list and detail routes
- Tabs (positions, schedule, orders)
- Driver onboarding/edit flows
- Driver ↔ user linkage and org switching

---

## 9. Storefront, Ledger, Pallet, Registry Bridge — extension LLD indexing

Reference: BACKEND-LLRD Parts V–VI and CONSOLE-LLRD feature specs.

This LLD consolidates the *shape* of each extension:
- Mount paths (internal and consumable)
- Primary resources
- Major workflows (checkout/payment for Storefront, billing for Ledger, WMS flows for Pallet)
- How they link back to FleetOps (e.g. storefront orders create FleetOps orders via observers/listeners)

---

## 10. Jobs, events, webhooks (side effects)

Reference: BACKEND-LLRD Part VII (jobs/queues/events/webhooks) and Part IV-C (activity events).

### 10.1 Event-driven side effects

- Activity transitions fire events
- Listeners can broadcast to SocketCluster and/or emit webhooks

### 10.2 Webhook contracts

- Resource lifecycle webhooks
- Third-party telemetry ingestion endpoints

---

## 11. Database schema and data access

Reference: BACKEND-LLRD Part VIII and Part XII-E.

For each major aggregate, document:
- Table name
- Primary UUID/public_id scheme
- Key FKs
- Common indexes and query paths

---

## 12. Test surface (original app)

Reference: CONSOLE-LLRD test case tables per feature, and BACKEND-LLRD endpoint specs.

### 12.1 What must be tested

- Auth + org switching + tenancy isolation
- Permission matrix correctness
- Orders: create → dispatch → start → advance → complete
- Realtime: socket channel updates
- Import/export paths for orders/drivers/etc.

---

## 13. “Inch-by-inch” completion plan for this consolidated LLD

This file is the **consolidation shell**. To make it fully exhaustive (as requested), it must expand each section into:

- **Route-by-route** specs (all engines) with:
  - screen purpose
  - UI regions
  - permissions
  - API calls (method + exact route)
  - sockets subscriptions
  - error states
  - modals used
  - test cases
- **Resource-by-resource** API contract pages:
  - request schema
  - response schema
  - filters/sorts
  - directives and authorization notes

The source documents already contain this “inch-by-inch” data; this file’s job is to make it navigable as *one document*.

---

## Appendix A — Direct links into source LLRDs

- Backend index: `documents/BACKEND-LOW-LEVEL-REQUIREMENTS.md` (Quick navigation section)
- Console index: `documents/LOW-LEVEL-REQUIREMENTS.md` (Quick navigation section)

