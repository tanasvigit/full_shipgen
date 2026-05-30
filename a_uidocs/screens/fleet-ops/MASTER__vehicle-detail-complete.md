# Screen: Vehicle detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/fleet-ops/management/vehicles/:public_id` |
| **Route name** | `fleet-ops.management.vehicles.index.details` |
| **Parent template** | `management/vehicles/index/details.hbs` |
| **Layout** | `Layout::Resource::Panel` + `TabNavigation` |
| **Header** | `vehicle/panel-header` |

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

Panel layout. Header: vehicle display name. Tabs: Overview, Positions, Devices, Schedules, Work Orders, Maintenance (+ registry).

---

## Parent route — data load

| Item | Value |
|------|-------|
| Model | `vehicle` |
| Permission | `fleet-ops view vehicle` |
| API | `store.findRecord('vehicle', public_id)` |
| After model | `model.loadDriver()` |

**Error handling:** `notifications.serverError(error)`; if message ends with `not found` → redirect to list index.

**beforeModel:** `abilities.cannot('fleet-ops view vehicle')` → warning toast + redirect to list.

---

## Parent controller — tabs

| Tab label | Route |
|-----------|-------|
| Overview | `management.vehicles.index.details.index` |
| Positions | `management.vehicles.index.details.positions` |
| Devices | `management.vehicles.index.details.devices` |
| Schedules | `management.vehicles.index.details.schedules` |
| Work Orders | `management.vehicles.index.details.work-orders` |
| Maintenance | `management.vehicles.index.details.maintenance-history` |
| (+ extension tabs) | `menuService.getMenuItems('fleet-ops:component:vehicle:details')` |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| Edit (pencil icon) | `fleet-ops update vehicle` | `hostRouter.transitionTo → edit route` |
| vehicle.actions.locate-vehicle | `—` | `vehicleActions.locate` |
| vehicle.actions.schedule-maintenance | `—` | `vehicleActions.scheduleMaintenance` |
| vehicle.actions.create-work-order | `—` | `vehicleActions.createWorkOrder` |
| vehicle.actions.log-maintenance | `—` | `vehicleActions.logMaintenance` |

**Cancel / back:** `onPressCancel` → `transition-to` list index route.

---

## Tab panels (route outlets)

### Tab: `devices`

**Template:** `templates/management/vehicles/index/details/devices.hbs`

**Renders:** `Device::Manager`

### Tab: `equipment`

**Template:** `templates/management/vehicles/index/details/equipment.hbs`

**Renders:** `(nested outlet)`

_Nested outlet — see route + `components/vehicle/equipment` if present._

### Tab: `index`

**Template:** `templates/management/vehicles/index/details/index.hbs`

**Renders:** `Vehicle::Details`

| Display field |
|---------------|
| Trim |
| Color |
| Serial Number |
| Class |
| Call Sign |
| System of Measurement |
| Fuel Volume Unit |
| Odometer Unit |
| Odometer at Purchase |
| Body Type |
| Body Subtype |
| Usage Type |
| Ownership Type |
| Fuel Type |
| Transmission |
| Engine Number |
| Engine Make |
| Engine Model |
| Engine Family |
| Engine Configuration |
| Cylinder Arrangement |
| Number of Cylinders |
| Engine Size |
| Engine Displacement |
| Horsepower |
| Horsepower RPM |
| Torque |
| Torque RPM |
| Fuel Capacity |
| Payload Capacity |
| Towing Capacity |
| Seating Capacity |
| Vehicle Weight |
| Length |
| Width |
| Height |
| Cargo Volume |
| Payload Volume |
| Pallet Capacity |
| Parcel Capacity |
| Passenger Volume |
| Interior Volume |
| Ground Clearance |
| Bed Length |
| Emission Standard |
| DPF Equipped |
| SCR Equipped |
| GVWR |
| GCWR |
| Acquisition Cost |

### Tab: `maintenance-history`

**Template:** `templates/management/vehicles/index/details/maintenance-history.hbs`

**Renders:** `Vehicle::Details::MaintenanceHistory`

_Nested outlet — see route + `components/vehicle/maintenance-history` if present._

### Tab: `positions`

**Template:** `templates/management/vehicles/index/details/positions.hbs`

**Renders:** `PositionsReplay`

### Tab: `schedules`

**Template:** `templates/management/vehicles/index/details/schedules.hbs`

**Renders:** `Vehicle::Details::Schedules`

_Nested outlet — see route + `components/vehicle/schedules` if present._

### Tab: `virtual` (extension)

**Template:** LazyEngineComponent from registry tab definition.

### Tab: `work-orders`

**Template:** `templates/management/vehicles/index/details/work-orders.hbs`

**Renders:** `Vehicle::Details::WorkOrders`

_Nested outlet — see route + `components/vehicle/work-orders` if present._


---

## Registry

- `fleet-ops:component:vehicle:details` — extension tabs and `RegistryYield` panels on overview component

## List screen (related)

- Spec: [`management__vehicles__index.md`](./management__vehicles__index.md)
- Service: `vehicle-actions.js` — create/edit via panel or modal; row click → detail route

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
| Vehicle::Details | Overview tab |
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

#### `vehicle.create()`


#### `vehicle.update()`


#### `vehicle.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `vehicle.confirmContinueWithUnsavedChanges()`

**Modal (confirm):** common.continue-without-saving

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `vehicle.bulkDelete()`


#### `vehicle.export()`


#### `vehicle.import()`


#### `vehicle.search()`


#### `vehicle.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `vehicle.transitionTo()`


#### `vehicle.createTask()`


#### `vehicle.updateTask()`


#### `vehicle.saveTask()`


#### `vehicle.modalTask()`


#### `vehicle.deleteTask()`


#### `vehicle.getRecordName()`


#### `vehicle.createNewInstance()`


#### `vehicle.can()`


#### `vehicle.cannot()`


#### `vehicle.scheduleMaintenance()`


#### `vehicle.createWorkOrder()`


#### `vehicle.logMaintenance()`


#### `vehicle.locate()`


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

