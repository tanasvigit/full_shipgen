# FleetOps React — Implementation Phases (48% → 100%)

**Canonical execution plan.** Gap inventory and audit detail live in [FLEETOPS-GAPS.md](./FLEETOPS-GAPS.md) (v3.1).

| Field | Value |
|-------|--------|
| **Version** | 1.0 |
| **Date** | 2026-05-30 |
| **Baseline** | **~48%** weighted FleetOps console parity vs Ember |
| **Target** | **~98–100%** console parity (Phases 1–8) |
| **Out of console %** | Phase 9 — Navigator, portals (separate codebases) |
| **Gap register** | G001–G097 in GAPS §27 |

---

## How to use this document

1. Execute **Phases 1 → 8 in order** — later phases depend on earlier APIs, permissions, and patterns.
2. For each task, mark the G-ID **Done** in [FLEETOPS-GAPS.md](./FLEETOPS-GAPS.md) §27 when exit criteria pass.
3. Use GAPS **§28** (module checklist), **§29** (routes), **§35** (API wiring) while implementing.
4. Do **not** skip Phase 1 for feature work in Phase 4 — list pages without server pagination will not scale.

---

## Summary timeline

**Team assumption:** 4 frontend · 2 backend · 1 QA (from GAPS §18).

| Phase | Name | Parity Δ | Cumulative | Calendar (est.) |
|-------|------|----------|------------|-----------------|
| — | **Today (baseline)** | — | **~48%** | — |
| **1** | Dispatcher foundation | +7% | ~55% | 6–8 weeks |
| **2** | Planning & orchestration | +10% | ~65% | 14–18 weeks |
| **3** | Entity depth (management) | +10% | ~75% | 10–12 weeks |
| **4** | Enterprise modules depth | +8% | ~83% | 16–20 weeks |
| **5** | Settings, geo & live maps | +5% | ~88% | 12–16 weeks |
| **6** | Platform polish & extensions | +4% | ~92% | 6–8 weeks |
| **7** | Backend-only product areas | +3% | ~95% | 4–6 weeks |
| **8** | QA, roles & production hardening | +5% | **~98–100%** | 6–8 weeks |
| **9** | Field & portals *(optional)* | — | product story | 8–12+ weeks |
| | **Total Phases 1–8** | **+52%** | **~100%** | **~10–14 months** |

Phases 2–4 can use **parallel streams** (see each phase) after Phase 1 exit criteria are met.

---

## Phase 1 — Dispatcher foundation

**Goal:** Production-grade order operations at scale; permissions safe for multi-tenant SaaS.

| | |
|--|--|
| **Parity** | ~48% → **~55%** |
| **Duration** | 6–8 engineer-weeks |
| **Risk** | Low–medium |
| **Depends on** | — (start here) |

### G-IDs

| ID | Gap | Priority |
|----|-----|----------|
| G001 | Server-side orders pagination & filters | P0 |
| G002 | `PATCH orders/schedule` + full schedule UI | P1 |
| G003 | Permissions fail-closed when ability map empty | P0 |
| G055 | Bulk query / `without_driver` filters | P1 |
| G054 | Spreadsheet import on order new | P2 |
| G038 | Order payload waypoint edit | P2 |
| G039 | Metadata edit modal | P2 |
| G040 | Notes edit in place | P2 |
| G041 | Delete order UI | P3 |
| G056 | Full-page order realtime polish | P3 |

### Deliverables

- [ ] Orders list: server `page` / `limit` / `sort` / filter query params; no client-only pagination at scale
- [ ] Schedule dialog + bulk schedule hooks wired to `PATCH orders/schedule`
- [ ] `useFleetopsAbility` / route guards: deny when permissions unknown (fail-closed)
- [ ] Order drawer: payload waypoints, metadata modal, inline notes
- [ ] Import on create flow; delete order with confirm
- [ ] E2E: pagination smoke + permission denied paths

