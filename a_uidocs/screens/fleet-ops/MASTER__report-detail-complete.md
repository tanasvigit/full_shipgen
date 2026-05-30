# Screen: Report detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/analytics/reports/:public_id` |
| **Route name** | `fleet-ops.analytics.reports.index.details` |
| **Controller** | `controllers/analytics/reports/index/details.js` |
| **Route** | `routes/analytics/reports/index/details.js` |
| **Model** | `report` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `fleet-ops view report` |
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

**Renders:** `Report::Details`

| Field |
|-------|
| i18n:common.clear |

### Tab: `result`

**Renders:** `Report::Data`

| Field |
|-------|
| i18n:common.clear |


## Related list spec

[`analytics__reports__index.md`](./analytics__reports__index.md)

## Service

`services/report-actions.js`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view report` | redirect/warning — see route for target |

**Model load:** `store.queryRecord('report')`

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.analytics.reports.index`
- On failure redirects to `console.fleet-ops.analytics.reports.index`

### Controller state & services

**Injected services:** `hostRouter`


### Service action flows

#### `report.create()`


#### `report.update()`


#### `report.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `report.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `report.bulkDelete()`


#### `report.export()`


#### `report.import()`


#### `report.search()`


#### `report.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `report.transitionTo()`


#### `report.createTask()`


#### `report.updateTask()`


#### `report.saveTask()`


#### `report.modalTask()`


#### `report.deleteTask()`


#### `report.getRecordName()`


#### `report.createNewInstance()`


#### `report.can()`


#### `report.cannot()`


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

