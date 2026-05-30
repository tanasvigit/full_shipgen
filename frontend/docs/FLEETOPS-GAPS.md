# FleetOps — Complete Gap Analysis (Ember / LLR vs React)

**Canonical document.** All FleetOps parity, gaps, roadmap, and task planning live here only.

| Field | Value |
|-------|--------|
| **Version** | 3.4 (Phase 3 entity depth complete) |
| **Date** | 2026-05-30 |
| **Last audit** | Cross-check: `packages/fleetops/addon/routes.js`, `extension.js`, `frontend/src/App.jsx`, `frontend/src/pages/fleetops/**`, `frontend/src/lib/fleetops/crudEntities.js`, `frontend/tests/e2e/fleetops/**` |
| **Baseline Ember** | `packages/fleetops` — `@fleetbase/fleetops-engine` ~0.6.44 (~188 route modules, 55 services, 68 modals) |
| **Baseline React** | `frontend/src/pages/fleetops`, `components/fleetops`, `services/fleetops.js` |
| **Specifications** | `documents/LOW-LEVEL-REQUIREMENTS.md` (Parts III, V, V-A) · `documents/BACKEND-LOW-LEVEL-REQUIREMENTS.md` (Part IV-B/C) |
| **Order API deep-dive** | §14 below (condensed); optional detail in [FLEETOPS-ORDER-LIFECYCLE.md](./FLEETOPS-ORDER-LIFECYCLE.md) |
| **Implementation phases (48% → 100%)** | [FLEETOPS-IMPLEMENTATION-PHASES.md](./FLEETOPS-IMPLEMENTATION-PHASES.md) — Phases 1–8 console · Phase 9 field/portals |

**Legend:** ✅ Done · 🟡 Partial · ❌ Missing · ➕ React-only (not in Ember)

---

## Table of contents

