# Project Changes Log

Summary of work done after initial project setup (local Docker stack, YMS + Parking modules).  
**Environment:** Console `http://localhost:5173` · API `http://localhost:8000`

---

## 1. Parking Management — Exit Vehicle (PMS)

### Problem
Operators could create entry tickets but had no dedicated screen to process vehicle **exit** from the embedded Shipgen console.

### Solution
Added a full **Exit Vehicle** operator flow wired to the existing backend `POST /tickets/{id}/exit` API.

| File | Change |
|------|--------|
| `Parking management/frontend/src/pages/operator/ExitVehiclePage.tsx` | **New** — search active tickets, **Exit Vehicle** button, success/error handling |
| `Parking management/frontend/src/api/tickets.ts` | Added `exitTicket()` → `POST /tickets/{id}/exit` |
| `Parking management/frontend/src/ParkingAppRoutes.tsx` | Route `/operator/exit-vehicle` |
| `Parking management/frontend/src/config/navigation.ts` | Sidebar item **Exit Vehicle** (operator nav) |
| `Parking management/frontend/src/components/layout/Sidebar.tsx` | Icon + nav entry for Exit Vehicle |
| `Parking management/frontend/src/pages/operator/OperatorDashboard.tsx` | Quick-action shortcut to Exit Vehicle |
| `frontend/src/lib/parkingSidebar.js` | Permission map: `/parking/operator/exit-vehicle` → `vehicle.search` |
| `frontend/src/components/console/Sidebar.jsx` | **Operations → Exit Vehicle** in embedded console; imported `LogOut` from `lucide-react` |

### Bug fix (console startup)
| File | Change |
|------|--------|
| `frontend/src/components/console/Sidebar.jsx` | Added missing `LogOut` import — fixed `Uncaught ReferenceError: LogOut is not defined` and app stuck on **Starting up…** |

### Deploy note
Docker frontend serves a **built** bundle. After UI changes:

```bash
docker compose build frontend
docker compose up -d frontend
```

Or build locally and copy `frontend/dist` into the container (used when Docker Hub was unreachable).

---

## 2. Yard Management — Mobile dock board

### 2a. Pause loading — invalid reason
| File | Change |
|------|--------|
| `frontend_mobile/frontend/src/services/dockService.ts` | Map mobile pause reason to backend-accepted code (`OTHER` instead of `GENERIC_DELAY`) |
| `frontend_mobile/frontend/src/lib/dockManageActions.ts` | Pause/resume action wiring aligned with API |
| `frontend_mobile/frontend/src/hooks/useDockMutations.ts` | Mutation hooks for dock pause/resume |
| `frontend_mobile/frontend/app/(yard)/docks.tsx` | UI for pause loading on dock board |

### 2b. Complete loading vs release dock (two-step flow)
**Before:** Complete loading immediately released the dock.  
**After:** Complete loading → dock stays occupied → optional gross weight → separate **Release** action.

| Area | Files |
|------|--------|
| **Backend** | `yms/backend/routers/loading_ops.py` — `POST /loading-operations/complete`, `GET /loading-operations/complete-state` |
| | `yms/backend/services/loading_exceptions_service.py` — complete-state logic; skip duplicate `LOADING_COMPLETED` yard event when already pending |
| | `yms/backend/tests/test_loading_exceptions.py` — tests for new endpoints |
| **Mobile** | `frontend_mobile/frontend/src/services/dockService.ts` — `completeLoading`, `getCompleteState`, `releaseDockEntry` |
| | `frontend_mobile/frontend/src/hooks/useDockCompleteState.ts` — **New** hook for complete/release state |
| | `frontend_mobile/frontend/src/hooks/useDockMutations.ts` — complete + release mutations |
| | `frontend_mobile/frontend/src/lib/dockManageActions.ts` — action helpers |
| | `frontend_mobile/frontend/app/(yard)/docks.tsx` — Complete Loading + Release UI |

**Note:** YMS service restart required for new loading API routes. Client fallback via `POST /yard-events` with `LOADING_COMPLETED` when API returns 404.

---

## 3. Yard Management — Mobile gate checklist

### Problem
Each exit checklist tap reloaded the entire gate screen (poor UX).

### Solution
Optimistic UI updates without full context reload.

