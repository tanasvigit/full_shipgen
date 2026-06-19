# Route Inventory — Smart Yard / YMS

## Frontend routes (React Router)

Defined in `frontend_1/src/App.js`. Layout: `AppLayout` (TopNav, drawers, `AuthProvider`).

| Path | Page | Data mode | Auto-refresh | `yms-data-changed` |
|------|------|-----------|--------------|---------------------|
| `/` | `Dashboard.jsx` (Control Tower) | **Live** | 30s (pausable) | Yes |
| `/appointments` | `Appointments.jsx` | **Live** | Manual | Yes |
| `/gate` | `Gate.jsx` | **Live** | Manual | Yes |
| `/queue` | `VirtualQueue.jsx` | **Live** | Manual | Yes |
| `/yard` | `YardMap.jsx` | **Live** (derived zones) | Manual | Yes |
| `/docks` | `Docks.jsx` | **Live** | Manual | Yes |
| `/vehicles` | `Vehicles.jsx` | **Mock** (`db.js`) | No | No |
| `/loading` | `LoadingOps.jsx` | **Live** | Manual | Yes |
| `/detention` | `Detention.jsx` | **Live** | 30s + manual | Yes |
| `/equipment` | `Equipment.jsx` | **Live** | Manual | Yes |
| `/labor` | `Labor.jsx` | **Live** | Manual | Yes |
| `/ai` | `AiInsights.jsx` | **Mock** (`db.js`) | No | No |
| `/kpis` | `Kpis.jsx` | **Live** | 30s + manual | Yes |

**Global UI (not routes):**

- TopBar search + `JumpToResults` → `GET /api/search` (**live**)
- Drawers: Vehicle, Appointment, Dock, Loading Op, Equipment, Labor, Detention, Book Slot
- `VehicleDrawer` loads live API when opened from queue/appointment context

---

## Backend routes (FastAPI `/api`)

| Area | Prefix / path | Live | Notes |
|------|---------------|------|--------|
| Root | `GET /` | Yes | Health message |
| Status | `/status` | Yes | Legacy demo |
| Auth | `/auth/*` | Yes | RBAC metadata |
| Search | `/search` | Yes | Global search |
| Vehicles | `/vehicles` | Yes | |
| Appointments | `/appointments` | Yes | |
| Queue | `/queue-entries` | Yes | |
| Docks | `/docks` | Yes | |
| Yard events | `/yard-events` | Yes | |
| Flow | `/flow/*` | Yes | Check-in, call, assign, transition |
| Detention | `/detention` | Yes | |
| Equipment | `/equipment` | Yes | |
| Labor | `/labor` | Yes | |

**Deferred / absent backend routes:**

- `/vehicles` UI aggregate (frontend mock page only)
- `/ai`, `/insights`, ML inference
- `/control-tower`, `/executive-kpis` aggregates
- `/zones`, GIS, containers, customs, ports, freight, vendors
- WebSocket / SSE streams

Full method list: `docs/API_INVENTORY.md`.

---

## Mock-only vs live (quick reference)

| Surface | Mock | Live |
|---------|------|------|
| Frontend `/vehicles` | ✓ | |
| Frontend `/ai` | ✓ | |
| All other listed frontend routes | | ✓ |
| Jump-to search | | ✓ |
| Daily report KPI section | | ✓ (via `executiveKpisApi`) |
| Daily report company header | ✓ (`COMPANY` in db.js) | |
| `useEventFeed` hook | ✓ (unused) | |

---

## Permission-sensitive backend routes

All **POST**, **PATCH**, **DELETE** on YMS entities and `/flow/*` require role permissions (see `API_INVENTORY.md`). **GET** list/detail endpoints are generally unguarded for read access.

Test read-only: set `X-YMS-Role: read_only` or use TopNav role switcher → mutations return **403**.
