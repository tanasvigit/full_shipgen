# Labor module (live backend)

## Backend

- Table: `labor_teams` (seeded with 6 teams on first init)
- Statuses: `ON_DUTY`, `OFF_DUTY`, `ASSIGNED`, `AVAILABLE`, `BREAK`, `UNAVAILABLE`
- Routes under `/api/labor` (CRUD, status, assign, release, on-duty, off-duty, break, break-end, unavailable)
- `yard_events.labor_id` for `LABOR_CREATED`, `LABOR_ASSIGNED`, `LABOR_RELEASED`, etc.

## Frontend

- `src/services/laborApi.js` — mapping, utilization (`assigned_count / members_count`), sync via `notifyYmsDataChanged`
- `src/pages/Labor.jsx` — live table, KPIs, filters, drawer on row click
- `src/components/yms/LaborDrawer.jsx` — assign/release, duty/break/unavailable, events
- Docks & Loading Ops use `resolveLaborLabel()` with hash fallback

## Verify

1. Restart API: `docker compose up -d --build` from `yard_frontend`
2. Open Labor → teams from API; assign team to dock
3. Docks / Loading Ops show assigned team name