1. [Executive summary](#1-executive-summary)  
2. [Parity scores](#2-parity-scores)  
3. [Complete route catalog (Ember → React)](#3-complete-route-catalog-ember--react)  
4. [React implementation inventory](#4-react-implementation-inventory)  
5. [Operations — gaps](#5-operations--gaps)  
6. [Management — gaps](#6-management--gaps)  
7. [Connectivity — gaps](#7-connectivity--gaps)  
8. [Maintenance — gaps](#8-maintenance--gaps)  
9. [Analytics — gaps](#9-analytics--gaps)  
10. [FleetOps settings — gaps](#10-fleetops-settings--gaps)  
11. [Cross-cutting platform gaps](#11-cross-cutting-platform-gaps)  
12. [API & `fleetopsService` matrix](#12-api--fleetopsservice-matrix)  
13. [Ember services & modals inventory](#13-ember-services--modals-inventory)  
14. [Order lifecycle (condensed)](#14-order-lifecycle-condensed)  
15. [React-only capabilities](#15-react-only-capabilities)  
16. [E2E, quality & docs](#16-e2e-quality--docs)  
17. [Priority backlog (P0–P3)](#17-priority-backlog-p0p3)  
18. [Implementation waves & estimates](#18-implementation-waves--estimates)  
19. [Implementation file index](#19-implementation-file-index)  
21. [Console & engine integration gaps](#21-console--engine-integration-gaps)  
22. [Service areas, zones & geofencing](#22-service-areas-zones--geofencing)  
23. [Ember `*-actions` services — full matrix](#23-ember--actions-services--full-matrix)  
24. [Navigator / consumable API (out of scope)](#24-navigator--consumable-api-out-of-scope)  
25. [Order form & create flow gaps](#25-order-form--create-flow-gaps)  
26. [UX shell, i18n & technical debt](#26-ux-shell-i18n--technical-debt)  
27. [Master gap register (complete checklist)](#27-master-gap-register-complete-checklist)  
28. [Complete React gaps by module (checklist)](#28-complete-react-gaps-by-module-checklist)  
29. [Ember sub-route parity matrix](#29-ember-sub-route-parity-matrix)  
30. [All 68 Ember modals — React status](#30-all-68-ember-modals--react-status)  
31. [API & UI wiring matrix (full)](#31-api--ui-wiring-matrix-full)  
32. [Roles & permissions QA matrix](#32-roles--permissions-qa-matrix)  
33. [Out-of-repo scope (Navigator, portals, other engines)](#33-out-of-repo-scope-navigator-portals-other-engines)  
34. [Ember ↔ React path aliases](#34-ember--react-path-aliases)  
35. [Backend API gaps (not in React UI)](#35-backend-api-gaps-not-in-react-ui)  
36. [Backend domains with no Ember console route](#36-backend-domains-with-no-ember-console-route)  
37. [All 55 Ember services — parity checklist](#37-all-55-ember-services--parity-checklist)  
38. [All 33 extension registry keys](#38-all-33-extension-registry-keys)  
39. [Road to 100% parity (from ~48%)](#39-road-to-100-parity-from-48)  
40. [Document completeness statement](#40-document-completeness-statement)  
20. [Production readiness statement](#20-production-readiness-statement)  

---

## 1. Executive summary

The React FleetOps console (`frontend/`) is a **dispatcher-first rebuild** progressing into **full product surface coverage** — most Ember domains now have routed pages; depth vs Ember still varies widely.

| Statement | Fact |
|-----------|------|
| **Daily dispatch workflows** | **~82–85%** complete — viable for production on order operations |
| **27 product modules — routes wired** | **~100%** (27/27; `/fleet-ops/management/customers` added) |
| **Ember route surface in React** | **~30–35%** (~58+ React fleet-ops routes vs ~188 Ember route modules) |
| **Weighted functional parity (vs Ember)** | **~75%** of full FleetOps product (Phases 1–3 complete; was ~65%) |
| **Achievable near-full parity** | **~82–85%** in **~8–12 months** remaining (~48–64 engineer-weeks from current baseline) |
| **NOT achievable in 3 days** | Full product; 3 days = dispatcher hardening only |

**Strongest React areas:** orders hub (list, bulk, kanban, map, drawer, workflow, assign, label, route save, comments, import/export, intelligence, realtime), order config manager, core CRUD for drivers/vehicles/places/fleets, SaaS foundations, **shared `FleetopsCrudListPage` scaffold** across management/connectivity/maintenance.

**Still shallow vs Ember (pages exist, parity incomplete):** enterprise orders grid/filters, extension virtual tabs, vehicle device/WO tabs, geofence draw, payments/avatars/notifications FleetOps settings, orchestrator advanced engine rules, **Navigator mobile app** (`fleet_mobile-main`), customer/contact portals.

**Out of scope for this doc (separate engines in same app):** IAM UI (`/iam/*`), Storefront (`/storefront/*`), Ledger (`/ledger/*`) — shipped in `frontend/src/App.jsx` but not counted in FleetOps %.

**Audit note (v3.1):** v3.0 covered UI modules (§28–30). v3.1 adds **backend API gaps** (§35), **Ember services** (§37), **extension registries** (§38), **path aliases** (§34), and **domains without React routes** (§36) so this file is the **single checklist for 100% FleetOps console parity**.

### 1.1 Does this document cover all gaps?

| Layer | Covered in this doc | Section |
|-------|---------------------|---------|
| Ember routes & sub-routes (~182 definitions) | ✅ | §3, §29, §34 |
| 27 product modules (UI features) | ✅ | §5–§10, §28 |
| 68 Ember modals | ✅ | §30 |
| 55 Ember services | ✅ | §13, §23, §37 |
| 33 extension registry keys | ✅ | §21, §38 |
| `fleetopsService` + UI wiring | ✅ | §12, §31, §35 |
| Backend-only resources (warranties, manifests, …) | ✅ | §36, §35 |
| Roles & permissions | ✅ | §32 |
| Navigator / portals (separate apps) | ✅ boundary | §24, §33 |
| IAM / Storefront / Ledger engines | ✅ boundary | §33 |
| E2E / waves / G-IDs | ✅ | §16–§18, §27 |
| **100% remaining work summary** | ✅ | §39 (summary) · [FLEETOPS-IMPLEMENTATION-PHASES.md](./FLEETOPS-IMPLEMENTATION-PHASES.md) (execution) |

**Honest limit:** Ember has **188 templates** and **125 controllers** — this doc tracks **capabilities and routes**, not every `.hbs` line. For line-by-line template parity, use §29 + §28 + spot-check `packages/fleetops/addon/templates/**`.

### 1.2 Parity vs Ember (what the % means)

| Term | Meaning |
|------|---------|
| **Original Ember FleetOps** | `packages/fleetops` + `console` mount — the reference product |
| **Full FleetOps** | 100% functional match to Ember (not a different product) |
| **This React frontend** | Rebuild in progress; **~75%** weighted toward that bar (Phases 1–3 done) |

---

## 2. Parity scores

### 2.1 By domain

| Domain | Coverage % | Severity | Notes |
|--------|------------|----------|-------|
| **Orders / dispatcher** | 82–85 | Low–Med | See §5.1 |
| **Order config** | 75 | Medium | Advanced flow logic |
| **Scheduler** | 70 | Medium | `SchedulePlanner` shifts + fleet schedule tab |
| **Routes / VRP** | 75 | Medium | List/new/detail + optimize wizard |
| **Orchestrator** | 75 | Medium | Preview/commit + import modal |
| **Service rates** | 50 | Medium | List + form routes ✅ |
| **Fleets** | 72 | Medium | Assign/remove drivers & vehicles |
| **Drivers** | 78 | Medium | Assign-order modal, schedule/HOS APIs |
| **Vehicles** | 72 | Medium | Devices + work-orders tabs |
| **Places** | 68 | Medium | Comments/documents/rules tabs |
| **Vendors** | 65 | Medium | CRUD + personnel panel |
| **Contacts** | 65 | Medium | CRUD + customer linking |
| **Customers** (FleetOps nested) | 70 | Medium | `/fleet-ops/management/customers` + reset-credentials |
| **Fuel reports** | 55 | Low | CRUD + vehicle/driver fields |
| **Issues** | 45 | Low | CRUD scaffold |
| **Connectivity (all)** | 42 | High (enterprise) | All sub-routes wired; Ember-depth TBD |
| **Maintenance (all)** | 42 | High (enterprise) | All sub-routes wired; vehicle WO links ❌ |
| **Analytics** | 38 | Medium | Reports list/detail ✅; builder/run partial |
| **FleetOps settings** | 45 | Medium | `/fleet-ops/settings/*` (4 sections); payments/avatars ❌ |
| **Permissions** | 50 | High | `useFleetopsPermission` on CRUD; orders audit **P1** |
| **Extensions** | 10 | Medium | Driver registry only |
| **Maps (full stack)** | 32 | High | `ServiceAreaMapEditor` partial |
| **Realtime** | 70 | Medium | |
| **SaaS / tenant** | 45 | Medium | Local + UI; API persist partial |
| **Service areas & zones** | 40 | Medium | List/detail/map editor 🟡 |
| **Console engine integration** | 32 | Low | `TrackOrderLookup` ✅; widgets partial |

**Weighted average (domains above):** **~65%** (Phases 1–2 +14%; dispatch/planning slice **~88%**).

### 2.2 Weighted trajectory (program)

| Milestone | Weighted parity |
|-----------|-----------------|
| **Today (Phases 1–2 done)** | **~65%** |
| **Phase 1 only** | ~55% |
| **Pre–Phase 1 (v2.3)** | ~48% |
| After Wave A (dispatcher closure) | ~55% |
| After Wave B (planning/orch depth) | ~62% |
| After Wave C (management Ember parity) | ~68% |
| After Wave D (connectivity/maint depth) | ~74% |
| After Wave E (analytics/settings depth) | ~78% |
| After Wave F (hardening) | ~82–85% |

---

## 3. Complete route catalog (Ember → React)

Ember mount: `/fleet-ops`. React uses `/fleet-ops/operations/*` and `/fleet-ops/management/*` (not `/manage`).

### 3.1 Operations

| Ember route | React route / page | Status |
|-------------|-------------------|--------|
| `operations/orders` (index) | `/fleet-ops/operations/orders` → `OrdersList.jsx` | 🟡 |
| `operations/orders/new` | `/fleet-ops/operations/orders/new` → `OrderNew.jsx` | ✅ |
| `operations/orders/:id` | Drawer `?order=` + `/:id` redirect | 🟡 |
| `operations/orders/:id/:slug` (virtual) | — | ❌ |
| `operations/order-config` | `/fleet-ops/operations/order-config` → `OrderConfigManager.jsx` | 🟡 |
| `operations/service-rates/*` | `/fleet-ops/operations/service-rates` → `ServiceRatesList.jsx`, `ServiceRateForm.jsx` | 🟡 |
| `operations/orchestrator` | `/fleet-ops/operations/orchestrator` → `Orchestrator.jsx` | 🟡 |
| `operations/scheduler` | `/fleet-ops/operations/schedule` → `SchedulePlanner.jsx` | 🟡 |
| `operations/scheduler/fleet-schedule` | — | ❌ |
| `operations/routes/*` | `/fleet-ops/operations/routes` → `RoutesList.jsx` (legacy `/routing` redirects) | 🟡 |
| `operations/routes/new` | `/fleet-ops/operations/routes/new` → `RouteNew.jsx` | 🟡 |

### 3.2 Management (`/manage` → React `/management`)

| Ember route | React | Status |
|-------------|-------|--------|
| `management/fleets/*` | `FleetsList`, `FleetDetail` | 🟡 |
| `management/drivers/*` | `DriversList`, `DriverDetail` | 🟡 |
| `management/vehicles/*` | `VehiclesList`, `VehicleDetail` | 🟡 |
| `management/places/*` | `PlacesList`, `PlaceDetail` | 🟡 |
| `management/vendors/*` | `VendorsList`, `VendorDetail` (`FleetopsCrudListPage`) | 🟡 |
| `management/vendors/integrated/*` | `IntegratedVendorsList`, `IntegratedVendorDetail` | 🟡 |
| `management/contacts/*` | `ContactsList`, `ContactDetail` | 🟡 |
| `management/contacts/customers/*` | — (config in `crudEntities.js` only) | ❌ |
| `management/fuel-reports/*` | `FuelReportsList`, `FuelReportDetail` | 🟡 |
| `management/issues/*` | `IssuesList`, `IssueDetail` | 🟡 |

### 3.3 Connectivity

| Ember route | React | Status |
|-------------|-------|--------|
| `connectivity/telematics/*` | `TelematicsList`, `TelematicDetail` | 🟡 |
| `connectivity/devices/*` | `DevicesList`, `DeviceDetail` | 🟡 |
| `connectivity/sensors/*` | `SensorsList`, `SensorDetail` | 🟡 |
| `connectivity/events/*` | `DeviceEventsList`, `DeviceEventDetail` | 🟡 |
| `connectivity/tracking` | `FleetTrackingHub` | 🟡 |

### 3.4 Maintenance

| Ember route | React | Status |
|-------------|-------|--------|
| `maintenance/schedules/*` | `/fleet-ops/maintenance/schedules` → `MaintenanceSchedulesList`, `MaintenanceScheduleDetail` | 🟡 |
| `maintenance/maintenances/*` | `/fleet-ops/maintenance/records` → `MaintenancesList`, `MaintenanceDetail` | 🟡 |
| `maintenance/work-orders/*` | `WorkOrdersList`, `WorkOrderDetail` | 🟡 |
| `maintenance/equipment/*` | `EquipmentList`, `EquipmentDetail` | 🟡 |
| `maintenance/parts/*` | `PartsList`, `PartDetail` | 🟡 |

### 3.5 Analytics

| Ember route | React | Status |
|-------------|-------|--------|
| `analytics/reports/*` (+ `result`) | `ReportsList`, `ReportDetail` | 🟡 |

### 3.6 FleetOps settings

| Ember route | React | Status |
|-------------|-------|--------|
| `settings/navigator-app` | `/fleet-ops/settings/navigator` → `NavigatorSettingsPage` | 🟡 |
| `settings/notifications` | Console `/settings` tab (not FleetOps mount) | 🟡 |
| `settings/custom-fields` | `/fleet-ops/custom-fields` → `CustomFieldsList`, `CustomFieldDetail` | 🟡 |
| `settings/avatars` | — | ❌ |
| `settings/routing` | `/fleet-ops/settings/routing` → `RoutingSettingsPage` | 🟡 |
| `settings/orchestrator` | `/fleet-ops/settings/orchestrator` → `OrchestratorSettingsPage` | 🟡 |
| `settings/scheduling` | `/fleet-ops/settings/scheduling` → `SchedulingSettingsPage` | 🟡 |
| `settings/payments/*` | — | ❌ |

### 3.8 React-only / extra routes (not in Ember mount tree)

| React route | Page | Status |
|-------------|------|--------|
| `/fleet-ops/service-areas/*` | `ServiceAreasList`, `ServiceAreaDetail`, `ServiceAreaMapEditor` | 🟡 |
| `/fleet-ops/tracking/lookup` | `TrackOrderLookup` | 🟡 |
| `/fleet-ops/operations/routing` | Redirect → `/operations/routes` | ➕ alias |

### 3.7 Virtual / extension routes

| Pattern | Ember | React |
|---------|-------|-------|
| `virtual/:slug` (operations, management) | ✅ | ❌ (registry stub for driver only) |

---

## 4. React implementation inventory

### 4.1 Pages (`frontend/src/pages/fleetops/`)

**Count:** ~58 page modules under `fleetops/` (v2.3 audit).

| Area | Files | Purpose |
|------|-------|---------|
| **Operations** | `OrdersList`, `OrderDetail`, `OrderNew`, `OrderConfigManager`, `SchedulePlanner`, `Orchestrator`, `ServiceRatesList`, `ServiceRateForm`, `routes/RoutesList`, `RouteNew`, `RouteDetail`, `RoutingOptimization.jsx` (legacy map preview) | Dispatch + planning surface |
| **Management** | `Drivers*`, `Vehicles*`, `Places*`, `Fleets*`, `management/Vendors*`, `IntegratedVendors*`, `Contacts*`, `FuelReports*`, `Issues*` | Core entities + CRUD scaffold |
| **Connectivity** | `connectivity/Telematics*`, `Devices*`, `Sensors*`, `DeviceEvents*`, `FleetTrackingHub` | IoT / tracking scaffold |
| **Maintenance** | `maintenance/*Schedules*`, `*Maintenances*`, `WorkOrders*`, `Equipment*`, `Parts*` | Maintenance scaffold |
| **Geo / platform** | `service-areas/*`, `custom-fields/*`, `tracking/TrackOrderLookup` | Service areas, custom fields, public track |
| **Analytics** | `analytics/ReportsList`, `ReportDetail` | Reports scaffold |
| **Settings** | `settings/FleetopsSettingsLayout`, `NavigatorSettingsPage`, `RoutingSettingsPage`, `OrchestratorSettingsPage`, `SchedulingSettingsPage` | FleetOps admin settings |

**Shared scaffold:** `components/fleetops/crud/FleetopsCrudListPage.jsx` + `lib/fleetops/crudEntities.js` + `lib/fleetops/crudApi.js` — powers most management/connectivity/maintenance list pages.

### 4.2 Console routes outside fleet-ops folder

| Route | Page | Relation |
|-------|------|----------|
| `/onboarding` | `FleetOpsOnboarding.jsx` | ➕ SaaS |
| `/admin/health` | `PlatformHealth.jsx` | ➕ Ops |
| `/settings` | `Settings.jsx` | Partial org/branding |

### 4.3 Key components (non-exhaustive)

| Area | Path |
|------|------|
| Bulk toolbar | `components/fleetops/orders/bulk/OrdersBulkToolbar.jsx` |
| Assign driver | `components/fleetops/orders/modals/AssignDriverDialog.jsx` |
| Label PDF | `components/fleetops/orders/OrderLabelDialog.jsx` |
| Route editor | `components/fleetops/orders/detail/panels/OrderRouteEditor.jsx` |
| Workflow | `components/fleetops/orders/detail/workflow/OrderWorkflowPanel.jsx` |
| Intelligence | `components/fleetops/intelligence/*` |
| Order config UI | `components/fleetops/order-config/*` |
| Detail drawers | `components/fleetops/detail/*` |

---

## 5. Operations — gaps

### 5.1 Orders

#### 5.1.1 List (`OrdersList.jsx`)

| Capability | Ember / LLR | React | Gap |
|------------|-------------|-------|-----|
| Table view | 18 columns, server sort/filter | ~7 columns, client-side | ❌ **P2** |
| Kanban | DnD + config filter | DnD + `useOrderStatuses` | 🟡 config filter **P2** |
| Map view | List overlay, multi-select, fleet group | Markers + drawers | 🟡 overlay **P2** |
| URL `?layout=&status=` | ✅ | ❌ | ❌ **P2** |
| Server pagination / filters | ✅ | ❌ | ❌ **P0** scale |
| Bulk dispatch/cancel/assign/delete | ✅ | ✅ | ✅ |
| Import / export | ✅ | ✅ `OrderImportDialog` | 🟡 orchestrator-import **P1** |
| Spreadsheet import on **new order** page | ✅ | ❌ | ❌ **P2** |
| Bulk / advanced query (`bulk_query`) | ✅ | ❌ | ❌ **P2** |
| Filter `without_driver` | ✅ | ❌ | ❌ **P1** |
| Create order | ✅ | ✅ | ✅ |
| Refresh | ✅ | ✅ | ✅ |
| Company realtime | ✅ | ✅ `useFleetopsRealtimeChannel` | ✅ |
| Optimize routes from selection | ✅ | ❌ | ❌ **P1** |
| Permissions on actions | ✅ | 🟡 `useFleetopsAbility` | 🟡 **P1** systematic |
| Operational intelligence | — | ➕ strip, risks, suggestions | ➕ |
| Keyboard shortcuts | — | ➕ | ➕ |
| Demo mode | — | ➕ | ➕ |

**LLR table columns not in React (18-col spec):** internal_id, payload, vehicle_assigned, facilitator, scheduled_at, items, transaction, tracking, type, created_by, updated_by (partially covered by fewer columns).

#### 5.1.2 Detail (`OrderDetail.jsx`)

| Tab / feature | Ember | React | Gap |
|---------------|-------|-------|-----|
| Overview + map | ✅ | ✅ | 🟡 live route polyline on open |
| Workflow (dispatch/start/advance/complete/cancel) | ✅ | ✅ | ✅ |
| Assign / unassign driver (header) | ✅ | ✅ `AssignDriverDialog` | ✅ |
| View label | ✅ | ✅ `OrderLabelDialog` | ✅ |
| Edit order | ✅ | ✅ modal + portal | ✅ |
| Communication (compose) | ✅ | ✅ `OrderCommunicationTab` | ✅ |
| Route intelligence + save | ✅ | 🟡 `OrderRouteEditor` | 🟡 reorder, optimize **P1** |
| Live tracking | ✅ | ✅ | ✅ |
| Activity timeline | ✅ | ✅ + socket | ✅ |
| Proofs upload | ✅ | ✅ | 🟡 field capture-* not in console |
| Payload / waypoints edit | ✅ | 🟡 read-mostly | ❌ **P2** |
| Metadata edit | ✅ modals | 🟡 read-only tab | ❌ **P2** |
| Notes edit | ✅ | 🟡 read-only tab | ❌ **P2** |
| Financials | ✅ | 🟡 read-only | 🟡 |
| Purchase rate | ✅ | 🟡 read-only | 🟡 |
| Integrated vendor | ✅ | 🟡 read-only | 🟡 |
| Custom fields | ✅ manager | 🟡 read-only | ❌ **P2** |
| Audit / webhooks | ✅ | 🟡 tab | 🟡 |
| Delete order UI | ✅ | ❌ service only | ❌ **P3** |
| Extension tabs `/:slug` | ✅ | ❌ | ❌ **P2** |
| Schedule order | ✅ | 🟡 `OrderScheduleDialog` | 🟡 bulk schedule **P1** |
| Realtime | ✅ | ✅ drawer; 🟡 full page | 🟡 **P3** |

#### 5.1.3 Order lifecycle phases (gap vs LLR)

| Phase | Backend | React UI | Gap |
|-------|---------|----------|-----|
| Create | ✅ | ✅ | — |
| Schedule only | ✅ | ❌ | ❌ **P1** |
| Assign driver | ✅ | ✅ | — |
| Dispatch | ✅ | ✅ | — |
| Start | ✅ | ✅ | — |
| Advance activity | ✅ | ✅ | — |
| POD / proofs | ✅ field | 🟡 console upload | expected |
| Complete | ✅ | ✅ | — |
| Cancel | ✅ | ✅ | — |
| Route edit | ✅ | 🟡 | 🟡 **P1** |
| Import/export | ✅ | ✅ | 🟡 orchestrator import |

### 5.2 Order configuration

| Feature | Ember | React | Gap |
|---------|-------|-------|-----|
| List / CRUD | ✅ | ✅ | — |
| Duplicate | ✅ | ✅ | — |
| Workflow builder | ✅ full | 🟡 `OrderConfigWorkflowBuilder` | ❌ conditional logic, events **P2** |
| Feature gating (SaaS) | — | ➕ Starter blocks manager | ➕ |

### 5.3 Scheduler

| Feature | Ember | React | Gap |
|---------|-------|-------|-----|
| Driver shifts | ✅ | 🟡 `SchedulePlanner` + `ShiftForm` | 🟡 |
| Fleet schedule route | ✅ | ❌ | ❌ **P1** |
| Bulk schedule orders | ✅ | ❌ | ❌ **P1** |
| Best-fit assign | ✅ | ❌ | ❌ **P1** |
| Scheduling conflict modal | ✅ | 🟡 local detect only | ❌ **P2** |
| Order detail schedule action | ✅ | ❌ | ❌ **P1** |

### 5.4 Routes & routing optimization

| Feature | Ember | React | Gap |
|---------|-------|-------|-----|
| Routes list | ✅ | ✅ `RoutesList.jsx` | 🟡 Ember columns/actions |
| Route new (VRP builder) | ✅ | 🟡 `RouteNew.jsx` | ❌ **P0** VRP builder depth |
| Route details | ✅ | 🟡 `RouteDetail.jsx` | 🟡 **P1** |
| OSRM / VROOM optimize | ✅ | ❌ | ❌ **P0** |
| Save optimized routes | ✅ | 🟡 API-dependent | ❌ **P0** |
| `RoutingOptimization.jsx` | — | 🟡 legacy preview | redirect to `/routes`; not parity |

### 5.5 Orchestrator

| Feature | Ember | React | Gap |
|---------|-------|-------|-----|
| Orchestrator page | ✅ | ✅ `Orchestrator.jsx` | 🟡 minimal UI |
| Engine run/preview/commit | ✅ | 🟡 `runOrchestratorPreview` / `Commit` | 🟡 **P1** |
| `orchestrator-import` modal | ✅ | ❌ | ❌ **P1** |
| `orchestrator_priority` on order | ✅ | ✅ `OrderForm` | — |

### 5.6 Service rates

| Feature | Ember | React | Gap |
|---------|-------|-------|-----|
| Service rates CRUD | ✅ | 🟡 `ServiceRatesList`, `ServiceRateForm` | 🟡 import/zone matrix **P2** |
| Link to orders / quotes | ✅ | 🟡 form lookup | 🟡 |

---

## 6. Management — gaps

### 6.1 Summary

| Entity | List+create+edit | Drawer/detail | Ember tab % | Service API |
|--------|----------------|---------------|-------------|-------------|
| **Drivers** | ✅ | ✅ 8 tabs | ~60% | ✅ CRUD |
| **Vehicles** | ✅ | ✅ ~5 tabs | ~40% | ✅ CRUD |
| **Places** | ✅ | ✅ 4 tabs | ~35% | ✅ CRUD |
| **Fleets** | ✅ | ✅ | ~50% | ✅ CRUD |
| **Vendors** | 🟡 CRUD scaffold | 🟡 detail | ~45% | `crudApi` + permissions |
| **Integrated vendors** | 🟡 CRUD scaffold | 🟡 detail | ~40% | |
| **Contacts** | 🟡 CRUD scaffold | 🟡 detail | ~45% | |
| **Customers** (nested) | ❌ route | ❌ | ~25% | entity config only |
| **Fuel reports** | 🟡 CRUD scaffold | 🟡 detail | ~45% | |
| **Issues** | 🟡 CRUD scaffold | 🟡 detail | ~45% | |
| **Service areas** | 🟡 list + map editor | 🟡 detail | ~40% | `ServiceAreaMapEditor` |
| **Zones** (within service areas) | 🟡 partial | 🟡 | ~35% | zone CRUD in editor TBD |

### 6.2 Driver detail tabs

| Ember tab | React | Status |
|-----------|-------|--------|
| index | overview | ✅ |
| positions | positions (Live Map) | ✅ |
| schedule | schedule | 🟡 |
| virtual | `getExtensionTabs('driver')` | 🟡 |
| — | orders, compliance, documents, activity, financials | ➕ extra |

### 6.3 Vehicle detail tabs

| Ember tab | React | Status |
|-----------|-------|--------|
| positions | map on info | 🟡 |
| devices | — | ❌ |
| equipment | — | ❌ |
| schedules | — | ❌ |
| work-orders | — | ❌ |
| maintenance-history | stub section | 🟡 |

### 6.4 Place detail tabs

| Ember tab | React | Status |
|-----------|-------|--------|
| map | overview map | ✅ |
| activity | activity | ✅ |
| operations | — | ❌ |
| performance | — | ❌ |
| comments | — | ❌ |
| documents | — | ❌ |
| rules | — | ❌ |

### 6.5 Fleet detail

| Ember | React | Gap |
|-------|-------|-----|
| vehicles, drivers sub-routes | tabs in drawer | 🟡 |
| virtual extensions | — | ❌ |

### 6.6 Management — Ember modals not in React

| Ember modal / action | React | Gap |
|----------------------|-------|-----|
| `driver-assign-order` | — | ❌ assign from driver detail |
| `driver-assign-vendor` | — | ❌ |
| `driver-assign-vehicle` | — | ❌ partial via edit form |
| `place-assign-vendor` | — | ❌ |
| `set-driver-availability` | — | ❌ |
| `reset-customer-credentials` | — | ❌ |
| `confirm-service-quote-purchase` | — | ❌ |

---

## 7. Connectivity — gaps

**Coverage: ~42%** — all sub-routes wired; depth via `FleetopsCrudListPage` + dedicated tracking hub.

| Submodule | Ember capabilities | React (v2.3) | Gap |
|-----------|-------------------|----------------|-----|
| **Telematics** | CRUD; details: devices, sensors, events | List/detail scaffold | 🟡 nested relations **P2** |
| **Devices** | CRUD; events; virtual tabs | List/detail scaffold | 🟡 virtual tabs **P2** |
| **Sensors** | CRUD; virtual tabs | List/detail scaffold | 🟡 |
| **Events** | Event details | `DeviceEventsList` (read-only config) | 🟡 |
| **Tracking** | Fleet live map hub | `FleetTrackingHub` | 🟡 filters/aggregation **P2** |

**Remaining:** device attach to vehicle tab, high-frequency position stream UX, telematic provider wizards.

**Severity:** High for IoT customers until depth matches Ember; routes no longer blocked.

---

## 8. Maintenance — gaps

**Coverage: ~42%** — all sub-routes wired.

| Submodule | Ember | React (v2.3) | Gap |
|-----------|-------|----------------|-----|
| **Schedules** | CRUD; WO on details | List/detail scaffold | 🟡 schedule → WO link **P2** |
| **Maintenances** | CRUD | List/detail scaffold | 🟡 |
| **Work orders** | CRUD | List/detail scaffold | 🟡 |
| **Equipment** | CRUD | List/detail scaffold | 🟡 |
| **Parts** | CRUD | List/detail scaffold | 🟡 |

**Remaining:** vehicle maintenance-history tab, parts inventory workflows, triggers UI.

**Severity:** High for fleet maintenance customers until Ember workflows restored.

---

## 9. Analytics — gaps

**Coverage: ~38%**

| Ember | React (v2.3) | Gap |
|-------|----------------|-----|
| Reports index, new, edit, details, **result** | `ReportsList`, `ReportDetail` | 🟡 builder/run/export **P2** |

**Remaining:** report definition builder, execute + result table, scheduled reports.

**Severity:** Medium (enterprise reporting).

---

## 10. FleetOps settings — gaps

**Coverage: ~45%** (`/fleet-ops/settings/*` + custom fields route)

| Ember `settings/*` | React | Gap |
|--------------------|-------|-----|
| navigator-app | `/fleet-ops/settings/navigator` | 🟡 deep link / branding **P2** |
| notifications | Console `/settings` (global) | 🟡 not FleetOps mount |
| custom-fields | `/fleet-ops/custom-fields` | 🟡 |
| avatars | — | ❌ |
| routing (OSRM/VROOM) | `/fleet-ops/settings/routing` | 🟡 engine keys **P1** |
| orchestrator | `/fleet-ops/settings/orchestrator` | 🟡 |
| scheduling | `/fleet-ops/settings/scheduling` | 🟡 |
| payments + onboard | — | ❌ |

---

## 11. Cross-cutting platform gaps

### 11.1 Permissions (Spatie `fleet-ops {action} {resource}`)

| Item | Ember | React | Gap |
|------|-------|-------|-----|
| Per-action `can` on UI | ✅ | 🟡 `useFleetopsAbility` | Not on all pages |
| Orders / bulk / config | 🟡 | 🟡 | **P1** audit |
| Drivers, vehicles, places | ✅ | 🟡 | **P1** |
| Fail-closed multi-tenant | N/A | 🟡 defaults allow if empty map | **P0** SaaS |
| IAM integration | console IAM | separate `/iam` | OK |

### 11.2 Extension registry

| Registry key | Ember | React |
|--------------|-------|-------|
| `fleet-ops:component:order:details` | ✅ | ❌ |
| `fleet-ops:component:order:form` | ✅ | ❌ |
| `fleet-ops:component:map:drawer` | ✅ | ❌ |
| Driver `virtual/:slug` | ✅ | 🟡 `detail/registry.js` |

### 11.3 Maps & geospatial

| Capability | Ember services | React | Gap |
|------------|----------------|-------|-----|
| Leaflet routing control | ✅ | 🟡 | **P1** |
| Draw / geofence / layers | ✅ | ❌ | **P2** |
| OSRM integration | ✅ | backend-dependent | **P2** |
| Map drawer / overlay | ✅ | 🟡 `MapView` | **P2** |
| Single map library standard | Leaflet | mixed | **P1** consolidate |

### 11.4 Realtime (SocketCluster)

| Channel / use | Ember | React | Gap |
|---------------|-------|-------|-----|
| `order.{id}` | ✅ | ✅ `useOrderRealtime` | — |
| Company orders | ✅ | ✅ | — |
| Driver positions (high freq) | ✅ | 🟡 list refresh | **P2** dedicated |
| Device events | ✅ | ❌ | **P2** |
| Reconnect / resubscribe | ✅ | ✅ manager | — |

### 11.5 SaaS / tenant (React console)

| Feature | Status | Gap |
|---------|--------|-----|
| Tenant branding (local) | ✅ `TenantContext` | Persist to org API **P2** |
| Onboarding wizard | ✅ | — |
| Demo mode | ✅ | — |
| Billing plans UI | ✅ mock | Stripe **future** |
| Platform health | ✅ | — |
| Org settings API | 🟡 | `/settings` 500 tolerant | backend **P1** |

---

## 12. API & `fleetopsService` matrix

> **v3.1:** Most CRUD resources use `attachGenericCrud()` in `services/fleetops.js` + `lib/fleetops/crudApi.js`. See **§31** (summary) and **§35** (full API ↔ UI matrix).

### 12.1 Orders & core entities (hand-written methods)

| Method | UI wired | Notes |
|--------|----------|-------|
| `listOrders` / `listOrdersPage` | 🟡 | `useOrdersListPage` — server page when API supports; client slice fallback |
| `scheduleOrder` | 🟡 | `OrderScheduleDialog` on `OrderDetail` |
| `optimizeOrderRoute` | 🟡 | service exists; limited UI |
| Order CRUD + lifecycle + bulk + route + label + import/export | ✅ | §5.1 |
| Order config CRUD + duplicate + default | ✅ | |
| Drivers, vehicles, places, fleets CRUD | ✅ | drawer detail |
| `assignOrderToDriver`, `assignVehicleToDriver`, `assignVendorToDriver` | 🟡 | API only; modals missing §6.6 |
| `attachDeviceToVehicle`, `listVehicleDevices`, `listVehicleWorkOrders` | 🟡 | API only; vehicle tabs missing |
| Routes `list/get/create` + `optimizeRoutes` | 🟡 | pages exist; VRP UX ❌ |
| Orchestrator `runOrchestratorPreview/Commit` | 🟡 | `Orchestrator.jsx` minimal |
| Service rates CRUD | 🟡 | list + form pages |
| Service areas + zones + geometry | 🟡 | list/detail/map editor partial |
| Settings `listSettingsSection` / `saveSettingsSection` | 🟡 | 4 FleetOps settings pages |
| Reports `list/get/run` | 🟡 | list/detail |
| `lookupTrackingOrder` | 🟡 | `TrackOrderLookup` |
| Custom fields CRUD | 🟡 | may use local day3 store fallback |

### 12.2 Generic CRUD entities (`attachGenericCrud`)

| Entity key | Service methods | UI (`FleetopsCrud*`) | Ember depth |
|------------|-----------------|----------------------|-------------|
| vendor, integratedVendor, contact, customer | list/get/create/update/delete | 🟡 list/detail | ❌ advanced |
| fuelReport, issue | same | 🟡 | ❌ |
| telematic, device, sensor, deviceEvent | same | 🟡 | ❌ nested tabs |
| maintenanceSchedule, maintenance, workOrder, equipment, part | same | 🟡 | ❌ cross-links |
| customField | same | 🟡 | ❌ |

### 12.3 Still missing or console N/A

| API / action | Priority | Notes |
|------------|----------|-------|
| Full VROOM multi-stop route builder UX | **P0** | `optimizeRoutes` exists |
| Orchestrator import file flow | **P1** | |
| Fleet schedule + bulk order schedule | **P1** | |
| Report builder / edit / scheduled reports | **P2** | |
| Payments onboard settings | **P2** | |
| Avatars settings | **P3** | |
| Capture signature/photo/qr on order | N/A | Navigator app §33 |
| `/fleet-ops/management/customers` route | **Done** | `App.jsx` + `CustomersList` / `CustomerDetail` |

---

## 13. Ember services & modals inventory

### 13.1 Ember services (55) — React equivalent

| Ember service | React equivalent | Status |
|---------------|------------------|--------|
| `order-actions` | `useOrderDetail` + `fleetopsService` + workflow | 🟡 |
| `order-config-actions` | `OrderConfigManager` + service | 🟡 |
| `order-socket-events` | `fleetopsRealtimeManager`, hooks | 🟡 |
| `order-import` | `OrderImportDialog` | 🟡 |
| `order-creation`, `order-validation` | `OrderCreateDialog`, zod | ✅ |
| `order-list-overlay` | — | ❌ |
| `scheduling`, `driver-scheduling` | `SchedulePlanner`, `schedules.js` | 🟡 |
| `orchestration-engine*` | — | ❌ |
| `route-optimization*` | stub page only | ❌ |
| `leaflet-map-manager`, `leaflet-routing-control`, etc. | `MapView` partial | 🟡 |
| `*-actions` (25 entity services) | per-entity list/detail | 🟡 4 only |
| All other entity `*-actions` | — | ❌ |

### 13.2 Ember modals (68) — React status

| Modal | React | Status |
|-------|-------|--------|
| `order-form` | `OrderForm` | ✅ |
| `order-assign-driver` | `AssignDriverDialog` | ✅ |
| `bulk-assign-driver` | `BulkAssignDriverDialog` | ✅ |
| `order-label` | `OrderLabelDialog` | ✅ |
| `order-import` | `OrderImportDialog` | 🟡 |
| `orchestrator-import` | — | ❌ |
| `order-route-form` | `OrderRouteEditor` (panel) | 🟡 |
| `update-order-activity` | `OrderWorkflowActions` confirm | ✅ |
| `new-order-config`, `clone-config-form` | `OrderConfigEditorDialog` | ✅ |
| `driver-form`, `vehicle-form`, `place-form`, `fleet-form` | respective `*Form.jsx` | ✅ |
| `driver-shift`, `add-driver-shift` | `ShiftForm` | 🟡 |
| `scheduling-conflict` | — | ❌ |
| `view-zone`, `service-area-form`, `view-service-area` | — | ❌ |
| `fuel-report-*`, `vendor-*`, `contact-*` | — | ❌ |
| `meta-field-*`, `new-custom-field-group` | — | ❌ |
| `map-layer-form`, `map-field-*` | — | ❌ |
| `send-work-order`, `install-prompt`, etc. | — | ❌ |
| *(remaining modals)* | — | ❌ |

Full Ember modal list: `assign-driver`, `attach-device`, `bulk-assign-orders`, `confirm-service-quote-purchase`, `contact-details`, `contact-form`, `driver-assign-order`, `driver-assign-vendor`, `driver-assign-vehicle`, `driver-details`, `edit-meta-form`, `entity-form`, `entity-meta-field-prompt`, `fleet-details`, `group-details`, `group-form`, `map-field-form`, `map-field-group-form`, `map-layer-form`, `meta-field-form`, `meta-field-group-form`, `option-prompt`, `place-assign-vendor`, `place-details`, `place-form`, `point-map`, `policy-form`, `reset-customer-credentials`, `role-form`, `select-payment-method`, `service-quote-purchase-form`, `set-driver-availability`, `uninstall-prompt`, `user-form`, `vehicle-details`, `zone-form`, …

---

## 14. Order lifecycle (condensed)

| Status / action | React support | Gap |
|-----------------|---------------|-----|
| Create order | ✅ `OrderNew` / `OrderForm` | |
| Schedule (no dispatch) | 🟡 `OrderScheduleDialog` + `scheduleOrder` | bulk schedule ❌ |
| Assign / unassign driver | ✅ | |
| Dispatch | ✅ | |
| Start → en route | ✅ | |
| Advance activity (workflow) | ✅ | |
| Complete | ✅ | |
| Cancel | ✅ | |
| Route edit / save | 🟡 `OrderRouteEditor` | optimize per-order 🟡 |
| Import / export | ✅ | orchestrator-import ❌ |
| Delete order | 🟡 API | no delete button **P3** |
| POD signature/photo/qr | ❌ console | Navigator §33 |
| Realtime `order.{id}` + company channel | ✅ | |

**Key permissions:** `fleet-ops view|list|create|update|dispatch|cancel|delete order`, `assign-driver-for order`, `update-route-for order`, `schedule order`.

**Optional deep-dive:** [FLEETOPS-ORDER-LIFECYCLE.md](./FLEETOPS-ORDER-LIFECYCLE.md) (diagrams, socket events, backend sequences).

---

## 15. React-only capabilities

| Capability | Location |
|------------|----------|
| Operational metrics strip | `OperationalMetricsStrip.jsx` |
| Delivery risk alerts | `RiskAlertsBar.jsx`, `evaluateDeliveryRisks.js` |
| Dispatcher suggestions | `DispatcherSuggestionsPanel.jsx` |
| Query cache / background refresh | `useFleetopsQueryCache.js` |
| Persisted UI preferences | `usePersistedState.js` |
| Orders list keyboard shortcuts | `useOrdersListShortcuts.js` |
| Tenant branding & prefs | `TenantContext`, `/settings` |
| Onboarding + checklist | `/onboarding`, `OnboardingChecklist.jsx` |
| Demo mode | `DemoModeContext.jsx` |
| Subscription feature gates | `FeatureGate`, `plans.js` |
| Platform health & error boundary | `/admin/health`, `PlatformErrorBoundary` |
| Drawer-first UX + z-index system | `FleetOpsFormDialog`, `lib/zIndex.js` |

---

## 16. E2E, quality & docs

| Issue | Detail | Priority |
|-------|--------|----------|
| TestId drift | `order-dispatch` vs workflow testids | P3 |
| Missing E2E | routes, orchestrator, service rates, extensions | per wave |
| No load test | Server pagination | P1 |
| Stale duplicate docs | Removed — this file is canonical | — |
| `npm run build` / `verify:release` | Required for release | P0 |

**Existing E2E:** `form-dropdowns`, `operational-intelligence`, lifecycle simulations, drawer edit, form modals, CRUD specs.

---

## 17. Priority backlog (P0–P3)

### P0 — Dispatcher / scale / security blockers

| Item | Why |
|------|-----|
| Server-side orders list + filters | Breaks at volume |
| Permissions fail-closed (SaaS) | Security |
| Routes module + VRP (for planning customers) | Cannot migrate planners |
| Orchestrator minimal UI | Product expectation |

### P1 — High operational value

| Item | Why |
|------|-----|
| Order schedule API + UI | Pickup windows |
| Fleet schedule + bulk schedule | Capacity |
| Orders → route builder navigation | Planning loop |
| Route tab live polyline | Situational awareness |
| Vendors + contacts | B2B networks |
| Systematic permissions all modules | Compliance |

### P2 — Enterprise parity

| Item | Why |
|------|-----|
| 18-column table + URL sync | Power users |
| Extension tabs on orders | Partners |
| Place comments/documents/rules | Facilities |
| Service rates admin | Revenue |
| Connectivity MVP | IoT tenants |
| Custom fields manager | Enterprise |
| Map draw / geofence | Advanced zones |

### P3 — Optional

| Item | Why |
|------|-----|
| Delete order UI | Rare admin |
| Fuel / issues | Niche |
| Full analytics builder | BI alternative |
| Field POD in console | Wrong app (Navigator) |
| TestId cleanup | DX |

---

## 18. Implementation waves & estimates

**Canonical execution plan:** [FLEETOPS-IMPLEMENTATION-PHASES.md](./FLEETOPS-IMPLEMENTATION-PHASES.md) (Phases 1–8 ordered, Phase 9 field/portals).

**Assumption:** 4 FE + 2 BE + 1 QA · **Phases 1–8 total ~64–82 engineer-weeks · ~10–14 calendar months** (+52% parity from ~48% baseline).

| Phase | Name (was “wave”) | Effort | Parity Δ | Cumulative |
|-------|-------------------|--------|----------|------------|
| **1** | Dispatcher foundation | 6–8 wks | +7% | ~55% |
| **2** | Planning & orchestration | 14–18 wks | +10% | ~65% |
| **3** | Entity depth | 10–12 wks | +10% | ~75% |
| **4** | Enterprise modules depth | 16–20 wks | +8% | ~83% |
| **5** | Settings, geo & live | 12–16 wks | +5% | ~88% |
| **6** | Platform polish | 6–8 wks | +4% | ~92% |
| **7** | Backend-only areas | 4–6 wks | +3% | ~95% |
| **8** | QA & hardening | 6–8 wks | +5% | ~98–100% |
| **9** | Field & portals *(optional)* | 8–12+ wks | — | out of console % |

### 18.1 Timeline reality

| Goal | Realistic calendar |
|------|-------------------|
| Phase 1 only (dispatcher hardening) | **3–5 days** focused sprint — not full parity |
| Phases 1–2 (dispatch + planning) | **~4–5 months** |
| Phases 1–8 (console 100%) | **~10–14 months** |

---

## 19. Implementation file index

| Area | Primary files (current) |
|------|-------------------------|
| Routing | `src/App.jsx`, `layouts/FleetOpsModuleLayout.jsx` |
| Orders | `pages/fleetops/OrdersList.jsx`, `OrderDetail.jsx`, `hooks/fleetops/useOrdersListPage.js` |
| CRUD scaffold | `components/fleetops/crud/*`, `lib/fleetops/crudEntities.js`, `crudApi.js` |
| API | `services/fleetops.js` |
| Permissions | `hooks/fleetops/useFleetopsAbility.js`, `useFleetopsPermission.js` |
| Detail drawers | `domain/fleetops/detail/registry.js`, `components/fleetops/detail/*` |
| Maps | `components/common/MapView.jsx`, `service-areas/ServiceAreaMapEditor.jsx` |
| Realtime | `domain/fleetops/realtime/*` |
| Settings | `pages/fleetops/settings/*`, `contexts/fleetops/FleetopsSettingsContext.jsx` |
| E2E | `tests/e2e/fleetops/**` |

---

## 21. Console & engine integration gaps

Ember registers FleetOps into the **Fleetbase universe** (`packages/fleetops/addon/extension.js`). React is a standalone console with partial overlap.

| Integration | Ember | React | Gap |
|-------------|-------|-------|-----|
| Header engine menu “Fleet-Ops” | ✅ | 🟡 FleetOps via engine switcher in `Header` | OK |
| Header **shortcuts** (9 items: orders, places, drivers, vehicles, fleets, service rates, devices, reports, orchestrator) | ✅ | 🟡 Sidebar subset — **missing** shortcuts to service rates, devices, reports, orchestrator | ❌ **P1** nav |
| Dashboard widget `fleet-ops-key-metrics` | ✅ default widget | 🟡 `Dashboard.jsx` uses `OperationalMetricsStrip` (different component) | 🟡 **P2** parity |
| Admin panel “Navigator App” | ✅ | ❌ | ❌ |
| Auth **Track Order** link (`order-tracking-lookup`) | ✅ virtual route | 🟡 `/fleet-ops/tracking/lookup` | 🟡 not on auth screen **P2** |
| Customer portal engine hook | ✅ when extension installed | ❌ | ❌ **P3** |
| Extension registries (full list) | ✅ ~25 registry keys | 🟡 `detail/registry.js` only | ❌ **P2** |

**Ember registry keys without React equivalent:**

`fleet-ops:component:map:drawer`, `fleet-ops:component:vehicle:details`, `fleet-ops:component:driver:details`, `fleet-ops:component:order-config-manager` (partial — page exists), `contact/customer/driver/fleet/place/vehicle/vendor/issue/fuel-report/maintenance/work-order/equipment/part` **form** registries, `order:form:payload:entity` (+ form), `contextmenu:vehicle`, `contextmenu:driver`, `template:settings:routing`, `template:settings:orchestrator`.

---

## 22. Service areas, zones & geofencing

**Coverage: ~40%** — routes + API + partial map editor.

| Capability | Ember | React | Gap |
|------------|-------|-------|-----|
| Service area list / CRUD | ✅ | 🟡 `ServiceAreasList`, `ServiceAreaDetail` | 🟡 |
| Zone list / CRUD inside area | ✅ | 🟡 API + `ServiceAreaMapEditor` | 🟡 zone matrix **P2** |
| Map draw boundaries | ✅ Leaflet draw | 🟡 `ServiceAreaMapEditor` | 🟡 **P2** |
| View zone modal | ✅ `view-zone` | ❌ | ❌ |
| Assign service area to fleet | ✅ | 🟡 `FleetForm` | 🟡 |
| Geofence event sensors (IoT) | ✅ | ❌ | ❌ **P3** |

**API:** full service area + zone + geometry methods in `fleetopsService.js` (see §31).

---

## 23. Ember `*-actions` services — full matrix

From `a_uidocs/behavior/services/` and `packages/fleetops/addon/services/`.

| Ember `*-actions` / service | React coverage | Gap |
|----------------------------|----------------|-----|
| `order-actions` | 🟡 ~82% | §5.1 |
| `order-config-actions` | 🟡 ~75% | §5.2 |
| `order-socket-events` | 🟡 ~70% | §11.4 |
| `driver-actions` | 🟡 ~65% | §6 |
| `vehicle-actions` | 🟡 ~50% | §6 |
| `place-actions` | 🟡 ~40% | §6 |
| `fleet-actions` | 🟡 ~55% | §6 |
| `contact-actions` | 🟡 CRUD scaffold | §28 |
| `customer-actions` | 🟡 API; no FleetOps route | §28 |
| `vendor-actions` | 🟡 CRUD scaffold | §28 |
| `integrated-vendor-actions` | 🟡 CRUD + order tab read-only | §28 |
| `fuel-report-actions` | 🟡 CRUD scaffold | §28 |
| `issue-actions` | 🟡 CRUD scaffold | §28 |
| `service-rate-actions` | 🟡 list/form | §5.6 |
| `device-actions` | 🟡 CRUD scaffold | §28 |
| `device-event-actions` | 🟡 read-only list | §28 |
| `sensor-actions` | 🟡 CRUD scaffold | §28 |
| `telematic-actions` | 🟡 CRUD scaffold | §28 |
| `maintenance-actions` | 🟡 CRUD scaffold | §28 |
| `maintenance-schedule-actions` | 🟡 CRUD scaffold | §28 |
| `work-order-actions` | 🟡 CRUD scaffold | §28 |
| `equipment-actions` | 🟡 CRUD scaffold | §28 |
| `part-actions` | 🟡 CRUD scaffold | §28 |
| `report-actions` | 🟡 list/run partial | §28 |
| `service-area-actions` | 🟡 ~40% | §22 |
| `zone-actions` | 🟡 API + map partial | §22 |
| `entity-actions` (payload entities) | 🟡 read-only payload tab | ❌ edit |
| `resource-action` (base) | 🟡 per-entity CRUD pattern | — |
| `notifications` (fleetops) | 🟡 console `/notifications` | 🟡 not FleetOps-specific |
| `scheduling` / `driver-scheduling` | 🟡 shifts only | §5.3 |
| `orchestration-engine*` | ❌ | §5.5 |
| `route-optimization*` | ❌ stub | §5.4 |
| `leaflet-*` / `map-drawer` | 🟡 `MapView` | §11.3 |
| `global-search` | ✅ ember | 🟡 `CommandPalette` partial | 🟡 |
| `position-playback` | ✅ | ❌ | ❌ **P3** |
| `location` / `movement-tracker` | ✅ | 🟡 implicit in tracking | 🟡 |

---

## 24. Navigator / consumable API (out of scope)

These are **backend-supported** via `/v1/orders` (driver/field app). React console is **not** expected to implement them; document so they are not counted as “missing UI bugs.”

| Consumable action | Console React |
|-------------------|---------------|
| `POST {id}/start` (driver) | 🟡 dispatcher can start via workflow |
| `POST capture-signature/photo/qr` | ❌ Navigator |
| `POST {id}/track` GPS ingest | ❌ Navigator |
| Driver navigator UI | ❌ separate app |
| Customer track-order portal | ❌ §21 |

---

## 25. Order form & create flow gaps

`OrderForm.jsx` sections vs Ember `order/form` + LLR seven-section spec:

| Section / feature | React `OrderForm` | Gap |
|-------------------|-------------------|-----|
| Order type & schedule | ✅ | 🟡 schedule datetime fields partial |
| Customer & parties | ✅ | — |
| Route & stops | ✅ UUID places | 🟡 place picker UX vs Ember |
| Cargo / entities | ✅ basic | ❌ registry `order:form:payload:entity` sub-forms **P2** |
| Assignments | ✅ | — |
| Proof & time windows | ✅ | — |
| Notes | ✅ | — |
| Advanced (orchestrator priority, etc.) | ✅ | — |
| **Spreadsheet import** on create | Ember `order-import` on new | ❌ list import only **P2** |
| Custom fields on form | Ember registry | 🟡 limited **P2** |
| Service quote purchase | Ember modal | ❌ **P3** |

---

## 26. UX shell, i18n & technical debt

| Topic | Ember | React | Gap |
|-------|-------|-------|-----|
| Detail UX | Full-page routes | Drawer `?order=` / `?driver=` via `FleetOpsDetailHost` | 🟡 intentional; extension slugs missing |
| URL prefix | `/fleet-ops/manage/...` | `/fleet-ops/management/...` | 🟡 bookmark mismatch |
| i18n | `intl` keys throughout | Mostly English literals | ❌ **P3** i18n pass |
| Command palette | Universe search | 🟡 orders/drivers/vehicles/places/fleets | missing orch/rates/devices **P2** |
| `schedulesService` | Full schedule model | 🟡 `listSchedules` + `createScheduleItem`; planner uses items only | 🟡 **P2** |
| `useFleetopsPermission` | — | Legacy hook; use `useFleetopsAbility` | 🟡 consolidate **P3** |
| List optimistic / pending sync | ember-data | 🟡 `list-reconcile` on drivers/fleets | 🟡 **P3** |
| Domain cache | — | `fleetopsCache` + query cache | 🟡 invalidation rules **P3** |
| Z-index / modal stacking | ember-ui | ✅ `zIndex.js`, `FleetOpsFormDialog` | ➕ fixed |
| Compliance evaluation | partial | ➕ `evaluateCompliance` on driver/vehicle | ➕ |
| Health warnings on entities | partial | ➕ `useFleetopsWarnings` | ➕ |

---

## 27. Master gap register (complete checklist)

Use this table for audits. **Status:** Open = gap remains; Partial = shipped incomplete; Done = parity OK; N/A = out of scope.

| ID | Gap | Domain | Prio | Status |
|----|-----|--------|------|--------|
| G001 | Server-side orders pagination & filters | Orders | P0 | Done |
| G002 | `PATCH orders/schedule` + UI | Orders | P1 | Done |
| G003 | Permissions fail-closed SaaS | Platform | P0 | Done |
| G004 | Routes module (list/new/details) | Routes | P0 | Done |
| G005 | VROOM/OSRM optimize + save | Routes | P0 | Done |
| G006 | Orchestrator page | Orchestrator | P1 | Done |
| G007 | Orchestrator import modal | Orders | P1 | Done |
| G008 | Fleet schedule route | Scheduler | P1 | Done |
| G009 | Bulk schedule orders | Scheduler | P1 | Done |
| G010 | Best-fit driver assign | Scheduler | P1 | Done |
| G011 | Service rates CRUD UI | Operations | P2 | Partial |
| G012 | Vendors CRUD | Management | P2 | Done |
| G013 | Integrated vendors CRUD | Management | P2 | Done |
| G014 | Contacts CRUD | Management | P2 | Done |
| G015 | Customers nested CRUD | Management | P2 | Done |
| G016 | Fuel reports CRUD | Management | P3 | Done |
| G017 | Issues CRUD | Management | P3 | Done |
| G018 | Telematics module | Connectivity | P2 | Partial |
| G019 | Devices module | Connectivity | P2 | Partial |
| G020 | Sensors module | Connectivity | P2 | Partial |
| G021 | Device events | Connectivity | P2 | Partial |
| G022 | Fleet tracking hub | Connectivity | P2 | Partial |
| G023 | Maintenance schedules | Maintenance | P3 | Partial |
| G024 | Maintenances CRUD | Maintenance | P3 | Partial |
| G025 | Work orders CRUD | Maintenance | P3 | Partial |
| G026 | Equipment CRUD | Maintenance | P3 | Partial |
| G027 | Parts CRUD | Maintenance | P3 | Partial |
| G028 | Analytics reports + result | Analytics | P3 | Partial |
| G029 | FleetOps settings (7 routes) | Settings | P2 | Partial |
| G030 | Navigator app admin | Settings | P2 | Partial |
| G031 | Custom fields manager | Settings | P2 | Partial |
| G032 | Order extension virtual tabs | Orders | P2 | Open |
| G033 | 18-column orders table | Orders | P2 | Open |
| G034 | URL-synced list filters/layout | Orders | P2 | Open |
| G035 | Map list overlay + multi-select | Orders | P2 | Partial |
| G036 | Kanban filter by order-config type | Orders | P2 | Open |
| G037 | Optimize routes from selection | Orders | P1 | Done |
| G038 | Order payload waypoint edit | Orders | P2 | Done |
| G039 | Metadata edit modal | Orders | P2 | Done |
| G040 | Notes edit in place | Orders | P2 | Done |
| G041 | Delete order UI | Orders | P3 | Done |
| G042 | Live route polyline on detail open | Orders | P1 | Done |
| G043 | Route waypoint reorder | Orders | P1 | Done |
| G044 | Order config flow conditional logic | Config | P2 | Done |
| G045 | Service areas & zones admin | Geo | P2 | Partial |
| G046 | Geofence map draw | Geo | P2 | Open |
| G047 | Vehicle devices tab | Vehicles | P2 | Done |
| G048 | Vehicle work-orders tab | Vehicles | P2 | Done |
| G049 | Place comments/documents/rules | Places | P2 | Done |
| G050 | Driver assign-order modal | Drivers | P2 | Done |
| G051 | Dashboard Ember key-metrics widget | Console | P2 | Partial |
| G052 | Auth Track Order link | Console | P2 | Partial |
| G053 | Extension form registries (vendor, etc.) | Platform | P2 | Open |
| G054 | Spreadsheet import on order new | Orders | P2 | Done |
| G055 | Bulk query / without_driver filters | Orders | P1 | Done |
| G056 | Full-page order realtime | Orders | P3 | Done |
| G057 | i18n / localization | Platform | P3 | Open |
| G058 | E2E: routes, orch, rates | QA | P2 | Partial |
| G059 | Tenant branding API persist | SaaS | P2 | Partial |
| G060 | Navigator capture POD (signature/photo/qr) | Field | P1 | Open — **Day 4** Navigator app (not console) |
| G071 | Navigator driver mobile app (full) | Field | P1 | Open — Day 4 |
| G072 | Fleet-Ops Customer portal (full UI) | Portal | P1 | Open — Day 4 |
| G073 | Fleet-Ops Contact portal (full UI) | Portal | P2 | Open — Day 4 |
| G074 | 10 roles UI QA matrix | Platform | P1 | Open — Day 4 |
| G075 | Customer portal engine hook | Console | P2 | Open — Day 4 |
| G076 | Driver/customer invite & onboard | Console | P2 | Open — Day 4 |
| G077 | Position playback on map | Maps | P3 | Open — Day 4 |
| G078 | Map context menus (vehicle/driver) | Maps | P3 | Open — Day 4 |
| G079 | Warranties module (API + Ember components) | Backend | P3 | Open |
| G080 | Manifests + manifest-stops UI | Backend | P3 | Open |
| G081 | Payloads + entities admin (beyond order tab) | Backend | P2 | Open |
| G082 | Proofs resource admin | Orders | P3 | Open |
| G083 | Purchase rates UI | Operations | P3 | Open |
| G084 | Tracking numbers / statuses admin | Operations | P3 | Open |
| G085 | Vehicle-devices junction admin | Connectivity | P3 | Open |
| G086 | Service quotes + Stripe checkout | Operations | P2 | Open |
| G087 | Driver schedule-items / availabilities / HOS API | Drivers | P2 | Done |
| G088 | Fleet & vendor assign/remove driver/vehicle UI | Management | P2 | Done |
| G089 | Geofence events / inventory / dwell / history | Geo | P2 | Open |
| G090 | `fleet-ops/live/*` on tracking hub | Connectivity | P2 | Open |
| G091 | Telematics providers / discover / link-device | Connectivity | P2 | Open |
| G092 | Maintenance schedule pause/trigger/ical + line-items | Maintenance | P3 | Open |
| G093 | Work order send email | Maintenance | P3 | Open |
| G094 | Per-entity import/export/bulk-delete on CRUD lists | Platform | P2 | Open |
| G095 | Order allocation + order-list-overlay engines | Operations | P2 | Done |
| G096 | FleetOps settings API (notifications, entity-editing, metrics) | Settings | P2 | Open |
| G097 | Geocoder lookup + customer reset-credentials | Platform | P2 | Done |
| G061 | Bulk dispatch/cancel/assign/delete | Orders | — | Done |
| G062 | Assign/unassign driver header | Orders | — | Done |
| G063 | Label PDF | Orders | — | Done |
| G064 | Import/export list | Orders | — | Done |
| G065 | Order config manager | Config | — | Partial |
| G066 | Comments compose | Orders | — | Done |
| G067 | Kanban DnD → update activity | Orders | — | Done |
| G068 | Company + order realtime | Realtime | — | Done |
| G069 | Operational intelligence | Orders | — | Done (➕) |
| G070 | Demo mode / onboarding | SaaS | — | Done (➕) |

**Open gaps:** 31 · **Partial:** 27 · **Done:** 31 · **N/A:** 0 · **Total:** G001–G097 (Phases 1–2 closed G001–G010, G037–G044, G054–G056, G095)

**v3.1:** Use **§28** (modules) + **§35** (API) + **§37–§38** (services/registries) + **§39** (road to 100%); **§27** for prioritized G-IDs; **§29–§32** for routes/modals/wiring/roles.

*v2.3 register shift: 21 items moved Open → Partial where routes/scaffolds exist. v3.0 adds §28–§33. v3.1 adds G079–G097, §34–§40.*

---

## 20. Production readiness statement

### Ready today (with known limits)

- **Dispatcher + planning (~88%):** orders hub, VRP wizard, orchestrator, fleet schedule, route polylines, order config conditionals.
- **Order config admin** (conditional flow logic shipped Phase 2; advanced event hooks still shallow).
- **Driver / vehicle / place / fleet CRUD** with drawers.
- **SaaS** demo/onboarding/branding (local).
- **Module navigation:** all major FleetOps areas reachable in React (see §3).

### Usable but shallow — label “beta” for enterprise modules

- Vendors, contacts, fuel reports, issues (generic CRUD scaffold).
- Connectivity (telematics, devices, sensors, events, tracking hub).
- Maintenance (schedules, records, work orders, equipment, parts).
- Analytics reports list/detail.
- Service areas + custom fields (basic admin).
- FleetOps settings: navigator, routing, orchestrator, scheduling sections.
- Routes list/new/detail; orchestrator preview/commit/import; fleet schedule + driver shifts.
- **VROOM/OSRM** — server-side via orchestrator engines (requires routing settings / `VROOM_HOST`).

### Not ready — do not sell as included

- **FleetOps customers** nested route (`/fleet-ops/management/customers`)  
- **Payments / avatars** FleetOps settings  
- **Custom extension tabs** on orders (`virtual/:slug`)  
- **18-column** enterprise orders grid + full layout persistence **G033–G034**  
- **Geofence draw** / zone matrix parity  
- **Navigator mobile app** full parity (`fleet_mobile-main` — out of console scope)  
- **Customer / contact portals** (G071–G073)  
- **10 roles UI QA matrix** (G074)  
- Driver-place-vendor assignment modals (management — Phase 3)  

---

## 28. Complete React gaps by module (checklist)

**How to use:** Every line is a **missing or incomplete** item in `frontend/` vs Ember `@fleetbase/fleetops-engine`. ✅ = done in React. Items marked 🟡 = shipped shallow (scaffold / API only). **Track in §27** via G-ID where listed.

### 28.1 Operations — Orders (dispatcher)

- ❌ 18-column orders table (LLR spec); React ~7 columns **G033** *(Phase 6)*
- 🟡 URL-synced `?layout=` / `?status=` / filters **G034** — list query params wired; full layout persistence Phase 6
- ✅ Server pagination — `useOrdersListPage` + API meta **G001** *(Phase 1)*
- ❌ Map list overlay + multi-select + fleet grouping on list map **G035**
- ❌ Kanban filter by order-config type **G036**
- ✅ `bulk_query` advanced filter **G055** *(Phase 1)*
- ✅ `without_driver` filter — URL + API **G055** *(Phase 1)*
- ✅ Optimize routes from selected orders **G037** *(Phase 2)*
- ✅ Spreadsheet import on **new order** page **G054** *(Phase 1)*
- ✅ Orchestrator-import on orders **G007** *(Phase 2)*
- ❌ Order virtual extension tabs `orders/:id/:slug` **G032**
- ✅ Delete order button **G041** *(Phase 1)*
- ✅ Payload / waypoint inline edit **G038** *(Phase 1)*
- ✅ Metadata edit modal **G039** *(Phase 1)*
- ✅ Notes inline edit **G040** *(Phase 1)*
- ✅ Live route polyline on drawer open **G042** *(Phase 2)*
- ✅ Route waypoint drag-reorder **G043** *(Phase 2)*
- 🟡 Custom fields on order (read-only tab) **G031**
- ❌ Service quote purchase + confirm modals **§25**
- ❌ Order-new-activity modal
- ✅ Order-meta / edit-meta modals **G039** *(Phase 1)*
- ❌ Order-event modal
- ❌ Entity payload registry sub-forms (`order:form:payload:entity`) **G053**
- 🟡 Integrated vendor / financials tabs (read-only)
- 🟡 Permissions on every bulk action (audit all roles) **G074** — fail-closed gate **G003** done; full role matrix Phase 8

### 28.2 Operations — Order config

- ✅ Workflow conditional logic + event hooks **G044** *(Phase 2)*
- ❌ `order-config-new-status` modal parity
- 🟡 SaaS feature gate blocks (➕ intentional)

### 28.3 Operations — Scheduler

- ✅ Fleet schedule tab on `/operations/schedule` (`FleetScheduleView`) **G008** *(Phase 2)*
- ✅ Bulk schedule orders from fleet schedule **G009** *(Phase 2)*
- ✅ Best-fit driver assignment **G010** *(Phase 2)*
- ✅ `scheduling-conflict` modal (`SchedulingConflictDialog`) *(Phase 2)*
- 🟡 Driver shift week grid (`SchedulePlanner`, `ShiftForm`)
- 🟡 Order detail “schedule” quick action vs Ember calendar depth

### 28.4 Operations — Routes / VRP

- ✅ Routes list (`RoutesList.jsx`) — columns, row actions, pagination **G004** *(Phase 2)*
- ✅ Route new (`RouteNew.jsx`) — `RouteOptimizationWizard` **G004** *(Phase 2)*
- ✅ Route detail (`RouteDetail.jsx`) — polyline, stops, optimize **G004** *(Phase 2)*
- ✅ VRP via orchestrator `optimize_routes` (server OSRM/VROOM/greedy) **G005** *(Phase 2)*
- ✅ Save optimized routes → orders/drivers via wizard commit **G005**
- ✅ Orders → route builder from selection **G037** *(Phase 2)*
- 🟡 `RoutingOptimization.jsx` legacy — redirect only; remove or merge

### 28.5 Operations — Orchestrator

- ✅ Full orchestrator page (engines, pool, preview, commit) **G006** *(Phase 2)*
- 🟡 Full engine configuration UI (rules, constraints) — basic mode/engine selectors only
- ✅ `orchestrator-import` modal + orders bulk import **G007** *(Phase 2)*
- ✅ Orders list “run orchestrator” bulk flow **G007**

### 28.6 Operations — Service rates

- 🟡 List + create/edit form **G011**
- ❌ Rate matrix / zone linkage UI
- ❌ Import rates file
- ❌ Service quote flow tied to orders

### 28.7 Management — Fleets

- ✅ List + drawer detail
- ✅ Drivers/vehicles tabs with assign/remove (`FleetMembersPanel`) **G088**
- ❌ Fleet detail sub-routes `vehicles`, `drivers` as dedicated routes (tabs only)
- ❌ Fleet virtual extension tabs
- ❌ `fleet-details` modal parity (drawer vs modal)

### 28.8 Management — Drivers

- ✅ List + drawer (8 tabs incl. ➕ extras)
- ✅ `driver-assign-order` modal **G050**
- 🟡 `driver-assign-vendor` modal (basic UI)
- 🟡 `driver-assign-vehicle` (API + modal)
- ✅ `set-driver-availability` modal **G087**
- ✅ Schedule-items / availabilities / HOS from driver APIs **G087**
- ❌ Driver virtual extension tabs (registry hook exists, no Ember plugins)
- ❌ Notify driver action

### 28.9 Management — Vehicles

- ✅ List + drawer
- ✅ Tab: devices attach/detach **G047**
- ❌ Tab: equipment
- ❌ Tab: schedules
- ✅ Tab: work-orders **G048**
- 🟡 Tab: maintenance-history (stub)
- ❌ Tab: positions (dedicated route in Ember)
- ✅ `attach-device` inline picker **§30**
- ❌ Vehicle virtual extension tabs

### 28.10 Management — Places

- ✅ List + drawer
- 🟡 Tab: operations (via form geocode / meta)
- ❌ Tab: performance / frequency-map
- ✅ Tab: comments **G049**
- ✅ Tab: documents **G049**
- ✅ Tab: rules **G049**
- 🟡 `place-assign-vendor` modal (deferred — vendor link via meta)
- ❌ Place virtual extension tabs

### 28.11 Management — Vendors

- ✅ `FleetopsCrudListPage` list/detail + personnel panel **G012** **G088**
- 🟡 Vendor categories / types picker (form fields expanded)
- ❌ Subcontract / create-order-for vendor actions
- 🟡 `vendor-details` rich panel (personnel; integrated orders deferred)
- ❌ Extension form registries `vendor:form:*` **G053**

### 28.12 Management — Integrated vendors

- ✅ CRUD scaffold + providers panel **G013**
- ❌ Integrated vendor order flows
- 🟡 Webhook / credential admin (form fields)

### 28.13 Management — Contacts

- ✅ CRUD scaffold + customers panel **G014**
- ❌ Subcontract / create-order-for contact
- 🟡 Contact ↔ customer linking UI (read panel)

### 28.14 Management — Customers (FleetOps)

- ✅ Route `/fleet-ops/management/customers` in `App.jsx` **G015**
- ✅ `crudEntities.customer` + API via `attachGenericCrud`
- ✅ `reset-customer-credentials` modal **G097**
- 🟡 Nested under contacts in Ember (parity routing — standalone route OK)

### 28.15 Management — Fuel reports

- ✅ CRUD scaffold with vehicle/driver fields **G016**
- ❌ Export / import fuel data

### 28.16 Management — Issues

- ✅ CRUD scaffold **G017**
- ✅ `updateIssueStatus` API — status workflow UI on detail
- 🟡 Link issue ↔ vehicle/driver/order (form ID fields)

### 28.17 Connectivity — Telematics

- 🟡 List/detail scaffold **G018**
- ❌ Detail sub-tabs: devices, sensors, events (Ember nested routes)
- ❌ Telematic provider setup wizard

### 28.18 Connectivity — Devices

- 🟡 CRUD scaffold **G019**
- ❌ Events sub-route on device detail
- ❌ Virtual extension tabs on device
- ❌ Attach/detach vehicle flows in UI

### 28.19 Connectivity — Sensors

- 🟡 CRUD scaffold **G020**
- ❌ Sensor type / geofence configuration
- ❌ Virtual tabs

### 28.20 Connectivity — Device events

- 🟡 Read-only list/detail **G021**
- ❌ Event stream realtime
- ❌ Link to telematic/device graph

### 28.21 Connectivity — Tracking

- 🟡 `FleetTrackingHub` page **G022**
- ❌ Ember-grade fleet filter, clustering, replay
- ❌ High-frequency driver position layer **§11.4**
- ❌ Device event overlay

### 28.22 Maintenance — Schedules

- 🟡 CRUD scaffold **G023**
- ❌ Schedule → work-order sub-route
- ❌ Maintenance triggers UI

### 28.23 Maintenance — Maintenances (records)

- 🟡 CRUD scaffold **G024**
- ❌ Vehicle maintenance history integration

### 28.24 Maintenance — Work orders

- 🟡 CRUD scaffold **G025**
- ❌ `send-work-order` modal
- 🟡 Status updates API only

### 28.25 Maintenance — Equipment

- 🟡 CRUD scaffold **G026**
- ❌ Assign equipment ↔ vehicle

### 28.26 Maintenance — Parts

- 🟡 CRUD scaffold **G027**
- ❌ Inventory quantity workflows

### 28.27 Analytics — Reports

- 🟡 `ReportsList`, `ReportDetail` **G028**
- ❌ Report **new** / **edit** builder routes
- ❌ Report **result** sub-route (run + export table)
- ❌ Scheduled reports

### 28.28 Settings — FleetOps (`/fleet-ops/settings`)

- 🟡 Navigator **G030**
- 🟡 Routing (OSRM/VROOM keys) **G029**
- 🟡 Orchestrator settings
- 🟡 Scheduling settings
- ❌ Notifications (FleetOps mount; only global `/settings`) **G029**
- ❌ Avatars **G029**
- ❌ Payments + onboard **G029**
- ❌ Deep link / QR for Navigator app (Ember admin panel) **G030**

### 28.29 Platform — Service areas & custom fields

- 🟡 Service areas + map editor **G045**
- ❌ Zone form / view-zone modals
- 🟡 Custom fields admin **G031**
- ❌ Custom field groups
- ❌ Per-entity custom field render on all forms

### 28.30 Platform — Console integration

- ❌ Header shortcuts to rates, devices, reports, orchestrator **§21**
- 🟡 Track order (`TrackOrderLookup`) — not on auth login **G052**
- ❌ Admin Navigator app panel **G030**
- ❌ Customer portal engine hook **G075**
- ❌ Storefront order summary registry on order detail (Ember extension)
- 🟡 Dashboard widget parity **G051**

### 28.31 Cross-cutting (all modules)

- ❌ Extension registry parity (~25 keys) **G053**
- ❌ Map context menus (vehicle/driver) **G078**
- ❌ Position playback **G077**
- ❌ i18n — English literals **G057**
- ❌ Fail-closed permissions when ability map empty **G003**
- ❌ Leaflet draw / geofence layer stack **G046**
- 🟡 Command palette — missing orch/rates/devices routes **§26**

### 28.32 Backend-only / missing Ember UI modules

- ❌ **Warranties** — `fleetbaseRoutes('warranties')` + Ember `components/warranty/*`; no React route **G079**
- ❌ **Manifests** — `fleet-ops/manifests`, `manifest-stops`; no React UI **G080**
- ❌ **Payloads admin** — `payloads` CRUD; order tab only **G081**
- ❌ **Entities admin** — `entities` CRUD; payload registry only **G081**
- ❌ **Proofs resource** — proofs admin beyond order upload **G082**
- ❌ **Purchase rates** — resource + order financial tab read-only **G083**
- ❌ **Tracking numbers / statuses** — admin UI **G084**
- ❌ **Vehicle-devices** junction admin **G085**

### 28.33 Service quotes & payments

- ❌ `service-quotes/preliminary` UI **G086**
- ❌ Stripe checkout session flow **G086**
- ❌ `fleet-ops/payments/*` settings + onboard **G029**
- ❌ `has-stripe-connect-account` / payments received dashboard

### 28.34 Driver scheduling & fleet membership APIs

- ❌ Driver `schedule-items`, `availabilities`, `hos-status`, `active-shift` **G087**
- ❌ Fleet `assign-driver` / `remove-driver` / `assign-vehicle` / `remove-vehicle` UI **G088**
- ❌ Vendor `assign-driver` / `remove-driver` **G088**

### 28.35 Geofence & live map APIs

- ❌ Geofence `events`, `inventory`, `dwell-report`, `driver/.../history` **G089**
- ❌ `fleet-ops/live/*` (coordinates, routes, orders, drivers, vehicles, places) wired to tracking hub **G090**
- ❌ `positions/replay`, `positions/metrics` + `positions-replay` component **G077**
- ❌ `geofence-event-bus` integration

### 28.36 Telematics & maintenance advanced APIs

- ❌ Telematics `providers`, `discover`, `test-connection`, `link-device` **G091**
- ❌ Maintenance schedule `pause` / `resume` / `trigger` / `ical` / `calendar-feed` **G092**
- ❌ Maintenance record **line-items** CRUD **G092**
- ❌ Work order `{id}/send` email **G093**

### 28.37 Import / export / bulk (entity lists)

- ❌ Per-entity **export/import** on list pages (contacts, vendors, fuel, issues, vehicles, …) **G094**
- ❌ **bulk-delete** on CRUD lists
- ❌ Integrated vendors `supported` providers list

### 28.38 Orchestration & allocation engines

- ✅ `orchestrator/import-orders`, `engines`, `order-config-fields` **G007** *(Phase 2)*
- ✅ `order-allocation` service parity (`lib/fleetops/allocation/`) **G095** *(Phase 2)*
- ✅ `vroom-allocation-engine` + `osrm` + `route-optimization-interface` via `lib/fleetops/routing/` + orchestrator run **G005** *(Phase 2)*
- ✅ `order-list-overlay` on orders map (`OrderListMapOverlay`) **G095** *(Phase 2)*

### 28.39 Settings API not in FleetOps settings UI

- ❌ `notification-registry`, `notification-notifiables`, `notification-settings` (FleetOps mount) **G096**
- ❌ `entity-editing-settings`, `customer-payments-config`, `customer-enabled-order-configs` **G096**
- ❌ `driver-onboard-settings`, `orchestrator-card-fields` **G096**
- ❌ `fleet-ops/metrics` dashboard endpoint **G051**

### 28.40 Geocoder & lookups

- ❌ Places `lookup` / geocode in place form **G097**
- ❌ `geocoder/reverse`, `geocoder/query` shared component
- ❌ `fleet-ops/lookup` customers/facilitators polymorphs
- ❌ `customers/reset-credentials` **G097**

### 28.41 High-value Ember components (no React file)

- ❌ `route-optimization-wizard-panel`
- ❌ `positions-replay`
- ❌ `place/frequency-map`, `place/operations`, `place/performance`, `place/rules`
- ❌ `vehicle/details/*` full tab templates (5 tabs)
- ❌ `vendor/.../personnel` sub-route
- ❌ `order/schedule-card` (component; use `OrderScheduleDialog` + shifts)
- ❌ `widget/fleet-ops-key-metrics` (use different metrics strip)

---

## 29. Ember sub-route parity matrix

Legend: ✅ routed + meaningful UI · 🟡 route or drawer partial · ❌ missing

| Ember sub-route | React equivalent | Status |
|-----------------|------------------|--------|
| `operations/orders/index` | `/fleet-ops/operations/orders` | 🟡 |
| `operations/orders/new` | `.../orders/new` | ✅ |
| `operations/orders/:id` | `?order=` drawer + `/:id` redirect | 🟡 |
| `operations/orders/:id/:slug` | — | ❌ |
| `operations/order-config` | `.../order-config` | 🟡 |
| `operations/service-rates/index/new/edit/details` | `.../service-rates/*` | 🟡 |
| `operations/orchestrator` | `.../orchestrator` | 🟡 |
| `operations/scheduler/index` | `.../schedule` | 🟡 |
| `operations/scheduler/fleet-schedule` | — | ❌ |
| `operations/routes/index/new/details` | `.../routes/*` | 🟡 |
| `management/fleets/index/new/edit/details` | list + `?fleet=` drawer | 🟡 |
| `management/fleets/.../vehicles` | fleet drawer tab only | ❌ |
| `management/fleets/.../drivers` | fleet drawer tab only | ❌ |
| `management/fleets/.../virtual/:slug` | — | ❌ |
| `management/drivers/index/new/edit/details` | list + `?driver=` | 🟡 |
| `management/drivers/.../positions` | driver tab map | 🟡 |
| `management/drivers/.../schedule` | driver schedule tab | 🟡 |
| `management/drivers/.../virtual/:slug` | — | ❌ |
| `management/vehicles/.../positions` | partial on info | ❌ |
| `management/vehicles/.../devices` | — | ❌ |
| `management/vehicles/.../equipment` | — | ❌ |
| `management/vehicles/.../schedules` | — | ❌ |
| `management/vehicles/.../work-orders` | — | ❌ |
| `management/vehicles/.../maintenance-history` | stub | 🟡 |
| `management/vehicles/.../virtual/:slug` | — | ❌ |
| `management/places/.../operations` | — | ❌ |
| `management/places/.../performance` | — | ❌ |
| `management/places/.../activity` | tab | 🟡 |
| `management/places/.../map` | overview map | 🟡 |
| `management/places/.../comments` | — | ❌ |
| `management/places/.../documents` | — | ❌ |
| `management/places/.../rules` | — | ❌ |
| `management/places/.../virtual/:slug` | — | ❌ |
| `management/vendors/*` | `.../management/vendors/*` | 🟡 |
| `management/vendors/integrated/*` | `.../integrated-vendors/*` | 🟡 |
| `management/contacts/*` | `.../contacts/*` | 🟡 |
| `management/contacts/customers/*` | — | ❌ |
| `management/fuel-reports/*` | `.../fuel-reports/*` | 🟡 |
| `management/issues/*` | `.../issues/*` | 🟡 |
| `connectivity/telematics/.../devices` | — | ❌ |
| `connectivity/telematics/.../sensors` | — | ❌ |
| `connectivity/telematics/.../events` | — | ❌ |
| `connectivity/devices/.../events` | — | ❌ |
| `connectivity/devices/.../virtual/:slug` | — | ❌ |
| `connectivity/sensors/.../virtual/:slug` | — | ❌ |
| `connectivity/events/details` | `device-events/:id` | 🟡 |
| `connectivity/tracking` | `.../tracking` | 🟡 |
| `maintenance/schedules/.../work-orders` | — | ❌ |
| `analytics/reports/.../result` | — | ❌ |
| `settings/navigator-app` | `settings/navigator` | 🟡 |
| `settings/notifications` | global `/settings` only | 🟡 |
| `settings/custom-fields` | `/fleet-ops/custom-fields` | 🟡 |
| `settings/avatars` | — | ❌ |
| `settings/routing` | `settings/routing` | 🟡 |
| `settings/orchestrator` | `settings/orchestrator` | 🟡 |
| `settings/scheduling` | `settings/scheduling` | 🟡 |
| `settings/payments/*` | — | ❌ |
| `virtual/:section/:slug` (top) | — | ❌ |

---

## 30. All 68 Ember modals — React status

| # | Ember modal | React equivalent | Status |
|---|-------------|------------------|--------|
| 1 | `assign-driver` | `AssignDriverDialog` | ✅ |
| 2 | `attach-device` | API only | ❌ |
| 3 | `bulk-assign-driver` | `BulkAssignDriverDialog` | ✅ |
| 4 | `bulk-assign-orders` | — | ❌ |
| 5 | `clone-config-form` | `duplicateOrderConfig` / editor | ✅ |
| 6 | `confirm-service-quote-purchase` | — | ❌ |
| 7 | `contact-details` | `ContactDetail` (page) | 🟡 |
| 8 | `contact-form` | `SimpleEntityForm` / CRUD | 🟡 |
| 9 | `driver-assign-order` | — | ❌ |
| 10 | `driver-assign-vendor` | — | ❌ |
| 11 | `driver-assign-vehicle` | partial API | 🟡 |
| 12 | `driver-details` | `DriverDetail` drawer | 🟡 |
| 13 | `driver-form` | `DriverForm` | ✅ |
| 14 | `driver-shift` / `add-driver-shift` | `ShiftForm` | 🟡 |
| 15 | `edit-meta-form` | — | ❌ |
| 16 | `entity-form` | payload partial | 🟡 |
| 17 | `entity-meta-field-prompt` | — | ❌ |
| 18 | `fleet-details` | `FleetDetail` drawer | 🟡 |
| 19 | `fleet-form` | `FleetForm` | ✅ |
| 20 | `fuel-report-details` | `FuelReportDetail` | 🟡 |
| 21 | `fuel-report-form` | CRUD dialog | 🟡 |
| 22 | `group-details` | IAM (out of FleetOps) | N/A |
| 23 | `group-form` | IAM | N/A |
| 24 | `install-prompt` | — | ❌ |
| 25 | `issue-details` | `IssueDetail` | 🟡 |
| 26 | `issue-from` (form) | CRUD dialog | 🟡 |
| 27 | `map-field-form` | — | ❌ |
| 28 | `map-field-group-form` | — | ❌ |
| 29 | `map-layer-form` | — | ❌ |
| 30 | `meta-field-form` | — | ❌ |
| 31 | `meta-field-group-form` | — | ❌ |
| 32 | `new-custom-field-group` | — | ❌ |
| 33 | `new-order-config` | `OrderConfigEditorDialog` | ✅ |
| 34 | `option-prompt` | — | ❌ |
| 35 | `orchestrator-import` | — | ❌ |
| 36 | `order-assign-driver` | `AssignDriverDialog` | ✅ |
| 37 | `order-config-new-status` | partial in config manager | 🟡 |
| 38 | `order-event` | — | ❌ |
| 39 | `order-form` | `OrderForm` / `OrderCreateDialog` | ✅ |
| 40 | `order-import` | `OrderImportDialog` | 🟡 |
| 41 | `order-label` | `OrderLabelDialog` | ✅ |
| 42 | `order-meta` | — | ❌ |
| 43 | `order-new-activity` | — | ❌ |
| 44 | `order-route-form` | `OrderRouteEditor` panel | 🟡 |
| 45 | `place-assign-vendor` | — | ❌ |
| 46 | `place-details` | `PlaceDetail` drawer | 🟡 |
| 47 | `place-form` | `PlaceForm` | ✅ |
| 48 | `point-map` | — | ❌ |
| 49 | `policy-form` | IAM | N/A |
| 50 | `reset-customer-credentials` | — | ❌ |
| 51 | `role-form` | IAM | N/A |
| 52 | `scheduling-conflict` | — | ❌ |
| 53 | `select-payment-method` | — | ❌ |
| 54 | `send-work-order` | — | ❌ |
| 55 | `service-area-form` | service area CRUD / map | 🟡 |
| 56 | `service-quote-purchase-form` | — | ❌ |
| 57 | `set-driver-availability` | — | ❌ |
| 58 | `uninstall-prompt` | — | ❌ |
| 59 | `update-order-activity` | `OrderWorkflowActions` | ✅ |
| 60 | `user-form` | IAM users | N/A |
| 61 | `vehicle-details` | `VehicleDetail` drawer | 🟡 |
| 62 | `vehicle-form` | `VehicleForm` | ✅ |
| 63 | `vendor-details` | `VendorDetail` | 🟡 |
| 64 | `vendor-form` | CRUD dialog | 🟡 |
| 65 | `view-service-area` | `ServiceAreaDetail` | 🟡 |
| 66 | `view-zone` | — | ❌ |
| 67 | `zone-form` | — | ❌ |
| 68 | `add-driver-shift` | `ShiftForm` (with `driver-shift`) | 🟡 |

**Note:** Scheduling uses `components/order/schedule-card` (not a modal) + `OrderScheduleDialog` in React.

**Summary:** ✅ **12** · 🟡 **29** · ❌ **24** · N/A **3** (IAM-only modals in Ember tree reused from console)

---

## 31. API & UI wiring matrix (full)

| API method (group) | In `fleetopsService` | UI consumer | Gap |
|--------------------|----------------------|-------------|-----|
| Orders lifecycle + bulk + comments | ✅ | OrdersList, OrderDetail | 🟡 list scale |
| `scheduleOrder` | ✅ | `OrderScheduleDialog` | 🟡 |
| `listOrdersPage` | ✅ | `useOrdersListPage` | 🟡 |
| Order config CRUD | ✅ | `OrderConfigManager` | 🟡 flow logic |
| Drivers/vehicles/places/fleets CRUD | ✅ | list + drawers | 🟡 tabs |
| Routes CRUD + `optimizeRoutes` | ✅ | routes pages | ❌ VRP UX |
| Orchestrator preview/commit | ✅ | `Orchestrator.jsx` | 🟡 |
| Service rates CRUD | ✅ | ServiceRates pages | 🟡 |
| Generic CRUD (15 entities) | ✅ `attachGenericCrud` | `FleetopsCrudListPage` | 🟡 shallow |
| Service area + zone + geometry | ✅ | service-areas pages | 🟡 |
| Settings sections | ✅ | settings pages | 🟡 |
| Reports list/get/run | ✅ | analytics pages | 🟡 |
| `lookupTrackingOrder` | ✅ | `TrackOrderLookup` | 🟡 |
| Custom fields CRUD | ✅ | custom-fields pages | 🟡 local fallback risk |
| `assignOrderToDriver` etc. | ✅ | — | ❌ modals |
| `attachDeviceToVehicle` | ✅ | — | ❌ vehicle devices tab |
| `listVehicleWorkOrders` | ✅ | — | ❌ vehicle WO tab |
| Customer CRUD API | ✅ | — | ❌ no route |

---

## 32. Roles & permissions QA matrix

FleetOps roles from `packages/fleetops/server/src/Auth/Schemas/FleetOps.php`. React uses `useFleetopsAbility` / `useFleetopsPermission` — **not audited on every page**.

| Role | Should access (summary) | React UI tested | Gap |
|------|-------------------------|-----------------|-----|
| Operations Manager | Dispatch + fleet + orders | 🟡 partial | **G074** full QA |
| Fleet Supervisor | Fleet + service areas | 🟡 | zones admin shallow |
| Service Coordinator | Rates + zones | 🟡 | |
| Operations Administrator | Broad admin resources | 🟡 | missing payments UI |
| Maintenance Technician | Maintenance modules | 🟡 CRUD only | |
| Driver Coordinator | Orders + fleet | 🟡 | no dispatch depth QA |
| Navigator App Manager | Navigator settings | 🟡 settings page | |
| Driver | Navigator app (not console) | N/A | §33 |
| Fleet-Ops Customer | Own orders/places | ❌ portal | **G072** |
| Fleet-Ops Contact | Minimal | ❌ | **G073** |
| **Administrator** (IAM) | All engines | 🟡 `/iam` in same app | org-wide, not FleetOps-only |

**Systemic gaps:** fail-closed when permissions empty **G003**; hide/disable all CRUD actions per resource; route guards on every `/fleet-ops/*` path.

---

## 33. Out-of-repo scope (Navigator, portals, other engines)

**Not counted in FleetOps %** but required for full Fleetbase product:

| Item | Location | Status |
|------|----------|--------|
| Navigator / driver mobile app | `fleet_mobile-main/frontend` (Expo) | 🟡 early — **G071** |
| POD capture (signature/photo/qr) | Navigator | ❌ **G060** |
| Customer portal UI | customer-portal engine | ❌ **G072** |
| Contact portal UI | — | ❌ **G073** |
| IAM engine UI | `frontend` `/iam/*` | 🟡 separate engine |
| Storefront engine | `frontend` `/storefront/*` | 🟡 separate engine |
| Ledger engine | `frontend` `/ledger/*` | 🟡 separate engine |
| Developers / Registry engines | optional | partial |

---

## 34. Ember ↔ React path aliases

| Ember path | React path | Notes |
|------------|------------|-------|
| `/fleet-ops` (mount) | `/fleet-ops` | ✅ |
| `operations/scheduler` | `operations/schedule` | rename |
| `maintenance/maintenances` | `maintenance/records` | rename |
| `connectivity/events` | `connectivity/device-events` | rename |
| `settings/custom-fields` | `/fleet-ops/custom-fields` | not under `/settings` |
| `management` (`/manage`) | `management` (`/management`) | URL prefix differs |
| `operations/routing` (legacy) | redirects → `operations/routes` | ➕ |

---

## 35. Backend API gaps (not in React UI)

Grouped from `packages/fleetops/server/src/routes.php`. Columns: **API** = exists on server · **Service** = in `fleetopsService.js` · **UI** = user-facing in `frontend/`.

### 35.1 Orders

| Endpoint / action | API | Service | UI | Gap |
|-------------------|-----|---------|-----|-----|
| CRUD + dispatch/cancel/start/complete | ✅ | ✅ | ✅ | — |
| `PATCH schedule` | ✅ | ✅ | ✅ | single + bulk via toolbar *(Phase 1)* |
| `PATCH bulk-*`, import/export | ✅ | ✅ | 🟡 | |
| `GET search`, `types` | ✅ | ✅ | 🟡 | Service wired; list uses `query` param; types reserved for order-config filter (Phase 2) |
| `process-imports` | ✅ | 🟡 | 🟡 | |
| `proofs` | ✅ | ❌ | 🟡 | upload only **G082** |
| `set-destination` | ✅ | ❌ | ❌ | |
| `editable-entity-fields` | ✅ | ❌ | ❌ | |

### 35.2 Drivers

| Endpoint | API | Service | UI | Gap |
|----------|-----|---------|-----|-----|
| CRUD | ✅ | ✅ | ✅ | — |
| `schedule-items`, `availabilities`, `hos-status`, `active-shift` | ✅ | ❌ | ❌ | **G087** |
| export/import/bulk-delete | ✅ | ❌ | ❌ | **G094** |

### 35.3 Fleets

| Endpoint | API | Service | UI | Gap |
|----------|-----|---------|-----|-----|
| CRUD | ✅ | ✅ | ✅ | — |
| assign/remove driver & vehicle | ✅ | ❌ | ❌ | **G088** |
| export/import | ✅ | ❌ | ❌ | **G094** |

### 35.4 Vendors & contacts

| Endpoint | API | Service | UI | Gap |
|----------|-----|---------|-----|-----|
| CRUD | ✅ | 🟡 generic | 🟡 | scaffold |
| export/import/bulk-delete | ✅ | ❌ | ❌ | **G094** |
| facilitators/customers morph GET | ✅ | ❌ | ❌ | |
| vendor assign/remove driver | ✅ | 🟡 partial API | ❌ | **G088** |
| `customers/reset-credentials` | ✅ | ❌ | ❌ | **G097** |

### 35.5 Places & geocoder

| Endpoint | API | Service | UI | Gap |
|----------|-----|---------|-----|-----|
| CRUD | ✅ | ✅ | ✅ | — |
| `lookup` (geocode) | ✅ | ❌ | ❌ | **G097** |
| export/import | ✅ | ❌ | ❌ | **G094** |
| `geocoder/reverse`, `geocoder/query` | ✅ | ❌ | ❌ | **G097** |

### 35.6 Routes, orchestrator, positions

| Endpoint | API | Service | UI | Gap |
|----------|-----|---------|-----|-----|
| routes CRUD + optimize | ✅ | ✅ | ✅ | Wizard uses orchestrator `optimize_routes` |
| orchestrator preview/commit/run | ✅ | ✅ | ✅ | `/fleet-ops/orchestrator/*` |
| orchestrator import-orders, engines, order-config-fields | ✅ | ✅ | ✅ | |
| positions replay/metrics | ✅ | ❌ | ❌ | **G077** |

### 35.7 Service rates & quotes

| Endpoint | API | Service | UI | Gap |
|----------|-----|---------|-----|-----|
| service-rates CRUD + for-route + export | ✅ | 🟡 | 🟡 | **G011** |
| service-quotes preliminary + Stripe | ✅ | ❌ | ❌ | **G086** |

### 35.8 Connectivity & telematics

| Endpoint | API | Service | UI | Gap |
|----------|-----|---------|-----|-----|
| devices/sensors/device-events CRUD | ✅ | 🟡 | 🟡 | scaffold |
| telematics providers/discover/test/link | ✅ | ❌ | ❌ | **G091** |

### 35.9 Maintenance

| Endpoint | API | Service | UI | Gap |
|----------|-----|---------|-----|-----|
| schedules CRUD + pause/resume/trigger/ical | ✅ | 🟡 | ❌ | **G092** |
| work-orders send email | ✅ | ❌ | ❌ | **G093** |
| maintenances line-items | ✅ | ❌ | ❌ | **G092** |
| import on all maint entities | ✅ | ❌ | ❌ | **G094** |

### 35.10 Geofences, live, metrics, settings

| Endpoint | API | Service | UI | Gap |
|----------|-----|---------|-----|-----|
| geofences/events, inventory, dwell, driver history | ✅ | ❌ | ❌ | **G089** |
| fleet-ops/live/* | ✅ | ❌ | 🟡 | **G090** |
| fleet-ops/metrics | ✅ | ❌ | 🟡 | strip only **G051** |
| notification + entity-editing + customer portal settings | ✅ | 🟡 partial | ❌ | **G096** |
| fleet-ops/payments Stripe | ✅ | ❌ | ❌ | **G029** |

### 35.11 Resources with no React module

| Resource | API | Service | UI | Gap |
|----------|-----|---------|-----|-----|
| warranties | ✅ | ❌ | ❌ | **G079** |
| payloads | ✅ | ❌ | ❌ | **G081** |
| entities | ✅ | ❌ | ❌ | **G081** |
| proofs (standalone) | ✅ | ❌ | ❌ | **G082** |
| purchase-rates | ✅ | ❌ | 🟡 | **G083** |
| tracking-numbers/statuses | ✅ | ❌ | ❌ | **G084** |
| vehicle-devices | ✅ | 🟡 attach | ❌ | **G085** |
| manifests / manifest-stops | ✅ | ❌ | ❌ | **G080** |

---

## 36. Backend domains with no Ember console route

These exist on the **API** (and sometimes Ember **components**) but have **no** `routes.js` top-level module like `management/drivers`. React must add **new** product areas or fold into existing pages.

| Domain | Backend | Ember UI artifact | React |
|--------|---------|-------------------|-------|
| Warranties | `warranties` routes | `components/warranty/*` | ❌ **G079** |
| Manifests | `fleet-ops/manifests` | May be orchestration-adjacent | ❌ **G080** |
| Payloads | `payloads` routes | Order payload editor | ❌ admin **G081** |
| Entities | `entities` routes | Order entity forms | ❌ admin **G081** |
| Service quotes | `service-quotes` | Checkout modals | ❌ **G086** |
| Live aggregation | `fleet-ops/live/*` | Tracking templates | 🟡 hub **G090** |
| Metrics API | `fleet-ops/metrics` | Dashboard widget | 🟡 **G051** |

---

## 37. All 55 Ember services — parity checklist

| Service | React equivalent | Status | §28 ref |
|---------|------------------|--------|---------|
| `order-actions` | `fleetopsService` + `useOrderDetail` | 🟡 82% | §28.1 |
| `order-config-actions` | `OrderConfigManager` + workflow conditionals | 🟡 85% | §28.2 |
| `order-creation` | `OrderForm` | ✅ | |
| `order-validation` | zod + form | ✅ | |
| `order-import` | `OrderImportDialog` | 🟡 | §28.1 |
| `order-socket-events` | realtime manager | 🟡 70% | §28.31 |
| `order-list-overlay` | `OrderListMapOverlay` | ✅ 75% | §28.38 |
| `order-allocation` | `lib/fleetops/allocation/` | ✅ 70% | §28.38 |
| `scheduling` | `SchedulePlanner` + `FleetScheduleView` | 🟡 70% | §28.3 |
| `driver-scheduling` | shifts + fleet schedule | 🟡 65% | §28.3 |
| `orchestration-engine` | `Orchestrator.jsx` | ✅ 75% | §28.5 |
| `orchestration-engine-interface` | orchestrator service + page | 🟡 70% | §28.38 |
| `route-optimization` | `RouteOptimizationWizard` + routes pages | ✅ 75% | §28.4 |
| `route-optimization-interface` | `lib/fleetops/routing/` | ✅ 70% | §28.38 |
| `vroom-allocation-engine` | server orchestrator engine | 🟡 70% | §28.38 |
| `osrm` | server orchestrator / routing settings | 🟡 70% | §28.38 |
| `driver-actions` | driver pages | ✅ 72% | §28.8 |
| `vehicle-actions` | vehicle pages | ✅ 72% | §28.9 |
| `place-actions` | place pages | ✅ 70% | §28.10 |
| `fleet-actions` | fleet pages | ✅ 72% | §28.7 |
| `contact-actions` | CRUD scaffold | 🟡 65% | §28.13 |
| `customer-actions` | customers route + reset | ✅ 70% | §28.14 |
| `vendor-actions` | CRUD + personnel | ✅ 70% | §28.11 |
| `integrated-vendor-actions` | CRUD + providers | 🟡 65% | §28.12 |
| `fuel-report-actions` | CRUD scaffold | 🟡 55% | §28.15 |
| `issue-actions` | CRUD + status | 🟡 55% | §28.16 |
| `service-rate-actions` | service rates pages | 🟡 50% | §28.6 |
| `device-actions` | CRUD scaffold | 🟡 42% | §28.18 |
| `sensor-actions` | CRUD scaffold | 🟡 42% | §28.19 |
| `telematic-actions` | CRUD scaffold | 🟡 42% | §28.17 |
| `device-event-actions` | read-only list | 🟡 35% | §28.20 |
| `maintenance-actions` | CRUD scaffold | 🟡 42% | §28.23 |
| `maintenance-schedule-actions` | CRUD scaffold | 🟡 42% | §28.22 |
| `work-order-actions` | CRUD scaffold | 🟡 42% | §28.24 |
| `equipment-actions` | CRUD scaffold | 🟡 42% | §28.25 |
| `part-actions` | CRUD scaffold | 🟡 42% | §28.26 |
| `report-actions` | reports pages | 🟡 38% | §28.27 |
| `service-area-actions` | service areas | 🟡 40% | §28.29 |
| `service-area-manager` | — | ❌ | §22 |
| `service-areas` | list API | 🟡 | §22 |
| `zone-actions` | zone API | 🟡 | §22 |
| `geofence` | map editor partial | 🟡 | §22 |
| `geofence-event-bus` | — | ❌ | §28.35 |
| `entity-actions` | payload tab | 🟡 | §28.1 |
| `resource-metadata` | — | ❌ | |
| `leaflet-map-manager` | `MapView` | 🟡 | §28.31 |
| `leaflet-routing-control` | MapView polylines + routing lib | 🟡 65% | §28.4 |
| `leaflet-layer-visibility-manager` | — | ❌ | |
| `leaflet-draw-restriction` | — | ❌ | |
| `leaflet-contextmenu-manager` | — | ❌ | §28.31 |
| `map-drawer` | — | ❌ | |
| `location` | implicit | 🟡 | |
| `movement-tracker` | tracking | 🟡 | |
| `position-playback` | — | ❌ | §28.35 |
| `global-search` | `CommandPalette` | 🟡 | §28.31 |

---

## 38. All 33 extension registry keys

From `packages/fleetops/addon/extension.js` — each needs a React owner or explicit N/A.

| Registry key | React status | Gap |
|--------------|--------------|-----|
| `engine:fleet-ops` | 🟡 app shell | |
| `fleet-ops:component:map:drawer` | ❌ | **G053** |
| `fleet-ops:component:vehicle:details` | 🟡 drawer | tabs **G047** |
| `fleet-ops:component:driver:details` | 🟡 drawer | **G074** |
| `fleet-ops:component:order-config-manager` | ✅ page | |
| `fleet-ops:component:order:details` | 🟡 drawer | extensions **G032** |
| `fleet-ops:component:order:form` | ✅ `OrderForm` | |
| `fleet-ops:component:order:form:payload:entity` | ❌ | **G053** |
| `fleet-ops:component:order:form:payload:entity:form` | ❌ | **G053** |
| `fleet-ops:component:contact:form` | 🟡 SimpleEntityForm | **G053** |
| `fleet-ops:component:contact:form:details` | ❌ | **G053** |
| `fleet-ops:component:customer:form` | 🟡 entity config | no route **G015** |
| `fleet-ops:component:customer:form:details` | ❌ | **G053** |
| `fleet-ops:component:driver:form` | ✅ `DriverForm` | |
| `fleet-ops:component:driver:form:details` | ❌ | **G053** |
| `fleet-ops:component:fleet:form` | ✅ `FleetForm` | |
| `fleet-ops:component:fleet:form:details` | ❌ | **G053** |
| `fleet-ops:component:place:form` | ✅ `PlaceForm` | |
| `fleet-ops:component:place:form:details` | ❌ | **G053** |
| `fleet-ops:component:vehicle:form` | ✅ `VehicleForm` | |
| `fleet-ops:component:vehicle:form:details` | ❌ | **G053** |
| `fleet-ops:component:vendor:form:create` | 🟡 CRUD | **G053** |
| `fleet-ops:component:vendor:form:create:details` | ❌ | **G053** |
| `fleet-ops:component:vendor:form:edit` | 🟡 CRUD | **G053** |
| `fleet-ops:component:vendor:form:edit:details` | ❌ | **G053** |
| `fleet-ops:component:issue:form` | 🟡 CRUD | **G053** |
| `fleet-ops:component:issue:form:details` | ❌ | **G053** |
| `fleet-ops:component:fuel-report:form` | 🟡 CRUD | **G053** |
| `fleet-ops:component:fuel-report:form:details` | ❌ | **G053** |
| `fleet-ops:component:maintenance:form` | 🟡 CRUD | **G053** |
| `fleet-ops:component:maintenance:form:details` | ❌ | **G053** |
| `fleet-ops:component:maintenance:details` | 🟡 detail page | |
| `fleet-ops:component:work-order:form` | 🟡 CRUD | **G053** |
| `fleet-ops:component:work-order:form:details` | ❌ | **G053** |
| `fleet-ops:component:work-order:details` | 🟡 detail page | |
| `fleet-ops:component:equipment:form` | 🟡 CRUD | **G053** |
| `fleet-ops:component:equipment:form:details` | ❌ | **G053** |
| `fleet-ops:component:equipment:details` | 🟡 detail page | |
| `fleet-ops:component:part:form` | 🟡 CRUD | **G053** |
| `fleet-ops:component:part:form:details` | ❌ | **G053** |
| `fleet-ops:component:part:details` | 🟡 detail page | |
| `fleet-ops:contextmenu:vehicle` | ❌ | **G078** |
| `fleet-ops:contextmenu:driver` | ❌ | **G078** |
| `fleet-ops:template:settings:routing` | 🟡 `RoutingSettingsPage` | |
| `fleet-ops:template:settings:orchestrator` | 🟡 `OrchestratorSettingsPage` | |

**Storefront extension (separate engine):** `fleet-ops:component:order:details` ← `storefront-order-summary` — not wired in React **§28.30**.

---

## 39. Road to 100% parity (from ~48%)

**Full phased plan (tasks, G-IDs, deliverables, exit criteria):** [FLEETOPS-IMPLEMENTATION-PHASES.md](./FLEETOPS-IMPLEMENTATION-PHASES.md)

| Phase | Summary | Est. Δ | Cumulative |
|-------|---------|--------|------------|
| **1** | Dispatcher foundation — pagination, permissions, schedule | +7% | ~55% |
| **2** | Planning — VRP, orchestrator, fleet schedule | +10% | ~65% |
| **3** | Entity depth — vehicle/place/driver/fleet/vendor | +10% | ~75% |
| **4** | Enterprise modules — connectivity, maintenance, analytics, rates | +8% | ~83% |
| **5** | Settings, geo, live maps | +5% | ~88% |
| **6** | Platform — extensions, 18-col grid, i18n | +4% | ~92% |
| **7** | Backend-only — warranties, manifests, payloads admin | +3% | ~95% |
| **8** | QA, roles, production hardening | +5% | **~98–100%** |
| **9** | Field & portals *(optional, out of console %)* | — | §33 |

**Checklist to mark 100% done:** see IMPLEMENTATION-PHASES “Verification checklist” and:

1. Every row in **§29** is ✅ or accepted 🟡 (document exception).
2. Every ❌ in **§28** closed or deferred with sign-off.
3. Every **§35** row has Service + UI ✅ where API ✅.
4. **§37** services at target % (orders 85%+, entities 70%+, scaffold modules 60%+).
5. **§38** registry keys implemented or N/A documented.
6. **§32** all 10 FleetOps roles pass QA matrix.
7. Production criteria in **§20** “Not ready” list is empty.

---

## 40. Document completeness statement

| Question | Answer |
|----------|--------|
| Does this cover **all** Ember vs React gaps? | **Yes** for product/API/service/registry level. |
| Does it list every missing **screen**? | **Yes** via §3, §28–§29, §36. |
| Does it list every missing **API**? | **Yes** via §35 (grouped). |
| Does it list every **modal**? | **Yes** — §30 (68/68). |
| Does it list every **service**? | **Yes** — §37 (55/55). |
| What is **not** line-audited? | 188 Ember `.hbs` templates line-by-line; use §28+§29 per feature. |
| What is **outside** FleetOps console %? | §33 Navigator, portals, IAM/Storefront/Ledger. |
| How to track to **100%**? | [FLEETOPS-IMPLEMENTATION-PHASES.md](./FLEETOPS-IMPLEMENTATION-PHASES.md) Phases 1–8 + §27 G-IDs (**G001–G097**). |

**New G-IDs (v3.1):** G079 warranties · G080 manifests · G081 payloads/entities · G082 proofs · G083 purchase-rates · G084 tracking admin · G085 vehicle-devices · G086 service-quotes/payments · G087 driver scheduling API · G088 fleet/vendor assign API · G089 geofence reports · G090 live API · G091 telematics setup · G092 maint schedule advanced · G093 work-order send · G094 import/export bulk · G095 allocation/overlay · G096 FleetOps settings API · G097 geocoder/reset-credentials

---

## Document history

| Version | Change |
|---------|--------|
| 2.0 | Consolidated E2E, ORDER-GAPS, ROADMAP, 3DAY into single doc |
| 2.1 | Audit: §21–§27, master register G001–G070, service areas/zones, extension registries, list filter gaps |
| 2.2 | Added [FLEETOPS-4DAY-PLAN.md](./FLEETOPS-4DAY-PLAN.md) — Day 1–4 plan incl. Navigator + portals (G071–G078) |
| 2.3 | Re-audit `frontend/src` (2026-05-30): weighted parity **~26% → ~48%**; §3 routes for connectivity/maintenance/management/settings; §27 register Open→Partial for scaffolds; §1.1 Ember vs React clarification |
| 3.0 | **Complete React gaps in this file only:** §28 module checklists (all missing items), §29 sub-routes, §30 all 68 modals, §31 API wiring, §32 roles, §33 out-of-repo; updated §12–§14, §19, §22 |
| 3.1 | **Full parity audit:** §1.1 completeness matrix; §28.32–§28.41 backend/API/component gaps; §34 path aliases; §35–§36 API & backend-only domains; §37 all 55 services; §38 all 33 registry keys; §39 road to 100%; §40 completeness statement; G079–G097; fixed §30 modal #68 |
| 3.2 | **Phase 1 complete:** G001–G003, G038–G041, G054–G056 → Done; §28.1 updated; parity ~55% |
| 3.3 | **Phase 2 complete:** G004–G010, G037, G042–G043, G044, G095 → Done; §28.3–§28.5, §28.38, §37, §20 updated; G035/G058 → Partial; parity ~65% |
| 3.4 | **Phase 3 complete:** G012–G017, G047–G050, G087, G088, G097 → Done; §28.7–§28.16, §37 entity-actions ≥70%; parity ~75% |

*End of canonical gap document. All FleetOps parity tracking lives here — do not split across other gap files.*
