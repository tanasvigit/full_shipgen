# Appointments — Testing Checklist

## Single entry point

- [ ] No "New Request" anywhere — global nav and TopBar show **Book Appointment**
- [ ] Appointments page has one action: **Book Appointment**
- [ ] Book Appointment opens unified 4-step modal (Request → Cargo → Schedule → Confirm)

## Improvement 1 — Appointment reference preview

- [ ] Step 4 shows **Appointment Reference (preview)** before confirm, format `APT-YYYYMMDD-###` (e.g. `APT-20260608-001`)
- [ ] Preview increments sequence for same booking date
- [ ] Confirmed appointment uses the same reference shown in preview

## Improvement 2 — Duration estimation

- [ ] Loading = 60 min, Unloading = 90 min, Transit = 30 min, Inter-Warehouse = 60 min
- [ ] Schedule step shows estimated duration and expected completion for selected slot
- [ ] Confirm step shows **Estimated Duration** and **Expected Completion** (e.g. slot 17:00 + 90 min → 18:30)
- [ ] Appointment drawer **Schedule Information** shows duration and expected completion

## Improvement 3 — Slot capacity visibility

- [ ] Schedule step shows gate capacity panel: **Current**, **After Booking**, **Available** (e.g. G1: 7/10 → 8/10, Available 2)
- [ ] Green below 80%, yellow at 80–89%, red at 90%+
- [ ] Warnings appear at 80%, 90%, 100% — booking is **not** blocked until real limit enforced elsewhere

## Improvement 4 — Material-based recommendations

- [ ] Pharma / Cold → Cold Chain dock & zone
- [ ] Chemicals / Hazmat → HAZMAT dock & zone
- [ ] Auto Parts → General dock
- [ ] Container vehicle type → Container dock & zone
- [ ] Recommendations consider material, vehicle type, and dock cargo/type support

## Improvement 5 — Recommendation explanations

- [ ] Schedule step lists reasons under dock/zone (e.g. Material Match, Labor Available, Equipment Available, Current Capacity Available)
- [ ] Confirm step shows **Why this dock?** when reasons exist

## Improvement 6 — Appointment details drawer

- [ ] Click appointment from timeline Gantt, table, or calendar opens drawer
- [ ] Sections: Appointment Information, Cargo Information, Schedule Information
- [ ] Lifecycle timeline shows DRAFT → … → EXITED with timestamps where available
- [ ] Audit history shows APPOINTMENT_CREATED, CONFIRMED, UPDATED, RESCHEDULED, CANCELLED
- [ ] Quick actions (arrive, reschedule, cancel) still work

## Improvement 7 — Timeline / card labels

- [ ] Gantt cards show appointment number (`APT-…`) or real vehicle plate — never `TBD-XXXX`
- [ ] Table vehicle column shows real plate or `—` (not TBD placeholder)
- [ ] New bookings without plate use appointment ref as vehicle number until plate assigned

## Book Appointment flow (regression)

- [ ] Step 1 — Request: type, pickup, delivery, material, priority (validation blocks continue)
- [ ] Step 2 — Cargo: vehicle type (required), quantity/weight/volume, category, remarks
- [ ] Step 3 — Schedule: date, gate, time slot, capacity panel, recommendations
- [ ] Step 4 — Review & Confirm summary before **Confirm Appointment**
- [ ] Missing mandatory fields block creation

## Appointment drawer — Arrived action

- [ ] **Arrived** visible only when status = SCHEDULED
- [ ] Clicking Arrived calls `POST /api/flow/check-in` (queue entry + `VEHICLE_CHECKED_IN` audit)
- [ ] Appointment and vehicle move to **WAITING** (virtual queue)
- [ ] Drawer refreshes; calendar/list refresh via `onUpdated` / `yms-data-changed`
- [ ] Second Arrived click shows error if queue already exists
- [ ] **Reschedule** updates date/slot/gate + `APPOINTMENT_RESCHEDULED` audit
- [ ] **Cancel** sets CANCELLED + `APPOINTMENT_CANCELLED` audit

## Downstream compatibility

- [ ] Created appointment status = SCHEDULED
- [ ] Gate check-in → queue → dock → resource gating → loading unchanged
- [ ] Vehicle auto-created when plate blank (uses appointment ref, not TBD placeholder)

## Appointment table

- [ ] Columns: Appointment, Vehicle, Vehicle Type, Priority, Date, Time Slot, Status, Recommended Dock
- [ ] Status shows backend lifecycle (SCHEDULED, WAITING, DOCK_ASSIGNED, etc.)

## Audit events

- [ ] `APPOINTMENT_CREATED` + `APPOINTMENT_CONFIRMED` on book
- [ ] `APPOINTMENT_RESCHEDULED` on date/slot change
- [ ] `APPOINTMENT_CANCELLED` on cancel
- [ ] `APPOINTMENT_UPDATED` on other field changes

## APIs

- [ ] `GET /api/appointments/{id}` loads drawer detail (existing)
- [ ] History loaded client-side from yard events filtered by appointment/vehicle id (no duplicate payload)

## Automated tests

```powershell
cd yard_frontend/backend
.\.venv\Scripts\python.exe -m pytest tests/test_appointment_audit.py -v
```

```powershell
cd yard_frontend/frontend_1
npm run build
```
