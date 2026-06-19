# Equipment Management — Workflow Update (Resource Gating Foundation)

## Summary

Equipment Management is aligned with Labor Management for future resource gating:

```
Dock Assigned + Labor Assigned + Equipment Assigned → READY_FOR_LOADING (future)
```

Vehicle flow and existing assignment APIs are unchanged.

---

## 1. Database changes (backward-compatible)

Added to `equipment` via `ALTER TABLE IF NOT EXISTS` in `db.py`:

| Column | Type | Purpose |
|--------|------|---------|
| `equipment_name` | TEXT | Display name (backfilled from code + type) |
| `asset_number` | TEXT | Registration / asset number |
| `assigned_since` | TIMESTAMPTZ | When current assignment started |
| `assigned_queue_entry_id` | UUID FK | Queue-target assignment (future) |

**Equipment codes:** New units receive auto-generated codes (`EQ-001`, `EQ-002`, …). Legacy seed codes (e.g. `EQ-101`) remain valid.

**Equipment types:** FORKLIFT, CRANE, REACH_STACKER, PALLET_JACK, HAND_TRUCK, CONVEYOR, LOADER, STACKER, CUSTOM.

---

## 2. Backend API changes

| Endpoint | Change |
|----------|--------|
| `POST /equipment` | No `equipment_code` in body — auto-generated. Requires `equipment_name`, `equipment_type`. Default status `IDLE`. |
| `PATCH /equipment/{id}` | Update name, type, model, asset, operator, location, battery, status, remarks. Logs `EQUIPMENT_UPDATED`. |
| `DELETE /equipment/{id}` | 409 if assigned or IN_USE/ASSIGNED: `"Cannot delete equipment while assigned or in use."` |
| `POST /equipment/{id}/assign` | Sets `assigned_since`; supports `queue_entry_id`; single active assignment enforced |
| `POST /equipment/{id}/release` | Clears assignments + `assigned_since`; logs `EQUIPMENT_RELEASED` |
| **NEW** `GET /equipment/readiness/vehicle/{vehicle_id}` | Returns `{ equipmentAssigned, equipmentId?, equipmentCode?, equipmentName? }` |

### Assignment validation (backend)

- Cannot assign to a **different** dock/vehicle without release first (409).
- Only one equipment unit per vehicle when ASSIGNED/IN_USE (409).
- One equipment per dock (existing — other units released from dock).
- Battery minimum 20% for assignment (unchanged).

### Yard audit events

| Event | When |
|-------|------|
| `EQUIPMENT_CREATED` | Create equipment |
| `EQUIPMENT_UPDATED` | PATCH equipment |
| `EQUIPMENT_DELETED` | Delete equipment |
| `EQUIPMENT_ASSIGNED` | Assign to dock/vehicle/queue |
| `EQUIPMENT_RELEASED` | Release / mark idle |
| `EQUIPMENT_STATUS_CHANGED` | Status transitions (maintenance, charging, in use, etc.) |

---

## 3. Frontend changes

| Area | Change |
|------|--------|
| Equipment page | **Add Equipment** button (replaces default TopBar New Request) |
| `AddEquipmentDialog` | Full create form — no equipment code |
| `EditEquipmentDialog` | Edit roster fields + remarks; code read-only |
| Card actions | View, Edit, Delete on each equipment card |
| KPI cards | Total, Available, Assigned, In Use, Charging, Maintenance, Out Of Service, Avg Battery % |
| `EquipmentDrawer` | Name, code, type, model, asset, operator, battery, assignment block, dock/vehicle/queue assign, yard events |
| `equipmentApi.js` | `createEquipment`, `updateEquipment`, `deleteEquipment`, `checkEquipmentReadiness`, KPI helper |

---

## 4. Updated workflow

1. **Add equipment** → form → `EQ-xxx` assigned → `EQUIPMENT_CREATED` → status IDLE (default).
2. **Edit** → PATCH → `EQUIPMENT_UPDATED` (+ `EQUIPMENT_STATUS_CHANGED` if status changed).
3. **Assign** → dock, vehicle, or queue entry → ASSIGNED (or IN_USE if configured) → `assigned_since` set → `EQUIPMENT_ASSIGNED`.
4. **Mark in use** → IN_USE (from ASSIGNED).
5. **Release** → IDLE → `EQUIPMENT_RELEASED`.
6. **Maintenance / Charging** → existing shortcuts preserved.
7. **Delete** → only when unassigned and not ASSIGNED/IN_USE.
8. **Readiness** → `checkEquipmentReadiness(vehicle_id)` for future gating (not wired to loading yet).

---

## 5. Test checklist

### Add equipment
- [ ] Open `/equipment` → **Add Equipment** (not New Request)
- [ ] Submit without code → receives EQ-001 style code
- [ ] Required: equipment name, type, status
- [ ] `EQUIPMENT_CREATED` yard event logged

### Edit / delete
- [ ] Edit from card action → changes persist
- [ ] Delete idle unassigned unit → success + `EQUIPMENT_DELETED`
- [ ] Delete assigned or IN_USE → 409 toast with exact message

### Assignment lifecycle
- [ ] Assign to dock → ASSIGNED, `assigned_since` set
- [ ] Reassign to different dock without release → 409
- [ ] Mark in use → IN_USE
- [ ] Release → IDLE, assignment cleared
- [ ] Maintenance / Charging workflows still work

### Drawer & KPIs
- [ ] Drawer shows code, name, type, dock/vehicle, assigned since, events
- [ ] All 8 KPI cards reflect live counts

### Readiness (prep only)
- [ ] `GET /equipment/readiness/vehicle/{id}` returns correct shape

### Sync
- [ ] `yms-data-changed` refreshes Equipment page after mutations
- [ ] RBAC: equipment write permission for create/edit/delete/assign

---

## Deploy

```bash
cd yard_frontend
docker compose up -d --build
cd frontend_1 && npm run build
```