### Exit criteria

- [ ] 10k+ orders tenant: list loads &lt; 3s with filters
- [ ] G001, G003, G002, G055 → **Done** in §27
- [ ] GAPS §35 orders rows: search/types wired or documented N/A

### Primary files

`pages/fleetops/OrdersList.jsx`, `hooks/fleetops/useOrdersListPage.js`, `services/fleetops.js`, `hooks/fleetops/useFleetopsAbility.js`

---

## Phase 2 — Planning & orchestration

**Goal:** Route optimization and orchestrator match Ember planning workflows.

| | |
|--|--|
| **Parity** | ~55% → **~65%** |
| **Duration** | 14–18 engineer-weeks |
| **Risk** | **High** (VRP, OSRM, VROOM) |
| **Depends on** | Phase 1 |

### G-IDs

| ID | Gap | Priority |
|----|-----|----------|
| G004 | Routes module (list/new/details) — depth | P0 |
| G005 | VROOM/OSRM optimize + save | P0 |
| G006 | Orchestrator page — full UX | P1 |
| G007 | Orchestrator import modal | P1 |
| G008 | Fleet schedule route | P1 |
| G009 | Bulk schedule orders | P1 |
| G010 | Best-fit driver assign | P1 |
| G037 | Optimize routes from order selection | P1 |
| G042 | Live route polyline on detail open | P1 |
| G043 | Route waypoint reorder | P1 |
| G044 | Order config flow conditional logic | P2 |
| G095 | Order allocation + order-list-overlay | P2 |

### Deliverables

- [ ] Routes: create → optimize (VROOM/OSRM) → save → assign to orders
- [ ] Orchestrator: preview, commit, run, **import orders**, engine list, order-config fields
- [ ] `/fleet-ops/operations/schedule` fleet view + bulk assign windows
- [ ] Orders map: multi-select → “Optimize routes”; list overlay parity
- [ ] `order-allocation` / `vroom-allocation-engine` / `osrm` service layer in React
- [ ] Order config manager: conditional flow editor

### Exit criteria

- [ ] Planner E2E: 20 stops → optimized route → saved → linked order
- [ ] G004–G010, G037, G042–G043, G095 → **Done** or signed partial with ticket
- [ ] GAPS §37: `route-optimization*`, `orchestration-engine*`, `vroom-allocation-engine`, `osrm` ≥ 70%

### Parallel streams

| Stream | Focus |
|--------|--------|
| FE-A | Routes UI + map polyline |
| FE-B | Orchestrator + import |
| FE-C | Fleet schedule + bulk |
| BE | VROOM/OSRM proxy, orchestrator APIs |

---

## Phase 3 — Entity depth (management)

**Goal:** Drivers, vehicles, places, fleets, vendors at Ember tab/modal depth — not scaffold-only.

| | |
|--|--|
| **Parity** | ~65% → **~75%** |
| **Duration** | 10–12 engineer-weeks |
| **Risk** | Medium |
| **Depends on** | Phase 1 (permissions); Phase 2 optional for assign-order |

### G-IDs

| ID | Gap | Priority |
|----|-----|----------|
| G012–G017 | Vendors, integrated vendors, contacts, fuel, issues — depth | P2–P3 |
| G015 | Customers nested CRUD route | P2 |
| G047 | Vehicle devices tab | P2 |
| G048 | Vehicle work-orders tab | P2 |
| G049 | Place comments / documents / rules | P2 |
| G050 | Driver assign-order modal | P2 |
| G088 | Fleet & vendor assign/remove driver/vehicle UI | P2 |
| G087 | Driver schedule-items / availabilities / HOS API | P2 |
| G097 | Geocoder lookup + customer reset-credentials | P2 |

### Deliverables

