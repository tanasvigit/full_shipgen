# Screen: Contact detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/management/contacts/:public_id` |
| **Route name** | `fleet-ops.management.contacts.index.details` |
| **Controller** | `controllers/management/contacts/index/details.js` |
| **Route** | `routes/management/contacts/index/details.js` |
| **Model** | `contact` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `fleet-ops view contact` |
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

**Renders:** `Contact::Details`

| Field |
|-------|
| i18n:contact.fields.contact-details |
| i18n:common.name |
| i18n:common.title |
| i18n:common.email |
| i18n:common.internal-id |
| i18n:common.type |
| i18n:common.address |


## Related list spec

[`management__contacts__index.md`](./management__contacts__index.md)

## Service

`services/contact-actions.js`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view contact` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.management.contacts.customers`
- On failure redirects to `console.fleet-ops.management.contacts.customers`

### Controller state & services

**Injected services:** `hostRouter`


### Service action flows

#### `contact.create()`


#### `contact.update()`


#### `contact.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `contact.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `contact.bulkDelete()`


#### `contact.export()`


#### `contact.import()`


#### `contact.search()`


#### `contact.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `contact.transitionTo()`


#### `contact.createTask()`


#### `contact.updateTask()`


#### `contact.saveTask()`


#### `contact.modalTask()`


#### `contact.deleteTask()`


#### `contact.getRecordName()`


#### `contact.createNewInstance()`


#### `contact.can()`


#### `contact.cannot()`


#### `contact.viewPlace()`


#### `contact.editPlace()`


#### `contact.createPlace()`

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

