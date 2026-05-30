# Screen: Driver detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/management/drivers/:public_id` |
| **Route name** | `fleet-ops.management.drivers.index.details` |
| **Parent template** | `management/drivers/index/details.hbs` |
| **Layout** | `Layout::Resource::Panel` + `TabNavigation` |
| **Header** | `driver/panel-header` |

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

Panel layout (sidebar visible). Header: driver name + panel-header. Tabs below header.

---

## Parent route — data load

| Item | Value |
|------|-------|
| Model | `driver` |
| Permission | `fleet-ops view driver` |
| API | `store.findRecord('driver', public_id)` |
| After model | None |

**Error handling:** `notifications.serverError(error)`; if message ends with `not found` → redirect to list index.

**beforeModel:** `abilities.cannot('fleet-ops view driver')` → warning toast + redirect to list.

---

## Parent controller — tabs

| Tab label | Route |
|-----------|-------|
| common.overview | `management.drivers.index.details.index` |
| Positions | `management.drivers.index.details.positions` |
| common.schedule | `management.drivers.index.details.schedule` |
| (+ extension tabs) | `menuService.getMenuItems('fleet-ops:component:driver:details')` |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| Edit (pencil icon) | `—` | `hostRouter.transitionTo → edit route` |

**Cancel / back:** `onPressCancel` → `transition-to` list index route.

---

## Tab panels (route outlets)

### Tab: `index`

**Template:** `templates/management/drivers/index/details/index.hbs`

**Renders:** `Driver::Details`

| Display field |
|---------------|
| Skills & Certifications |
| Max Driving Time |
| Max Distance |
| i18n:driver.fields.user-account |
| i18n:common.name |
| i18n:common.email |
| i18n:common.phone |
| i18n:driver.fields.driver-details |
| i18n:common.id |
| i18n:common.internal-id |
| i18n:driver.fields.driver-license |
| i18n:common.city |
| i18n:common.country |
| i18n:common.coordinates |
| i18n:common.metadata |

### Tab: `orders`

**Template:** `templates/management/drivers/index/details/orders.hbs`

**Renders:** `(nested outlet)`

_Nested outlet — see route + `components/driver/orders` if present._

### Tab: `positions`

**Template:** `templates/management/drivers/index/details/positions.hbs`

**Renders:** `PositionsReplay`

### Tab: `schedule`

**Template:** `templates/management/drivers/index/details/schedule.hbs`

**Renders:** `Driver::Schedule`

**Component file:** `components/driver/schedule.hbs` → `ContentPanel`

### Tab: `virtual` (extension)

**Template:** LazyEngineComponent from registry tab definition.


---

## Registry

- `fleet-ops:component:driver:details` — extension tabs and `RegistryYield` panels on overview component

## List screen (related)

- Spec: [`management__drivers__index.md`](./management__drivers__index.md)
- Service: `driver-actions.js` — create/edit via panel or modal; row click → detail route

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
| Driver::Details | Overview tab |
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
| `fleet-ops view driver` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.management.drivers.index`
- On failure redirects to `console.fleet-ops.management.drivers.index`

### Controller state & services

**Injected services:** `universe/menu-service`, `hostRouter`, `intl`

**Tabs:**
- Positions
- route: management.drivers.index.details.index
- route: management.drivers.index.details.positions
- route: management.drivers.index.details.schedule

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| (action) | `hostRouter.transitionTo` | `—` |


### Service action flows

#### `driver.create()`


#### `driver.update()`


#### `driver.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `driver.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `driver.bulkDelete()`


#### `driver.export()`


#### `driver.import()`


#### `driver.search()`


#### `driver.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `driver.transitionTo()`


#### `driver.createTask()`


#### `driver.updateTask()`


#### `driver.saveTask()`


#### `driver.modalTask()`


#### `driver.deleteTask()`


#### `driver.getRecordName()`


#### `driver.createNewInstance()`


#### `driver.can()`


#### `driver.cannot()`


#### `driver.locate()`


#### `driver.assignOrder()`

**Modal (show):** modals/driver-assign-order

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

#### `driver.assignVehicle()`

**Modal (show):** modals/driver-assign-vehicle

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

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

