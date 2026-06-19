# Dock Management — Workflow Update (Resource Gating Foundation)

## Summary

Dock Management is the operational control center for loading readiness, aligned with Labor and Equipment modules:

```
Dock Assigned + Labor Assigned + Equipment Assigned → READY_FOR_LOADING (future)
```

Appointment → Gate → Queue → Dock → Loading → Exit workflow is unchanged.

---

## 1. Database changes

Added to `docks` via `ALTER TABLE IF NOT EXISTS`:

| Column | Purpose |
|--------|---------|
| `zone` | Zone A–F |
| `max_capacity` | Maximum capacity (default 1) |
| `notes` | Remarks |
| `assigned_since` | When current vehicle assignment started |

Existing: `supported_vehicle_types`, `supported_cargo_types` (material types), `current_vehicle_id`.

Auto codes: `DK-001`, `DK-002`, … for new docks.

---

## 2. Backend API

| Endpoint | Change |
|----------|--------|
| `POST /docks` | Auto `DK-xxx` code; requires name, type, zone, vehicle/material types, capacity |
| `PATCH /docks/{id}` | Full update + `DOCK_UPDATED` / `DOCK_STATUS_CHANGED` events |
| `DELETE /docks/{id}` | 409 `"Cannot delete an active dock."` if vehicle, queue, labor, or equipment active |
| **NEW** `GET /docks/readiness/vehicle/{vehicle_id}` | `{ dockAssigned, dockId?, dockCode?, dockName?, dockStatus? }` |

### Assignment validation (`assign_dock`)

- Blocks `MAINTENANCE`, `BLOCKED`, `OUT_OF_SERVICE`, future statuses
- One active vehicle per dock
- One active queue entry per dock
- Sets `assigned_since` on assign
- `DOCK_RELEASED` on vehicle COMPLETED/EXITED

### Yard events

`DOCK_CREATED`, `DOCK_UPDATED`, `DOCK_DELETED`, `DOCK_ASSIGNED`, `DOCK_RELEASED`, `DOCK_STATUS_CHANGED`

### Future statuses (prepared, not active)

`RESOURCE_PENDING`, `READY_FOR_LOADING` in `DOCK_STATUSES_FUTURE` enum.

---

## 3. Frontend

| Component | Change |
|-----------|--------|
| `Docks.jsx` | **Create Dock** button, KPI labels, card View/Edit/Delete |
| `CreateDockDialog.jsx` | Create form with multi-select types |
| `EditDockDialog.jsx` | Edit form, code read-only |
| `DockDrawer.jsx` | Full info, Current Assignment, Resource Readiness (display-only), timeline, events |
| `docksApi.js` | `createDock`, `updateDock`, `deleteDock`, `checkDockReadiness`, `fetchResourceReadiness`, `buildDockTimeline` |

---

## 4. Workflow

1. **Create dock** → `DK-xxx`, AVAILABLE, `DOCK_CREATED`
2. **Assign queue entry** → existing flow → OCCUPIED + `assigned_since` + `DOCK_ASSIGNED`
3. **Start loading** → vehicle LOADING (unchanged)
4. **Release** → COMPLETED transition → AVAILABLE + `DOCK_RELEASED`
5. **Resource Readiness** in drawer shows dock/labor/equipment — NOT READY / READY (display only)
6. **Delete** only when fully inactive

---

## 5. Test checklist

- [ ] Create Dock button (not New Request)
- [ ] Auto DK-001 code
- [ ] Multi-select vehicle and material types
- [ ] Edit / delete with active-dock guard
- [ ] Assign queue → validation on MAINTENANCE dock
- [ ] Drawer: assignment section, readiness, timeline, events
- [ ] `GET /docks/readiness/vehicle/{id}`
- [ ] KPI cards unchanged in behavior
- [ ] `yms-data-changed` refresh

## Deploy

```bash
cd yard_frontend && docker compose up -d --build
cd frontend_1 && npm run build
```
