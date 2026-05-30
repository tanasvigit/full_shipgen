# Screen: Issue detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/management/issues/:public_id` |
| **Route name** | `fleet-ops.management.issues.index.details` |
| **Controller** | `controllers/management/issues/index/details.js` |
| **Route** | `routes/management/issues/index/details.js` |
| **Model** | `issue` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `fleet-ops view issue` |
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

**Renders:** `Issue::Details`

| Field |
|-------|
| i18n:common.details |
| i18n:issue.fields.title |
| i18n:common.status |
| i18n:issue.fields.reported-by |
| i18n:issue.fields.assigned-to |
| i18n:issue.fields.type |
| i18n:issue.fields.category |
| i18n:issue.fields.priority |
| i18n:common.date-created |
| i18n:issue.fields.tags |
| i18n:common.coordinates |
| i18n:issue.fields.report |


## Related list spec

[`management__issues__index.md`](./management__issues__index.md)

## Service

`services/issue-actions.js`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view issue` | redirect/warning — see route for target |

**Model load:** `store.queryRecord('issue', { single: true, with: [driver, vehicle, assignee, reporter] })`

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.management.issues.index`
- On failure redirects to `console.fleet-ops.management.issues.index`

### Controller state & services

**Injected services:** `hostRouter`


### Service action flows

#### `issue.create()`


#### `issue.update()`


#### `issue.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `issue.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `issue.bulkDelete()`


#### `issue.export()`


#### `issue.import()`


#### `issue.search()`


#### `issue.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `issue.transitionTo()`


#### `issue.createTask()`


#### `issue.updateTask()`


#### `issue.saveTask()`


#### `issue.modalTask()`


#### `issue.deleteTask()`


#### `issue.getRecordName()`


#### `issue.createNewInstance()`


#### `issue.can()`


#### `issue.cannot()`


#### `issue.viewDriver()`


#### `issue.viewVehicle()`


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

