# Equipment module (live backend)

## Backend

- Table: `equipment` (seeded on first init with 8 units)
- Statuses: `IDLE`, `ASSIGNED`, `IN_USE`, `MAINTENANCE`, `CHARGING`, `OUT_OF_SERVICE`
- Routes under `/api/equipment` (CRUD, status, assign, release, in-use, idle, maintenance, charging)
- Yard events include `equipment_id`; types such as `EQUIPMENT_CREATED`, `EQUIPMENT_ASSIGNED`, `EQUIPMENT_RELEASED`, etc.
- Assign blocked when `battery_level` &lt; 20%

## Frontend

- `src/services/equipmentApi.js` — bundle, mapping, actions, `notifyYmsDataChanged`
- `src/pages/Equipment.jsx` — live list, filters, drawer on card click
- `src/components/yms/EquipmentDrawer.jsx` — assign/release, maintenance, charging, operator/location
- Docks & Loading Ops resolve equipment via `assigned_dock_id` / `assigned_vehicle_id`; fallback label remains hash-derived if none assigned

## Verify

1. Restart API so `init_db` runs migrations: `docker compose up -d --build` from `yard_frontend`
2. Open Equipment → cards from API; open drawer → assign to dock
3. Docks / Loading Ops refresh and show assigned equipment code
