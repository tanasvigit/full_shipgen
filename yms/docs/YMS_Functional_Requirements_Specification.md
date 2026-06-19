# Functional Requirements Specification (FRS)
# Smart Yard Management System — YARD.OS

---

| Field | Value |
|-------|-------|
| **Document Title** | Functional Requirements Specification — YARD.OS |
| **Product** | YARD.OS — Vehicle Orchestration Platform |
| **Version** | 1.0 |
| **Status** | Implementation-Aligned |
| **Date** | June 2026 |
| **Audience** | Developers, Architects, Testers, Implementation Teams |
| **Source of Truth** | `yard_frontend` codebase (React + FastAPI + PostgreSQL) |
| **Companion Docs** | `YMS_Business_Requirements_Document.md`, `API_INVENTORY.md`, `DATA_MODEL_ERD.md` |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | June 2026 | YMS Engineering | Initial FRS from implemented platform |

### Related Artifacts

| Artifact | Path |
|----------|------|
| Business Requirements | `docs/YMS_Business_Requirements_Document.md` |
| Project Overview | `docs/YMS_Project_Overview.md` |
| API Inventory | `docs/API_INVENTORY.md` |
| Route Inventory | `docs/ROUTE_INVENTORY.md` |
| Data Model ERD | `docs/DATA_MODEL_ERD.md` |
| Backend Reference | `backend/YMS_BACKEND_NOTE.md` |

---

## Table of Contents

