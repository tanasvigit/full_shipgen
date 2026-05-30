# Screen: operations/orders/index/new

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.operations.orders.index.new` |
| **URL** | `/fleet-ops/operations/orders/index/new` |
| **Template** | `packages/fleetops/addon/templates/operations/orders/index/new.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\operations\orders\index\new.js` |
| **Route** | `packages\fleetops\addon\routes\operations\orders\index\new.js` |

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

- `fleet-ops create order`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/operations/orders/index/new`
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
| `Order::Form` | TBD |
| `Spacer` | TBD |

---

## 15. Composed components (full UI)

### `Order::Form`

**Source:** `packages\fleetops\addon\components\order\form.hbs`

**Layout:** Extension registry injection slot

#### Child: `Order::Form::Details`

| Field | Binding |
|-------|----------|
| t "order.fields.order-type" | `—` |
| t "order.fields.internal-id" | `—` |
| t "order.fields.customer" | `—` |
| t "order.fields.facilitator" | `—` |
| t "order.fields.service-type" | `—` |
| t "order.fields.assign-driver" | `—` |
| t "order.fields.assign-vehicle" | `—` |
| t "order.fields.proof-delivery" | `—` |
| t "order.fields.adhoc-ping" | `—` |
| Time Window Start | `@resource.time_window_start` |
| Time Window End | `@resource.time_window_end` |
| Required Skills | `@resource.orchestrator_priority` |
| (input) | `@resource.scheduled_at` |

#### Child: `Order::Form::Route`


#### Child: `Order::Form::Payload`

| Field | Binding |
|-------|----------|
| (input) | `entity.name` |

#### Child: `Order::Form::ServiceRate`

| Field | Binding |
|-------|----------|
| t "order.fields.select-service-rate" | `—` |

#### Child: `Order::Form::Notes`


#### Child: `Order::Form::Documents`


#### Child: `Order::Form::Metadata`



---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/operations/orders/index/new.hbs`
- Controller: `packages\fleetops\addon\controllers\operations\orders\index\new.js`
- Route: `packages\fleetops\addon\routes\operations\orders\index\new.js`


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
| `fleet-ops create order` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `willTransition`: cleanup listeners, map controls, restore sidebar
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console.fleet-ops.operations.orders.index`

### Controller state & services

**Injected services:** `loader`, `intl`, `universe`, `notifications`, `hostRouter`, `placeActions`, `customerActions`, `vendorActions`, `entityActions`, `orderImport`, `orderCreation`, `orderValidation`, `events`

**Tasks:** `save` — use `.perform()`, UI bound via `.isRunning`

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| common.import | `orderImport.promptImport` | `—` |

- **Setup/teardown:** @action setup

### Service action flows

#### `order-import.promptImport()`

**Modal (show):** modals/order-import

- Flow: Opens modal; confirm handler may call save/API; decline may rollback

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

