# vehicle detail tab: schedules

| Property | Value |
|----------|-------|
| **Parent screen** | [vehicle detail complete](../MASTER__vehicle-detail-complete.md) |
| **Route** | `fleet-ops.management.vehicles.index.details.schedules` |
| **Component** | `Vehicle::Details::Schedules` |
| **Template** | `templates/management/vehicles/index/details/schedules.hbs` |

## Layout

- See template / component source

## Display fields & labels

| Field / i18n key |
|----------------|
| _parse template manually_ |

## Buttons

_see actionButtons in component JS_

## Conditionals

- `#if this.schedules.isRunning`
- `#if this.schedules.length`

## Child components

- `Spinner`
- `StatusBadge`
- `Button`
- `FaIcon`
- `Button`

## Custom UI notes

Rebuild as a tab inside vehicle detail. Model: `vehicle` (doc 33).


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Controller state & services

**Injected services:** `maintenanceScheduleActions`, `notifications`, `store`

**Tasks:** `loadSchedules` — use `.perform()`, UI bound via `.isRunning`


### Template conditionals

- `{{#if this.schedules.isRunning}}` — branch UI visibility
- `{{#if this.schedules.length}}` — branch UI visibility

### Loading / empty states

- Spinner shown during upload/async operations
- Task `.isRunning` disables UI during ember-concurrency task
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

### Component source

`packages/fleetops/addon/components/vehicle/details/schedules.js`

**Branches:**
- `#if this.schedules.isRunning`
- `#if this.schedules.length`

