# Screen: management/drivers/index

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.management.drivers` |
| **URL** | `/fleet-ops/management/drivers` |
| **Template** | `packages/fleetops/addon/templates/management/drivers/index.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\management\drivers\index.js` |
| **Route** | `packages\fleetops\addon\routes\management\drivers\index.js` |

---

## 1. Layout structure

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
| column.name | `name` | yes | yes |
| column.id | `public_id` | yes | yes |
| column.internal-id | `internal_id` | yes | yes |
| column.vendor | `vendor.name` | yes | yes |
| column.vehicle | `vehicle.display_name` | yes | yes |
| column.fleet | `fleets` | yes | yes |
| column.license | `drivers_license_number` | yes | yes |
| column.phone | `phone` | yes | yes |
| column.country | `country` | yes | yes |
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

- _See controller and component JS for business rules_

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `store.query('driver')` |


---

## 10. Permissions

- `fleet-ops view driver`
- `fleet-ops view vendor`
- `fleet-ops view vehicle`
- `fleet-ops update driver`
- `fleet-ops assign-order-for driver`
- `fleet-ops assign-vehicle-for driver`
- `fleet-ops delete driver`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/management/drivers`
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

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/management/drivers/index.hbs`
- Controller: `packages\fleetops\addon\controllers\management\drivers\index.js`
- Route: `packages\fleetops\addon\routes\management\drivers\index.js`


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
| `fleet-ops list driver` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console.fleet-ops`

### Controller state & services

**Injected services:** `driverActions`, `fleetActions`, `vendorActions`, `vehicleActions`, `notifications`, `tableContext`, `intl`

**Query params:** `page`, `limit`, `sort`, `query`, `name`, `drivers_license_number`, `vehicle`, `fleet`, `vendor`, `phone`, `country`, `public_id`, `internal_id`, `created_at`, `updated_at`, `status`, ``

### Bulk actions (table selection)

| Label | Handler |
|-------|--------|
| common.delete-selected-count | `driverActions.bulkDelete` |

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| common.refresh | `driverActions.refresh` | `—` |
| common.new | `driverActions.transition` | `—` |
| common.import | `driverActions.import` | `—` |
| common.export | `driverActions.export` | `—` |

- **Setup/teardown:** @action changeLayout

### Service action flows

#### `driver-actions.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `driver-actions.import()`


#### `driver-actions.export()`


#### `driver-actions.bulkDelete()`


#### `driver-actions.assignOrder()`

**Modal (show):** modals/driver-assign-order

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

#### `driver-actions.assignVehicle()`

**Modal (show):** modals/driver-assign-vehicle

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

#### `driver-actions.locate()`


#### `driver-actions.delete()`

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

