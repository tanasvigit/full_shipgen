# YMS Backend — Implementation Reference

Aligned with `backend/` as of June 2026. Code wins over older notes.

## Runtime

- **Entry:** `server.py` — FastAPI app, `/api` router, CORS from `CORS_ORIGINS`.
- **DB:** PostgreSQL via `asyncpg`; pool in `db.py`; **`create_schema()` on startup** (no Alembic).
- **Config:** `.env` — `DATABASE_URL`, `CORS_ORIGINS`, `YMS_AUTH_MODE`, `YMS_DEFAULT_ROLE`.

---

## Tables

| Table | PK | Purpose |
|-------|-----|---------|
| `status_checks` | `id` UUID | Legacy health/demo inserts |
| `vehicles` | `id` UUID | Fleet master |
| `appointments` | `id` UUID | Bookings linked to `vehicles` |
| `queue_entries` | `id` UUID | Virtual queue (1:1 `appointment_id`) |
| `docks` | `id` UUID | Dock bays |
| `yard_events` | `id` UUID | Audit / timeline |
| `equipment` | `id` UUID | Yard equipment |
| `labor_teams` | `id` UUID | Labor teams |
| `detention_records` | `id` UUID | Billing / detention rows |

**Not stored:** yard zones, GIS positions, AI models, containers, customs, ports, freight, vendors.

Schema DDL: `db.py` (`create_schema`). Seed: default `equipment` and `labor_teams` rows if tables empty.

---

## Services

| Module | File | Responsibility |
|--------|------|----------------|
| Core YMS | `services/yms_service.py` | CRUD + flow (check-in, call, assign dock, transitions) + yard events |
| List queries | `services/list_filters.py` | Shared SQL filters + pagination |
| Equipment | `services/equipment_service.py` | CRUD, assign, status shortcuts, yard events |
| Labor | `services/labor_service.py` | CRUD, assign, status shortcuts, yard events |
| Detention | `services/detention_service.py` | Derive/upsert records, summary, status updates |
| Search | `services/search_service.py` | `GET /search` cross-entity ILIKE |
| Auth | `auth_rbac.py` | Roles, permissions, FastAPI dependencies |

Enums / transitions: `enums.py` (`YMS_STATUSES`, `DOCK_STATUSES`, `EQUIPMENT_STATUSES`, `LABOR_STATUSES`, `DETENTION_STATUSES`, `STATUS_TRANSITIONS`).

---

## Routers (under `/api`)

| Router | File |
|--------|------|
| Status | `routers/status.py` |
| Auth | `routers/auth.py` |
| Search | `routers/search.py` |
| YMS | `routers/yms.py` |

List response helper: `routers/list_response.py` — array vs `{ items, total, skip, limit }`.

---

## Auth / RBAC foundation

**Headers (required for correct role in strict mode):**

- `X-YMS-Role`: `admin` | `operations` | `gate` | `supervisor` | `read_only`
- `X-YMS-User`: opaque user id (default `anonymous`)

**Environment:**

- `YMS_AUTH_MODE=dev` (default) — missing/invalid role falls back to `YMS_DEFAULT_ROLE` (default `operations`).
- `YMS_AUTH_MODE=strict` — invalid role → 401.

**Permission strings** (mutations only; GET list/detail generally open):

| Permission | Typical endpoints |
|------------|-------------------|
| `vehicle.write` | POST/PATCH `/vehicles` |
| `appointment.write` | POST/PATCH `/appointments` |
| `queue.write` | POST/PATCH `/queue-entries` |
| `dock.write` | POST/PATCH `/docks` |
| `flow.check_in` | POST `/flow/check-in` |
| `flow.call` | POST `/flow/.../call` |
| `flow.assign_dock` | POST `/flow/.../assign-dock` |
| `flow.vehicle_transition` | POST `/flow/vehicles/.../transition` |
| `detention.write` | PATCH `/detention/{id}/status` |
| `equipment.write` | Equipment mutations |
| `labor.write` | Labor mutations |
| `yard_event.write` | POST `/yard-events` |

**Role matrix (summary):**

- `admin` — all permissions (`*`)
- `operations` — vehicle, appointment, queue, dock, call, assign, transition, equipment, labor, yard events
- `gate` — check-in, appointment, queue
- `supervisor` — call, assign, transition, detention, queue, appointment
- `read_only` — no writes

