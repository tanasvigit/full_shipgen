# Screen: Maintenance detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/maintenance/maintenances/:public_id` |
| **Route name** | `fleet-ops.maintenance.maintenances.index.details` |
| **Controller** | `controllers/maintenance/maintenances/index/details.js` |
| **Route** | `routes/maintenance/maintenances/index/details.js` |
| **Model** | `maintenance` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `fleet-ops view maintenance` |
| API | `store.findRecord(...)` |

**Error:** `serverError` + redirect to list if not found.

---

## Parent controller — tabs

| Tab | Route |
|-----|-------|
| common.overview | `maintenance.maintenances.index.details.index` |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| — | — | — |

---

## Tab panels

### Tab: `index`

**Renders:** `Maintenance::Details`

| Field |
|-------|
| ID |
| Type |
| Status |
| Priority |
| Maintainable Asset |
| Performed By |
| Linked Work Order |
| Scheduled At |
| Started At |
| Completed At |
| Overdue |
| Days Until Due |
| Odometer |
| Engine Hours |
| Duration |


## Related list spec

[`maintenance__maintenances__index.md`](./maintenance__maintenances__index.md)

## Service

`services/maintenance-actions.js`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view equipment` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `maintenance.equipment.index`
- On failure redirects to `maintenance.equipment.index`

### Controller state & services

**Injected services:** `equipmentActions`, `hostRouter`, `intl`, `universe/menu-service`

**Tabs:**
- route: maintenance.equipment.index.details.index

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| (action) | `inline fn` | `—` |
| (action) | `inline fn` | `—` |

- **Setup/teardown:** @action edit
- **Setup/teardown:** @action delete

### Service action flows

#### `maintenance.create()`


#### `maintenance.update()`


#### `maintenance.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `maintenance.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `maintenance.bulkDelete()`


#### `maintenance.export()`


#### `maintenance.import()`


#### `maintenance.search()`


#### `maintenance.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `maintenance.transitionTo()`


#### `maintenance.createTask()`


#### `maintenance.updateTask()`


#### `maintenance.saveTask()`


#### `maintenance.modalTask()`


#### `maintenance.deleteTask()`


#### `maintenance.getRecordName()`


#### `maintenance.createNewInstance()`


#### `maintenance.can()`


#### `maintenance.cannot()`


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

