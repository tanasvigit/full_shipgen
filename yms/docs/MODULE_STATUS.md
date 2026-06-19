# Module Status Summary — Smart Yard / YMS

Per-module checklist against the codebase (June 2026).

Legend: **Live** = PostgreSQL via `/api`; **Mock** = `frontend_1/src/data/db.js`; **Derived** = computed client-side or upserted by service.

---

## Control Tower (`/`)

| Aspect | Status |
|--------|--------|
| Page | `pages/Dashboard.jsx` |
| API layer | `services/controlTowerApi.js` |
| Data | **Live** — vehicles, appointments, queue, docks, yard-events |
| Refresh | 30s interval; pause toggle; `yms-data-changed` |
| KPIs | Mix of **live counts** and **estimates** (capacity 72, fuel, CSAT, detention exposure) |
| Charts | Throughput 24h, vehicle mix, zones, detention by category — from live events/lists |
| Recommendations | Rule-based heuristics, not ML |
| Export | Daily report uses live KPIs (`utils/dailyReport.js`) |
| Doc | `frontend_1/CONTROL_TOWER_NOTE.md` |

---

## Virtual Queue (`/queue`)

| Aspect | Status |
|--------|--------|
| API | `ymsApi` list/patch, `callQueueEntry` |
| Sync | Emits + listens `yms-data-changed` |
| Reorder | PATCH `priority_score`; notify after `persistOrder` |
| Limitation | Failed priority API keeps local order without notify |

---

## Appointments (`/appointments`)

| Aspect | Status |
|--------|--------|
| API | `appointmentsApi.js` |
| Actions | Book, reschedule, cancel, status transitions → API + notify |
| Sync | Listener on `yms-data-changed` |
| Drawer | `AppointmentDrawer.jsx` — live |

---

## Gate Management (`/gate`)

| Aspect | Status |
|--------|--------|
| API | `gateManagementApi.js` |
| Actions | Lookup, approve, reject, check-in → API + notify |
| Sync | Listener; silent reload re-fetches selected vehicle context |
| Validation | Client-side rules (documents, weight from remarks, etc.) |

---

## Docks (`/docks`)

| Aspect | Status |
|--------|--------|
| API | `docksApi.js` |
| Actions | Assign, release, complete loading, block — API + notify |
| Sync | Listener |
| Metrics | Utilization / ETA **derived** in service |

---

## Loading Ops (`/loading`)

| Aspect | Status |
|--------|--------|
| API | `loadingOpsApi.js` |
| Rows | Active `DOCK_ASSIGNED` / `LOADING` queue entries |
| Exceptions | Parsed from `yard_events` (`parseExceptions` — safe timestamps) |
| Progress | **Estimated** via `estimateProgress` |
| Sync | Listener + notify on mutations |

---

## Equipment (`/equipment`)

| Aspect | Status |
|--------|--------|
| API | `equipmentApi.js` |
| Backend | Full CRUD + assign + status shortcuts |
| Seed | Default rows if empty (`db.py`) |
| Sync | Listener + notify |

---

## Labor (`/labor`)

| Aspect | Status |
|--------|--------|
| API | `laborApi.js` |
| Backend | Full CRUD + assign + status shortcuts |
| Seed | Default teams if empty |
| Sync | Listener + notify |

---

## Yard Map (`/yard`)

| Aspect | Status |
|--------|--------|
| API | `yardMapApi.js`, `ymsApi`, `docksApi` |
| Zones | **Derived** — no `zones` table |
| Positions | Grid slots by plate, not GPS |
| Sync | Listener + notify on zone moves |
| Doc | `YARD_MAP_NOTE.md` (repo root) |

---

## Detention (`/detention`)

| Aspect | Status |
|--------|--------|
| API | `detentionApi.js` → `GET /detention`, PATCH status |
| Records | **Derived/upserted** in `detention_service` |
| Refresh | 30s + listener + manual |
| Export | CSV/PDF from live rows |
| Doc | `DETENTION_NOTE.md` |

---

## Executive KPIs (`/kpis`)

| Aspect | Status |
|--------|--------|
| API | `executiveKpisApi.js` — parallel fetch + client scorecard |
| Detention tile | **Billed** `summary.today` from `/detention` |
| Trends | 7-day reconstructed from events/vehicles |
| Errors | Per-source `fetchErrors`; partial render |
| Refresh | 30s + listener |
| Doc | `frontend_1/EXECUTIVE_KPI_NOTE.md` |

---

## Resources → Vehicles (`/vehicles`) — DEFERRED

| Aspect | Status |
|--------|--------|
| Data | **Mock-only** `VEHICLES` in `db.js` |
| API | Backend `/vehicles` exists but **page not wired** |
| Drawer | `VehicleDrawer` can load **live** when opened from queue/search |

---

## Control → AI Insights (`/ai`) — DEFERRED

| Aspect | Status |
|--------|--------|
| Data | **Mock-only** `AI_INSIGHTS` in `db.js` |
| Search | Listed as **unavailable** in global search |
| Backend | No AI endpoints |

---

## Platform features

| Feature | Status |
|---------|--------|
| Global search | **Live** `jumpToApi.js` → `/search` |
| Auth/RBAC | Header roles; mutation guards; dev role switcher |
| Pagination | Backend optional `limit`; frontends still use full lists |
| Cross-module sync | `notifyYmsDataChanged` event bus |
| `db.js` remaining uses | Vehicles, AI, COMPANY branding, unused event feed |

---

## Intentionally deferred (product)

- Wire `/vehicles` page to API
- Replace AI Insights with real service or remove route
- Login / JWT
- Server-side KPI/tower aggregates
- Zone master table / GIS
- Containers, customs, ports, freight, vendors
