# Screen: Telematic detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/connectivity/telematics/:public_id` |
| **Route name** | `fleet-ops.connectivity.telematics.index.details` |
| **Controller** | `controllers/connectivity/telematics/index/details.js` |
| **Route** | `routes/connectivity/telematics/index/details.js` |
| **Model** | `telematic` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `fleet-ops view telematic` |
| API | `store.findRecord(...)` |

**Error:** `serverError` + redirect to list if not found.

---

## Parent controller — tabs

| Tab | Route |
|-----|-------|
| Overview | `connectivity.telematics.index.details.index` |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| Edit | `—` | `hostRouter.transitionTo → edit route` |

---

## Tab panels

### Tab: `devices`

**Renders:** `(nested outlet)`

| Field |
|-------|
| Provider |
| Integration Name |
| Model |
| Serial Number |
| Firmware Version |
| Status |
| IMEI |
| ICCID |
| IMSI |
| MSISDN |
| Last Seen |
| Online Status |
| Signal Strength |

### Tab: `events`

**Renders:** `(nested outlet)`

| Field |
|-------|
| Provider |
| Integration Name |
| Model |
| Serial Number |
| Firmware Version |
| Status |
| IMEI |
| ICCID |
| IMSI |
| MSISDN |
| Last Seen |
| Online Status |
| Signal Strength |

### Tab: `index`

**Renders:** `Telematic::Details`

| Field |
|-------|
| Provider |
| Integration Name |
| Model |
| Serial Number |
| Firmware Version |
| Status |
| IMEI |
| ICCID |
| IMSI |
| MSISDN |
| Last Seen |
| Online Status |
| Signal Strength |

### Tab: `sensors`

**Renders:** `(nested outlet)`

| Field |
|-------|
| Provider |
| Integration Name |
| Model |
| Serial Number |
| Firmware Version |
| Status |
| IMEI |
| ICCID |
| IMSI |
| MSISDN |
| Last Seen |
| Online Status |
| Signal Strength |


## Related list spec

[`connectivity__telematics__index.md`](./connectivity__telematics__index.md)

## Service

`services/telematic-actions.js`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view telematic` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.connectivity.telematics.index`
- On failure redirects to `console.fleet-ops.connectivity.telematics.index`

### Controller state & services

**Injected services:** `hostRouter`

**Tabs:**
- Overview
- route: connectivity.telematics.index.details.index

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| (action) | `hostRouter.transitionTo` | `—` |


### Service action flows

#### `telematic.create()`


#### `telematic.update()`


#### `telematic.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `telematic.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `telematic.bulkDelete()`


#### `telematic.export()`


#### `telematic.import()`


#### `telematic.search()`


#### `telematic.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `telematic.transitionTo()`


#### `telematic.createTask()`


#### `telematic.updateTask()`


#### `telematic.saveTask()`


#### `telematic.modalTask()`


#### `telematic.deleteTask()`


#### `telematic.getRecordName()`


#### `telematic.createNewInstance()`


#### `telematic.can()`


#### `telematic.cannot()`


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

