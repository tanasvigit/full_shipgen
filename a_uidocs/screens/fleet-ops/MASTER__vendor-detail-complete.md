# Screen: Vendor detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/management/vendors/:public_id` |
| **Route name** | `fleet-ops.management.vendors.index.details` |
| **Controller** | `controllers/management/vendors/index/details.js` |
| **Route** | `routes/management/vendors/index/details.js` |
| **Model** | `vendor` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `fleet-ops view vendor` |
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

**Renders:** `Vendor::Details`

| Field |
|-------|
| i18n:common.name |
| i18n:common.email |
| i18n:common.phone |
| i18n:vendor.fields.website |
| i18n:common.country |
| i18n:common.status |
| i18n:common.address |

### Tab: `personnel`

**Renders:** `{{page-title "Personnel"}}
{{outlet}}`

| Field |
|-------|
| i18n:common.name |
| i18n:common.email |
| i18n:common.phone |
| i18n:vendor.fields.website |
| i18n:common.country |
| i18n:common.status |
| i18n:common.address |


## Related list spec

[`management__vendors__index.md`](./management__vendors__index.md)

## Service

`services/vendor-actions.js`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view vendor` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.management.vendors.index`
- On failure redirects to `console.fleet-ops.management.vendors.index`

### Controller state & services

**Injected services:** `hostRouter`


### Service action flows

#### `vendor.create()`


#### `vendor.update()`


#### `vendor.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `vendor.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `vendor.bulkDelete()`


#### `vendor.export()`


#### `vendor.import()`


#### `vendor.search()`


#### `vendor.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `vendor.transitionTo()`


#### `vendor.createTask()`


#### `vendor.updateTask()`


#### `vendor.saveTask()`


#### `vendor.modalTask()`


#### `vendor.deleteTask()`


#### `vendor.getRecordName()`


#### `vendor.createNewInstance()`


#### `vendor.can()`


#### `vendor.cannot()`


#### `vendor.createVendorIntegration()`


#### `vendor.viewPlace()`


#### `vendor.editPlace()`


#### `vendor.createPlace()`

| API | Details |
|-----|--------|
| SAVE | `Ember Data record.save()` |

**Local state after success:**
- set `place_uuid` = place.id

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

