# Screen: Order detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/operations/orders/:public_id` |
| **Route name** | `fleet-ops.operations.orders.index.details` |
| **Controller** | `controllers/operations/orders/index/details.js` |
| **Route** | `routes/operations/orders/index/details.js` |
| **Model** | `order` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `fleet-ops view order` |
| API | `store.queryRecord(...)` |

**Error:** `serverError` + redirect to list if not found.

---

## Parent controller — tabs

| Tab | Route |
|-----|-------|
| Overview | `operations.orders.index.details.index` |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| Edit | `—` | `hostRouter.transitionTo → edit route` |

---

## Tab panels

### Tab: `index`

**Renders:** `Order::Details`

### Tab: virtual

LazyEngineComponent from registry.


## Related list spec

[`operations__orders__index.md`](./operations__orders__index.md)

## Service

`services/order-actions.js`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view work-order` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `maintenance.work-orders.index`
- On failure redirects to `maintenance.work-orders.index`

### Controller state & services

**Injected services:** `workOrderActions`, `hostRouter`, `intl`, `abilities`, `universe/menu-service`

**Tabs:**
- route: maintenance.work-orders.index.details.index

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| Send to Vendor | `inline fn` | `—` |
| (action) | `inline fn` | `—` |
| (action) | `inline fn` | `—` |

- **Setup/teardown:** @action sendEmail
- **Setup/teardown:** @action edit
- **Setup/teardown:** @action delete

### Service action flows

#### `order.create()`


#### `order.update()`


#### `order.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `order.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `order.bulkDelete()`


#### `order.export()`


#### `order.import()`


#### `order.search()`


#### `order.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `order.transitionTo()`


#### `order.createTask()`


#### `order.updateTask()`


#### `order.saveTask()`


#### `order.modalTask()`


#### `order.deleteTask()`


#### `order.getRecordName()`


#### `order.createNewInstance()`


#### `order.can()`


#### `order.cannot()`


#### `order.cancel()`

**Modal (confirm):** order.prompts.cancel-title

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `order.dispatch()`

**Modal (confirm):** order.prompts.dispatch-title

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `order.bulkCancel()`


#### `order.bulkDispatch()`


#### `order.bulkAssignDriver()`


#### `order.optimizeOrderRoutes()`


#### `order.editRoute()`


#### `order.updateActivity()`

**Modal (show):** modals/update-order-activity

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

#### `order.editOrderDetails()`


#### `order.assignDriver()`


#### `order.unassignDriver()`


#### `order.viewMetadata()`

**Modal (show):** modals/view-metadata

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

#### `order.editMetadata()`

**Modal (show):** modals/edit-metadata

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

**Local state after success:**
- set `meta` = meta

#### `order.viewLabel()`

**Modal (show):** modal component

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

#### `order.importOrders()`

**Modal (show):** modals/orchestrator-import

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

#### `order.saveRoute()`


### Notifications pattern (global)

- Success: `notifications.success(intl.t(...))`
- Warning: `notifications.warning(...)` — validation/precondition failed
- Error: `notifications.serverError(error)` — parses API error payload

### Realtime / sockets

- Order detail: channel `order.{public_id}`; reloadable: `order.created`, `order.completed`, `waypoint.activity`, `entity.activity`, status change on `order.updated`
- Debounced `hostRouter.refresh()` + map routing control replace on reloadable events
- Leave route: `orderSocketEvents.stop(model)`

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

