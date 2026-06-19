# Yard Map (live backend)

## Service

`frontend_1/src/services/yardMapApi.js`

- Fetches vehicles, appointments, queue entries, yard events, and docks (`fetchDocksBundle`)
- Derives six zones (A–F) with fixed layout capacities
- Assigns each in-yard vehicle to a zone from status, `queue_type`, shipment keywords, and dock type
- Deterministic vehicle dots (grid by sorted plate within zone)
- `filterYardMapModel` for global search (TopBar) and dock strip filtering

## Page

`frontend_1/src/pages/YardMap.jsx`

- Listens to `yms-data-changed` for refresh
- Dock tiles → `openDock`; vehicles → `openVehicle` with live IDs
- Zone filters + search; loading/error/retry states

## Assumptions

No zone table in the API. See `ASSUMPTIONS` in `yardMapApi.js`.
