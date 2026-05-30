# Screen: management/drivers/index/edit

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.management.drivers.index.edit` |
| **URL** | `/fleet-ops/management/drivers/index/edit` |
| **Template** | `packages/fleetops/addon/templates/management/drivers/index/edit.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\management\drivers\index\edit.js` |
| **Route** | `packages\fleetops\addon\routes\management\drivers\index\edit.js` |

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

- `fleet-ops update driver`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/management/drivers/index/edit`
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
| `Driver::Form` | TBD |
| `Spacer` | TBD |

---

## 15. Composed components (full UI)

### `Driver::Form`

**Source:** `packages\fleetops\addon\components\driver\form.hbs`

**Layout:** Collapsible content panels; Extension registry injection slot

| Field | Binding |
|-------|----------|
| t "driver.fields.user-account" | `—` |
| t "common.name" | `—` |
| t "common.email" | `—` |
| t "common.phone" | `—` |
| t "common.internal-id" | `—` |
| t "driver.fields.driver-license" | `—` |
| t "driver.fields.vendor" | `—` |
| t "resource.vehicle" | `—` |
| t "common.city" | `—` |
| t "common.country" | `—` |
| t "common.status" | `—` |
| t "common.coordinates" | `—` |
| Driver Skills | `@resource.max_travel_time` |
| Max Distance (metres) | `@resource.max_distance` |
| (input) | `@resource.user.name` |

#### Child: `AvatarPicker`



---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/management/drivers/index/edit.hbs`
- Controller: `packages\fleetops\addon\controllers\management\drivers\index\edit.js`
- Route: `packages\fleetops\addon\routes\management\drivers\index\edit.js`


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
| `fleet-ops update driver` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.management.drivers.index`
- On failure redirects to `console.fleet-ops.management.drivers.index`

### Controller state & services

**Injected services:** `hostRouter`, `intl`, `notifications`, `modalsManager`, `events`

**Tasks:** `save` — use `.perform()`, UI bound via `.isRunning`

- **Setup/teardown:** @action cancel
- **Setup/teardown:** @action view

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