Auth endpoints (no permission guard): `GET /auth/me`, `GET /auth/roles`, `GET /auth/permissions`.

**Not implemented:** login, password, JWT, OAuth, session store, API keys.

---

## Pagination and filtering

Applied in service layer via `list_filters.query_rows()`.

| Endpoint | Filters | Pagination |
|----------|---------|------------|
| `GET /vehicles` | `q`, `status`, `ownership_type` | `skip`, `limit` |
| `GET /appointments` | `q`, `status`, `date_from`, `date_to` | `skip`, `limit` |
| `GET /queue-entries` | `q`, `status`, `dock_id` | `skip`, `limit` |
| `GET /docks` | `q`, `status` | `skip`, `limit` |
| `GET /yard-events` | `q`, `date_from`, `date_to` | `skip`, `limit` |
| `GET /equipment` | `q`, `status`, `category`* | `skip`, `limit` |
| `GET /labor` | `q`, `status` | `skip`, `limit` |
| `GET /detention` | `q`, `status` on bundle records | N/A (bundle shape) |

\* `category` filter is exposed on equipment list; equipment DDL uses `equipment_type` / `model` — verify column exists in your DB if filter fails.

**Defaults:** no `limit` → return up to **1000** rows as JSON array. With `limit` → paginated object, max 500.

---

## Search endpoint

`GET /search?q={text}&limit_per_group={1-20}`

- Parallel ILIKE queries across operational tables.
- Detention: filter in-memory after `list_detention_records()`.
- Response: `{ results: SearchHit[], unavailable: [{ kind: "ai", reason: "..." }] }`.
- **No auth guard** on search (read-only data).

---

## Flow / sync behavior

State changes write **`yard_events`** and update entity rows in transactions where applicable.

| Flow step | Endpoint | Side effects |
|-----------|----------|--------------|
| Check-in | `POST /flow/check-in` | Creates `queue_entries`, updates appointment/vehicle status, events |
| Call | `POST /flow/queue-entries/{id}/call` | Sets called time/status, events |
| Assign dock | `POST /flow/queue-entries/{id}/assign-dock` | Links dock, events |
| Vehicle transition | `POST /flow/vehicles/{id}/transition` | Validates `STATUS_TRANSITIONS`, events |

**Frontend sync** is not server-push: clients call `notifyYmsDataChanged()` after mutations (see `update.md`).

**Priority score:** `calculate_priority_score(priority, reporting_time)` on queue create.

---

## Detention domain

- `GET /detention` returns `{ records, summary, config }`.
- Records are **derived** from active queues/vehicles + existing `detention_records`, then upserted in `list_detention_records()`.
- `is_estimated` on rows; status workflow via `DETENTION_STATUS_TRANSITIONS`.
- Config from `get_detention_config()` (rates/thresholds in service).

---

## Equipment and labor

- Full CRUD + assign/release + status shortcut POST routes.
- Assignment may require minimum battery (`EQUIPMENT_MIN_ASSIGN_BATTERY`).
- Actions log `yard_events` with `equipment_id` / `labor_id`.

---

## Yard events

Central audit log. Optional FKs: `vehicle_id`, `appointment_id`, `queue_entry_id`, `dock_id`, `equipment_id`, `labor_id`.

Loading exception types include `LOADING_PAUSED`, `LOADING_MATERIAL_SHORTAGE`, etc. (created from frontend loading ops).

---

## Status checks (legacy)

`GET /api/`, `POST /api/status`, `GET /api/status` — demo/health; unrelated to YMS operations.

---

## Known assumptions

1. Single-tenant yard; no multi-facility id on rows.
2. UUID primary keys generated in application code.
3. Timestamps stored as `TIMESTAMPTZ`; client charts often use **UTC** day boundaries.
4. `queue_entries.appointment_id` is **UNIQUE** (one queue row per appointment).
5. Vehicle lifecycle enforced only when using transition API / service validators.

---

## Known limitations

- No login/session auth.
- No containers, customs, ports, freight, vendors, AI backend.
- No WebSockets / SSE for live updates.
- No idempotency keys on flow endpoints.
- No dedicated read replicas or materialized views for KPIs.
- Schema migrations not versioned.
- Automated tests not bundled in repo note.
- Control Tower / Executive KPI aggregation is **frontend-only**.

---

## Related docs

- `../docs/API_INVENTORY.md` — route catalog
- `../docs/DATA_MODEL_ERD.md` — ERD
- `../update.md` — project status
