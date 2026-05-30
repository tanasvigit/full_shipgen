# Screen: management/vehicles/index/details

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.management.vehicles.index.details` |
| **URL** | `/fleet-ops/management/vehicles/index/details` |
| **Template** | `packages/fleetops/addon/templates/management/vehicles/index/details.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\management\vehicles\index\details.js` |
| **Route** | `packages\fleetops\addon\routes\management\vehicles\index\details.js` |

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

- Overview
- Positions
- Devices
- Schedules
- Work Orders
- Maintenance

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

- `fleet-ops update vehicle`
- `fleet-ops view vehicle`
- `fleet-ops create maintenance-schedule`
- `fleet-ops create work-order`
- `fleet-ops create maintenance`
- `fleet-ops delete vehicle`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/management/vehicles/index/details`
- **Exit:** Standard back or transition per host router
- **Error/unauthorized:** redirect defined in route

---

## 13. Responsive / mobile

- Console shell uses `Layout::MobileNavbar` for primary nav on small screens
- Sidebar hidden on map-heavy FleetOps detail routes (see parent controller `sidebar.hideNow()`)
- Tables use horizontal scroll / pagination footer

---

## 14. Reusable component mapping

| Ember | Custom design system |
|-------|---------------------|
| `Layout::Resource::Panel` | TBD |
| `TabNavigation` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/management/vehicles/index/details.hbs`
- Controller: `packages\fleetops\addon\controllers\management\vehicles\index\details.js`
- Route: `packages\fleetops\addon\routes\management\vehicles\index\details.js`


---


> **Full merged spec:** [MASTER__vehicle-detail-complete.md](./MASTER__vehicle-detail-complete.md)

## Deep specification (auto-enriched)

### Controller actions/tabs (`packages/fleetops/addon/controllers/management/vehicles/index/details.js`)

**Tabs:**
- Overview
- Positions
- Devices
- Schedules
- Work Orders
- Maintenance



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
| `fleet-ops view vehicle` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `afterModel`: secondary loads after primary model
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.management.vehicles.index`
- On failure redirects to `console.fleet-ops.management.vehicles.index`

### Controller state & services

**Injected services:** `vehicleActions`, `universe/menu-service`, `hostRouter`, `intl`

**Tabs:**
- Overview
- Positions
- Devices
- Schedules
- Work Orders
- Maintenance
- route: management.vehicles.index.details.index
- route: management.vehicles.index.details.positions
- route: management.vehicles.index.details.devices
- route: management.vehicles.index.details.schedules
- route: management.vehicles.index.details.work-orders
- route: management.vehicles.index.details.maintenance-history

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| vehicle.actions.locate-vehicle | `vehicleActions.locate` | `—` |
| vehicle.actions.schedule-maintenance | `vehicleActions.scheduleMaintenance` | `—` |
| vehicle.actions.create-work-order | `vehicleActions.createWorkOrder` | `—` |
| vehicle.actions.log-maintenance | `vehicleActions.logMaintenance` | `—` |
| (action) | `vehicleActions.delete` | `—` |


### Service action flows

#### `vehicle-actions.locate()`


#### `vehicle-actions.scheduleMaintenance()`


#### `vehicle-actions.createWorkOrder()`


#### `vehicle-actions.logMaintenance()`


#### `vehicle-actions.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

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

