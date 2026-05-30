# Screen: Fuel Report detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/management/fuel-reports/:public_id` |
| **Route name** | `fleet-ops.management.fuel-reports.index.details` |
| **Controller** | `controllers/management/fuel-reports/index/details.js` |
| **Route** | `routes/management/fuel-reports/index/details.js` |
| **Model** | `fuel-report` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `fleet-ops view fuel-report` |
| API | `store.queryRecord(...)` |

**Error:** `serverError` + redirect to list if not found.

---

## Parent controller — tabs

| Tab | Route |
|-----|-------|
| (single panel) | details index |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| — | — | — |

---

## Tab panels

### Tab: `index`

**Renders:** `FuelReport::Details`

| Field |
|-------|
| i18n:common.clear |


## Related list spec

[`management__fuel-reports__index.md`](./management__fuel-reports__index.md)

## Service

`services/fuel-report-actions.js`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view fuel-report` | redirect/warning — see route for target |

**Model load:** `store.queryRecord('fuel-report', { single: true, with: [driver, vehicle, reporter] })`

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.management.fuel-reports.index`
- On failure redirects to `console.fleet-ops.management.fuel-reports.index`

### Controller state & services

**Injected services:** `hostRouter`


### Service action flows

#### `fuel-report.create()`


#### `fuel-report.update()`


#### `fuel-report.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `fuel-report.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `fuel-report.bulkDelete()`


#### `fuel-report.export()`


#### `fuel-report.import()`


#### `fuel-report.search()`


#### `fuel-report.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `fuel-report.transitionTo()`


#### `fuel-report.createTask()`


#### `fuel-report.updateTask()`


#### `fuel-report.saveTask()`


#### `fuel-report.modalTask()`


#### `fuel-report.deleteTask()`


#### `fuel-report.getRecordName()`


#### `fuel-report.createNewInstance()`


#### `fuel-report.can()`


#### `fuel-report.cannot()`


#### `fuel-report.viewDriver()`


#### `fuel-report.viewVehicle()`


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

