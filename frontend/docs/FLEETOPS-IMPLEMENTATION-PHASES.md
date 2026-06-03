# FleetOps React — Implementation Phases (48% → 100%)

**Canonical execution plan.** Gap inventory and audit detail live in [FLEETOPS-GAPS.md](./FLEETOPS-GAPS.md) (v3.9).

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

## Phase 1 — Dispatcher foundation ✅ **Complete** (2026-05-30)

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

- [x] Orders list: server `page` / `limit` / `sort` / filter query params; no client-only pagination at scale
- [x] Schedule dialog + bulk schedule hooks wired to `PATCH orders/schedule`
- [x] `useFleetopsAbility` / route guards: deny when permissions unknown (fail-closed)
- [x] Order drawer: payload waypoints, metadata modal, inline notes
- [x] Import on create flow; delete order with confirm
- [x] E2E: pagination smoke + permission denied paths

### Exit criteria

- [x] 10k+ orders tenant: list loads &lt; 3s with filters
- [x] G001, G003, G002, G055 → **Done** in §27
- [x] GAPS §35 orders rows: search/types wired or documented N/A

### Primary files

`pages/fleetops/OrdersList.jsx`, `hooks/fleetops/useOrdersListPage.js`, `services/fleetops.js`, `hooks/fleetops/useFleetopsAbility.js`

---

## Phase 2 — Planning & orchestration ✅ **Complete** (2026-05-30)

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

- [x] Routes: create → optimize (VROOM/OSRM) → save → assign to orders
- [x] Orchestrator: preview, commit, run, **import orders**, engine list, order-config fields
- [x] `/fleet-ops/operations/schedule` fleet view + bulk assign windows
- [x] Orders map: multi-select → “Optimize routes”; list overlay parity
- [x] `order-allocation` / `vroom-allocation-engine` / `osrm` service layer in React
- [x] Order config manager: conditional flow editor

### Exit criteria

- [x] Planner E2E: 20 stops → optimized route → saved → linked order
- [x] G004–G010, G037, G042–G043, G095 → **Done** or signed partial with ticket
- [x] GAPS §37: `route-optimization*`, `orchestration-engine*`, `vroom-allocation-engine`, `osrm` ≥ 70%

### Parallel streams

| Stream | Focus |
|--------|--------|
| FE-A | Routes UI + map polyline |
| FE-B | Orchestrator + import |
| FE-C | Fleet schedule + bulk |
| BE | VROOM/OSRM proxy, orchestrator APIs |

---

## Phase 3 — Entity depth (management) ✅ **Complete** (2026-05-30)

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

- [x] Vehicle detail: **Devices**, **Work orders** tabs (API + UI)
- [x] Place detail: comments, documents, rules (meta persistence; frequency map deferred)
- [x] Driver: assign-order modal; schedule/HOS from API
- [x] Fleet detail: assign/remove driver & vehicle
- [x] Vendor personnel sub-route; integrated vendor **supported** providers panel
- [x] `/fleet-ops/management/customers` + reset-credentials modal
- [x] CRUD scaffolds → expanded forms (vendor, contact, fuel, issue, integrated vendor)

### Exit criteria

- [x] G047–G050, G088, G087, G097 → **Done**
- [x] GAPS §29 management sub-routes ≥ 80% ✅
- [x] GAPS §37: `vehicle-actions`, `place-actions`, `driver-actions` ≥ 70%

### Primary files

`pages/fleetops/management/*`, `components/fleetops/detail/*`, `domain/fleetops/detail/registry.js`

---

## Phase 4 — Enterprise modules depth ✅ **Complete** (2026-05-30)

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

- [x] Service rates: for-route picker, export, full form fields
- [x] Telematics onboarding wizard (providers, test, link)
- [x] Devices/sensors/events: filters, detail tabs, vehicle attach
- [x] Tracking hub: wire `fleet-ops/live/*` (**G090**)
- [x] Maintenance: schedule lifecycle APIs; WO email; record line-items
- [x] Reports: new/edit builder + **result** sub-route + export
- [x] CRUD lists: import/export via `CrudImportExportBar` (G094)
- [x] Vehicle-devices admin route (G085)
- [ ] G086 service-quotes/Stripe — **Partial** (deferred — no Stripe keys in deployment)

### Exit criteria

- [x] G011, G018–G028, G091–G094, G085, G090 → **Done**
- [x] G086 → **Partial** with sign-off note
- [x] GAPS §35 connectivity + maintenance groups: Service + UI ✅
- [x] GAPS §37 scaffold `*-actions` services ≥ 60%

---

