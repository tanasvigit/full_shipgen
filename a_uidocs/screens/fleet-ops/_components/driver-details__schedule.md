# driver detail tab: schedule

| Property | Value |
|----------|-------|
| **Parent screen** | [driver detail complete](../MASTER__driver-detail-complete.md) |
| **Route** | `fleet-ops.management.drivers.index.details.schedule` |
| **Component** | `Driver::Schedule` |
| **Template** | `templates/management/drivers/index/details/schedule.hbs` |

## Layout

- ContentPanel section(s) with optional `@actionButtons`

## Display fields & labels

| Field / i18n key |
|----------------|
| _parse template manually_ |

## Buttons

_see actionButtons in component JS_

## Conditionals

- `#if this.exceptions.length`
- `#if exception.reason`
- `#if exception.isPending`

## Child components

- `ContentPanel`
- `Button`
- `Button`
- `FaIcon`
- `FaIcon`
- `ContentPanel`
- `ContentPanel`
- `Button`
- `Button`
- `Button`

## Custom UI notes

Rebuild as a tab inside driver detail. Model: `driver` (doc 33).


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Controller state & services

**Injected services:** `notifications`, `modalsManager`, `store`, `fetch`, `intl`

**Tasks:** `loadDriverSchedule`, `loadHOSStatus` — use `.perform()`, UI bound via `.isRunning`

- **Setup/teardown:** @action prevWeek
- **Setup/teardown:** @action nextWeek
- **Setup/teardown:** @action addShift
- **Setup/teardown:** @action editShift
- **Setup/teardown:** @action deleteShift
- **Setup/teardown:** @action requestTimeOff
- **Setup/teardown:** @action async
- **Setup/teardown:** @action async
- **Setup/teardown:** @action deleteException

### Template conditionals

- `{{#if this.exceptions.length}}` — branch UI visibility
- `{{#if exception.reason}}` — branch UI visibility
- `{{#if exception.isPending}}` — branch UI visibility

### Loading / empty states

- Button/component `@isLoading` binds to async task running state
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

`packages/fleetops/addon/components/driver/schedule.js`

**Branches:**
- `#if this.exceptions.length`
- `#if exception.reason`
- `#if exception.isPending`

