# Screen: connectivity/sensors/index/details/index

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.connectivity.sensors.index.details` |
| **URL** | `/fleet-ops/connectivity/sensors/:public_id` |
| **Template** | `packages/fleetops/addon/templates/connectivity/sensors/index/details/index.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\connectivity\sensors\index\details\index.js` |
| **Route** | `packages\fleetops\addon\routes\connectivity\sensors\index\details\index.js` |

---

## 1. Layout structure

- Standard section outlet (infer from parent route template)

```
[Page outlet content]
```

---

## 2. Fields (form inputs)

| Label | Value binding | Type | Notes |
|-------|---------------|------|-------|
| _No InputGroup fields in route template — see composed components below_ | | | |

---

## 3. Tables

_No `columns` getter — not a list page or uses Resource::Tabular internal columns._


---

## 4. Tabs

_No tab getter — single panel or tabs in parent_

---

## 5. Buttons & actions

| Label | Action / handler | Conditions |
|-------|------------------|------------|



---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- _See controller and component JS for business rules_

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | _Infer model from route/controller_ |


---

## 10. Permissions

- _Check abilities service in route beforeModel_

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/connectivity/sensors/index/details`
- **Exit:** Standard back or transition per host router


---

## 13. Responsive / mobile

- Console shell uses `Layout::MobileNavbar` for primary nav on small screens
- Sidebar hidden on map-heavy FleetOps detail routes (see parent controller `sidebar.hideNow()`)
- Tables use horizontal scroll / pagination footer

---

## 14. Reusable component mapping

| Ember | Custom design system |
|-------|---------------------|
| `Sensor::Details` | TBD |
| `Spacer` | TBD |

---

## 15. Composed components (full UI)

### `Sensor::Details`

**Source:** `packages\fleetops\addon\components\sensor\details.hbs`

**Layout:** Collapsible content panels


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/connectivity/sensors/index/details/index.hbs`
- Controller: `packages\fleetops\addon\controllers\connectivity\sensors\index\details\index.js`
- Route: `packages\fleetops\addon\routes\connectivity\sensors\index\details\index.js`


---


> **Full merged spec:** [MASTER__sensor-detail-complete.md](./MASTER__sensor-detail-complete.md)

## Deep specification (auto-enriched)

### Controller actions/tabs (`packages/fleetops/addon/controllers/connectivity/sensors/index/details.js`)

**Tabs:**
- Overview



---


---


---


---


---


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view sensor` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.connectivity.sensors.index`
- On failure redirects to `console.fleet-ops.connectivity.sensors.index`

### Controller state & services

**Injected services:** `universe/menu-service`, `hostRouter`

**Tabs:**
- Overview
- route: connectivity.sensors.index.details.index

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| (action) | `hostRouter.transitionTo` | `—` |


### Service action flows

#### `sensor-actions.create()`


#### `sensor-actions.update()`


#### `sensor-actions.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `sensor-actions.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `sensor-actions.bulkDelete()`


#### `sensor-actions.export()`


#### `sensor-actions.import()`


#### `sensor-actions.search()`


#### `sensor-actions.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `sensor-actions.transitionTo()`


#### `sensor-actions.createTask()`


#### `sensor-actions.updateTask()`


#### `sensor-actions.saveTask()`


#### `sensor-actions.modalTask()`


#### `sensor-actions.deleteTask()`


#### `sensor-actions.getRecordName()`


#### `sensor-actions.createNewInstance()`


#### `sensor-actions.can()`


#### `sensor-actions.cannot()`


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

