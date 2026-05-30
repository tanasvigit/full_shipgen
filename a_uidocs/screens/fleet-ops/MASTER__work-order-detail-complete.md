# Screen: Work Order detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/maintenance/work-orders/:public_id` |
| **Route name** | `fleet-ops.maintenance.work-orders.index.details` |
| **Controller** | `controllers/maintenance/work-orders/index/details.js` |
| **Route** | `routes/maintenance/work-orders/index/details.js` |
| **Model** | `work-order` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `fleet-ops view work-order` |
| API | `store.findRecord(...)` |

**Error:** `serverError` + redirect to list if not found.

---

## Parent controller — tabs

| Tab | Route |
|-----|-------|
| common.overview | `maintenance.work-orders.index.details.index` |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| — | — | — |

---

## Tab panels

### Tab: `index`

**Renders:** `WorkOrder::Details`

| Field |
|-------|
| i18n:common.clear |


## Related list spec

[`maintenance__work-orders__index.md`](./maintenance__work-orders__index.md)

## Service

`services/work-order-actions.js`


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

#### `work-order.create()`


#### `work-order.update()`


#### `work-order.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `work-order.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `work-order.bulkDelete()`


#### `work-order.export()`


#### `work-order.import()`


#### `work-order.search()`


#### `work-order.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `work-order.transitionTo()`


#### `work-order.createTask()`


#### `work-order.updateTask()`


#### `work-order.saveTask()`


#### `work-order.modalTask()`


#### `work-order.deleteTask()`


#### `work-order.getRecordName()`


#### `work-order.createNewInstance()`


#### `work-order.can()`


#### `work-order.cannot()`


#### `work-order.sendEmail()`

**Modal (show):** modals/send-work-order

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

#### `work-order.prepareForSave()`


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

