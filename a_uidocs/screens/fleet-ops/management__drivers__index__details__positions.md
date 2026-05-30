# Screen: management/drivers/index/details/positions

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.management.drivers.index.details.positions` |
| **URL** | `/fleet-ops/management/drivers/index/details/positions` |
| **Template** | `packages/fleetops/addon/templates/management/drivers/index/details/positions.hbs` |
| **Controller** | _none / parent controller_ |
| **Route** | `packages\fleetops\addon\routes\management\drivers\index\details\positions.js` |

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

- **Enter:** Navigate to `/fleet-ops/management/drivers/index/details/positions`
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
| `PositionsReplay` | TBD |

---

## 15. Composed components (full UI)

### `PositionsReplay`

**Source:** `packages\fleetops\addon\components\positions-replay.hbs`

**Buttons:** t "common.clear", Stop, Pause, Resume, Play


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/management/drivers/index/details/positions.hbs`
- Route: `packages\fleetops\addon\routes\management\drivers\index\details\positions.js`


---


---


---


---


---


---


> **Full merged spec:** [MASTER__driver-detail-complete.md](./MASTER__driver-detail-complete.md)


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view driver` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.management.drivers.index`
- On failure redirects to `console.fleet-ops.management.drivers.index`

### Controller state & services

**Injected services:** `universe/menu-service`, `hostRouter`, `intl`

**Tabs:**
- Positions
- route: management.drivers.index.details.index
- route: management.drivers.index.details.positions
- route: management.drivers.index.details.schedule

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| (action) | `hostRouter.transitionTo` | `—` |


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

