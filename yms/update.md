# Smart Yard / YMS — Project Status (Master)

Last aligned with codebase: **June 2026**. This document reflects the **actual** implementation, not aspirational scope.

## Stack

| Layer | Location | Notes |
|-------|----------|--------|
| Frontend | `frontend_1/` (React, CRACO, React Router) | Default API: `http://localhost:8001/api` |
| Backend | `backend/` (FastAPI, asyncpg) | Schema created on startup in `db.py` |
| Database | PostgreSQL | Docker Compose in `docker-compose.yml` |

---

## Module status summary

| Module | Route | Data | Sync | Notes |
|--------|-------|------|------|--------|
| **Control Tower** | `/` | **Live** API | 30s timer + `yms-data-changed` | Several KPIs **estimated** (see `CONTROL_TOWER_NOTE.md`) |
| **Virtual Queue** | `/queue` | **Live** | Listener + emits on call/reorder | Priority persist via PATCH queue |
| **Appointments** | `/appointments` | **Live** | Listener + emits on book/status | Book Slot creates vehicle + appointment |
| **Gate Management** | `/gate` | **Live** | Listener + emits on approve/reject/check-in | Validation rules client-side |
| **Docks** | `/docks` | **Live** | Listener + emits on assign/release | Utilization derived client-side |
| **Loading Ops** | `/loading` | **Live** | Listener + emits on actions | Progress **estimated**; exceptions from `yard_events` |
| **Equipment** | `/equipment` | **Live** | Listener + emits on assign/status | Seed data if table empty |
| **Labor** | `/labor` | **Live** | Listener + emits on assign/status | Seed data if table empty |
| **Yard Map** | `/yard` | **Live** | Listener + emits on zone actions | **Zones derived** — no zone table |
| **Detention** | `/detention` | **Live** | 30s timer + listener + emits | Records **derived/upserted** from queue + events |
| **Executive KPIs** | `/kpis` | **Live** API | 30s timer + `yms-data-changed` | Client-side scorecard; partial fetch degradation |
| **Vehicles** | `/vehicles` | **Mock-only** (`db.js`) | None | **Deferred** — not wired to `/vehicles` API |
| **AI Insights** | `/ai` | **Mock-only** (`db.js`) | None | **Deferred** — no AI backend |

Detail: `docs/MODULE_STATUS.md`.

---

## Completion tiers

### Complete (live backend, operational UI)

- YMS core entities: vehicles, appointments, queue, docks, yard events (API + DB).
- Operational pages: Appointments, Gate, Virtual Queue, Docks, Loading Ops, Equipment, Labor, Detention.
- Control Tower and Executive KPIs (live fetch, client aggregation).
- Yard Map (live entities, derived zones).
- Global jump-to search (`GET /api/search`) — no `db.js` for operational entities.
- Cross-page sync via `notifyYmsDataChanged()` / `yms-data-changed`.
- Auth/RBAC **foundation** (header roles, mutation guards).
- List endpoint **pagination/filtering** (optional; backward compatible).

### Partially complete

| Area | What works | What is estimated / limited |
|------|------------|------------------------------|
| Control Tower | Live lists, charts, recommendations | Yard capacity 72, fuel 6 L/vehicle, CSAT proxy, detention **exposure** (not billed), zones inferred |
| Executive KPIs | Live scorecard, 7-day trends, export | Same proxies; yesterday/7d reconstructed from current data |
| Detention | Live records, status updates, export | Auto-derived rows; `is_estimated` flag; billing rules in service |
| Loading Ops | Live queue/dock rows, exceptions | Progress % from time heuristics |
| Yard Map | Live vehicle positions in zones | Zone assignment algorithm, not GIS |
| Daily Report PDF | Live KPIs, detention, docks, recommendations | `COMPANY` branding still from `db.js` |
| Auth | Role headers, 403 on mutations | No login, JWT, or server-side user store |
| Global search | Live operational entities | AI Insights explicitly **unavailable** |

### Mock-only (intentionally deferred)

- **Resources → Vehicles** (`pages/Vehicles.jsx` → `VEHICLES` in `data/db.js`).
- **Control → AI Insights** (`pages/AiInsights.jsx` → `AI_INSIGHTS` in `data/db.js`).
- **`hooks/useEventFeed.js`** — mock feed; **not used** by any page currently.
- **`data/db.js`** — still holds `COMPANY`, legacy KPI mocks, vehicles, AI; used only where listed above.

### Intentionally not implemented (backend / product)

- True login / session / JWT auth.
- Containers, customs, ports, freight, vendors domains.
- AI/ML inference backend.
- Dedicated aggregation APIs (`/control-tower`, `/executive-kpis`).
- Yard **zone** table / GIS coordinates.
- Telematics, real CSAT, yard capacity API.
- Migration framework (schema via `create_schema()` on startup).
- Automated API contract tests.

---

## Backend domains (current)

