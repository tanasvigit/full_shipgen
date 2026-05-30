# Screen: Device detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/connectivity/devices/:public_id` |
| **Route name** | `fleet-ops.connectivity.devices.index.details` |
| **Controller** | `controllers/connectivity/devices/index/details.js` |
| **Route** | `routes/connectivity/devices/index/details.js` |
| **Model** | `device` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `fleet-ops view device` |
| API | `store.findRecord(...)` |

**Error:** `serverError` + redirect to list if not found.

---

## Parent controller — tabs

| Tab | Route |
|-----|-------|
| Overview | `connectivity.devices.index.details.index` |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| Edit | `—` | `hostRouter.transitionTo → edit route` |

---

## Tab panels

### Tab: `events`

**Renders:** `(nested outlet)`

| Field |
|-------|
| Internal ID |
| i18n:device.fields.telematic |
| i18n:device.fields.data-frequency |
| i18n:device.fields.device-name |
| i18n:device.fields.device-type |
| i18n:device.fields.device-id |
| i18n:device.fields.device-provider |
| i18n:device.fields.device-model |
| i18n:device.fields.manufacturer |
| i18n:device.fields.serial-number |
| i18n:device.fields.device-location |
| i18n:device.fields.installation-date |
| i18n:device.fields.last-maintenance-date |
| i18n:common.online |
| i18n:common.offline |
| i18n:common.last-seen-at |
| i18n:device.fields.signal-strength |
| i18n:device.fields.status |
| i18n:device.fields.warranty |
| i18n:device.fields.notes |

### Tab: `index`

**Renders:** `Device::Details`

| Field |
|-------|
| Internal ID |
| i18n:device.fields.telematic |
| i18n:device.fields.data-frequency |
| i18n:device.fields.device-name |
| i18n:device.fields.device-type |
| i18n:device.fields.device-id |
| i18n:device.fields.device-provider |
| i18n:device.fields.device-model |
| i18n:device.fields.manufacturer |
| i18n:device.fields.serial-number |
| i18n:device.fields.device-location |
| i18n:device.fields.installation-date |
| i18n:device.fields.last-maintenance-date |
| i18n:common.online |
| i18n:common.offline |
| i18n:common.last-seen-at |
| i18n:device.fields.signal-strength |
| i18n:device.fields.status |
| i18n:device.fields.warranty |
| i18n:device.fields.notes |

### Tab: virtual

LazyEngineComponent from registry.


## Related list spec

[`connectivity__devices__index.md`](./connectivity__devices__index.md)

## Service

`services/device-actions.js`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view device` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.connectivity.devices.index`
- On failure redirects to `console.fleet-ops.connectivity.devices.index`

### Controller state & services

**Injected services:** `universe/menu-service`, `hostRouter`

**Tabs:**
- Overview
- route: connectivity.devices.index.details.index

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| (action) | `hostRouter.transitionTo` | `—` |


### Service action flows

#### `device.create()`


#### `device.update()`


#### `device.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `device.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `device.bulkDelete()`


#### `device.export()`


#### `device.import()`


#### `device.search()`


#### `device.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `device.transitionTo()`


#### `device.createTask()`


#### `device.updateTask()`


#### `device.saveTask()`


#### `device.modalTask()`


#### `device.deleteTask()`


#### `device.getRecordName()`


#### `device.createNewInstance()`


#### `device.can()`


#### `device.cannot()`


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

