# Screen: Service Rate detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/operations/service-rates/:public_id` |
| **Route name** | `fleet-ops.operations.service-rates.index.details` |
| **Controller** | `controllers/operations/service-rates/index/details.js` |
| **Route** | `routes/operations/service-rates/index/details.js` |
| **Model** | `service-rate` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `fleet-ops view service-rate` |
| API | `store.findRecord(...)` |

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

**Renders:** `ServiceRate::Details`

| Field |
|-------|
| i18n:common.clear |


## Related list spec

[`operations__service-rates__index.md`](./operations__service-rates__index.md)

## Service

`services/service-rate-actions.js`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view service-rate` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.operations.service-rates.index`
- On failure redirects to `console.fleet-ops.operations.service-rates.index`

### Controller state & services

**Injected services:** `hostRouter`


### Service action flows

#### `service-rate.create()`


#### `service-rate.update()`


#### `service-rate.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `service-rate.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `service-rate.bulkDelete()`


#### `service-rate.export()`


#### `service-rate.import()`


#### `service-rate.search()`


#### `service-rate.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `service-rate.transitionTo()`


#### `service-rate.createTask()`


#### `service-rate.updateTask()`


#### `service-rate.saveTask()`


#### `service-rate.modalTask()`


#### `service-rate.deleteTask()`


#### `service-rate.getRecordName()`


#### `service-rate.createNewInstance()`


#### `service-rate.can()`


#### `service-rate.cannot()`


#### `service-rate.queryServiceRatesForOrder()`


#### `service-rate.getServiceQuotes()`


#### `service-rate.generateFixedRateFees()`


**Early exit:**
- Guard clause with early return on missing preconditions

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