- [ ] Vehicle detail: **Devices**, **Work orders** tabs (API + UI)
- [ ] Place detail: comments, documents, rules, frequency map (per GAPS §28.10)
- [ ] Driver: assign-order modal; schedule/HOS from API
- [ ] Fleet detail: assign/remove driver & vehicle
- [ ] Vendor personnel sub-route; integrated vendor **supported** providers
- [ ] `/fleet-ops/management/customers` (or documented Storefront delegation)
- [ ] CRUD scaffolds → full forms matching §30 modals (vendor, contact, fuel, issue)

### Exit criteria

- [ ] G047–G050, G088, G087, G097 → **Done**
- [ ] GAPS §29 management sub-routes ≥ 80% ✅
- [ ] GAPS §37: `vehicle-actions`, `place-actions`, `driver-actions` ≥ 70%

### Primary files

`pages/fleetops/management/*`, `components/fleetops/detail/*`, `domain/fleetops/detail/registry.js`

---

## Phase 4 — Enterprise modules depth

**Goal:** Connectivity, maintenance, analytics, service rates — import/export, telematics, advanced APIs.

| | |
|--|--|
| **Parity** | ~75% → **~83%** |
| **Duration** | 16–20 engineer-weeks |
| **Risk** | High |
| **Depends on** | Phase 1; Phase 3 for fleet/vendor assign patterns |

### G-IDs

| ID | Gap | Priority |
|----|-----|----------|
| G011 | Service rates CRUD — full | P2 |
| G018–G022 | Telematics, devices, sensors, events, tracking hub | P2 |
| G023–G027 | Maintenance schedules, records, WO, equipment, parts | P3 |
| G028 | Analytics reports + result route | P3 |
| G091 | Telematics providers / discover / link-device | P2 |
| G092 | Maint schedule pause/trigger/ical + line-items | P3 |
| G093 | Work order send email | P3 |
| G094 | Per-entity import/export/bulk-delete on lists | P2 |
| G085 | Vehicle-devices junction admin | P3 |
| G086 | Service quotes + Stripe (if in scope) | P2 |

### Deliverables

- [ ] Service rates: for-route picker, export, full form registries
- [ ] Telematics onboarding wizard (providers, test, link)
- [ ] Devices/sensors/events: filters, detail drawers, not scaffold-only tables
- [ ] Tracking hub: wire `fleet-ops/live/*` (**G090**)
- [ ] Maintenance: schedule lifecycle APIs; WO email; record line-items
- [ ] Reports: new/edit builder + **result** sub-route + export
- [ ] All management/connectivity/maintenance lists: import/export/bulk-delete

### Exit criteria

- [ ] G011, G018–G028, G091–G094, G085 → **Done** or deferred with sign-off
- [ ] GAPS §35 connectivity + maintenance groups: Service + UI ✅
- [ ] GAPS §37 scaffold `*-actions` services ≥ 60%

---

## Phase 5 — Settings, geo & live maps

**Goal:** FleetOps settings mount, service areas/zones, geofence, payments, notifications.

| | |
|--|--|
| **Parity** | ~83% → **~88%** |
| **Duration** | 12–16 engineer-weeks |
| **Risk** | Medium–high |
| **Depends on** | Phase 4 (tracking hub); Phase 2 (routing settings keys) |

### G-IDs

| ID | Gap | Priority |
|----|-----|----------|
| G029 | FleetOps settings (7 areas) | P2 |
| G030 | Navigator app admin + QR/deep link | P2 |
| G031 | Custom fields + groups | P2 |
| G045 | Service areas & zones admin | P2 |
| G046 | Geofence map draw | P2 |
| G089 | Geofence events / inventory / dwell / history | P2 |
| G090 | `fleet-ops/live/*` on tracking hub | P2 |
| G096 | FleetOps settings API (notifications, entity-editing, metrics) | P2 |
| G051 | Dashboard Ember key-metrics widget | P2 |
| G052 | Auth Track Order link | P2 |

### Deliverables

