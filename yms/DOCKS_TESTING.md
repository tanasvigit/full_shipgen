# Dock Management — Assignment Bridge Testing Checklist

## Vehicles Awaiting Dock Assignment panel

- [ ] Dock Management shows **Vehicles Awaiting Dock Assignment** after call-in
- [ ] Columns: Appointment, Queue, Vehicle, Material, Vehicle Type, Priority, Rec. Dock, Waiting, Status
- [ ] Only **CALLED / REPORTING_TO_DOCK** vehicles without dock appear
- [ ] **Assign Dock** opens assignment dialog

## Auto dock recommendation

- [ ] After **Call In**, `DOCK_RECOMMENDED` yard event is created
- [ ] Panel shows recommended dock code and score
- [ ] Reasons include Material Match, Dock Available, Capacity Available (when applicable)

## Assign Dock workflow

- [ ] **Assign Recommended Dock** assigns via `POST /flow/queue-entries/{id}/assign-dock`
- [ ] **Choose Different Dock** lists only AVAILABLE assignable bays
- [ ] On success: vehicle **DOCK_ASSIGNED**, queue **DOCK_ASSIGNED**, dock **OCCUPIED**
- [ ] Vehicle leaves STAGING and enters loading/unloading zone
- [ ] `DOCK_ASSIGNED` audit event recorded

## Resource readiness integration

- [ ] After assign, status becomes **RESOURCE_PENDING** or **READY_FOR_LOADING**
- [ ] Dock drawer shows Resource Readiness panel
- [ ] Start Loading blocked until all resources ready

## Dock drawer

- [ ] Current Assignment shows vehicle, queue, appointment, material, vehicle type
- [ ] Assigned since, expected completion, current stage visible
- [ ] Dock Assignment Lifecycle timeline: STAGING → … → COMPLETED

## Capacity enforcement

- [ ] Assign to MAINTENANCE/BLOCKED dock fails: "Dock cannot accept additional vehicles."
- [ ] Full capacity dock fails with `DOCK_CAPACITY_BLOCKED` event

## Create dock

- [ ] New fields: Default Labor Team, Default Equipment, Estimated Service Time
- [ ] Supported material/vehicle types unchanged

## Regression

- [ ] Appointment → Queue → Call In flow unchanged
- [ ] Resource gating on Start Loading unchanged
- [ ] Release dock / maintenance actions unchanged

## Automated tests

```powershell
cd yard_frontend/backend
.\.venv\Scripts\python.exe -m pytest tests/test_dock_assignment.py tests/test_queue_service.py -v
```

```powershell
cd yard_frontend/frontend_1
npm run build
```
