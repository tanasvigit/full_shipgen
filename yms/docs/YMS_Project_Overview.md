# Smart Yard Management System (YMS)
## Project Overview Document

| | |
|---|---|
| **Product Name** | YARD.OS — Vehicle Orchestration Platform |
| **Organization** | Bharat Logistics Pvt. Ltd. (demo facility) |
| **Facility** | Bhiwandi Mega Hub — Mumbai (`BHV-MUM-01`) |
| **Document Version** | 1.0 |
| **Date** | June 2026 |
| **Classification** | Management Review / Customer Presentation / Portfolio |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Industry Background](#2-industry-background)
3. [Business Problem Statement](#3-business-problem-statement)
4. [Challenges in Traditional Yard Operations](#4-challenges-in-traditional-yard-operations)
5. [Project Vision](#5-project-vision)
6. [Project Objectives](#6-project-objectives)
7. [Stakeholders](#7-stakeholders)
8. [User Roles and Responsibilities](#8-user-roles-and-responsibilities)
9. [System Scope](#9-system-scope)
10. [Module Overview](#10-module-overview)
11. [End-to-End Vehicle Lifecycle](#11-end-to-end-vehicle-lifecycle)
12. [Key Features](#12-key-features)
13. [Business Benefits](#13-business-benefits)
14. [Operational Benefits](#14-operational-benefits)
15. [Reporting and Analytics Capabilities](#15-reporting-and-analytics-capabilities)
16. [Technology Stack](#16-technology-stack)
17. [High-Level Solution Architecture](#17-high-level-solution-architecture)
18. [Current Project Scope](#18-current-project-scope)
19. [Future Enhancements](#19-future-enhancements)
20. [Conclusion](#20-conclusion)

---

## 1. Executive Summary

The **Smart Yard Management System (YMS)** — branded **YARD.OS** — is a full-stack digital platform for orchestrating inbound and outbound vehicle movement, dock assignment, resource coordination, and gate operations at large logistics yards and distribution hubs.

Built as a production-oriented web application with a **React** single-page frontend and **FastAPI** backend backed by **PostgreSQL**, YARD.OS replaces fragmented spreadsheets, radio calls, and manual gate logs with a single source of operational truth. Every vehicle appointment, queue position, dock assignment, labor team, piece of equipment, loading exception, and gate verification is tracked through a governed lifecycle with audit history.

The platform comprises **19 functional screens**, **10 API router groups**, **14 database entities**, and **122 automated backend tests**. It supports five role-based access profiles, nine automated Control Tower alert types, six exportable operational reports, and a complete vehicle journey from appointment booking through gate exit.

YARD.OS is suitable for **management review**, **customer demonstrations**, **project submissions**, and **portfolio showcases**. The current implementation reflects a stabilization-ready demo environment with conditional production readiness pending enterprise authentication and performance hardening at scale.

**Platform readiness (post audit remediation):**

| Dimension | Score | Status |
|-----------|-------|--------|
| Platform maturity | 88 / 100 | Stabilized |
| Demo readiness | 90 / 100 | Go |
| Production readiness | 74 / 100 | Conditional No-Go |

---

## 2. Industry Background

Modern logistics yards sit at the intersection of warehousing, transportation, and customer service. In India and globally, mega-hubs near ports and industrial corridors — such as Bhiwandi near Mumbai — process hundreds of truck movements per day across loading bays, waiting areas, and exit gates.

The yard management discipline has evolved from simple gate registers to integrated **Yard Management Systems (YMS)** that connect with:

- **Warehouse Management Systems (WMS)** for inbound/outbound scheduling
- **Transportation Management Systems (TMS)** for carrier appointments
- **Enterprise Resource Planning (ERP)** for billing and detention charges

Industry drivers include:

| Driver | Impact on Yards |
|--------|-----------------|
| E-commerce growth | Higher vehicle throughput, tighter delivery windows |
| Detention cost pressure | Carriers bill for waiting time; yards must prove SLA compliance |
| Safety & compliance | Hazmat, cold-chain, and pharma cargo require traceable workflows |
| Labor & equipment optimization | Forklifts and teams must be assigned before loading can start |
| Real-time visibility | Control towers and executive dashboards demand live KPIs |

YARD.OS addresses these drivers through a unified orchestration layer purpose-built for yard operators, gate staff, supervisors, and management.

---

## 3. Business Problem Statement

Logistics facilities operating without an integrated YMS typically face the following business problems:

1. **No single view of yard state** — Management cannot answer “how many vehicles are waiting, loading, or stuck at exit?” without calling multiple departments.

2. **Inconsistent KPI definitions** — Gate staff, operations, and executive reports count “waiting” vehicles differently, leading to mistrust in metrics.

3. **Revenue leakage from detention** — Waiting and loading delays generate carrier detention charges, but yards lack automated calculation and dispute workflows.

4. **Dock under-utilization** — Bays remain occupied after vehicles complete loading because dock release is not tied to lifecycle transitions.

5. **Resource bottlenecks** — Loading cannot start because labor or equipment assignment is tracked on paper, not enforced in software.

6. **Gate throughput limits** — Manual entry/exit verification without digital checklists slows gate-out and increases exit-holding congestion.

7. **Limited accountability** — Without an event audit trail, root-cause analysis of delays is slow and subjective.

YARD.OS was built to eliminate these gaps by digitizing the full vehicle journey with enforced status transitions, resource gating, live alerts, and exportable analytics.

---

## 4. Challenges in Traditional Yard Operations

| Challenge | Traditional Practice | Consequence |
|-----------|---------------------|-------------|
| Appointment scheduling | Phone calls, WhatsApp, Excel | Double-booking, missed slots |
| Gate check-in | Paper gate pass, manual lookup | Slow entry, document errors |
| Queue management | First-come-first-served or informal priority | VIP/transporter disputes, unfair waits |
| Dock assignment | Supervisor radio dispatch | Wrong bay type, hazmat mismatches |
| Resource coordination | Separate labor/equipment boards | Loading starts without forklift |
| Loading tracking | Whiteboard or none | Exceptions discovered late |
| Exit verification | Manual checklist at gate | Trucks held in exit lane |
| Detention billing | Spreadsheet after the fact | Disputed invoices, revenue loss |
| Reporting | End-of-shift manual tally | Delayed decisions, no trends |
| Audit & compliance | No centralized event log | Cannot reconstruct vehicle journey |

YARD.OS maps each row in this table to a specific module and API workflow, ensuring operational discipline without redesigning the underlying business process.

---

## 5. Project Vision

> **To provide every yard stakeholder — from gate operator to CEO — a real-time, trustworthy, and actionable view of vehicle orchestration across the entire facility lifecycle.**

The vision is realized through three pillars:

| Pillar | Description |
|--------|-------------|
| **Orchestration** | Governed vehicle lifecycle from appointment to exit, with queue priority, dock assignment, and resource readiness |
| **Visibility** | Control Tower dashboard, Operations Dashboard, Executive KPIs, and six analytical reports |
| **Accountability** | Yard event audit trail, gate verification records, detention workflow, and RBAC-enforced actions |

YARD.OS does not attempt to replace WMS or TMS; it owns **yard-side orchestration** — the period between vehicle arrival and facility exit.

---

## 6. Project Objectives

| # | Objective | Implementation Evidence |
|---|-----------|------------------------|
| 1 | Digitize vehicle appointments and slot booking | Appointments module, `POST /api/appointments` |
| 2 | Enforce a canonical vehicle lifecycle | `enums.py` STATUS_TRANSITIONS, workflow services |
| 3 | Provide virtual queue with priority scoring | Queue module, `queue_service.py` priority engine |
| 4 | Coordinate dock, labor, and equipment assignment | Docks, Labor, Equipment modules + resource gating |
| 5 | Track loading operations and exceptions | Loading Ops module, `loading_exceptions_service.py` |
| 6 | Digitize gate entry and exit verification | Gate Management module, `gate_verifications` table |
| 7 | Visualize yard zones and vehicle positions | Yard Map module, `yard_zones` + zone history |
| 8 | Surface operational alerts proactively | Control Tower alerts (9 rule types) |
| 9 | Deliver management KPIs and reports | Executive KPIs, Operations Dashboard, Reporting Suite |
| 10 | Support role-based access control | `auth_rbac.py` — 5 roles, 12 permissions |
| 11 | Maintain full audit history | `yard_events` table across all workflows |
| 12 | Enable export for external analysis | CSV/XLSX export on all report endpoints |

---

## 7. Stakeholders

| Stakeholder Group | Interest | Primary YARD.OS Touchpoints |
|-------------------|----------|----------------------------|
| **Yard Controller / Operations Manager** | Overall yard throughput, SLA compliance | Control Tower, Operations Dashboard, Virtual Queue |
| **Gate Operators** | Fast, compliant entry and exit | Gate Management, Exit Verification |
| **Dock Supervisors** | Bay utilization, assignment accuracy | Docks, Loading Ops, Yard Map |
| **Labor Coordinators** | Team availability and assignment | Labor Management |
| **Equipment Coordinators** | Forklift/crane availability | Equipment Management |
| **Finance / Billing** | Detention charges and disputes | Detention Management |
| **Executive Leadership** | KPI scorecards, trends | Executive KPIs, Reporting Suite |
| **Carriers / Transporters** | (Indirect) Fair queue, on-time loading | Appointments, Queue priority |
| **IT / Platform Team** | Deployability, API integration | Docker stack, REST API, RBAC |
| **Customers / Auditors** | (Demo) Portfolio and compliance evidence | Vehicle Journey reports, audit trail |

---

## 8. User Roles and Responsibilities

YARD.OS implements **Role-Based Access Control (RBAC)** via the `X-YMS-Role` header (development mode) with five defined roles. The backend is the source of truth; the frontend hides write actions users cannot perform.

### 8.1 Role Summary

| Role | Label | Primary Responsibility |
|------|-------|------------------------|
| `admin` | Administrator | Full system access — all permissions |
| `operations` | Operations | Day-to-day yard orchestration — vehicles, appointments, queue, docks, labor, equipment, loading |
| `gate` | Gate | Entry check-in, exit verification, gate-out |
| `supervisor` | Supervisor | Queue call-in, dock assignment, detention, overrides |
| `read_only` | Read Only | View all modules; no workflow mutations |

### 8.2 Permission Matrix

| Permission | Admin | Operations | Gate | Supervisor | Read Only |
|------------|:-----:|:----------:|:----:|:----------:|:---------:|
| `vehicle.write` | ✓ | ✓ | | | |
| `appointment.write` | ✓ | ✓ | ✓ | ✓ | |
| `queue.write` | ✓ | ✓ | ✓ | ✓ | |
| `dock.write` | ✓ | ✓ | | | |
| `flow.check_in` | ✓ | ✓ | ✓ | | |
| `flow.call` | ✓ | ✓ | | ✓ | |
| `flow.assign_dock` | ✓ | ✓ | | ✓ | |
| `flow.vehicle_transition` | ✓ | ✓ | ✓ | ✓ | |
| `detention.write` | ✓ | | | ✓ | |
| `equipment.write` | ✓ | ✓ | | | |
| `labor.write` | ✓ | ✓ | | | |
| `yard_event.write` | ✓ | ✓ | ✓ | | |
| `yard_zone.write` | ✓ | ✓ | ✓ | ✓ | |

---

## 9. System Scope

### 9.1 In Scope

| Area | Coverage |
|------|----------|
| Vehicle registry and journey tracking | Full lifecycle, read-only monitor + registration |
| Appointment booking and scheduling | Slot-based, gate/dock assignment fields |
| Virtual queue with priority and override | Priority score, supervisor override |
| Gate entry and exit workflows | Checklists, verification, gate-out |
| Dock management | CRUD, assignment, release, bay visualization |
| Labor team management | Shifts, assignment, status transitions |
| Equipment management | Types, battery, assignment, maintenance |
| Loading operations | Start/complete, pause/resume, exceptions |
| Yard zone map | Zone occupancy, vehicle moves, history |
| Detention records | Auto-derived costs, status workflow |
| Control Tower alerts | Rule-based operational alerts |
| Operational recommendations | Derived from live alerts (not ML) |
| Reporting suite | Six reports with CSV/XLSX export |
| Global search | Cross-entity command-palette search |
| RBAC | Backend enforcement + frontend UI guards |

### 9.2 Out of Scope (Current Release)

| Area | Notes |
|------|-------|
| OCR / ANPR gate automation | Scanner API exists; hardware integration deferred |
| ERP / WMS / TMS integration | APIs ready; connectors not implemented |
| Fleet telematics | No GPS/telematics ingestion |
| Mobile native apps | Responsive web only |
| Multi-facility tenancy | Single-facility demo configuration |
| Production SSO / JWT auth | Header-based dev auth; enterprise auth planned |

---

## 10. Module Overview

The application is organized into four navigation sections: **Control**, **Operations**, **Resources**, and **Finance & Reports**.

### 10.1 Control Tower

| Attribute | Detail |
|-----------|--------|
| **Route** | `/` |
| **Purpose** | Real-time operational command center |
| **Data sources** | Vehicles, appointments, queue, docks, yard zones, yard events, detention, Control Tower alerts |

**Capabilities:**
- Live KPI cards: vehicles in yard, waiting, loading, exit holding, dock utilization, yard occupancy, average turnaround
- Active alert panel with critical/warning severity (from `GET /api/control-tower/alerts`)
- Queue snapshot, dock summary, yard zone occupancy
- Gate activity and throughput visualizations
- 30-second auto-refresh cycle
- Daily operations PDF export

**Alert types monitored:** vehicle waiting too long, hazmat SLA breach, loading delay, exit holding delay, labor unavailable, equipment unavailable, dock blocked, queue congestion, loading exception.

---

### 10.2 Operational Recommendations

| Attribute | Detail |
|-----------|--------|
| **Route** | `/ai` (labeled “Recommendations” in navigation) |
| **Purpose** | Actionable operational guidance derived from live system state |

**Capabilities:**
- Maps Control Tower alerts into categorized recommendation cards (Queue Congestion, Loading Delay, Resource Shortage, Dock Blocked, Exit Delay, Yard Capacity)
- Summary metrics: total recommendations, critical/warning counts, potential savings estimate
- **Explicitly rule-based** — not predictive AI or machine learning
- Auto-refresh aligned with operational data changes

---

### 10.3 Appointments

| Attribute | Detail |
|-----------|--------|
| **Route** | `/appointments` |
| **Purpose** | Slot orchestration and appointment lifecycle |

**Capabilities:**
- Book appointments with vehicle, transporter, material, slot, gate, and priority
- Calendar and list views with date navigation
- Hour distribution chart and KPI cards (scheduled, loading, completed)
- Filter by status and type (loading/unloading)
- Export appointment schedule (CSV/PDF via ExportMenu)
- Appointment detail drawer with linked vehicle journey
- RBAC: Book Appointment button visible only with `appointment.write`

---

### 10.4 Gate Management

| Attribute | Detail |
|-----------|--------|
| **Route** | `/gate` |
| **Purpose** | Entry verification and exit holding workflow |

**Capabilities:**
- **Entry mode:** Vehicle lookup, entry verification checklist (gate pass, invoice, security, documents), approve/reject entry, mark arrived
- **Exit mode:** Exit holding list, exit verification drawer, checklist (loading completed, delivery docs, gate pass, security), verify exit, gate-out
- Gate dashboard KPIs aligned with Operations Dashboard (waiting, exit holding, loading pipeline)
- Gate activity tabs: Approaching, Arrived, Checked In, Waiting, Loading Pipeline, Exit Holding, Exit Verified, Exited, Rejected
- Audit history per vehicle
- RBAC: Entry/exit actions gated by `flow.check_in` and `flow.vehicle_transition`

---

### 10.5 Virtual Queue

| Attribute | Detail |
|-----------|--------|
| **Route** | `/queue` |
| **Purpose** | Priority-based vehicle queue management |

**Capabilities:**
- Priority score: `(priority × 10) + lateness_minutes`, capped at 120
- Queue summary KPIs: total entries, average wait, detention exposure, high-risk count
- Risk badges (LOW / MEDIUM / HIGH / CRITICAL) based on detention exposure
- **Call In** action — transitions vehicle to CALLED (staging)
- **Override** dialog — supervisor priority rank adjustment
- Entry detail with readiness, recommended dock, labor/equipment status
- Export queue data
- RBAC: Override requires `queue.write`; Call In requires `flow.call`

---

### 10.6 Vehicles (Vehicle Operations Monitor)

| Attribute | Detail |
|-----------|--------|
| **Route** | `/vehicles` |
| **Purpose** | Read-only operational visibility into all vehicles in the yard |

**Capabilities:**
- Operational columns: zone, dock, appointment, status, transporter, material
- Filters: status, zone, dock, vehicle type
- Vehicle detail drawer:
  - Operational Summary
  - Vehicle Details
  - Resource Assignment (labor, equipment)
  - Journey Timeline (standardized lifecycle labels)
  - Audit History
- **No workflow mutations from list** — repositioned from management screen to monitor (per platform audit)
- Export vehicle list

---

### 10.7 Docks

| Attribute | Detail |
|-----------|--------|
| **Route** | `/docks` |
| **Purpose** | Live bay assignment and dock resource coordination |

**Capabilities:**
- Dock CRUD (create, edit, delete)
- KPI cards: total, available, occupied, delayed, maintenance, average utilization
- **Vehicles Awaiting Dock Assignment** table — staging vehicles post call-in
- Bay visualization (top-down grid with status colors)
- Schedule heatmap by hour
- Dock detail drawer: current assignment, resource readiness, assign labor/equipment, assign from queue, start loading, release dock, maintenance mode
- Dock types: Loading, Unloading, Mixed, Hazmat, Cold Chain, Container, General
- RBAC: Create/edit/delete requires `dock.write`; assign requires `flow.assign_dock`

---

### 10.8 Labor Management

| Attribute | Detail |
|-----------|--------|
| **Route** | `/labor` |
| **Purpose** | Labor team roster, shift management, and dock/vehicle assignment |

**Capabilities:**
- Team CRUD with code, name, shift, supervisor, material specialization
- Status filters: ON_DUTY, OFF_DUTY, ASSIGNED, AVAILABLE, BREAK, UNAVAILABLE
- KPI cards: total teams, on duty, assigned, available
- Team detail drawer with assignment history
- Status transitions: on-duty, off-duty, break, assign, release
- Readiness endpoint: `GET /api/labor/readiness/vehicle/{id}`
- RBAC: Create/edit/delete requires `labor.write`

---

### 10.9 Equipment Management

| Attribute | Detail |
|-----------|--------|
| **Route** | `/equipment` |
| **Purpose** | Yard equipment fleet management |

**Capabilities:**
- Equipment types: Forklift, Crane, Reach Stacker, Pallet Jack, Hand Truck, Conveyor, Loader, Stacker
- Status machine: IDLE → ASSIGNED → IN_USE → MAINTENANCE / CHARGING / OUT_OF_SERVICE
- Battery level tracking with 20% minimum for assignment
- KPI cards: total, idle, assigned, in use, maintenance
- Equipment detail drawer with assignment and maintenance history
- Readiness endpoint: `GET /api/equipment/readiness/vehicle/{id}`
- RBAC: Add/edit/delete requires `equipment.write`

---

### 10.10 Loading Operations

| Attribute | Detail |
|-----------|--------|
| **Route** | `/loading` |
| **Purpose** | Live loading/unloading tracker with exception handling |

**Capabilities:**
- Active and completed operations tables with progress bars and health indicators
- KPI cards: active operations, average loading time, open/critical exceptions, paused operations
- Exception panel: assign owner, resolve, close (OPEN → IN_PROGRESS → RESOLVED → CLOSED)
- Operation drawer: start loading/unloading, complete, pause (with reason), resume, create exception
- Resource readiness gating — loading blocked until labor, equipment, and dock are ready
- RBAC: Transitions require `flow.vehicle_transition`; exceptions require `yard_event.write`

---

### 10.11 Yard Map

| Attribute | Detail |
|-----------|--------|
| **Route** | `/yard` |
| **Purpose** | Top-down yard visualization and zone management |

**Capabilities:**
- Zone master: GATE_IN, GATE_OUT, WAITING_AREA, EXIT_HOLDING, loading zones A–F
- Zone occupancy counts and capacity indicators
- Vehicle position by `current_zone_id`
- Manual zone move with reason and audit (`vehicle_zone_history`)
- Zone rules by vehicle status and cargo type
- Yard dashboard summary endpoint: `GET /api/yard/dashboard`

---

### 10.12 Operations Dashboard

| Attribute | Detail |
|-----------|--------|
| **Route** | `/operations-dashboard` |
| **Purpose** | Shift-level operational KPIs from backend-computed metrics |

**Capabilities:**
- KPIs: appointments today, vehicles entered/exited today, in yard, waiting, loading, exit holding
- Average turnaround, waiting, and loading minutes
- SLA compliance percentage (thresholds: waiting 60 min, loading 120 min, turnaround 240 min)
- Backend endpoint: `GET /api/reports/operations-dashboard`
- Canonical KPI definitions shared with Gate Dashboard and Executive KPIs

---

### 10.13 Delay Analysis

| Attribute | Detail |
|-----------|--------|
| **Route** | `/reports/delay-analysis` |
| **Purpose** | Categorized delay analysis report |

**Capabilities:**
- Delay categories derived from yard events and lifecycle timing
- Date range filtering
- CSV/XLSX export: `GET /api/reports/delay-analysis/export`

---

### 10.14 Detention Management

| Attribute | Detail |
|-----------|--------|
| **Route** | `/detention` |
| **Purpose** | Detention cost tracking and dispute workflow |

**Capabilities:**
- Auto-derived detention records from yard timing (free hours, actual hours, rate, cost in INR)
- Status workflow: Pending → Approved → Disputed → Paid → Reviewed
- Summary bundle: today, month-to-date, by category
- Detention configuration endpoint for rates and free-hour thresholds
- RBAC: Status updates require `detention.write`

---

### 10.15 Executive KPIs

| Attribute | Detail |
|-----------|--------|
| **Route** | `/kpis` |
| **Purpose** | Management scorecard for leadership review |

**Capabilities:**
- Scorecard metrics: yard occupancy, dock utilization, average waiting/turnaround, detention exposure, shipment completion, customer satisfaction proxy
- Target vs. actual comparison with trend indicators
- Derived from live YMS and detention APIs
- Suitable for board-level and customer presentations

---

### 10.16 Reporting Suite

| Report | Route | Export Endpoint |
|--------|-------|-----------------|
| Delay Analysis | `/reports/delay-analysis` | `/api/reports/delay-analysis/export` |
| Dock Utilization | `/reports/dock-utilization` | `/api/reports/dock-utilization/export` |
| Labor Productivity | `/reports/labor-productivity` | `/api/reports/labor-productivity/export` |
| Equipment Utilization | `/reports/equipment-utilization` | `/api/reports/equipment-utilization/export` |
| SLA Compliance | `/reports/sla-compliance` | `/api/reports/sla-compliance/export` |
| Vehicle Journey Analytics | `/reports/vehicle-journey` | Per-vehicle via API |

All reports support date range filters and CSV/XLSX export formats.

---

## 11. End-to-End Vehicle Lifecycle

YARD.OS enforces a **15-status canonical lifecycle** with governed transitions. Operational statuses cannot be set via direct PATCH; they must flow through the appropriate module workflow.

### 11.1 Lifecycle Stages

```
┌──────────┐    ┌───────────┐    ┌─────────┐    ┌────────────┐    ┌─────────┐
│  DRAFT   │───▶│ SCHEDULED │───▶│ ARRIVED │───▶│ CHECKED_IN │───▶│ WAITING │
└──────────┘    └───────────┘    └─────────┘    └────────────┘    └────┬────┘
                                                                       │
                    ┌──────────────────────────────────────────────────┘
                    ▼
              ┌─────────┐    ┌───────────────┐    ┌──────────────────┐
              │ CALLED  │───▶│ DOCK_ASSIGNED │───▶│ RESOURCE_PENDING │
              │(Staging)│    └───────────────┘    └────────┬─────────┘
              └─────────┘                                    │
                    ┌────────────────────────────────────────┘
                    ▼
         ┌──────────────────┐    ┌─────────┐    ┌───────────┐
         │ READY_FOR_LOADING  │───▶│ LOADING │───▶│ COMPLETED │
         └──────────────────┘    └─────────┘    └─────┬─────┘
                                                       │ (auto)
                                                       ▼
              ┌──────────────┐    ┌───────────────┐    ┌────────┐
              │ EXIT_HOLDING │───▶│ EXIT_VERIFIED │───▶│ EXITED │
              └──────────────┘    └───────────────┘    └────────┘
```

### 11.2 Stage Ownership

| Stage | Owning Module | Trigger |
|-------|---------------|---------|
| DRAFT → SCHEDULED | Appointments | Book appointment |
| SCHEDULED → ARRIVED | Gate | Mark arrived |
| ARRIVED → CHECKED_IN → WAITING | Gate | Approve entry / check-in |
| WAITING → CALLED | Virtual Queue | Call In |
| CALLED → DOCK_ASSIGNED | Docks | Assign dock |
| DOCK_ASSIGNED → RESOURCE_PENDING → READY_FOR_LOADING | Resource Gating | Labor/equipment assignment |
| READY_FOR_LOADING → LOADING | Docks / Loading Ops | Start loading |
| LOADING → COMPLETED | Loading Ops | Complete operation |
| COMPLETED → EXIT_HOLDING | System (auto) | On completion transition |
| EXIT_HOLDING → EXIT_VERIFIED | Gate | Approve exit (checklist) |
| EXIT_VERIFIED → EXITED | Gate | Gate out |
| Any → CANCELLED | Authorized roles | Cancel trip |

### 11.3 Canonical KPI Buckets

| KPI Bucket | Statuses Included |
|------------|-------------------|
| **Waiting** | `WAITING` only |
| **Loading Pipeline** | `CALLED`, `DOCK_ASSIGNED`, `RESOURCE_PENDING`, `READY_FOR_LOADING`, `LOADING` |
| **Exit Pipeline** | `EXIT_HOLDING`, `EXIT_VERIFIED` |
| **In Yard** | All non-terminal active statuses |

---

## 12. Key Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Governed lifecycle** | Status transitions validated server-side; illegal transitions rejected with HTTP 409 |
| 2 | **Resource gating** | Loading blocked until dock, labor, and equipment readiness confirmed |
| 3 | **Priority queue engine** | Score-based ranking with supervisor override |
| 4 | **Dock recommendation** | Suggested dock on queue call based on vehicle type and material |
| 5 | **Gate verification checklists** | Digital entry/exit checklists stored in `gate_verifications` |
| 6 | **Loading exception management** | Typed exceptions with assign/resolve/close workflow |
| 7 | **Pause/resume loading** | Operational hold with reason codes and yard events |
| 8 | **Control Tower alerts** | Nine rule-based alert types with critical/warning severity |
| 9 | **Yard zone tracking** | Zone occupancy, moves, and history with eligibility rules |
| 10 | **Detention auto-calculation** | Records derived from timing with INR cost and dispute workflow |
| 11 | **Global search** | Cross-entity search across vehicles, appointments, docks, queue, events |
| 12 | **RBAC** | Five roles, twelve permissions, backend + frontend enforcement |
| 13 | **Audit trail** | Every workflow action logged in `yard_events` |
| 14 | **Auto-refresh** | Operational screens poll every 30 seconds + event-driven refresh |
| 15 | **Export** | CSV/XLSX on all reports; PDF on appointments and daily operations |
| 16 | **Docker deployment** | Single `docker compose up` for Postgres, backend, frontend |

---

## 13. Business Benefits

| Benefit | Mechanism | Measurable Outcome |
|---------|-----------|-------------------|
| **Reduced detention costs** | Live waiting/loading tracking + detention module | Fewer disputed carrier invoices |
| **Higher dock throughput** | Auto dock release on lifecycle exit | Bays available for next vehicle sooner |
| **Improved SLA compliance** | SLA report with 60/120/240 min thresholds | Compliance % visible to management |
| **Faster gate processing** | Digital checklists replace paper | Reduced exit-holding queue |
| **Data-driven decisions** | Executive KPIs + six analytical reports | Management reviews backed by live data |
| **Carrier relationship** | Fair priority queue with audit trail | Reduced transporter disputes |
| **Compliance readiness** | Full vehicle journey reconstruction | Audit-ready event history |
| **Demo-to-deal acceleration** | Polished UI with live data | Customer presentations without mockups |

---

## 14. Operational Benefits

| Benefit | For Whom | How |
|---------|----------|-----|
| Single screen for yard state | Yard Controller | Control Tower consolidates all KPIs |
| No radio dispatch for docks | Dock Supervisor | Assign dock from queue in Docks module |
| Know before loading starts | Loading team | Resource readiness panel shows missing labor/equipment |
| Exception ownership | Operations | Loading exceptions assigned to named owners |
| Exit lane decongestion | Gate staff | Exit holding list with verify/gate-out actions |
| Correct vehicle placement | Yard team | Yard Map with zone rules and move history |
| Shift handover clarity | All shifts | Operations Dashboard with entered/exited today counts |
| Role-appropriate UI | All users | Read-only users see no workflow buttons |

---

## 15. Reporting and Analytics Capabilities

### 15.1 Dashboards

| Dashboard | Audience | Refresh | Key Metrics |
|-----------|----------|---------|-------------|
| Control Tower | Operations / Management | 30s | Yard occupancy, alerts, queue, docks |
| Operations Dashboard | Shift supervisors | On load | Entered/exited today, SLA compliance |
| Executive KPIs | Leadership | On load | Scorecard with targets |
| Gate Dashboard | Gate staff | 30s | Entry/exit KPIs, activity tabs |

### 15.2 Analytical Reports

| Report | Primary Question Answered |
|--------|--------------------------|
| **Delay Analysis** | Where are delays occurring and in which categories? |
| **Dock Utilization** | Which bays are over/under-utilized? |
| **Labor Productivity** | How productive are labor teams by shift? |
| **Equipment Utilization** | What is equipment uptime and assignment rate? |
| **SLA Compliance** | What percentage of vehicles meet waiting/loading/turnaround SLAs? |
| **Vehicle Journey** | What is the complete timeline for a specific vehicle? |

### 15.3 Export Formats

All report endpoints support `?fmt=csv` (default) and `?fmt=xlsx` export via `report_export_service.py`.

### 15.4 Alert Analytics

Control Tower alerts feed into:
- Top navigation badge counts (critical / warning / total active)
- Control Tower alert panel on dashboard
- Operational Recommendations module

---

## 16. Technology Stack

### 16.1 Frontend

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React | 19 |
| Routing | React Router | 7 |
| Build tool | Create React App + CRACO | — |
| Styling | Tailwind CSS | 3.4 |
| UI components | Radix UI | — |
| Icons | Lucide React | — |
| Charts | Recharts | — |
| HTTP client | Axios | — |
| Data fetching | TanStack React Query, SWR | — |
| Forms | React Hook Form + Zod | — |
| PDF export | jsPDF + jsPDF-AutoTable | — |
| Notifications | Sonner | — |
| E2E testing | Playwright | — |

### 16.2 Backend

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | FastAPI | 0.110 |
| Server | Uvicorn | 0.25 |
| Database driver | asyncpg | 0.29 |
| Validation | Pydantic | 2.x |
| Export | pandas, openpyxl | — |
| Testing | pytest | 8.3 |
| Language | Python | 3.11 |

### 16.3 Infrastructure

| Component | Technology |
|-----------|------------|
| Database | PostgreSQL 16 (Alpine) |
| Frontend server | Nginx 1.27 (Alpine) |
| Containerization | Docker Compose |
| Backend port | 8001 → 8000 |
| Frontend port | 3001 → 80 |
| Database port | 5433 → 5432 |

### 16.4 Configuration

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ORIGINS` | Allowed frontend origins |
| `YMS_AUTH_MODE` | `dev` or `strict` |
| `YMS_DEFAULT_ROLE` | Fallback role in dev mode |
| `REACT_APP_API_BASE_URL` | Frontend API base URL |

---

## 17. High-Level Solution Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                              │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌────────────────┐ │
│  │ Control     │  │ Operations   │  │ Resources  │  │ Finance &      │ │
│  │ Tower       │  │ (Gate, Queue,│  │ (Vehicles, │  │ Reports        │ │
│  │ Dashboard   │  │  Docks,      │  │  Labor,    │  │ (Detention,    │ │
│  │ Alerts      │  │  Loading)    │  │  Equipment)│  │  KPIs, Reports)│ │
│  └──────┬──────┘  └──────┬───────┘  └─────┬──────┘  └───────┬────────┘ │
│         │                │                │                  │          │
│         └────────────────┴────────────────┴──────────────────┘          │
│                                   │                                     │
│                    React SPA (Nginx) — Port 3001                        │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ REST / JSON (Axios)
                                    │ Headers: X-YMS-Role, X-YMS-User
┌───────────────────────────────────┴─────────────────────────────────────┐
│                           API LAYER (FastAPI)                           │
│  ┌────────┐ ┌────────┐ ┌──────┐ ┌──────┐ ┌───────┐ ┌───────────────┐  │
│  │ Auth   │ │ YMS    │ │ Gate │ │ Queue│ │ Yard  │ │ Reports       │  │
│  │ RBAC   │ │ Core   │ │      │ │      │ │       │ │ Control Tower │  │
│  └────────┘ └────────┘ └──────┘ └──────┘ └───────┘ │ Loading Ops   │  │
│                                                      └───────────────┘  │
│                         Port 8001                                       │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴─────────────────────────────────────┐
│                         SERVICE LAYER                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ ┌───────────────┐ │
│  │ yms_service  │ │ gate_service │ │ queue_service │ │ yard_service  │ │
│  │ (lifecycle,  │ │ (entry/exit  │ │ (priority,    │ │ (zones,       │ │
│  │  CRUD, flow) │ │  verify)     │ │  override)    │ │  moves)       │ │
│  └──────────────┘ └──────────────┘ └───────────────┘ └───────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ ┌───────────────┐ │
│  │ dock_resource│ │ resource_    │ │ loading_      │ │ control_tower │ │
│  │ _service     │ │ gating       │ │ exceptions    │ │ _alerts       │ │
│  └──────────────┘ └──────────────┘ └───────────────┘ └───────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌───────────────┐                  │
│  │ detention_   │ │ operational_ │ │ operational_  │                  │
│  │ service      │ │ metrics      │ │ reports       │                  │
│  └──────────────┘ └──────────────┘ └───────────────┘                  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │ asyncpg
┌───────────────────────────────────┴─────────────────────────────────────┐
│                      DATA LAYER (PostgreSQL 16)                         │
│  vehicles · appointments · queue_entries · docks · equipment ·            │
│  labor_teams · yard_events · gate_verifications · detention_records ·   │
│  loading_operation_exceptions · yard_zones · vehicle_zone_history ·     │
│  zone_rules                                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

### 17.1 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Monolithic FastAPI backend | Simpler deployment for demo/single-facility; clear service boundaries for future extraction |
| asyncpg connection pool | High-concurrency async I/O for yard event queries |
| Schema-on-startup (`create_schema`) | Zero-migration demo deploy; production would add Alembic |
| Header-based RBAC | Rapid demo role switching; replaceable with JWT/SSO |
| Client-derived Control Tower KPIs | Reduces backend coupling; alerts endpoint is server-computed |
| Canonical operational metrics module | Single source for waiting/loading/exit KPI definitions |
| Event-sourced audit (`yard_events`) | Full journey reconstruction without event sourcing framework |

---

## 18. Current Project Scope

### 18.1 Delivered Capabilities

| Category | Items Delivered |
|----------|----------------|
| **Screens** | 19 routed pages across 4 navigation sections |
| **API endpoints** | 80+ REST endpoints across 10 routers |
| **Database tables** | 14 entities with relationships and seed data |
| **Automated tests** | 122 backend pytest tests |
| **E2E tests** | Playwright audit suite |
| **Docker deployment** | 3-container stack (Postgres, backend, frontend) |
| **RBAC** | 5 roles, 12 permissions, frontend UI guards |
| **Reports** | 6 analytical reports with CSV/XLSX export |
| **Alerts** | 9 Control Tower alert rule types |
| **Demo data** | Seed and cleanup scripts for repeatable demos |

### 18.2 Recent Stabilization (Audit Remediation)

| Fix | Outcome |
|-----|---------|
| Gate KPI alignment | Gate Waiting = Operations Waiting (canonical `WAITING` only) |
| Dock release consistency | Docks released on COMPLETED/EXIT_* transitions |
| Live alert counts | TopNav badges from Control Tower API |
| Operational recommendations | Rule-based insights replacing static mock data |
| Frontend RBAC | Write actions hidden per role |
| Report routing | All six report pages accessible from navigation |
| Performance baseline | Operations dashboard ~125ms; identified optimization paths |

### 18.3 Known Limitations

| Limitation | Impact | Mitigation Path |
|------------|--------|-----------------|
| Dev header auth | Not production-secure | JWT/SSO integration |
| `yard_events` cap at 1000 rows | Performance at scale | Scoped SQL queries |
| Single facility | No multi-site | Tenant model |
| No OCR/ANPR | Manual gate lookup | Hardware integration (see §19) |
| Legacy stale dock data | Pre-fix occupancy | One-time reconciliation script |

---

## 19. Future Enhancements

### 19.1 OCR / ANPR Gate Automation

| Aspect | Plan |
|--------|------|
| **Current state** | Gate scan API (`POST /api/gate/scan`) accepts manual query; mock scanner service in frontend |
| **Enhancement** | Integrate ANPR cameras and OCR for gate pass / invoice document scanning |
| **Benefit** | Zero-touch vehicle lookup at entry; reduced gate staff workload |
| **Integration point** | `gate_service.record_gate_scan()` → auto-populate entry verification checklist |

### 19.2 ERP Integration

| Aspect | Plan |
|--------|------|
| **Current state** | Detention records and appointment data exist in PostgreSQL |
| **Enhancement** | Bi-directional sync with SAP / Oracle / Tally for detention billing, appointment import, and shipment reference |
| **Benefit** | Eliminate double-entry; automated invoice generation |
| **Integration point** | Webhook or scheduled ETL from `/api/detention` and `/api/appointments` |

### 19.3 Fleet / Telematics Integration

| Aspect | Plan |
|--------|------|
| **Current state** | Vehicle `expected_arrival` is manual; EN_ROUTE/APPROACHING are display-only journey steps |
| **Enhancement** | Ingest GPS/telematics feeds to auto-transition SCHEDULED → APPROACHING → ARRIVED |
| **Benefit** | Proactive dock and labor preparation before vehicle arrival |
| **Integration point** | New `telematics_service` updating `vehicles.expected_arrival` and triggering yard events |

### 19.4 Additional Roadmap Items

| Enhancement | Priority | Description |
|-------------|----------|-------------|
| Enterprise SSO (OAuth2/SAML) | High | Replace header-based auth |
| Multi-facility tenancy | Medium | Facility selector, data isolation |
| Mobile gate app | Medium | Tablet-optimized gate workflow |
| WMS/TMS connectors | Medium | Appointment and shipment sync |
| Predictive analytics | Low | ML-based delay prediction (beyond current rule-based recommendations) |
| Real-time WebSocket push | Low | Replace 30s polling with server-push updates |

---

## 20. Conclusion

The **Smart Yard Management System (YARD.OS)** delivers a comprehensive, demo-ready platform for vehicle orchestration at logistics yards. Built on modern web technologies with a governed lifecycle, role-based access, live operational alerts, and a full reporting suite, it addresses the core business and operational challenges of traditional yard management.

The system provides:

- **Trustworthy metrics** through canonical KPI definitions shared across Control Tower, Gate, Operations Dashboard, and Executive KPIs
- **Operational discipline** through enforced status transitions, resource gating, and audit trails
- **Management visibility** through dashboards, alerts, recommendations, and six exportable reports
- **Deployment simplicity** through Docker Compose with PostgreSQL, FastAPI, and React

With a platform maturity score of **88/100** and demo readiness of **90/100**, YARD.OS is ready for stakeholder demonstrations, customer presentations, project submissions, and portfolio showcases. Production deployment requires enterprise authentication, performance optimization for large event histories, and integration connectors for ERP and fleet systems as outlined in the future enhancements roadmap.

---

*Document generated from the implemented YARD.OS codebase. For API details see `docs/API_INVENTORY.md`; for routes see `docs/ROUTE_INVENTORY.md`; for data model see `docs/DATA_MODEL_ERD.md`.*

**End of Document**
