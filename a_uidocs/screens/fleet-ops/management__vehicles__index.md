# Screen: management/vehicles/index

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.management.vehicles` |
| **URL** | `/fleet-ops/management/vehicles` |
| **Template** | `packages/fleetops/addon/templates/management/vehicles/index.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\management\vehicles\index.js` |
| **Route** | `packages\fleetops\addon\routes\management\vehicles\index.js` |

---

## 1. Layout structure

- Section header with title/actions
- Scrollable section body
- Resource tabular (list + filters + table)

```
[Header: title + actions]
[Filters row]
[Data table with pagination]
[Optional: map/kanban toggle above]
```

---

## 2. Fields (form inputs)

| Label | Value binding | Type | Notes |
|-------|---------------|------|-------|
| _No InputGroup fields in route template — see composed components below_ | | | |

---

## 3. Tables

| Column (i18n) | valuePath | Sort | Filter |
|---------------|-----------|------|--------|
| column.name | `displayName` | yes | yes |
| column.plate-number | `plate_number` | yes | yes |
| column.internal-id | `internal_id` | yes | yes |
| column.driver-assigned | `driver_name` | yes | yes |
| column.id | `public_id` | yes | yes |
| column.make | `make` | yes | yes |
| column.model | `model` | yes | yes |
| column.year | `year` | yes | yes |
| column.vendor | `vendor_name` | yes | yes |
| column.status | `status` | yes | yes |
| column.created-at | `createdAt` | yes | yes |
| column.updated-at | `updatedAt` | yes | yes |


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

- Template: `{{#if (eq this.layout "table")}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `store.query('vehicle')` |


---

## 10. Permissions

- `fleet-ops view vehicle`
- `fleet-ops view driver`
- `fleet-ops view vendor`
- `fleet-ops update vehicle`
- `fleet-ops create maintenance-schedule`
- `fleet-ops create work-order`
- `fleet-ops create maintenance`
- `fleet-ops delete vehicle`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/management/vehicles`
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
| `Layout::Resource::Tabular` | TBD |
| `Layout::Section::Header` | TBD |
| `Layout::Resource::TabularActions` | TBD |
| `Layout::Section::Body` | TBD |
| `Layout::Resource::CardsGrid` | TBD |
| `Vehicle::Card` | TBD |

---

## 15. Composed components (full UI)

### `Vehicle::Card`

**Source:** `packages\fleetops\addon\components\vehicle\card.hbs`


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/management/vehicles/index.hbs`
- Controller: `packages\fleetops\addon\controllers\management\vehicles\index.js`
- Route: `packages\fleetops\addon\routes\management\vehicles\index.js`


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
| `fleet-ops list vehicle` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console.fleet-ops`

### Controller state & services

**Injected services:** `vehicleActions`, `driverActions`, `tableContext`, `intl`, `appCache`

**Query params:** `page`, `limit`, `sort`, `query`, `public_id`, `status`, `created_at`, `updated_at`, `created_by`, `updated_by`, `name`, `plate_number`, `year`, `vehicle_make`, `vehicle_model`, `display_name`, ``

### Bulk actions (table selection)

| Label | Handler |
|-------|--------|
| common.delete-selected-count | `vehicleActions.bulkDelete` |

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| common.new | `vehicleActions.transition` | `—` |
| common.import | `vehicleActions.import` | `—` |
| common.export | `vehicleActions.export` | `—` |


### Template conditionals

- `{{#if (eq this.layout "table")}}` — branch UI visibility

### Service action flows

#### `vehicle-actions.import()`


#### `vehicle-actions.export()`


#### `vehicle-actions.bulkDelete()`


#### `vehicle-actions.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `vehicle-actions.locate()`


#### `vehicle-actions.scheduleMaintenance()`


#### `vehicle-actions.createWorkOrder()`


#### `vehicle-actions.logMaintenance()`


#### `vehicle-actions.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `resource-action.bulkDelete()`


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

### List resource behavior

- Uses `Layout::Resource::Tabular` — search debounced via controller task
- Pagination: `page` query param updates model
- Bulk actions from `bulkActions` getter on controller
- Row click → transition to details route
- Export/import via `*Actions.export/import`

