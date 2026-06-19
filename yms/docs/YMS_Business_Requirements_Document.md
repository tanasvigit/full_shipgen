# Business Requirements Document (BRD)
# Smart Yard Management System — YARD.OS

---

| Field | Value |
|-------|-------|
| **Document Title** | Business Requirements Document — Smart Yard Management System |
| **Product Name** | YARD.OS — Vehicle Orchestration Platform |
| **Organization** | Bharat Logistics Pvt. Ltd. (reference facility) |
| **Facility** | Bhiwandi Mega Hub — Mumbai (`BHV-MUM-01`) |
| **Document Version** | 1.0 |
| **Status** | Approved for Reference (Implementation-Aligned) |
| **Date** | June 2026 |
| **Classification** | Business / Management / Implementation |
| **Source of Truth** | Implemented platform (`yard_frontend` codebase) |

---

## Document Control

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 1.0 | June 2026 | YMS Project Team | Initial BRD aligned to implemented YARD.OS platform |

### Distribution List

| Role | Purpose |
|------|---------|
| Business Sponsors | Scope approval, investment decisions |
| Operations Management | Process validation, rollout planning |
| Customer / Prospect Stakeholders | Solution understanding, demo alignment |
| Implementation Team | Build, configure, test against requirements |
| QA / Audit | Acceptance criteria verification |

### Related Documents

| Document | Location |
|----------|----------|
| Project Overview | `docs/YMS_Project_Overview.md` |
| API Inventory | `docs/API_INVENTORY.md` |
| Route Inventory | `docs/ROUTE_INVENTORY.md` |
| Data Model ERD | `docs/DATA_MODEL_ERD.md` |
| Backend Implementation Reference | `backend/YMS_BACKEND_NOTE.md` |

---

## Table of Contents

