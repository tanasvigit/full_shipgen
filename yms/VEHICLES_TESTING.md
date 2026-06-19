# Vehicles Module — Testing Guide

## Overview

Vehicles is now a **Vehicle Registry + Journey Tracking** module wired to live YMS APIs.

## Schema Changes

New `vehicles` columns (auto-migrated via `db.py`):

| Column | Type | Notes |
|--------|------|-------|
| `vehicle_reference` | TEXT UNIQUE | Auto `VEH-YYYYMMDD-XXX` |
| `display_name` | TEXT | UI label |
| `operation_type` | TEXT | Loading, Unloading, Transit, Inter-Warehouse |
| `material_type` | TEXT | DOCK_MATERIAL_TYPES codes |
| `expected_arrival` | TIMESTAMPTZ | Optional |
| `remarks` | TEXT | Optional |
| `registration_source` | TEXT | `appointment` \| `manual` |
| `driver_name`, `driver_phone` | nullable | Optional on manual register |

## API Changes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/vehicles` | Creates vehicle + `vehicle_reference` |
| GET | `/api/vehicles/{id}/journey` | Full journey bundle |

Existing endpoints unchanged.

## Backward Compatibility

- Appointment booking still creates vehicles via `POST /vehicles` (now with `registration_source: appointment`).
- Queue, dock, labor, equipment, loading ops integrations unchanged.
- Legacy vehicles without `vehicle_reference` show `—` until re-created; migrations add defaults for new columns.
- `vehicle_type` must be YMS codes (`TRUCK`, `TRAILER`, …); appointment flow normalizes types.

## Manual Test Cases

### 1. Vehicle Registry Table

1. Open **Vehicles** (`/vehicles`).
2. Confirm live data loads (not mock `VEH-1000` rows).
3. Verify columns: Plate, Reference, Vehicle Type, Category, Transporter, Driver, Phone, Material, Operation, Current Stage, Status, Last Updated.
4. Filter by Company / Contract / Outside.
5. Global search by plate or reference.

### 2. Manual Registration

1. Click **Register Vehicle**.
2. Fill plate, transporter, vehicle type, category, operation, material.
3. Submit → toast shows `VEH-YYYYMMDD-XXX`.
4. New row appears in table with stage **Scheduled**.

### 3. Appointment-Created Vehicle

1. Book appointment via **Appointments → Book Slot**.
2. Open **Vehicles** → find plate with `registration_source` appointment (reference auto-generated).
3. Current stage derives from reporting time (Scheduled / En Route / Approaching).

### 4. Vehicle Drawer — Journey

1. Click any vehicle row.
2. Verify sections:
   - **A** Vehicle Information
   - **B** Current Status
   - **C** Vehicle Journey (timestamps)
   - **D** Resource Readiness
   - **E** Loading Operations (when applicable)
   - **F** Audit History
3. Open from **Virtual Queue** → queue metrics + Call In still work.

### 5. Stage Quick Actions

| Stage | Expected actions |
|-------|------------------|
| Approaching | Mark Arrived |
| Waiting | View Queue, Call In |
| Called | View Dock Assignment |
| Dock Assigned | View Dock |
| Resource Pending | Assign Labor, Assign Equipment |
| Ready For Loading | Start Loading |
| Loading | View Loading Operation |
| Completed | View History |

### 6. Integration Validation

| Module | Link |
|--------|------|
| Appointments | `appointment.vehicle_id`, drawer View Appointment |
| Gate | Check-in → stage Checked In / Waiting |
| Virtual Queue | `queue_entry.vehicle_id`, Call In |
| Docks | `dock.current_vehicle_id`, View Dock |
| Labor / Equipment | `assigned_vehicle_id`, readiness panel |
| Loading Ops | LOADING_STARTED / progress in section E |

## Automated Tests

```powershell
cd yard_frontend/backend
.\.venv\Scripts\python.exe -m pytest tests/test_vehicles_registry.py -v
```

## Screenshots Summary (expected UI)

1. **Vehicles page** — KPI cards, category tabs, 12-column operational table.
2. **Register Vehicle dialog** — YMS fields only (no VIN/make/model).
3. **Vehicle drawer** — dark header with reference + plate; six labeled sections; stage-aware quick actions.
