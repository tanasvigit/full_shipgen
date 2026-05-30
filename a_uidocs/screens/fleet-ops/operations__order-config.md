# Screen: operations/order-config

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.operations.order_config` |
| **URL** | `/fleet-ops/operations/order-config` |
| **Template** | `packages/fleetops/addon/templates/operations/order-config.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\operations\order-config.js` |
| **Route** | `packages\fleetops\addon\routes\operations\order-config.js` |

---

## 1. Layout structure

- Section header with title/actions
- Scrollable section body

```
[Section Header + actions]
[Section Body - scrollable form/panels]
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
| t "order-config-manager.new-order-config" | `—` | |


---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- Template: `{{#if Context.ready}}`
- Template: `{{#if (eq Context.currentConfig.id orderConfig.id)}}`
- Template: `{{#if Context.currentConfig}}`
- Template: `{{#if (cannot "fleet-ops view order-config")}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | _Infer model from route/controller_ |


---

## 10. Permissions

- `fleet-ops list order-config`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/operations/order-config`
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
| `OrderConfigManager` | TBD |
| `Layout::Section::Header` | TBD |
| `DropdownButton` | TBD |
| `Action.NewOrderConfigButton` | TBD |
| `Layout::Section::Body` | TBD |
| `Attach::Tooltip` | TBD |
| `InputInfo` | TBD |
| `Context.content` | TBD |
| `Spacer` | TBD |
| `Button` | TBD |

---

## 15. Composed components (full UI)

### `OrderConfigManager`

**Source:** `packages\fleetops\addon\components\order-config-manager.hbs`


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/operations/order-config.hbs`
- Controller: `packages\fleetops\addon\controllers\operations\order-config.js`
- Route: `packages\fleetops\addon\routes\operations\order-config.js`


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
| `fleet-ops list order-config` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console.fleet-ops`

### Controller state & services

**Injected services:** _none_

**Query params:** `tab`, `config`, `context`, `contextModel`

- **Setup/teardown:** @action onTabChanged
- **Setup/teardown:** @action onConfigChanged
- **Setup/teardown:** @action onContextChanged

### Template conditionals

- `{{#if Context.ready}}` — branch UI visibility
- `{{#if (eq Context.currentConfig.id orderConfig.id)}}` — branch UI visibility
- `{{#if Context.currentConfig}}` — branch UI visibility
- `{{#if (cannot "fleet-ops view order-config")}}` — branch UI visibility

### Loading / empty states

- Spinner shown during upload/async operations
- Empty state: `{{else}}` branch on `#each` when no records

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