- [ ] Settings: routing, orchestrator, scheduling, **notifications**, **avatars**, **payments** + Stripe onboard
- [ ] Navigator settings page + admin panel parity
- [ ] Custom fields manager + groups; per-entity render on forms
- [ ] Service area map editor + zone form/view modals
- [ ] Geofence draw (Leaflet draw stack); dwell/inventory reports
- [ ] Live layers on tracking; `fleet-ops/metrics` on dashboard
- [ ] Auth screen: Track Order entry

### Exit criteria

- [ ] G029–G031, G045–G046, G089–G090, G096, G051–G052 → **Done**
- [ ] GAPS §38 settings templates ✅
- [ ] GAPS §22 geofencing checklist complete

---

## Phase 6 — Platform polish & extensions

**Goal:** Power-user orders UX, extension registries, i18n, console integration.

| | |
|--|--|
| **Parity** | ~88% → **~92%** |
| **Duration** | 6–8 engineer-weeks |
| **Risk** | Low–medium |
| **Depends on** | Phases 1–3 |

### G-IDs

| ID | Gap | Priority |
|----|-----|----------|
| G032 | Order extension virtual tabs | P2 |
| G033 | 18-column orders table | P2 |
| G034 | URL-synced list filters/layout | P2 |
| G035 | Map list overlay + multi-select | P2 |
| G036 | Kanban filter by order-config type | P2 |
| G053 | Extension form registries (all entities) | P2 |
| G057 | i18n / localization | P3 |
| G059 | Tenant branding API persist | P2 |
| G078 | Map context menus (vehicle/driver) | P3 |
| G077 | Position playback on map | P3 |

### Deliverables

- [ ] Orders: 18 columns, persisted layout, URL query sync
- [ ] Kanban: filter by order-config type
- [ ] Extension virtual tabs on order detail; payload entity form registry
- [ ] All §38 `*:form:details` registries or documented N/A
- [ ] Map context menus; position replay component
- [ ] i18n pass on FleetOps strings; branding API persist
- [ ] Header shortcuts: rates, devices, reports, orchestrator (GAPS §21)

### Exit criteria

- [ ] G032–G036, G053, G057, G059, G077–G078 → **Done**
- [ ] GAPS §38 registry keys: ✅ or N/A with owner
- [ ] Command palette includes all major routes

---

## Phase 7 — Backend-only product areas

**Goal:** APIs that exist on server (and sometimes Ember components) but have no React module yet.

| | |
|--|--|
| **Parity** | ~92% → **~95%** |
| **Duration** | 4–6 engineer-weeks |
| **Risk** | Medium |
| **Depends on** | Phases 1–4 |

### G-IDs

| ID | Gap | Priority |
|----|-----|----------|
| G079 | Warranties module | P3 |
| G080 | Manifests + manifest-stops | P3 |
| G081 | Payloads + entities admin | P2 |
| G082 | Proofs resource admin | P3 |
| G083 | Purchase rates UI | P3 |
| G084 | Tracking numbers / statuses admin | P3 |

### Deliverables

- [ ] New routes (or folded pages): warranties, manifests, payloads admin, entities admin
- [ ] Proofs admin; purchase rates; tracking number admin
- [ ] `fleetopsService` methods for each §35.11 resource
- [ ] Ember component parity spot-check: `components/warranty/*`, manifest flows

### Exit criteria

- [ ] G079–G084 → **Done**
- [ ] GAPS §36 table: all rows ✅
- [ ] GAPS §35.11: Service + UI ✅

---

## Phase 8 — QA, roles & production hardening

**Goal:** Sign off console for all FleetOps roles; empty §20 “Not ready” list.

| | |
|--|--|
| **Parity** | ~95% → **~98–100%** |
| **Duration** | 6–8 engineer-weeks |
| **Risk** | Low |
| **Depends on** | Phases 1–7 |

### G-IDs