| File | Change |
|------|--------|
| `frontend_mobile/frontend/app/(yard)/gate.tsx` | Optimistic toggle in `handleToggleExitCheck`; no full `loadVehicleContext` spinner on each tap |
| `frontend_mobile/frontend/src/hooks/useGateMutations.ts` | Gate mutations without broad cache invalidation on checklist toggle |
| `frontend_mobile/frontend/src/lib/gateChecklist.ts` | Checklist merge helpers |
| `frontend_mobile/frontend/src/lib/gateActions.ts` | Gate action helpers |
| `frontend_mobile/frontend/src/components/yard/GateVehicleSheet.tsx` | Loading only when `loading && !context` |
| `frontend_mobile/frontend/src/lib/__tests__/gateChecklist.test.ts` | Tests |
| `frontend_mobile/frontend/src/lib/__tests__/gateActions.test.ts` | Tests |

---

## 4. Documentation (new & updated)

### User guides (role-based)
| File | Description |
|------|-------------|
| `docs/YARD_MANAGEMENT_SYSTEM_GUIDE.md` | **New** — YMS guide: 5 roles, permissions, modules, workflows, screenshots |
| `docs/PARKING_MANAGEMENT_SYSTEM_GUIDE.md` | **New** — PMS guide: 3 roles, permissions, modules, workflows, screenshots |

### Word exports
| File | Description |
|------|-------------|
| `docs/YARD_MANAGEMENT_SYSTEM_GUIDE.docx` | Word export with embedded images, TOC field, heading styles |
| `docs/PARKING_MANAGEMENT_SYSTEM_GUIDE.docx` | Word export (same tooling) |

### Screenshots
| Path | Description |
|------|-------------|
| `docs/images/*.png` | UI screenshots captured from `http://localhost:5173` (login, dashboards, modules per role) |

### Doc tooling
| File | Description |
|------|-------------|
| `docs/scripts/md_to_docx.py` | Markdown → Word converter (tables, images, code blocks, Mermaid as text, TOC) |
| `docs/scripts/package.json` | Playwright dependency for screenshot automation (if used) |
| `docs/scripts/package-lock.json` | Lockfile for doc scripts |

### This file
| File | Description |
|------|-------------|
| `docs/change.md` | **This changelog** — summary of post-setup changes |

---

## 5. Web login credentials (reference)

Use at `http://localhost:5173/auth`.

### Shipgen platform admin
| Email | Password |
|-------|----------|
| `admin@shipgen.net` | `Shipgen@Fleet2026!` |

### Yard (YMS) — all use `Shipgen@Yms2026!`
| Email | Role |
|-------|------|
| `yard.admin@shipgen.demo` | Yard Administrator |
| `yard.manager@shipgen.demo` | Yard Manager |
| `yard.gate@shipgen.demo` | Gate Operator |
| `yard.coordinator@shipgen.demo` | Yard Coordinator |
| `yard.supervisor@shipgen.demo` | Dock Supervisor |

### Parking (PMS) — Shipgen demo
| Email | Password | Role |
|-------|----------|------|
| `parking.admin@shipgen.demo` | `admin123` | Admin |
| `parking.supervisor@shipgen.demo` | `supervisor123` | Supervisor |
| `parking.operator@shipgen.demo` | `operator123` | Operator |

### Parking (PMS) — standalone seed
| Email | Password |
|-------|----------|
| `admin@parkflow.com` | `admin123` |
| `supervisor@parkflow.com` | `supervisor123` |
| `operator@parkflow.com` | `operator123` |

---

## 6. Commands reference

```bash
# Start stack
docker compose up -d

# Rebuild console after frontend changes
docker compose build frontend
docker compose up -d frontend

# Regenerate Word guides
python docs/scripts/md_to_docx.py docs/PARKING_MANAGEMENT_SYSTEM_GUIDE.md
python docs/scripts/md_to_docx.py docs/YARD_MANAGEMENT_SYSTEM_GUIDE.md
```

---

## 7. Intentionally not changed

Per workspace rules, **Fleetbase/Laravel backend** (`packages/*`) was not modified unless required. Parking exit uses existing `POST /tickets/{id}/exit`. YMS loading endpoints were added only where the mobile/console workflow could not be fixed client-side alone.

---

## 8. Known follow-ups (optional)

- Confirmation modal before exit on Exit Vehicle page (not implemented)
- Hourly/daily parking pricing not applied at ticket creation (backend stores rules; UI uses `base_price` only)
- PMS Settings page forms are UI-only (no API wiring)
- Notifications module not implemented in YMS or PMS (bell icon is alert badge only)

---

*Last updated: July 2026*
