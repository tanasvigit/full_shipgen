# Yard Control — Testing Checklist

Operational yard module: zone master, capacity enforcement, movement tracking, rules engine, exit holding workflow.

## Prerequisites

- Backend running (`yard_frontend` API on port 8001)
- Database migrated (`create_schema` seeds mandatory zones when empty)
- Logged in as user with `PERM_YARD_ZONE_WRITE` (admin, operations, gate, supervisor)

## Zone Master CRUD

- [ ] **Create Zone** — Yard Control → Create Zone → fill name, type, capacity, status → saves with auto `ZN-xxx` code
- [ ] **List zones** — `GET /api/yard/zones` returns enriched occupancy fields
- [ ] **View zone** — Click map zone or operational chip → Zone Drawer shows capacity, vehicles, activity
- [ ] **Edit zone** — Edit Zone dialog updates name, capacity, status; emits `ZONE_UPDATED`
- [ ] **Delete zone** — Custom zone with no vehicles/queue/dock deletes successfully
- [ ] **Delete blocked** — Zone with vehicles inside returns HTTP 409
- [ ] **Mandatory zones** — Gate In, Gate Out, Waiting Area, Exit Holding cannot be deleted

## Occupancy Dashboard

- [ ] KPI row shows: Total Zones, Active, Blocked, Full, Total Capacity, Occupancy, Available Slots, Yard Utilization %
- [ ] Values match sum of zone master records

## Capacity Enforcement

- [ ] Fill a zone to `max_capacity` via check-ins or `POST /api/yard/move-vehicle/{id}`
- [ ] Next move without skip returns HTTP 409 `ZONE_CAPACITY_EXCEEDED`
- [ ] Yard event `ZONE_CAPACITY_EXCEEDED` logged

## Zone Rules Engine

- [ ] Hazmat cargo vehicle blocked from non-HAZMAT zone (manual move)
- [ ] Cold chain cargo blocked from non-COLD_CHAIN zone
- [ ] Event `ZONE_RULE_VIOLATION` logged on block

## Flow Integration (preserve existing workflow)

- [ ] **Gate check-in** → vehicle moves to Waiting Area (+ cargo routing to D/E if applicable)
- [ ] **Call from queue** → vehicle moves to Staging
- [ ] **Dock assign** → vehicle moves to Loading or Unloading map zone
- [ ] **Loading complete** → vehicle moves to Exit Holding (does not disappear)
- [ ] **Exit** → vehicle moves to Gate Out; `current_zone_id` cleared

## Vehicle Movement

- [ ] `vehicle_zone_history` records previous/new zone, moved_by, reason, timestamp
- [ ] Events: `VEHICLE_ENTERED_ZONE`, `VEHICLE_EXITED_ZONE`, `ZONE_TRANSFERRED`

## Vehicle Drawer

- [ ] Yard Journey timeline shows Gate In → Documentation → Queue → Dock → Loading → Exit Holding → Gate Out → Exited with timestamps when data exists
- [ ] Quick actions: View Appointment, View Dock, Loading Op, Audit History

## Map Visualization

- [ ] Map zones A–F use DB capacity and occupancy
- [ ] Operational zone chips (Gate In, Waiting, Exit Holding, Gate Out) show live counts
- [ ] Unassigned vehicles fall back to derived placement (backward compatible)

## Audit Events

Verify in yard events feed:

- [ ] `ZONE_CREATED`, `ZONE_UPDATED`, `ZONE_DELETED`, `ZONE_STATUS_CHANGED`
- [ ] `VEHICLE_ENTERED_ZONE`, `VEHICLE_EXITED_ZONE`, `ZONE_TRANSFERRED`
- [ ] `ZONE_CAPACITY_EXCEEDED`, `ZONE_RULE_VIOLATION`

## Automated Tests

```powershell
cd yard_frontend/backend
.\.venv\Scripts\python.exe -m pytest tests/test_yard_zones.py tests/test_resource_gating.py -v
```

## Frontend Build

```powershell
cd yard_frontend/frontend_1
npm run build
```
