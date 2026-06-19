# Database Design Document (DDD)
# Smart Yard Management System — YARD.OS

---

| Field | Value |
|-------|-------|
| **Document Title** | Database Design Document — YARD.OS |
| **Product** | YARD.OS — Vehicle Orchestration Platform |
| **Version** | 1.0 |
| **Status** | Implementation-Aligned |
| **Date** | June 2026 |
| **Audience** | Developers, DBAs, Architects, Reporting Teams |
| **Source of Truth** | `backend/db.py` → `create_schema()` |
| **Database Engine** | PostgreSQL 16 |
| **Companion Docs** | `DATA_MODEL_ERD.md`, `YMS_System_Architecture_Document.md` |

---

## Table of Contents

1. [Database Overview](#1-database-overview)
2. [Entity Relationship Model](#2-entity-relationship-model)
3. [Table-by-Table Documentation](#3-table-by-table-documentation)
   - [3.1 vehicles](#31-vehicles)
   - [3.2 appointments](#32-appointments)
   - [3.3 queue_entries](#33-queue_entries)
   - [3.4 docks](#34-docks)
   - [3.5 labor_teams](#35-labor_teams)
   - [3.6 equipment](#36-equipment)
   - [3.7 yard_events](#37-yard_events)
   - [3.8 gate_verifications](#38-gate_verifications)
   - [3.9 loading_operation_exceptions](#39-loading_operation_exceptions)
   - [3.10 detention_records](#310-detention_records)
   - [3.11 yard_zones](#311-yard_zones)
   - [3.12 vehicle_zone_history](#312-vehicle_zone_history)
4. [Field Classification Reference](#4-field-classification-reference)
5. [Index Summary](#5-index-summary)
6. [Auxiliary Tables](#6-auxiliary-tables)

---

# 1. Database Overview

## 1.1 Purpose

The YARD.OS database stores all operational state for yard vehicle orchestration: master data (vehicles, docks, equipment, labor), transactional workflow state (appointments, queue entries, gate verifications), spatial placement (yard zones, zone history), operational exceptions, detention billing, and an append-only audit log (`yard_events`).

## 1.2 Design Characteristics

| Characteristic | Implementation |
|----------------|----------------|
| **Schema management** | Inline DDL in `backend/db.py` — `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ADD COLUMN IF NOT EXISTS` on startup |
| **Migrations** | No Flyway/Alembic; schema evolves via idempotent ALTER statements |
| **Primary keys** | UUID on all business tables |
| **Timestamps** | `TIMESTAMPTZ` with `DEFAULT NOW()` for `created_at` / `updated_at` |
| **Soft delete** | Not used — records are updated in place or hard-deleted (zones, equipment, labor) |
| **Multi-tenancy** | None — single-yard deployment |
| **Connection** | `asyncpg` connection pool via `DATABASE_URL` |

## 1.3 Database Connection

| Environment | Connection String |
|-------------|-------------------|
| Docker Compose | `postgresql://smart_yard_user:smart_yard_password@postgres:5432/smart_yard` |
| Host access | Port `5433` mapped to container `5432` |
| Database name | `smart_yard` |

## 1.4 Table Inventory

| Table | Category | Row Lifecycle |
|-------|----------|---------------|
| `vehicles` | Master + operational state | Long-lived; status evolves per visit |
| `appointments` | Master + operational state | One per scheduled visit |
| `queue_entries` | Operational | Created at check-in; 1:1 with appointment |
| `docks` | Master + operational state | Long-lived bay configuration |
| `labor_teams` | Master + assignment state | Long-lived team registry |
| `equipment` | Master + assignment state | Long-lived asset registry |
| `yard_events` | Audit | Append-only |
| `gate_verifications` | Operational | Per vehicle/appointment gate session |
| `loading_operation_exceptions` | Operational | Per loading incident |
| `detention_records` | Operational + billing | Per detention charge line |
| `yard_zones` | Master | Long-lived zone definitions |
| `vehicle_zone_history` | Audit | Append-only movement log |

## 1.5 Master vs Operational vs Audit

```mermaid
flowchart LR
    subgraph Master["Master Data"]
        V[vehicles]
        A[appointments]
        D[docks]
        LT[labor_teams]
        EQ[equipment]
        YZ[yard_zones]
    end

    subgraph Operational["Operational State"]
        Q[queue_entries]
        GV[gate_verifications]
        LOE[loading_operation_exceptions]
        DR[detention_records]
    end

    subgraph Audit["Audit / Analytics Input"]
        YE[yard_events]
        VZH[vehicle_zone_history]
    end

    V --> Q
    A --> Q
    Q --> GV
    V --> YE
    V --> VZH
    YZ --> V
```

---

# 2. Entity Relationship Model

## 2.1 Full ERD

```mermaid
erDiagram
    vehicles ||--o{ appointments : "vehicle_id"
    vehicles ||--o{ queue_entries : "vehicle_id"
    vehicles ||--o{ yard_events : "vehicle_id"
    vehicles ||--o{ detention_records : "vehicle_id"
    vehicles ||--o{ gate_verifications : "vehicle_id"
    vehicles ||--o{ vehicle_zone_history : "vehicle_id"
    vehicles ||--o{ loading_operation_exceptions : "vehicle_id"
    vehicles }o--o| yard_zones : "current_zone_id"
    vehicles ||--o| docks : "current_vehicle_id"

    appointments ||--|| queue_entries : "appointment_id UNIQUE"
    appointments ||--o{ yard_events : "appointment_id"
    appointments ||--o{ detention_records : "appointment_id"
    appointments ||--o{ gate_verifications : "appointment_id"
    appointments ||--o{ loading_operation_exceptions : "appointment_id"

    queue_entries }o--o| docks : "dock_id"
    queue_entries ||--o{ yard_events : "queue_entry_id"
    queue_entries ||--o| detention_records : "queue_entry_id"
    queue_entries ||--o{ loading_operation_exceptions : "queue_entry_id"

    docks ||--o{ yard_events : "dock_id"
    docks ||--o{ equipment : "assigned_dock_id"
    docks ||--o{ labor_teams : "assigned_dock_id"
    docks }o--o| labor_teams : "default_labor_id"
    docks }o--o| equipment : "default_equipment_id"
    docks }o--o| yard_zones : "linked_dock_id"

    vehicles ||--o{ equipment : "assigned_vehicle_id"
    vehicles ||--o{ labor_teams : "assigned_vehicle_id"

    equipment ||--o{ yard_events : "equipment_id"
    labor_teams ||--o{ yard_events : "labor_id"

    yard_zones ||--o{ vehicle_zone_history : "previous_zone_id"
    yard_zones ||--o{ vehicle_zone_history : "new_zone_id"

    vehicles {
        uuid id PK
        text vehicle_number UK
        text status
        uuid current_zone_id FK
        timestamptz arrived_at
        timestamptz exit_holding_at
        timestamptz exit_time
    }

    appointments {
        uuid id PK
        text booking_reference UK
        uuid vehicle_id FK
        text status
        timestamptz reporting_time
    }

    queue_entries {
        uuid id PK
        uuid appointment_id FK_UK
        uuid vehicle_id FK
        uuid dock_id FK
        int priority_score
        text status
    }

    docks {
        uuid id PK
        text dock_code UK
        text status
        uuid current_vehicle_id FK
        int estimated_service_time_min
    }

    yard_events {
        uuid id PK
        text event_type
        timestamptz event_time
        uuid vehicle_id FK
    }
```

## 2.2 Relationship Cardinality Summary

| Parent | Child | Cardinality | FK Delete Rule |
|--------|-------|-------------|----------------|
| `vehicles` | `appointments` | 1:N | RESTRICT |
| `vehicles` | `queue_entries` | 1:N | RESTRICT |
| `appointments` | `queue_entries` | 1:1 | RESTRICT (UNIQUE on appointment_id) |
| `docks` | `queue_entries` | 1:N | SET NULL |
| `docks` | `vehicles` (current_vehicle_id) | 1:1 | SET NULL |
| `yard_zones` | `vehicles` (current_zone_id) | 1:N | SET NULL |
| `vehicles` | `yard_events` | 1:N | SET NULL |
| `vehicles` | `detention_records` | 1:N | CASCADE |
| `vehicles` | `gate_verifications` | 1:N | CASCADE |
| `vehicles` | `vehicle_zone_history` | 1:N | CASCADE |

## 2.3 Lifecycle Data Flow Across Tables

```mermaid
flowchart TD
    A[appointments.SCHEDULED] --> V[vehicles.status sync]
    V --> G[gate_verifications entry checks]
    G --> Q[queue_entries created at check-in]
    Q --> D[docks assigned OCCUPIED]
    D --> LT[labor_teams / equipment assigned]
    LT --> LO[loading_operation_exceptions optional]
    LO --> YE[yard_events LOADING_*]
    YE --> DR[detention_records if wait exceeds free_hours]
    YE --> GV2[gate_verifications exit checks]
    GV2 --> V2[vehicles.EXITED exit_time set]
    V2 --> VZH[vehicle_zone_history on zone moves]
```

---

# 3. Table-by-Table Documentation

---

## 3.1 vehicles

### Purpose

Central registry for all vehicles visiting the yard. Stores identity, ownership, driver contact, **lifecycle status**, spatial placement (`current_zone_id`), and **milestone timestamps** used for turnaround, detention, and exit reporting.

### Columns

| Column | Data Type | Nullable | Default | Classification |
|--------|-----------|----------|---------|----------------|
| `id` | `UUID` | NO | — | PK |
| `vehicle_number` | `TEXT` | NO | — | Identity (plate / fleet number) |
| `vehicle_type` | `TEXT` | NO | — | Master (TRUCK, TRAILER, etc.) |
| `ownership_type` | `TEXT` | NO | — | Master; CHECK constraint |
| `transporter_name` | `TEXT` | NO | — | Master |
| `driver_name` | `TEXT` | YES | — | Master (nullable after migration) |
| `driver_phone` | `TEXT` | YES | — | Master (nullable after migration) |
| `status` | `TEXT` | NO | — | **Lifecycle** |
| `vehicle_reference` | `TEXT` | YES | — | Identity; UNIQUE |
| `display_name` | `TEXT` | YES | — | Display |
| `operation_type` | `TEXT` | NO | `'Loading'` | Master (Loading, Unloading, Transit, Inter-Warehouse) |
| `material_type` | `TEXT` | NO | `'GENERAL'` | Master; affects zone rules / hazmat |
| `registration_source` | `TEXT` | NO | `'manual'` | Audit (`appointment`, `manual`) |
| `expected_arrival` | `TIMESTAMPTZ` | YES | — | Scheduling |
| `remarks` | `TEXT` | YES | — | Notes |
| `current_zone_id` | `UUID` | YES | — | **Lifecycle** (spatial) |
| `arrived_at` | `TIMESTAMPTZ` | YES | — | **Lifecycle** / **Reporting** |
| `exit_holding_at` | `TIMESTAMPTZ` | YES | — | **Lifecycle** / **Reporting** |
| `exit_time` | `TIMESTAMPTZ` | YES | — | **Lifecycle** / **Reporting** |
| `exited_by` | `TEXT` | YES | — | **Audit** |
| `exit_gate_id` | `TEXT` | YES | — | **Reporting** |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |

### Primary Key

- `id` (`UUID`)

### Foreign Keys

| Column | References | ON DELETE |
|--------|------------|-----------|
| `current_zone_id` | `yard_zones(id)` | SET NULL |

### Referenced By

| Table | Column |
|-------|--------|
| `appointments` | `vehicle_id` |
| `queue_entries` | `vehicle_id` |
| `docks` | `current_vehicle_id` |
| `equipment` | `assigned_vehicle_id` |
| `labor_teams` | `assigned_vehicle_id` |
| `yard_events` | `vehicle_id` |
| `gate_verifications` | `vehicle_id` |
| `loading_operation_exceptions` | `vehicle_id` |
| `detention_records` | `vehicle_id` |
| `vehicle_zone_history` | `vehicle_id` |

### Constraints

| Type | Definition |
|------|------------|
| `UNIQUE` | `vehicle_number` |
| `UNIQUE` | `vehicle_reference` (when not null) |
| `CHECK` | `ownership_type IN ('company', 'contract', 'outside')` |
| Application | `status` ∈ `YMS_STATUSES` (`enums.py`); transitions via `STATUS_TRANSITIONS` |

### Valid Status Values (Lifecycle)

`DRAFT`, `SCHEDULED`, `ARRIVED`, `CHECKED_IN`, `WAITING`, `CALLED`, `DOCK_ASSIGNED`, `RESOURCE_PENDING`, `READY_FOR_LOADING`, `LOADING`, `COMPLETED`, `EXIT_HOLDING`, `EXIT_VERIFIED`, `EXITED`, `CANCELLED`

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `vehicles_vehicle_number_key` | `vehicle_number` | UNIQUE (implicit) |
| `vehicles_vehicle_reference_key` | `vehicle_reference` | UNIQUE (implicit) |
| `idx_vehicles_vehicle_number` | `vehicle_number` | Lookup by plate |
| `idx_vehicles_status` | `status` | KPI filters, waiting counts |
| `idx_vehicles_reference` | `vehicle_reference` | Alternate identity lookup |
| `idx_vehicles_current_zone` | `current_zone_id` | Zone occupancy counts |

### Reporting Usage

- `status` — canonical KPI source (`operational_metrics.count_vehicles_waiting()`)
- `arrived_at`, `exit_time`, `exit_holding_at` — turnaround time, exit delay analysis
- `operation_type`, `material_type` — dock/zone matching, hazmat alerts
- `current_zone_id` — yard occupancy (COUNT per zone)

---

## 3.2 appointments

### Purpose

Scheduled vehicle visits. Links a vehicle to a booking slot, gate, customer/shipment metadata, and priority. Status is synchronized with `vehicles.status` during operational workflow.

### Columns

| Column | Data Type | Nullable | Default | Classification |
|--------|-----------|----------|---------|----------------|
| `id` | `UUID` | NO | — | PK |
| `booking_reference` | `TEXT` | NO | — | Identity; UNIQUE |
| `vehicle_id` | `UUID` | NO | — | FK |
| `customer_name` | `TEXT` | NO | — | Master |
| `shipment_reference` | `TEXT` | NO | — | Master; hazmat/cargo hints |
| `booking_date` | `DATE` | NO | — | **Reporting** / scheduling |
| `reporting_time` | `TIMESTAMPTZ` | NO | — | **Reporting**; priority score input |
| `scheduled_slot` | `TEXT` | NO | — | Scheduling |
| `gate_number` | `TEXT` | NO | — | Gate routing (G1–G4) |
| `priority` | `INTEGER` | NO | `0` | **Reporting**; queue priority (0/50/90) |
| `status` | `TEXT` | NO | — | **Lifecycle** (synced with vehicle) |
| `remarks` | `TEXT` | YES | — | Notes |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |

### Primary Key

- `id` (`UUID`)

### Foreign Keys

| Column | References | ON DELETE |
|--------|------------|-----------|
| `vehicle_id` | `vehicles(id)` | RESTRICT |

### Referenced By

| Table | Column |
|-------|--------|
| `queue_entries` | `appointment_id` (UNIQUE) |
| `yard_events` | `appointment_id` |
| `gate_verifications` | `appointment_id` |
| `loading_operation_exceptions` | `appointment_id` |
| `detention_records` | `appointment_id` |
| `labor_teams` | `assigned_appointment_id` |
| `equipment` | `assigned_appointment_id` |

### Constraints

| Type | Definition |
|------|------------|
| `UNIQUE` | `booking_reference` |
| Application | Direct PATCH status limited to `DRAFT`, `SCHEDULED`, `CANCELLED` |
| Application | Operational statuses set only via workflow services |

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `appointments_booking_reference_key` | `booking_reference` | UNIQUE (implicit) |
| `idx_appointments_booking_reference` | `booking_reference` | Gate lookup by APT-xxx |
| `idx_appointments_status` | `status` | Dashboard filters |

### Reporting Usage

- `booking_date`, `reporting_time` — lateness calculation for priority score
- `priority` — queue ordering analytics
- `shipment_reference`, `remarks` — hazmat detection heuristics
- `gate_number` — gate throughput reports

---

## 3.3 queue_entries

### Purpose

Virtual queue records created at gate check-in. One queue entry per appointment. Tracks priority score, queue lifecycle status, dock assignment, and **phase timestamps** for wait-time and service-time reporting.

### Columns

| Column | Data Type | Nullable | Default | Classification |
|--------|-----------|----------|---------|----------------|
| `id` | `UUID` | NO | — | PK |
| `appointment_id` | `UUID` | NO | — | FK; UNIQUE |
| `vehicle_id` | `UUID` | NO | — | FK |
| `queue_number` | `TEXT` | NO | — | Identity; UNIQUE |
| `queue_type` | `TEXT` | NO | — | Operational (load/unload hint) |
| `priority_score` | `INTEGER` | NO | — | **Reporting**; computed at check-in |
| `checkin_time` | `TIMESTAMPTZ` | YES | — | **Lifecycle** / **Reporting** |
| `called_time` | `TIMESTAMPTZ` | YES | — | **Lifecycle** / **Reporting** |
| `dock_assigned_time` | `TIMESTAMPTZ` | YES | — | **Lifecycle** / **Reporting** |
| `dock_id` | `UUID` | YES | — | FK |
| `status` | `TEXT` | NO | — | **Lifecycle** (synced with vehicle) |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |

### Primary Key

- `id` (`UUID`)

### Foreign Keys

| Column | References | ON DELETE |
|--------|------------|-----------|
| `appointment_id` | `appointments(id)` | RESTRICT |
| `vehicle_id` | `vehicles(id)` | RESTRICT |
| `dock_id` | `docks(id)` | SET NULL |

### Referenced By

| Table | Column |
|-------|--------|
| `yard_events` | `queue_entry_id` |
| `detention_records` | `queue_entry_id` |
| `loading_operation_exceptions` | `queue_entry_id` |
| `labor_teams` | `assigned_queue_entry_id` |
| `equipment` | `assigned_queue_entry_id` |

### Constraints

| Type | Definition |
|------|------------|
| `UNIQUE` | `appointment_id` — one queue per appointment |
| `UNIQUE` | `queue_number` |
| Application | `priority_score = (priority × 10) + min(lateness_minutes, 120)` at creation |

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `queue_entries_appointment_id_key` | `appointment_id` | UNIQUE (implicit) |
| `queue_entries_queue_number_key` | `queue_number` | UNIQUE (implicit) |
| `idx_queue_entries_queue_number` | `queue_number` | Lookup |
| `idx_queue_entries_status` | `status` | Queue bundle, congestion alerts |

### Reporting Usage

- `checkin_time` → `called_time` — wait duration
- `called_time` → `dock_assigned_time` — staging duration
- `priority_score` — queue fairness analytics
- `dock_id` — dock assignment correlation

---

## 3.4 docks

### Purpose

Physical loading/unloading bay master data and real-time occupancy state. Stores capability metadata (supported vehicle/cargo types), **service time estimates** for SLA reporting, and default resource assignments.

### Columns

| Column | Data Type | Nullable | Default | Classification |
|--------|-----------|----------|---------|----------------|
| `id` | `UUID` | NO | — | PK |
| `dock_code` | `TEXT` | NO | — | Identity; UNIQUE |
| `dock_name` | `TEXT` | NO | — | Display |
| `dock_type` | `TEXT` | NO | — | Master (LOADING, UNLOADING, HAZMAT, etc.) |
| `supported_vehicle_types` | `TEXT[]` | NO | `'{}'` | Master |
| `supported_cargo_types` | `TEXT[]` | NO | `'{}'` | Master |
| `status` | `TEXT` | NO | — | **Lifecycle** (AVAILABLE, OCCUPIED, …) |
| `current_vehicle_id` | `UUID` | YES | — | FK; operational occupancy |
| `zone` | `TEXT` | YES | — | Layout (Zone A–F) |
| `max_capacity` | `INTEGER` | NO | `1` | Capacity |
| `notes` | `TEXT` | YES | — | Notes |
| `assigned_since` | `TIMESTAMPTZ` | YES | — | **Reporting**; occupancy duration |
| `estimated_service_time_min` | `INTEGER` | NO | `90` | **Reporting**; loading SLA default |
| `default_labor_id` | `UUID` | YES | — | FK; default team |
| `default_equipment_id` | `UUID` | YES | — | FK; default equipment |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |

### Primary Key

- `id` (`UUID`)

### Foreign Keys

| Column | References | ON DELETE |
|--------|------------|-----------|
| `current_vehicle_id` | `vehicles(id)` | SET NULL |
| `default_labor_id` | `labor_teams(id)` | SET NULL |
| `default_equipment_id` | `equipment(id)` | SET NULL |

### Referenced By

| Table | Column |
|-------|--------|
| `queue_entries` | `dock_id` |
| `yard_events` | `dock_id` |
| `equipment` | `assigned_dock_id` |
| `labor_teams` | `assigned_dock_id` |
| `loading_operation_exceptions` | `dock_id` |
| `yard_zones` | `linked_dock_id` |

### Constraints

| Type | Definition |
|------|------------|
| `UNIQUE` | `dock_code` |
| Application | `status` ∈ `DOCK_STATUSES` |
| Application | `MAINTENANCE`, `BLOCKED`, `OUT_OF_SERVICE` block loading |

### Valid Status Values

`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`, `BLOCKED`, `OUT_OF_SERVICE`

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `docks_dock_code_key` | `dock_code` | UNIQUE (implicit) |
| `idx_docks_dock_code` | `dock_code` | Lookup |
| `idx_docks_status` | `status` | Utilization, assignment |

### Reporting Usage

- `estimated_service_time_min` — LOADING_DELAY alert threshold, dock utilization SLA
- `assigned_since` + `status` — occupied minutes in dock utilization report
- `zone`, `dock_type` — zone-level utilization breakdown

---

## 3.5 labor_teams

### Purpose

Labor team registry with shift metadata, material specialization, and real-time assignment to docks/vehicles/queue entries. Labor assignment is **mandatory** for loading readiness.

### Columns

| Column | Data Type | Nullable | Default | Classification |
|--------|-----------|----------|---------|----------------|
| `id` | `UUID` | NO | — | PK |
| `team_code` | `TEXT` | NO | — | Identity; UNIQUE |
| `team_name` | `TEXT` | NO | — | Display |
| `shift_start` | `TEXT` | NO | — | Scheduling (e.g. `06:00`) |
| `shift_end` | `TEXT` | NO | — | Scheduling |
| `members_count` | `INTEGER` | NO | `0` | Capacity |
| `available_count` | `INTEGER` | NO | `0` | **Reporting** |
| `assigned_count` | `INTEGER` | NO | `0` | **Reporting** |
| `status` | `TEXT` | NO | — | **Lifecycle** |
| `team_type` | `TEXT` | NO | `'GENERAL'` | Legacy; superseded by material_type |
| `material_type` | `TEXT` | NO | `'GENERAL'` | Master; cargo specialization |
| `skills` | `TEXT[]` | NO | `'{}'` | Capabilities |
| `supervisor_name` | `TEXT` | YES | — | Contact |
| `supervisor_phone` | `TEXT` | YES | — | Contact |
| `current_assignment` | `TEXT` | YES | — | Display |
| `current_location` | `TEXT` | YES | — | Display |
| `assigned_dock_id` | `UUID` | YES | — | FK |
| `assigned_vehicle_id` | `UUID` | YES | — | FK |
| `assigned_queue_entry_id` | `UUID` | YES | — | FK |
| `assigned_appointment_id` | `UUID` | YES | — | FK |
| `assigned_since` | `TIMESTAMPTZ` | YES | — | **Reporting**; assignment duration |
| `notes` | `TEXT` | YES | — | Notes |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |

### Primary Key

- `id` (`UUID`)

### Foreign Keys

| Column | References | ON DELETE |
|--------|------------|-----------|
| `assigned_dock_id` | `docks(id)` | SET NULL |
| `assigned_vehicle_id` | `vehicles(id)` | SET NULL |
| `assigned_queue_entry_id` | `queue_entries(id)` | SET NULL |
| `assigned_appointment_id` | `appointments(id)` | SET NULL |

### Referenced By

| Table | Column |
|-------|--------|
| `yard_events` | `labor_id` |
| `docks` | `default_labor_id` |

### Constraints

| Type | Definition |
|------|------------|
| `UNIQUE` | `team_code` |
| Application | `status` ∈ `LABOR_STATUSES`; `LABOR_STATUS_TRANSITIONS` enforced |
| Application | Assigned teams cannot be deleted (409) |

### Valid Status Values

`ON_DUTY`, `OFF_DUTY`, `ASSIGNED`, `AVAILABLE`, `BREAK`, `UNAVAILABLE`

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `labor_teams_team_code_key` | `team_code` | UNIQUE (implicit) |
| `idx_labor_teams_code` | `team_code` | Lookup |
| `idx_labor_teams_status` | `status` | Availability queries |
| `idx_labor_teams_assigned_dock` | `assigned_dock_id` | Dock resource view |
| `idx_labor_teams_assigned_vehicle` | `assigned_vehicle_id` | Readiness check |
| `idx_labor_teams_team_type` | `team_type` | Legacy filter |
| `idx_labor_teams_material_type` | `material_type` | Specialization matching |

### Reporting Usage

- `assigned_since` — loading minutes in labor productivity report
- `members_count`, `assigned_count` — utilization percentage
- Events `TEAM_ASSIGNED` / `TEAM_RELEASED` — vehicles served count

---

## 3.6 equipment

### Purpose

Yard equipment asset registry (forklifts, cranes, reach stackers, etc.) with battery level, maintenance schedule, and assignment to docks/vehicles. Equipment is **optional** for loading readiness but tracked for utilization reporting.

### Columns

| Column | Data Type | Nullable | Default | Classification |
|--------|-----------|----------|---------|----------------|
| `id` | `UUID` | NO | — | PK |
| `equipment_code` | `TEXT` | NO | — | Identity; UNIQUE |
| `equipment_name` | `TEXT` | YES | — | Display (defaults from code + type) |
| `equipment_type` | `TEXT` | NO | — | Master |
| `model` | `TEXT` | NO | — | Master |
| `asset_number` | `TEXT` | YES | — | Asset tag |
| `status` | `TEXT` | NO | — | **Lifecycle** |
| `battery_level` | `INTEGER` | YES | — | Operational; ≥20% required for assign |
| `operator_name` | `TEXT` | YES | — | Display |
| `current_location` | `TEXT` | YES | — | Display |
| `assigned_dock_id` | `UUID` | YES | — | FK |
| `assigned_vehicle_id` | `UUID` | YES | — | FK |
| `assigned_queue_entry_id` | `UUID` | YES | — | FK |
| `assigned_appointment_id` | `UUID` | YES | — | FK |
| `assigned_since` | `TIMESTAMPTZ` | YES | — | **Reporting** |
| `maintenance_due` | `DATE` | YES | — | Maintenance planning |
| `notes` | `TEXT` | YES | — | Notes |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |

### Primary Key

- `id` (`UUID`)

### Foreign Keys

| Column | References | ON DELETE |
|--------|------------|-----------|
| `assigned_dock_id` | `docks(id)` | SET NULL |
| `assigned_vehicle_id` | `vehicles(id)` | SET NULL |
| `assigned_queue_entry_id` | `queue_entries(id)` | SET NULL |
| `assigned_appointment_id` | `appointments(id)` | SET NULL |

### Referenced By

| Table | Column |
|-------|--------|
| `yard_events` | `equipment_id` |
| `docks` | `default_equipment_id` |

### Constraints

| Type | Definition |
|------|------------|
| `UNIQUE` | `equipment_code` |
| Application | `status` ∈ `EQUIPMENT_STATUSES`; transitions enforced |
| Application | `battery_level < 20` blocks assignment (409) |
| Application | Assigned equipment cannot be deleted (409) |

### Valid Status Values

`IDLE`, `ASSIGNED`, `IN_USE`, `MAINTENANCE`, `CHARGING`, `OUT_OF_SERVICE`

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `equipment_equipment_code_key` | `equipment_code` | UNIQUE (implicit) |
| `idx_equipment_code` | `equipment_code` | Lookup |
| `idx_equipment_status` | `status` | Availability, alerts |
| `idx_equipment_assigned_dock` | `assigned_dock_id` | Dock resource view |

### Reporting Usage

- `assigned_since` — usage minutes in equipment utilization report
- `battery_level` — operational health (not persisted in reports)
- Events `EQUIPMENT_ASSIGNED` / `EQUIPMENT_RELEASED` — assignment counts

---

## 3.7 yard_events

### Purpose

**Append-only audit log** and primary input for analytics, reporting, loading progress computation, and Control Tower alert derivation. Every significant workflow action creates a yard event.

### Columns

| Column | Data Type | Nullable | Default | Classification |
|--------|-----------|----------|---------|----------------|
| `id` | `UUID` | NO | — | PK |
| `vehicle_id` | `UUID` | YES | — | FK |
| `appointment_id` | `UUID` | YES | — | FK |
| `queue_entry_id` | `UUID` | YES | — | FK |
| `dock_id` | `UUID` | YES | — | FK |
| `equipment_id` | `UUID` | YES | — | FK |
| `labor_id` | `UUID` | YES | — | FK |
| `event_type` | `TEXT` | NO | — | **Audit** / **Reporting** |
| `event_time` | `TIMESTAMPTZ` | NO | — | **Audit** / **Reporting** |
| `event_note` | `TEXT` | YES | — | **Audit** |
| `created_by` | `TEXT` | NO | — | **Audit** (actor) |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** (record insert time) |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |

### Primary Key

- `id` (`UUID`)

### Foreign Keys

| Column | References | ON DELETE |
|--------|------------|-----------|
| `vehicle_id` | `vehicles(id)` | SET NULL |
| `appointment_id` | `appointments(id)` | SET NULL |
| `queue_entry_id` | `queue_entries(id)` | SET NULL |
| `dock_id` | `docks(id)` | SET NULL |
| `equipment_id` | `equipment(id)` | SET NULL |
| `labor_id` | `labor_teams(id)` | SET NULL |

### Constraints

| Type | Definition |
|------|------------|
| Application | `event_type` — one of 62 defined types (see `enums` / FRS §3.6) |
| Application | Append-only by convention — no DELETE API |

### Key Event Types (Reporting)

| Event Type | Reporting Use |
|------------|---------------|
| `VEHICLE_CHECKED_IN` | Journey milestone; wait start |
| `QUEUE_CALLED` | Staging start |
| `DOCK_ASSIGNED` / `DOCK_RELEASED` | Dock utilization windows |
| `LOADING_STARTED` / `LOADING_COMPLETED` | Service time, SLA |
| `LOADING_PAUSED` / `LOADING_RESUMED` | Paused minutes |
| `EXIT_HOLDING` / `GATE_OUT_APPROVED` | Exit delay |
| `VEHICLE_STATUS_CHANGED` | State transition audit |
| `EXCEPTION_*` | Delay analysis |
| `ZONE_VEHICLE_MOVED` | Spatial audit |

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `idx_yard_events_event_time` | `event_time DESC` | Timeline queries, report date ranges |

**Note:** No explicit indexes on `vehicle_id`, `event_type`, or `dock_id` in current schema. Reports filter in application layer after range scan on `event_time` or full list fetch.

### Reporting Usage

- Primary source for `vehicle_journey_report_service`, `operational_reports_service`
- `journey_milestone_times()` extracts check-in, loading, exit from event stream
- `loadingProgressEngine.js` reads `LOADING_STARTED` / `LOADING_COMPLETED` client-side
- `control_tower_alerts_service` uses events for stall detection

---

## 3.8 gate_verifications

### Purpose

Persists gate entry and exit checklist state per vehicle/appointment combination. Supports the 6-check entry validation and 7-check exit verification workflow in `gate_service.py`.

### Columns

| Column | Data Type | Nullable | Default | Classification |
|--------|-----------|----------|---------|----------------|
| `id` | `UUID` | NO | `gen_random_uuid()` | PK |
| `vehicle_id` | `UUID` | NO | — | FK |
| `appointment_id` | `UUID` | YES | — | FK |
| `gate_id` | `TEXT` | NO | `'G1'` | Operational |
| `gate_pass_approved` | `BOOLEAN` | NO | `FALSE` | **Lifecycle** (exit check) |
| `invoice_approved` | `BOOLEAN` | NO | `FALSE` | **Lifecycle** (exit check) |
| `security_cleared` | `BOOLEAN` | NO | `FALSE` | **Lifecycle** (exit check) |
| `vehicle_verified` | `BOOLEAN` | NO | `FALSE` | **Lifecycle** (exit check) |
| `delivery_document_verified` | `BOOLEAN` | NO | `FALSE` | **Lifecycle** (exit check) |
| `loading_completed_verified` | `BOOLEAN` | NO | `FALSE` | **Lifecycle** (exit check) |
| `appointment_completed_verified` | `BOOLEAN` | NO | `FALSE` | **Lifecycle** (exit check) |
| `entry_approved_at` | `TIMESTAMPTZ` | YES | — | **Audit** / **Reporting** |
| `entry_rejected_at` | `TIMESTAMPTZ` | YES | — | **Audit** |
| `exit_approved_at` | `TIMESTAMPTZ` | YES | — | **Audit** / **Reporting** |
| `exit_rejected_at` | `TIMESTAMPTZ` | YES | — | **Audit** |
| `verified_by` | `TEXT` | YES | — | **Audit** |
| `verified_at` | `TIMESTAMPTZ` | YES | — | **Audit** |
| `exit_remarks` | `TEXT` | YES | — | Notes |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |

### Primary Key

- `id` (`UUID`)

### Foreign Keys

| Column | References | ON DELETE |
|--------|------------|-----------|
| `vehicle_id` | `vehicles(id)` | CASCADE |
| `appointment_id` | `appointments(id)` | SET NULL |

### Constraints

| Type | Definition |
|------|------------|
| `UNIQUE` | `(vehicle_id, appointment_id)` — one verification record per pair |
| Application | All 7 exit booleans must be `TRUE` before `verify-exit` |
| Application | Entry checks validated in code (not stored as columns) |

### Entry Checks (Application-Only)

Validated at lookup/approve time, not persisted as columns:
1. `appointment_exists`
2. `appointment_active`
3. `correct_date`
4. `vehicle_match`
5. `not_checked_in`
6. `gate_open`

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `idx_gate_verifications_vehicle` | `vehicle_id` | Lookup by vehicle |

### Reporting Usage

- `entry_approved_at` — gate-in timestamp cross-check with `VEHICLE_CHECKED_IN` event
- `exit_approved_at` — gate-out latency
- `exit_rejected_at` — exception tracking

---

## 3.9 loading_operation_exceptions

### Purpose

Tracks operational exceptions during dock loading (material shortage, equipment failure, safety holds, etc.) with assignment and resolution workflow. Feeds Control Tower `LOADING_EXCEPTION` alerts and delay analysis.

### Columns

| Column | Data Type | Nullable | Default | Classification |
|--------|-----------|----------|---------|----------------|
| `id` | `UUID` | NO | — | PK |
| `vehicle_id` | `UUID` | YES | — | FK |
| `appointment_id` | `UUID` | YES | — | FK |
| `queue_entry_id` | `UUID` | YES | — | FK |
| `dock_id` | `UUID` | YES | — | FK |
| `exception_type` | `TEXT` | NO | — | **Reporting** / classification |
| `status` | `TEXT` | NO | — | **Lifecycle** |
| `description` | `TEXT` | YES | — | Notes |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |
| `created_by` | `TEXT` | NO | — | **Audit** |
| `assigned_to` | `TEXT` | YES | — | **Audit** |
| `resolved_at` | `TIMESTAMPTZ` | YES | — | **Reporting** |
| `resolved_by` | `TEXT` | YES | — | **Audit** |
| `resolution_notes` | `TEXT` | YES | — | Notes |
| `closed_at` | `TIMESTAMPTZ` | YES | — | **Reporting** |
| `closed_by` | `TEXT` | YES | — | **Audit** |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |

### Primary Key

- `id` (`UUID`)

### Foreign Keys

| Column | References | ON DELETE |
|--------|------------|-----------|
| `vehicle_id` | `vehicles(id)` | SET NULL |
| `appointment_id` | `appointments(id)` | SET NULL |
| `queue_entry_id` | `queue_entries(id)` | SET NULL |
| `dock_id` | `docks(id)` | SET NULL |

### Constraints

| Type | Definition |
|------|------------|
| `CHECK` | `status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')` |
| Application | `exception_type` ∈ `EXCEPTION_TYPES` in `loading_exceptions_service.py` |

### Valid Exception Types

`MATERIAL_SHORTAGE`, `EQUIPMENT_FAILURE`, `LABOR_DELAY`, `DOCUMENTATION_HOLD`, `SAFETY_HOLD`, `QUALITY_HOLD`, `WEATHER_DELAY`, `GENERIC_DELAY`

### Valid Status Values

`OPEN` → `IN_PROGRESS` → `RESOLVED` → `CLOSED`

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `idx_loading_exceptions_status` | `status` | Active exception queries |
| `idx_loading_exceptions_vehicle` | `vehicle_id` | Per-vehicle exceptions |
| `idx_loading_exceptions_queue` | `queue_entry_id` | Queue context |

### Reporting Usage

- Open `IN_PROGRESS` exceptions → LOADING_EXCEPTION alerts
- `resolved_at - created_at` — exception resolution time in delay analysis
- Count by `exception_type` — root cause breakdown

---

## 3.10 detention_records

### Purpose

Carrier detention charge records. Stores billing metadata, computed hours/cost, and approval workflow status. Rows may be persisted or derived at read time by `detention_service.py` from queue wait data.

### Columns

| Column | Data Type | Nullable | Default | Classification |
|--------|-----------|----------|---------|----------------|
| `id` | `UUID` | NO | — | PK |
| `detention_ref` | `TEXT` | NO | — | Identity; UNIQUE |
| `vehicle_id` | `UUID` | NO | — | FK |
| `queue_entry_id` | `UUID` | YES | — | FK |
| `appointment_id` | `UUID` | YES | — | FK |
| `billing_date` | `DATE` | NO | — | **Reporting** |
| `plate` | `TEXT` | NO | — | Display (denormalized from vehicle) |
| `category` | `TEXT` | NO | — | **Reporting** (Company/Contract/Outside) |
| `transporter` | `TEXT` | NO | — | **Reporting** |
| `free_hours` | `NUMERIC(6,2)` | NO | `2` | **Reporting**; grace period |
| `actual_hours` | `NUMERIC(6,2)` | NO | — | **Reporting**; billable wait |
| `rate` | `INTEGER` | NO | — | **Reporting**; ₹/hour |
| `cost` | `INTEGER` | NO | — | **Reporting**; total charge |
| `status` | `TEXT` | NO | `'Pending'` | **Lifecycle** |
| `remarks` | `TEXT` | YES | — | Notes |
| `is_estimated` | `BOOLEAN` | NO | `TRUE` | **Reporting**; estimate vs confirmed |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |

### Primary Key

- `id` (`UUID`)

### Foreign Keys

| Column | References | ON DELETE |
|--------|------------|-----------|
| `vehicle_id` | `vehicles(id)` | CASCADE |
| `queue_entry_id` | `queue_entries(id)` | SET NULL |
| `appointment_id` | `appointments(id)` | SET NULL |

### Constraints

| Type | Definition |
|------|------------|
| `UNIQUE` | `detention_ref` |
| Application | `status` ∈ `DETENTION_STATUSES`; `DETENTION_STATUS_TRANSITIONS` enforced |

### Valid Status Values

`Pending`, `Approved`, `Disputed`, `Paid`, `Reviewed`

### Detention Config (Application Constants)

| Parameter | Default |
|-----------|---------|
| `free_hours` | 2.0 |
| `standard_rate` | ₹1000/hr |
| `hazmat_rate` | ₹1500/hr |
| Queue display rate | ₹35/min (UI; separate from persisted rate) |

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `idx_detention_ref` | `detention_ref` | Lookup |
| `idx_detention_status` | `status` | Workflow filters |
| `idx_detention_billing_date` | `billing_date` | Date-range reports |
| `idx_detention_vehicle` | `vehicle_id` | Per-vehicle history |

### Reporting Usage

- `cost` summed for Executive KPI detention exposure
- `actual_hours - free_hours` — chargeable detention analytics
- `billing_date` — period reporting
- `status` — outstanding vs approved exposure

---

## 3.11 yard_zones

### Purpose

Master definition of yard spatial zones (gate lanes, waiting areas, loading staging, hazmat isolation, etc.). Occupancy is **derived** at query time by counting `vehicles.current_zone_id` — not stored on the zone row.

### Columns

| Column | Data Type | Nullable | Default | Classification |
|--------|-----------|----------|---------|----------------|
| `id` | `UUID` | NO | — | PK |
| `zone_code` | `TEXT` | NO | — | Identity; UNIQUE |
| `zone_name` | `TEXT` | NO | — | Display |
| `zone_type` | `TEXT` | NO | — | Master; drives auto-placement rules |
| `max_capacity` | `INTEGER` | NO | `1` | Capacity; CHECK `>= 1` |
| `status` | `TEXT` | NO | `'ACTIVE'` | **Lifecycle** |
| `description` | `TEXT` | YES | — | Notes |
| `remarks` | `TEXT` | YES | — | Notes |
| `map_code` | `TEXT` | YES | — | Layout grid (A–F) |
| `linked_dock_id` | `UUID` | YES | — | FK; optional dock link |
| `is_mandatory` | `BOOLEAN` | NO | `FALSE` | System zone flag |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** |

### Derived Fields (Not Stored)

Returned by `yard_service._enrich_zone()`:

| Field | Computation |
|-------|-------------|
| `currentOccupancy` | `COUNT(vehicles WHERE current_zone_id = zone.id)` |
| `availableSlots` | `max_capacity - currentOccupancy` |
| `occupancyPct` | `currentOccupancy / max_capacity × 100` |
| `status` (effective) | `FULL` when occupancy ≥ capacity on ACTIVE zone |

### Primary Key

- `id` (`UUID`)

### Foreign Keys

| Column | References | ON DELETE |
|--------|------------|-----------|
| `linked_dock_id` | `docks(id)` | SET NULL |

### Referenced By

| Table | Column |
|-------|--------|
| `vehicles` | `current_zone_id` |
| `vehicle_zone_history` | `previous_zone_id`, `new_zone_id` |

### Constraints

| Type | Definition |
|------|------------|
| `UNIQUE` | `zone_code` |
| `CHECK` | `max_capacity >= 1` |
| Application | `zone_type` ∈ `YARD_ZONE_TYPES` |
| Application | `status` ∈ `YARD_ZONE_STATUSES` |

### Valid Zone Types

`LOADING`, `UNLOADING`, `DOCUMENTATION`, `WAITING_AREA`, `STAGING`, `HAZMAT`, `COLD_CHAIN`, `EMERGENCY_HOLDING`, `EXIT_HOLDING`, `GATE_IN`, `GATE_OUT`, `CUSTOM`

### Valid Status Values

`ACTIVE`, `FULL` (derived), `BLOCKED`, `MAINTENANCE`

### Mandatory Zones (Seeded)

| zone_code | zone_type |
|-----------|-----------|
| `ZN-GATE-IN` | GATE_IN |
| `ZN-GATE-OUT` | GATE_OUT |
| `ZN-WAITING-AREA` | WAITING_AREA |
| `ZN-EXIT-HOLDING` | EXIT_HOLDING |

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `yard_zones_zone_code_key` | `zone_code` | UNIQUE (implicit) |
| `idx_yard_zones_code` | `zone_code` | Lookup |
| `idx_yard_zones_type` | `zone_type` | Auto-placement resolution |
| `idx_yard_zones_status` | `status` | Dashboard filters |

### Auto-Placement Mapping (`STATUS_ZONE_TYPE`)

| Vehicle Status | Target Zone Type |
|----------------|------------------|
| SCHEDULED, DRAFT, ARRIVED | GATE_IN |
| CHECKED_IN, WAITING | WAITING_AREA |
| CALLED | STAGING |
| DOCK_ASSIGNED, RESOURCE_PENDING, READY_FOR_LOADING, LOADING | LOADING |
| COMPLETED, EXIT_HOLDING | EXIT_HOLDING |
| EXIT_VERIFIED | GATE_OUT |
| EXITED, CANCELLED | (cleared) |

### Reporting Usage

- Occupancy aggregation for yard utilization KPI
- `zone_type` distribution for capacity planning

---

## 3.12 vehicle_zone_history

### Purpose

**Append-only audit log** of vehicle movements between yard zones. Created on every `move_vehicle_to_zone()` call (manual or automatic). Complements `yard_events` with structured before/after zone references.

### Columns

| Column | Data Type | Nullable | Default | Classification |
|--------|-----------|----------|---------|----------------|
| `id` | `UUID` | NO | — | PK |
| `vehicle_id` | `UUID` | NO | — | FK |
| `previous_zone_id` | `UUID` | YES | — | FK; NULL on first placement |
| `new_zone_id` | `UUID` | YES | — | FK; NULL on yard exit |
| `moved_by` | `TEXT` | NO | — | **Audit** (actor or `system`) |
| `moved_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** / **Reporting** |
| `reason` | `TEXT` | YES | — | **Audit** (e.g. status sync reason) |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | **Audit** (record insert time) |

### Primary Key

- `id` (`UUID`)

### Foreign Keys

| Column | References | ON DELETE |
|--------|------------|-----------|
| `vehicle_id` | `vehicles(id)` | CASCADE |
| `previous_zone_id` | `yard_zones(id)` | SET NULL |
| `new_zone_id` | `yard_zones(id)` | SET NULL |

### Constraints

| Type | Definition |
|------|------------|
| Application | Append-only by convention |
| Application | Paired `yard_events`: `VEHICLE_ENTERED_ZONE`, `VEHICLE_EXITED_ZONE`, `ZONE_TRANSFERRED` |

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `idx_vehicle_zone_history_vehicle` | `vehicle_id, moved_at DESC` | Vehicle movement timeline |

### API Access

- `GET /yard/vehicles/{vehicle_id}/zone-history?limit=50`
- Joined with `yard_zones` for `previous_zone_name`, `new_zone_name` in response

### Reporting Usage

- Dwell time per zone: consecutive `moved_at` deltas
- Movement audit for compliance
- Cross-reference with `vehicles.status` transitions

---

# 4. Field Classification Reference

## 4.1 Lifecycle-Related Fields

Fields that drive or reflect workflow state machines:

| Table | Lifecycle Fields |
|-------|------------------|
| `vehicles` | `status`, `current_zone_id`, `arrived_at`, `exit_holding_at`, `exit_time` |
| `appointments` | `status` |
| `queue_entries` | `status`, `checkin_time`, `called_time`, `dock_assigned_time`, `dock_id` |
| `docks` | `status`, `current_vehicle_id`, `assigned_since` |
| `labor_teams` | `status`, `assigned_*` columns, `assigned_since` |
| `equipment` | `status`, `assigned_*` columns, `assigned_since` |
| `gate_verifications` | 7 exit boolean checks, `entry_approved_at`, `exit_approved_at` |
| `loading_operation_exceptions` | `status`, `exception_type` |
| `detention_records` | `status` |
| `yard_zones` | `status` (stored + derived FULL) |

## 4.2 Audit-Related Fields

| Pattern | Tables | Columns |
|---------|--------|---------|
| Record timestamps | All business tables | `created_at`, `updated_at` |
| Actor identity | `yard_events`, exceptions, gate | `created_by`, `moved_by`, `verified_by`, `resolved_by`, `closed_by`, `exited_by` |
| Append-only logs | `yard_events`, `vehicle_zone_history` | Full rows |
| Action timestamps | gate, exceptions | `entry_approved_at`, `resolved_at`, `closed_at`, `verified_at` |

## 4.3 Reporting-Related Fields

| Domain | Key Fields | Reports / KPIs |
|--------|------------|----------------|
| Wait time | `queue_entries.checkin_time`, `called_time` | Delay analysis, SLA |
| Service time | `docks.estimated_service_time_min`, LOADING_* events | Dock utilization, loading delay |
| Turnaround | `vehicles.arrived_at`, `exit_time` | SLA compliance, journey |
| Exit delay | `vehicles.exit_holding_at` | Exit holding alert, delay analysis |
| Priority | `appointments.priority`, `queue_entries.priority_score` | Queue analytics |
| Detention | `detention_records.actual_hours`, `cost`, `billing_date` | Executive KPIs, detention module |
| Utilization | `assigned_since` on dock/labor/equipment | Productivity reports |
| Events | `yard_events.event_time`, `event_type` | All operational reports |

---

# 5. Index Summary

## 5.1 Complete Index Inventory

| Index | Table | Columns | Type |
|-------|-------|---------|------|
| `idx_vehicles_vehicle_number` | vehicles | vehicle_number | B-tree |
| `idx_vehicles_status` | vehicles | status | B-tree |
| `idx_vehicles_reference` | vehicles | vehicle_reference | B-tree |
| `idx_vehicles_current_zone` | vehicles | current_zone_id | B-tree |
| `idx_appointments_booking_reference` | appointments | booking_reference | B-tree |
| `idx_appointments_status` | appointments | status | B-tree |
| `idx_queue_entries_queue_number` | queue_entries | queue_number | B-tree |
| `idx_queue_entries_status` | queue_entries | status | B-tree |
| `idx_docks_dock_code` | docks | dock_code | B-tree |
| `idx_docks_status` | docks | status | B-tree |
| `idx_yard_events_event_time` | yard_events | event_time DESC | B-tree |
| `idx_loading_exceptions_status` | loading_operation_exceptions | status | B-tree |
| `idx_loading_exceptions_vehicle` | loading_operation_exceptions | vehicle_id | B-tree |
| `idx_loading_exceptions_queue` | loading_operation_exceptions | queue_entry_id | B-tree |
| `idx_equipment_code` | equipment | equipment_code | B-tree |
| `idx_equipment_status` | equipment | status | B-tree |
| `idx_equipment_assigned_dock` | equipment | assigned_dock_id | B-tree |
| `idx_labor_teams_code` | labor_teams | team_code | B-tree |
| `idx_labor_teams_status` | labor_teams | status | B-tree |
| `idx_labor_teams_assigned_dock` | labor_teams | assigned_dock_id | B-tree |
| `idx_labor_teams_assigned_vehicle` | labor_teams | assigned_vehicle_id | B-tree |
| `idx_labor_teams_team_type` | labor_teams | team_type | B-tree |
| `idx_labor_teams_material_type` | labor_teams | material_type | B-tree |
| `idx_detention_ref` | detention_records | detention_ref | B-tree |
| `idx_detention_status` | detention_records | status | B-tree |
| `idx_detention_billing_date` | detention_records | billing_date | B-tree |
| `idx_detention_vehicle` | detention_records | vehicle_id | B-tree |
| `idx_gate_verifications_vehicle` | gate_verifications | vehicle_id | B-tree |
| `idx_yard_zones_code` | yard_zones | zone_code | B-tree |
| `idx_yard_zones_type` | yard_zones | zone_type | B-tree |
| `idx_yard_zones_status` | yard_zones | status | B-tree |
| `idx_vehicle_zone_history_vehicle` | vehicle_zone_history | vehicle_id, moved_at DESC | B-tree composite |

## 5.2 Recommended Future Indexes

Not present in current schema but beneficial at scale:

| Suggested Index | Rationale |
|-----------------|-----------|
| `yard_events(vehicle_id, event_time DESC)` | Vehicle journey queries |
| `yard_events(event_type, event_time DESC)` | Report filtering by type |
| `queue_entries(vehicle_id)` | Active queue lookup |
| `queue_entries(dock_id)` | Dock assignment queries |
| `appointments(vehicle_id)` | Active appointment resolution |
| `appointments(booking_date)` | Daily schedule queries |

---

# 6. Auxiliary Tables

## 6.1 zone_rules

Supports zone placement validation in `yard_service.validate_zone_rules()`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `zone_type` | TEXT | Matches `yard_zones.zone_type` |
| `rule_key` | TEXT | e.g. `cargo_match`, `vehicle_status` |
| `rule_value` | TEXT | Regex or status list |
| `description` | TEXT | |
| `active` | BOOLEAN | Default TRUE |
| `created_at` | TIMESTAMPTZ | |

**Constraint:** `UNIQUE (zone_type, rule_key)`

## 6.2 status_checks

Legacy health-check table for `/api/status`. Not used in YMS operational workflow.

| Column | Type |
|--------|------|
| `id` | UUID PK |
| `client_name` | TEXT |
| `timestamp` | TIMESTAMPTZ |

---

# Appendix A — Unique Constraints Summary

| Table | Unique Column(s) |
|-------|------------------|
| vehicles | `vehicle_number`, `vehicle_reference` |
| appointments | `booking_reference` |
| queue_entries | `appointment_id`, `queue_number` |
| docks | `dock_code` |
| labor_teams | `team_code` |
| equipment | `equipment_code` |
| detention_records | `detention_ref` |
| yard_zones | `zone_code` |
| gate_verifications | `(vehicle_id, appointment_id)` |
| zone_rules | `(zone_type, rule_key)` |

---

# Appendix B — Schema Source Reference

All DDL is defined in:

```
yard_frontend/backend/db.py
  └── create_schema()     # Called on application startup via init_db()
  └── _ensure_yard_zones() # Seeds mandatory zones
  └── _seed_zone_rules()   # Seeds zone placement rules
```

To inspect live schema after deployment:

```sql
\d+ vehicles
SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;
```

---

# Conclusion

The YARD.OS database is a **single PostgreSQL instance** with 12 core business tables organized into master data, operational workflow state, and append-only audit logs. Lifecycle enforcement occurs primarily in the application layer (`yms_service`, `gate_service`, `resource_gating_service`) with the database providing referential integrity, uniqueness constraints, and targeted indexes for KPI and lookup queries.

**Key design traits:**
- UUID primary keys throughout
- Status synchronization across `vehicles`, `appointments`, and `queue_entries`
- `yard_events` as the analytics backbone
- Zone occupancy derived from `vehicles.current_zone_id`, not denormalized counters
- Idempotent schema evolution via `CREATE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`

For API and service behavior referencing these tables, see `YMS_Functional_Requirements_Specification.md` and `YMS_System_Architecture_Document.md`.
