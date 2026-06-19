# Dock Management — Live Integration Notes

## API layer

`docksApi.js` wraps `ymsApi`:

| Action | Backend |
|--------|---------|
| List / detail | `GET /docks`, `GET /docks/{id}` |
| Update status | `PATCH /docks/{id}` |
| Assign | `POST /flow/queue-entries/{id}/call` (if needed) + `POST /flow/queue-entries/{id}/assign-dock` |
| Release | `POST /flow/vehicles/{id}/transition` → `COMPLETED` (auto-clears dock) or manual `PATCH` |
| Start loading | Vehicle transition → `LOADING` |

## Display logic

- **DELAYED**: UI-only when occupied + estimated progress ≥ 85% (backend uses `OCCUPIED`).
- **Progress / ETA**: Estimated from `dock_assigned_time` / queue timestamps (labeled **est.**).
- **Equipment / labor**: Derived from dock code/name (placeholder until resource APIs exist).
- **Dock mix chart**: Grouped from `dock_type` + `supported_cargo_types`.
- **Heatmap**: Today's appointments by gate + live busy hour.

## Dock drawer actions

- Assign vehicle from callable queue (WAITING/CALLED, no dock)
- Start loading
- Release dock
- Set maintenance / available
- Recent yard events for the bay

## Sync

Dispatches `yms-data-changed` after assign/release/status changes (Control Tower + Virtual Queue listen).

## Prerequisites

- Docks must exist in DB (`POST /api/docks`).
- Assignment requires queue entry in **CALLED** state (UI auto-calls from WAITING).
