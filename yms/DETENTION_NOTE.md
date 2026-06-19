# Detention module (live)

## Backend

- Table: `detention_records` — persisted workflow (status, remarks) with derived cost fields
- Formula: `(actual_hours - free_hours) × rate` (config in `detention_service.DETENTION_CONFIG`)
- Rates: standard ₹1000/hr, hazmat ₹1500/hr, outside +15%, company −15%
- Wait derived from `queue_entries.checkin_time` and yard events / vehicle status
- APIs: `GET /api/detention` (records + summary + config), `GET /api/detention/{id}`, `PATCH /api/detention/{id}/status`
- Yard events: `DETENTION_APPROVED`, `DETENTION_DISPUTED`, `DETENTION_PAID`, `DETENTION_REVIEWED`

## Frontend

- `detentionApi.js` — bundle fetch, filters, export rows, approve/dispute/review/paid
- `Detention.jsx` — live KPIs, formula, chart, table, filters, export (CSV/PDF via ExportMenu)
- `DetentionDrawer.jsx` — detail, formula, actions, invoice JSON payload
- Refreshes on `yms-data-changed`

## Verify

Restart API from `yard_frontend`: `docker compose up -d --build`

Open **Reports → Detention** after vehicles have waited past free hours (check-in + 2h+).
