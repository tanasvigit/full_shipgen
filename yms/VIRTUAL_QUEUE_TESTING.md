# Virtual Queue — Testing Checklist

## UI Simplifications

- [ ] Priority formula code block removed; **Queue Priority Engine** summary shown instead
- [ ] Drag-to-reorder removed; **Override** opens supervisor dialog (name + reason required)
- [ ] Message and Documents buttons removed from vehicle drawer footer

## Queue Statuses (display)

Verify StatusPill shows derived statuses:

- [ ] WAITING
- [ ] READY_TO_CALL (top ranks, high score)
- [ ] CALLED / REPORTING_TO_DOCK
- [ ] DOCK_ASSIGNED
- [ ] RESOURCE_PENDING
- [ ] READY_FOR_LOADING

## Risk Indicators (table)

- [ ] Waiting time (minutes)
- [ ] Queue rank
- [ ] Priority score
- [ ] Detention cost (₹)
- [ ] Detention risk: LOW / MEDIUM / HIGH / CRITICAL
- [ ] Queue aging: NORMAL / WARNING / CRITICAL

## Vehicle Drawer

- [ ] **Current Assignment** — dock, labor, equipment, assigned since
- [ ] **Resource Readiness** — dock/labor/equipment + READY_FOR_LOADING state
- [ ] **Queue Metrics** — rank, score, wait, detention, expected call
- [ ] **Vehicle Lifecycle** — full 13-step timeline with timestamps
- [ ] **Recommended Dock** — code, reason, material/labor/equipment flags
- [ ] Quick actions: Appointment, Vehicle, Queue Entry, Dock, Loading Op, Audit

## Supervisor Override

- [ ] Override without reason → rejected
- [ ] Valid override → rank changes, `QUEUE_OVERRIDE` + `QUEUE_PRIORITY_CHANGED` events

## Audit Events

- [ ] `QUEUE_CALLED` on call-in
- [ ] `QUEUE_OVERRIDE` on supervisor reorder
- [ ] `QUEUE_PRIORITY_CHANGED` when scores update
- [ ] `QUEUE_DELAY_WARNING` after 45+ min wait (once per 30 min)
- [ ] `QUEUE_CRITICAL_WAIT` after 90+ min wait

## APIs

- [ ] `GET /api/queue/bundle`
- [ ] `GET /api/queue/entries/{id}/detail`
- [ ] `POST /api/queue/entries/{id}/override`

## Automated Tests

```powershell
cd yard_frontend/backend
.\.venv\Scripts\python.exe -m pytest tests/test_queue_service.py -v
```

## Frontend Build

```powershell
cd yard_frontend/frontend_1
npm run build
```
