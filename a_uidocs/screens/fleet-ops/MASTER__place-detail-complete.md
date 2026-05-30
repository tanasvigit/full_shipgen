# Screen: Place detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/management/places/:public_id` |
| **Route name** | `fleet-ops.management.places.index.details` |
| **Parent template** | `management/places/index/details.hbs` |
| **Layout** | `Layout::Resource::Panel` + `TabNavigation` |
| **Header** | `(title from name or street1)` |

---

## Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│ Console header                                                │
├─────────────────────────────────────────────────────────────┤
│ [← Back to list]  Title + header component                    │
│ [Action buttons: edit, dropdown actions...]                   │
├─────────────────────────────────────────────────────────────┤
│ [Tabs from controller + registry extensions]                │
├─────────────────────────────────────────────────────────────┤
│  Active tab outlet (scrollable)                               │
│  - field-info panels / tables / map / schedule UI             │
└─────────────────────────────────────────────────────────────┘
```

Panel layout. Header: place name or street1. Tabs: Overview (+ registry). Additional routes exist for activity, map, etc.

---

## Parent route — data load

| Item | Value |
|------|-------|
| Model | `place` |
| Permission | `fleet-ops view place` |
| API | `store.findRecord('place', public_id)` |
| After model | None |

**Error handling:** `notifications.serverError(error)`; if message ends with `not found` → redirect to list index.

**beforeModel:** `abilities.cannot('fleet-ops view place')` → warning toast + redirect to list.

---

## Parent controller — tabs

| Tab label | Route |
|-----------|-------|
| Overview | `management.places.index.details.index` |
| (+ extension tabs) | `menuService.getMenuItems('fleet-ops:component:place:details')` |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| Edit (pencil icon) | `—` | `hostRouter.transitionTo → edit route` |

**Cancel / back:** `onPressCancel` → `transition-to` list index route.

---

## Tab panels (route outlets)

### Tab: `activity`

**Template:** `templates/management/places/index/details/activity.hbs`

**Renders:** `(nested outlet)`

**Component file:** `components/place/activity.hbs` → `{{yield}}`

### Tab: `comments`

**Template:** `templates/management/places/index/details/comments.hbs`

**Renders:** `(nested outlet)`

**Component file:** `components/place/comments.hbs` → `{{yield}}`

### Tab: `documents`

**Template:** `templates/management/places/index/details/documents.hbs`

**Renders:** `(nested outlet)`

**Component file:** `components/place/documents.hbs` → `{{yield}}`

### Tab: `index`

**Template:** `templates/management/places/index/details/index.hbs`

**Renders:** `Place::Details`

| Display field |
|---------------|
| i18n:place.fields.details |
| i18n:common.name |
| i18n:place.fields.street-1 |
| i18n:place.fields.street-2 |
| i18n:place.fields.neighborhood |
| i18n:place.fields.building |
| i18n:place.fields.security-access-code |
| i18n:place.fields.city |
| i18n:place.fields.state |
| i18n:place.fields.country |
| i18n:place.fields.phone |
| i18n:place.fields.coordinates |

### Tab: `map`

**Template:** `templates/management/places/index/details/map.hbs`

**Renders:** `(nested outlet)`

**Component file:** `components/place/map.hbs` → `{{yield}}`

### Tab: `operations`

**Template:** `templates/management/places/index/details/operations.hbs`

**Renders:** `(nested outlet)`

**Component file:** `components/place/operations.hbs` → `{{yield}}`

### Tab: `performance`

**Template:** `templates/management/places/index/details/performance.hbs`

**Renders:** `(nested outlet)`

**Component file:** `components/place/performance.hbs` → `{{yield}}`

### Tab: `rules`

**Template:** `templates/management/places/index/details/rules.hbs`

**Renders:** `(nested outlet)`

**Component file:** `components/place/rules.hbs` → `{{yield}}`

### Tab: `virtual` (extension)

**Template:** LazyEngineComponent from registry tab definition.


---

## Registry

- `fleet-ops:component:place:details` — extension tabs and `RegistryYield` panels on overview component

## List screen (related)

- Spec: [`management__places__index.md`](./management__places__index.md)
- Service: `place-actions.js` — create/edit via panel or modal; row click → detail route

## Panel / modal flows (from *-actions service)

| Flow | Entry |
|------|-------|
| Create | `panel.create` / `modal.create` → form component |
| Edit | `panel.edit` / `modal.edit` → reload if `_index_resource` |
| Quick view | `panel.view` with `panelTabs` (driver/vehicle) or modal (place) |
| Delete | `delete(model, { onConfirm }) → redirect list |

## Mobile / responsive

- `Layout::Resource::Panel` with `@bodyClass="no-scroll"` — tab content scrolls inside panel
- Table list uses standard pagination; vehicle list supports table/grid layout toggle

## Custom component map

| Ember | Build as |
|-------|----------|
| Place::Details | Overview tab |
| Layout::Resource::Panel | Detail page shell |
| TabNavigation | Tab bar |
| RegistryYield | Extension panels |


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view place` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.management.places.index`
- On failure redirects to `console.fleet-ops.management.places.index`

### Controller state & services

**Injected services:** `universe/menu-service`, `hostRouter`

**Tabs:**
- Overview
- route: management.places.index.details.index

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| (action) | `hostRouter.transitionTo` | `—` |


### Service action flows

#### `place.create()`


#### `place.update()`


#### `place.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `place.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `place.bulkDelete()`


#### `place.export()`


#### `place.import()`


#### `place.search()`


#### `place.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `place.transitionTo()`


#### `place.createTask()`


#### `place.updateTask()`


#### `place.saveTask()`


#### `place.modalTask()`


#### `place.deleteTask()`


#### `place.getRecordName()`


#### `place.createNewInstance()`


#### `place.can()`


#### `place.cannot()`


#### `place.locate()`


#### `place.assignVendor()`

**Modal (show):** modals/place-assign-vendor

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

#### `place.viewVendor()`


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

