# vehicle detail tab: positions

| Property | Value |
|----------|-------|
| **Parent screen** | [vehicle detail complete](../MASTER__vehicle-detail-complete.md) |
| **Route** | `fleet-ops.management.vehicles.index.details.positions` |
| **Component** | `Vehicle::Positions` |
| **Template** | `templates/management/vehicles/index/details/positions.hbs` |

## Layout

- See template / component source

## Display fields & labels

| Field / i18n key |
|----------------|
| i18n:common.clear |

## Buttons

_see actionButtons in component JS_

## Conditionals

_none_

## Child components

- `PositionsReplay`

## Custom UI notes

Rebuild as a tab inside vehicle detail. Model: `vehicle` (doc 33).


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Controller state & services

**Injected services:** `store`, `fetch`, `positionPlayback`, `notifications`, `location`

**Tasks:** `loadPositions`, `loadMetrics` — use `.perform()`, UI bound via `.isRunning`

- **Setup/teardown:** @action didLoadMap
- **Setup/teardown:** @action onOrderSelected
- **Setup/teardown:** @action onDateRangeChanged
- **Setup/teardown:** @action onSpeedChanged
- **Setup/teardown:** @action startReplay
- **Setup/teardown:** @action pauseReplay
- **Setup/teardown:** @action stopReplay
- **Setup/teardown:** @action stepForward
- **Setup/teardown:** @action stepBackward
- **Setup/teardown:** @action clearFilters
- **Setup/teardown:** @action onPositionClicked
- **Setup/teardown:** @action onTrackingMarkerAdded

### Template conditionals

- `{{#if this.loadPositions.isRunning}}` — branch UI visibility
- `{{#if this.resource}}` — branch UI visibility
- `{{#if (eq this.resourceType "vehicle")}}` — branch UI visibility
- `{{#if (eq this.resourceType "vehicle")}}` — branch UI visibility
- `{{#if (or this.isReplaying this.isPaused)}}` — branch UI visibility
- `{{#if this.isReplaying}}` — branch UI visibility
- `{{#if (or this.isReplaying this.isPaused)}}` — branch UI visibility
- `{{#if this.hasPositions}}` — branch UI visibility
- `{{#if this.hasPositions}}` — branch UI visibility
- `{{#if this.hasPositions}}` — branch UI visibility
- `{{#if this.loadPositions.isIdle}}` — branch UI visibility

### Loading / empty states

- Spinner shown during upload/async operations
- Task `.isRunning` disables UI during ember-concurrency task
- Waits for task `.isIdle` before rendering (e.g. 2FA settings)
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

`packages/fleetops/addon/components/positions-replay.js`

**Behavior:** GPS replay via `positionPlayback` service; date filter; map markers; play/pause; fetches positions for driver or vehicle resource.

**Branches:**
- `#if this.loadPositions.isRunning`
- `#if this.resource`
- `#if (eq this.resourceType "vehicle")`
- `#if (eq this.resourceType "vehicle")`
- `#if (or this.isReplaying this.isPaused)`
- `#if this.isReplaying`
- `#if (or this.isReplaying this.isPaused)`
- `#if this.hasPositions`
- `#if this.hasPositions`
- `#if this.hasPositions`
- `#if this.loadPositions.isIdle`