### Part I — Foundation
1. [Introduction](#1-introduction)
2. [System Architecture Summary](#2-system-architecture-summary)
3. [Global Reference Matrices](#3-global-reference-matrices)

### Part II — Module Specifications
4. [M-01 Control Tower](#m-01-control-tower)
5. [M-02 Operational Recommendations](#m-02-operational-recommendations)
6. [M-03 Appointments](#m-03-appointments)
7. [M-04 Gate Management](#m-04-gate-management)
8. [M-05 Virtual Queue](#m-05-virtual-queue)
9. [M-06 Vehicles](#m-06-vehicles)
10. [M-07 Docks](#m-07-docks)
11. [M-08 Labor](#m-08-labor)
12. [M-09 Equipment](#m-09-equipment)
13. [M-10 Loading Operations](#m-10-loading-operations)
14. [M-11 Yard Map](#m-11-yard-map)
15. [M-12 Operations Dashboard](#m-12-operations-dashboard)
16. [M-13 Delay Analysis](#m-13-delay-analysis)
17. [M-14 Detention Management](#m-14-detention-management)
18. [M-15 Executive KPIs](#m-15-executive-kpis)
19. [M-16 Reporting Suite](#m-16-reporting-suite)

### Part III — Cross-Cutting
20. [Cross-Module Synchronization](#20-cross-module-synchronization)
21. [Non-Functional Requirements](#21-non-functional-requirements)
22. [Appendices](#22-appendices)

---

# Part I — Foundation

## 1. Introduction

### 1.1 Purpose

This Functional Requirements Specification (FRS) defines the **functional behavior** of the Smart Yard Management System (YARD.OS) at a level of detail sufficient for development, testing, maintenance, and architectural review. Every requirement is traced to the **implemented codebase**.

### 1.2 Scope

The FRS covers all 16 functional modules, 62 yard event types, 15 vehicle lifecycle statuses, 5 RBAC roles, 9 Control Tower alert types, 8 loading exception types, and 7 reporting endpoints.

### 1.3 Conventions

| Convention | Meaning |
|------------|---------|
| **FR-** | Functional requirement ID |
| **M-NN** | Module identifier |
| **MUST** | Mandatory behavior (implemented) |
| **SHALL** | Normative specification language |
| API paths | Relative to `/api` base (default `http://localhost:8001/api`) |
| File paths | Relative to `yard_frontend/` unless absolute |

### 1.4 Module Specification Template

Each module (M-01 through M-16) documents:

1. Purpose  
2. Functional Description  
3. User Actions  
4. Inputs  
5. Outputs  
6. Business Rules  
7. Validations  
8. Data Dependencies  
9. Workflow Logic  
10. Status Transitions  
11. Integration Points  
12. Error Handling  
13. UI Screens  
14. API Dependencies  
15. Audit Events  
16. Reports Impact  

---

## 2. System Architecture Summary

### 2.1 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React + React Router + Tailwind | 19 / 7 / 3.4 |
| Backend | FastAPI + asyncpg | 0.110 / 0.29 |
| Database | PostgreSQL | 16 |
| Deployment | Docker Compose | Postgres:5433, API:8001, UI:3001 |

### 2.2 Backend Routers

| Router File | Prefix | Modules Served |
|-------------|--------|----------------|
| `routers/yms.py` | `/api` | Vehicles, Appointments, Queue, Docks, Equipment, Labor, Detention, Yard Events, Flow |
| `routers/gate.py` | `/api/gate` | Gate Management, Exit Holding |
| `routers/queue.py` | `/api/queue` | Virtual Queue bundle, override, detail |
| `routers/yard.py` | `/api/yard` | Yard Map, Zones |
| `routers/loading_ops.py` | `/api/loading-operations` | Loading exceptions, pause/resume |
| `routers/control_tower.py` | `/api/control-tower` | Alerts |
| `routers/reports.py` | `/api/reports` | All reports |
| `routers/search.py` | `/api/search` | Global search |
| `routers/auth.py` | `/api/auth` | RBAC |

### 2.3 Frontend Structure

| Path | Role |
|------|------|
| `frontend_1/src/pages/` | Route-level page components |
| `frontend_1/src/services/` | API client modules |
| `frontend_1/src/components/yms/` | Shared YMS UI components |
| `frontend_1/src/hooks/` | `usePermissions`, `useOperationalAutoRefresh`, `useYmsSyncRefresh` |
| `frontend_1/src/contexts/` | `AuthContext`, `UIContext` |

### 2.4 Sync Mechanism

| Mechanism | Constant / Event | Interval |
|-----------|------------------|----------|
| Polling | `OPERATIONAL_POLL_MS` | 30,000 ms |
| Custom event | `yms-data-changed` | On mutations |
| Drawer refresh | `useYmsSyncRefresh` | On event when drawer open |

---

## 3. Global Reference Matrices

### 3.1 Complete Vehicle Lifecycle Matrix

| From Status | To Status | Trigger | Module | API | Permission |
|-------------|-----------|---------|--------|-----|------------|
| DRAFT | SCHEDULED | Book appointment | Appointments | `POST /appointments` | appointment.write |
| DRAFT | CANCELLED | Cancel | Appointments | `PATCH /appointments/{id}` | appointment.write |
| SCHEDULED | ARRIVED | Mark arrived | Gate | `POST /gate/vehicles/{id}/arrived` | flow.vehicle_transition |
| SCHEDULED | CHECKED_IN | Approve entry (direct) | Gate | `POST /gate/vehicles/{id}/approve-entry` | flow.check_in |
| SCHEDULED | CANCELLED | Cancel | Appointments | `PATCH /appointments/{id}` | appointment.write |
| ARRIVED | CHECKED_IN | Approve entry | Gate | `POST /gate/vehicles/{id}/approve-entry` | flow.check_in |
| ARRIVED | WAITING | Check-in path | Gate | `POST /flow/check-in` | flow.check_in |
| ARRIVED | CANCELLED | Reject/cancel | Gate / Appts | `reject-entry` / PATCH | flow.vehicle_transition |
| CHECKED_IN | WAITING | Queue creation | Gate | `POST /flow/check-in` | flow.check_in |
| CHECKED_IN | CANCELLED | Cancel | Flow | `POST /flow/vehicles/{id}/transition` | flow.vehicle_transition |
| WAITING | CALLED | Call in | Queue | `POST /flow/queue-entries/{id}/call` | flow.call |
| WAITING | DOCK_ASSIGNED | Direct assign (edge) | Docks | `POST /flow/.../assign-dock` | flow.assign_dock |
| WAITING | CANCELLED | Cancel | Flow | transition | flow.vehicle_transition |
| CALLED | DOCK_ASSIGNED | Assign dock | Docks | `POST /flow/.../assign-dock` | flow.assign_dock |
| CALLED | CANCELLED | Cancel | Flow | transition | flow.vehicle_transition |
| DOCK_ASSIGNED | RESOURCE_PENDING | Auto (no labor) | Resource Gating | sync_vehicle_readiness | — |
| DOCK_ASSIGNED | READY_FOR_LOADING | Auto (ready) | Resource Gating | sync_vehicle_readiness | — |
| RESOURCE_PENDING | READY_FOR_LOADING | Labor assigned | Labor | `POST /labor/{id}/assign` | labor.write |
| RESOURCE_PENDING | CANCELLED | Cancel | Flow | transition | flow.vehicle_transition |
| READY_FOR_LOADING | LOADING | Start loading | Loading/Docks | `POST /flow/vehicles/{id}/transition` | flow.vehicle_transition |
| READY_FOR_LOADING | RESOURCE_PENDING | Labor released | Resource Gating | auto sync | — |
| LOADING | COMPLETED | Complete | Loading Ops | `POST /flow/vehicles/{id}/transition` | flow.vehicle_transition |
| LOADING | CANCELLED | Cancel | Flow | transition | flow.vehicle_transition |
| COMPLETED | EXIT_HOLDING | **Automatic** | System | `transition_vehicle_status` | — |
| EXIT_HOLDING | EXIT_VERIFIED | Verify exit | Gate | `POST /gate/vehicles/{id}/verify-exit` | flow.vehicle_transition |
| EXIT_VERIFIED | EXITED | Gate out | Gate | `POST /gate/vehicles/{id}/gate-out` | flow.vehicle_transition |
| EXITED | — | Terminal | — | — | — |
| CANCELLED | — | Terminal | — | — | — |

**Direct PATCH restriction:** Operational statuses (ARRIVED through EXITED) SHALL NOT be set via `PATCH /vehicles/{id}` or `PATCH /appointments/{id}`. Only `DRAFT`, `SCHEDULED`, `CANCELLED` permitted on direct PATCH.

**Flow transition API:** `POST /flow/vehicles/{id}/transition` accepts only `LOADING`, `COMPLETED`, `CANCELLED`. Exit statuses use gate endpoints.

### 3.2 Resource Assignment Matrix

| Resource | Assign API | Release API | Mandatory for Loading | Blocks Loading | Min Requirement |
|----------|-----------|-------------|----------------------|----------------|-----------------|
| Dock | `POST /flow/.../assign-dock` | Auto on COMPLETED/EXIT_* | Yes | Yes | AVAILABLE/OCCUPIED dock, CALLED queue |
| Labor | `POST /labor/{id}/assign` | Auto on COMPLETED | Yes | Yes | Team status ∉ {OFF_DUTY, UNAVAILABLE, BREAK} |
| Equipment | `POST /equipment/{id}/assign` | Auto on COMPLETED | No | No | Battery ≥ 20%, status ∉ {MAINTENANCE, OOS, CHARGING} |

**Readiness sync:** After any dock/labor/equipment assign or release, `sync_vehicle_readiness_status()` runs:
- Ready → `READY_FOR_LOADING`
- Not ready → `RESOURCE_PENDING`

**Readiness APIs:**
- `GET /api/flow/readiness/vehicle/{vehicle_id}` → `ResourceReadinessOut`
- `GET /api/docks/readiness/vehicle/{vehicle_id}` → `DockReadinessOut`
- `GET /api/labor/readiness/vehicle/{vehicle_id}` → `LaborReadinessOut`
- `GET /api/equipment/readiness/vehicle/{vehicle_id}` → `EquipmentReadinessOut`

### 3.3 Alert Matrix

| Alert Type | Severity | Trigger Condition | Threshold | Source File |
|------------|----------|-------------------|-------------|-------------|
| VEHICLE_WAITING_TOO_LONG | WARNING | status = WAITING | > 60 min | control_tower_alerts_service.py |
| HAZMAT_SLA_BREACH | CRITICAL | hazmat + WAITING | > 30 min | control_tower_alerts_service.py |
| LOADING_DELAY | CRITICAL | status = LOADING | > dock.estimated_service_time_min (default 90) | control_tower_alerts_service.py |
| EXIT_HOLDING_DELAY | WARNING | status = EXIT_HOLDING | > 30 min | control_tower_alerts_service.py |
| LABOR_UNAVAILABLE | WARNING | dock-assigned vehicle, no ASSIGNED labor | — | control_tower_alerts_service.py |
| EQUIPMENT_UNAVAILABLE | WARNING | dock requires equipment, none assigned | — | control_tower_alerts_service.py |
| DOCK_BLOCKED | CRITICAL | OCCUPIED dock, LOADING, no progress event | ≥ 30 min | control_tower_alerts_service.py |
| QUEUE_CONGESTION | WARNING | WAITING count | > 10 | control_tower_alerts_service.py |
| LOADING_EXCEPTION | CRITICAL/WARNING | OPEN or IN_PROGRESS exception | — | exception_severity() |

**API:** `GET /api/control-tower/alerts` → `{ activeAlerts[], criticalCount, warningCount }`

**Note:** Alerts are **derived** (not persisted). No acknowledge/dismiss API.

### 3.4 Exception Handling Matrix

| Exception Type | Severity | Create | Assign | Resolve | Close |
|----------------|----------|--------|--------|---------|-------|
| MATERIAL_SHORTAGE | WARNING | OPEN | → IN_PROGRESS | → RESOLVED | → CLOSED |
| EQUIPMENT_FAILURE | CRITICAL | OPEN | → IN_PROGRESS | → RESOLVED | → CLOSED |
| LABOR_DELAY | WARNING | OPEN | → IN_PROGRESS | → RESOLVED | → CLOSED |
| DOCUMENTATION_HOLD | WARNING | OPEN | → IN_PROGRESS | → RESOLVED | → CLOSED |
| SAFETY_HOLD | CRITICAL | OPEN | → IN_PROGRESS | → RESOLVED | → CLOSED |
| QUALITY_HOLD | WARNING | OPEN | → IN_PROGRESS | → RESOLVED | → CLOSED |
| WEATHER_DELAY | WARNING | OPEN | → IN_PROGRESS | → RESOLVED | → CLOSED |
| GENERIC_DELAY | WARNING | OPEN | → IN_PROGRESS | → RESOLVED | → CLOSED |

**APIs:** `/api/loading-operations/exceptions` (CRUD lifecycle)  
**Permission:** `yard_event.write`  
**Pause (parallel):** `POST /loading-operations/pause` → `LOADING_PAUSED` event  
**Resume:** `POST /loading-operations/resume` → `LOADING_RESUMED` event

### 3.5 Status Definitions

#### 3.5.1 Vehicle Statuses (`enums.py` YMS_STATUSES)

| Status | Code | Description | Zone (auto) |
|--------|------|-------------|-------------|
| Draft | DRAFT | Registered, no confirmed appointment | GATE_IN |
| Scheduled | SCHEDULED | Appointment booked | GATE_IN |
| Arrived | ARRIVED | At gate, not admitted | GATE_IN |
| Checked In | CHECKED_IN | Entry approved, transient | WAITING_AREA |
| Waiting | WAITING | In virtual queue | WAITING_AREA |
| Called | CALLED | Called for staging (UI: "Staging") | STAGING |
| Dock Assigned | DOCK_ASSIGNED | Bay assigned | LOADING |
| Resource Pending | RESOURCE_PENDING | Awaiting labor | LOADING |
| Ready for Loading | READY_FOR_LOADING | Resources ready | LOADING |
| Loading | LOADING | Active load/unload | LOADING |
| Completed | COMPLETED | Transient — auto → EXIT_HOLDING | EXIT_HOLDING |
| Exit Holding | EXIT_HOLDING | Awaiting exit verification | EXIT_HOLDING |
| Exit Verified | EXIT_VERIFIED | Cleared for gate-out | GATE_OUT |
| Exited | EXITED | Left facility | (cleared) |
| Cancelled | CANCELLED | Journey terminated | (cleared) |

#### 3.5.2 Dock Statuses

`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `BLOCKED`, `OUT_OF_SERVICE`  
Inactive for loading: `MAINTENANCE`, `BLOCKED`, `OUT_OF_SERVICE`

#### 3.5.3 Equipment Statuses

`IDLE`, `ASSIGNED`, `IN_USE`, `MAINTENANCE`, `CHARGING`, `OUT_OF_SERVICE`

#### 3.5.4 Labor Statuses

`ON_DUTY`, `OFF_DUTY`, `ASSIGNED`, `AVAILABLE`, `BREAK`, `UNAVAILABLE`

#### 3.5.5 Detention Statuses

`Pending`, `Approved`, `Disputed`, `Paid`, `Reviewed`

### 3.6 Event Definitions (62 types)

| Category | Event Types |
|----------|-------------|
| Appointment | APPOINTMENT_CREATED, APPOINTMENT_CONFIRMED, APPOINTMENT_CANCELLED, APPOINTMENT_RESCHEDULED, APPOINTMENT_STATUS_CHANGED, APPOINTMENT_UPDATED |
| Vehicle | VEHICLE_CREATED, VEHICLE_STATUS_CHANGED, VEHICLE_CHECKED_IN, VEHICLE_CALLED, VEHICLE_EXITED |
| Queue | QUEUE_ENTRY_CREATED, QUEUE_CALLED, QUEUE_PRIORITY_CHANGED, QUEUE_OVERRIDE, QUEUE_DELAY_WARNING, QUEUE_CRITICAL_WAIT |
| Dock | DOCK_CREATED, DOCK_UPDATED, DOCK_DELETED, DOCK_STATUS_CHANGED, DOCK_ASSIGNED, DOCK_REASSIGNED, DOCK_RELEASED, DOCK_RECOMMENDED, DOCK_CAPACITY_BLOCKED |
| Gate | GATE_SCAN, ENTRY_APPROVED, ENTRY_REJECTED, EXIT_HOLDING, EXIT_VERIFIED, EXIT_REJECTED, GATE_OUT_APPROVED |
| Loading | LOADING_STARTED, LOADING_COMPLETED, LOADING_PAUSED, LOADING_RESUMED |
| Exception | EXCEPTION_CREATED, EXCEPTION_ASSIGNED, EXCEPTION_RESOLVED, EXCEPTION_CLOSED |
| Labor | TEAM_CREATED, TEAM_UPDATED, TEAM_DELETED, TEAM_STATUS_CHANGED, TEAM_ASSIGNED, TEAM_RELEASED |
| Equipment | EQUIPMENT_CREATED, EQUIPMENT_UPDATED, EQUIPMENT_DELETED, EQUIPMENT_STATUS_CHANGED, EQUIPMENT_ASSIGNED, EQUIPMENT_RELEASED |
| Resource | RESOURCE_GATE_BLOCKED, RESOURCE_READINESS_UPDATED |
| Yard Zone | ZONE_CREATED, ZONE_UPDATED, ZONE_DELETED, ZONE_STATUS_CHANGED, ZONE_CAPACITY_EXCEEDED, ZONE_RULE_VIOLATION, VEHICLE_ENTERED_ZONE, VEHICLE_EXITED_ZONE, ZONE_TRANSFERRED |

**Storage:** `yard_events` table — fields: `vehicle_id`, `appointment_id`, `queue_entry_id`, `dock_id`, `equipment_id`, `labor_id`, `event_type`, `event_time`, `event_note`, `created_by`

### 3.7 Role Permissions Matrix

| Permission | admin | operations | gate | supervisor | read_only |
|------------|:-----:|:----------:|:----:|:----------:|:---------:|
| * (all) | ✓ | | | | |
| vehicle.write | ✓ | ✓ | | | |
| appointment.write | ✓ | ✓ | ✓ | ✓ | |
| queue.write | ✓ | ✓ | ✓ | ✓ | |
| dock.write | ✓ | ✓ | | | |
| flow.check_in | ✓ | ✓ | ✓ | | |
| flow.call | ✓ | ✓ | | ✓ | |
| flow.assign_dock | ✓ | ✓ | | ✓ | |
| flow.vehicle_transition | ✓ | ✓ | ✓ | ✓ | |
| detention.write | ✓ | | | ✓ | |
| equipment.write | ✓ | ✓ | | | |
| labor.write | ✓ | ✓ | | | |
| yard_event.write | ✓ | ✓ | ✓ | | |
| yard_zone.write | ✓ | ✓ | ✓ | ✓ | |

**Enforcement:** `auth_rbac.require_permission()` on mutation endpoints; `usePermissions()` hook on frontend.

### 3.8 Validation Rules (Global)

| Rule ID | Domain | Validation | HTTP Code |
|---------|--------|------------|-----------|
| VAL-001 | Vehicle PATCH | Operational statuses blocked on direct PATCH | 409 |
| VAL-002 | Appointment PATCH | Only DRAFT/SCHEDULED/CANCELLED on direct PATCH | 409 |
| VAL-003 | Flow transition | Only LOADING/COMPLETED/CANCELLED via flow API | 400 |
| VAL-004 | Uniqueness | vehicle_number, booking_reference, dock_code, equipment_code, team_code | 409 |
| VAL-005 | Resource gating | dock + labor required before LOADING | 409 + RESOURCE_GATING_FAILED |
| VAL-006 | Equipment battery | ≥ 20% for assignment | 409 |
| VAL-007 | Gate entry | All 6 entry checks must pass | 409 |
| VAL-008 | Gate exit | All 7 exit checklist items must be true | 409 |
| VAL-009 | Queue call | Status must be WAITING or CHECKED_IN | 409 |
| VAL-010 | Dock assign | Queue must be CALLED | 409 |
| VAL-011 | Zone move | Zone not BLOCKED/MAINTENANCE; capacity; cargo rules | 409 |
| VAL-012 | RBAC | Permission check on mutations | 403 |
| VAL-013 | Auth strict | Invalid role | 401 |

### 3.9 Cross-Module Synchronization Rules

| Rule ID | Trigger | Side Effects |
|---------|---------|--------------|
| SYNC-001 | `transition_vehicle_status(COMPLETED)` | release_loading_resources; LOADING_COMPLETED event; dock release; auto EXIT_HOLDING; exit_holding_at set |
| SYNC-002 | `transition_vehicle_status(EXIT_*)` | `_release_vehicle_dock_assignments` — dock AVAILABLE, queue dock_id NULL |
| SYNC-003 | Labor/equipment assign | `sync_vehicle_readiness_status` on linked vehicle |
| SYNC-004 | Dock assign | Vehicle DOCK_ASSIGNED; dock OCCUPIED; readiness sync |
| SYNC-005 | Gate check-in | Queue entry created; vehicle WAITING; priority score computed |
| SYNC-006 | Any mutation (frontend) | `notifyYmsDataChanged()` → 30s listeners + drawer refresh |
| SYNC-007 | Appointment status change | Linked vehicle status sync (when applicable) |
| SYNC-008 | Zone auto-move | `auto_move_vehicle_by_type` on status transitions |

---

# Part II — Module Specifications

---

## M-01 Control Tower

### 1. Purpose
Real-time operational command center aggregating live yard state, KPIs, queue/dock/yard snapshots, and derived Control Tower alerts for yard controllers and management.

### 2. Functional Description
The Control Tower page (`Dashboard.jsx`) performs **client-side aggregation** of multiple YMS list APIs plus the server-computed alerts endpoint. It displays KPI cards, an active alert panel, queue snapshot, dock summary, yard zone occupancy, and throughput visualizations. Data refreshes every 30 seconds and on `yms-data-changed` events.

### 3. User Actions
| Action | Actor | Result |
|--------|-------|--------|
| View dashboard | All roles | Load aggregated KPIs and alerts |
| Click alert row | All roles | Navigate to related entity (vehicle/dock) |
| Click KPI / queue row | All roles | Open entity drawer |
| Export daily PDF | All roles | Client-side PDF via `dailyReport.js` |
| Global search | All roles | Command palette (`TopNav`) |

### 4. Inputs
| Input | Type | Source |
|-------|------|--------|
| Vehicle list | API | `GET /vehicles?limit=500` |
| Appointments | API | `GET /appointments?limit=500` |
| Queue entries | API | `GET /queue-entries?limit=500` |
| Docks | API | `GET /docks?limit=500` |
| Yard zones | API | `GET /yard/zones?limit=500` |
| Yard events | API | `GET /yard-events?limit=300` |
| Detention bundle | API | `GET /detention` |
| Alerts | API | `GET /control-tower/alerts` |

### 5. Outputs
| Output | Description |
|--------|-------------|
| KPI cards | inYard, waiting, loading, exitHolding, dockUtil, yardOccupancy, avgTAT, detentionExposure |
| Alert panel | Sorted CRITICAL → WARNING, with vehicle/plate/dock/duration |
| Queue snapshot | Top N queue entries |
| Dock summary | Status breakdown |
| Zone occupancy | Per-zone counts |
| PDF export | Daily operations summary |

### 6. Business Rules
- FR-CT-01: Waiting KPI uses `count_vehicles_waiting()` — WAITING status only
- FR-CT-02: Loading KPI uses READY_FOR_LOADING + LOADING
- FR-CT-03: Alerts sorted CRITICAL first, then by duration descending
- FR-CT-04: Yard capacity reference: 72 vehicles (executiveKpisApi)
- FR-CT-05: Rule-based recommendations max 4 items (controlTowerApi.js)

### 7. Validations
- No user input validation (read-only dashboard)
- API failures: individual fetch errors caught; partial dashboard render

### 8. Data Dependencies
| Entity | Relationship |
|--------|--------------|
| vehicles | Primary KPI source |
| appointments | Today's schedule, reporting times |
| queue_entries | Queue depth, priority |
| docks | Utilization, occupancy |
| yard_zones | Occupancy map |
| yard_events | Throughput, timing |
| detention_records | Cost exposure |
| loading_operation_exceptions | Via alerts API |

### 9. Workflow Logic
```
Page mount → parallel fetch (8 APIs) → compute KPIs (controlTowerApi.js)
         → render cards + alerts
         → setInterval(30s) + listen yms-data-changed → re-fetch
```

### 10. Status Transitions
Control Tower does not mutate statuses. It **displays** vehicle/dock/queue statuses from live data.

### 11. Integration Points
| Integration | Direction |
|-------------|-----------|
| TopNav alert badges | Reads same alerts API |
| Operational Recommendations | Shares alert data |
| Entity drawers | Opens Vehicle/Dock/Appointment drawers via UIContext |
| Executive KPIs | Shares KPI computation patterns |

### 12. Error Handling
| Condition | Behavior |
|-----------|----------|
| API timeout/failure | EmptyState or partial render; console error |
| Alerts API fail | Badge counts default to 0 |
| No vehicles | Zero KPIs displayed |

### 13. UI Screens
| Element | File |
|---------|------|
| Page | `pages/Dashboard.jsx` |
| Route | `/` |
| Components | `TopBar`, `KpiCard`, `SectionCard`, `StatusPill`, `EmptyState` |
| Drawers (global) | `VehicleDrawer`, `DockDrawer`, `AppointmentDrawer`, `LoadingOpDrawer` |

### 14. API Dependencies
| Method | Endpoint | Schema |
|--------|----------|--------|
| GET | `/vehicles` | `VehicleOut[]` |
| GET | `/appointments` | `AppointmentOut[]` |
| GET | `/queue-entries` | `QueueEntryOut[]` |
| GET | `/docks` | `DockOut[]` |
| GET | `/yard/zones` | `YardZoneOut[]` |
| GET | `/yard-events` | `YardEventOut[]` |
| GET | `/detention` | `DetentionBundleOut` |
| GET | `/control-tower/alerts` | `ControlTowerAlertsOut` |

### 15. Audit Events
Control Tower does not emit events. It **reads** yard_events for throughput charts.

### 16. Reports Impact
- Feeds Executive KPIs (shared client aggregation)
- Alert data feeds Delay Analysis (exception category)
- Daily PDF export is client-side only

**Tests:** `backend/tests/test_control_tower_alerts.py`, `test_gate_dashboard_kpis.py`

---

## M-02 Operational Recommendations

### 1. Purpose
Present actionable operational guidance derived from live Control Tower alerts and yard metrics. Explicitly **not** predictive AI — rule-based mapping only.

### 2. Functional Description
`AiInsights.jsx` loads `aiInsightsApi.fetchOperationalInsights()` which calls `/control-tower/alerts` and maps each `alertType` to a categorized recommendation card with module icon, severity, and suggested action text.

### 3. User Actions
| Action | Result |
|--------|--------|
| View recommendations | Display alert-derived cards |
| Refresh | Manual or 30s auto-refresh |
| View summary metrics | Total, critical, warning, potential savings |

### 4. Inputs
| Input | Source |
|-------|--------|
| Control Tower alerts | `GET /control-tower/alerts` |
| Vehicle count (optional) | `GET /vehicles` for yard capacity insight |

### 5. Outputs
| Output | Description |
|--------|-------------|
| Recommendation cards | Queue Congestion, Loading Delay, Resource Shortage, Dock Blocked, Exit Delay, Yard Capacity |
| Summary | total, critical, warning, activeAlerts, potentialSavings |
| Category icons | Mapped per alertType |

### 6. Business Rules
- FR-REC-01: No static mock operational claims (removed AI_INSIGHTS from db.js usage)
- FR-REC-02: potentialSavings = waitingAlerts × ₹3,500
- FR-REC-03: Yard capacity alert when inYard ≥ 85% of capacity (40 in module)
- FR-REC-04: Navigation label: "Recommendations" (not "AI Insights")

### 7. Validations
- API failure → empty insights array with zero summary

### 8. Data Dependencies
`control_tower_alerts_service` output only.

### 9. Workflow Logic
```
fetch alerts → map alertType to insight module → build cards → render
```

### 10. Status Transitions
None (read-only).

### 11. Integration Points
| Module | Link |
|--------|------|
| Control Tower | Same alerts API |
| TopNav | Nav label `/ai` → "Recommendations" |

### 12. Error Handling
| Condition | Behavior |
|-----------|----------|
| Alerts API fail | Empty state with zero summary |
| No alerts | "No active recommendations" message |

### 13. UI Screens
| Element | File |
|---------|------|
| Page | `pages/AiInsights.jsx` |
| Route | `/ai` |
| Service | `services/aiInsightsApi.js` |

### 14. API Dependencies
| Method | Endpoint |
|--------|----------|
| GET | `/control-tower/alerts` |

### 15. Audit Events
None emitted.

### 16. Reports Impact
None direct.

---

## M-03 Appointments

### 1. Purpose
Schedule and manage vehicle visit appointments with slot, gate, priority, and cargo metadata. Entry point to vehicle lifecycle (SCHEDULED status).

### 2. Functional Description
Supports calendar/list views, date navigation, booking via `BookSlotDialog`, filtering, sorting, KPI cards, hour distribution chart, and export. Creates vehicle (if needed) and appointment atomically via `appointmentsApi`.

### 3. User Actions
| Action | Permission | API |
|--------|------------|-----|
| Book appointment | appointment.write | `POST /appointments` (+ vehicle create) |
| View list/calendar | All | `GET /appointments` |
| Open detail drawer | All | `GET /appointments/{id}` |
| Update appointment | appointment.write | `PATCH /appointments/{id}` |
| Export schedule | All | Client ExportMenu |
| Filter by date/status/type | All | Client-side |
| Navigate dates | All | Client-side |

### 4. Inputs
| Field | Schema | Required | Validation |
|-------|--------|----------|------------|
| booking_reference | string | Yes | 3–64 chars, unique |
| vehicle_id | UUID | Yes | Must exist |
| customer_name | string | Yes | 1–255 chars |
| shipment_reference | string | Yes | 1–255 chars |
| booking_date | date | Yes | ISO date |
| reporting_time | datetime | Yes | ISO datetime |
| scheduled_slot | string | Yes | 1–64 chars |
| gate_number | string | Yes | G1–G4 |
| priority | int | No | Default 0; UI: 0/50/90 |
| status | string | No | Default SCHEDULED |
| remarks | string | No | Optional |

**Vehicle fields (on create):** vehicle_number, vehicle_type, ownership_type, transporter_name, driver_name, operation_type, material_type

### 5. Outputs
| Output | Description |
|--------|-------------|
| Appointment record | `AppointmentOut` |
| Yard events | APPOINTMENT_CREATED, APPOINTMENT_CONFIRMED |
| KPI cards | scheduled, loading, completed per date |
| Hour chart | Bookings per hour |
| Recommendations | Dock/gate/zone at booking time |

### 6. Business Rules
- FR-APT-01: Unique booking_reference (409 on duplicate)
- FR-APT-02: Priority map: Normal=0, High=50, Urgent=90
- FR-APT-03: Slot warn ≥3 appts/slot; critical ≥5
- FR-APT-04: Gate slot capacity visibility: 10/gate/slot
- FR-APT-05: Duration estimates: Loading 60m, Unloading 90m, Transit 30m, Inter-Warehouse 60m
- FR-APT-06: Direct PATCH status: DRAFT, SCHEDULED, CANCELLED only

### 7. Validations
| Validation | Code | Message |
|------------|------|---------|
| Duplicate booking_reference | 409 | Booking reference already exists |
| Vehicle not found | 404 | Vehicle not found |
| Invalid status on PATCH | 409 | Cannot change appointment status via direct update... |
| Unsupported status value | 400 | Unsupported status |

### 8. Data Dependencies
| Entity | FK |
|--------|-----|
| vehicles | appointment.vehicle_id → vehicles.id |
| queue_entries | 1:1 via appointment_id (after check-in) |
| yard_events | appointment_id |

### 9. Workflow Logic
```
BookSlotDialog → validate fields → create/find vehicle → POST /appointments
              → emit APPOINTMENT_CREATED, APPOINTMENT_CONFIRMED
              → notifyYmsDataChanged → refresh list
```

### 10. Status Transitions
| Appointment Status | Vehicle Status (synced) |
|--------------------|-------------------------|
| SCHEDULED | SCHEDULED |
| CANCELLED | CANCELLED |
| (operational) | Via workflow modules, not PATCH |

### 11. Integration Points
| Module | Integration |
|--------|-------------|
| Gate | Lookup by appointment ref; entry checks appointment |
| Queue | Check-in creates queue from appointment |
| Vehicles | vehicle_id link; journey drawer |
| Control Tower | appointmentsToday KPI |

### 12. Error Handling
| HTTP | Handling |
|------|----------|
| 409 | Toast error with duplicate message |
| 404 | Toast: vehicle/appointment not found |
| 403 | Toast: permission denied |
| Network | Toast + retry button on page |

### 13. UI Screens
| Element | File |
|---------|------|
| Page | `pages/Appointments.jsx` |
| Route | `/appointments` |
| Dialog | `BookSlotDialog.jsx` |
| Drawer | `AppointmentDrawer.jsx` |
| Service | `services/appointmentsApi.js` |

### 14. API Dependencies
| Method | Endpoint | RBAC |
|--------|----------|------|
| GET | `/appointments` | — |
| GET | `/appointments/{id}` | — |
| POST | `/appointments` | appointment.write |
| PATCH | `/appointments/{id}` | appointment.write |
| POST | `/vehicles` | vehicle.write (on book) |

### 15. Audit Events
APPOINTMENT_CREATED, APPOINTMENT_CONFIRMED, APPOINTMENT_CANCELLED, APPOINTMENT_RESCHEDULED, APPOINTMENT_STATUS_CHANGED, APPOINTMENT_UPDATED

### 16. Reports Impact
- Operations Dashboard: appointmentsToday count
- Vehicle Journey: appointment context in timeline
- Delay Analysis: appointment reporting_time for lateness

**Tests:** `test_appointment_arrived.py`, `test_appointment_audit.py`

---

## M-04 Gate Management

### 1. Purpose
Digitize gate entry verification (6-check checklist) and exit holding workflow (7-check checklist, verify, gate-out). Split UI: Entry mode and Exit mode.

### 2. Functional Description
`Gate.jsx` provides vehicle lookup, entry verification panel, gate activity tabs, exit holding table, and integration with `ExitVerificationDrawer`. Backend logic in `gate_service.py`.

### 3. User Actions
| Action | Permission | API |
|--------|------------|-----|
| Lookup vehicle | All | `POST /gate/lookup` |
| Mark arrived | flow.vehicle_transition | `POST /gate/vehicles/{id}/arrived` |
| Approve entry | flow.check_in | `POST /gate/vehicles/{id}/approve-entry` |
| Reject entry | flow.vehicle_transition | `POST /gate/vehicles/{id}/reject-entry` |
| View exit holding | All | `GET /gate/exit-holding` |
| Toggle exit checklist | flow.vehicle_transition | `PATCH /gate/vehicles/{id}/exit-checklist` |
| Verify exit | flow.vehicle_transition | `POST /gate/vehicles/{id}/verify-exit` |
| Gate out | flow.vehicle_transition | `POST /gate/vehicles/{id}/gate-out` |
| Reject exit | yard_event.write | `POST /gate/vehicles/{id}/reject-exit` |
| Scan (optional) | yard_event.write | `POST /gate/scan` |

### 4. Inputs
**Entry lookup:** query (plate or APT-xxx), gate_id (default G1)  
**Entry approve:** vehicle_id, gate_id, queue_number (optional), queue_type (optional)  
**Exit checklist:** 7 booleans in `GateClearanceUpdate`  
**Reject:** reason string

### 5. Outputs
| Output | Description |
|--------|-------------|
| Gate dashboard KPIs | approaching, arrived, checkedIn, waiting, loadingPipeline, exitHolding, exitedToday |
| Entry checks array | 6 checks with passed/failed |
| Exit holding list | Vehicles in EXIT_HOLDING/EXIT_VERIFIED |
| Gate verification record | `gate_verifications` table |
| Queue entry | On successful check-in |

### 6. Business Rules
**Entry checks (all must pass):**
1. appointment_exists
2. appointment_active (not CANCELLED/EXITED/COMPLETED)
3. correct_date (booking_date = today)
4. vehicle_match
5. not_checked_in
6. gate_open (G1–G4)

**Exit checks (all must be true):**
loading_completed_verified, appointment_completed_verified, vehicle_verified, delivery_document_verified, invoice_approved, gate_pass_approved, security_cleared

### 7. Validations
| Condition | HTTP | Detail |
|-----------|------|--------|
| Query empty | 400 | Query required |
| Vehicle not found | 404 | No vehicle found for '{query}' |
| Entry blocked | 409 | Entry blocked: {failed checks} |
| Already checked in | 409 | Vehicle already checked in |
| Exit checklist incomplete | 409 | Exit checklist incomplete: {checks} |
| Wrong status for verify | 409 | Cannot verify exit from status... |
| Gate out not EXIT_VERIFIED | 409 | Gate out requires EXIT_VERIFIED |

### 8. Data Dependencies
| Entity | Usage |
|--------|-------|
| vehicles | Status transitions |
| appointments | Entry date/vehicle match |
| queue_entries | Created on check-in |
| gate_verifications | Checklist persistence |
| yard_events | All gate events |

### 9. Workflow Logic
**Entry:**
```
lookup → build entry checks → approve → check_in_vehicle → WAITING + queue entry
       → auto zone move to WAITING_AREA
```
**Exit:**
```
COMPLETED → auto EXIT_HOLDING → operator fills checklist → verify-exit → EXIT_VERIFIED
         → gate-out → EXITED → set exit_time
```

### 10. Status Transitions
| Action | From → To |
|--------|-----------|
| Mark arrived | SCHEDULED/DRAFT → ARRIVED |
| Approve entry | ARRIVED → CHECKED_IN → WAITING |
| Verify exit | EXIT_HOLDING → EXIT_VERIFIED |
| Gate out | EXIT_VERIFIED → EXITED |

### 11. Integration Points
| Module | Link |
|--------|------|
| Virtual Queue | Check-in creates queue entry |
| Loading Ops | COMPLETED triggers EXIT_HOLDING |
| Operations Dashboard | Canonical waiting/exit KPIs |
| Yard Map | Zone auto-placement on entry/exit |

### 12. Error Handling
Frontend: toast on all API errors. Entry panel shows blocked state with failed check hints.

### 13. UI Screens
| Element | File |
|---------|------|
| Page | `pages/Gate.jsx` |
| Route | `/gate` |
| Drawer | `ExitVerificationDrawer.jsx` |
| Service | `services/gateManagementApi.js` |
| Backend | `services/gate_service.py`, `routers/gate.py` |

### 14. API Dependencies
See §M-04 section 3 User Actions table. Schemas: `GateLookupRequest`, `GateApproveEntryRequest`, `GateClearanceUpdate`, `GateVerifyExitRequest`, `GateActionRequest`, `GateRejectRequest`.

### 15. Audit Events
GATE_SCAN, ENTRY_APPROVED, ENTRY_REJECTED, VEHICLE_CHECKED_IN, EXIT_HOLDING, EXIT_VERIFIED, EXIT_REJECTED, GATE_OUT_APPROVED, VEHICLE_EXITED, VEHICLE_STATUS_CHANGED

### 16. Reports Impact
- Gate KPIs align with Operations Dashboard
- Vehicle Journey includes all gate events
- Delay Analysis: exitDelay category

**Tests:** `test_gate_management.py`, `test_gate_dashboard_kpis.py`

---

## M-05 Virtual Queue

### 1. Purpose
Priority-ranked virtual queue for checked-in vehicles. Supports call-in, supervisor override, detention risk scoring, and dock recommendation.

### 2. Functional Description
`VirtualQueue.jsx` loads `GET /queue/bundle` for enriched entries with metrics. Displays rank, priority score, detention cost/risk, queue aging, and action buttons.

### 3. User Actions
| Action | Permission | API |
|--------|------------|-----|
| View queue | All | `GET /queue/bundle` |
| Call in | flow.call | `POST /flow/queue-entries/{id}/call` |
| Override priority | queue.write | `POST /queue/entries/{id}/override` |
| Open entry detail | All | `GET /queue/entries/{id}/detail` |
| Export queue | All | ExportMenu |

### 4. Inputs
**Override:** target_rank (1–500), reason (≥3 chars), supervisor (≥2 chars)  
**Call-in:** queue_entry_id

### 5. Outputs
| Output | Schema |
|--------|--------|
| Queue bundle | `QueueBundleOut` (entries + summary) |
| Entry detail | `QueueEntryDetailOut` (readiness, recommended dock) |
| Yard events | QUEUE_CALLED, QUEUE_OVERRIDE, QUEUE_PRIORITY_CHANGED |

### 6. Business Rules
- FR-QUE-01: priority_score = (priority × 10) + min(lateness_minutes, 120)
- FR-QUE-02: Callable: WAITING or CHECKED_IN
- FR-QUE-03: READY_TO_CALL: WAITING, rank ≤ 2, score ≥ 60
- FR-QUE-04: Sort: priority_score DESC, created_at DESC
- FR-QUE-05: Detention rate ₹35/min; risk thresholds per BRD

### 7. Validations
| Condition | HTTP |
|-----------|------|
| Not callable | 409 Queue entry is not in callable state |
| Override reason short | 400 Override reason is required |
| Supervisor name short | 400 Supervisor name is required |
| Invalid rank | 400 Target rank must be at least 1 |

### 8. Data Dependencies
queue_entries, appointments, vehicles, docks (recommendation), labor/equipment (readiness in detail)

### 9. Workflow Logic
```
check-in → create queue entry with priority_score
        → display in ranked list
        → call → CALLED → appear in Docks awaiting assignment
        → (optional) override → re-sort with new scores
```

### 10. Status Transitions
| Queue Status | Vehicle Status |
|--------------|----------------|
| WAITING | WAITING |
| CALLED | CALLED |
| (synced) | DOCK_ASSIGNED, etc. via dock flow |

### 11. Integration Points
Docks (awaiting assignment), Gate (check-in creates entry), Control Tower (QUEUE_CONGESTION alert)

### 12. Error Handling
Toast on call/override failure. Disabled Call In button for non-callable statuses.

### 13. UI Screens
`pages/VirtualQueue.jsx`, `QueueOverrideDialog.jsx`, `services/queueApi.js`

### 14. API Dependencies
`GET /queue/bundle`, `GET /queue/entries/{id}/detail`, `POST /queue/entries/{id}/override`, `POST /flow/queue-entries/{id}/call`, `POST /flow/queue-entries/{id}/assign-dock`

### 15. Audit Events
QUEUE_ENTRY_CREATED, QUEUE_CALLED, QUEUE_PRIORITY_CHANGED, QUEUE_OVERRIDE, QUEUE_DELAY_WARNING, QUEUE_CRITICAL_WAIT

### 16. Reports Impact
Queue metrics in Operations Dashboard; delay waiting category

**Tests:** `test_queue_service.py`

---

## M-06 Vehicles

### 1. Purpose
Central vehicle registry and lifecycle visibility. Tracks vehicle identity, ownership, operation type, current status, zone placement, and full journey timeline.

### 2. Functional Description
`Vehicles.jsx` lists all vehicles with search, status filters, and KPI summary. `VehicleDrawer.jsx` shows detail, journey timeline (yard_events), detention exposure, and linked appointment/queue/dock context. Manual vehicle creation supported for ad-hoc visits.

### 3. User Actions
| Action | Permission | API |
|--------|------------|-----|
| List/search vehicles | All | `GET /vehicles` |
| View vehicle detail | All | `GET /vehicles/{id}` |
| Create vehicle | vehicle.write | `POST /vehicles` |
| Update vehicle | vehicle.write | `PATCH /vehicles/{id}` |
| View journey timeline | All | `GET /yard-events?vehicle_id=` (client filter) |
| Export list | All | ExportMenu |
| Open from global search | All | `GET /search` |

### 4. Inputs
| Field | Required | Validation |
|-------|----------|------------|
| vehicle_number | Yes | 3–32 chars, unique |
| vehicle_type | Yes | TRUCK, TRAILER, CONTAINER, TANKER, LCV, TEMPO, CUSTOM |
| ownership_type | Yes | company, contract, outside |
| transporter_name | Yes | 1–255 chars |
| driver_name | Yes | 1–255 chars |
| operation_type | Yes | Loading, Unloading, Transit, Inter-Warehouse |
| material_type | No | From DOCK_MATERIAL_TYPES |
| status (PATCH) | No | DRAFT, SCHEDULED, CANCELLED only via direct PATCH |
| registration_source | No | appointment, manual |

### 5. Outputs
| Output | Description |
|--------|-------------|
| VehicleOut | Full vehicle record with timestamps |
| Journey timeline | Chronological yard_events |
| KPI cards | Total, in-yard, by-status breakdown |
| VEHICLE_CREATED event | On POST |

### 6. Business Rules
- FR-VEH-01: Operational lifecycle statuses cannot be set via PATCH — use workflow modules
- FR-VEH-02: `transition_vehicle_status` enforces STATUS_TRANSITIONS graph
- FR-VEH-03: Stage labels from VEHICLE_STAGE_LABELS for UI display
- FR-VEH-04: Vehicle zone_id updated via yard zone auto-move on status transitions
- FR-VEH-05: On COMPLETED/EXIT_* transitions, dock assignments released (`_release_vehicle_dock_assignments`)

### 7. Validations
| Condition | HTTP |
|-----------|------|
| Duplicate vehicle_number | 409 |
| Invalid status transition | 409 Invalid status transition from X to Y |
| Operational status via PATCH | 409 Cannot change vehicle status via direct update |
| Vehicle not found | 404 |

### 8. Data Dependencies
| Entity | Relationship |
|--------|--------------|
| appointments | 1:N via vehicle_id |
| queue_entries | 1:1 active per visit |
| docks | via queue_entry.dock_id |
| yard_zones | vehicle.zone_id |
| yard_events | vehicle_id FK |
| detention_records | vehicle_id FK |
| labor_teams | assigned_vehicle_id |
| equipment | assigned_vehicle_id |

### 9. Workflow Logic
Vehicle status changes flow through dedicated services:
- Gate: ARRIVED → CHECKED_IN → WAITING
- Queue: CALLED
- Dock flow: DOCK_ASSIGNED → RESOURCE_PENDING → READY_FOR_LOADING → LOADING
- Loading: COMPLETED
- Gate exit: EXIT_HOLDING → EXIT_VERIFIED → EXITED

### 10. Status Transitions
See Part I §3.1 Vehicle Lifecycle Matrix and `STATUS_TRANSITIONS` in `enums.py`.

### 11. Integration Points
All modules reference vehicles. Journey drawer used from Control Tower, Gate, Queue, Docks, Loading, Detention, Reports.

### 12. Error Handling
Toast on mutation failure. Drawer shows loading skeleton. Invalid transition shows API detail message.

### 13. UI Screens
`pages/Vehicles.jsx`, `components/yms/VehicleDrawer.jsx`, `services/ymsApi.js`

### 14. API Dependencies
`GET/POST /vehicles`, `GET/PATCH /vehicles/{id}`, `POST /flow/vehicles/{id}/transition`

### 15. Audit Events
VEHICLE_CREATED, VEHICLE_STATUS_CHANGED, VEHICLE_CHECKED_IN, VEHICLE_CALLED, VEHICLE_EXITED, plus all workflow events carrying vehicle_id

### 16. Reports Impact
Vehicle Journey Analytics (`/reports/vehicle-journey`), Delay Analysis (per-vehicle delays), SLA Compliance

**Tests:** `test_vehicle_lifecycle.py`, `test_dock_release_by_vehicle.py`

---

## M-07 Docks

### 1. Purpose
Manage physical loading/unloading bays: availability, assignment, occupancy, maintenance, and loading progress tracking.

### 2. Functional Description
`Docks.jsx` shows dock grid with status pills, awaiting-assignment queue (CALLED vehicles), active loading operations, and dock detail drawer. Assignment flow links queue entry → dock → vehicle status DOCK_ASSIGNED.

### 3. User Actions
| Action | Permission | API |
|--------|------------|-----|
| List docks | All | `GET /docks` |
| View dock detail | All | `GET /docks/{id}` |
| Create dock | dock.write | `POST /docks` |
| Update dock | dock.write | `PATCH /docks/{id}` |
| Assign dock to queue entry | flow.assign_dock | `POST /flow/queue-entries/{id}/assign-dock` |
| Start loading | flow.vehicle_transition | `POST /flow/vehicles/{id}/transition` (LOADING) |
| Complete loading | flow.vehicle_transition | `POST /flow/vehicles/{id}/transition` (COMPLETED) |
| Update loading progress | yard_event.write | Via loading progress in drawer |

### 4. Inputs
**DockCreate:** dock_code, dock_name, dock_type, zone, vehicle_types[], material_types[], capacity  
**AssignDockRequest:** dock_id, queue_entry_id  
**TransitionRequest:** status (LOADING, COMPLETED)

### 5. Outputs
| Output | Description |
|--------|-------------|
| DockOut | Status, assigned vehicle, occupancy timestamps |
| Awaiting assignment list | CALLED queue entries |
| Loading progress | Computed from yard_events |
| Events | DOCK_ASSIGNED, DOCK_REASSIGNED, DOCK_RELEASED, LOADING_STARTED, LOADING_COMPLETED |

### 6. Business Rules
- FR-DCK-01: Dock OCCUPIED when vehicle assigned; AVAILABLE on release
- FR-DCK-02: DOCK_INACTIVE_FOR_LOADING blocks assignment (MAINTENANCE, BLOCKED, OUT_OF_SERVICE)
- FR-DCK-03: Dock recommendation on call-in (DOCK_RECOMMENDED event)
- FR-DCK-04: Capacity check — DOCK_CAPACITY_BLOCKED event when full
- FR-DCK-05: `sync_vehicle_readiness_status` after dock assign — RESOURCE_PENDING or READY_FOR_LOADING
- FR-DCK-06: Stale occupancy reconciled via `_release_vehicle_dock_assignments` on exit lifecycle

### 7. Validations
| Condition | HTTP |
|-----------|------|
| Dock not available | 409 Dock is not available |
| Queue entry not callable | 409 |
| Dock inactive for loading | 409 |
| Invalid dock status transition | 409 |

### 8. Data Dependencies
docks, queue_entries, vehicles, yard_events, labor_teams, equipment

### 9. Workflow Logic
```
CALLED vehicle → assign-dock → DOCK_ASSIGNED + dock OCCUPIED
              → sync readiness (labor/equipment check)
              → READY_FOR_LOADING → transition LOADING
              → transition COMPLETED → release resources + EXIT_HOLDING
              → exit lifecycle → dock AVAILABLE
```

### 10. Status Transitions
**Dock:** AVAILABLE ↔ OCCUPIED; MAINTENANCE, BLOCKED, OUT_OF_SERVICE  
**Vehicle (dock phase):** CALLED → DOCK_ASSIGNED → RESOURCE_PENDING → READY_FOR_LOADING → LOADING → COMPLETED

### 11. Integration Points
Queue (call-in), Labor/Equipment (readiness), Loading Ops (exceptions/pause), Yard Map (zone), Control Tower (DOCK_BLOCKED alert)

### 12. Error Handling
Assign button disabled when dock unavailable. Toast on failed assignment. Drawer shows blocked reason.

### 13. UI Screens
`pages/Docks.jsx`, `components/yms/DockDrawer.jsx`, `services/docksApi.js`

### 14. API Dependencies
`GET/POST/PATCH /docks`, `POST /flow/queue-entries/{id}/assign-dock`, `POST /flow/vehicles/{id}/transition`

### 15. Audit Events
DOCK_CREATED, DOCK_UPDATED, DOCK_STATUS_CHANGED, DOCK_ASSIGNED, DOCK_REASSIGNED, DOCK_RELEASED, DOCK_RECOMMENDED, DOCK_CAPACITY_BLOCKED, LOADING_STARTED, LOADING_COMPLETED

### 16. Reports Impact
Dock Utilization Report, Operations Dashboard dock metrics, Delay Analysis (loading delay category)

**Tests:** `test_dock_assignment.py`, `test_dock_release_by_vehicle.py`

---

## M-08 Labor

### 1. Purpose
Manage labor teams: duty status, dock/vehicle assignment, material specialization, and readiness contribution for loading operations.

### 2. Functional Description
`Labor.jsx` provides team registry, status management, assignment to docks/vehicles, and utilization KPIs. Assignment triggers `sync_vehicle_readiness_status` on linked vehicle.

### 3. User Actions
| Action | Permission | API |
|--------|------------|-----|
| List teams | All | `GET /labor` |
| Create team | labor.write | `POST /labor` |
| Update team | labor.write | `PATCH /labor/{id}` |
| Change status | labor.write | `PATCH /labor/{id}/status` or shortcuts |
| Assign to dock/vehicle | labor.write | `POST /labor/{id}/assign` |
| Release | labor.write | `POST /labor/{id}/release` |
| Delete team | labor.write | `DELETE /labor/{id}` |

### 4. Inputs
**LaborCreate:** team_code, team_name, headcount, material_types[], shift  
**Assign:** dock_id and/or vehicle_id  
**Status shortcuts:** on-duty, off-duty, break, break-end, unavailable

### 5. Outputs
| Output | Description |
|--------|-------------|
| LaborTeamOut | Status, assignments, material types |
| TEAM_ASSIGNED, TEAM_RELEASED events | Audit trail |
| Readiness sync | Vehicle → RESOURCE_PENDING or READY_FOR_LOADING |

### 6. Business Rules
- FR-LAB-01: LABOR_STATUS_TRANSITIONS enforced on status change
- FR-LAB-02: Assigned team cannot be deleted (409)
- FR-LAB-03: Material type match considered in readiness check
- FR-LAB-04: Release on vehicle COMPLETED via `release_loading_resources`
- FR-LAB-05: Minimum ON_DUTY or AVAILABLE teams for readiness

### 7. Validations
| Condition | HTTP |
|-----------|------|
| Invalid status transition | 409 |
| Team assigned — delete blocked | 409 |
| Team not found | 404 |

### 8. Data Dependencies
labor_teams, docks, vehicles, yard_events

### 9. Workflow Logic
```
Create team (ON_DUTY) → assign to dock/vehicle → ASSIGNED
                     → vehicle readiness recalculated
                     → on release → AVAILABLE/ON_DUTY + TEAM_RELEASED event
```

### 10. Status Transitions
ON_DUTY ↔ ASSIGNED ↔ AVAILABLE ↔ BREAK ↔ OFF_DUTY ↔ UNAVAILABLE (per LABOR_STATUS_TRANSITIONS)

### 11. Integration Points
Docks (readiness gate), Loading Ops (resource shortage alerts), Control Tower (RESOURCE_SHORTAGE alert)

### 12. Error Handling
RBAC-gated action buttons via `usePermissions`. Toast on failed assign/release.

### 13. UI Screens
`pages/Labor.jsx`, `services/laborApi.js`

### 14. API Dependencies
Full `/labor` CRUD + assign/release/shortcut endpoints per API_INVENTORY.md

### 15. Audit Events
TEAM_ASSIGNED, TEAM_RELEASED, LABOR_STATUS_CHANGED

### 16. Reports Impact
Labor Productivity Report (`/reports/labor-productivity`)

**Tests:** `test_labor_service.py`, `test_cross_module_sync.py`

---

## M-09 Equipment

### 1. Purpose
Track yard equipment (forklifts, cranes, etc.): battery level, status, dock/vehicle assignment, and maintenance/charging cycles.

### 2. Functional Description
`Equipment.jsx` lists equipment with category/status filters, battery indicators, assignment actions, and maintenance shortcuts. Battery ≥20% required for assignment (EQUIPMENT_MIN_ASSIGN_BATTERY).

### 3. User Actions
| Action | Permission | API |
|--------|------------|-----|
| List equipment | All | `GET /equipment` |
| Create | equipment.write | `POST /equipment` |
| Update | equipment.write | `PATCH /equipment/{id}` |
| Status change | equipment.write | `PATCH /equipment/{id}/status` or shortcuts |
| Assign | equipment.write | `POST /equipment/{id}/assign` |
| Release | equipment.write | `POST /equipment/{id}/release` |
| Delete | equipment.write | `DELETE /equipment/{id}` |

### 4. Inputs
**EquipmentCreate:** equipment_code, equipment_name, equipment_type, battery_pct, category  
**Assign:** dock_id, vehicle_id  
**Status shortcuts:** in-use, idle, maintenance, charging, maintenance-complete

### 5. Outputs
| Output | Description |
|--------|-------------|
| EquipmentOut | Status, battery, assignments |
| EQUIPMENT_ASSIGNED, EQUIPMENT_RELEASED events | Audit |
| Readiness sync | On assign/release |

### 6. Business Rules
- FR-EQP-01: EQUIPMENT_STATUS_TRANSITIONS enforced
- FR-EQP-02: Battery < 20% blocks assignment (409)
- FR-EQP-03: Assigned equipment cannot be deleted
- FR-EQP-04: Release on vehicle COMPLETED
- FR-EQP-05: IN_USE/ASSIGNED counted as active in Control Tower alerts

### 7. Validations
| Condition | HTTP |
|-----------|------|
| Low battery | 409 Battery too low for assignment |
| Invalid transition | 409 |
| Assigned — delete blocked | 409 |

### 8. Data Dependencies
equipment, docks, vehicles, yard_events

### 9. Workflow Logic
```
IDLE → assign → ASSIGNED → in-use → IN_USE
     → release → IDLE + EQUIPMENT_RELEASED
     → maintenance/charging shortcuts per EQUIPMENT_STATUS_TRANSITIONS
```

### 10. Status Transitions
IDLE ↔ ASSIGNED ↔ IN_USE ↔ MAINTENANCE ↔ CHARGING ↔ OUT_OF_SERVICE

### 11. Integration Points
Docks (readiness), Loading Ops, Control Tower (RESOURCE_SHORTAGE)

### 12. Error Handling
Battery warning UI. Disabled assign when battery low. RBAC on mutations.

### 13. UI Screens
`pages/Equipment.jsx`, `services/equipmentApi.js`

### 14. API Dependencies
Full `/equipment` CRUD + assign/release/shortcut endpoints

### 15. Audit Events
EQUIPMENT_ASSIGNED, EQUIPMENT_RELEASED, EQUIPMENT_STATUS_CHANGED

### 16. Reports Impact
Equipment Utilization Report (`/reports/equipment-utilization`)

**Tests:** `test_equipment_service.py`

---

## M-10 Loading Operations

### 1. Purpose
Manage active loading exceptions, pause/resume operations, and exception resolution workflow during dock loading.

### 2. Functional Description
`LoadingOps.jsx` displays vehicles in LOADING/READY_FOR_LOADING with exception cards, pause state, and action drawers. Backend in `loading_ops.py` router and `loading_exceptions_service.py`.

### 3. User Actions
| Action | Permission | API |
|--------|------------|-----|
| List exceptions | All | `GET /loading-operations/exceptions` |
| Create exception | yard_event.write | `POST /loading-operations/exceptions` |
| Assign exception | yard_event.write | `POST /loading-operations/exceptions/{id}/assign` |
| Resolve exception | yard_event.write | `POST /loading-operations/exceptions/{id}/resolve` |
| Close exception | yard_event.write | `POST /loading-operations/exceptions/{id}/close` |
| Pause loading | yard_event.write | `POST /loading-operations/pause` |
| Resume loading | yard_event.write | `POST /loading-operations/resume` |
| View pause state | All | `GET /loading-operations/pause-state` |

### 4. Inputs
**LoadingExceptionCreate:** vehicle_id, appointment_id, queue_entry_id, dock_id, exception_type, description, created_by  
**Exception types:** MATERIAL_SHORTAGE, EQUIPMENT_FAILURE, LABOR_DELAY, DOCUMENTATION_HOLD, SAFETY_HOLD, QUALITY_HOLD, WEATHER_DELAY, GENERIC_DELAY  
**Pause:** vehicle_id, reason  
**Resolve/Close:** resolution_notes, closed_by

### 5. Outputs
| Output | Description |
|--------|-------------|
| LoadingExceptionOut | Status, severity, assignment |
| Pause state | isPaused, pausedAt, reason |
| Events | LOADING_DELAY, LOADING_PAUSED, LOADING_RESUMED, EXCEPTION_* |

### 6. Business Rules
- FR-LOD-01: Exception severity from `exception_severity()` — CRITICAL for SAFETY_HOLD, EQUIPMENT_FAILURE
- FR-LOD-02: Pause only when vehicle status LOADING
- FR-LOD-03: Active exceptions feed LOADING_DELAY Control Tower alert
- FR-LOD-04: Exception lifecycle: OPEN → IN_PROGRESS → RESOLVED → CLOSED
- FR-LOD-05: Pause does not change vehicle status — tracked via events

### 7. Validations
| Condition | HTTP |
|-----------|------|
| Vehicle not in LOADING | 409 |
| Exception not found | 404 |
| Invalid exception status transition | 409 |

### 8. Data Dependencies
loading_operation_exceptions, vehicles, docks, queue_entries, yard_events

### 9. Workflow Logic
```
Loading in progress → exception raised → LOADING_DELAY event
                   → assign to supervisor → resolve → close
                   → (optional) pause → LOADING_PAUSED → resume → LOADING_RESUMED
```

### 10. Status Transitions
**Exception:** OPEN → IN_PROGRESS → RESOLVED → CLOSED  
**Vehicle:** Unaffected by pause; LOADING → COMPLETED via flow transition

### 11. Integration Points
Docks, Control Tower (LOADING_DELAY alert), Operational Recommendations, Delay Analysis

### 12. Error Handling
`LoadingOpDrawer.jsx` RBAC-gated actions. Toast on API errors.

### 13. UI Screens
`pages/LoadingOps.jsx`, `components/yms/LoadingOpDrawer.jsx`, `services/loadingOpsApi.js`

### 14. API Dependencies
`/loading-operations/*` endpoints per `loading_ops.py`

### 15. Audit Events
LOADING_STARTED, LOADING_COMPLETED, LOADING_DELAY, LOADING_PAUSED, LOADING_RESUMED, EXCEPTION_CREATED, EXCEPTION_ASSIGNED, EXCEPTION_RESOLVED, EXCEPTION_CLOSED

### 16. Reports Impact
Delay Analysis (loading delay), Labor/Equipment productivity (paused minutes), SLA Compliance

**Tests:** `test_loading_exceptions.py`, `test_cross_module_sync.py`

---

## M-11 Yard Map

### 1. Purpose
Spatial visualization of yard zones, vehicle placement, dock locations, and zone capacity/occupancy for yard controllers.

### 2. Functional Description
`YardMap.jsx` renders zone grid from `GET /yard/zones` with vehicle counts, status coloring, and click-to-inspect. Supports manual zone moves (when permitted) and auto-placement driven by status transitions.

### 3. User Actions
| Action | Permission | API |
|--------|------------|-----|
| View zone map | All | `GET /yard/zones` |
| View zone detail | All | `GET /yard/zones/{id}` |
| Create zone | yard_zone.write | `POST /yard/zones` |
| Update zone | yard_zone.write | `PATCH /yard/zones/{id}` |
| Move vehicle to zone | yard_zone.write | `POST /yard/zones/move-vehicle` |
| View vehicles in zone | All | `GET /vehicles?zone_id=` (client filter) |

### 4. Inputs
**YardZoneCreate:** zone_code, zone_name, zone_type, capacity, coordinates  
**MoveVehicle:** vehicle_id, target_zone_id, reason

### 5. Outputs
| Output | Description |
|--------|-------------|
| YardZoneOut | Occupancy, status, zone_type |
| ZONE_VEHICLE_MOVED event | Manual and auto moves |
| Occupancy KPIs | Per-zone and total |

### 6. Business Rules
- FR-YRD-01: MANDATORY_YARD_ZONE_TYPES: GATE_IN, GATE_OUT, WAITING_AREA, EXIT_HOLDING
- FR-YRD-02: `auto_move_vehicle_by_type` on status transitions (SYNC-008)
- FR-YRD-03: Zone FULL when occupancy ≥ capacity
- FR-YRD-04: YARD_ZONE_STATUSES: ACTIVE, FULL, BLOCKED, MAINTENANCE
- FR-YRD-05: HAZMAT vehicles routed to HAZMAT zone type when configured

### 7. Validations
| Condition | HTTP |
|-----------|------|
| Zone at capacity | 409 Zone is full |
| Zone blocked/maintenance | 409 |
| Vehicle not found | 404 |

### 8. Data Dependencies
yard_zones, vehicles (zone_id), yard_events

### 9. Workflow Logic
```
Status transition → auto_move_vehicle_by_type → update zone_id + ZONE_VEHICLE_MOVED
Manual move → POST move-vehicle → same event
```

### 10. Status Transitions
Zone status: ACTIVE → FULL (occupancy); BLOCKED/MAINTENANCE manual

### 11. Integration Points
Gate (GATE_IN/GATE_OUT zones), Control Tower (yard occupancy KPI), Vehicles (zone_id)

### 12. Error Handling
Visual indicator for full/blocked zones. Toast on failed move.

### 13. UI Screens
`pages/YardMap.jsx`, `services/yardMapApi.js`, `backend/routers/yard.py`

### 14. API Dependencies
`GET/POST/PATCH /yard/zones`, `POST /yard/zones/move-vehicle`

### 15. Audit Events
ZONE_VEHICLE_MOVED, ZONE_STATUS_CHANGED, ZONE_CREATED, ZONE_UPDATED

### 16. Reports Impact
Operations Dashboard yard occupancy; Control Tower capacity alert

**Tests:** `test_yard_zones.py`

---

## M-12 Operations Dashboard

### 1. Purpose
Server-computed operational analytics dashboard with canonical KPIs — single source of truth for cross-module metric alignment.

### 2. Functional Description
`OperationsDashboard.jsx` calls `GET /reports/operations-dashboard` which aggregates via `operations_dashboard_service.py` using `operational_metrics.py` for consistent counting logic.

### 3. User Actions
| Action | Result |
|--------|--------|
| View dashboard | Load server bundle |
| Refresh | Manual + 30s auto |
| Export | Client export of KPI snapshot |
| Drill to module | Navigation links |

### 4. Inputs
None (read-only). Server reads live DB state.

### 5. Outputs
| Output | Field Examples |
|--------|----------------|
| OperationsDashboardOut | waiting, loadingPipeline, exitHolding, dockUtilization, queueDepth, appointmentsToday, exitedToday, avgTurnaroundMinutes, detentionExposure |

### 6. Business Rules
- FR-OPS-01: `count_vehicles_waiting()` = vehicles with status WAITING only
- FR-OPS-02: loadingPipeline = READY_FOR_LOADING + LOADING
- FR-OPS-03: Same metrics used by Gate dashboard (post FIX-1 alignment)
- FR-OPS-04: Turnaround computed from check-in to exit events

### 7. Validations
N/A (read-only)

### 8. Data Dependencies
vehicles, appointments, queue_entries, docks, yard_events, detention_records

### 9. Workflow Logic
```
GET /reports/operations-dashboard → operations_dashboard_service
                                 → operational_metrics canonical counts
                                 → OperationsDashboardOut JSON
```

### 10. Status Transitions
None (read-only)

### 11. Integration Points
Gate Management (KPI alignment), Control Tower (client-side uses same logic), Executive KPIs

### 12. Error Handling
Error state with retry. Partial data not applicable (single bundle).

### 13. UI Screens
`pages/OperationsDashboard.jsx`, route `/operations-dashboard`

### 14. API Dependencies
`GET /reports/operations-dashboard` → `OperationsDashboardOut`

### 15. Audit Events
None emitted

### 16. Reports Impact
Foundation for all operational reporting; referenced by Gate KPI validation tests

**Tests:** `test_gate_dashboard_kpis.py`, `test_operations_dashboard.py`

---

## M-13 Delay Analysis

### 1. Purpose
Categorize and quantify operational delays across waiting, loading, resource, dock, and exit phases for continuous improvement.

### 2. Functional Description
`DelayAnalysisReport.jsx` calls `GET /reports/delay-analysis` with optional date range. Server categorizes delays from yard_events and vehicle timestamps.

### 3. User Actions
| Action | Result |
|--------|--------|
| View report | Load delay categories |
| Filter by date range | date_from, date_to query params |
| Export CSV/XLSX | `GET /reports/delay-analysis/export` |

### 4. Inputs
| Param | Type | Default |
|-------|------|---------|
| date_from | ISO date | Rolling window |
| date_to | ISO date | Today |

### 5. Outputs
| Output | Fields |
|--------|--------|
| DelayAnalysisReportOut | rows[]: category, count, avgDelayMinutes, worstDelayMinutes, affectedVehicles |
| Categories | waiting, loading, resource, dock, exit, detention |

### 6. Business Rules
- FR-DLY-01: Waiting delay = time in WAITING beyond SLA threshold
- FR-DLY-02: Loading delay from LOADING_DELAY events and exception records
- FR-DLY-03: Exit delay from EXIT_HOLDING duration beyond threshold (30 min)
- FR-DLY-04: Aligns with Control Tower alert thresholds

### 7. Validations
Invalid date format → 422

### 8. Data Dependencies
yard_events, vehicles, loading_operation_exceptions, queue_entries

### 9. Workflow Logic
```
Aggregate events per vehicle visit → compute phase durations → bucket by category → summarize
```

### 10. Status Transitions
N/A

### 11. Integration Points
Control Tower alerts, Loading Ops exceptions, Detention, Gate exit holding

### 12. Error Handling
Empty report for date range with no data. Export error toast.

### 13. UI Screens
`pages/DelayAnalysisReport.jsx`, route `/reports/delay-analysis`

### 14. API Dependencies
`GET /reports/delay-analysis`, `GET /reports/delay-analysis/export?fmt=csv|xlsx`

### 15. Audit Events
Reads LOADING_DELAY, QUEUE_DELAY_WARNING, QUEUE_CRITICAL_WAIT, EXIT_HOLDING events

### 16. Reports Impact
Self — primary delay report; feeds executive review

---

## M-14 Detention Management

### 1. Purpose
Track carrier detention charges accrued during yard wait times, with approval/dispute workflow and cost exposure reporting.

### 2. Functional Description
`Detention.jsx` displays detention records with accrued minutes, calculated cost (₹35/min default), status workflow, and detail drawer with related events.

### 3. User Actions
| Action | Permission | API |
|--------|------------|-----|
| View detention bundle | All | `GET /detention` |
| View record detail | All | `GET /detention/{id}` |
| Update status | detention.write | `PATCH /detention/{id}/status` |
| View config | All | `GET /detention/config` |
| Filter by status | All | Query param on bundle |

### 4. Inputs
**DetentionStatusUpdate:** status (Approved, Disputed, Paid, Reviewed), notes, updated_by

### 5. Outputs
| Output | Description |
|--------|-------------|
| DetentionBundleOut | records[], summary (totalExposure, pendingCount) |
| DetentionDetailOut | Record + related yard_events |
| DETENTION_ACCRUED events | Auto-generated on threshold breach |

### 6. Business Rules
- FR-DET-01: Rate ₹35/minute (configurable via detention config)
- FR-DET-02: DETENTION_STATUS_TRANSITIONS: Pending → Approved/Disputed/Reviewed → Paid
- FR-DET-03: Accrual starts when wait exceeds configured free time
- FR-DET-04: Queue displays detention risk score from same rate
- FR-DET-05: Supervisor role has detention.write

### 7. Validations
| Condition | HTTP |
|-----------|------|
| Invalid status transition | 409 |
| Record not found | 404 |

### 8. Data Dependencies
detention_records, vehicles, appointments, yard_events

### 9. Workflow Logic
```
Vehicle waiting beyond threshold → auto accrual record (Pending)
                               → supervisor reviews → Approved/Disputed
                               → finance marks Paid
```

### 10. Status Transitions
Pending → Reviewed/Approved/Disputed → Paid (per DETENTION_STATUS_TRANSITIONS)

### 11. Integration Points
Virtual Queue (risk display), Control Tower (detention exposure KPI), Executive KPIs

### 12. Error Handling
RBAC on status changes. Toast on invalid transition.

### 13. UI Screens
`pages/Detention.jsx`, `services/detentionApi.js`

### 14. API Dependencies
`GET /detention`, `GET /detention/{id}`, `GET /detention/config`, `PATCH /detention/{id}/status`

### 15. Audit Events
DETENTION_ACCRUED, DETENTION_STATUS_CHANGED, DETENTION_APPROVED, DETENTION_DISPUTED

### 16. Reports Impact
Executive KPIs detention exposure; Delay Analysis detention category

**Tests:** `test_detention_service.py`

---

## M-15 Executive KPIs

### 1. Purpose
Management scorecard with trend indicators, SLA performance, capacity utilization, and financial exposure for executive decision-making.

### 2. Functional Description
`Kpis.jsx` aggregates client-side via `executiveKpisApi.fetchExecutiveKpisBundle()` from multiple list APIs (same pattern as Control Tower) plus computed trends, scorecard rows, and Recharts visualizations.

### 3. User Actions
| Action | Result |
|--------|--------|
| View scorecard | Load KPI bundle |
| Refresh | 30s auto-refresh |
| Export | CSV via toExportRows() |
| Filter scorecard | Client filterScorecardRows |

### 4. Inputs
Parallel API fetches: vehicles, appointments, docks, queue-entries, yard-events, detention, docks utilization data

### 5. Outputs
| Output | Description |
|--------|-------------|
| Scorecard rows | Metric, value, trend, status (success/warning/danger) |
| Charts | Throughput line, dock utilization bar |
| Summary | Yard capacity 72, utilization %, SLA indicators |
| formatINR | Indian Rupee formatting for cost metrics |

### 6. Business Rules
- FR-KPI-01: Yard capacity constant: 72 vehicles
- FR-KPI-02: Trend status thresholds: danger <70%, warning <85%, success ≥85%
- FR-KPI-03: Detention exposure summed from detention bundle
- FR-KPI-04: Client-side aggregation — no dedicated backend endpoint

### 7. Validations
API failure → error state with retry

### 8. Data Dependencies
All core YMS entities (read-only aggregation)

### 9. Workflow Logic
```
Parallel fetch → executiveKpisApi.computeBundle() → scorecard + charts → render
```

### 10. Status Transitions
N/A

### 11. Integration Points
Control Tower (shared KPI logic), Operations Dashboard (canonical ops metrics), Detention, Reports

### 12. Error Handling
Error banner with RefreshCw retry. Silent refresh preserves last good bundle on failure.

### 13. UI Screens
`pages/Kpis.jsx`, route `/kpis`, `services/executiveKpisApi.js`

### 14. API Dependencies
Multiple GET endpoints (vehicles, appointments, docks, queue-entries, yard-events, detention) — no single KPI endpoint

### 15. Audit Events
None emitted

### 16. Reports Impact
Complements SLA Compliance Report; executive summary layer over operational reports

---

## M-16 Reporting

### 1. Purpose
Structured operational and analytical reports with server-side computation, date filtering, and CSV/XLSX export for audit and management review.

### 2. Functional Description
Six report pages under `/reports/*` backed by `operational_reports_service.py`, `vehicle_journey_report_service.py`, and `report_export_service.py`.

### 3. User Actions
| Report | Route | API |
|--------|-------|-----|
| Delay Analysis | `/reports/delay-analysis` | `GET /reports/delay-analysis` |
| Dock Utilization | `/reports/dock-utilization` | `GET /reports/dock-utilization` |
| Labor Productivity | `/reports/labor-productivity` | `GET /reports/labor-productivity` |
| Equipment Utilization | `/reports/equipment-utilization` | `GET /reports/equipment-utilization` |
| SLA Compliance | `/reports/sla-compliance` | `GET /reports/sla-compliance` |
| Vehicle Journey | `/reports/vehicle-journey` | `GET /reports/vehicle-journey` |

All support `?fmt=csv|xlsx` export endpoints.

### 4. Inputs
| Param | Reports Using |
|-------|---------------|
| date_from, date_to | All reports |
| zone, dock_id | Dock Utilization |
| vehicle_number, appointment_ref | Vehicle Journey lookup |

### 5. Outputs
| Report | Key Output Fields |
|--------|-------------------|
| Dock Utilization | dockCode, vehiclesHandled, occupiedMinutes, utilizationPct, avgDelayMinutes |
| Labor Productivity | teamCode, assignments, vehiclesServed, loadingMinutes, utilizationPct |
| Equipment Utilization | equipmentCode, usageMinutes, idleMinutes, utilizationPct |
| Delay Analysis | category, count, avgDelayMinutes, worstDelayMinutes |
| SLA Compliance | waitingSlaPct, loadingSlaPct, turnaroundSlaPct, overallSlaPct |
| Vehicle Journey | stages[], events[], durations, totalTurnaroundMinutes |

### 6. Business Rules
- FR-RPT-01: All reports use live DB — no materialized views
- FR-RPT-02: Export formats: csv, xlsx via `export_response()`
- FR-RPT-03: Vehicle Journey resolves ID from vehicle_number or appointment_ref
- FR-RPT-04: Date defaults to rolling 7-day window when omitted
- FR-RPT-05: Reports accessible via Sidebar navigation (FIX-6)

### 7. Validations
Invalid date → 422. Vehicle not found for journey → 404.

### 8. Data Dependencies
All YMS tables depending on report type

### 9. Workflow Logic
```
User selects report + date range → GET /reports/{type} → service aggregation → render table/charts
                                → Export → GET /reports/{type}/export → file download
```

### 10. Status Transitions
N/A

### 11. Integration Points
Every operational module feeds report data via yard_events and entity tables

### 12. Error Handling
Empty state for no data. Export failure toast. Loading skeletons.

### 13. UI Screens
| Page | File |
|------|------|
| Delay Analysis | `DelayAnalysisReport.jsx` |
| Dock Utilization | `DockUtilizationReport.jsx` |
| Labor Productivity | `LaborProductivityReport.jsx` |
| Equipment Utilization | `EquipmentUtilizationReport.jsx` |
| SLA Compliance | `SlaComplianceReport.jsx` |
| Vehicle Journey | `VehicleJourneyAnalytics.jsx` |
| Shared | `OperationalReportPage.jsx` base layout |

### 14. API Dependencies
`backend/routers/reports.py` — 6 report GET + 5 export GET endpoints

### 15. Audit Events
All reports read yard_events; Vehicle Journey displays full event timeline

### 16. Reports Impact
Self-contained module; primary management analytics output

**Tests:** `test_operational_reports.py`, `test_vehicle_journey_report.py`

---

# Part III — Cross-Cutting Specifications

## 3.1 Non-Functional Requirements

| ID | Category | Requirement | Implementation |
|----|----------|-------------|----------------|
| NFR-01 | Performance | Dashboard refresh ≤30s | setInterval(30000) + yms-data-changed |
| NFR-02 | Scalability | List APIs support pagination | skip/limit query params |
| NFR-03 | Security | RBAC on all mutations | auth_rbac.py + require_permission |
| NFR-04 | Security | Header-based auth (dev) | X-YMS-Role, X-YMS-User |
| NFR-05 | Availability | Docker Compose deployment | ports 3001/8001/5433 |
| NFR-06 | Data integrity | Status transition graph | STATUS_TRANSITIONS enforcement |
| NFR-07 | Auditability | 62 yard event types | yard_events table append-only |
| NFR-08 | Consistency | Canonical KPI definitions | operational_metrics.py |
| NFR-09 | Testability | 122+ backend tests | pytest in backend/tests/ |
| NFR-10 | UX | Real-time sync | notifyYmsDataChanged() event bus |

## 3.2 Cross-Module Synchronization (Detailed)

### SYNC-001: Loading Completion Cascade
**Trigger:** `transition_vehicle_status(vehicle_id, "COMPLETED")`  
**Sequence:**
1. Validate transition LOADING → COMPLETED
2. `release_loading_resources(vehicle_id)` — labor + equipment release
3. Emit LOADING_COMPLETED, VEHICLE_STATUS_CHANGED
4. `_release_vehicle_dock_assignments(vehicle_id)` — dock AVAILABLE, queue dock_id NULL
5. Auto-transition COMPLETED → EXIT_HOLDING
6. Set exit_holding_at timestamp
7. Emit EXIT_HOLDING event
8. `auto_move_vehicle_by_type` → EXIT_HOLDING zone

### SYNC-002: Exit Lifecycle Dock Release
**Trigger:** Any transition to EXIT_HOLDING, EXIT_VERIFIED, EXITED, CANCELLED  
**Effect:** `_release_vehicle_dock_assignments` clears stale dock occupancy

### SYNC-003: Resource Readiness
**Trigger:** Labor or equipment assign/release  
**Effect:** `sync_vehicle_readiness_status(vehicle_id)` → RESOURCE_PENDING or READY_FOR_LOADING

### SYNC-004: Gate Check-In
**Trigger:** `approve_entry` / `check_in_vehicle`  
**Effect:** Vehicle WAITING, queue entry created with priority_score, zone → WAITING_AREA

### SYNC-005: Frontend Event Bus
**Trigger:** Any mutation in frontend services  
**Effect:** `notifyYmsDataChanged()` → all 30s listeners + open drawer refresh

### SYNC-006: Appointment-Vehicle Sync
**Trigger:** Appointment status change to CANCELLED  
**Effect:** Linked vehicle → CANCELLED if still SCHEDULED

### SYNC-007: Call-In Dock Recommendation
**Trigger:** `call_queue_entry`  
**Effect:** Evaluate available docks → emit DOCK_RECOMMENDED or DOCK_CAPACITY_BLOCKED

## 3.3 Authentication and Authorization

### Header Contract
```
X-YMS-Role: admin | operations | gate | supervisor | read_only
X-YMS-User: <optional identity string>
```

### Permission Matrix (Summary)
| Permission | admin | operations | gate | supervisor | read_only |
|------------|-------|------------|------|------------|-----------|
| vehicle.write | ✓ | ✓ | — | — | — |
| appointment.write | ✓ | ✓ | ✓ | ✓ | — |
| queue.write | ✓ | ✓ | ✓ | ✓ | — |
| dock.write | ✓ | ✓ | — | — | — |
| flow.check_in | ✓ | ✓ | ✓ | — | — |
| flow.call | ✓ | ✓ | — | ✓ | — |
| flow.assign_dock | ✓ | ✓ | — | ✓ | — |
| flow.vehicle_transition | ✓ | ✓ | ✓ | ✓ | — |
| detention.write | ✓ | — | — | ✓ | — |
| equipment.write | ✓ | ✓ | — | — | — |
| labor.write | ✓ | ✓ | — | — | — |
| yard_event.write | ✓ | ✓ | ✓ | — | — |
| yard_zone.write | ✓ | ✓ | ✓ | ✓ | — |

Frontend enforcement: `hooks/usePermissions.js` → `can(permission)` hides/disables mutation controls.

## 3.4 Global Error Handling Patterns

| HTTP | Meaning | Frontend Pattern |
|------|---------|------------------|
| 400 | Validation failure | Toast with detail message |
| 403 | Permission denied | Toast + disabled UI (RBAC) |
| 404 | Entity not found | Toast + redirect/close drawer |
| 409 | Business rule conflict | Toast with specific reason |
| 422 | Schema validation | Form field errors |
| 500 | Server error | Toast + retry option |

Backend pattern: `HTTPException(status_code=..., detail="...")` with descriptive messages.

## 3.5 Data Model Summary

| Table | Primary Key | Key FKs |
|-------|-------------|---------|
| vehicles | id (UUID) | zone_id |
| appointments | id | vehicle_id |
| queue_entries | id | vehicle_id, appointment_id, dock_id |
| docks | id | assigned_vehicle_id |
| yard_zones | id | — |
| yard_events | id | vehicle_id, appointment_id, dock_id, queue_entry_id |
| labor_teams | id | assigned_dock_id, assigned_vehicle_id |
| equipment | id | assigned_dock_id, assigned_vehicle_id |
| detention_records | id | vehicle_id, appointment_id |
| loading_operation_exceptions | id | vehicle_id, dock_id, queue_entry_id |
| gate_verifications | id | vehicle_id |

Full ERD: `docs/DATA_MODEL_ERD.md`

## 3.6 Event Catalog (62 Types)

Grouped by domain:

**Appointment:** APPOINTMENT_CREATED, APPOINTMENT_CONFIRMED, APPOINTMENT_CANCELLED, APPOINTMENT_RESCHEDULED, APPOINTMENT_STATUS_CHANGED, APPOINTMENT_UPDATED

**Vehicle:** VEHICLE_CREATED, VEHICLE_STATUS_CHANGED, VEHICLE_CHECKED_IN, VEHICLE_CALLED, VEHICLE_EXITED

**Gate:** GATE_SCAN, ENTRY_APPROVED, ENTRY_REJECTED, EXIT_HOLDING, EXIT_VERIFIED, EXIT_REJECTED, GATE_OUT_APPROVED

**Queue:** QUEUE_ENTRY_CREATED, QUEUE_CALLED, QUEUE_PRIORITY_CHANGED, QUEUE_OVERRIDE, QUEUE_DELAY_WARNING, QUEUE_CRITICAL_WAIT

**Dock:** DOCK_CREATED, DOCK_UPDATED, DOCK_STATUS_CHANGED, DOCK_ASSIGNED, DOCK_REASSIGNED, DOCK_RELEASED, DOCK_RECOMMENDED, DOCK_CAPACITY_BLOCKED

**Loading:** LOADING_STARTED, LOADING_COMPLETED, LOADING_DELAY, LOADING_PAUSED, LOADING_RESUMED

**Exception:** EXCEPTION_CREATED, EXCEPTION_ASSIGNED, EXCEPTION_RESOLVED, EXCEPTION_CLOSED

**Labor:** TEAM_ASSIGNED, TEAM_RELEASED, LABOR_STATUS_CHANGED

**Equipment:** EQUIPMENT_ASSIGNED, EQUIPMENT_RELEASED, EQUIPMENT_STATUS_CHANGED

**Detention:** DETENTION_ACCRUED, DETENTION_STATUS_CHANGED, DETENTION_APPROVED, DETENTION_DISPUTED

**Yard:** ZONE_VEHICLE_MOVED, ZONE_STATUS_CHANGED, ZONE_CREATED, ZONE_UPDATED

## 3.7 Control Tower Alert Types

| Alert Type | Severity | Threshold | Source Module |
|------------|----------|-----------|---------------|
| VEHICLE_WAITING_TOO_LONG | WARNING | WAITING > 60 min | Virtual Queue / Vehicles |
| HAZMAT_SLA_BREACH | CRITICAL | HAZMAT + WAITING > 30 min | Vehicles |
| LOADING_DELAY | CRITICAL | LOADING > dock estimated_service_time_min (default 90) | Loading Ops / Docks |
| EXIT_HOLDING_DELAY | WARNING | EXIT_HOLDING > 30 min | Gate |
| LABOR_UNAVAILABLE | WARNING | Dock-assigned vehicle, no ASSIGNED labor | Labor |
| EQUIPMENT_UNAVAILABLE | WARNING | Dock requires equipment, none assigned | Equipment |
| DOCK_BLOCKED | CRITICAL | OCCUPIED dock, LOADING, no progress ≥ 30 min | Docks |
| QUEUE_CONGESTION | WARNING | WAITING count > 10 | Virtual Queue |
| LOADING_EXCEPTION | CRITICAL/WARNING | OPEN/IN_PROGRESS exception per exception_severity() | Loading Ops |

## 3.8 Deployment Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  React SPA  │────▶│  FastAPI    │────▶│ PostgreSQL   │
│  :3001      │     │  :8001      │     │  :5433       │
└─────────────┘     └─────────────┘     └──────────────┘
       │                   │
       │  /api proxy       │  asyncpg pool
       └───────────────────┘
```

Docker Compose: `docker-compose.yml` in project root.  
Frontend env: `REACT_APP_API_URL` → backend base.

## 3.9 Test Coverage Map

| Module | Test Files |
|--------|------------|
| Gate | test_gate_management.py, test_gate_dashboard_kpis.py |
| Queue | test_queue_service.py |
| Docks | test_dock_assignment.py, test_dock_release_by_vehicle.py |
| Vehicles | test_vehicle_lifecycle.py |
| Loading | test_loading_exceptions.py |
| Cross-module | test_cross_module_sync.py |
| Control Tower | test_control_tower_alerts.py |
| Reports | test_operational_reports.py, test_vehicle_journey_report.py |
| Detention | test_detention_service.py |
| Labor/Equipment | test_labor_service.py, test_equipment_service.py |
| Appointments | test_appointment_arrived.py, test_appointment_audit.py |
| Yard | test_yard_zones.py |

**Total:** 122 backend tests (as of document generation).

## 3.10 API Route Index

| Router | Prefix | Key Endpoints |
|--------|--------|---------------|
| auth | `/auth` | me, roles, permissions |
| yms | `/` | vehicles, appointments, queue-entries, docks, yard-events, flow, detention, equipment, labor |
| gate | `/gate` | lookup, approve-entry, exit-holding, verify-exit, gate-out |
| queue | `/queue` | bundle, entries/{id}/detail, entries/{id}/override |
| yard | `/yard` | zones, move-vehicle |
| loading_ops | `/loading-operations` | exceptions, pause, resume |
| control_tower | `/control-tower` | alerts |
| reports | `/reports` | operations-dashboard, 6 analytics reports + exports |
| search | `/search` | global search |

Full inventory: `docs/API_INVENTORY.md`

---

# Appendices

## Appendix A — Glossary

| Term | Definition |
|------|------------|
| YMS | Yard Management System |
| Control Tower | Real-time operational dashboard (Dashboard.jsx) |
| Virtual Queue | Priority-ranked waiting list post check-in |
| Detention | Carrier charge for excessive wait time |
| Readiness | Labor + equipment assigned → READY_FOR_LOADING |
| TAT | Turnaround Time — check-in to exit |
| RBAC | Role-Based Access Control via X-YMS-Role header |

## Appendix B — File Reference Index

| Layer | Path |
|-------|------|
| Backend entry | `backend/main.py` |
| Enums/transitions | `backend/enums.py` |
| Schemas | `backend/schemas.py` |
| Core service | `backend/services/yms_service.py` |
| Metrics | `backend/services/operational_metrics.py` |
| Alerts | `backend/services/control_tower_alerts_service.py` |
| Frontend entry | `frontend_1/src/App.js` |
| Auth context | `frontend_1/src/contexts/AuthContext.jsx` |
| Permissions hook | `frontend_1/src/hooks/usePermissions.js` |
| API services | `frontend_1/src/services/*.js` |

## Appendix C — Document Traceability

| Artifact | Relationship |
|----------|--------------|
| YMS_Project_Overview.md | Executive summary — parent document |
| YMS_Business_Requirements_Document.md | Business rules source — BRD → FRS traceability |
| API_INVENTORY.md | Endpoint reference |
| DATA_MODEL_ERD.md | Entity relationships |
| ROUTE_INVENTORY.md | Frontend routes |

## Appendix D — Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-06-03 | YMS Documentation | Initial FRS — all 16 modules, matrices, cross-cutting specs |

---

# Conclusion

This Functional Requirements Specification documents the **implemented** Smart Yard Management System (YARD.OS) as the authoritative reference for development, testing, and maintenance. All 16 modules are specified with the required 16-section structure. Global matrices in Part I provide cross-module reference data; Part II provides module-level detail; Part III covers non-functional requirements, synchronization rules, and appendices.

**Implementation baseline:** React 19 + FastAPI + PostgreSQL 16, Docker deployment, 122 backend tests passing.

**Known limitations (as-implemented):**
- Header-based auth (no OAuth/JWT production auth)
- Client-side aggregation for Control Tower and Executive KPIs (no dedicated backend bundle endpoints except Operations Dashboard)
- Operational Recommendations are rule-based alert mapping, not ML/AI
- Reports use live queries without caching/materialized views

For business context and stakeholder requirements, refer to `YMS_Business_Requirements_Document.md`. For API integration details, refer to `API_INVENTORY.md`.