| ID | Gap | Priority |
|----|-----|----------|
| G074 | 10 FleetOps roles — UI QA matrix | P1 |
| G058 | E2E: routes, orchestrator, rates, all modules | P2 |
| G075 | Customer portal engine hook | P2 |
| G076 | Driver/customer invite & onboard | P2 |

### Deliverables

- [ ] Role matrix (GAPS §32): Operations Manager, Fleet Supervisor, Service Coordinator, Operations Administrator, Maintenance Technician, Driver Coordinator, Navigator App Manager, Driver, Fleet-Ops Customer, Fleet-Ops Contact
- [ ] E2E suite: every Phase 1–7 exit path + regression G061–G070
- [ ] Load test: orders pagination; map with 500 markers
- [ ] `npm run build` + `verify:release`; security review permissions
- [ ] GAPS §29: every row ✅ or accepted 🟡 with ticket
- [ ] GAPS §20 production “Not ready” → empty

### Exit criteria

- [ ] **100% console parity sign-off** (product owner)
- [ ] G074, G058 → **Done**
- [ ] All §39 checklist items in GAPS §40 satisfied

---

## Phase 9 — Field & portals *(out of console %)*

**Not counted in Phases 1–8 parity %** — separate repos and release trains. Track after or parallel to Phase 8 if business requires full product story.

| | |
|--|--|
| **Scope** | Navigator mobile, customer portal, contact portal |
| **Duration** | 8–12+ engineer-weeks (mobile + 2 portals) |
| **Codebases** | `fleet_mobile-main/frontend`, portal routes TBD |

### G-IDs

| ID | Gap |
|----|-----|
| G060 | Navigator POD (signature / photo / QR) |
| G071 | Navigator driver app (full) |
| G072 | Fleet-Ops Customer portal (full UI) |
| G073 | Fleet-Ops Contact portal (full UI) |

See GAPS §24, §33 for API boundaries.

---

## Dependency graph

```
Phase 1 (foundation)
    ├──> Phase 2 (planning)
    ├──> Phase 3 (entities) ──> Phase 4 (enterprise modules)
    │                                    │
    └────────────────────────────────────┴──> Phase 5 (settings/geo)
                                                      │
                                              Phase 6 (platform)
                                                      │
                                              Phase 7 (backend-only)
                                                      │
                                              Phase 8 (QA/sign-off)

Phase 9 (field/portals) — parallel optional track
```

**Safe parallelization after Phase 1:**

| Track | Phases |
|-------|--------|
| Planning | 2 |
| Management depth | 3 |
| Enterprise modules | 4 (after 3 for assign patterns) |
| Settings/geo | 5 (after 4 for live API) |

---

## Phase ↔ GAPS cross-reference

| This doc | GAPS §39 | GAPS §18 wave |
|----------|----------|---------------|
| Phase 1 | A | Wave A |
| Phase 2 | B | Wave B |
| Phase 3 | C | Wave C |
| Phase 4 | D | Wave D |
| Phase 5 | E | Wave E |
| Phase 6 | F | Wave F |
| Phase 7 | G | — |
| Phase 8 | H | Hardening |
| Phase 9 | Out of repo | — |

---

## Verification checklist (100% done)

Copy into release ticket when Phase 8 completes:

- [ ] GAPS §27: no **Open** G001–G097 for console scope (Phase 9 optional)
- [ ] GAPS §28: no ❌ without signed deferral
- [ ] GAPS §35: API rows have Service + UI ✅
- [ ] GAPS §37: service targets met
- [ ] GAPS §38: registries ✅ or N/A
- [ ] GAPS §32: all 10 roles passed QA
- [ ] GAPS §20: production ready

---

## Document history

| Version | Change |
|---------|--------|
| 1.0 | Replaces `FLEETOPS-4DAY-PLAN.md`; ordered Phases 1–9 from GAPS v3.1 §39 (+52% work) |

*Execution plan only — do not duplicate gap lists here; update [FLEETOPS-GAPS.md](./FLEETOPS-GAPS.md) when gaps close.*
