# Business Requirements Document (BRD)
## Shipgen Platform — Full Application (Detailed)

| Field | Value |
|-------|--------|
| **Product** | Shipgen — unified logistics, yard, and parking operations platform |
| **Document type** | Business requirements (no technical design) |
| **Audience** | Business owners, operations managers, product owners, auditors |
| **Version** | 2.0 (expanded) |
| **Date** | June 2026 |
| **Related docs** | [`SHIPGEN-SUPER-ADMIN-BRD.md`](./SHIPGEN-SUPER-ADMIN-BRD.md) (governance), `yms/docs/YMS_Project_Overview.md`, `Parking management/README.md` |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Glossary](#2-glossary)
3. [Stakeholders & Personas](#3-stakeholders--personas)
4. [Platform Scope](#4-platform-scope)
5. [Platform-Wide Business Rules](#5-platform-wide-business-rules)
6. [Authentication & Access](#6-authentication--access)
7. [Console (Home Shell)](#7-console-home-shell)
8. [IAM](#8-iam-identity--access)
9. [FleetOps](#9-fleetops-logistics--delivery)
10. [Yard / YMS (YARD.OS)](#10-yard--yms-yardos)
11. [Parking / PMS](#11-parking--pms)
12. [Storefront](#12-storefront)
13. [Ledger](#13-ledger)
14. [Pallet](#14-pallet)
15. [Developers & Registry](#15-developers--registry)
16. [Mobile Applications](#16-mobile-applications)
17. [Cross-Engine Scenarios](#17-cross-engine-scenarios)
18. [KPIs, SLAs & Alert Thresholds](#18-kpis-slas--alert-thresholds)
19. [Reporting & Exports](#19-reporting--exports)
20. [Audit, Compliance & Accountability](#20-audit-compliance--accountability)
21. [Non-Functional Business Expectations](#21-non-functional-business-expectations)
22. [Out of Scope](#22-out-of-scope)
23. [Acceptance Criteria](#23-acceptance-criteria)

---

## 1. Executive Summary

Shipgen is a **multi-engine operations platform** for organizations that run **last-mile logistics**, **yard/truck orchestration**, and/or **parking facilities** under one company account.

**Primary business outcomes:**

- One login; role-based access to only relevant engines
- End-to-end traceability from order/appointment → field/yard execution → billing/reporting
- Enforced workflows so staff cannot skip critical steps (gate approval, payment, dock readiness)
- Real-time visibility for floor staff and leadership from the same data

**Engines delivered in this platform:**

| Engine | Business function |
|--------|-------------------|
| Console | Shell, dashboard, notifications, org settings |
| IAM | Users, roles, policies, groups |
| FleetOps | Orders, drivers, fleets, routes, tracking |
| Yard (YMS) | Truck lifecycle: appointment → gate → queue → dock → exit |
| Parking (PMS) | Ticket entry, payment, occupancy, facility reports |
| Storefront | Online catalog and customer orders |
| Ledger | Invoices, payments, accounting |
| Pallet | Warehouse inventory |
| Developers / Registry | Integrations and extensions |
| Mobile | Driver app + yard floor app |

---

## 2. Glossary

| Term | Business meaning |
|------|------------------|
| **Engine** | A major product module (FleetOps, Yard, Parking, etc.) |
| **Organization** | One customer company; all data is isolated per org |
| **Appointment** | Scheduled yard slot for a vehicle arrival |
| **Queue entry** | Vehicle waiting in virtual queue after gate check-in |
| **Dock / Bay** | Physical loading/unloading position |
| **Detention** | Carrier charge for excessive wait/load time at facility |
| **Tare weight** | Empty vehicle weight (captured at queue) |
| **Gross weight** | Loaded vehicle weight (captured before dock release) |
| **Net weight** | Gross minus tare — cargo weight |
| **Ticket** | Parking entry record for a vehicle |
| **POD** | Proof of delivery (signature, photo, QR) |
| **Control Tower** | Yard command dashboard with live KPIs and alerts |
| **SLA** | Service level agreement threshold (wait, load, turnaround) |
| **RBAC** | Role-based access — job function determines allowed actions |

---

## 3. Stakeholders & Personas

### 3.1 Platform level

| Persona | Goals | Pain without Shipgen |
|---------|-------|----------------------|
| **Company administrator** | Provision staff, control access, see org health | Multiple logins, no central user control |
| **Finance manager** | Reconcile detention, invoices, parking revenue | Manual spreadsheets, disputed numbers |
| **Executive** | KPI scorecards, trends, SLA compliance | Delayed end-of-shift reports |
| **IT integrator** | APIs, webhooks, extensions | Ad-hoc integrations per system |

### 3.2 FleetOps

| Persona | Goals |
|---------|-------|
| **Dispatcher** | Create orders, assign drivers, monitor progress |
| **Fleet manager** | Maintain drivers, vehicles, fleets, maintenance |
| **Customer support** | Lookup order status for customers |
| **Driver** | Complete assigned jobs with proof |

### 3.3 Yard (YMS)

| Persona | Goals |
|---------|-------|
| **Yard manager** | Throughput, SLA, detention, alerts |
| **Gate operator** | Fast compliant entry/exit |
| **Yard coordinator** | Queue fairness, labor/equipment, yard map |
| **Dock supervisor** | Bay utilization, assignments, loading |
| **Read-only auditor** | View journey without changing data |

### 3.4 Parking (PMS)

| Persona | Goals |
|---------|-------|
| **Parking admin** | Pricing, floors, users, hardware, audit |
| **Supervisor** | Monitor occupancy, operators, incidents |
| **Operator** | Issue tickets, collect payment, process exit |

---

## 4. Platform Scope

### 4.1 In scope

- Multi-engine web console with unified branding
- Role-scoped navigation per engine
- Yard vehicle lifecycle (15 statuses) with resource gating
- Parking ticket lifecycle (entry → payment → exit)
- FleetOps order execution with driver mobile
- Yard mobile for five yard roles
- Operational dashboards, alerts, and exportable reports
- Audit trails on critical workflows

### 4.2 Out of scope (see [Section 22](#22-out-of-scope))

- Full ERP/WMS/TMS replacement
- Automated barrier/ANPR hardware control (monitoring only)
- Predictive ML/AI decision-making
- Multi-facility enterprise tenancy (demo: single facility)

---

## 5. Platform-Wide Business Rules

| ID | Rule | Rationale |
|----|------|-----------|
| BR-P01 | Each user belongs to exactly one organization | Data isolation |
| BR-P02 | User may only open engines granted by role/permissions | Least privilege |
| BR-P03 | Yard-only users see Yard engine only; parking-only users see Parking only | Focused workforce UX |
| BR-P04 | Shipgen company admin may access all engines | Central governance |
| BR-P05 | Operational status changes must use workflow actions, not free-form edits | Process integrity |
| BR-P06 | Every gate approval, payment, dock assign, detention decision is auditable | Dispute resolution |
| BR-P07 | KPI definitions are identical on gate dashboard, operations dashboard, and executive KPIs | Trust in numbers |
| BR-P08 | Cancelled trips/appointments cannot re-enter active workflows without re-booking | Prevent ghost vehicles |
| BR-P09 | Completed yard vehicles auto-move to exit holding | Prevent dock blocking |
| BR-P10 | Parking exit frees floor occupancy slot | Capacity accuracy |

---

## 6. Authentication & Access

### 6.1 Login types (business)

| Login path | Who | After login |
|------------|-----|-------------|
| **Unified Shipgen login** | Staff with platform or multi-engine access | Dashboard or default engine home |
| **Yard-only login** | Gate, coordinator, dock staff | Yard module directly |
| **Parking-only login** | Operator, supervisor, parking admin | Parking module directly |
| **Driver mobile login** | FleetOps drivers | Driver orders tab |
| **YMS mobile login** | Yard floor roles | Role-specific yard home screen |

### 6.2 Session rules

- User session remembers organization context
- Engine switcher shows only permitted engines
- Unauthorized URL access redirects to permitted home
- Shipgen admin signing into Parking receives **parking admin** role (not supervisor downgrade)
- Existing parking users upgraded on SSO if platform role qualifies as admin

### 6.3 Two-factor authentication

- Optional 2FA for platform accounts where enabled by organization policy

---

## 7. Console (Home Shell)

### 7.1 Requirements

| ID | Requirement |
|----|-------------|
| CON-01 | Landing dashboard after login for multi-engine users |
| CON-02 | Engine switcher in header (FleetOps, Yard, Parking, IAM, etc.) |
| CON-03 | Notifications inbox for operational and system messages |
| CON-04 | User account: profile, password, preferences |
| CON-05 | Organization settings (where admin) |
| CON-06 | Consistent sidebar navigation within each engine |

### 7.2 User journey

1. User opens Shipgen URL
2. Enters credentials (and 2FA if required)
3. System resolves permitted engines
4. User lands on default home (orders board, yard control tower, or parking dashboard)
5. User switches engine via header without re-authenticating

---

## 8. IAM (Identity & Access)

### 8.1 Business objects

| Object | Description |
|--------|-------------|
| **User** | Person with login; may be admin, operator, driver, customer |
| **Role** | Named job function bundling permissions |
| **Policy** | Permission rules (view/create/update/delete per resource) |
| **Group** | Collection of users for bulk access assignment |

### 8.2 Capabilities

| ID | Requirement |
|----|-------------|
| IAM-01 | Create, edit, disable users |
| IAM-02 | Assign roles and policies to users |
| IAM-03 | Manage groups for team-based access |
| IAM-04 | Separate views for drivers and customers where applicable |
| IAM-05 | View effective permissions before granting sensitive roles |

### 8.3 Business rules

- Disabled user cannot log in
- Permission denial shows clear message (not silent failure)
- IAM changes should not require yard/parking staff to use IAM module

---

## 9. FleetOps (Logistics & Delivery)

### 9.1 Business purpose

Plan, dispatch, track, and complete **delivery and service orders** using drivers, vehicles, and routes.

### 9.2 Core entities

| Entity | Key business attributes |
|--------|-------------------------|
| **Order** | Customer, pickup/drop places, status, assigned driver, timeline |
| **Driver** | Name, contact, status, assigned fleet |
| **Vehicle** | Plate, type, fleet, maintenance status |
| **Route** | Ordered stops, distance, ETA |
| **Fleet** | Group of drivers/vehicles |
| **Place** | Address, coordinates, contact |
| **Vendor / Contact** | Third parties linked to operations |
| **Service area** | Geographic boundary for service |
| **Issue** | Operational problem tied to order/asset |
| **Fuel report** | Fuel event per vehicle |
| **Work order** | Maintenance job |
| **Custom field** | Org-specific data on entities |

### 9.3 Order lifecycle (business)

```
Created → Dispatched (driver assigned) → In progress (workflow steps)
→ Completed (with POD) OR Cancelled
```

**Workflow steps (examples — configured per order type):**

- Navigate to pickup
- Arrive at pickup
- Pickup complete
- Navigate to drop-off
- Arrive at drop-off
- Deliver / service complete
- Capture signature / photo / QR

### 9.4 Module requirements

#### Operations

| ID | Module | Business requirement |
|----|--------|---------------------|
| FO-01 | Order board | Kanban/pipeline view by status |
| FO-02 | Order detail | Full timeline, map, activities, POD |
| FO-03 | Scheduling | Calendar view of planned orders |
| FO-04 | Order config | Workflow templates, custom fields, automation rules |
| FO-05 | Routes | Plan and manage routes |
| FO-06 | Tracking lookup | Find order by ID/reference for support |
| FO-07 | Live map | Fleet and active orders on map |
| FO-08 | Service areas | Define zones of operation |

#### Management

| ID | Module | Business requirement |
|----|--------|---------------------|
| FO-10 | Drivers | CRUD, status, assignment history |
| FO-11 | Vehicles | CRUD, fleet linkage, issues |
| FO-12 | Fleets | Group drivers and vehicles |
| FO-13 | Places | Locations for pickup/delivery |
| FO-14 | Vendors / Contacts | Business relationships |
| FO-15 | Issues | Track and resolve fleet issues |
| FO-16 | Fuel reports | Cost and usage tracking |

#### Maintenance & connectivity

| ID | Module | Business requirement |
|----|--------|---------------------|
| FO-20 | Maintenance schedules | Preventive maintenance planning |
| FO-21 | Work orders | Repair tracking |
| FO-22 | Parts / equipment | Spares inventory for maintenance |
| FO-23 | Telematics / sensors | Device linkage for tracking |
| FO-24 | Settings / custom fields | Org configuration |

### 9.5 FleetOps business rules

| ID | Rule |
|----|------|
| BR-FO-01 | Order cannot complete without required POD when configured |
| BR-FO-02 | Driver sees only orders assigned to them |
| BR-FO-03 | Dispatcher cannot assign offline/disabled driver |
| BR-FO-04 | Order workflow steps execute in server-defined sequence |
| BR-FO-05 | "Already dispatched" treated as success on repeat dispatch (idempotent) |
| BR-FO-06 | Real-time order updates visible on console and driver app |

### 9.6 Driver mobile (FleetOps) — detailed flow

1. Driver logs in
2. Views **active** and **completed** order lists
3. Opens order → sees map and next required action
4. Performs action (e.g. arrive, pickup, deliver)
5. Captures signature/photo/QR when prompted
6. Completes order → moves to completed bucket
7. Location shared during active job for dispatcher visibility

---

## 10. Yard / YMS (YARD.OS)

### 10.1 Business purpose

Orchestrate **inbound and outbound trucks** from appointment through gate, queue, dock loading, and exit — with fair prioritization, resource readiness, weighing, detention tracking, and management reporting.

### 10.2 Vehicle categories

| Category | Meaning |
|----------|---------|
| **Company** | Owned fleet |
| **Contract** | Contracted carrier |
| **Outside** | Ad-hoc / third-party |

### 10.3 Vehicle types (examples)

Truck, Trailer, Container, Tanker, LCV, Tempo

### 10.4 Dock types

Loading, Unloading, Mixed, Hazmat, Cold Chain, Container, General

### 10.5 Material types (for matching dock/labor)

General, Bags, Pallets, Steel, Cement, Chemicals, Hazmat, Pharma, Cold Chain, Containers

### 10.6 Complete vehicle lifecycle

| # | Status | Business meaning | Owner module |
|---|--------|------------------|--------------|
| 1 | DRAFT | Record created, not scheduled | Appointments |
| 2 | SCHEDULED | Slot booked | Appointments |
| 3 | ARRIVED | Vehicle at gate vicinity | Gate |
| 4 | CHECKED_IN | Gate approved entry | Gate |
| 5 | WAITING | In virtual queue | Queue |
| 6 | CALLED | Called to staging / reporting to dock | Queue |
| 7 | DOCK_ASSIGNED | Bay assigned | Docks |
| 8 | RESOURCE_PENDING | Awaiting labor/equipment | Resource gating |
| 9 | READY_FOR_LOADING | All resources ready | Resource gating |
| 10 | LOADING | Load/unload in progress | Loading ops |
| 11 | COMPLETED | Load/unload finished | Loading ops |
| 12 | EXIT_HOLDING | Awaiting exit verification (auto after complete) | System |
| 13 | EXIT_VERIFIED | Exit checklist approved | Gate |
| 14 | EXITED | Left facility | Gate |
| 15 | CANCELLED | Trip cancelled | Authorized roles |

**Allowed transition principles:**

- Cannot jump from WAITING directly to LOADING without dock assignment
- COMPLETED always flows to EXIT_HOLDING automatically
- EXIT requires verified checklist before gate-out
- CANCELLED is terminal

### 10.7 KPI buckets (canonical)

| Bucket | Statuses included |
|--------|-------------------|
| **Waiting** | WAITING only |
| **Loading pipeline** | CALLED, DOCK_ASSIGNED, RESOURCE_PENDING, READY_FOR_LOADING, LOADING |
| **Exit pipeline** | EXIT_HOLDING, EXIT_VERIFIED |
| **In yard** | All non-terminal active statuses |

### 10.8 User roles — web (5 roles)

| Role | Label | Primary duties |
|------|-------|----------------|
| admin | Administrator | Everything including user/role admin |
| operations | Operations | Day-to-day orchestration |
| gate | Gate | Entry check-in, exit verification |
| supervisor | Supervisor | Queue override, dock assign, detention |
| read_only | Read only | View all, change nothing |

### 10.9 User roles — mobile (5 roles)

| Role | Home screen | Bottom tabs | More-menu modules |
|------|-------------|-------------|-------------------|
| **yard_admin** | Overview | Overview, Alerts, Search, More, Profile | All modules |
| **yard_manager** | Overview | Overview, Alerts, Search, More, Profile | Overview, detention, cross-module |
| **gate_operator** | Gate | Gate, Appointments, Search, More, Profile | Gate workflows |
| **yard_coordinator** | Queue | Queue, Search, More, Profile | Queue, vehicles, labor, equipment, yard map |
| **dock_supervisor** | Docks | Docks, Search, More, Profile | Docks, queue, loading ops, labor, equipment |

### 10.10 Permission matrix (yard — summary)

| Permission | Admin | Operations | Gate | Supervisor | Read only |
|------------|:-----:|:----------:|:----:|:----------:|:---------:|
| Book/edit appointments | ✓ | ✓ | ✓ | ✓ | |
| Queue write / override | ✓ | ✓ | ✓ | ✓ | |
| Call vehicle in | ✓ | ✓ | | ✓ | |
| Assign dock | ✓ | ✓ | | ✓ | |
| Gate check-in | ✓ | ✓ | ✓ | | |
| Vehicle status transitions | ✓ | ✓ | ✓ | ✓ | |
| Detention write | ✓ | | | ✓ | |
| Labor write | ✓ | ✓ | | | |
| Equipment write | ✓ | ✓ | | | |
| Dock CRUD | ✓ | ✓ | | | |
| Yard events / exceptions | ✓ | ✓ | ✓ | | |
| View all modules | ✓ | ✓ | ✓ | ✓ | ✓ |

### 10.11 Module requirements — detailed

#### 10.11.1 Control Tower

| ID | Requirement |
|----|-------------|
| YMS-CT-01 | Display live KPIs: vehicles in yard, waiting, loading, exit holding, dock utilization, yard occupancy, average turnaround |
| YMS-CT-02 | Show active alerts with critical/warning severity counts |
| YMS-CT-03 | Queue snapshot and dock summary panels |
| YMS-CT-04 | Gate activity and throughput charts |
| YMS-CT-05 | Auto-refresh approximately every 30 seconds |
| YMS-CT-06 | Export daily operations PDF |

#### 10.11.2 Alerts & Recommendations

| ID | Requirement |
|----|-------------|
| YMS-AL-01 | Nine alert types (see [Section 18](#18-kpis-slas--alert-thresholds)) |
| YMS-AL-02 | Alerts badge in navigation |
| YMS-AL-03 | Recommendations page maps alerts to suggested actions (rule-based, not ML) |
| YMS-AL-04 | Categories: queue congestion, loading delay, resource shortage, dock blocked, exit delay, yard capacity |

#### 10.11.3 Appointments

| ID | Requirement |
|----|-------------|
| YMS-AP-01 | Book appointment: vehicle, transporter, material, slot time, gate, priority, operation type (loading/unloading) |
| YMS-AP-02 | Calendar and list views with date navigation |
| YMS-AP-03 | KPI cards: scheduled, loading, completed today |
| YMS-AP-04 | Filter by status and operation type |
| YMS-AP-05 | Appointment detail with linked vehicle journey |
| YMS-AP-06 | Export schedule (CSV/PDF) |
| YMS-AP-07 | Only users with appointment permission see "Book" action |

**Booking business rules:**

- Appointment links to one vehicle
- Priority is numeric (higher = more important in queue scoring)
- Reporting time drives lateness calculation
- Cancelled appointments cannot check in without rebooking

#### 10.11.4 Gate Management

**Entry process (step-by-step):**

1. Operator searches vehicle by plate, appointment ref, or QR scan
2. System shows vehicle, appointment, and **entry checklist**
3. Operator marks **arrived** if vehicle is scheduled/approaching
4. System validates entry checks (all must pass):
   - Appointment exists
   - Appointment active (not cancelled/completed)
   - Correct booking date
   - Vehicle matches appointment
   - Not already checked in
   - Gate is open
5. Operator **approves entry** → vehicle becomes CHECKED_IN → enters WAITING queue
6. OR operator **rejects entry** with reason (documentation incomplete, wrong slot, vehicle mismatch, security hold, appointment not found, other) + optional note/photo

**Exit process (step-by-step):**

1. Operator switches to exit mode
2. Views vehicles in EXIT_HOLDING or EXIT_VERIFIED
3. Completes **exit checklist** (each item operator-confirmed):
   - Loading completed
   - Appointment completed
   - Vehicle verified
   - Delivery document verified
   - Invoice verified
   - Gate pass verified
   - Security clearance verified
4. Operator **verifies exit** → EXIT_VERIFIED
5. Operator **gate out** → EXITED
6. OR **rejects exit** with reason if issue found

**Gate activity tabs:**

Approaching → Arrived → Checked In → Waiting → Loading Pipeline → Exit Holding → Exit Verified → Exited → Rejected

| ID | Requirement |
|----|-------------|
| YMS-GT-01 | Entry and exit modes with separate action sets |
| YMS-GT-02 | Digital checklists replace paper gate pass workflow |
| YMS-GT-03 | Rejection reasons standardized list + free text |
| YMS-GT-04 | Audit history per vehicle on gate screen |
| YMS-GT-05 | Gate dashboard KPIs aligned with operations dashboard |

#### 10.11.5 Virtual Queue

| ID | Requirement |
|----|-------------|
| YMS-Q-01 | Priority score = `(appointment priority × 10) + lateness minutes` (lateness capped at 120 min) |
| YMS-Q-02 | Queue sorted by priority score (highest first) |
| YMS-Q-03 | Display wait time, detention exposure, risk badge (LOW/MEDIUM/HIGH/CRITICAL) |
| YMS-Q-04 | **Call In** moves vehicle to CALLED (staging) |
| YMS-Q-05 | Supervisor **override** adjusts priority rank with reason |
| YMS-Q-06 | Entry detail shows recommended dock, labor/equipment readiness |
| YMS-Q-07 | **Record tare weight** at queue (empty vehicle weight) |
| YMS-Q-08 | Export queue data |

**Detention risk badges (queue display):**

| Risk | Condition |
|------|-----------|
| CRITICAL | Wait ≥ 120 min OR exposure ≥ ₹5,000 |
| HIGH | Wait ≥ 60 min OR exposure ≥ ₹3,000 |
| MEDIUM | Wait ≥ 30 min OR exposure ≥ ₹1,000 |
| LOW | Below above thresholds |

#### 10.11.6 Weighing (business)

| ID | Requirement |
|----|-------------|
| YMS-W-01 | **Tare** recorded at virtual queue (empty weight) |
| YMS-W-02 | **Gross** recorded at dock before release (loaded weight) |
| YMS-W-03 | **Net** = gross − tare (auto-calculated) |
| YMS-W-04 | Weights visible to dock supervisor and roles with dock/queue access |
| YMS-W-05 | Weight must be > 0 and ≤ 200,000 kg |
| YMS-W-06 | Cannot weigh completed/cancelled queue entries |
| YMS-W-07 | Each weigh event logged in yard audit trail |

#### 10.11.7 Vehicles (monitor)

| ID | Requirement |
|----|-------------|
| YMS-VH-01 | Read-only list: zone, dock, appointment, status, transporter, material |
| YMS-VH-02 | Filters: status, zone, dock, vehicle type |
| YMS-VH-03 | Detail drawer: summary, resources, journey timeline, audit |
| YMS-VH-04 | No workflow mutations from vehicle list (monitor only) |

#### 10.11.8 Docks

| ID | Requirement |
|----|-------------|
| YMS-DK-01 | Dock statuses: Available, Occupied, Maintenance, Blocked, Out of Service |
| YMS-DK-02 | KPIs: total, available, occupied, delayed, maintenance, avg utilization |
| YMS-DK-03 | "Vehicles awaiting dock assignment" table (post call-in) |
| YMS-DK-04 | Bay grid visualization with status colors |
| YMS-DK-05 | Assign vehicle from queue; assign labor and equipment |
| YMS-DK-06 | Start loading; release dock; set maintenance mode |
| YMS-DK-07 | **Record gross weight** before dock release |
| YMS-DK-08 | Dock type must match vehicle/material constraints (e.g. hazmat bay) |
| YMS-DK-09 | Loading blocked if dock in Maintenance/Blocked/Out of Service |

#### 10.11.9 Labor

| ID | Requirement |
|----|-------------|
| YMS-LB-01 | Team roster: code, name, shift, supervisor, material specialization |
| YMS-LB-02 | Statuses: On Duty, Off Duty, Assigned, Available, Break, Unavailable |
| YMS-LB-03 | Assign team to dock or vehicle; release when done |
| YMS-LB-04 | Readiness check before loading: team available and on duty |
| YMS-LB-05 | KPIs: total teams, on duty, assigned, available |

#### 10.11.10 Equipment

| ID | Requirement |
|----|-------------|
| YMS-EQ-01 | Types: Forklift, Crane, Reach Stacker, Pallet Jack, Hand Truck, Conveyor, Loader, Stacker |
| YMS-EQ-02 | Statuses: Idle → Assigned → In Use → Maintenance/Charging/Out of Service |
| YMS-EQ-03 | Battery level tracked; minimum 20% required for assignment |
| YMS-EQ-04 | Assign to dock/operation; release when complete |
| YMS-EQ-05 | KPIs: total, idle, assigned, in use, maintenance |

#### 10.11.11 Loading Operations

| ID | Requirement |
|----|-------------|
| YMS-LO-01 | Active and completed operations with progress and health |
| YMS-LO-02 | Start / complete / pause (with reason) / resume loading |
| YMS-LO-03 | Exceptions: create, assign owner, resolve, close (Open → In Progress → Resolved → Closed) |
| YMS-LO-04 | Loading cannot start until dock + labor + equipment readiness confirmed |
| YMS-LO-05 | KPIs: active ops, avg loading time, open/critical exceptions, paused count |

#### 10.11.12 Yard Map

| ID | Requirement |
|----|-------------|
| YMS-YM-01 | Zones: Gate In, Gate Out, Waiting Area, Exit Holding, Loading zones A–F, Staging, Documentation |
| YMS-YM-02 | Zone occupancy vs capacity |
| YMS-YM-03 | Vehicle position by current zone |
| YMS-YM-04 | Manual zone move with reason (audited) |
| YMS-YM-05 | Zone rules by vehicle status and cargo (e.g. hazmat only in hazmat zone) |

#### 10.11.13 Detention

| ID | Requirement |
|----|-------------|
| YMS-DT-01 | Auto-derived from wait/load timing vs free hours |
| YMS-DT-02 | Cost in INR from configured rate |
| YMS-DT-03 | Status workflow: Pending → Approved → Disputed → Paid → Reviewed |
| YMS-DT-04 | Summary: today, month-to-date, by category |
| YMS-DT-05 | Finance/supervisor updates dispute status |

#### 10.11.14 Dashboards & Reports

See [Sections 18–19](#18-kpis-slas--alert-thresholds).

#### 10.11.15 Global Search

| ID | Requirement |
|----|-------------|
| YMS-GS-01 | Search across vehicles, appointments, docks, queue entries, events |
| YMS-GS-02 | Available on web and mobile |

#### 10.11.16 Yard Admin

| ID | Requirement |
|----|-------------|
| YMS-AD-01 | Manage yard users |
| YMS-AD-02 | Manage yard roles and permissions |
| YMS-AD-03 | Yard settings |

### 10.12 End-to-end yard scenario (narrative)

**Inbound loaded truck:**

1. Operations books appointment for 10:00 AM, priority 5, loading operation
2. Truck arrives 10:15 AM; gate operator marks arrived
3. Entry checklist passes; gate approves → checked in → queue entry created with priority score 65 (5×10 + 15 min late)
4. Coordinator records tare weight 8,500 kg at queue
5. After 25 min wait, supervisor calls vehicle in
6. Dock supervisor assigns Dock 7 (loading bay)
7. Labor Team A and Forklift FL-03 assigned; readiness turns green
8. Loading starts; exception opened for damaged pallet; resolved in 10 min
9. Loading completes; vehicle auto-moves to exit holding
10. Dock supervisor records gross weight 24,200 kg → net 15,700 kg
11. Dock released for next vehicle
12. Gate operator completes exit checklist; verifies and gates out
13. Detention record auto-created if wait exceeded free hours; finance reviews

---

## 11. Parking / PMS

### 11.1 Business purpose

Operate a **multi-floor parking facility**: vehicle entry ticketing, payment collection, occupancy tracking, supervisor monitoring, and revenue reporting.

**Product branding:** Security Systems (facility-facing name)

### 11.2 User roles

| Role | Access level |
|------|--------------|
| **Admin** | Full facility configuration + all supervisor/operator functions |
| **Supervisor** | Monitor floors, operators, tickets, reports (no pricing/user admin) |
| **Operator** | Day-to-day entry, payment, exit, search |

### 11.3 Role — screen access

#### Admin screens

| Screen | Business purpose |
|--------|------------------|
| Dashboard | Facility-wide KPIs |
| Employee management | Create/disable parking staff |
| Pricing | Rate rules by vehicle category |
| Parking management | General parking settings |
| Floor management | Floors, capacities per category (2W/4W/heavy) |
| Reports | Full admin reports + PDF export |
| Hardware | Barrier, camera, sensor configuration |
| QR monitoring | Live QR scan events |
| Audit logs | Who changed what |
| Settings | System and security settings |

#### Supervisor screens

| Screen | Business purpose |
|--------|------------------|
| Dashboard | Shift overview |
| Parking monitoring | Live entry/exit stream |
| Floor management | View occupancy (monitor mode) |
| Vehicle search | Find ticket by plate or code |
| QR monitoring | Scan activity |
| Reports | View reports (not admin export tier) |
| Operator activity | Staff actions timeline |
| Recent tickets | Last transactions |

#### Operator screens

| Screen | Business purpose |
|--------|------------------|
| Dashboard | Operator shift summary |
| Occupancy summary | Quick floor fill levels |
| New ticket | Vehicle entry |
| Collect payment | Payment for unpaid ticket |
| QR ticket print | Print ticket QR for vehicle |
| Vehicle search | Lookup parked vehicle |
| Recent tickets | Last handled tickets |
| Settings | Operator preferences |

### 11.4 Ticket lifecycle

```
Created (Unpaid or Paid at entry) → Paid (if was unpaid) → Exited
```

| Status | Meaning |
|--------|---------|
| **Unpaid** | Entry recorded; payment pending |
| **Paid** | Payment collected |
| **Exited** | Vehicle left; slot freed |

### 11.5 New ticket process (step-by-step)

1. Operator enters vehicle number and category (2-wheeler, 4-wheeler, heavy, free entry, etc.)
2. Operator selects entry type (standard or free entry)
3. System looks up active **pricing rule** for category
4. System calculates amount (₹0 for free entry)
5. If paid-at-entry: operator selects payment method (cash, UPI, card, etc.)
6. System generates ticket code (e.g. PK102399)
7. System assigns floor/slot if applicable; increments floor occupancy
8. System logs vehicle **entry** event
9. Operator prints QR ticket for windshield

**Business rules:**

- Cannot create ticket without active pricing rule (except free entry)
- Free entry requires explicit entry type selection
- Ticket code is unique sequential

### 11.6 Payment collection process

1. Operator searches unpaid ticket
2. System confirms status is Unpaid
3. Operator selects payment method
4. System marks Paid and records payment with collector identity
5. Audit log entry created

**Business rule:** Only Unpaid tickets accept payment.

### 11.7 Exit process

1. Operator searches ticket (plate or code)
2. System confirms not already Exited
3. Operator processes exit
4. System sets exit time, marks Exited, frees slot
5. Floor occupancy decremented for vehicle category
6. Vehicle **exit** event logged
7. Audit log entry created

### 11.8 Floor & occupancy rules

| ID | Rule |
|----|------|
| BR-PK-01 | Each floor has capacity buckets: 2-wheeler, 4-wheeler, heavy |
| BR-PK-02 | Occupancy cannot exceed capacity (system warns/blocks) |
| BR-PK-03 | Exit always frees occupancy count |
| BR-PK-04 | Supervisor sees occupancy; only admin edits capacities |
| BR-PK-05 | Operator sees summary only, not full floor admin |

### 11.9 Pricing rules

| ID | Requirement |
|----|-------------|
| BR-PK-10 | One active rule per vehicle category |
| BR-PK-11 | Admin configures base price and category |
| BR-PK-12 | Price change audited |
| BR-PK-13 | Amount locked on ticket at creation time |

### 11.10 Monitoring & hardware (business)

| ID | Requirement |
|----|-------------|
| BR-PK-20 | QR scan events visible to supervisor/admin |
| BR-PK-21 | Hardware status visible for troubleshooting |
| BR-PK-22 | Operator activity feed for supervisor oversight |
| BR-PK-23 | Optional OCR for license plate on supported flows |

### 11.11 Reports (parking)

| Report | Audience | Content |
|--------|----------|---------|
| Revenue | Admin, supervisor | Collections by period |
| Traffic | Admin, supervisor | Entry/exit volumes |
| Category breakdown | Admin, supervisor | Mix of 2W/4W/heavy |
| Admin PDF export | Admin only | Formatted management report |

### 11.12 Shipgen integration (business)

| ID | Requirement |
|----|-------------|
| BR-PK-30 | Parking embedded in Shipgen console (shared navigation chrome) |
| BR-PK-31 | Shipgen platform admin SSO → parking admin role |
| BR-PK-32 | Parking-only login for facility staff (no FleetOps/Yard access) |
| BR-PK-33 | Standalone parking app remains for dedicated deployments |

---

## 12. Storefront

### 12.1 Business purpose

Sell products/services online; orders feed operational fulfillment.

### 12.2 Requirements (summary)

| Area | Capabilities |
|------|--------------|
| Catalog | Products, variants, pricing |
| Customers | Buyer accounts and history |
| Orders | Online orders linked to fulfillment |
| Promotions | Coupons, campaigns |
| Networks / food trucks | Multi-outlet models |
| CMS pages | Content pages for storefront |
| Settings | Branding, checkout, delivery rules |

### 12.3 Business rules

- Storefront order becomes FleetOps order when fulfillment starts
- Customer sees order status via storefront (where enabled)
- Pricing and promotions apply at checkout per configured rules

---

## 13. Ledger

### 13.1 Business purpose

Financial operations: invoicing, payments, journals, accounting reports.

### 13.2 Requirements (summary)

| Area | Capabilities |
|------|--------------|
| Invoices | Create, send, track status |
| Payments | Record customer/carrier payments |
| Journals | Accounting entries |
| Reports | P&L, balance views, export |
| Settings | Tax, currency, chart of accounts |

### 13.3 Business rules

- Invoice amounts traceable to source (order, detention, parking revenue import)
- Paid invoice cannot be deleted without credit/adjustment workflow
- Finance role required for journal posting

---

## 14. Pallet

### 14.1 Business purpose

Warehouse inventory management (WMS-style).

### 14.2 Requirements (summary)

| Area | Capabilities |
|------|--------------|
| Inventory | Stock by SKU, location |
| Warehouses | Sites, zones, bins |
| Movements | Receive, pick, transfer, adjust |
| Reports | Stock levels, movement history |

---

## 15. Developers & Registry

| Engine | Business need |
|--------|----------------|
| **Developers** | API keys for integrations, webhooks for events, connection logs |
| **Registry** | Browse/install extensions to add capabilities |

**Business rule:** API access restricted to authorized technical users; keys rotatable and revocable.

---

## 16. Mobile Applications

### 16.1 Shipgen mobile landing

| User type | Modules shown |
|-----------|---------------|
| Admin | Driver + Yard |
| Driver only | Driver |
| Default staff | Driver + Yard (yard requires YMS login) |

### 16.2 Driver module

| Screen | Purpose |
|--------|---------|
| Orders (tabs) | Active and completed assignments |
| Order detail | Map, workflow actions, POD |
| Tracking | Live location sharing |
| Profile | Account, logout |

### 16.3 Yard module

Mirrors web yard workflows with role-based tabs and More hub for secondary screens (detention, loading ops, labor, equipment, vehicles, yard map).

| Feature | Mobile parity |
|---------|---------------|
| Gate entry/exit | Full checklist and actions |
| Appointments | View/book (role permitting) |
| Queue | Call in, override, tare weight |
| Docks | Assign, gross weight, release |
| Alerts | Inbox for managers |
| Search | Global entity search |
| Vehicle 360 | Journey sheet from any entry point |

---

## 17. Cross-Engine Scenarios

### 17.1 Logistics company with own yard

| Step | Engine | Action |
|------|--------|--------|
| 1 | FleetOps | Dispatcher creates delivery orders |
| 2 | Mobile | Drivers execute deliveries |
| 3 | Yard | Inbound supplier trucks: appointments → gate → load |
| 4 | Yard | Detention reviewed if carrier waits |
| 5 | Ledger | Invoices for customers; detention charges to carriers |

### 17.2 Parking at logistics hub

| Step | Engine | Action |
|------|--------|--------|
| 1 | Parking | Visitor/staff vehicles ticketed at entry |
| 2 | Parking | Supervisor monitors occupancy |
| 3 | Admin | End-of-day revenue report |

### 17.3 Shipgen admin daily oversight

| Step | Action |
|------|--------|
| 1 | Login once |
| 2 | Check FleetOps order board |
| 3 | Switch to Yard control tower for inbound status |
| 4 | Switch to Parking dashboard for facility occupancy |
| 5 | IAM: onboard new gate operator |

---

## 18. KPIs, SLAs & Alert Thresholds

### 18.1 Yard SLA thresholds

| Metric | Threshold | Meaning |
|--------|-----------|---------|
| Waiting time | 60 minutes | SLA breach if exceeded |
| Loading time | 120 minutes | SLA breach if exceeded |
| Turnaround time | 240 minutes | SLA breach if exceeded |

### 18.2 Control Tower alert thresholds

| Alert type | Trigger (business) |
|------------|-------------------|
| Vehicle waiting too long | Wait > 60 minutes |
| Hazmat SLA breach | Hazmat vehicle wait > 30 minutes |
| Exit holding delay | Exit holding > 30 minutes |
| Dock stalled | No loading progress > 30 minutes at dock |
| Queue congestion | > 10 vehicles waiting |
| Loading delay | Active loading behind schedule |
| Labor unavailable | Vehicle ready but no labor assigned |
| Equipment unavailable | Vehicle ready but no equipment assigned |
| Dock blocked | Dock in blocked/maintenance with assignment |
| Loading exception | Open critical loading exception |

### 18.3 Parking KPIs

| KPI | Description |
|-----|-------------|
| Occupancy % | Filled capacity per floor/category |
| Today's revenue | Sum of payments collected |
| Entry count | Vehicles entered today |
| Exit count | Vehicles exited today |
| Unpaid tickets | Outstanding payment count |

### 18.4 FleetOps KPIs (examples)

| KPI | Description |
|-----|-------------|
| On-time completion % | Orders completed within window |
| Active orders | In-progress count |
| Driver utilization | Assigned vs available drivers |
| Issue resolution time | Mean time to close issues |

---

## 19. Reporting & Exports

### 19.1 Yard reports

| Report | Question answered | Export |
|--------|-------------------|--------|
| Delay analysis | Where are delays? | CSV, XLSX |
| Dock utilization | Which bays over/under used? | CSV, XLSX |
| Labor productivity | Team output by shift | CSV, XLSX |
| Equipment utilization | Uptime and assignment rate | CSV, XLSX |
| SLA compliance | % meeting wait/load/turnaround | CSV, XLSX |
| Vehicle journey | Full timeline for one vehicle | Per vehicle |
| Operations dashboard | Shift snapshot | On-screen |
| Executive KPIs | Leadership scorecard | On-screen, PDF |
| Appointments | Schedule for date range | CSV, PDF |
| Control tower | Daily operations | PDF |

### 19.2 Parking reports

| Report | Export |
|--------|--------|
| Revenue by period | CSV, admin PDF |
| Traffic volume | CSV |
| Category mix | CSV |
| Operator activity | On-screen |

### 19.3 Business rules for reporting

- All reports support date range filter
- Exported numbers must match on-screen totals
- Report access follows role permissions

---

## 20. Audit, Compliance & Accountability

### 20.1 Yard audit events (examples)

| Event | When logged |
|-------|-------------|
| Gate entry approved/rejected | Gate action |
| Queue call-in / override | Queue action |
| Dock assigned / released | Dock action |
| Labor/equipment assigned | Resource action |
| Loading started/paused/completed | Loading ops |
| Exception opened/resolved | Loading ops |
| Tare/gross weight recorded | Weighing |
| Zone move | Yard map |
| Detention status change | Detention module |
| Exit verified / gate out | Gate |

### 20.2 Parking audit events

| Event | When logged |
|-------|-------------|
| Ticket created | New entry |
| Payment collected | Payment screen |
| Vehicle exited | Exit process |
| Pricing changed | Admin pricing |
| User created/modified | Admin users |

### 20.3 Compliance use cases

| Need | How platform supports |
|------|----------------------|
| Carrier dispute on detention | Journey timeline + detention calculation + approval history |
| Security incident at gate | Rejection reason + photo marker + timestamp |
| Revenue audit (parking) | Ticket ↔ payment ↔ exit chain |
| SLA proof to customer | SLA compliance report + vehicle journey |

---

## 21. Non-Functional Business Expectations

| ID | Expectation | Measurable business outcome |
|----|-------------|----------------------------|
| NFR-01 | Availability during operating hours | No paper fallback needed |
| NFR-02 | Gate action < 30 seconds | Queue not blocked at peak |
| NFR-03 | Dashboard refresh ≤ 30 seconds | Decisions on current state |
| NFR-04 | Single source of truth | Gate count = control tower count |
| NFR-05 | Role-appropriate UI | Operators not overwhelmed by admin screens |
| NFR-06 | Mobile usable on yard floor | Coordinator works away from desk |
| NFR-07 | Export for auditors | Finance works in Excel/PDF |
| NFR-08 | Data isolation | Company A never sees Company B |

---

## 22. Out of Scope

| Item | Rationale |
|------|-----------|
| Replace full ERP | Shipgen orchestrates operations, not GL for entire enterprise |
| WMS pick/pack depth | Pallet provides inventory; not full WMS |
| TMS route optimization engine | FleetOps routes; no advanced OR solver |
| ANPR/barrier automation | Manual/QR flows; hardware integration deferred |
| Carrier self-service booking portal | Appointments created by yard staff |
| Predictive AI | Recommendations are rule-based only |
| Multi-facility org hierarchy | Single facility demo configuration |
| Customer-facing yard tracking | Carriers notified outside system (future) |

---

## 23. Acceptance Criteria

### 23.1 Platform

- [ ] User with yard-only role cannot open FleetOps URL
- [ ] User with parking-only role cannot open Yard URL
- [ ] Shipgen admin sees all engines in switcher
- [ ] SSO parking login grants admin role to platform administrator

### 23.2 FleetOps

- [ ] Dispatcher assigns order; driver sees it on mobile within one refresh cycle
- [ ] Driver cannot skip workflow step
- [ ] POD captured appears on order detail in console

### 23.3 Yard

- [ ] Appointment → gate approve → queue entry without manual re-entry
- [ ] Call in → dock assign → labor + equipment → loading start chain enforced
- [ ] Loading complete auto-creates exit holding
- [ ] Exit checklist blocks verify until all items confirmed
- [ ] Tare at queue, gross at dock, net calculated correctly
- [ ] Detention record appears when wait exceeds configured free time
- [ ] Control tower alert fires when wait > 60 min
- [ ] Supervisor override logged in audit trail
- [ ] Mobile gate operator can approve entry from phone

### 23.4 Parking

- [ ] New ticket increments floor occupancy
- [ ] Exit decrements occupancy
- [ ] Unpaid ticket accepts payment; paid ticket rejects second payment
- [ ] Operator cannot open admin pricing screen
- [ ] Revenue report matches sum of payments for same period

### 23.5 Reporting

- [ ] CSV export row count matches filtered list
- [ ] SLA report % matches manual calculation for sample day

---

## Appendix A — Engine Summary

| Engine | One-line purpose | Primary users |
|--------|------------------|---------------|
| Console | Org shell and navigation | All |
| IAM | Access control | Admin, IT |
| FleetOps | Deliver orders | Dispatcher, driver |
| Yard | Truck facility lifecycle | Gate, dock, operations |
| Parking | Ticketed parking facility | Operator, supervisor |
| Storefront | Online sales | E-commerce manager |
| Ledger | Billing and accounting | Finance |
| Pallet | Warehouse stock | Warehouse manager |
| Developers | Integrations | Technical staff |
| Registry | Extensions | Technical staff |
| Mobile | Field and floor execution | Driver, yard staff |

---

## Appendix B — Document History

| Version | Date | Change |
|---------|------|--------|
| 1.0 | June 2026 | Initial concise BRD |
| 2.0 | June 2026 | Expanded: step-by-step flows, role matrices, SLAs, acceptance criteria |

---

*This document describes business requirements only. For technical architecture, APIs, and database design, refer to separate technical documentation.*
