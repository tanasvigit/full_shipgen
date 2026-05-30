# Screen: Fleet detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/management/fleets/:public_id` |
| **Route name** | `fleet-ops.management.fleets.index.details` |
| **Controller** | `controllers/management/fleets/index/details.js` |
| **Route** | `routes/management/fleets/index/details.js` |
| **Model** | `fleet` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `fleet-ops view fleet` |
| API | `store.queryRecord(...)` |

**Error:** `serverError` + redirect to list if not found.

---

## Parent controller — tabs

| Tab | Route |
|-----|-------|
| Overview | `management.fleets.index.details.index` |
| Vehicles | `management.fleets.index.details.vehicles` |
| Drivers | `management.fleets.index.details.drivers` |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| Edit | `—` | `hostRouter.transitionTo → edit route` |

---

## Tab panels

### Tab: `drivers`

**Renders:** `Fleet::DriverListing`

| Field |
|-------|
| i18n:common.details |
| i18n:common.name |
| i18n:fleet.fields.task |
| i18n:fleet.fields.active-manpower |
| i18n:common.date-created |

### Tab: `index`

**Renders:** `Fleet::Details`

| Field |
|-------|
| i18n:common.details |
| i18n:common.name |
| i18n:fleet.fields.task |
| i18n:fleet.fields.active-manpower |
| i18n:common.date-created |

### Tab: `vehicles`

**Renders:** `Fleet::VehicleListing`

| Field |
|-------|
| i18n:common.details |
| i18n:common.name |
| i18n:fleet.fields.task |
| i18n:fleet.fields.active-manpower |
| i18n:common.date-created |

### Tab: virtual

LazyEngineComponent from registry.


## Related list spec

[`management__fleets__index.md`](./management__fleets__index.md)

## Service

`services/fleet-actions.js`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view fleet` | redirect/warning — see route for target |

**Model load:** `store.queryRecord('fleet', { single: true, with: [parent_fleet, service_area, zone] })`

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.management.fleets.index`
- On failure redirects to `console.fleet-ops.management.fleets.index`

### Controller state & services

**Injected services:** `universe/menu-service`, `hostRouter`

**Tabs:**
- Overview
- Vehicles
- Drivers
- route: management.fleets.index.details.index
- route: management.fleets.index.details.vehicles
- route: management.fleets.index.details.drivers

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| (action) | `hostRouter.transitionTo` | `—` |


### Service action flows

#### `fleet.create()`


#### `fleet.update()`


#### `fleet.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `fleet.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `fleet.bulkDelete()`


#### `fleet.export()`


#### `fleet.import()`


#### `fleet.search()`


#### `fleet.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `fleet.transitionTo()`


#### `fleet.createTask()`


#### `fleet.updateTask()`


#### `fleet.saveTask()`


#### `fleet.modalTask()`


#### `fleet.deleteTask()`


#### `fleet.getRecordName()`


#### `fleet.createNewInstance()`


#### `fleet.can()`


#### `fleet.cannot()`


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

