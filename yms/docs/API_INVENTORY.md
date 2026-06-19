# API Inventory — Smart Yard / YMS

Base URL: `/api` (e.g. `http://localhost:8001/api`).

**Auth headers (all clients should send):**

- `X-YMS-Role` — see `backend/auth_rbac.py`
- `X-YMS-User` — optional identity string

**Pagination:** Unless noted, omitting `limit` returns a **JSON array**. With `limit`, response is `{ items, total, skip, limit }`.

---

## Auth

| Method | Route | Purpose | Auth |
|--------|-------|---------|------|
| GET | `/auth/me` | Current role and user id | Headers only |
| GET | `/auth/roles` | List valid role names | None |
| GET | `/auth/permissions` | Permissions for current role | Headers |

---

## Search

| Method | Route | Purpose | Input | Output | Auth | Paging/filter |
|--------|-------|---------|-------|--------|------|----------------|
| GET | `/search` | Global command-palette search | `q` (required), `limit_per_group` (1–20) | `{ results[], unavailable[] }` | None | N/A |

---

## Vehicles

| Method | Route | Purpose | Role (mutation) | Filters / paging |
|--------|-------|---------|-----------------|------------------|
| GET | `/vehicles` | List vehicles | — | `q`, `status`, `ownership_type`, `skip`, `limit` |
| GET | `/vehicles/{id}` | Get one | — | — |
| POST | `/vehicles` | Create | `vehicle.write` | Body: `VehicleCreate` |
| PATCH | `/vehicles/{id}` | Update | `vehicle.write` | Body: `VehicleUpdate` |

---

## Appointments

| Method | Route | Purpose | Role | Filters / paging |
|--------|-------|---------|------|------------------|
| GET | `/appointments` | List | — | `q`, `status`, `date_from`, `date_to`, `skip`, `limit` |
| GET | `/appointments/{id}` | Get one | — | — |
| POST | `/appointments` | Create | `appointment.write` | `AppointmentCreate` |
| PATCH | `/appointments/{id}` | Update / status | `appointment.write` | `AppointmentUpdate` |

---

## Queue entries

| Method | Route | Purpose | Role | Filters / paging |
|--------|-------|---------|------|------------------|
| GET | `/queue-entries` | List | — | `q`, `status`, `dock_id`, `skip`, `limit` |
| GET | `/queue-entries/{id}` | Get one | — | — |
| POST | `/queue-entries` | Create | `queue.write` | `QueueEntryCreate` |
| PATCH | `/queue-entries/{id}` | Update priority/status | `queue.write` | `QueueEntryUpdate` |

---

## Docks

| Method | Route | Purpose | Role | Filters / paging |
|--------|-------|---------|------|------------------|
| GET | `/docks` | List | — | `q`, `status`, `skip`, `limit` |
| GET | `/docks/{id}` | Get one | — | — |
| POST | `/docks` | Create | `dock.write` | `DockCreate` |
| PATCH | `/docks/{id}` | Update | `dock.write` | `DockUpdate` |

---

## Yard events

| Method | Route | Purpose | Role | Filters / paging |
|--------|-------|---------|------|------------------|
| GET | `/yard-events` | List timeline | — | `q`, `date_from`, `date_to`, `skip`, `limit` |
| GET | `/yard-events/{id}` | Get one | — | — |
| POST | `/yard-events` | Create event | `yard_event.write` | `YardEventCreate` |

---

## Flow (orchestration)

| Method | Route | Purpose | Role | Body |
|--------|-------|---------|------|------|
| POST | `/flow/check-in` | Appointment → queue entry | `flow.check_in` | `CheckInRequest` |
| POST | `/flow/queue-entries/{id}/call` | Mark called | `flow.call` | — |
| POST | `/flow/queue-entries/{id}/assign-dock` | Assign dock | `flow.assign_dock` | `AssignDockRequest` |
| POST | `/flow/vehicles/{id}/transition` | Lifecycle status | `flow.vehicle_transition` | `TransitionRequest` |

---

## Detention

| Method | Route | Purpose | Role | Notes |
|--------|-------|---------|------|-------|
| GET | `/detention/config` | Rate/config | — | Static/service config |
| GET | `/detention` | Bundle | — | `q`, `status` filter records in bundle |
| GET | `/detention/{id}` | Detail + events | — | Includes related `yard_events` |
| PATCH | `/detention/{id}/status` | Approve/dispute/paid etc. | `detention.write` | `DetentionStatusUpdate` |

---

## Equipment

| Method | Route | Purpose | Role |
|--------|-------|---------|------|
| GET | `/equipment` | List | — | `q`, `status`, `category`, `skip`, `limit` |
| GET | `/equipment/{id}` | Get | — |
| POST | `/equipment` | Create | `equipment.write` |
| PATCH | `/equipment/{id}` | Update | `equipment.write` |
| PATCH | `/equipment/{id}/status` | Status change | `equipment.write` |
| DELETE | `/equipment/{id}` | Delete | `equipment.write` |
| POST | `/equipment/{id}/assign` | Assign dock/vehicle | `equipment.write` |
| POST | `/equipment/{id}/release` | Release | `equipment.write` |
| POST | `/equipment/{id}/in-use` | Shortcut status | `equipment.write` |
| POST | `/equipment/{id}/idle` | Shortcut | `equipment.write` |
| POST | `/equipment/{id}/maintenance` | Shortcut | `equipment.write` |
| POST | `/equipment/{id}/charging` | Shortcut | `equipment.write` |
| POST | `/equipment/{id}/maintenance-complete` | Shortcut | `equipment.write` |

---

## Labor

| Method | Route | Purpose | Role |
|--------|-------|---------|------|
| GET | `/labor` | List teams | — | `q`, `status`, `skip`, `limit` |
| GET | `/labor/{id}` | Get | — |
| POST | `/labor` | Create | `labor.write` |
| PATCH | `/labor/{id}` | Update | `labor.write` |
| PATCH | `/labor/{id}/status` | Status | `labor.write` |
| DELETE | `/labor/{id}` | Delete | `labor.write` |
| POST | `/labor/{id}/assign` | Assign | `labor.write` |
| POST | `/labor/{id}/release` | Release | `labor.write` |
| POST | `/labor/{id}/on-duty` | Shortcut | `labor.write` |
| POST | `/labor/{id}/off-duty` | Shortcut | `labor.write` |
| POST | `/labor/{id}/break` | Shortcut | `labor.write` |
| POST | `/labor/{id}/break-end` | Shortcut | `labor.write` |
| POST | `/labor/{id}/unavailable` | Shortcut | `labor.write` |

---

## Status (legacy / health)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/` | API root message |
| GET | `/status` | List status checks |
| POST | `/status` | Create status check |

---

## Frontend consumption map

| API area | Primary service |
|----------|-----------------|
| Core lists + flow | `ymsApi.js` |
| Appointments UI | `appointmentsApi.js` |
| Gate | `gateManagementApi.js` |
| Docks / loading progress | `docksApi.js` |
| Loading ops | `loadingOpsApi.js` |
| Detention | `detentionApi.js` |
| Equipment | `equipmentApi.js` |
| Labor | `laborApi.js` |
| Control Tower | `controlTowerApi.js` |
| Executive KPIs | `executiveKpisApi.js` |
| Yard Map | `yardMapApi.js` + `docksApi` |
| Jump-to | `jumpToApi.js` |
| Auth | `authApi.js` |

There is **no** dedicated backend route for Control Tower, Executive KPIs, Gate bundle, or Yard Map — those aggregate client-side from the endpoints above.
