# Loading Operations — Live Integration Notes

## Data source

Active operations are queue entries with an assigned dock (`dock_id`) and status:

- `DOCK_ASSIGNED` — ready to start loading/unloading
- `LOADING` — in progress
- `COMPLETED` — shown only in “completed” filter (last 4 hours)

Joined with vehicles, appointments, docks, and yard events.

## Workflow (reuses YMS state machine)

| Action | Backend |
|--------|---------|
| Start loading / unloading | `POST /flow/vehicles/{id}/transition` → `LOADING` + `LOADING_STARTED` yard event |
| Complete | Transition → `COMPLETED` (releases dock via existing service) + `LOADING_COMPLETED` event |
| Pause / resume | `LOADING_PAUSED` / `LOADING_RESUMED` yard events |
| Exceptions | `LOADING_MATERIAL_SHORTAGE`, `LOADING_EQUIPMENT_ISSUE`, `LOADING_LABOR_UNAVAILABLE`, `LOADING_DELAY` |

Backend has no separate `UNLOADING` status; unloading is tracked via operation type + events while status remains `LOADING`.

## Progress & KPIs

- Progress and ETA are **estimated** from `dock_assigned_time` / `LOADING_STARTED` (see docksApi `estimateProgress`).
- Avg loading time uses completed operation event pairs or current active elapsed times.
- Equipment and labor are **derived** from dock code/name (same as Docks module).

## Sync

All actions call `notifyYmsDataChanged()` so Control Tower, Virtual Queue, Docks, and Gate refresh.

## Test flow

1. Gate check-in → Virtual Queue call → Docks assign vehicle.
2. Open **Loading Ops** — row appears at `DOCK_ASSIGNED`.
3. Open drawer → **Start Loading** → progress updates.
4. Report exception → appears in table.
5. **Complete** → dock releases, row leaves active list.