| Domain | Table(s) | Service | Router prefix |
|--------|----------|---------|---------------|
| Vehicles | `vehicles` | `yms_service` | `/api/vehicles` |
| Appointments | `appointments` | `yms_service` | `/api/appointments` |
| Queue | `queue_entries` | `yms_service` | `/api/queue-entries` |
| Docks | `docks` | `yms_service` | `/api/docks` |
| Yard audit | `yard_events` | `yms_service` | `/api/yard-events` |
| Flow | (updates above) | `yms_service` | `/api/flow/*` |
| Equipment | `equipment` | `equipment_service` | `/api/equipment` |
| Labor | `labor_teams` | `labor_service` | `/api/labor` |
| Detention | `detention_records` | `detention_service` | `/api/detention` |
| Search | (multi-table) | `search_service` | `/api/search` |
| Auth | (in-memory RBAC) | `auth_rbac` | `/api/auth/*` |
| Health | `status_checks` | `status` router | `/api/`, `/api/status` |

Full API list: `docs/API_INVENTORY.md`. Data model: `docs/DATA_MODEL_ERD.md`.

---

## Frontend live API services

| Service | Used by |
|---------|---------|
| `ymsApi.js` | Base HTTP + auth headers |
| `controlTowerApi.js` | Dashboard `/` |
| `executiveKpisApi.js` | KPIs `/kpis`, daily report |
| `appointmentsApi.js` | Appointments, Gate, Book Slot |
| `gateManagementApi.js` | Gate; **`notifyYmsDataChanged()`** |
| `docksApi.js` | Docks, Loading Ops, Yard Map |
| `loadingOpsApi.js` | Loading Ops |
| `detentionApi.js` | Detention |
| `equipmentApi.js` | Equipment |
| `laborApi.js` | Labor |
| `yardMapApi.js` | Yard Map |
| `jumpToApi.js` | Global search |
| `authApi.js` / `authStorage.js` / `AuthContext.jsx` | Role headers, permissions |

---

## Cross-module sync model

```
Mutation (gate, appointments, queue, docks, loading, detention, equipment, labor, yard map)
    → API success
    → notifyYmsDataChanged()  // gateManagementApi.js
    → window event "yms-data-changed"
    → listeners on pages call silent reload
```

**Emitters:** `gateManagementApi`, `appointmentsApi`, `docksApi`, `loadingOpsApi`, `detentionApi`, `equipmentApi`, `laborApi`, Virtual Queue (call + reorder), Yard Map.

**Listeners:** Dashboard, KPIs, Appointments, Gate, Virtual Queue, Docks, Loading Ops, Detention, Equipment, Labor, Yard Map.

**Auto-refresh (30s):** Dashboard, Executive KPIs, Detention.

**Global search:** Live `GET /api/search`; does not use `db.js`.

---

## Auth / RBAC status

- **Implemented:** Roles `admin`, `operations`, `gate`, `supervisor`, `read_only`; `X-YMS-Role` / `X-YMS-User` headers; `require_permission()` on mutations; `GET /auth/me`, `/auth/roles`, `/auth/permissions`.
- **Dev default:** `YMS_AUTH_MODE=dev`, default role `operations` if header omitted.
- **Frontend:** `AuthProvider`, role switcher in TopNav (dev), all `ymsApi` requests send headers.
- **Not implemented:** Login UI, JWT, refresh tokens, per-user audit beyond `created_by` strings.

---

## Pagination / filtering status

- List routes support `q`, `status`, and entity-specific filters; `skip` + `limit` for paging.
- **Without `limit`:** response is a JSON **array** (existing frontends unchanged).
- **With `limit`:** `{ items, total, skip, limit }`.
- Cap: 1000 rows default per query; max `limit` 500.

---

## Known remaining gaps

1. Vehicles page and AI Insights still mock.
2. No server-side Control Tower or KPI aggregation endpoints.
3. Control Tower detention widget uses **estimated exposure**, not `detention_records` totals.
4. Equipment list filter `category` in API may not match DB column (equipment table has no `category` column in schema).
5. Gate selected-vehicle panel relies on re-lookup on background refresh.
6. Virtual Queue: if priority API fails, local order kept without global notify.
7. `read_only` role can read all GET endpoints but cannot mutate (403).

---

## Related documentation

| Document | Purpose |
|----------|---------|
| `backend/YMS_BACKEND_NOTE.md` | Backend tables, endpoints, auth, limits |
| `frontend_1/CONTROL_TOWER_NOTE.md` | Dashboard metrics and estimates |
| `frontend_1/EXECUTIVE_KPI_NOTE.md` | KPI scorecard and trends |
| `docs/API_INVENTORY.md` | Full route catalog |
| `docs/DATA_MODEL_ERD.md` | Tables and relationships |
| `docs/ROUTE_INVENTORY.md` | Frontend + backend routes |
| `docs/MODULE_STATUS.md` | Per-module checklist |

---

## Quick start

```bash
# From yard_frontend/
docker compose up
# Frontend: http://localhost:3000
# API: http://localhost:8001/api
```

Set `REACT_APP_API_BASE_URL` if the API host differs. For RBAC testing, use TopNav → user menu → role, or send `X-YMS-Role: read_only` on API calls.
