# Screen: operations/orders

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.operations.orders` |
| **URL** | `/fleet-ops/operations/orders` |
| **Template** | `packages/fleetops/addon/templates/operations/orders.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\operations\orders` |
| **Route** | `packages\fleetops\addon\routes\operations\orders.js` |

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

- **Enter:** Navigate to `/fleet-ops/operations/orders`
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


---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/operations/orders.hbs`
- Controller: `packages\fleetops\addon\controllers\operations\orders`
- Route: `packages\fleetops\addon\routes\operations\orders.js`


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


### Controller state & services

**Injected services:** `orderActions`, `orderSocketEvents`, `leafletMapManager`, `mapDrawer`, `orderListOverlay`, `fetch`, `intl`

**Query params:** `page`, `limit`, `sort`, `query`, `public_id`, `internal_id`, `payload`, `tracking_number`, `facilitator`, `customer`, `driver`, `vehicle`, `pickup`, `dropoff`, `created_by`, `updated_by`, `created_at`, `updated_at`, `scheduled_at`, `status`, `type`, `without_driver`, `bulk_query`, `layout`, `drawerOpen`, `drawerTab`, `orderPanelOpen`, ``

### Bulk actions (table selection)

| Label | Handler |
|-------|--------|
| common.cancel-resource | `orderActions.bulkCancel` |
| common.delete-resource | `orderActions.bulkDelete` |
| common.dispatch-orders | `orderActions.bulkDispatch` |
| common.assign-drivers | `orderActions.bulkAssignDriver` |

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| common.refresh | `orderActions.refresh` | `—` |
| common.new | `orderActions.transition` | `—` |
| common.export | `orderActions.export` | `—` |
| common.import | `orderActions.importOrders` | `—` |

- **Setup/teardown:** @action changeLayout
- **Setup/teardown:** `orderSocketEvents.start(model)` — realtime channel subscription

### Service action flows

#### `order-actions.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `order-actions.export()`


#### `order-actions.importOrders()`

**Modal (show):** modals/orchestrator-import

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

#### `order-actions.bulkCancel()`


#### `order-actions.bulkDispatch()`


#### `order-actions.bulkAssignDriver()`


#### `order-actions.optimizeOrderRoutes()`


#### `order-actions.bulkDelete()`


#### `order-actions.dispatch()`

**Modal (confirm):** order.prompts.dispatch-title

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `order-actions.cancel()`

**Modal (confirm):** order.prompts.cancel-title

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `order-actions.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `resource-action.bulkDelete()`


### Notifications pattern (global)

- Success: `notifications.success(intl.t(...))`
- Warning: `notifications.warning(...)` — validation/precondition failed
- Error: `notifications.serverError(error)` — parses API error payload

### Realtime / sockets

- Order detail: channel `order.{public_id}`; reloadable: `order.created`, `order.completed`, `waypoint.activity`, `entity.activity`, status change on `order.updated`
- Debounced `hostRouter.refresh()` + map routing control replace on reloadable events
- Leave route: `orderSocketEvents.stop(model)`

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