1. [Document Purpose](#1-document-purpose)
2. [Business Context](#2-business-context)
3. [Business Objectives](#3-business-objectives)
4. [Project Scope](#4-project-scope)
5. [Stakeholders](#5-stakeholders)
6. [User Roles](#6-user-roles)
7. [Business Processes](#7-business-processes)
8. [End-to-End Yard Operations Workflow](#8-end-to-end-yard-operations-workflow)
9. [Module Requirements](#9-module-requirements)
   - 9.1 Appointment Management
   - 9.2 Gate Management
   - 9.3 Virtual Queue
   - 9.4 Dock Management
   - 9.5 Labor Management
   - 9.6 Equipment Management
   - 9.7 Loading Operations
   - 9.8 Exit Holding & Exit Verification
   - 9.9 Control Tower
   - 9.10 Operational Recommendations
   - 9.11 Yard Map
   - 9.12 Operations Dashboard
   - 9.13 Delay Analysis
   - 9.14 Detention Management
   - 9.15 Executive KPIs
   - 9.16 Reporting Suite
10. [Complete Vehicle Lifecycle](#10-complete-vehicle-lifecycle)
11. [Exception Management Flow](#11-exception-management-flow)
12. [Alert Management Flow](#12-alert-management-flow)
13. [Resource Assignment Flow](#13-resource-assignment-flow)
14. [Reporting Requirements](#14-reporting-requirements)
15. [Business Constraints](#15-business-constraints)
16. [Assumptions](#16-assumptions)
17. [Non-Functional Requirements](#17-non-functional-requirements)
18. [Future Scope](#18-future-scope)
19. [Glossary](#19-glossary)
20. [Appendix A — Requirement Traceability](#appendix-a--requirement-traceability)
21. [Conclusion](#21-conclusion)

---

## 1. Document Purpose

### 1.1 Purpose Statement

This Business Requirements Document (BRD) defines the **business requirements** for the Smart Yard Management System (YMS), product name **YARD.OS**, as implemented and deployed. It serves as the **master business reference** for:

- Management review and investment justification
- Customer presentations and solution demonstrations
- Project submissions and portfolio evidence
- Implementation team onboarding and configuration
- User acceptance testing (UAT) baseline
- Gap analysis for future releases

### 1.2 Document Scope

This BRD describes **what the business needs** and **how the implemented system satisfies those needs**. Requirements are derived from the live codebase, API contracts, database schema, and operational workflows — not from aspirational designs.

### 1.3 Requirement Classification

| ID Prefix | Meaning |
|-----------|---------|
| **BR-** | Business Requirement |
| **FR-** | Functional Requirement (module-specific) |
| **BR-PROC-** | Business Process Requirement |
| **BR-KPI-** | Key Performance Indicator |
| **BR-NFR-** | Non-Functional Requirement |
| **BR-CON-** | Business Constraint |

### 1.4 Priority Definitions

| Priority | Definition |
|----------|------------|
| **P1 — Critical** | Core yard operation; system unusable without it |
| **P2 — High** | Required for operational efficiency and management visibility |
| **P3 — Medium** | Important for optimization and reporting |
| **P4 — Low** | Future enhancement or nice-to-have |

All requirements in this document reflect **P1 or P2** capabilities that are **implemented** unless explicitly marked under Future Scope (§18).

---

## 2. Business Context

### 2.1 Industry Context

Large logistics yards and distribution hubs process high volumes of inbound and outbound commercial vehicles daily. In India, facilities such as the Bhiwandi industrial corridor near Mumbai serve as critical nodes between ports, warehouses, and last-mile distribution. Each vehicle visit involves:

1. Pre-scheduled appointment
2. Gate entry verification
3. Waiting and queue prioritization
4. Dock assignment and resource coordination
5. Loading or unloading execution
6. Exit verification and gate-out
7. Detention billing where applicable

Without integrated yard management software, these steps are executed through phone calls, spreadsheets, and paper gate passes — resulting in inconsistent metrics, detention disputes, and dock under-utilization.

### 2.2 Organizational Context

YARD.OS is deployed at a **single-facility** reference configuration representing Bharat Logistics Pvt. Ltd.'s Bhiwandi Mega Hub. The platform supports:

- **Day-shift operations** with multiple gates (G1–G4)
- **Mixed cargo types** including general, hazmat, cold-chain, and pharma
- **Owned, contract, and outside** vehicle ownership models
- **INR-denominated** detention and cost calculations

### 2.3 Business Drivers

| Driver | Business Impact | YARD.OS Response |
|--------|-----------------|------------------|
| Throughput pressure | Revenue loss from delayed turns | Virtual queue, dock assignment, loading tracker |
| Detention cost exposure | Carrier claims and margin erosion | Detention module with auto-calculation |
| SLA accountability | Customer and carrier penalties | SLA compliance reporting, operations dashboard |
| Safety & compliance | Hazmat/cold-chain mishandling risk | Zone rules, hazmat SLA alerts |
| Resource waste | Idle labor and equipment | Resource gating, labor/equipment modules |
| Management visibility | Decisions based on stale data | Control Tower, Executive KPIs, live alerts |

### 2.4 Current State vs. Target State

| Dimension | Before YARD.OS | With YARD.OS |
|-----------|----------------|--------------|
| Vehicle status | Informal / fragmented | 15-status governed lifecycle |
| Queue priority | Subjective | Score-based with supervisor override |
| Dock assignment | Radio dispatch | System workflow with recommendation |
| Gate verification | Paper checklist | Digital checklist with audit |
| KPIs | Inconsistent definitions | Canonical metrics across modules |
| Alerts | Reactive discovery | Rule-based Control Tower alerts |
| Reporting | End-of-shift manual | Six exportable analytical reports |

---

## 3. Business Objectives

### 3.1 Primary Objectives

| ID | Objective | Success Measure | Priority |
|----|-----------|-----------------|----------|
| BR-OBJ-01 | Digitize end-to-end vehicle journey from appointment to exit | 100% of active vehicles tracked in lifecycle | P1 |
| BR-OBJ-02 | Reduce average vehicle waiting time | Avg waiting ≤ 30 min (Executive KPI target) | P1 |
| BR-OBJ-03 | Improve dock utilization without overbooking | Dock utilization target 85% | P2 |
| BR-OBJ-04 | Eliminate stale dock occupancy after loading complete | Zero OCCUPIED docks with EXIT_HOLDING vehicles | P1 |
| BR-OBJ-05 | Provide real-time operational visibility to management | Control Tower refresh ≤ 30 seconds | P1 |
| BR-OBJ-06 | Automate detention cost calculation | Detention records auto-derived from yard timing | P2 |
| BR-OBJ-07 | Enforce resource readiness before loading | Loading blocked without dock + labor | P1 |
| BR-OBJ-08 | Support role-based operational access | Five roles with permission enforcement | P2 |
| BR-OBJ-09 | Enable audit-ready vehicle journey reconstruction | Full yard event history per vehicle | P1 |
| BR-OBJ-10 | Deliver exportable management reports | Six reports with CSV/XLSX export | P2 |

### 3.2 Secondary Objectives

| ID | Objective | Success Measure | Priority |
|----|-----------|-----------------|----------|
| BR-OBJ-11 | Reduce gate exit congestion | Exit holding delay alert at 30 min | P2 |
| BR-OBJ-12 | Fair queue prioritization | Priority score formula applied consistently | P2 |
| BR-OBJ-13 | Proactive exception surfacing | Loading exceptions appear in Control Tower | P2 |
| BR-OBJ-14 | Actionable operational guidance | Recommendations derived from live alerts | P3 |

---

## 4. Project Scope

### 4.1 In Scope

| Area | Description |
|------|-------------|
| **Appointment scheduling** | Book, view, filter, export appointments |
| **Gate entry & exit** | Verification checklists, approve/reject, gate-out |
| **Virtual queue** | Priority ranking, call-in, supervisor override |
| **Dock management** | CRUD, assignment, release, bay visualization |
| **Labor management** | Team roster, status, dock/vehicle assignment |
| **Equipment management** | Fleet registry, battery, assignment, maintenance |
| **Loading operations** | Start/complete, pause/resume, exceptions |
| **Yard map** | Zone occupancy, vehicle moves, zone rules |
| **Detention** | Auto-calculation, status workflow, summary |
| **Control Tower** | Live dashboard, derived alerts |
| **Operational recommendations** | Rule-based insights from alerts |
| **Operations dashboard** | Shift-level KPIs and SLA compliance |
| **Executive KPIs** | Management scorecard |
| **Reporting suite** | Six analytical reports with export |
| **Global search** | Cross-entity search |
| **RBAC** | Five roles, twelve permissions |
| **Audit trail** | Yard events for all workflow actions |

### 4.2 Out of Scope (Current Release)

| Area | Rationale |
|------|-----------|
| OCR / ANPR hardware integration | API stub exists; hardware deferred |
| ERP / WMS / TMS connectors | APIs ready; integration deferred |
| Fleet GPS / telematics | No telematics ingestion |
| Native mobile applications | Responsive web only |
| Multi-facility tenancy | Single-facility configuration |
| Production SSO / JWT | Header-based dev auth |
| Predictive ML / AI | Recommendations are rule-based |
| PDF server-side report export | Returns HTTP 501; client PDF only |

### 4.3 Scope Boundaries

YARD.OS owns **yard-side orchestration** — the period from vehicle appointment through facility exit. It does **not** replace:

- Warehouse Management Systems (WMS) for inventory
- Transportation Management Systems (TMS) for route planning
- Enterprise Resource Planning (ERP) for financial posting

Integration points are defined under Future Scope (§18).

---

## 5. Stakeholders

### 5.1 Stakeholder Register

| ID | Stakeholder | Role | Interest | Engagement |
|----|-------------|------|----------|------------|
| SH-01 | Yard Controller | Operations lead | Overall throughput, SLA | Daily — Control Tower, Queue |
| SH-02 | Gate Operator | Entry/exit execution | Fast verification, compliance | Daily — Gate Management |
| SH-03 | Dock Supervisor | Bay assignment | Utilization, correct bay type | Daily — Docks, Loading |
| SH-04 | Labor Coordinator | Team deployment | Availability, assignment | Daily — Labor Management |
| SH-05 | Equipment Coordinator | Fleet management | Uptime, battery, maintenance | Daily — Equipment Management |
| SH-06 | Operations Manager | Shift oversight | KPIs, exceptions | Daily — Operations Dashboard |
| SH-07 | Finance / Billing | Detention revenue | Accurate charges, disputes | Weekly — Detention Management |
| SH-08 | Executive Leadership | Strategic decisions | Scorecard, trends | Weekly — Executive KPIs |
| SH-09 | IT / Platform Team | Deployment, integration | APIs, Docker, RBAC | Implementation |
| SH-10 | Carriers / Transporters | Service level | Fair queue, on-time loading | Indirect — appointments, queue |
| SH-11 | Customer / Auditor | Compliance evidence | Journey reconstruction | Ad hoc — Vehicle Journey report |
| SH-12 | Project Sponsor | Investment ROI | Demo readiness, scope | Milestone reviews |

### 5.2 RACI Matrix (Key Processes)

| Process | Yard Controller | Gate Operator | Dock Supervisor | Operations Mgr | Executive |
|---------|:---------------:|:-------------:|:---------------:|:--------------:|:---------:|
| Book appointment | I | — | — | A | I |
| Gate entry | I | R/A | — | I | — |
| Queue call-in | A | — | R | I | — |
| Dock assignment | I | — | R/A | I | — |
| Start loading | I | — | R/A | I | — |
| Exit verification | I | R/A | — | I | — |
| Detention approval | I | — | — | A | I |
| Review KPIs | C | — | — | R | A |

*R = Responsible, A = Accountable, C = Consulted, I = Informed*

---

## 6. User Roles

### 6.1 Role Definitions

The system implements five roles via Role-Based Access Control (RBAC). The backend is the **source of truth** for permissions; the frontend hides actions the user cannot execute.

| Role ID | Display Name | Business Description |
|---------|--------------|-------------------|
| `admin` | Administrator | Full system access for configuration and override |
| `operations` | Operations | Day-to-day yard orchestration across all operational modules |
| `gate` | Gate | Entry check-in, exit verification, gate-out |
| `supervisor` | Supervisor | Queue call-in, dock assignment, detention, overrides |
| `read_only` | Read Only | View all modules; no workflow mutations |

### 6.2 Permission Catalog

| Permission | Business Capability |
|------------|---------------------|
| `vehicle.write` | Register and update vehicles |
| `appointment.write` | Book and modify appointments |
| `queue.write` | Supervisor queue priority override |
| `dock.write` | Create, edit, delete docks; assign resources |
| `flow.check_in` | Approve gate entry / check-in |
| `flow.call` | Call vehicle from queue |
| `flow.assign_dock` | Assign dock to queue entry |
| `flow.vehicle_transition` | Loading complete, exit verify, gate-out |
| `detention.write` | Update detention record status |
| `equipment.write` | Equipment CRUD and status changes |
| `labor.write` | Labor team CRUD and status changes |
| `yard_event.write` | Loading exceptions, pause/resume, gate scans |
| `yard_zone.write` | Yard zone CRUD, manual vehicle moves |

### 6.3 Role-Permission Matrix

| Permission | Admin | Operations | Gate | Supervisor | Read Only |
|------------|:-----:|:----------:|:----:|:----------:|:---------:|
| All (`*`) | ✓ | | | | |
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

### 6.4 Authentication (Current Implementation)

| Attribute | Requirement |
|-----------|-------------|
| Auth mechanism | HTTP headers: `X-YMS-Role`, `X-YMS-User` |
| Auth mode | `YMS_AUTH_MODE=dev` (default) or `strict` |
| Default role (dev) | `operations` |
| Default role (strict) | `read_only` |
| Invalid role (strict) | HTTP 401 rejection |
| Unauthorized action | HTTP 403 with permission detail |

**Business note:** Production deployment requires enterprise authentication (SSO/JWT) — see Future Scope (§18).

---

## 7. Business Processes

### 7.1 Process Catalog

| Process ID | Process Name | Trigger | Primary Module |
|------------|--------------|---------|----------------|
| BP-01 | Appointment Booking | Carrier/scheduler books slot | Appointments |
| BP-02 | Vehicle Arrival & Entry | Vehicle reaches gate | Gate Management |
| BP-03 | Queue Management | Vehicle checked in | Virtual Queue |
| BP-04 | Dock Assignment | Vehicle called to staging | Docks |
| BP-05 | Resource Coordination | Dock assigned | Labor, Equipment |
| BP-06 | Loading Execution | Resources ready | Loading Operations |
| BP-07 | Loading Completion | Loading finished | Loading Operations → Gate |
| BP-08 | Exit Verification | Vehicle in exit holding | Gate Management |
| BP-09 | Gate Out | Exit approved | Gate Management |
| BP-10 | Detention Processing | Vehicle waited beyond free hours | Detention |
| BP-11 | Exception Handling | Loading incident | Loading Operations |
| BP-12 | Alert Response | Threshold breached | Control Tower |
| BP-13 | Yard Zone Management | Vehicle moves between zones | Yard Map |
| BP-14 | Management Reporting | Shift end / review cycle | Reporting Suite |

### 7.2 BP-01: Appointment Booking

**Description:** Schedule a vehicle visit with slot, gate, priority, and cargo details.

**Process Steps:**

1. Operator selects date and opens Book Appointment
2. Operator enters vehicle details (plate, type, transporter, driver)
3. Operator selects request type (Loading, Unloading, Transit, Inter-Warehouse)
4. Operator selects material type, slot, gate, priority (Normal/High/Urgent)
5. System validates slot capacity (warn ≥3, critical ≥5 per slot)
6. System recommends dock, gate, and zone
7. System creates appointment with status SCHEDULED
8. System emits APPOINTMENT_CREATED and APPOINTMENT_CONFIRMED events

**Business Rules:**
- BR-PROC-01: Booking reference must be unique (3–64 characters)
- BR-PROC-02: Vehicle must exist before appointment creation
- BR-PROC-03: Priority values: Normal=0, High=50, Urgent=90

### 7.3 BP-02: Vehicle Arrival & Entry

**Description:** Verify vehicle and documents at gate; admit to yard.

**Process Steps:**

1. Gate operator looks up vehicle by plate or appointment reference
2. System displays entry verification checklist (6 checks)
3. If all checks pass, operator approves entry
4. System checks in vehicle → status WAITING
5. System creates queue entry with priority score
6. System auto-places vehicle in GATE_IN or WAITING_AREA zone

**Business Rules:**
- BR-PROC-04: Entry blocked unless all 6 entry checks pass
- BR-PROC-05: Appointment must be for today's date
- BR-PROC-06: Vehicle must not already be checked in
- BR-PROC-07: Gate must be one of G1, G2, G3, G4

### 7.4 BP-03: Queue Management

**Description:** Prioritize waiting vehicles and call them for dock assignment.

**Process Steps:**

1. Queue displays vehicles ranked by priority score
2. Supervisor or operations user calls next vehicle
3. Vehicle status → CALLED (displayed as "Staging")
4. Supervisor may override queue rank with reason
5. System recommends dock for called vehicle

**Business Rules:**
- BR-PROC-08: Only WAITING or CHECKED_IN vehicles can be called
- BR-PROC-09: Override requires reason (≥3 chars) and supervisor name (≥2 chars)
- BR-PROC-10: Priority score = (appointment.priority × 10) + min(lateness_minutes, 120)

### 7.5 BP-04: Dock Assignment

**Description:** Assign a called vehicle to an available loading bay.

**Process Steps:**

1. Dock supervisor views vehicles awaiting dock assignment
2. Supervisor selects vehicle and target dock (or uses recommendation)
3. System validates dock availability, capacity, and vehicle compatibility
4. Dock status → OCCUPIED; vehicle status → DOCK_ASSIGNED
5. System triggers resource readiness sync

**Business Rules:**
- BR-PROC-11: Queue entry must be CALLED before dock assignment
- BR-PROC-12: Dock must be AVAILABLE or OCCUPIED (not MAINTENANCE/BLOCKED/OUT_OF_SERVICE)
- BR-PROC-13: Dock capacity enforced (default max_capacity = 1)

### 7.6 BP-05: Resource Coordination

**Description:** Assign labor and equipment to dock before loading can start.

**Process Steps:**

1. System evaluates readiness: dock assigned + labor assigned (mandatory)
2. If not ready → vehicle status RESOURCE_PENDING
3. Labor coordinator assigns team to dock/vehicle
4. Equipment coordinator assigns equipment (optional but tracked)
5. When dock + labor ready → vehicle status READY_FOR_LOADING

**Business Rules:**
- BR-PROC-14: Labor assignment is mandatory for loading
- BR-PROC-15: Equipment assignment is informational; does not block loading
- BR-PROC-16: Equipment battery must be ≥ 20% for assignment
- BR-PROC-17: Labor cannot be assigned if OFF_DUTY, UNAVAILABLE, or on BREAK

### 7.7 BP-06: Loading Execution

**Description:** Execute loading or unloading at assigned dock.

**Process Steps:**

1. Operator confirms resource readiness panel shows all mandatory items
2. Operator starts loading → vehicle status LOADING
3. Progress tracked via yard events
4. Operator may pause loading with reason code
5. Operator may create typed exception if incident occurs
6. Operator completes loading → vehicle status COMPLETED

**Business Rules:**
- BR-PROC-18: Loading requires READY_FOR_LOADING status
- BR-PROC-19: Loading blocked if resource gating fails (HTTP 409)
- BR-PROC-20: Pause emits LOADING_PAUSED event with reason code

### 7.8 BP-07: Loading Completion & Exit Holding

**Description:** Transition vehicle to exit holding after loading completes.

**Process Steps:**

1. Loading complete triggers COMPLETED transition
2. System auto-releases labor and equipment
3. System auto-releases dock (status AVAILABLE)
4. System auto-promotes vehicle to EXIT_HOLDING
5. System sets exit_holding_at timestamp
6. Vehicle placed in EXIT_HOLDING yard zone

**Business Rules:**
- BR-PROC-21: COMPLETED immediately becomes EXIT_HOLDING (no manual step)
- BR-PROC-22: Dock current_vehicle_id cleared on COMPLETED/EXIT_HOLDING/EXIT_VERIFIED/EXITED

### 7.9 BP-08: Exit Verification

**Description:** Verify documents and clearances before gate-out.

**Process Steps:**

1. Gate operator opens exit holding list
2. Operator completes 7-item exit checklist
3. Operator approves exit → vehicle status EXIT_VERIFIED
4. System records verified_by and verified_at

**Business Rules:**
- BR-PROC-23: All 7 exit checklist items must be true before verify-exit
- BR-PROC-24: Exit checklist stored in gate_verifications table

### 7.10 BP-09: Gate Out

**Description:** Release vehicle from facility.

**Process Steps:**

1. Gate operator confirms EXIT_VERIFIED vehicle
2. Operator executes gate-out
3. Vehicle status → EXITED
4. System sets exit_time, exit_gate_id, exited_by
5. Vehicle cleared from yard zones

**Business Rules:**
- BR-PROC-25: Only EXIT_VERIFIED vehicles can gate-out
- BR-PROC-26: Gate-out emits VEHICLE_EXITED and GATE_OUT_COMPLETED events

---

## 8. End-to-End Yard Operations Workflow

### 8.1 Workflow Overview

The end-to-end yard operations workflow spans **15 vehicle statuses** across **9 business process stages**, involving **6 operational modules** and **2 gate stages**.

```
APPOINTMENT ──▶ ARRIVAL ──▶ ENTRY ──▶ QUEUE ──▶ DOCK ──▶ RESOURCES ──▶ LOADING ──▶ EXIT ──▶ GATE OUT
  (BP-01)      (BP-02)    (BP-02)   (BP-03)  (BP-04)   (BP-05)      (BP-06)    (BP-08)  (BP-09)
```

### 8.2 Stage Detail

| Stage | Status(es) | Owner | Duration SLA |
|-------|-----------|-------|--------------|
| 1. Scheduled | SCHEDULED | Appointments | Until reporting_time |
| 2. Arrival | ARRIVED | Gate | — |
| 3. Check-in | CHECKED_IN → WAITING | Gate | — |
| 4. Queue | WAITING → CALLED | Virtual Queue | ≤ 60 min waiting |
| 5. Staging | CALLED | Virtual Queue | Until dock assigned |
| 6. Dock | DOCK_ASSIGNED | Docks | — |
| 7. Resources | RESOURCE_PENDING → READY_FOR_LOADING | Labor/Equipment | — |
| 8. Loading | LOADING | Loading Ops | ≤ 120 min |
| 9. Complete | COMPLETED → EXIT_HOLDING | System (auto) | — |
| 10. Exit verify | EXIT_HOLDING → EXIT_VERIFIED | Gate | ≤ 30 min exit holding |
| 11. Exit | EXITED | Gate | — |

### 8.3 Parallel Workflows

| Workflow | Runs Parallel To | Module |
|----------|------------------|--------|
| Detention calculation | Queue through Loading | Detention |
| Yard zone tracking | All active stages | Yard Map |
| Control Tower alerts | All active stages | Control Tower |
| Loading exceptions | Loading stage | Loading Ops |
| Detention risk scoring | Queue stage | Virtual Queue (UI) |

### 8.4 Cancellation Path

Any pre-loading status may transition to **CANCELLED** by authorized roles. Cancellation:
- Terminates the vehicle journey
- Does not automatically release dock if assigned (manual release may be needed)
- Is recorded in yard events

### 8.5 Workflow Actors by Stage

| Stage | Primary Actor | Supporting Actor |
|-------|---------------|------------------|
| Appointment | Operations / Scheduler | — |
| Gate entry | Gate Operator | — |
| Queue | Operations / Supervisor | Yard Controller |
| Dock assignment | Dock Supervisor | Operations |
| Resource assignment | Labor/Equipment Coordinator | Dock Supervisor |
| Loading | Loading Operator | Dock Supervisor |
| Exit | Gate Operator | — |
| Detention review | Finance | Operations Manager |

---

## 9. Module Requirements

Each module section follows a standard structure:
- **Business Purpose** — why the module exists
- **Business Inputs** — data and triggers required
- **Business Outputs** — deliverables and artifacts produced
- **Operational Rules** — enforced business logic
- **Success Criteria** — acceptance conditions
- **KPIs** — measurable performance indicators

---

### 9.1 Appointment Management

#### Business Purpose

Enable schedulers and operations staff to book, view, and manage vehicle visit appointments with slot allocation, gate assignment, and priority designation. Appointments are the **entry point** to the vehicle lifecycle.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Vehicle plate / reference | User or vehicle registry | Yes | Links to vehicle record |
| Customer name | User | Yes | 1–255 characters |
| Shipment reference | User | Yes | Encodes request type, material, delivery |
| Booking date | User | Yes | Date of scheduled visit |
| Reporting time | User | Yes | Expected arrival datetime |
| Scheduled slot | User | Yes | Time slot (e.g., 08:00) |
| Gate number | User | Yes | G1, G2, G3, or G4 |
| Priority | User | No (default 0) | Normal=0, High=50, Urgent=90 |
| Request type | User | Yes | Loading, Unloading, Transit, Inter-Warehouse |
| Material type | User | Yes | Cargo classification |
| Vehicle type | User | Yes | TRUCK, TRAILER, CONTAINER, etc. |
| Transporter / driver | User | Yes | Carrier identification |
| Remarks | User | No | Free-text notes |

#### Business Outputs

| Output | Description |
|--------|-------------|
| Appointment record | Unique booking_reference, status SCHEDULED |
| Yard events | APPOINTMENT_CREATED, APPOINTMENT_CONFIRMED |
| KPI cards | Scheduled, loading, completed counts for selected date |
| Hour distribution chart | Bookings per hour |
| Export file | CSV/PDF appointment schedule |
| Dock/gate/zone recommendations | At booking time |

#### Operational Rules

| Rule ID | Rule |
|---------|------|
| FR-APT-01 | Booking reference must be unique across all appointments |
| FR-APT-02 | Vehicle must exist in registry before appointment creation |
| FR-APT-03 | Direct status PATCH limited to DRAFT, SCHEDULED, CANCELLED |
| FR-APT-04 | Slot capacity warning at ≥3 appointments per slot |
| FR-APT-05 | Slot capacity critical alert at ≥5 appointments per slot |
| FR-APT-06 | Gate slot capacity visibility limit: 10 per gate/slot |
| FR-APT-07 | Duration estimates: Loading 60m, Unloading 90m, Transit 30m, Inter-Warehouse 60m |
| FR-APT-08 | Book Appointment button visible only with `appointment.write` permission |

#### Success Criteria

- [ ] User can book appointment for existing vehicle with all required fields
- [ ] Duplicate booking reference rejected with clear error
- [ ] Appointment appears in list and calendar for selected date
- [ ] Slot capacity warning displayed when threshold exceeded
- [ ] Appointment detail drawer shows linked vehicle journey
- [ ] Export produces valid schedule for selected date/filter

#### KPIs

| KPI | Definition | Target |
|-----|------------|--------|
| Appointments today | Count where booking_date = today | Operational visibility |
| Scheduled count | Appointments in SCHEDULED status | — |
| Loading count | Linked vehicles in loading pipeline | — |
| Completed count | Vehicles COMPLETED or EXITED | — |
| Hour distribution | Bookings per hour bucket | Capacity planning |

---

### 9.2 Gate Management

#### Business Purpose

Digitize gate entry verification and exit holding workflows. Ensure only authorized, documented vehicles enter the yard and only cleared vehicles exit the facility.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Vehicle lookup query | Gate operator | Yes | Plate or appointment reference |
| Gate ID | System / user | Yes | G1–G4 |
| Entry approval | Gate operator | Conditional | When all entry checks pass |
| Reject reason | Gate operator | Conditional | On entry rejection |
| Exit checklist toggles | Gate operator | Yes (exit) | 7 boolean verification fields |
| Exit remarks | Gate operator | No | Notes on exit verification |

#### Business Outputs

| Output | Description |
|--------|-------------|
| Queue entry | Created on successful check-in |
| Gate verification record | Entry/exit checklist state in `gate_verifications` |
| Vehicle status change | ARRIVED → CHECKED_IN → WAITING (entry); EXIT_HOLDING → EXIT_VERIFIED → EXITED (exit) |
| Yard events | ENTRY_APPROVED, VEHICLE_CHECKED_IN, EXIT_VERIFIED, VEHICLE_EXITED, etc. |
| Gate dashboard KPIs | Approaching, arrived, checked-in, waiting, loading pipeline, exit holding, exited today |
| Exit holding list | Vehicles in EXIT_HOLDING or EXIT_VERIFIED |

#### Operational Rules — Entry

| Rule ID | Rule |
|---------|------|
| FR-GATE-01 | Entry check: appointment must exist |
| FR-GATE-02 | Entry check: appointment status not CANCELLED, EXITED, or COMPLETED |
| FR-GATE-03 | Entry check: booking_date must equal today |
| FR-GATE-04 | Entry check: appointment.vehicle_id must match lookup vehicle |
| FR-GATE-05 | Entry check: vehicle not already checked in (no queue row; status not in active set) |
| FR-GATE-06 | Entry check: gate_id must be in {G1, G2, G3, G4} |
| FR-GATE-07 | Entry blocked unless all 6 checks pass |
| FR-GATE-08 | Approve entry requires `flow.check_in` permission |
| FR-GATE-09 | Mark arrived transitions SCHEDULED/DRAFT → ARRIVED |

#### Operational Rules — Exit

| Rule ID | Rule |
|---------|------|
| FR-GATE-10 | Exit checklist: loading_completed_verified |
| FR-GATE-11 | Exit checklist: appointment_completed_verified |
| FR-GATE-12 | Exit checklist: vehicle_verified |
| FR-GATE-13 | Exit checklist: delivery_document_verified |
| FR-GATE-14 | Exit checklist: invoice_approved |
| FR-GATE-15 | Exit checklist: gate_pass_approved |
| FR-GATE-16 | Exit checklist: security_cleared |
| FR-GATE-17 | Verify exit requires all 7 checklist items true |
| FR-GATE-18 | Gate-out only from EXIT_VERIFIED status |
| FR-GATE-19 | Exit actions require `flow.vehicle_transition` permission |

#### Success Criteria

- [ ] Entry blocked when any checklist item fails with visible reason
- [ ] Successful entry creates queue entry and sets WAITING status
- [ ] Exit holding list shows all EXIT_HOLDING and EXIT_VERIFIED vehicles
- [ ] Verify exit blocked until checklist complete
- [ ] Gate-out sets exit_time and EXITED status
- [ ] Gate waiting KPI matches Operations Dashboard waiting count (canonical WAITING only)

#### KPIs

| KPI | Definition | Threshold |
|-----|------------|-----------|
| Waiting | Vehicles in WAITING status | Alert > 60 min |
| Loading Pipeline | CALLED through LOADING | — |
| Exit Holding | EXIT_HOLDING + EXIT_VERIFIED | Alert > 30 min |
| Exited Today | EXITED with exit_time today | — |
| Avg Exit Delay | Average minutes in exit holding | — |

---

### 9.3 Virtual Queue

#### Business Purpose

Manage the prioritized waiting queue of checked-in vehicles. Ensure fair, score-based ranking with supervisor override capability for exceptional circumstances.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Queue entry (auto) | Gate check-in | Yes | Created on check-in |
| Appointment priority | Appointment record | Yes | Feeds priority score |
| Reporting time | Appointment | Yes | Feeds lateness calculation |
| Call-in action | Operations/Supervisor | Conditional | Transitions to CALLED |
| Override rank | Supervisor | Conditional | New rank 1–500 |
| Override reason | Supervisor | Yes (override) | Minimum 3 characters |
| Supervisor name | Supervisor | Yes (override) | Minimum 2 characters |

#### Business Outputs

| Output | Description |
|--------|-------------|
| Prioritized queue list | Sorted by priority_score DESC |
| Queue summary | Total entries, avg wait, detention exposure, high-risk count |
| Display status | WAITING, READY_TO_CALL, REPORTING_TO_DOCK, etc. |
| Detention risk badge | LOW / MEDIUM / HIGH / CRITICAL |
| Recommended dock | Scored dock recommendation per entry |
| Yard events | QUEUE_PRIORITY_CHANGED, QUEUE_OVERRIDE on override |

#### Operational Rules

| Rule ID | Rule |
|---------|------|
| FR-QUE-01 | Priority score = (appointment.priority × 10) + min(lateness_minutes, 120) |
| FR-QUE-02 | Lateness = max(now − reporting_time, 0) minutes |
| FR-QUE-03 | Call-in allowed only for WAITING or CHECKED_IN queue status |
| FR-QUE-04 | Call-in sets vehicle and queue status to CALLED |
| FR-QUE-05 | READY_TO_CALL display when WAITING, rank ≤ 2, priority_score ≥ 60 |
| FR-QUE-06 | Override re-sorts queue; assigns scores max(100 − idx×5, 5) |
| FR-QUE-07 | Override requires `queue.write` permission |
| FR-QUE-08 | Call-in requires `flow.call` permission |
| FR-QUE-09 | Detention exposure rate: ₹35/min; multiplier WAITING=1.0, CALLED=0.6, else 0.4 |
| FR-QUE-10 | Risk CRITICAL: wait ≥ 120 min OR cost ≥ ₹5,000 |
| FR-QUE-11 | Risk HIGH: wait ≥ 60 min OR cost ≥ ₹3,000 |
| FR-QUE-12 | Risk MEDIUM: wait ≥ 30 min OR cost ≥ ₹1,000 |

#### Success Criteria

- [ ] Queue sorted by priority score with rank displayed
- [ ] Call-in transitions vehicle to CALLED and updates display
- [ ] Override changes rank with audit event
- [ ] Detention risk badge reflects waiting time and cost
- [ ] Read-only users see no Override or Call In buttons

#### KPIs

| KPI | Definition | Alert |
|-----|------------|-------|
| Queue depth | Total active queue entries | > 10 = congestion |
| Average wait | Mean waiting minutes | Executive target 30 min |
| Detention exposure | Sum of projected detention costs | — |
| High-risk count | CRITICAL + HIGH risk entries | — |
| Queue aging | NORMAL / WARNING / CRITICAL | WARNING ≥ 45m, CRITICAL ≥ 90m |

---

### 9.4 Dock Management

#### Business Purpose

Manage loading bay registry, assignment, utilization, and release. Coordinate dock-level labor and equipment assignment as the physical execution point for loading operations.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Dock configuration | Admin/Operations | Yes (create) | Code, name, type, zone, capacity |
| Queue entry (called) | Virtual Queue | Yes (assign) | Must be CALLED status |
| Target dock | Supervisor | Yes (assign) | Must be assignable |
| Labor team ID | Coordinator | Conditional | For resource assignment |
| Equipment ID | Coordinator | Conditional | For resource assignment |
| Maintenance mode | Supervisor | Conditional | Sets MAINTENANCE status |

#### Business Outputs

| Output | Description |
|--------|-------------|
| Dock record | Status, current_vehicle_id, assigned_since |
| Assignment event | DOCK_ASSIGNED yard event |
| Release event | DOCK_RELEASED yard event |
| Bay visualization | Color-coded grid by status |
| Schedule heatmap | Hourly occupancy |
| Awaiting assignment table | CALLED vehicles without dock |
| KPI cards | Total, available, occupied, delayed, maintenance, utilization % |

#### Operational Rules

| Rule ID | Rule |
|---------|------|
| FR-DOCK-01 | Dock types: LOADING, UNLOADING, MIXED, HAZMAT, COLD_CHAIN, CONTAINER, GENERAL, CUSTOM |
| FR-DOCK-02 | Dock zones: Zone A through Zone F |
| FR-DOCK-03 | Assignment requires queue status CALLED |
| FR-DOCK-04 | Dock must not be MAINTENANCE, BLOCKED, or OUT_OF_SERVICE |
| FR-DOCK-05 | Capacity enforced: active assignments < max_capacity (default 1, max 20) |
| FR-DOCK-06 | Dock recommendation scoring: material +40, vehicle +15, available +20, capacity +15, labor +15, equipment +15 |
| FR-DOCK-07 | Auto-release on COMPLETED, EXIT_HOLDING, EXIT_VERIFIED, EXITED |
| FR-DOCK-08 | Manual release via release-resources endpoint |
| FR-DOCK-09 | Start loading requires READY_FOR_LOADING and resource gating pass |
| FR-DOCK-10 | Create/edit/delete dock requires `dock.write` |
| FR-DOCK-11 | Assign dock requires `flow.assign_dock` |

#### Success Criteria

- [ ] Dock assignment transitions vehicle to DOCK_ASSIGNED
- [ ] Dock shows OCCUPIED with current vehicle after assignment
- [ ] Dock auto-releases when vehicle completes loading lifecycle
- [ ] Stale occupancy (EXIT_HOLDING vehicle on dock) healed by release logic
- [ ] Bay visualization reflects live status colors
- [ ] Inactive docks cannot receive new assignments

#### KPIs

| KPI | Definition | Target |
|-----|------------|--------|
| Total docks | Registered bay count | — |
| Available docks | Status AVAILABLE | Maximize |
| Occupied docks | Status OCCUPIED | — |
| Delayed docks | Over target service time | Minimize |
| Average utilization % | Estimated daily utilization | 85% (Executive) |
| Vehicles awaiting assignment | CALLED without dock | Minimize |

---

### 9.5 Labor Management

#### Business Purpose

Maintain labor team roster, track shift availability, and assign teams to docks and vehicles to satisfy mandatory loading readiness requirements.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Team code / name | User | Yes (create) | Unique identifier |
| Shift schedule | User | Yes | Shift start/end times |
| Members count | User | Yes | Team size |
| Material specialization | User | No | GENERAL, HAZMAT, COLD_CHAIN, etc. |
| Status change | Coordinator | Conditional | ON_DUTY, OFF_DUTY, BREAK, etc. |
| Assignment target | Coordinator | Yes (assign) | dock_id, vehicle_id, or queue_entry_id |
| Workers assigned | Coordinator | No | Default max(1, min(members, 2)) |

#### Business Outputs

| Output | Description |
|--------|-------------|
| Labor team record | Status, assigned_dock_id, assigned_vehicle_id |
| Assignment event | TEAM_ASSIGNED yard event |
| Release event | TEAM_RELEASED yard event |
| Readiness contribution | Labor ready = true when ASSIGNED on vehicle/dock |
| KPI cards | Total teams, on duty, assigned, available |

#### Operational Rules

| Rule ID | Rule |
|---------|------|
| FR-LAB-01 | Statuses: ON_DUTY, OFF_DUTY, ASSIGNED, AVAILABLE, BREAK, UNAVAILABLE |
| FR-LAB-02 | Cannot assign if status is OFF_DUTY, UNAVAILABLE, or BREAK |
| FR-LAB-03 | One labor team per vehicle (409 on conflict) |
| FR-LAB-04 | Clears other labor on same dock before new assignment |
| FR-LAB-05 | Assignment triggers vehicle readiness sync |
| FR-LAB-06 | Release on loading complete returns team to AVAILABLE/OFF_DUTY |
| FR-LAB-07 | Labor CRUD requires `labor.write` |

#### Success Criteria

- [ ] Team created with valid status and shift
- [ ] Assignment blocked for unavailable teams
- [ ] Assigned team satisfies labor readiness check
- [ ] Team released automatically on loading completion
- [ ] LABOR_UNAVAILABLE alert fires when vehicle dock-assigned without labor

#### KPIs

| KPI | Definition |
|-----|------------|
| Teams on duty | Count status ON_DUTY or ASSIGNED |
| Teams available | Count status AVAILABLE |
| Teams assigned | Count status ASSIGNED |
| Assignment coverage | % dock-assigned vehicles with labor |

---

### 9.6 Equipment Management

#### Business Purpose

Track yard equipment fleet (forklifts, cranes, reach stackers, etc.), manage availability and battery levels, and support dock/vehicle assignment for loading operations.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Equipment code / name | User | Yes (create) | Unique identifier |
| Equipment type | User | Yes | FORKLIFT, CRANE, REACH_STACKER, etc. |
| Battery level | User/System | No | 0–100% |
| Status change | Coordinator | Conditional | IDLE, ASSIGNED, IN_USE, MAINTENANCE, CHARGING, OUT_OF_SERVICE |
| Assignment target | Coordinator | Yes (assign) | dock_id or vehicle_id |

#### Business Outputs

| Output | Description |
|--------|-------------|
| Equipment record | Status, battery_level, assigned_dock_id, assigned_vehicle_id |
| Assignment event | EQUIPMENT_ASSIGNED yard event |
| Release event | EQUIPMENT_RELEASED yard event |
| Readiness contribution | Informational only — does not block loading |
| KPI cards | Total, idle, assigned, in use, maintenance, low battery |

#### Operational Rules

| Rule ID | Rule |
|---------|------|
| FR-EQP-01 | Statuses: IDLE, ASSIGNED, IN_USE, MAINTENANCE, CHARGING, OUT_OF_SERVICE |
| FR-EQP-02 | Minimum battery for assignment: 20% (EQUIPMENT_MIN_ASSIGN_BATTERY) |
| FR-EQP-03 | Cannot assign in MAINTENANCE, OUT_OF_SERVICE, or CHARGING |
| FR-EQP-04 | One equipment per vehicle in ASSIGNED or IN_USE |
| FR-EQP-05 | Equipment does not block loading readiness (informational) |
| FR-EQP-06 | EQUIPMENT_UNAVAILABLE alert when dock has default_equipment but none assigned |
| FR-EQP-07 | Equipment CRUD requires `equipment.write` |

#### Success Criteria

- [ ] Equipment created with type and initial status
- [ ] Assignment blocked when battery < 20%
- [ ] Assignment blocked in MAINTENANCE or OUT_OF_SERVICE
- [ ] Equipment released on loading completion
- [ ] Low battery visually indicated in UI

#### KPIs

| KPI | Definition |
|-----|------------|
| Fleet size | Total registered equipment |
| Idle count | Status IDLE |
| Utilization % | IN_USE + ASSIGNED / total |
| Maintenance count | Status MAINTENANCE or OUT_OF_SERVICE |
| Low battery count | Battery < 20% |

---

### 9.7 Loading Operations

#### Business Purpose

Track active loading and unloading operations in real time. Manage exceptions, pauses, and completion transitions that drive the vehicle from READY_FOR_LOADING through COMPLETED to EXIT_HOLDING.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Active operation (from queue/dock) | System | Yes | Vehicle at dock in loading pipeline |
| Start loading action | Operator | Yes | Transitions to LOADING |
| Complete action | Operator | Yes | Transitions to COMPLETED |
| Pause reason code | Operator | Conditional | MATERIAL_SHORTAGE, EQUIPMENT_FAILURE, etc. |
| Exception type | Operator | Conditional | 8 defined exception types |
| Exception description | Operator | No | Free text |
| Exception assignee | Operator | Conditional | On assign action |
| Resolution notes | Operator | Conditional | On resolve action |

#### Business Outputs

| Output | Description |
|--------|-------------|
| Operation row | Progress %, health indicator, ETA, exception summary |
| Completed operations list | Historical completed loads |
| Exception records | OPEN → IN_PROGRESS → RESOLVED → CLOSED |
| Yard events | LOADING_STARTED, LOADING_COMPLETED, LOADING_PAUSED, LOADING_RESUMED |
| KPI cards | Active count, avg loading min, open/critical exceptions, paused count |
| Resource readiness panel | Dock, labor, equipment status per operation |

#### Operational Rules

| Rule ID | Rule |
|---------|------|
| FR-LOAD-01 | Start loading requires READY_FOR_LOADING status |
| FR-LOAD-02 | Resource gating must pass (dock + labor mandatory) before LOADING |
| FR-LOAD-03 | Failed gating returns HTTP 409 with RESOURCE_GATE_BLOCKED event |
| FR-LOAD-04 | Complete requires LOADING status |
| FR-LOAD-05 | Complete auto-releases labor, equipment, and dock |
| FR-LOAD-06 | Complete auto-transitions to EXIT_HOLDING |
| FR-LOAD-07 | Flow API allows only LOADING, COMPLETED, CANCELLED transitions |
| FR-LOAD-08 | Exception types: MATERIAL_SHORTAGE, EQUIPMENT_FAILURE, LABOR_DELAY, DOCUMENTATION_HOLD, SAFETY_HOLD, QUALITY_HOLD, WEATHER_DELAY, GENERIC_DELAY |
| FR-LOAD-09 | Critical exception types: EQUIPMENT_FAILURE, SAFETY_HOLD |
| FR-LOAD-10 | Exception assign only from OPEN; resolve from OPEN or IN_PROGRESS; close only from RESOLVED |
| FR-LOAD-11 | Pause reasons: MATERIAL_SHORTAGE, EQUIPMENT_FAILURE, DOCUMENTATION_HOLD, SAFETY_HOLD, QUALITY_HOLD, WEATHER_DELAY, OTHER |
| FR-LOAD-12 | Loading mutations require `flow.vehicle_transition` or `yard_event.write` |

#### Success Criteria

- [ ] Loading blocked when labor not assigned with clear missing list
- [ ] Progress bar and health indicator update on refresh
- [ ] Exception created, assigned, resolved, and closed in sequence
- [ ] Pause and resume recorded in yard events
- [ ] Complete triggers dock release and EXIT_HOLDING transition
- [ ] Read-only users see no exception or transition buttons

#### KPIs

| KPI | Definition | SLA |
|-----|------------|-----|
| Active operations | Vehicles in LOADING | — |
| Avg loading time | Mean loading duration (minutes) | ≤ 120 min |
| Open exceptions | OPEN + IN_PROGRESS count | Minimize |
| Critical exceptions | SAFETY_HOLD + EQUIPMENT_FAILURE open | Zero target |
| Paused operations | Operations with LOADING_PAUSED event | Minimize |

---

### 9.8 Exit Holding & Exit Verification

#### Business Purpose

Manage the post-loading exit pipeline. Ensure vehicles complete document and security verification before physical gate-out, reducing exit lane congestion and compliance risk.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Vehicle in EXIT_HOLDING | System (auto on complete) | Yes | Auto-transition from COMPLETED |
| Exit checklist toggles | Gate operator | Yes | 7 verification booleans |
| Verify exit action | Gate operator | Yes | When checklist complete |
| Gate-out action | Gate operator | Yes | From EXIT_VERIFIED |
| Exit remarks | Gate operator | No | Verification notes |

#### Business Outputs

| Output | Description |
|--------|-------------|
| Exit holding list | Plate, appointment, queue, dock, completed time, waiting minutes |
| Exit verification detail | Checklist state, audit history |
| Status transitions | EXIT_HOLDING → EXIT_VERIFIED → EXITED |
| Timestamps | exit_holding_at, verified_at, exit_time |
| Gate verification record | Persistent checklist in database |
| Exit KPIs | vehiclesWaiting, avgExitDelay, exitApprovedToday, exitedToday |

#### Operational Rules

| Rule ID | Rule |
|---------|------|
| FR-EXIT-01 | COMPLETED auto-promotes to EXIT_HOLDING (no manual step) |
| FR-EXIT-02 | exit_holding_at set on EXIT_HOLDING transition |
| FR-EXIT-03 | All 7 checklist fields must be true before verify-exit |
| FR-EXIT-04 | verify-exit records verified_by and verified_at |
| FR-EXIT-05 | gate-out only permitted from EXIT_VERIFIED |
| FR-EXIT-06 | gate-out sets exit_time, exit_gate_id, exited_by |
| FR-EXIT-07 | EXIT_HOLDING_DELAY alert at > 30 minutes |
| FR-EXIT-08 | Exit actions require `flow.vehicle_transition` |

#### Success Criteria

- [ ] Vehicle appears in exit holding immediately after loading complete
- [ ] Verify exit button disabled until checklist complete
- [ ] Gate-out only available for EXIT_VERIFIED vehicles
- [ ] Exit audit history shows verification and gate-out events
- [ ] Exit holding KPI matches canonical EXIT_HOLDING + EXIT_VERIFIED count

#### KPIs

| KPI | Definition | Alert Threshold |
|-----|------------|-----------------|
| Vehicles in exit holding | EXIT_HOLDING + EXIT_VERIFIED | — |
| Avg exit delay | Mean minutes in exit holding | > 30 min |
| Exit approved today | EXIT_VERIFIED transitions today | — |
| Exited today | EXITED with exit_time today | — |

---

### 9.9 Control Tower

#### Business Purpose

Provide the primary real-time operational command center for yard controllers and management. Consolidate KPIs, live queue/dock/yard state, and derived operational alerts into a single dashboard.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Live vehicle data | Database | Auto | All active vehicles |
| Appointments | Database | Auto | Today's and active appointments |
| Queue entries | Database | Auto | Active queue |
| Docks | Database | Auto | All dock states |
| Yard zones | Database | Auto | Zone occupancy |
| Yard events | Database | Auto | Recent events (up to 1000) |
| Labor teams | Database | Auto | Availability |
| Equipment | Database | Auto | Availability |
| Loading exceptions | Database | Auto | Active exceptions |

#### Business Outputs

| Output | Description |
|--------|-------------|
| KPI cards | Yard occupancy, waiting, loading, exit holding, TAT, detention exposure, etc. |
| Active alert panel | Sorted CRITICAL first, then by duration |
| Alert counts | criticalCount, warningCount |
| Queue snapshot | Top queue entries |
| Dock summary | Status breakdown |
| Yard zone occupancy | Zone-level counts |
| Throughput charts | Gate activity visualization |
| Daily operations PDF | Exportable shift summary |

#### Operational Rules — Alert Generation

| Rule ID | Alert Type | Trigger | Severity |
|---------|------------|---------|----------|
| FR-CT-01 | VEHICLE_WAITING_TOO_LONG | WAITING > 60 min | WARNING |
| FR-CT-02 | HAZMAT_SLA_BREACH | Hazmat vehicle WAITING > 30 min | CRITICAL |
| FR-CT-03 | LOADING_DELAY | LOADING > dock estimated_service_time_min (default 90) | CRITICAL |
| FR-CT-04 | EXIT_HOLDING_DELAY | EXIT_HOLDING > 30 min | WARNING |
| FR-CT-05 | LABOR_UNAVAILABLE | Dock-assigned vehicle without ASSIGNED labor | WARNING |
| FR-CT-06 | EQUIPMENT_UNAVAILABLE | Dock with default_equipment requirement, none assigned | WARNING |
| FR-CT-07 | DOCK_BLOCKED | OCCUPIED dock, LOADING, no progress ≥ 30 min | CRITICAL |
| FR-CT-08 | QUEUE_CONGESTION | > 10 vehicles WAITING | WARNING |
| FR-CT-09 | LOADING_EXCEPTION | OPEN/IN_PROGRESS exception | CRITICAL or WARNING |

#### Success Criteria

- [ ] Dashboard loads all KPI cards within 2 seconds
- [ ] Alerts refresh every 30 seconds
- [ ] Critical alerts appear before warning alerts
- [ ] TopNav alert badge matches Control Tower counts
- [ ] No hardcoded alert counts in UI

#### KPIs

| KPI | Definition | Source |
|-----|------------|--------|
| Vehicles in yard | Canonical in-yard statuses | operational_metrics |
| Vehicles waiting | WAITING only | operational_metrics |
| Vehicles loading | READY_FOR_LOADING + LOADING | operational_metrics |
| Exit holding | EXIT_HOLDING + EXIT_VERIFIED | operational_metrics |
| Active alerts | Count of derived alerts | control_tower_alerts |
| Critical alerts | CRITICAL severity count | control_tower_alerts |

---

### 9.10 Operational Recommendations

#### Business Purpose

Translate Control Tower alerts and operational metrics into actionable recommendation cards for yard controllers. Provide guidance without implying predictive AI or machine learning.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Control Tower alerts | API | Auto | Active alert list |
| Yard occupancy | Derived | Auto | Vehicles in yard vs capacity |
| Waiting count | Derived | Auto | WAITING vehicles |
| Detention exposure | Derived | Auto | Projected detention cost |

#### Business Outputs

| Output | Description |
|--------|-------------|
| Recommendation cards | Categorized by module (Queue, Loading, Resources, Dock, Exit, Yard) |
| Summary metrics | Total recommendations, critical/warning counts, potential savings |
| Alert-to-insight mapping | Each alertType mapped to recommendation category |

#### Operational Rules

| Rule ID | Rule |
|---------|------|
| FR-REC-01 | Recommendations derived from live Control Tower alerts — not static data |
| FR-REC-02 | Alert type mapping: QUEUE_CONGESTION → Queue Congestion; LOADING_DELAY → Loading Delay; etc. |
| FR-REC-03 | Yard capacity insight when occupancy ≥ 85% of capacity (40 vehicles in module; 72 in executive) |
| FR-REC-04 | Potential savings estimate: waitingAlerts × ₹3,500 |
| FR-REC-05 | UI labeled "Recommendations" — not "AI Insights" or "AI Analysis" |
| FR-REC-06 | Control Tower heuristics (max 4): waiting ≥ 15, dock util ≥ 85%, detention ≥ ₹120K, avg wait ≥ 45 min |

#### Success Criteria

- [ ] No static fake operational claims displayed
- [ ] Recommendations update when alerts change
- [ ] Each recommendation links to source alert type
- [ ] Page title and navigation say "Recommendations"

#### KPIs

| KPI | Definition |
|-----|------------|
| Active recommendations | Count of current recommendation cards |
| Critical recommendations | Recommendations from CRITICAL alerts |
| Potential savings | Estimated INR savings if recommendations acted upon |

---

### 9.11 Yard Map

#### Business Purpose

Provide visual representation of yard zone occupancy and support manual vehicle zone placement with rule-based validation for hazmat, cold-chain, and capacity constraints.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Zone configuration | System (seeded) | Auto | GATE_IN, GATE_OUT, WAITING_AREA, etc. |
| Vehicle current_zone_id | System / user | Auto / manual | Zone placement |
| Manual move request | Yard controller | Conditional | Target zone + reason |
| Zone rules | System (seeded) | Auto | cargo_match, vehicle_status patterns |

#### Business Outputs

| Output | Description |
|--------|-------------|
| Yard dashboard | Zone counts, capacity, utilization % |
| Zone occupancy map | Visual zone grid with vehicle counts |
| Vehicle zone history | Audit of zone moves |
| Auto-placement | Status-driven zone assignment |
| Yard events | ZONE_MOVE, VEHICLE_ZONE_CHANGED |

#### Operational Rules

| Rule ID | Rule |
|---------|------|
| FR-YARD-01 | Zone types: LOADING, UNLOADING, DOCUMENTATION, WAITING_AREA, STAGING, HAZMAT, COLD_CHAIN, EMERGENCY_HOLDING, EXIT_HOLDING, GATE_IN, GATE_OUT, CUSTOM |
| FR-YARD-02 | Mandatory zones: GATE_IN, GATE_OUT, WAITING_AREA, EXIT_HOLDING |
| FR-YARD-03 | Zone statuses: ACTIVE, FULL, BLOCKED, MAINTENANCE |
| FR-YARD-04 | Auto-placement: SCHEDULED/ARRIVED → GATE_IN; WAITING → WAITING_AREA; CALLED → STAGING; LOADING pipeline → LOADING; EXIT_HOLDING → EXIT_HOLDING; EXIT_VERIFIED → GATE_OUT |
| FR-YARD-05 | Manual move blocked if zone BLOCKED or MAINTENANCE |
| FR-YARD-06 | Capacity exceeded returns ZONE_CAPACITY_EXCEEDED |
| FR-YARD-07 | HAZMAT zone requires hazmat cargo pattern match |
| FR-YARD-08 | COLD_CHAIN zone requires cold/pharma pattern match |
| FR-YARD-09 | Manual move requires `yard_zone.write` |

#### Success Criteria

- [ ] Yard map displays all zones with occupancy counts
- [ ] Auto-placement occurs on lifecycle transitions
- [ ] Manual move blocked for invalid zone/cargo with error message
- [ ] Zone history auditable per vehicle

#### KPIs

| KPI | Definition |
|-----|------------|
| Total zones | Registered zone count |
| Yard utilization % | currentOccupancy / totalCapacity |
| Blocked zones | Status BLOCKED count |
| Full zones | Status FULL count |
| Available slots | totalCapacity − currentOccupancy |

---

### 9.12 Operations Dashboard

#### Business Purpose

Deliver shift-level operational KPIs computed server-side for supervisors and operations managers. Provide canonical metrics aligned with Gate Dashboard and Executive KPIs.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Vehicles | Database | Auto | All vehicle records |
| Appointments | Database | Auto | All appointments |
| Queue entries | Database | Auto | All queue entries |
| Yard events | Database | Auto | Up to 1000 recent events |

#### Business Outputs

| Output | Description |
|--------|-------------|
| Shift KPIs | Appointments, entered, exited, in yard, waiting, loading, exit holding |
| Timing averages | Turnaround, waiting, loading minutes |
| SLA compliance % | Percentage meeting all three SLAs |
| API response | `GET /api/reports/operations-dashboard` |

#### Operational Rules

| Rule ID | Rule |
|---------|------|
| FR-OPS-01 | vehiclesWaiting = count(status WAITING) only — canonical definition |
| FR-OPS-02 | vehiclesLoading = READY_FOR_LOADING + LOADING |
| FR-OPS-03 | vehiclesInExitHolding = EXIT_HOLDING + EXIT_VERIFIED |
| FR-OPS-04 | SLA waiting threshold: 60 minutes |
| FR-OPS-05 | SLA loading threshold: 120 minutes |
| FR-OPS-06 | SLA turnaround threshold: 240 minutes |
| FR-OPS-07 | SLA compliance = % exited today meeting all three thresholds |
| FR-OPS-08 | vehiclesEnteredToday = check-in events or queue checkin_time today |
| FR-OPS-09 | vehiclesExitedToday = EXITED with exit_time today |

#### Success Criteria

- [ ] Operations Dashboard waiting count matches Gate Dashboard waiting count
- [ ] SLA compliance percentage calculated for exited-today vehicles only
- [ ] Dashboard refreshes every 30 seconds
- [ ] All KPIs derived from backend (not client-side mock data)

#### KPIs

| KPI | Definition | SLA Target |
|-----|------------|------------|
| Appointments today | booking_date = today | — |
| Vehicles entered today | Check-in today | — |
| Vehicles exited today | EXITED today | — |
| Vehicles in yard | In-yard statuses | — |
| Vehicles waiting | WAITING | ≤ 60 min |
| Vehicles loading | Loading pipeline subset | ≤ 120 min |
| Avg turnaround | Check-in to exit | ≤ 240 min |
| SLA compliance % | All three SLAs met | Maximize |

---

### 9.13 Delay Analysis

#### Business Purpose

Categorize and quantify operational delays across the vehicle journey for root-cause analysis and continuous improvement.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Date range | User | No | date_from, date_to filters |
| Vehicles | Database | Auto | Vehicles in range |
| Yard events | Database | Auto | Timing events |
| Dock records | Database | Auto | Service time estimates |
| Loading exceptions | Database | Auto | Active exceptions |

#### Business Outputs

| Output | Description |
|--------|-------------|
| Delay category breakdown | waitingDelay, loadingDelay, exitDelay, turnaroundDelay, exceptionDelay |
| Per-category counts | Number of affected vehicles |
| Average delay minutes | Per category |
| Worst delay minutes | Per category |
| Export file | CSV/XLSX via export endpoint |

#### Operational Rules

| Rule ID | Category | Threshold |
|---------|----------|-----------|
| FR-DEL-01 | waitingDelay | Waiting > 60 min |
| FR-DEL-02 | loadingDelay | Loading > dock estimated_service_time_min or 120 min |
| FR-DEL-03 | exitDelay | Exit holding > 30 min |
| FR-DEL-04 | turnaroundDelay | Total turnaround > 240 min |
| FR-DEL-05 | exceptionDelay | Active exception age > 0 |

#### Success Criteria

- [ ] Report loads with date range filter
- [ ] All five delay categories populated when data exists
- [ ] Export produces valid CSV/XLSX with category breakdown
- [ ] Thresholds match SLA constants in reporting_common.py

#### KPIs

| KPI | Definition |
|-----|------------|
| Total delayed vehicles | Sum of unique vehicles across categories |
| Worst category | Category with highest avg delay |
| Avg delay by category | Mean delay minutes per category |

---

### 9.14 Detention Management

#### Business Purpose

Calculate, track, and manage detention charges for vehicles that exceed free waiting time. Support billing workflow from pending through paid with dispute handling.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Queue checkin_time | System | Auto | Wait window start |
| Loading complete event | System | Auto | Wait window end |
| Vehicle ownership type | Vehicle record | Auto | Rate multiplier |
| Material / hazmat flag | Shipment data | Auto | Rate selection |
| Status update | Finance user | Conditional | Approve, dispute, pay |

#### Business Outputs

| Output | Description |
|--------|-------------|
| Detention record | detention_ref, hours, rate, cost (INR) |
| Summary bundle | Today, MTD, disputed count, targeted savings |
| Status workflow | Pending → Approved → Paid (or Disputed) |
| Configuration | Free hours, base rates |

#### Operational Rules

| Rule ID | Rule |
|---------|------|
| FR-DET-01 | Formula: (ActualWaitTime − FreeWaitTime) × Rate |
| FR-DET-02 | Free wait time: 2.0 hours |
| FR-DET-03 | Wait window: queue checkin_time → LOADING_COMPLETED / exit |
| FR-DET-04 | Billable only if actual_hours − free_hours > 0 |
| FR-DET-05 | Standard rate: ₹1,000/hour |
| FR-DET-06 | Hazmat rate: ₹1,500/hour |
| FR-DET-07 | Outside vehicle surcharge: +15% |
| FR-DET-08 | Company vehicle multiplier: ×0.85 |
| FR-DET-09 | Status transitions per DETENTION_STATUS_TRANSITIONS |
| FR-DET-10 | Status update requires `detention.write` |

#### Success Criteria

- [ ] Detention auto-calculated when vehicle completes loading
- [ ] Cost displayed in INR with correct rate for ownership type
- [ ] Finance user can approve, dispute, or mark paid
- [ ] Summary shows today and month-to-date totals
- [ ] Disputed count visible on dashboard

#### KPIs

| KPI | Definition | Target |
|-----|------------|--------|
| Detention today | Sum of costs for today | ≤ ₹100,000 (Executive) |
| Month-to-date | Cumulative detention cost | — |
| Disputed count | Records in Disputed status | Minimize |
| Targeted savings | Potential savings from dispute resolution | — |
| By ownership | Breakdown: Outside / Contract / Company | — |

---

### 9.15 Executive KPIs

#### Business Purpose

Provide leadership with a management scorecard comparing live operational performance against defined targets. Support board reviews and customer demonstrations.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Vehicles, appointments, queue | APIs | Auto | Live data |
| Docks, events, detention | APIs | Auto | Live data |
| Target definitions | Configuration | Auto | Hardcoded targets in executiveKpisApi.js |

#### Business Outputs

| Output | Description |
|--------|-------------|
| Scorecard metrics | 8 KPIs with target comparison |
| Trend charts | 7-day turnaround and yard occupancy |
| CSAT proxy | Derived from shipment completion |
| Fuel wastage estimate | WAITING count × 6 litres |
| Ownership breakdown | Turnaround by company/contract/outside |

#### Operational Rules

| Rule ID | Metric | Target | Lower is Better |
|---------|--------|--------|-----------------|
| FR-EXEC-01 | Avg Waiting Time | 30 min | Yes |
| FR-EXEC-02 | Avg Turnaround | 90 min | Yes |
| FR-EXEC-03 | Dock Utilization | 85% | No |
| FR-EXEC-04 | Yard Occupancy | 75% (capacity 72) | No |
| FR-EXEC-05 | Detention Today | ₹100,000 | Yes |
| FR-EXEC-06 | Fuel Wastage | 200 L | Yes |
| FR-EXEC-07 | Shipment Completion | 95% | No |
| FR-EXEC-08 | Customer Satisfaction | 92% | No |
| FR-EXEC-09 | CSAT proxy = 94 + (shipmentCompletion − 90) × 0.4, clamped 60–100 | — | — |

#### Success Criteria

- [ ] All 8 scorecard metrics display with target comparison
- [ ] Red/green indicator based on lower-is-better flag
- [ ] Trends show 7-day history
- [ ] Dashboard refreshes every 30 seconds
- [ ] Data sourced from live APIs (not static mock KPIs)

#### KPIs

See table in Operational Rules above — these are the executive-level KPIs.

---

### 9.16 Reporting Suite

#### Business Purpose

Provide exportable analytical reports for operational review, customer reporting, and audit evidence. Support date-range filtering and CSV/XLSX export.

#### Business Inputs

| Input | Source | Required | Description |
|-------|--------|----------|-------------|
| Date range | User | No | date_from, date_to on all reports |
| Zone filter | User | No | Dock utilization only |
| Dock ID filter | User | No | Dock utilization only |
| Vehicle ID / number | User | Conditional | Vehicle journey report |

#### Business Outputs

| Report | Key Columns / Metrics |
|--------|----------------------|
| **Dock Utilization** | dockCode, vehiclesHandled, occupiedMinutes, idleMinutes, utilizationPct, avgServiceMinutes, avgDelayMinutes |
| **Labor Productivity** | teamCode, assignments, vehiclesServed, loadingMinutes, pausedMinutes, exceptionsHandled, utilizationPct |
| **Equipment Utilization** | equipmentCode, assignments, usageMinutes, idleMinutes, loadingMinutes, utilizationPct |
| **Delay Analysis** | category, count, avgDelayMinutes, worstDelayMinutes, affectedVehicles |
| **SLA Compliance** | metric, value (waiting/loading/turnaround/overall %) |
| **Vehicle Journey** | Full timeline per vehicle with events, resources, exceptions |
| **Operations Dashboard** | Shift KPIs (see §9.12) |

#### Operational Rules

| Rule ID | Rule |
|---------|------|
| FR-RPT-01 | Export formats: CSV (default), XLSX |
| FR-RPT-02 | PDF export returns HTTP 501 (not implemented server-side) |
| FR-RPT-03 | REPORT_SLA constants: waiting 60, loading 120, turnaround 240 min |
| FR-RPT-04 | All report routes accessible from sidebar navigation |
| FR-RPT-05 | No orphaned report pages without routes |

#### Success Criteria

- [ ] All six report pages load without error
- [ ] Date range filter applies to report data
- [ ] CSV export downloads valid file
- [ ] XLSX export downloads valid file
- [ ] Vehicle journey report reconstructs full timeline

#### KPIs

| KPI | Definition |
|-----|------------|
| Report availability | 6/6 reports routable and functional |
| Export success rate | Successful export / export attempts |
| SLA compliance (report) | % vehicles meeting REPORT_SLA thresholds |

---

## 10. Complete Vehicle Lifecycle

### 10.1 Status Catalog

| Status | Business Meaning | Terminal |
|--------|------------------|----------|
| DRAFT | Vehicle registered, no appointment confirmed | No |
| SCHEDULED | Appointment booked for future visit | No |
| ARRIVED | Vehicle physically at gate, not yet admitted | No |
| CHECKED_IN | Gate entry approved, entering yard | No |
| WAITING | In virtual queue awaiting call-in | No |
| CALLED | Called for staging / dock assignment | No |
| DOCK_ASSIGNED | Bay assigned, proceeding to dock | No |
| RESOURCE_PENDING | Awaiting labor/equipment assignment | No |
| READY_FOR_LOADING | All mandatory resources ready | No |
| LOADING | Active loading or unloading operation | No |
| COMPLETED | Loading finished (transient — auto-advances) | No |
| EXIT_HOLDING | Awaiting exit verification at gate | No |
| EXIT_VERIFIED | Exit approved, ready for physical gate-out | No |
| EXITED | Vehicle has left the facility | **Yes** |
| CANCELLED | Journey terminated | **Yes** |

### 10.2 Transition Matrix

| From Status | Allowed To |
|-------------|-----------|
| DRAFT | SCHEDULED, CANCELLED |
| SCHEDULED | ARRIVED, CHECKED_IN, CANCELLED |
| ARRIVED | CHECKED_IN, WAITING, CANCELLED |
| CHECKED_IN | WAITING, CANCELLED |
| WAITING | CALLED, DOCK_ASSIGNED, CANCELLED |
| CALLED | DOCK_ASSIGNED, CANCELLED |
| DOCK_ASSIGNED | RESOURCE_PENDING, READY_FOR_LOADING, CANCELLED |
| RESOURCE_PENDING | READY_FOR_LOADING, CANCELLED |
| READY_FOR_LOADING | LOADING, RESOURCE_PENDING, CANCELLED |
| LOADING | COMPLETED, CANCELLED |
| COMPLETED | EXIT_HOLDING (automatic) |
| EXIT_HOLDING | EXIT_VERIFIED |
| EXIT_VERIFIED | EXITED |
| EXITED | — |
| CANCELLED | — |

### 10.3 Transition Authority

| Transition | Authorized Module | Permission |
|------------|-------------------|------------|
| → SCHEDULED | Appointments | appointment.write |
| → ARRIVED | Gate | flow.vehicle_transition |
| → CHECKED_IN / WAITING | Gate | flow.check_in |
| → CALLED | Virtual Queue | flow.call |
| → DOCK_ASSIGNED | Docks | flow.assign_dock |
| → RESOURCE_PENDING / READY_FOR_LOADING | Resource Gating (auto) | — |
| → LOADING | Docks / Loading Ops | flow.vehicle_transition |
| → COMPLETED | Loading Ops | flow.vehicle_transition |
| → EXIT_HOLDING | System (auto) | — |
| → EXIT_VERIFIED | Gate | flow.vehicle_transition |
| → EXITED | Gate | flow.vehicle_transition |
| → CANCELLED | Authorized roles | flow.vehicle_transition |

### 10.4 KPI Status Buckets

| Bucket | Statuses | Used By |
|--------|----------|---------|
| **Waiting** | WAITING | Operations Dashboard, Gate Dashboard, Control Tower, Executive KPIs |
| **Loading Pipeline** | CALLED, DOCK_ASSIGNED, RESOURCE_PENDING, READY_FOR_LOADING, LOADING | Gate Dashboard |
| **Loading (narrow)** | READY_FOR_LOADING, LOADING | Operations Dashboard |
| **Exit Pipeline** | EXIT_HOLDING, EXIT_VERIFIED | Gate Dashboard, Operations Dashboard |
| **In Yard** | All non-terminal active statuses | Control Tower, Yard Map |

### 10.5 Sub-Lifecycles

| Entity | Statuses | Module |
|--------|----------|--------|
| Dock | AVAILABLE, OCCUPIED, MAINTENANCE, BLOCKED, OUT_OF_SERVICE | Docks |
| Equipment | IDLE, ASSIGNED, IN_USE, MAINTENANCE, CHARGING, OUT_OF_SERVICE | Equipment |
| Labor | ON_DUTY, OFF_DUTY, ASSIGNED, AVAILABLE, BREAK, UNAVAILABLE | Labor |
| Detention | Pending, Approved, Disputed, Paid, Reviewed | Detention |
| Loading Exception | OPEN, IN_PROGRESS, RESOLVED, CLOSED | Loading Ops |
| Yard Zone | ACTIVE, FULL, BLOCKED, MAINTENANCE | Yard Map |

---

## 11. Exception Management Flow

### 11.1 Purpose

Loading exceptions capture operational incidents during loading/unloading that may delay completion, require safety holds, or need management intervention.

### 11.2 Exception Types

| Type | Business Meaning | Alert Severity |
|------|------------------|----------------|
| MATERIAL_SHORTAGE | Insufficient material to complete load | WARNING |
| EQUIPMENT_FAILURE | Equipment breakdown during loading | CRITICAL |
| LABOR_DELAY | Labor team unavailable or delayed | WARNING |
| DOCUMENTATION_HOLD | Missing or incorrect documents | WARNING |
| SAFETY_HOLD | Safety concern requiring stop | CRITICAL |
| QUALITY_HOLD | Quality inspection failure | WARNING |
| WEATHER_DELAY | Weather preventing operation | WARNING |
| GENERIC_DELAY | Other delay not categorized | WARNING |

### 11.3 Exception Lifecycle

```
┌─────────┐    assign     ┌──────────────┐    resolve    ┌──────────┐    close    ┌────────┐
│  OPEN   │──────────────▶│ IN_PROGRESS  │──────────────▶│ RESOLVED │────────────▶│ CLOSED │
└─────────┘               └──────────────┘               └──────────┘             └────────┘
     │                            │                            │
     │                            │                            │
     └────────────────────────────┴────────────────────────────┘
                    Control Tower: LOADING_EXCEPTION alert
```

### 11.4 Business Rules

| Rule ID | Rule |
|---------|------|
| BR-EXC-01 | Exception created with type, optional description, linked vehicle/appointment/queue/dock |
| BR-EXC-02 | Assign transitions OPEN → IN_PROGRESS; requires assigned_to |
| BR-EXC-03 | Resolve transitions OPEN or IN_PROGRESS → RESOLVED; requires resolved_by |
| BR-EXC-04 | Close transitions RESOLVED → CLOSED; requires closed_by |
| BR-EXC-05 | Each transition emits yard event: EXCEPTION_CREATED, EXCEPTION_ASSIGNED, EXCEPTION_RESOLVED, EXCEPTION_CLOSED |
| BR-EXC-06 | OPEN/IN_PROGRESS exceptions surface as Control Tower LOADING_EXCEPTION alerts |
| BR-EXC-07 | Exception management requires `yard_event.write` permission |

### 11.5 Pause / Resume (Related Flow)

Loading may be paused without a formal exception:

| Pause Reason | Business Trigger |
|--------------|------------------|
| MATERIAL_SHORTAGE | Material not available |
| EQUIPMENT_FAILURE | Equipment breakdown |
| DOCUMENTATION_HOLD | Document issue |
| SAFETY_HOLD | Safety stop |
| QUALITY_HOLD | Quality issue |
| WEATHER_DELAY | Weather conditions |
| OTHER | Unspecified reason |

Pause emits `LOADING_PAUSED`; resume emits `LOADING_RESUMED`.

### 11.6 Success Criteria

- [ ] Exception created from Loading Ops drawer or exception panel
- [ ] Assign → Resolve → Close workflow completes with audit events
- [ ] OPEN exceptions appear in Control Tower alert panel
- [ ] Critical exceptions (SAFETY_HOLD, EQUIPMENT_FAILURE) show CRITICAL severity

---

## 12. Alert Management Flow

### 12.1 Purpose

Control Tower alerts provide **derived, real-time** notification of operational threshold breaches. Alerts are computed on each API request — not persisted as separate records.

### 12.2 Alert Computation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    GET /api/control-tower/alerts                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  list_vehicles()        list_queue_entries()      list_docks()
  list_appointments()    list_labor_teams()       list_equipment()
  list_yard_events()     list_loading_exceptions()
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
                  compute_control_tower_alerts()
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  Waiting rules           Loading rules           Resource rules
  Exit rules              Queue rules             Exception rules
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                ▼
              { activeAlerts[], criticalCount, warningCount }
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
  Control Tower UI        TopNav badges           Recommendations
```

### 12.3 Alert Thresholds

| Threshold | Value | Alert Type |
|-----------|-------|------------|
| Waiting minutes | 60 | VEHICLE_WAITING_TOO_LONG |
| Hazmat waiting minutes | 30 | HAZMAT_SLA_BREACH |
| Exit holding minutes | 30 | EXIT_HOLDING_DELAY |
| Dock stalled minutes | 30 | DOCK_BLOCKED |
| Queue congestion count | 10 | QUEUE_CONGESTION |
| Loading delay | > dock estimated_service_time_min | LOADING_DELAY |

### 12.4 Alert Consumption

| Consumer | Behavior |
|----------|----------|
| Control Tower dashboard | Alert panel, sorted CRITICAL first |
| TopNav | Badge counts: critical, warning, total active |
| Operational Recommendations | Alert-to-insight mapping |
| Queue engine | QUEUE_DELAY_WARNING / QUEUE_CRITICAL_WAIT yard events (30-min dedup) |

### 12.5 Business Rules

| Rule ID | Rule |
|---------|------|
| BR-ALT-01 | Alerts are derived — no separate acknowledge/dismiss API |
| BR-ALT-02 | Alert clears automatically when underlying condition resolves |
| BR-ALT-03 | Critical alerts displayed before warning alerts |
| BR-ALT-04 | TopNav polls alerts every 30 seconds + on yms-data-changed event |
| BR-ALT-05 | No hardcoded alert counts in UI |

### 12.6 Success Criteria

- [ ] Alert appears when vehicle waiting exceeds 60 minutes
- [ ] Alert clears when vehicle transitions out of WAITING
- [ ] TopNav badge count matches API criticalCount/warningCount
- [ ] Hazmat vehicle triggers CRITICAL at 30 minutes (not 60)

---

## 13. Resource Assignment Flow

### 13.1 Purpose

Ensure loading does not begin until mandatory resources (dock and labor) are assigned and ready. Equipment is tracked but optional for gating.

### 13.2 Resource Assignment Flow

```
Dock Assigned
      │
      ▼
sync_vehicle_readiness_status()
      │
      ├── validate: dock assigned? ──No──▶ RESOURCE_PENDING
      ├── validate: labor assigned? ──No──▶ RESOURCE_PENDING
      ├── validate: equipment assigned? ──No──▶ (informational only)
      │
      ▼ (all mandatory ready)
READY_FOR_LOADING
      │
      ▼ (operator: Start Loading)
validate_resource_readiness_for_loading()
      │
      ├── fail ──▶ HTTP 409 + RESOURCE_GATE_BLOCKED event
      │
      ▼ pass
LOADING
      │
      ▼ (operator: Complete)
release_loading_resources()
      ├── labor → AVAILABLE / OFF_DUTY
      ├── equipment → IDLE
      └── dock → AVAILABLE (via _release_vehicle_dock_assignments)
```

### 13.3 Readiness Validation

| Resource | Mandatory | Validation |
|----------|-----------|------------|
| Dock | Yes | Queue has dock_id; dock status not inactive |
| Labor | Yes | Team with status ASSIGNED on vehicle or dock queue entry |
| Equipment | No | Tracked; EQUIPMENT_UNAVAILABLE alert if dock requires default |

### 13.4 Assignment Triggers

| Action | Triggers Readiness Sync |
|--------|------------------------|
| Dock assignment | Yes |
| Labor assignment to dock/vehicle | Yes |
| Equipment assignment to dock/vehicle | Yes |
| Labor release | Yes |
| Equipment release | Yes |
| Loading complete | Yes (release all) |

### 13.5 Business Rules

| Rule ID | Rule |
|---------|------|
| BR-RES-01 | Loading transition blocked without dock + labor readiness |
| BR-RES-02 | RESOURCE_PENDING ↔ READY_FOR_LOADING sync is automatic |
| BR-RES-03 | Equipment battery must be ≥ 20% for assignment |
| BR-RES-04 | One labor team per vehicle at a time |
| BR-RES-05 | One equipment unit per vehicle in ASSIGNED/IN_USE |
| BR-RES-06 | Readiness API: GET /api/flow/readiness/vehicle/{id} |
| BR-RES-07 | Dock readiness API: GET /api/docks/readiness/vehicle/{id} |

### 13.6 Success Criteria

- [ ] Vehicle stays RESOURCE_PENDING until labor assigned
- [ ] Start Loading button disabled with tooltip showing missing resources
- [ ] Loading completion releases labor, equipment, and dock
- [ ] Readiness panel shows green/red per resource type

---

## 14. Reporting Requirements

### 14.1 Report Catalog

| Report ID | Name | Endpoint | Export | Filters |
|-----------|------|----------|--------|---------|
| RPT-01 | Operations Dashboard | `/reports/operations-dashboard` | No | Today (implicit) |
| RPT-02 | Vehicle Journey | `/reports/vehicle-journey/{id}` | No | date_from, date_to, vehicle_number, appointment_ref |
| RPT-03 | Dock Utilization | `/reports/dock-utilization` | CSV, XLSX | date_from, date_to, zone, dock_id |
| RPT-04 | Labor Productivity | `/reports/labor-productivity` | CSV, XLSX | date_from, date_to |
| RPT-05 | Equipment Utilization | `/reports/equipment-utilization` | CSV, XLSX | date_from, date_to |
| RPT-06 | Delay Analysis | `/reports/delay-analysis` | CSV, XLSX | date_from, date_to |
| RPT-07 | SLA Compliance | `/reports/sla-compliance` | CSV, XLSX | date_from, date_to |

### 14.2 SLA Constants (Reporting)

| Metric | Threshold (minutes) |
|--------|----------------------|
| Waiting | 60 |
| Loading | 120 |
| Turnaround | 240 |

### 14.3 Export Requirements

| Requirement ID | Requirement |
|----------------|-------------|
| BR-RPT-01 | All analytical reports (RPT-03 through RPT-07) support CSV export |
| BR-RPT-02 | All analytical reports support XLSX export via `?fmt=xlsx` |
| BR-RPT-03 | Export column headers match report definition |
| BR-RPT-04 | Appointment schedule exportable from Appointments module (client-side) |
| BR-RPT-05 | Daily operations PDF exportable from Control Tower (client-side) |
| BR-RPT-06 | Server-side PDF export not implemented (HTTP 501) |

### 14.4 Dashboard Reporting

| Dashboard | Refresh | Data Source |
|-----------|---------|-------------|
| Control Tower | 30 seconds | Client-derived KPIs + server alerts |
| Operations Dashboard | 30 seconds | Server-computed (`operations_dashboard_service`) |
| Executive KPIs | 30 seconds | Client-derived from live APIs |
| Gate Dashboard | 30 seconds | Server-computed (`gate_service`) |

### 14.5 Audit Reporting

| Capability | Source |
|------------|--------|
| Vehicle journey timeline | `yard_events` filtered by vehicle_id |
| Gate verification history | `gate_verifications` + gate events |
| Zone movement history | `vehicle_zone_history` |
| Detention audit | `detention_records` with status history |
| Exception audit | `loading_operation_exceptions` lifecycle |

---

## 15. Business Constraints

| ID | Constraint | Impact |
|----|------------|--------|
| BR-CON-01 | Single facility per deployment | No multi-site switching |
| BR-CON-02 | INR currency for all cost calculations | No multi-currency |
| BR-CON-03 | Four gates (G1–G4) | Gate validation hardcoded |
| BR-CON-04 | Yard capacity reference: 72 vehicles (Executive KPI) | Capacity alerts calibrated to this |
| BR-CON-05 | Free detention hours: 2.0 | Billing formula fixed |
| BR-CON-06 | Equipment battery minimum: 20% | Assignment blocked below threshold |
| BR-CON-07 | Default dock capacity: 1 vehicle | One vehicle per bay unless configured |
| BR-CON-08 | Maximum list cap: 1000 records per query | Performance limit on yard_events |
| BR-CON-09 | Operational statuses cannot be direct-PATCHed | Must use workflow modules |
| BR-CON-10 | Flow transition API limited to LOADING, COMPLETED, CANCELLED | Exit via gate endpoints only |
| BR-CON-11 | Header-based authentication in current release | Not suitable for production without SSO |
| BR-CON-12 | PostgreSQL required | No alternative database supported |

---

## 16. Assumptions

| ID | Assumption |
|----|------------|
| BR-ASM-01 | Users have modern web browsers (Chrome, Edge, Firefox — latest two versions) |
| BR-ASM-02 | Network connectivity between client and API server is reliable |
| BR-ASM-03 | Vehicle plate numbers are unique within the facility |
| BR-ASM-04 | Appointments are created before vehicle arrival (no walk-in without vehicle record) |
| BR-ASM-05 | One queue entry per appointment (1:1 relationship) |
| BR-ASM-06 | Gate operators have access to physical documents for verification checklist |
| BR-ASM-07 | Labor teams and equipment are registered in the system before assignment |
| BR-ASM-08 | Dock configuration (types, zones, capacity) is set up during initial deployment |
| BR-ASM-09 | Yard zones are seeded on first database initialization |
| BR-ASM-10 | System clock is synchronized (UTC timestamps used throughout) |
| BR-ASM-11 | Demo facility data (Bhiwandi Mega Hub) is representative of target deployments |
| BR-ASM-12 | Supervisors performing queue override are accountable (name captured) |
| BR-ASM-13 | Detention rates and free hours are configured correctly for the facility contract |
| BR-ASM-14 | Users understand the difference between CALLED (staging) and WAITING (queue) |
| BR-ASM-15 | Docker Compose is the standard deployment method for demo and pilot environments |

---

## 17. Non-Functional Requirements

### 17.1 Performance

| ID | Requirement | Target | Current (Measured) |
|----|-------------|--------|-------------------|
| BR-NFR-01 | Operations dashboard API response | < 500 ms | ~125 ms |
| BR-NFR-02 | Gate dashboard API response | < 200 ms | ~28 ms |
| BR-NFR-03 | Control Tower alerts API response | < 200 ms | ~41 ms |
| BR-NFR-04 | Vehicle journey report API response | < 500 ms | ~37 ms |
| BR-NFR-05 | UI auto-refresh interval | 30 seconds | 30 seconds (OPERATIONAL_POLL_MS) |
| BR-NFR-06 | Backend test suite execution | < 30 seconds | ~5 seconds (122 tests) |

**Known performance risk:** `list_yard_events()` loads up to 1000 records per request. At scale, scoped queries by date or vehicle are recommended (see Future Scope).

### 17.2 Availability

| ID | Requirement | Target |
|----|-------------|--------|
| BR-NFR-07 | Backend health check | `GET /api/` returns 200 |
| BR-NFR-08 | Database health check | Postgres healthcheck in Docker Compose |
| BR-NFR-09 | Container restart policy | Docker Compose restart on failure |

### 17.3 Security

| ID | Requirement | Implementation |
|----|-------------|----------------|
| BR-NFR-10 | Role-based access control | `auth_rbac.py` — 5 roles, 12 permissions |
| BR-NFR-11 | Backend permission enforcement | `require_permission()` on mutation endpoints |
| BR-NFR-12 | Frontend UI guards | `usePermissions()` hook hides unauthorized actions |
| BR-NFR-13 | Invalid role rejection (strict mode) | HTTP 401 |
| BR-NFR-14 | Unauthorized action rejection | HTTP 403 with permission detail |
| BR-NFR-15 | CORS restriction | Configurable via `CORS_ORIGINS` |

### 17.4 Scalability

| ID | Requirement | Current State |
|----|-------------|---------------|
| BR-NFR-16 | Concurrent users | Single-facility; async FastAPI handles moderate concurrency |
| BR-NFR-17 | Vehicle volume | Tested with ~21 demo vehicles; designed for hundreds |
| BR-NFR-18 | Event history | 1000-record cap per query; pagination available |

### 17.5 Usability

| ID | Requirement | Implementation |
|----|-------------|----------------|
| BR-NFR-19 | Responsive layout | Tailwind CSS; desktop-optimized, mobile-readable |
| BR-NFR-20 | Global search | Command-palette search across entities |
| BR-NFR-21 | Toast notifications | Sonner for action feedback |
| BR-NFR-22 | Empty states | EmptyState component on all list views |
| BR-NFR-23 | Loading indicators | Skeleton and spinner patterns |
| BR-NFR-24 | Status pills | Color-coded StatusPill component |
| BR-NFR-25 | Role selector | TopNav role switcher for demo |

### 17.6 Maintainability

| ID | Requirement | Implementation |
|----|-------------|----------------|
| BR-NFR-26 | Automated tests | 122 pytest backend tests |
| BR-NFR-27 | E2E tests | Playwright audit suite |
| BR-NFR-28 | API documentation | OpenAPI via FastAPI `/docs` |
| BR-NFR-29 | Canonical metrics module | `operational_metrics.py` — single KPI source |
| BR-NFR-30 | Docker deployment | `docker compose up` single command |

### 17.7 Data Integrity

| ID | Requirement | Implementation |
|----|-------------|----------------|
| BR-NFR-31 | Status transition validation | `STATUS_TRANSITIONS` in enums.py |
| BR-NFR-32 | Unique constraints | booking_reference, vehicle_number, dock_code, etc. |
| BR-NFR-33 | Audit trail | `yard_events` for all workflow actions |
| BR-NFR-34 | Transaction safety | asyncpg transactions on multi-table updates |
| BR-NFR-35 | Dock release on lifecycle exit | `_release_vehicle_dock_assignments()` |

### 17.8 Deployment

| Service | Host Port | Image |
|---------|-----------|-------|
| PostgreSQL | 5433 | postgres:16-alpine |
| Backend (FastAPI) | 8001 | Python 3.11-slim |
| Frontend (Nginx) | 3001 | Node 22 build → nginx:1.27 |

---

## 18. Future Scope

### 18.1 OCR / ANPR Gate Automation

| Aspect | Current | Future |
|--------|---------|--------|
| Vehicle lookup | Manual plate/appointment entry | ANPR camera auto-lookup |
| Document verification | Manual checklist toggles | OCR scan of gate pass, invoice, delivery docs |
| API foundation | `POST /api/gate/scan` exists | Hardware integration layer |

### 18.2 ERP Integration

| Aspect | Current | Future |
|--------|---------|--------|
| Detention billing | Internal records only | Post to SAP/Oracle/Tally |
| Appointments | Manual booking | Import from TMS/WMS |
| Shipment references | Manual entry | Sync from ERP shipment orders |

### 18.3 Fleet / Telematics Integration

| Aspect | Current | Future |
|--------|---------|--------|
| Arrival prediction | Manual expected_arrival | GPS feed auto-updates |
| EN_ROUTE / APPROACHING | Display-only journey steps | Real status transitions from telematics |
| Proactive preparation | Reactive | Dock/labor pre-assignment before arrival |

### 18.4 Enterprise Authentication

| Aspect | Current | Future |
|--------|---------|--------|
| Auth | X-YMS-Role header | OAuth2 / SAML SSO |
| User management | Role selector in UI | Identity provider integration |
| Audit attribution | X-YMS-User header | Real user identity from token |

### 18.5 Additional Roadmap

| Item | Priority | Description |
|------|----------|-------------|
| Multi-facility tenancy | Medium | Facility selector, data isolation |
| Mobile gate app | Medium | Tablet-optimized gate workflow |
| WMS/TMS connectors | Medium | Appointment and shipment sync |
| Server-side PDF reports | Low | Replace HTTP 501 with PDF generation |
| Predictive analytics | Low | ML-based delay prediction |
| WebSocket push | Low | Replace 30s polling |
| Scoped yard_events queries | High | Performance at scale |
| Alembic migrations | High | Replace schema-on-startup for production |

---

## 19. Glossary

| Term | Definition |
|------|------------|
| **YARD.OS** | Product name for the Smart Yard Management System |
| **YMS** | Yard Management System — software category |
| **Vehicle lifecycle** | 15-status state machine from DRAFT to EXITED |
| **Virtual queue** | Priority-ranked list of checked-in vehicles awaiting call-in |
| **Staging** | Display label for CALLED status — vehicle called, awaiting dock |
| **Loading pipeline** | Statuses from CALLED through LOADING |
| **Exit pipeline** | Statuses EXIT_HOLDING and EXIT_VERIFIED |
| **Resource gating** | Mandatory readiness check (dock + labor) before loading |
| **Detention** | Charge for vehicle waiting beyond free hours |
| **Control Tower** | Real-time operational dashboard with live alerts |
| **Canonical metrics** | KPI definitions from `operational_metrics.py` shared across modules |
| **Yard event** | Audit log entry for any workflow action |
| **Gate verification** | Digital entry/exit checklist record |
| **Priority score** | Queue ranking: (priority × 10) + lateness minutes |
| **SLA** | Service Level Agreement — waiting 60m, loading 120m, turnaround 240m |
| **RBAC** | Role-Based Access Control — 5 roles, 12 permissions |
| **Readiness** | Resource assignment state determining if loading can start |

---

## Appendix A — Requirement Traceability

| Business Requirement | Module | API / Service | Test Coverage |
|---------------------|--------|---------------|---------------|
| BR-OBJ-01 Lifecycle tracking | All | `yms_service.transition_vehicle_status` | test_vehicle_lifecycle_guards |
| BR-OBJ-04 Dock release | Docks | `_release_vehicle_dock_assignments` | test_dock_release_by_vehicle |
| BR-OBJ-05 Real-time visibility | Control Tower | `control_tower_alerts_service` | test_control_tower_alerts |
| BR-OBJ-07 Resource gating | Loading Ops | `resource_gating_service` | test_resource_readiness_gate |
| BR-OBJ-08 RBAC | All | `auth_rbac.py` | test_rbac_permissions |
| BR-PROC-10 Priority score | Virtual Queue | `calculate_priority_score` | test_queue_priority_scoring |
| FR-GATE-07 Entry checks | Gate | `gate_service._build_entry_checks` | test_gate_management |
| FR-CT-01 Waiting alert | Control Tower | `control_tower_alerts_service` | test_control_tower_alerts |
| FR-DET-01 Detention formula | Detention | `detention_service` | test_detention_service |
| FR-OPS-01 Canonical waiting | Operations Dashboard | `operational_metrics` | test_gate_dashboard_kpis, test_operations_dashboard |

---

## 21. Conclusion

This Business Requirements Document defines the complete business requirements for the **Smart Yard Management System (YARD.OS)** as implemented and validated against the live platform. It covers:

- **16 operational modules** with business purpose, inputs, outputs, rules, success criteria, and KPIs
- **15-status vehicle lifecycle** with governed transitions and canonical KPI buckets
- **Three management flows**: exception management, alert management, and resource assignment
- **Seven analytical reports** with export capabilities
- **Five user roles** with twelve permissions
- **30+ non-functional requirements** across performance, security, usability, and data integrity

The platform achieves **88/100 platform maturity** and **90/100 demo readiness**, making it suitable for management review, customer presentations, project submissions, and portfolio demonstrations. Production deployment requires enterprise authentication, performance optimization for event history at scale, and integration connectors as defined in Future Scope (§18).

This document serves as the **master business reference** for all stakeholders. Implementation details, API contracts, and data models are documented in companion technical references (`API_INVENTORY.md`, `DATA_MODEL_ERD.md`, `YMS_Project_Overview.md`).

---

*End of Business Requirements Document*

*YARD.OS — Vehicle Orchestration Platform*  
*Bharat Logistics Pvt. Ltd. — Bhiwandi Mega Hub — Mumbai*  
*Document Version 1.0 — June 2026*
