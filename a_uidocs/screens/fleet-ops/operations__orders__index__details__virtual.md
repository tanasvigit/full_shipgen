# Screen: operations/orders/index/details/virtual

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.operations.orders.index.details.virtual` |
| **URL** | `/fleet-ops/operations/orders/index/details/virtual` |
| **Template** | `packages/fleetops/addon/templates/operations/orders/index/details/virtual.hbs` |
| **Controller** | _none / parent controller_ |
| **Route** | `packages\fleetops\addon\routes\operations\orders\index\details\virtual.js` |

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

- **Enter:** Navigate to `/fleet-ops/operations/orders/index/details/virtual`
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

- Template: `packages/fleetops/addon/templates/operations/orders/index/details/virtual.hbs`
- Route: `packages\fleetops\addon\routes\operations\orders\index\details\virtual.js`


---


---


---


---


---


---


> **Full merged spec:** [MASTER__order-detail-complete.md](./MASTER__order-detail-complete.md)


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view order` | redirect/warning — see route for target |

**Model load:** `store.queryRecord('order', { single: true, with: [payload, driverAssigned, orderConfig, customer, facilitator, trackingStatuses, trackingNumber, purchaseRate, comments, files] })`

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `willTransition`: cleanup listeners, map controls, restore sidebar
- `afterModel`: `order.loadTrackingActivity()` then optional `order.reload()` if `meta._index_resource`
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.operations.orders.index`
- On failure redirects to `console.fleet-ops.operations.orders.index`

### Controller state & services

**Injected services:** `universe/menu-service`, `orderActions`, `orderSocketEvents`, `leafletMapManager`, `leafletLayerVisibilityManager`, `hostRouter`, `universe`, `sidebar`

**Tasks:** `refresh` — use `.perform()`, UI bound via `.isRunning`

**Tabs:**
- Overview
- route: operations.orders.index.details.index

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| Edit details | `orderActions.editOrderDetails` | `this.model.status === 'canceled'` |
| Update activity | `orderActions.updateActivity` | `this.model.status === 'canceled'` |
| Unassign driver | `orderActions.unassignDriver` | `this.model.status === 'canceled' || !this.model.driver_assigned` |
| View order label | `orderActions.viewLabel` | `—` |
| Listen to socket channel | `hostRouter.transitionTo` | `—` |
| View metadata | `orderActions.viewMetadata` | `—` |
| Cancel order | `orderActions.cancel` | `this.model.status === 'canceled'` |
| Delete order | `orderActions.delete` | `—` |

- **Setup/teardown:** @action async
- **Setup/teardown:** `sidebar.hideNow()` on setup — hides sidebar
- **Setup/teardown:** `orderSocketEvents.start(model)` — realtime channel subscription

### Service action flows

#### `order-actions.editOrderDetails()`


#### `order-actions.updateActivity()`

**Modal (show):** modals/update-order-activity

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

#### `order-actions.unassignDriver()`


#### `order-actions.viewLabel()`

**Modal (show):** modal component

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

#### `order-actions.viewMetadata()`

**Modal (show):** modals/view-metadata

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

#### `order-actions.cancel()`

**Modal (confirm):** order.prompts.cancel-title

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

#### `order-actions.delete()`

**Modal (confirm):** confirm dialog

- Flow: User accepts → `modal.startLoading()` → API/model op → success toast → `modal.done()` | catch → `notifications.serverError` → `modal.stopLoading()`

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

