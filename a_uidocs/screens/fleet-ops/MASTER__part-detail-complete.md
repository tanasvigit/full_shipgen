# Screen: Part detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/maintenance/parts/:public_id` |
| **Route name** | `fleet-ops.maintenance.parts.index.details` |
| **Controller** | `controllers/maintenance/parts/index/details.js` |
| **Route** | `routes/maintenance/parts/index/details.js` |
| **Model** | `part` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `fleet-ops view part` |
| API | `store.findRecord(...)` |

**Error:** `serverError` + redirect to list if not found.

---

## Parent controller — tabs

| Tab | Route |
|-----|-------|
| common.overview | `maintenance.parts.index.details.index` |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| — | — | — |

---

## Tab panels

### Tab: `index`

**Renders:** `Part::Details`

| Field |
|-------|
| ID |
| SKU |
| Name |
| Type |
| Barcode |
| Serial Number |
| Manufacturer |
| Model |
| Status |
| Quantity on Hand |
| Fitted To |
| Unit Cost |
| MSRP |
| Total Inventory Value |
| Currency |
| Supplier / Vendor |
| Warranty |


## Related list spec

[`maintenance__parts__index.md`](./maintenance__parts__index.md)

## Service

`services/part-actions.js`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view part` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `maintenance.parts.index`
- On failure redirects to `maintenance.parts.index`

### Controller state & services

**Injected services:** `partActions`, `hostRouter`, `intl`, `universe/menu-service`

**Tabs:**
- route: maintenance.parts.index.details.index

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| (action) | `inline fn` | `—` |
| (action) | `inline fn` | `—` |

- **Setup/teardown:** @action edit
- **Setup/teardown:** @action delete

### Service action flows

#### `part.create()`


#### `part.update()`


#### `part.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `part.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `part.bulkDelete()`


#### `part.export()`


#### `part.import()`


#### `part.search()`


#### `part.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `part.transitionTo()`


#### `part.createTask()`


#### `part.updateTask()`


#### `part.saveTask()`


#### `part.modalTask()`


#### `part.deleteTask()`


#### `part.getRecordName()`


#### `part.createNewInstance()`


#### `part.can()`


#### `part.cannot()`


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

