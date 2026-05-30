# Screen: Schedule detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/maintenance/schedules/:public_id` |
| **Route name** | `fleet-ops.maintenance.schedules.index.details` |
| **Controller** | `controllers/maintenance/schedules/index/details.js` |
| **Route** | `routes/maintenance/schedules/index/details.js` |
| **Model** | `schedule` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `fleet-ops view maintenance-schedule` |
| API | `store.findRecord(...)` |

**Error:** `serverError` + redirect to list if not found.

---

## Parent controller — tabs

| Tab | Route |
|-----|-------|
| common.overview | `maintenance.schedules.index.details.index` |
| menu.work-orders | `maintenance.schedules.index.details.work-orders` |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| — | — | — |

---

## Tab panels

### Tab: `index`

**Renders:** `MaintenanceSchedule::Details`

| Field |
|-------|
| i18n:common.clear |

### Tab: `work-orders`

**Renders:** `LinkTo`

| Field |
|-------|
| i18n:common.clear |


## Related list spec

[`maintenance__schedules__index.md`](./maintenance__schedules__index.md)

## Service

`resource-action (base)`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view maintenance-schedule` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `maintenance.schedules.index`
- On failure redirects to `maintenance.schedules.index`

### Controller state & services

**Injected services:** `maintenanceScheduleActions`, `fetch`, `hostRouter`, `intl`, `abilities`, `universe/menu-service`

**Tabs:**
- route: maintenance.schedules.index.details.index
- route: maintenance.schedules.index.details.work-orders

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| Download .ics | `inline fn` | `—` |
| Add to Google Calendar | `inline fn` | `—` |

- **Setup/teardown:** @action edit
- **Setup/teardown:** @action triggerNow
- **Setup/teardown:** @action delete
- **Setup/teardown:** @action downloadIcal
- **Setup/teardown:** @action addToGoogleCalendar

### Notifications pattern (global)

- Success: `notifications.success(intl.t(...))`
- Warning: `notifications.warning(...)` — validation/precondition failed
- Error: `notifications.serverError(error)` — parses API error payload

### Realtime / sockets

- Realtime only where `orderSocketEvents` or SocketCluster is injected on this screen (see service flows above)
- Company channel `company.{companyId}` may patch models (e.g. `order.driver_assigned`) — see `order-socket-events` service doc

### Permission branching

- Use `abilities.can('fleet-ops <verb> <resource>')` / `cannot` in routes and column definitions
- Table row actions inherit `permission` on column definitions

### Registry / extensions

- Dynamic tabs/components from `menuService.getMenuItems(registryName)`
- `RegistryYield` renders extension components with `@permission` prop

### Mobile / responsive

- Console `hiddenSidebarRoutes` forces header-only nav on home, notifications, virtual pages
- Order detail hides sidebar entirely; map layout uses full width
- Tables: fixed footer pagination; horizontal scroll on narrow viewports

