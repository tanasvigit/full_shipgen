# Screen: Sensor detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/connectivity/sensors/:public_id` |
| **Route name** | `fleet-ops.connectivity.sensors.index.details` |
| **Controller** | `controllers/connectivity/sensors/index/details.js` |
| **Route** | `routes/connectivity/sensors/index/details.js` |
| **Model** | `sensor` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `fleet-ops view sensor` |
| API | `store.findRecord(...)` |

**Error:** `serverError` + redirect to list if not found.

---

## Parent controller — tabs

| Tab | Route |
|-----|-------|
| Overview | `connectivity.sensors.index.details.index` |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| Edit | `—` | `hostRouter.transitionTo → edit route` |

---

## Tab panels

### Tab: `index`

**Renders:** `Sensor::Details`

| Field |
|-------|
| Name |
| Sensor Type |
| Unit |
| Internal ID |
| Serial Number |
| Minimum Threshold |
| Maximum Threshold |
| Threshold Inclusive |
| Threshold Status |
| Last Reading At |
| Report Frequency |
| Status |
| Active Status |
| Device |
| Warranty |

### Tab: virtual

LazyEngineComponent from registry.


## Related list spec

[`connectivity__sensors__index.md`](./connectivity__sensors__index.md)

## Service

`services/sensor-actions.js`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view sensor` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.connectivity.sensors.index`
- On failure redirects to `console.fleet-ops.connectivity.sensors.index`

### Controller state & services

**Injected services:** `universe/menu-service`, `hostRouter`

**Tabs:**
- Overview
- route: connectivity.sensors.index.details.index

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| (action) | `hostRouter.transitionTo` | `—` |


### Service action flows

#### `sensor.create()`


#### `sensor.update()`


#### `sensor.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `sensor.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `sensor.bulkDelete()`


#### `sensor.export()`


#### `sensor.import()`


#### `sensor.search()`


#### `sensor.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `sensor.transitionTo()`


#### `sensor.createTask()`


#### `sensor.updateTask()`


#### `sensor.saveTask()`


#### `sensor.modalTask()`


#### `sensor.deleteTask()`


#### `sensor.getRecordName()`


#### `sensor.createNewInstance()`


#### `sensor.can()`


#### `sensor.cannot()`


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