## Phase 5 — Settings, geo & live maps ✅ **Complete** (2026-05-30)

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
| G096 | FleetOps settings API (notifications, entity-editing, metrics) | P2 |
| G051 | Dashboard Ember key-metrics widget | P2 |
| G052 | Auth Track Order link | P2 |

*G090 (`fleet-ops/live/*` on tracking hub) completed in Phase 4 — not in Phase 5 scope.*

### Deliverables

- [x] Settings: routing, orchestrator, scheduling, **notifications**, **avatars**, **payments** + Stripe onboard (onboard when API keys present)
- [x] Navigator settings page + admin panel parity (deep link, QR, link-app preview)
- [x] Custom fields manager + groups; per-entity render on forms (order, driver, vehicle, place)
- [x] Service area map editor + zone form/view modals
- [x] Geofence draw (Leaflet draw stack); dwell/inventory reports (`/fleet-ops/geo/geofences`)
- [x] `fleet-ops/metrics` on dashboard (**G051**)
- [x] Auth screen: Track Order entry (**G052**)

### Exit criteria

- [x] G029–G031, G045–G046, G089, G096, G051–G052 → **Done**
- [x] GAPS §38 settings templates ✅
- [x] GAPS §22 geofencing checklist complete

---

## Phase 6 — Platform polish & extensions ✅ **Complete** (2026-05-30)

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

- [x] Orders: 18 columns, persisted layout, URL query sync
- [x] Kanban: filter by order-config type
- [x] Extension virtual tabs on order detail; payload entity form registry
- [x] All §38 `*:form:details` registries or documented N/A (`registryManifest.js`)
- [x] Map context menus; position replay component
- [x] i18n pass on FleetOps strings; branding API persist
- [x] Header shortcuts: rates, devices, reports, orchestrator (GAPS §21)

### Exit criteria

- [x] G032–G036, G053, G057, G059, G077–G078 → **Done**
- [x] GAPS §38 registry keys: ✅ or N/A with owner
- [x] Command palette includes all major routes

---

## Phase 7 — Backend-only product areas ✅ **Complete** (2026-05-30)

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

- [x] New routes under `/fleet-ops/admin/*`: warranties, manifests, payloads, entities, proofs, purchase-rates, tracking-numbers/statuses
- [x] `fleetopsService` CRUD via `attachGenericCrud` + manifest API helpers
- [x] `FleetopsCrudListPage` / detail + `ManifestsList` / `ManifestDetail` (stops table)
- [x] Sidebar Resources section + command palette entries
- [x] E2E `e2e/fleetops/backend-modules.spec.ts`

### Exit criteria

- [x] G079–G084 → **Done**
- [x] GAPS §36 table: all rows ✅
- [x] GAPS §35.11: Service + UI ✅

---

## Phase 8 — QA, roles & production hardening ✅ **Complete** (2026-05-30)

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
| G074 | 10 FleetOps roles — UI QA matrix | P1 — **Done** |
| G058 | E2E: routes, orchestrator, rates, all modules | P2 — **Done** |
| G075 | Customer portal engine hook | P2 — Phase 9 |
| G076 | Driver/customer invite & onboard | P2 — Phase 9 |

### Deliverables

- [x] Role matrix — [FLEETOPS-ROLE-QA.md](./FLEETOPS-ROLE-QA.md) (GAPS §32)
- [x] E2E — `@smoke` / `@regression` in `e2e/fleetops/` + `test:e2e:fleetops:smoke`
- [x] Perf/security — [FLEETOPS-QA-HARDENING.md](./FLEETOPS-QA-HARDENING.md); DEPLOYMENT § performance
- [x] `npm run build` + `verify:release`; prod blocks `VITE_FLEETOPS_PERMISSIVE`
- [x] GAPS §29: console rows ✅ or 🟡 with FO-P9-* deferrals
- [x] GAPS §20 “Not ready” → empty for console (portals/mobile in §33 only)

### Exit criteria

- [x] Console parity **~98–100%** (engineering)
- [x] G074, G058 → **Done**
- [ ] **Product owner sign-off** on production deploy (see GAPS §40)

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
| 1.1 | Phases 1–5 marked complete (2026-05-30); parity ~88% |
| 1.2 | Phase 6 marked complete (2026-05-30); parity ~92% |
| 1.3 | Phase 7 marked complete (2026-05-30); parity ~95% |
| 1.4 | Phase 8 marked complete (2026-05-30); parity ~98–100%; G074/G058 Done |

*Execution plan only — do not duplicate gap lists here; update [FLEETOPS-GAPS.md](./FLEETOPS-GAPS.md) when gaps close.*
