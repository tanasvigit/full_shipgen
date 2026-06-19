# API Documentation — YARD.OS
# Smart Yard Management System

---

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Base URL** | `http://localhost:8001/api` |
| **OpenAPI (live)** | `http://localhost:8001/docs` |
| **Source of Truth** | `backend/routers/`, `backend/schemas.py` |
| **Date** | June 2026 |

---

## Table of Contents

1. [Conventions](#1-conventions)
2. [Appointments APIs](#2-appointments-apis)
3. [Gate APIs](#3-gate-apis)
4. [Queue APIs](#4-queue-apis)
5. [Dock APIs](#5-dock-apis)
6. [Labor APIs](#6-labor-apis)
7. [Equipment APIs](#7-equipment-apis)
8. [Loading Operations APIs](#8-loading-operations-apis)
9. [Control Tower APIs](#9-control-tower-apis)
10. [Yard Map APIs](#10-yard-map-apis)
11. [Reports APIs](#11-reports-apis)
12. [Executive KPI APIs](#12-executive-kpi-apis)
13. [Detention APIs](#13-detention-apis)
14. [Global Error Reference](#14-global-error-reference)

---

# 1. Conventions

## 1.1 Authentication Headers

All API clients **should** send:

```http
X-YMS-Role: admin | operations | gate | supervisor | read_only
X-YMS-User: <optional identity string for audit created_by fields>
Content-Type: application/json
```

| Header | Required | Description |
|--------|----------|-------------|
| `X-YMS-Role` | Recommended | RBAC role; defaults to `operations` in dev mode |
| `X-YMS-User` | Optional | Stored in `created_by` audit fields |
| `Content-Type` | On POST/PATCH | `application/json` |

## 1.2 Pagination

List endpoints accept optional query parameters:

| Param | Type | Default | Max |
|-------|------|---------|-----|
| `skip` | integer | `0` | — |
| `limit` | integer | none (return array) | `500` |

**Without `limit`:** response is a JSON **array**.  
**With `limit`:** response is:

```json
{
  "items": [ ... ],
  "total": 42,
  "skip": 0,
  "limit": 50
}
```

## 1.3 Standard HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success (GET, PATCH, POST with body) |
| `204` | Success, no body (DELETE) |
| `400` | Validation / bad request |
| `401` | Invalid role (`YMS_AUTH_MODE=strict`) |
| `403` | Permission denied |
| `404` | Resource not found |
| `409` | Business rule conflict |
| `422` | Pydantic schema validation failure |
| `500` | Server error |

## 1.4 Error Response Shape

```json
{
  "detail": "Human-readable message"
}
```

Structured conflicts (resource gating, zone capacity):

```json
{
  "detail": {
    "code": "RESOURCE_GATING_FAILED",
    "missing": ["labor"],
    "message": "Labor team must be assigned before loading"
  }
}
```

## 1.5 Date/Time Formats

- **Dates:** ISO 8601 `YYYY-MM-DD`
- **Timestamps:** ISO 8601 with timezone `2026-06-03T10:30:00+00:00` or `Z`

---

# 2. Appointments APIs

**Router:** `backend/routers/yms.py`  
**Prefix:** `/api`  
**Frontend service:** `appointmentsApi.js`

---

## 2.1 List Appointments

| Field | Value |
|-------|-------|
| **Module** | Appointments |
| **Endpoint** | `/appointments` |
| **HTTP Method** | `GET` |
| **Permission** | None (read) |

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | No | Text search (booking ref, customer, shipment) |
| `status` | string | No | Filter by status |
| `date_from` | date | No | `booking_date >= date_from` |
| `date_to` | date | No | `booking_date <= date_to` |
| `skip` | integer | No | Pagination offset |
| `limit` | integer | No | Page size (max 500) |

### Response Payload

`AppointmentOut[]` or paginated `{ items: AppointmentOut[] }`

```json
{
  "id": "uuid",
  "booking_reference": "APT-2026-001",
  "vehicle_id": "uuid",
  "customer_name": "Acme Corp",
  "shipment_reference": "SHP-8842",
  "booking_date": "2026-06-03",
  "reporting_time": "2026-06-03T08:00:00Z",
  "scheduled_slot": "08:00-09:00",
  "gate_number": "G1",
  "priority": 0,
  "status": "SCHEDULED",
  "remarks": null,
  "created_at": "2026-06-01T10:00:00Z",
  "updated_at": "2026-06-01T10:00:00Z"
}
```

### Status Codes

| Code | Condition |
|------|-----------|
| 200 | Success |

### Usage Notes

Primary data source for Appointments calendar/list views. Priority values: `0` Normal, `50` High, `90` Urgent.

---

## 2.2 Get Appointment

| Field | Value |
|-------|-------|
| **Module** | Appointments |
| **Endpoint** | `/appointments/{appointment_id}` |
| **HTTP Method** | `GET` |
| **Permission** | None |

### Path Parameters

| Param | Type | Description |
|-------|------|-------------|
| `appointment_id` | UUID | Appointment primary key |

### Response Payload

`AppointmentOut`

### Status Codes

| Code | Condition |
|------|-----------|
| 200 | Found |
| 404 | `Appointment not found` |

---

## 2.3 Create Appointment

| Field | Value |
|-------|-------|
| **Module** | Appointments |
| **Endpoint** | `/appointments` |
| **HTTP Method** | `POST` |
| **Permission** | `appointment.write` |

### Request Payload (`AppointmentCreate`)

```json
{
  "booking_reference": "APT-2026-001",
  "vehicle_id": "uuid",
  "customer_name": "Acme Corp",
  "shipment_reference": "SHP-8842",
  "booking_date": "2026-06-03",
  "reporting_time": "2026-06-03T08:00:00Z",
  "scheduled_slot": "08:00-09:00",
  "gate_number": "G1",
  "priority": 0,
  "status": "SCHEDULED",
  "remarks": "Optional notes",
  "created_by": "appointments-ui"
}
```

### Validation Rules

| Field | Rule |
|-------|------|
| `booking_reference` | 3–64 chars, unique |
| `vehicle_id` | Must exist |
| `customer_name` | 1–255 chars |
| `shipment_reference` | 1–255 chars |
| `scheduled_slot` | 1–64 chars |
| `gate_number` | 1–32 chars |
| `priority` | integer, default 0 |

### Response Payload

`AppointmentOut` (201 semantics via 200)

### Status Codes

| Code | Error |
|------|-------|
| 200 | Created |
| 403 | Permission denied |
| 404 | Vehicle not found |
| 409 | `Booking reference already exists` |
| 422 | Schema validation |

### Usage Notes

Emits `APPOINTMENT_CREATED` and `APPOINTMENT_CONFIRMED` yard events. Vehicle must exist before booking (create via `POST /vehicles` first).

---

## 2.4 Update Appointment

| Field | Value |
|-------|-------|
| **Module** | Appointments |
| **Endpoint** | `/appointments/{appointment_id}` |
| **HTTP Method** | `PATCH` |
| **Permission** | `appointment.write` |

### Request Payload (`AppointmentUpdate`)

All fields optional:

```json
{
  "customer_name": "string",
  "shipment_reference": "string",
  "booking_date": "2026-06-03",
  "reporting_time": "2026-06-03T09:00:00Z",
  "scheduled_slot": "09:00-10:00",
  "gate_number": "G2",
  "priority": 50,
  "status": "CANCELLED",
  "remarks": "string",
  "created_by": "appointments-ui"
}
```

### Validation Rules

| Rule | Detail |
|------|--------|
| Direct status PATCH | Only `DRAFT`, `SCHEDULED`, `CANCELLED` permitted |
| Operational statuses | Must use workflow APIs (gate, flow) |

### Error Responses

| Code | Detail |
|------|--------|
| 409 | `Cannot change appointment status via direct update...` |
| 404 | Appointment not found |

### Usage Notes

Rescheduling emits `APPOINTMENT_RESCHEDULED`. Cancellation syncs linked vehicle when applicable.

---

# 3. Gate APIs

**Router:** `backend/routers/gate.py`  
**Prefix:** `/api/gate`  
**Frontend service:** `gateManagementApi.js`

---

## 3.1 Gate Dashboard

| Field | Value |
|-------|-------|
| **Module** | Gate Management |
| **Endpoint** | `/gate/dashboard` |
| **HTTP Method** | `GET` |
| **Permission** | None |

### Query Parameters

| Param | Default | Description |
|-------|---------|-------------|
| `gate_id` | `G1` | Gate identifier |

### Response Payload

```json
{
  "gateId": "G1",
  "kpis": {
    "approaching": 2,
    "arrived": 1,
    "checkedIn": 0,
    "waiting": 3,
    "loadingPipeline": 4,
    "exitHolding": 2,
    "exitedToday": 5
  },
  "activity": [
    {
      "vehicleId": "uuid",
      "appointmentId": "uuid",
      "queueEntryId": "uuid",
      "plate": "MH12AB1234",
      "appointment": "APT-2026-001",
      "transporter": "FastFreight",
      "driver": "Raj Kumar",
      "slot": "08:00-09:00",
      "status": "WAITING",
      "activityTab": "WAITING",
      "gateId": "G1"
    }
  ]
}
```

### Usage Notes

KPIs use canonical `operational_metrics` functions (`waiting` = WAITING status only). Activity tabs: APPROACHING, ARRIVED, WAITING, STAGING, LOADING, EXIT_HOLDING, EXIT_VERIFIED.

---

## 3.2 Gate Lookup

| Field | Value |
|-------|-------|
| **Module** | Gate Management |
| **Endpoint** | `/gate/lookup` |
| **HTTP Method** | `POST` |
| **Permission** | None |

### Request Payload (`GateLookupRequest`)

```json
{
  "query": "MH12AB1234",
  "gate_id": "G1"
}
```

| Field | Validation |
|-------|------------|
| `query` | 1–128 chars, required |
| `gate_id` | max 16 chars, default `G1` |

### Response Payload

```json
{
  "vehicle": { "...VehicleOut fields..." },
  "appointment": { "...AppointmentOut or null..." },
  "queueEntry": { "...QueueEntryOut or null..." },
  "verification": { "...gate_verifications row..." },
  "journey": { "...VehicleJourneyOut..." },
  "events": [ "...YardEventOut..." ],
  "activityTab": "WAITING",
  "entryChecks": [
    { "key": "appointment_exists", "label": "...", "passed": true }
  ],
  "exitChecks": [
    { "key": "loading_completed_verified", "label": "...", "passed": false }
  ],
  "entryApproved": false,
  "exitApproved": false,
  "gateId": "G1"
}
```

### Status Codes

| Code | Detail |
|------|--------|
| 200 | Found |
| 400 | `Query required` |
| 404 | `No vehicle found for '{query}'` |

---

## 3.3 Gate Scan

| Field | Value |
|-------|-------|
| **Module** | Gate Management |
| **Endpoint** | `/gate/scan` |
| **HTTP Method** | `POST` |
| **Permission** | `yard_event.write` |

### Request Payload (`GateScanRequest`)

```json
{
  "query": "MH12AB1234",
  "gate_id": "G1",
  "scan_type": "QR",
  "created_by": "gate-ui"
}
```

| `scan_type` | Values: `QR`, `ANPR`, `GATE_PASS` |

### Response Payload

Same as lookup response plus `GATE_SCAN` event emitted.

### Usage Notes

Hardware integration point. Frontend `gateScanner.js` provides pluggable mock providers.

---

## 3.4 Mark Arrived

| Field | Value |
|-------|-------|
| **Module** | Gate Management |
| **Endpoint** | `/gate/vehicles/{vehicle_id}/arrived` |
| **HTTP Method** | `POST` |
| **Permission** | `flow.vehicle_transition` |

### Request Payload (`GateActionRequest`)

```json
{
  "gate_id": "G1",
  "created_by": "gate-ui"
}
```

### Response Payload

Updated vehicle object.

### Status Codes

| Code | Detail |
|------|--------|
| 409 | Invalid status transition |

### Usage Notes

Transitions `SCHEDULED`/`DRAFT` → `ARRIVED`.

---

## 3.5 Approve Entry

| Field | Value |
|-------|-------|
| **Module** | Gate Management |
| **Endpoint** | `/gate/vehicles/{vehicle_id}/approve-entry` |
| **HTTP Method** | `POST` |
| **Permission** | `flow.check_in` |

### Request Payload (`GateApproveEntryRequest`)

```json
{
  "gate_id": "G1",
  "created_by": "gate-ui",
  "queue_number": "Q-2026-0042",
  "queue_type": "Loading"
}
```

### Validation Rules

All 6 entry checks must pass:
- `appointment_exists`, `appointment_active`, `correct_date`, `vehicle_match`, `not_checked_in`, `gate_open`

### Error Responses

| Code | Detail |
|------|--------|
| 409 | `Entry blocked: {failed checks}` |
| 409 | `Vehicle already checked in` |
| 404 | `No appointment for vehicle` |

### Usage Notes

Creates queue entry, sets vehicle → `WAITING`, auto-moves to WAITING_AREA zone.

---

## 3.6 Reject Entry

| Field | Value |
|-------|-------|
| **Module** | Gate Management |
| **Endpoint** | `/gate/vehicles/{vehicle_id}/reject-entry` |
| **HTTP Method** | `POST` |
| **Permission** | `flow.vehicle_transition` |

### Request Payload (`GateRejectRequest`)

```json
{
  "gate_id": "G1",
  "created_by": "gate-ui",
  "reason": "Documentation incomplete"
}
```

### Response Payload

```json
{ "ok": true }
```

---

## 3.7 List Exit Holding

| Field | Value |
|-------|-------|
| **Module** | Gate Management |
| **Endpoint** | `/gate/exit-holding` |
| **HTTP Method** | `GET` |
| **Permission** | None |

### Query Parameters

| Param | Default |
|-------|---------|
| `gate_id` | `G1` |

### Response Payload

Array of vehicles in `EXIT_HOLDING` / `EXIT_VERIFIED` with verification context.

---

## 3.8 Exit Holding Dashboard

| Field | Value |
|-------|-------|
| **Module** | Gate Management |
| **Endpoint** | `/gate/exit-holding/dashboard` |
| **HTTP Method** | `GET` |
| **Permission** | None |

### Response Payload

KPI summary for exit holding lane.

---

## 3.9 Get Exit Verification Detail

| Field | Value |
|-------|-------|
| **Module** | Gate Management |
| **Endpoint** | `/gate/vehicles/{vehicle_id}/exit-verification` |
| **HTTP Method** | `GET` |
| **Permission** | None |

### Response Payload

Vehicle, appointment, verification record, exit checklist state.

---

## 3.10 Update Exit Checklist

| Field | Value |
|-------|-------|
| **Module** | Gate Management |
| **Endpoint** | `/gate/vehicles/{vehicle_id}/exit-checklist` |
| **HTTP Method** | `PATCH` |
| **Permission** | None (read path; UI gates via RBAC) |

### Request Payload (`GateClearanceUpdate`)

All booleans optional (partial update):

```json
{
  "loading_completed_verified": true,
  "appointment_completed_verified": true,
  "vehicle_verified": true,
  "delivery_document_verified": true,
  "gate_pass_approved": true,
  "invoice_approved": true,
  "security_cleared": true,
  "gate_id": "G1"
}
```

### Response Payload

Updated `gate_verifications` record.

---

## 3.11 Verify Exit

| Field | Value |
|-------|-------|
| **Module** | Gate Management |
| **Endpoint** | `/gate/vehicles/{vehicle_id}/verify-exit` |
| **HTTP Method** | `POST` |
| **Permission** | `flow.vehicle_transition` |

### Request Payload (`GateVerifyExitRequest`)

```json
{
  "gate_id": "G1",
  "created_by": "gate-ui",
  "remarks": "All documents verified"
}
```

### Validation Rules

- Vehicle status must be `EXIT_HOLDING`
- All 7 exit checklist booleans must be `true`

### Error Responses

| Code | Detail |
|------|--------|
| 409 | `Exit checklist incomplete: ...` |
| 409 | `Cannot verify exit from status ...` |
| 409 | `Vehicle not in exit holding` |

### Usage Notes

Transitions `EXIT_HOLDING` → `EXIT_VERIFIED`.

---

## 3.12 Gate Out

| Field | Value |
|-------|-------|
| **Module** | Gate Management |
| **Endpoint** | `/gate/vehicles/{vehicle_id}/gate-out` |
| **HTTP Method** | `POST` |
| **Permission** | `flow.vehicle_transition` |

### Request Payload (`GateActionRequest`)

### Validation Rules

- Vehicle status must be `EXIT_VERIFIED`

### Error Responses

| Code | Detail |
|------|--------|
| 409 | `Gate out requires EXIT_VERIFIED` |
| 409 | `Vehicle already exited` |

### Usage Notes

Transitions `EXIT_VERIFIED` → `EXITED`; sets `exit_time`, `exit_gate_id`.

---

## 3.13 Reject Exit

| Field | Value |
|-------|-------|
| **Module** | Gate Management |
| **Endpoint** | `/gate/vehicles/{vehicle_id}/reject-exit` |
| **HTTP Method** | `POST` |
| **Permission** | `yard_event.write` |

### Request Payload (`GateRejectRequest`)

### Response Payload

```json
{ "ok": true }
```

---

# 4. Queue APIs

**Routers:** `queue.py`, `yms.py` (queue-entries, flow)  
**Prefixes:** `/api/queue`, `/api`  
**Frontend service:** `queueApi.js`, `ymsApi.js`

---

## 4.1 Queue Bundle

| Field | Value |
|-------|-------|
| **Module** | Virtual Queue |
| **Endpoint** | `/queue/bundle` |
| **HTTP Method** | `GET` |
| **Permission** | None |

### Response Payload (`QueueBundleOut`)

```json
{
  "entries": [
    {
      "queueEntryId": "uuid",
      "vehicleId": "uuid",
      "appointmentId": "uuid",
      "plate": "MH12AB1234",
      "vehicleStatus": "WAITING",
      "displayStatus": "Waiting",
      "queueRank": 1,
      "waitingMin": 45,
      "detentionCost": 1575,
      "detentionRisk": "HIGH",
      "queueAging": "45m",
      "priorityScore": 75,
      "recommendedDock": { "dockId": "uuid", "dockCode": "DK-001", "score": 85 }
    }
  ],
  "summary": {
    "inQueue": 8,
    "avgWaitMin": 32,
    "totalDetentionCost": 8400,
    "highPriority": 2,
    "readyToCall": 1,
    "criticalWait": 0,
    "engineNote": "Priority score = (priority × 10) + lateness minutes (max 120)"
  }
}
```

### Usage Notes

Primary Virtual Queue page data source. Sorted by `priority_score` DESC.

---

## 4.2 Queue Entry Detail

| Field | Value |
|-------|-------|
| **Module** | Virtual Queue |
| **Endpoint** | `/queue/entries/{queue_entry_id}/detail` |
| **HTTP Method** | `GET` |
| **Permission** | None |

### Response Payload (`QueueEntryDetailOut`)

```json
{
  "entry": { "...QueueEntryOut..." },
  "vehicle": { "...VehicleOut..." },
  "appointment": { "...AppointmentOut..." },
  "dock": { "...DockOut or null..." },
  "readiness": { "ready": false, "missing": ["labor"] },
  "metrics": { "...QueueEntryMetricsOut..." },
  "labor": { "... or null..." },
  "equipment": { "... or null..." },
  "recommendedDock": { "...DockRecommendationOut..." }
}
```

---

## 4.3 Queue Priority Override

| Field | Value |
|-------|-------|
| **Module** | Virtual Queue |
| **Endpoint** | `/queue/entries/{queue_entry_id}/override` |
| **HTTP Method** | `POST` |
| **Permission** | `queue.write` |

### Request Payload (`QueueOverrideRequest`)

```json
{
  "target_rank": 1,
  "reason": "Customer escalation — perishable cargo",
  "supervisor": "Priya Sharma",
  "created_by": "supervisor"
}
```

### Validation Rules

| Field | Rule |
|-------|------|
| `target_rank` | 1–500 |
| `reason` | 3–500 chars |
| `supervisor` | 2–128 chars |

### Error Responses

| Code | Detail |
|------|--------|
| 400 | `Override reason is required` |
| 400 | `Supervisor name is required` |
| 400 | `Target rank must be at least 1` |
| 404 | `Queue entry not in active queue` |

### Usage Notes

Emits `QUEUE_OVERRIDE` and `QUEUE_PRIORITY_CHANGED` events.

---

## 4.4 List Queue Entries

| Field | Value |
|-------|-------|
| **Module** | Virtual Queue |
| **Endpoint** | `/queue-entries` |
| **HTTP Method** | `GET` |
| **Permission** | None |

### Query Parameters

| Param | Description |
|-------|-------------|
| `q` | Text search |
| `status` | Filter by status |
| `dock_id` | Filter by assigned dock |
| `skip`, `limit` | Pagination |

### Response Payload

`QueueEntryOut[]` or paginated wrapper.

---

## 4.5 Get Queue Entry

| Field | Value |
|-------|-------|
| **Module** | Virtual Queue |
| **Endpoint** | `/queue-entries/{queue_entry_id}` |
| **HTTP Method** | `GET` |

### Response Payload

`QueueEntryOut`

---

## 4.6 Create Queue Entry

| Field | Value |
|-------|-------|
| **Module** | Virtual Queue |
| **Endpoint** | `/queue-entries` |
| **HTTP Method** | `POST` |
| **Permission** | `queue.write` |

### Request Payload (`QueueEntryCreate`)

```json
{
  "appointment_id": "uuid",
  "queue_number": "Q-2026-0042",
  "queue_type": "Loading",
  "checkin_time": "2026-06-03T08:15:00Z"
}
```

### Usage Notes

Normally created automatically by gate check-in. Manual creation for edge cases.

---

## 4.7 Update Queue Entry

| Field | Value |
|-------|-------|
| **Module** | Virtual Queue |
| **Endpoint** | `/queue-entries/{queue_entry_id}` |
| **HTTP Method** | `PATCH` |
| **Permission** | `queue.write` |

### Request Payload (`QueueEntryUpdate`)

```json
{
  "queue_type": "Loading",
  "priority_score": 80,
  "status": "WAITING",
  "called_time": "2026-06-03T09:00:00Z",
  "dock_assigned_time": null
}
```

---

## 4.8 Call Queue Entry (Flow)

| Field | Value |
|-------|-------|
| **Module** | Virtual Queue |
| **Endpoint** | `/flow/queue-entries/{queue_entry_id}/call` |
| **HTTP Method** | `POST` |
| **Permission** | `flow.call` |

### Request Payload

None.

### Response Payload

`QueueEntryOut` with status `CALLED`.

### Error Responses

| Code | Detail |
|------|--------|
| 409 | `Queue entry is not in callable state` |

### Validation Rules

Callable statuses: `WAITING`, `CHECKED_IN`.

### Usage Notes

Emits `QUEUE_CALLED`, `VEHICLE_CALLED`. Vehicle → `CALLED`.

---

## 4.9 Check-In (Flow)

| Field | Value |
|-------|-------|
| **Module** | Virtual Queue |
| **Endpoint** | `/flow/check-in` |
| **HTTP Method** | `POST` |
| **Permission** | `flow.check_in` |

### Request Payload (`CheckInRequest`)

```json
{
  "appointment_id": "uuid",
  "queue_number": "Q-2026-0042",
  "queue_type": "STANDARD"
}
```

### Response Payload

`QueueEntryOut`

---

# 5. Dock APIs

**Router:** `yms.py`  
**Prefix:** `/api`  
**Frontend service:** `docksApi.js`

---

## 5.1 List Docks

| Field | Value |
|-------|-------|
| **Module** | Docks |
| **Endpoint** | `/docks` |
| **HTTP Method** | `GET` |
| **Permission** | None |

### Query Parameters

`q`, `status`, `skip`, `limit`

### Response Payload

`DockOut[]`

```json
{
  "id": "uuid",
  "dock_code": "DK-001",
  "dock_name": "Bay 1",
  "dock_type": "LOADING",
  "zone": "Zone A",
  "supported_vehicle_types": ["TRUCK", "TRAILER"],
  "supported_cargo_types": ["PALLETS", "GENERAL"],
  "max_capacity": 1,
  "status": "AVAILABLE",
  "current_vehicle_id": null,
  "assigned_since": null,
  "estimated_service_time_min": 90,
  "notes": null,
  "created_at": "...",
  "updated_at": "..."
}
```

---

## 5.2 Get Dock

| Field | Value |
|-------|-------|
| **Module** | Docks |
| **Endpoint** | `/docks/{dock_id}` |
| **HTTP Method** | `GET` |

### Response Payload

`DockOut`

---

## 5.3 Create Dock

| Field | Value |
|-------|-------|
| **Module** | Docks |
| **Endpoint** | `/docks` |
| **HTTP Method** | `POST` |
| **Permission** | `dock.write` |

### Request Payload (`DockCreate`)

```json
{
  "dock_name": "Bay 7",
  "dock_type": "LOADING",
  "zone": "Zone A",
  "supported_vehicle_types": ["TRUCK"],
  "supported_cargo_types": ["GENERAL"],
  "max_capacity": 1,
  "status": "AVAILABLE",
  "estimated_service_time_min": 90,
  "created_by": "docks-ui"
}
```

### Validation Rules

| Field | Rule |
|-------|------|
| `dock_name` | 1–255 chars |
| `supported_vehicle_types` | min 1 item |
| `supported_cargo_types` | min 1 item |
| `max_capacity` | 1–20 |
| `estimated_service_time_min` | 15–480 |

### Error Responses

| Code | Detail |
|------|--------|
| 409 | Duplicate dock_code |

---

## 5.4 Update Dock

| Field | Value |
|-------|-------|
| **Module** | Docks |
| **Endpoint** | `/docks/{dock_id}` |
| **HTTP Method** | `PATCH` |
| **Permission** | `dock.write` |

### Request Payload (`DockUpdate`)

Partial update; includes `status`, `current_vehicle_id`, `estimated_service_time_min`, `event_note`, `created_by`.

---

## 5.5 Delete Dock

| Field | Value |
|-------|-------|
| **Module** | Docks |
| **Endpoint** | `/docks/{dock_id}` |
| **HTTP Method** | `DELETE` |
| **Permission** | `dock.write` |

### Status Codes

| Code | Condition |
|------|-----------|
| 204 | Deleted |
| 409 | Dock occupied or has active assignments |

---

## 5.6 Assign Dock (Flow)

| Field | Value |
|-------|-------|
| **Module** | Docks |
| **Endpoint** | `/flow/queue-entries/{queue_entry_id}/assign-dock` |
| **HTTP Method** | `POST` |
| **Permission** | `flow.assign_dock` |

### Request Payload (`AssignDockRequest`)

```json
{
  "dock_id": "uuid"
}
```

### Response Payload

`QueueEntryOut` with `dock_id` set.

### Error Responses

| Code | Detail |
|------|--------|
| 409 | `Dock is not available` |
| 409 | Queue entry not in `CALLED` status |
| 409 | Dock inactive for loading |

### Usage Notes

Dock → `OCCUPIED`, vehicle → `DOCK_ASSIGNED`, triggers `sync_vehicle_readiness_status`.

---

## 5.7 Dock Readiness

| Field | Value |
|-------|-------|
| **Module** | Docks |
| **Endpoint** | `/docks/readiness/vehicle/{vehicle_id}` |
| **HTTP Method** | `GET` |

### Response Payload (`DockReadinessOut`)

```json
{
  "dockAssigned": true,
  "dockId": "uuid",
  "dockCode": "DK-001",
  "dockName": "Bay 1",
  "dockStatus": "OCCUPIED"
}
```

---

## 5.8 Resource Readiness (Unified)

| Field | Value |
|-------|-------|
| **Module** | Docks |
| **Endpoint** | `/flow/readiness/vehicle/{vehicle_id}` |
| **HTTP Method** | `GET` |

### Response Payload (`ResourceReadinessOut`)

```json
{
  "ready": false,
  "missing": ["labor"],
  "dockAssigned": true,
  "laborAssigned": false,
  "equipmentAssigned": false,
  "equipmentOptional": true,
  "dockId": "uuid",
  "dockCode": "DK-001",
  "teamCode": null
}
```

---

## 5.9 Assign Labor to Dock

| Field | Value |
|-------|-------|
| **Module** | Docks |
| **Endpoint** | `/docks/{dock_id}/assign-labor` |
| **HTTP Method** | `POST` |
| **Permission** | `dock.write` |

### Request Payload (`DockAssignLaborRequest`)

```json
{
  "labor_id": "uuid",
  "workers_assigned": 4,
  "event_note": "Assigned for loading",
  "created_by": "docks-ui"
}
```

---

## 5.10 Assign Equipment to Dock

| Field | Value |
|-------|-------|
| **Module** | Docks |
| **Endpoint** | `/docks/{dock_id}/assign-equipment` |
| **HTTP Method** | `POST` |
| **Permission** | `dock.write` |

### Request Payload (`DockAssignEquipmentRequest`)

```json
{
  "equipment_id": "uuid",
  "set_in_use": true,
  "created_by": "docks-ui"
}
```

---

## 5.11 Release Dock Resources

| Field | Value |
|-------|-------|
| **Module** | Docks |
| **Endpoint** | `/docks/{dock_id}/release-resources` |
| **HTTP Method** | `POST` |
| **Permission** | `dock.write` |

### Response Payload (`DockReleaseResourcesOut`)

```json
{
  "labor_released": 1,
  "equipment_released": 1
}
```

---

## 5.12 Vehicle Transition (Loading / Complete)

| Field | Value |
|-------|-------|
| **Module** | Docks / Loading |
| **Endpoint** | `/flow/vehicles/{vehicle_id}/transition` |
| **HTTP Method** | `POST` |
| **Permission** | `flow.vehicle_transition` |

### Request Payload (`TransitionRequest`)

```json
{
  "status": "LOADING",
  "event_note": "Started loading at Bay 1",
  "created_by": "operator"
}
```

### Validation Rules

| Rule | Detail |
|------|--------|
| Allowed statuses | `LOADING`, `COMPLETED`, `CANCELLED` only |
| LOADING | Resource gating must pass (dock + labor) |
| COMPLETED | Must be from `LOADING` |

### Error Responses

| Code | Detail |
|------|--------|
| 400 | Status not allowed via flow API |
| 409 | `RESOURCE_GATING_FAILED` with `missing[]` |
| 409 | Invalid status transition |

### Usage Notes

`COMPLETED` auto-cascades to `EXIT_HOLDING`, releases dock/labor/equipment.

---

# 6. Labor APIs

**Router:** `yms.py`  
**Prefix:** `/api`  
**Frontend service:** `laborApi.js`

---

## 6.1 List Labor Teams

| Field | Value |
|-------|-------|
| **Module** | Labor |
| **Endpoint** | `/labor` |
| **HTTP Method** | `GET` |

### Query Parameters

`q`, `status`, `skip`, `limit`

### Response Payload

`LaborTeamOut[]`

---

## 6.2 Get Labor Team

| Field | Value |
|-------|-------|
| **Module** | Labor |
| **Endpoint** | `/labor/{labor_id}` |
| **HTTP Method** | `GET` |

---

## 6.3 Create Labor Team

| Field | Value |
|-------|-------|
| **Module** | Labor |
| **Endpoint** | `/labor` |
| **HTTP Method** | `POST` |
| **Permission** | `labor.write` |

### Request Payload (`LaborTeamCreate`)

```json
{
  "team_name": "Team Alpha",
  "shift_start": "06:00",
  "shift_end": "14:00",
  "members_count": 8,
  "status": "ON_DUTY",
  "supervisor_name": "Rohan D.",
  "supervisor_phone": "+91-9876543210",
  "material_type": "GENERAL",
  "created_by": "labor-ui"
}
```

### Validation Rules

| Field | Rule |
|-------|------|
| `team_name` | 1–64 chars |
| `members_count` | 1–200 |
| `shift_start/end` | 4–8 chars |

---

## 6.4 Update Labor Team

| Field | Value |
|-------|-------|
| **Module** | Labor |
| **Endpoint** | `/labor/{labor_id}` |
| **HTTP Method** | `PATCH` |
| **Permission** | `labor.write` |

### Request Payload (`LaborTeamUpdate`)

Partial fields from `LaborTeamBase`.

---

## 6.5 Update Labor Status

| Field | Value |
|-------|-------|
| **Module** | Labor |
| **Endpoint** | `/labor/{labor_id}/status` |
| **HTTP Method** | `PATCH` |
| **Permission** | `labor.write` |

### Request Payload (`LaborStatusUpdate`)

```json
{
  "status": "ASSIGNED",
  "event_note": "Assigned to Bay 1",
  "created_by": "labor-ui"
}
```

### Valid Statuses

`ON_DUTY`, `OFF_DUTY`, `ASSIGNED`, `AVAILABLE`, `BREAK`, `UNAVAILABLE`

### Error Responses

| Code | Detail |
|------|--------|
| 409 | Invalid status transition |

---

## 6.6 Assign Labor Team

| Field | Value |
|-------|-------|
| **Module** | Labor |
| **Endpoint** | `/labor/{labor_id}/assign` |
| **HTTP Method** | `POST` |
| **Permission** | `labor.write` |

### Request Payload (`LaborAssignRequest`)

```json
{
  "dock_id": "uuid",
  "vehicle_id": "uuid",
  "queue_entry_id": "uuid",
  "appointment_id": "uuid",
  "current_assignment": "Bay 1 loading",
  "workers_assigned": 4,
  "created_by": "labor-ui"
}
```

### Usage Notes

Triggers `sync_vehicle_readiness_status` on linked vehicle.

---

## 6.7 Release Labor Team

| Field | Value |
|-------|-------|
| **Module** | Labor |
| **Endpoint** | `/labor/{labor_id}/release` |
| **HTTP Method** | `POST` |
| **Permission** | `labor.write` |

---

## 6.8 Labor Status Shortcuts

| Endpoint | Method | New Status |
|----------|--------|------------|
| `/labor/{id}/on-duty` | POST | ON_DUTY |
| `/labor/{id}/off-duty` | POST | OFF_DUTY |
| `/labor/{id}/break` | POST | BREAK |
| `/labor/{id}/break-end` | POST | ON_DUTY |
| `/labor/{id}/unavailable` | POST | UNAVAILABLE |

All require `labor.write`.

---

## 6.9 Delete Labor Team

| Field | Value |
|-------|-------|
| **Module** | Labor |
| **Endpoint** | `/labor/{labor_id}` |
| **HTTP Method** | `DELETE` |
| **Permission** | `labor.write` |

### Status Codes

| Code | Detail |
|------|--------|
| 204 | Deleted |
| 409 | Team currently assigned |

---

## 6.10 Labor Readiness

| Field | Value |
|-------|-------|
| **Module** | Labor |
| **Endpoint** | `/labor/readiness/vehicle/{vehicle_id}` |
| **HTTP Method** | `GET` |

### Response Payload (`LaborReadinessOut`)

```json
{
  "laborAssigned": true,
  "teamId": "uuid",
  "teamName": "Team Alpha",
  "teamCode": "T-A"
}
```

---

# 7. Equipment APIs

**Router:** `yms.py`  
**Prefix:** `/api`  
**Frontend service:** `equipmentApi.js`

---

## 7.1 List Equipment

| Field | Value |
|-------|-------|
| **Module** | Equipment |
| **Endpoint** | `/equipment` |
| **HTTP Method** | `GET` |

### Query Parameters

`q`, `status`, `category`, `skip`, `limit`

---

## 7.2 Get Equipment

| Field | Value |
|-------|-------|
| **Module** | Equipment |
| **Endpoint** | `/equipment/{equipment_id}` |
| **HTTP Method** | `GET` |

---

## 7.3 Create Equipment

| Field | Value |
|-------|-------|
| **Module** | Equipment |
| **Endpoint** | `/equipment` |
| **HTTP Method** | `POST` |
| **Permission** | `equipment.write` |

### Request Payload (`EquipmentCreate`)

```json
{
  "equipment_name": "Forklift 101",
  "equipment_type": "FORKLIFT",
  "model": "Toyota 8FG25",
  "asset_number": "AST-101",
  "battery_level": 85,
  "status": "IDLE",
  "created_by": "equipment-ui"
}
```

---

## 7.4 Update Equipment

| Field | Value |
|-------|-------|
| **Module** | Equipment |
| **Endpoint** | `/equipment/{equipment_id}` |
| **HTTP Method** | `PATCH` |
| **Permission** | `equipment.write` |

---

## 7.5 Update Equipment Status

| Field | Value |
|-------|-------|
| **Module** | Equipment |
| **Endpoint** | `/equipment/{equipment_id}/status` |
| **HTTP Method** | `PATCH` |
| **Permission** | `equipment.write` |

### Request Payload (`EquipmentStatusUpdate`)

```json
{
  "status": "MAINTENANCE",
  "event_note": "Scheduled service",
  "created_by": "equipment-ui"
}
```

---

## 7.6 Assign Equipment

| Field | Value |
|-------|-------|
| **Module** | Equipment |
| **Endpoint** | `/equipment/{equipment_id}/assign` |
| **HTTP Method** | `POST` |
| **Permission** | `equipment.write` |

### Request Payload (`EquipmentAssignRequest`)

```json
{
  "dock_id": "uuid",
  "vehicle_id": "uuid",
  "queue_entry_id": "uuid",
  "set_in_use": true,
  "created_by": "equipment-ui"
}
```

### Validation Rules

| Rule | Detail |
|------|--------|
| Battery | Must be ≥ 20% for assignment |

### Error Responses

| Code | Detail |
|------|--------|
| 409 | `Battery too low for assignment` |

---

## 7.7 Release Equipment

| Field | Value |
|-------|-------|
| **Module** | Equipment |
| **Endpoint** | `/equipment/{equipment_id}/release` |
| **HTTP Method** | `POST` |
| **Permission** | `equipment.write` |

---

## 7.8 Equipment Status Shortcuts

| Endpoint | Method | Status |
|----------|--------|--------|
| `/equipment/{id}/in-use` | POST | IN_USE |
| `/equipment/{id}/idle` | POST | IDLE |
| `/equipment/{id}/maintenance` | POST | MAINTENANCE |
| `/equipment/{id}/charging` | POST | CHARGING |
| `/equipment/{id}/maintenance-complete` | POST | IDLE |

---

## 7.9 Delete Equipment

| Field | Value |
|-------|-------|
| **Module** | Equipment |
| **Endpoint** | `/equipment/{equipment_id}` |
| **HTTP Method** | `DELETE` |
| **Permission** | `equipment.write` |

### Error Responses

| Code | Detail |
|------|--------|
| 409 | Equipment currently assigned |

---

## 7.10 Equipment Readiness

| Field | Value |
|-------|-------|
| **Module** | Equipment |
| **Endpoint** | `/equipment/readiness/vehicle/{vehicle_id}` |
| **HTTP Method** | `GET` |

### Response Payload (`EquipmentReadinessOut`)

```json
{
  "equipmentAssigned": true,
  "equipmentId": "uuid",
  "equipmentCode": "EQ-101",
  "equipmentName": "Forklift 101"
}
```

---

# 8. Loading Operations APIs

**Router:** `loading_ops.py`  
**Prefix:** `/api/loading-operations`  
**Frontend service:** `loadingOpsApi.js`

---

## 8.1 List Loading Exceptions

| Field | Value |
|-------|-------|
| **Module** | Loading Operations |
| **Endpoint** | `/loading-operations/exceptions` |
| **HTTP Method** | `GET` |

### Query Parameters

| Param | Type | Description |
|-------|------|-------------|
| `status` | string | OPEN, IN_PROGRESS, RESOLVED, CLOSED |
| `vehicle_id` | UUID | Filter by vehicle |
| `queue_entry_id` | UUID | Filter by queue entry |
| `active_only` | boolean | OPEN + IN_PROGRESS only |

### Response Payload

`LoadingExceptionOut[]`

---

## 8.2 Get Loading Exception

| Field | Value |
|-------|-------|
| **Module** | Loading Operations |
| **Endpoint** | `/loading-operations/exceptions/{exception_id}` |
| **HTTP Method** | `GET` |

---

## 8.3 Create Loading Exception

| Field | Value |
|-------|-------|
| **Module** | Loading Operations |
| **Endpoint** | `/loading-operations/exceptions` |
| **HTTP Method** | `POST` |
| **Permission** | `yard_event.write` |

### Request Payload (`LoadingExceptionCreate`)

```json
{
  "vehicle_id": "uuid",
  "appointment_id": "uuid",
  "queue_entry_id": "uuid",
  "dock_id": "uuid",
  "exception_type": "MATERIAL_SHORTAGE",
  "description": "Pallet shortage at Bay 1",
  "created_by": "loading-ops-ui"
}
```

### Valid `exception_type` Values

`MATERIAL_SHORTAGE`, `EQUIPMENT_FAILURE`, `LABOR_DELAY`, `DOCUMENTATION_HOLD`, `SAFETY_HOLD`, `QUALITY_HOLD`, `WEATHER_DELAY`, `GENERIC_DELAY`

### Error Responses

| Code | Detail |
|------|--------|
| 400 | `Invalid exception_type '{value}'` |

---

## 8.4 Assign Exception

| Field | Value |
|-------|-------|
| **Module** | Loading Operations |
| **Endpoint** | `/loading-operations/exceptions/{exception_id}/assign` |
| **HTTP Method** | `POST` |
| **Permission** | `yard_event.write` |

### Request Payload (`LoadingExceptionAssign`)

```json
{
  "assigned_to": "supervisor@yard",
  "created_by": "loading-ops-ui"
}
```

### Usage Notes

Status: `OPEN` → `IN_PROGRESS`

---

## 8.5 Resolve Exception

| Field | Value |
|-------|-------|
| **Module** | Loading Operations |
| **Endpoint** | `/loading-operations/exceptions/{exception_id}/resolve` |
| **HTTP Method** | `POST` |
| **Permission** | `yard_event.write` |

### Request Payload (`LoadingExceptionResolve`)

```json
{
  "resolved_by": "supervisor@yard",
  "resolution_notes": "Material replenished",
  "created_by": "loading-ops-ui"
}
```

---

## 8.6 Close Exception

| Field | Value |
|-------|-------|
| **Module** | Loading Operations |
| **Endpoint** | `/loading-operations/exceptions/{exception_id}/close` |
| **HTTP Method** | `POST` |
| **Permission** | `yard_event.write` |

### Request Payload (`LoadingExceptionClose`)

```json
{
  "closed_by": "supervisor@yard",
  "created_by": "loading-ops-ui"
}
```

---

## 8.7 Pause Loading

| Field | Value |
|-------|-------|
| **Module** | Loading Operations |
| **Endpoint** | `/loading-operations/pause` |
| **HTTP Method** | `POST` |
| **Permission** | `yard_event.write` |

### Request Payload (`LoadingPauseRequest`)

```json
{
  "vehicle_id": "uuid",
  "reason_code": "SAFETY_HOLD",
  "note": "Safety inspection required",
  "created_by": "loading-ops-ui"
}
```

### Validation Rules

Vehicle must be in `LOADING` status.

### Error Responses

| Code | Detail |
|------|--------|
| 409 | Vehicle not in LOADING |

### Usage Notes

Emits `LOADING_PAUSED` event. Does not change vehicle status.

---

## 8.8 Resume Loading

| Field | Value |
|-------|-------|
| **Module** | Loading Operations |
| **Endpoint** | `/loading-operations/resume` |
| **HTTP Method** | `POST` |
| **Permission** | `yard_event.write` |

### Request Payload (`LoadingResumeRequest`)

```json
{
  "vehicle_id": "uuid",
  "created_by": "loading-ops-ui"
}
```

### Usage Notes

Emits `LOADING_RESUMED` event.

---

## 8.9 Get Pause State

| Field | Value |
|-------|-------|
| **Module** | Loading Operations |
| **Endpoint** | `/loading-operations/pause-state` |
| **HTTP Method** | `GET` |

### Query Parameters

`vehicle_id` or `queue_entry_id` (at least one recommended)

### Response Payload (`LoadingPauseStateOut`)

```json
{
  "paused": true,
  "paused_since": "2026-06-03T10:30:00Z",
  "pause_reason": "SAFETY_HOLD",
  "paused_duration_min": 15,
  "total_paused_min": 15
}
```

---

# 9. Control Tower APIs

**Router:** `control_tower.py`  
**Prefix:** `/api/control-tower`  
**Frontend services:** `controlTowerAlertsApi.js`, `controlTowerApi.js` (client aggregation)

---

## 9.1 Get Control Tower Alerts

| Field | Value |
|-------|-------|
| **Module** | Control Tower |
| **Endpoint** | `/control-tower/alerts` |
| **HTTP Method** | `GET` |
| **Permission** | None |

### Response Payload (`ControlTowerAlertsOut`)

```json
{
  "activeAlerts": [
    {
      "id": "waiting-too-long-uuid",
      "alertType": "VEHICLE_WAITING_TOO_LONG",
      "severity": "WARNING",
      "vehicleId": "uuid",
      "vehicle": "MH12AB1234",
      "appointmentId": "uuid",
      "appointment": "APT-2026-001",
      "dockId": null,
      "dock": null,
      "durationMin": 75,
      "delayMin": null,
      "createdAt": "2026-06-03T07:00:00Z",
      "status": "ACTIVE"
    }
  ],
  "criticalCount": 2,
  "warningCount": 5
}
```

### Alert Types

| alertType | Severity |
|-----------|----------|
| `VEHICLE_WAITING_TOO_LONG` | WARNING |
| `HAZMAT_SLA_BREACH` | CRITICAL |
| `LOADING_DELAY` | CRITICAL |
| `EXIT_HOLDING_DELAY` | WARNING |
| `LABOR_UNAVAILABLE` | WARNING |
| `EQUIPMENT_UNAVAILABLE` | WARNING |
| `DOCK_BLOCKED` | CRITICAL |
| `QUEUE_CONGESTION` | WARNING |
| `LOADING_EXCEPTION` | CRITICAL/WARNING |

### Usage Notes

- Alerts are **derived** on each request — not persisted
- No acknowledge/dismiss API
- TopNav polls this endpoint every 30s
- Control Tower dashboard KPIs are **client-computed** from list APIs (see `controlTowerApi.js`)

### Related Client-Only Endpoints

Control Tower KPI bundle has **no backend endpoint**. Frontend aggregates:

| Backend API | Purpose |
|-------------|---------|
| `GET /vehicles` | In-yard, waiting, loading counts |
| `GET /appointments` | Today's schedule |
| `GET /queue-entries` | Queue depth |
| `GET /docks` | Utilization |
| `GET /yard/zones` | Occupancy |
| `GET /yard-events` | Throughput |
| `GET /detention` | Cost exposure |
| `GET /control-tower/alerts` | Alert panel |

---

# 10. Yard Map APIs

**Router:** `yard.py`  
**Prefix:** `/api/yard`  
**Frontend service:** `yardMapApi.js`

---

## 10.1 Yard Dashboard

| Field | Value |
|-------|-------|
| **Module** | Yard Map |
| **Endpoint** | `/yard/dashboard` |
| **HTTP Method** | `GET` |

### Response Payload (`YardDashboardOut`)

```json
{
  "totalZones": 11,
  "activeZones": 9,
  "blockedZones": 0,
  "fullZones": 2,
  "maintenanceZones": 0,
  "totalCapacity": 190,
  "currentOccupancy": 42,
  "availableSlots": 148,
  "yardUtilizationPct": 22.1
}
```

---

## 10.2 List Yard Zones

| Field | Value |
|-------|-------|
| **Module** | Yard Map |
| **Endpoint** | `/yard/zones` |
| **HTTP Method** | `GET` |

### Query Parameters

`q`, `status`, `zone_type`, `skip`, `limit`

### Response Payload

`YardZoneOut[]` or paginated wrapper.

```json
{
  "id": "uuid",
  "zone_code": "ZN-WAITING-AREA",
  "zone_name": "Waiting Area",
  "zone_type": "WAITING_AREA",
  "max_capacity": 40,
  "status": "ACTIVE",
  "currentOccupancy": 12,
  "availableSlots": 28,
  "occupancyPct": 30,
  "is_mandatory": true,
  "map_code": null
}
```

---

## 10.3 Get Yard Zone

| Field | Value |
|-------|-------|
| **Module** | Yard Map |
| **Endpoint** | `/yard/zones/{zone_id}` |
| **HTTP Method** | `GET` |

---

## 10.4 Create Yard Zone

| Field | Value |
|-------|-------|
| **Module** | Yard Map |
| **Endpoint** | `/yard/zones` |
| **HTTP Method** | `POST` |
| **Permission** | `yard_zone.write` |

### Request Payload (`YardZoneCreate`)

```json
{
  "zone_name": "Overflow Staging",
  "zone_type": "STAGING",
  "max_capacity": 20,
  "status": "ACTIVE",
  "description": "Overflow area",
  "map_code": "G",
  "created_by": "yard-ui"
}
```

---

## 10.5 Update Yard Zone

| Field | Value |
|-------|-------|
| **Module** | Yard Map |
| **Endpoint** | `/yard/zones/{zone_id}` |
| **HTTP Method** | `PATCH` |
| **Permission** | `yard_zone.write` |

---

## 10.6 Delete Yard Zone

| Field | Value |
|-------|-------|
| **Module** | Yard Map |
| **Endpoint** | `/yard/zones/{zone_id}` |
| **HTTP Method** | `DELETE` |
| **Permission** | `yard_zone.write` |

### Error Responses

| Code | Detail |
|------|--------|
| 409 | Zone has vehicles or active queue entries |
| 409 | Mandatory zone cannot be deleted |

---

## 10.7 Move Vehicle to Zone

| Field | Value |
|-------|-------|
| **Module** | Yard Map |
| **Endpoint** | `/yard/move-vehicle/{vehicle_id}` |
| **HTTP Method** | `POST` |
| **Permission** | `yard_zone.write` |

### Request Payload (`MoveVehicleRequest`)

```json
{
  "zone_id": "uuid",
  "reason": "Manual relocation",
  "created_by": "yard-ui"
}
```

### Error Responses

| Code | Detail |
|------|--------|
| 409 | `ZONE_CAPACITY_EXCEEDED` |
| 409 | `ZONE_RULE_VIOLATION` |
| 409 | Zone BLOCKED or MAINTENANCE |

### Response Payload

```json
{
  "move": { "...YardZoneOut..." },
  "vehicle": { "...VehicleOut..." }
}
```

### Usage Notes

Creates `vehicle_zone_history` row and `VEHICLE_ENTERED_ZONE` / `VEHICLE_EXITED_ZONE` events.

---

## 10.8 Vehicle Zone History

| Field | Value |
|-------|-------|
| **Module** | Yard Map |
| **Endpoint** | `/yard/vehicle-history/{vehicle_id}` |
| **HTTP Method** | `GET` |

### Query Parameters

| Param | Default | Max |
|-------|---------|-----|
| `limit` | 50 | 200 |

### Response Payload

`VehicleZoneHistoryOut[]`

---

# 11. Reports APIs

**Router:** `reports.py`  
**Prefix:** `/api/reports`  
**Frontend service:** `reportsApi.js`, `operationsDashboardApi.js`

---

## 11.1 Operations Dashboard

| Field | Value |
|-------|-------|
| **Module** | Reports |
| **Endpoint** | `/reports/operations-dashboard` |
| **HTTP Method** | `GET` |

### Response Payload (`OperationsDashboardOut`)

```json
{
  "appointmentsToday": 24,
  "vehiclesEnteredToday": 18,
  "vehiclesExitedToday": 15,
  "vehiclesInYard": 32,
  "vehiclesWaiting": 3,
  "vehiclesLoading": 4,
  "vehiclesInExitHolding": 2,
  "avgTurnaroundMinutes": 87.5,
  "avgWaitingMinutes": 28.3,
  "avgLoadingMinutes": 52.1,
  "slaCompliancePct": 91.2
}
```

### Usage Notes

Canonical server-side KPIs. `vehiclesWaiting` uses WAITING status only.

---

## 11.2 Vehicle Journey Report (by ID)

| Field | Value |
|-------|-------|
| **Module** | Reports |
| **Endpoint** | `/reports/vehicle-journey/{vehicle_id}` |
| **HTTP Method** | `GET` |

### Query Parameters

`date_from`, `date_to` (ISO date strings)

### Response Payload (`VehicleJourneyReportOut`)

```json
{
  "vehicle": { "...": "..." },
  "appointment": { "...": "..." },
  "timeline": [
    {
      "eventType": "Checked In",
      "timestamp": "2026-06-03T08:00:00Z",
      "user": "gate-ui",
      "rawEventType": "VEHICLE_CHECKED_IN"
    }
  ],
  "metrics": {
    "waitingMinutes": 25,
    "loadingMinutes": 55,
    "turnaroundMinutes": 120,
    "exceptionCount": 1,
    "sla": {
      "waitingSlaMet": true,
      "loadingSlaMet": true,
      "turnaroundSlaMet": false
    }
  },
  "summary": {
    "vehicleNumber": "MH12AB1234",
    "appointmentRef": "APT-2026-001",
    "dockCode": "DK-001"
  }
}
```

---

## 11.3 Vehicle Journey Report (Lookup)

| Field | Value |
|-------|-------|
| **Module** | Reports |
| **Endpoint** | `/reports/vehicle-journey` |
| **HTTP Method** | `GET` |

### Query Parameters

| Param | Description |
|-------|-------------|
| `vehicle_number` | Plate lookup |
| `appointment_ref` | Booking reference lookup |
| `date_from`, `date_to` | Date range |

### Error Responses

| Code | Detail |
|------|--------|
| 404 | Vehicle not found for lookup params |

---

## 11.4 Dock Utilization Report

| Field | Value |
|-------|-------|
| **Module** | Reports |
| **Endpoint** | `/reports/dock-utilization` |
| **HTTP Method** | `GET` |

### Query Parameters

`date_from`, `date_to`, `zone`, `dock_id`

### Response Payload (`DockUtilizationReportOut`)

```json
{
  "rows": [
    {
      "dockId": "uuid",
      "dockCode": "DK-001",
      "dockName": "Bay 1",
      "zone": "Zone A",
      "vehiclesHandled": 12,
      "occupiedMinutes": 480,
      "idleMinutes": 960,
      "utilizationPct": 33.3,
      "avgServiceMinutes": 40.0,
      "avgDelayMinutes": 8.5
    }
  ],
  "dateFrom": "2026-05-27",
  "dateTo": "2026-06-03"
}
```

---

## 11.5 Dock Utilization Export

| Field | Value |
|-------|-------|
| **Module** | Reports |
| **Endpoint** | `/reports/dock-utilization/export` |
| **HTTP Method** | `GET` |

### Query Parameters

`fmt` = `csv` | `xlsx`, plus report filters

### Response

File download (`Content-Disposition: attachment`)

---

## 11.6 Labor Productivity Report

| Field | Value |
|-------|-------|
| **Module** | Reports |
| **Endpoint** | `/reports/labor-productivity` |
| **HTTP Method** | `GET` |

### Query Parameters

`date_from`, `date_to`

### Response Payload (`LaborProductivityReportOut`)

```json
{
  "rows": [
    {
      "laborId": "uuid",
      "teamCode": "T-A",
      "teamName": "Team Alpha",
      "assignments": 8,
      "vehiclesServed": 7,
      "loadingMinutes": 320,
      "pausedMinutes": 15,
      "exceptionsHandled": 2,
      "utilizationPct": 72.5
    }
  ]
}
```

---

## 11.7 Labor Productivity Export

| Endpoint | `/reports/labor-productivity/export`  
| Method | `GET` | `fmt=csv|xlsx`

---

## 11.8 Equipment Utilization Report

| Field | Value |
|-------|-------|
| **Module** | Reports |
| **Endpoint** | `/reports/equipment-utilization` |
| **HTTP Method** | `GET` |

### Response Payload (`EquipmentUtilizationReportOut`)

```json
{
  "rows": [
    {
      "equipmentId": "uuid",
      "equipmentCode": "EQ-101",
      "equipmentName": "Forklift 101",
      "assignments": 6,
      "usageMinutes": 240,
      "idleMinutes": 1200,
      "loadingMinutes": 210,
      "utilizationPct": 16.7
    }
  ]
}
```

---

## 11.9 Equipment Utilization Export

| Endpoint | `/reports/equipment-utilization/export`

---

## 11.10 Delay Analysis Report

| Field | Value |
|-------|-------|
| **Module** | Reports |
| **Endpoint** | `/reports/delay-analysis` |
| **HTTP Method** | `GET` |

### Response Payload (`DelayAnalysisReportOut`)

```json
{
  "rows": [
    {
      "category": "Waiting Delay",
      "categoryKey": "waiting",
      "count": 8,
      "avgDelayMinutes": 22.5,
      "worstDelayMinutes": 95,
      "affectedVehicles": 8
    }
  ]
}
```

### Categories

`waiting`, `loading`, `resource`, `dock`, `exit`, `detention`

---

## 11.11 Delay Analysis Export

| Endpoint | `/reports/delay-analysis/export`

---

## 11.12 SLA Compliance Report

| Field | Value |
|-------|-------|
| **Module** | Reports |
| **Endpoint** | `/reports/sla-compliance` |
| **HTTP Method** | `GET` |

### Response Payload (`SlaComplianceReportOut`)

```json
{
  "waitingSlaPct": 88.5,
  "loadingSlaPct": 92.0,
  "turnaroundSlaPct": 85.3,
  "overallSlaPct": 88.6,
  "byDock": [{ "label": "Bay 1", "key": "DK-001", "evaluated": 10, "compliant": 9, "slaPct": 90.0 }],
  "byLaborTeam": [],
  "byEquipment": [],
  "byMaterialType": []
}
```

---

## 11.13 SLA Compliance Export

| Endpoint | `/reports/sla-compliance/export`

---

# 12. Executive KPI APIs

**Pattern:** Client-side composition — **no dedicated backend endpoint**  
**Frontend service:** `executiveKpisApi.js`  
**Page:** `/kpis`

---

## 12.1 Executive KPI Bundle (Client)

| Field | Value |
|-------|-------|
| **Module** | Executive KPIs |
| **Endpoint** | *(client function)* `fetchExecutiveKpisBundle()` |
| **HTTP Method** | N/A (aggregates multiple GETs) |
| **Permission** | Read on underlying APIs |

### Composed Backend Calls

| # | Method | Endpoint | Data Used |
|---|--------|----------|-----------|
| 1 | GET | `/vehicles` | Yard occupancy, in-yard count, TAT |
| 2 | GET | `/appointments` | Shipment completion |
| 3 | GET | `/queue-entries` | Waiting queue depth |
| 4 | GET | `/docks` | Dock utilization |
| 5 | GET | `/yard-events` | 7-day trends, gate-in events |
| 6 | GET | `/detention` | Detention today exposure |

### Client Response Shape

```json
{
  "scorecard": [
    {
      "key": "avgWaitingMin",
      "metric": "Avg Waiting Time",
      "value": "28 min",
      "target": "30 min",
      "valueRaw": 28,
      "targetRaw": 30,
      "trend": -5.2,
      "status": "success",
      "performancePct": 93.3,
      "lowerIsBetter": true,
      "stateLabel": "On Target"
    }
  ],
  "headline": {
    "avgWaitingMin": 28,
    "avgTurnaroundMin": 87,
    "dockUtilizationPct": 72,
    "yardOccupancyPct": 44,
    "detentionToday": 45000,
    "fuelWasted": 18,
    "shipmentCompletionPct": 94,
    "customerSatPct": 91.6
  },
  "turnaroundTrend": [{ "day": "Mon", "minutes": 85 }],
  "yardOccupancyTrend": [{ "day": "Mon", "pct": 42 }],
  "targets": { "avgWaitingMin": 30, "avgTurnaroundMin": 90 },
  "assumptions": { "yardCapacity": "..." },
  "fetchErrors": []
}
```

### Scorecard Metrics

| Key | Target | Lower is Better |
|-----|--------|-----------------|
| `avgWaitingMin` | 30 | Yes |
| `avgTurnaroundMin` | 90 | Yes |
| `dockUtilizationPct` | 85 | No |
| `yardOccupancyPct` | 75 | No |
| `detentionToday` | ₹100,000 | Yes |
| `fuelWasted` | 200 L | Yes |
| `shipmentCompletionPct` | 95 | No |
| `customerSatPct` | 92 | No |

### Error Handling

- Individual source failures populate `fetchErrors[]`; partial render continues
- If **all** sources fail, throws aggregated error

### Usage Notes

- Yard capacity constant: **72** vehicles (`YARD_CAPACITY`)
- CSAT is a **proxy formula**, not survey data
- Fuel wastage = waiting count × 6 litres (estimate)

---

# 13. Detention APIs

**Router:** `yms.py`  
**Prefix:** `/api`  
**Frontend service:** `detentionApi.js` via `ymsApi.getDetentionDashboard()`

---

## 13.1 Get Detention Config

| Field | Value |
|-------|-------|
| **Module** | Detention |
| **Endpoint** | `/detention/config` |
| **HTTP Method** | `GET` |

### Response Payload (`DetentionConfigOut`)

```json
{
  "formula": "max(0, actual_hours - free_hours) × rate × category_multiplier",
  "free_hours": 2.0,
  "standard_rate": 1000,
  "hazmat_rate": 1500,
  "outside_surcharge_pct": 15,
  "contract_multiplier": 1.0,
  "company_multiplier": 0.85
}
```

---

## 13.2 List Detention Bundle

| Field | Value |
|-------|-------|
| **Module** | Detention |
| **Endpoint** | `/detention` |
| **HTTP Method** | `GET` |

### Query Parameters

| Param | Description |
|-------|-------------|
| `q` | Text filter on records |
| `status` | Pending, Approved, Disputed, Paid, Reviewed |

### Response Payload (`DetentionBundleOut`)

```json
{
  "records": [
    {
      "id": "uuid",
      "detention_ref": "DET-2026-0042",
      "vehicle_id": "uuid",
      "billing_date": "2026-06-03",
      "plate": "MH12AB1234",
      "category": "Contract",
      "transporter": "FastFreight",
      "free_hours": 2.0,
      "actual_hours": 4.5,
      "rate": 1000,
      "cost": 2500,
      "status": "Pending",
      "is_estimated": true
    }
  ],
  "summary": {
    "today": 12500,
    "monthToDate": 185000,
    "disputedCount": 2,
    "targetedSavings": 45000,
    "recordCount": 15,
    "breakdown": []
  },
  "config": { "...DetentionConfigOut..." }
}
```

---

## 13.3 Get Detention Detail

| Field | Value |
|-------|-------|
| **Module** | Detention |
| **Endpoint** | `/detention/{detention_id}` |
| **HTTP Method** | `GET` |

### Response Payload (`DetentionDetailOut`)

`DetentionOut` plus `events: YardEventOut[]`

---

## 13.4 Update Detention Status

| Field | Value |
|-------|-------|
| **Module** | Detention |
| **Endpoint** | `/detention/{detention_id}/status` |
| **HTTP Method** | `PATCH` |
| **Permission** | `detention.write` |

### Request Payload (`DetentionStatusUpdate`)

```json
{
  "status": "Approved",
  "remarks": "Verified with carrier",
  "created_by": "detention-ui"
}
```

### Valid Status Transitions

| From | To |
|------|-----|
| Pending | Approved, Disputed, Reviewed |
| Reviewed | Approved, Disputed, Paid |
| Approved | Paid, Disputed |
| Disputed | Approved, Reviewed, Paid |
| Paid | (terminal) |

### Error Responses

| Code | Detail |
|------|--------|
| 409 | Invalid status transition |
| 404 | Detention record not found |
| 403 | Role lacks `detention.write` (supervisor, admin) |

### Usage Notes

Emits `DETENTION_STATUS_CHANGED` yard event.

---

# 14. Global Error Reference

## 14.1 Common 409 Business Errors

| Module | Detail Pattern |
|--------|----------------|
| Appointments | `Booking reference already exists` |
| Vehicles | `Invalid status transition from X to Y` |
| Gate | `Entry blocked: ...` / `Exit checklist incomplete: ...` |
| Queue | `Queue entry is not in callable state` |
| Docks | `Dock is not available` |
| Flow | `RESOURCE_GATING_FAILED` |
| Labor/Equipment | `Cannot delete while assigned` |
| Loading | `Invalid exception_type` |
| Yard | `ZONE_CAPACITY_EXCEEDED` / `ZONE_RULE_VIOLATION` |
| Detention | Invalid status transition |

## 14.2 Permission Matrix (Mutations)

| Permission | Roles |
|------------|-------|
| `appointment.write` | admin, operations, gate, supervisor |
| `flow.check_in` | admin, operations, gate |
| `flow.call` | admin, operations, supervisor |
| `flow.assign_dock` | admin, operations, supervisor |
| `flow.vehicle_transition` | admin, operations, gate, supervisor |
| `dock.write` | admin, operations |
| `labor.write` | admin, operations |
| `equipment.write` | admin, operations |
| `detention.write` | admin, supervisor |
| `yard_event.write` | admin, operations, gate |
| `yard_zone.write` | admin, operations, gate, supervisor |
| `queue.write` | admin, operations, gate, supervisor |

## 14.3 OpenAPI / Swagger

Interactive API explorer available at runtime:

```
http://localhost:8001/docs      # Swagger UI
http://localhost:8001/redoc     # ReDoc
http://localhost:8001/openapi.json
```

## 14.4 Frontend Service Map

| Module | Primary Service File |
|--------|---------------------|
| Appointments | `appointmentsApi.js` |
| Gate | `gateManagementApi.js` |
| Queue | `queueApi.js` |
| Docks | `docksApi.js` |
| Labor | `laborApi.js` |
| Equipment | `equipmentApi.js` |
| Loading Ops | `loadingOpsApi.js` |
| Control Tower | `controlTowerAlertsApi.js`, `controlTowerApi.js` |
| Yard Map | `yardMapApi.js` |
| Reports | `reportsApi.js` |
| Executive KPIs | `executiveKpisApi.js` |
| Detention | `detentionApi.js` / `ymsApi.js` |
| Shared HTTP | `ymsApi.js` → `request()` |

---

# Appendix — Endpoint Index

| Method | Endpoint | Module |
|--------|----------|--------|
| GET | `/appointments` | Appointments |
| GET | `/appointments/{id}` | Appointments |
| POST | `/appointments` | Appointments |
| PATCH | `/appointments/{id}` | Appointments |
| GET | `/gate/dashboard` | Gate |
| POST | `/gate/lookup` | Gate |
| POST | `/gate/scan` | Gate |
| POST | `/gate/vehicles/{id}/arrived` | Gate |
| POST | `/gate/vehicles/{id}/approve-entry` | Gate |
| POST | `/gate/vehicles/{id}/reject-entry` | Gate |
| GET | `/gate/exit-holding` | Gate |
| GET | `/gate/exit-holding/dashboard` | Gate |
| GET | `/gate/vehicles/{id}/exit-verification` | Gate |
| PATCH | `/gate/vehicles/{id}/exit-checklist` | Gate |
| POST | `/gate/vehicles/{id}/verify-exit` | Gate |
| POST | `/gate/vehicles/{id}/gate-out` | Gate |
| POST | `/gate/vehicles/{id}/reject-exit` | Gate |
| GET | `/queue/bundle` | Queue |
| GET | `/queue/entries/{id}/detail` | Queue |
| POST | `/queue/entries/{id}/override` | Queue |
| GET | `/queue-entries` | Queue |
| POST | `/queue-entries` | Queue |
| PATCH | `/queue-entries/{id}` | Queue |
| POST | `/flow/check-in` | Queue |
| POST | `/flow/queue-entries/{id}/call` | Queue |
| GET | `/docks` | Docks |
| POST | `/docks` | Docks |
| PATCH | `/docks/{id}` | Docks |
| DELETE | `/docks/{id}` | Docks |
| POST | `/flow/queue-entries/{id}/assign-dock` | Docks |
| GET | `/docks/readiness/vehicle/{id}` | Docks |
| GET | `/flow/readiness/vehicle/{id}` | Docks |
| POST | `/flow/vehicles/{id}/transition` | Docks |
| GET | `/labor` | Labor |
| POST | `/labor` | Labor |
| PATCH | `/labor/{id}` | Labor |
| POST | `/labor/{id}/assign` | Labor |
| GET | `/equipment` | Equipment |
| POST | `/equipment` | Equipment |
| POST | `/equipment/{id}/assign` | Equipment |
| GET | `/loading-operations/exceptions` | Loading Ops |
| POST | `/loading-operations/exceptions` | Loading Ops |
| POST | `/loading-operations/pause` | Loading Ops |
| POST | `/loading-operations/resume` | Loading Ops |
| GET | `/control-tower/alerts` | Control Tower |
| GET | `/yard/zones` | Yard Map |
| POST | `/yard/move-vehicle/{id}` | Yard Map |
| GET | `/reports/operations-dashboard` | Reports |
| GET | `/reports/delay-analysis` | Reports |
| GET | `/reports/vehicle-journey/{id}` | Reports |
| GET | `/detention` | Detention |
| PATCH | `/detention/{id}/status` | Detention |

---

*Document generated from implemented YARD.OS API — June 2026*
