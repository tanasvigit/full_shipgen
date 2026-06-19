# Labor Management — Workflow Update (Team Registry + Resource Gating Foundation)

## Summary

Labor Management is a team registry and assignment system preparing for resource gating:

```
Dock Assigned + Labor Assigned + Equipment Assigned → READY_FOR_LOADING (future)
```

Vehicle flow (appointment → gate → queue → dock → loading → exit) is unchanged.

---

## 1. Database changes (backward-compatible)

Added to `labor_teams` via `ALTER TABLE IF NOT EXISTS` in `db.py`:

| Column | Type | Purpose |
|--------|------|---------|
| `supervisor_phone` | TEXT | Supervisor contact |
| `team_type` | TEXT | Legacy alias; kept for seed/backfill |
| `material_type` | TEXT DEFAULT 'GENERAL' | Cargo/material handling type (11 values) |
| `skills` | TEXT[] | Legacy column; no longer used in UI |
| `assigned_since` | TIMESTAMPTZ | When current assignment started |
| `assigned_queue_entry_id` | UUID FK | Queue-target assignment |

**Team codes:** New teams receive auto-generated codes (`LT001`, `LT002`, …). Legacy seed codes (e.g. `T-A`) remain valid.

**Material type values:** GENERAL, BAGS, PALLETS, STEEL, CEMENT, CHEMICALS, HAZMAT, PHARMA, COLD_CHAIN, CONTAINERS, CUSTOM.

---

## 2. Backend API changes

| Endpoint | Change |
|----------|--------|
| `POST /labor` | No `team_code` in body — auto-generated. Requires `supervisor_name`, `supervisor_phone`, `material_type`. Default status `ON_DUTY`. |
| `PATCH /labor/{id}` | Update name, supervisor, shift, members, `material_type`, status, remarks (`notes`). Logs `TEAM_UPDATED`. |
| `DELETE /labor/{id}` | Deletes team if unassigned. 409: `"Cannot delete a team that is currently assigned."` |
| `POST /labor/{id}/assign` | Sets `assigned_since`, status `ASSIGNED`; single active dock/vehicle assignment enforced |
| `POST /labor/{id}/release` | Clears assignments; logs `TEAM_RELEASED` |
| `GET /labor/readiness/vehicle/{vehicle_id}` | Returns `{ laborAssigned, teamId?, teamName? }` or `{ laborAssigned: false }` |

### Assignment validation (backend)

- Team cannot move to a **different** dock or vehicle without release first (409).
- Only one team per vehicle when status ASSIGNED (409).
- Only one team per dock (existing behavior).

### Yard audit events

| Event | When |
|-------|------|
| `TEAM_CREATED` | Create team |
| `TEAM_UPDATED` | PATCH team |
| `TEAM_DELETED` | Delete team |
| `TEAM_ASSIGNED` | Assign to dock/vehicle/queue |
| `TEAM_RELEASED` | Release |
| `TEAM_STATUS_CHANGED` | Status transitions (on/off duty, break, unavailable, etc.) |

Each event stores `team_id` (labor_id), timestamp, user (`created_by`), and remarks (`event_note`).

---

## 3. Frontend changes

| Area | Change |
|------|--------|
| Labor page | **Create Team** button (replaces default TopBar New Request) |
| `CreateTeamDialog` | Team name, supervisor, shift, members, material type, status — no team code, no skills |
| `EditTeamDialog` | Edit all roster fields + remarks |
| Row actions | View details, Edit, Delete on each team row |
| KPI cards | Total Workforce, Available Workforce, Assigned Teams, Teams On Break, Teams Available, **Teams Off Duty** + existing util/working cards |
| `LaborDrawer` | Team name, auto code, material type, supervisor, shift, assignment block, activity history |
| `laborApi.js` | `createTeam`, `updateTeam`, `deleteTeam`, `checkLaborReadiness`, `LABOR_MATERIAL_TYPES` |

---

## 4. Updated workflow

1. **Create team** — Operator clicks Create Team → fills form → backend assigns `LTxxx` code → `TEAM_CREATED` event → team appears ON_DUTY (or chosen status).
2. **Edit team** — Row Edit or drawer → update roster/material type/status/remarks → `TEAM_UPDATED`.
3. **Assign** — Drawer assign to dock or vehicle → status `ASSIGNED`, `assigned_since` set → `TEAM_ASSIGNED`. One active assignment at a time.
4. **Release** — After work completes → Release → `TEAM_RELEASED`, counts restored.
5. **Delete** — Only when not assigned to dock or vehicle → `TEAM_DELETED`. Assigned teams show error toast.
6. **Readiness check** — `checkLaborReadiness(vehicle_id)` for future resource gating (not wired to loading gate yet).

---

## 5. Test checklist

### Create team
- [ ] Open `/labor` → **Create Team** (not New Request)
- [ ] Submit without team code → team created with auto code LT001/LT002…
- [ ] Required fields validated (name, supervisor, phone, shift, members, material type)
- [ ] Default status ON_DUTY
- [ ] `TEAM_CREATED` yard event logged

### Edit / delete
- [ ] Edit team from row action → changes persist
- [ ] Delete unassigned team → removed, `TEAM_DELETED` event
- [ ] Delete assigned team → 409 toast: "Cannot delete a team that is currently assigned."

### Assignment
- [ ] Assign team to dock → ASSIGNED, `assigned_since` set, `TEAM_ASSIGNED`
- [ ] Assign same team to different dock without release → 409
- [ ] Assign team to vehicle → works; second team on same vehicle → 409
- [ ] Release → `TEAM_RELEASED`, assignment cleared

### Drawer & KPIs
- [ ] View details shows code, material type, dock/vehicle, assigned since, events
- [ ] KPI cards include Teams Off Duty and existing metrics

### Readiness (prep only)
- [ ] `GET /labor/readiness/vehicle/{id}` returns `laborAssigned: true` when team on vehicle or dock via queue
- [ ] Returns `laborAssigned: false` when no team linked

### Sync
- [ ] `yms-data-changed` refreshes Labor page after mutations
- [ ] RBAC: labor write permission required for create/edit/delete/assign

---

## Deploy

After pulling changes:

```bash
cd yard_frontend
docker compose up -d --build
```

Frontend build: `cd frontend_1 && npm run build`
