# Order detail tab: detail

| Property | Value |
|----------|-------|
| **Parent screen** | [Order detail complete](../MASTER__order-detail-complete.md) |
| **Component** | `Order::Details::Detail` |
| **Source** | `packages/fleetops/addon/components/order/details/detail.hbs` |

## Layout

- ContentPanel (bordered-top) with optional actionButtons

## Display fields & labels

| Field / i18n key |
|----------------|
| ID |
| Earliest Arrival |
| Latest Arrival |
| Required Skills |
| Priority |
| i18n:order.fields.ad-hoc |
| i18n:order.fields.driver-assigned |
| i18n:order.fields.vehicle-assigned |
| i18n:order.fields.customer |
| i18n:order.fields.facilitator |
| i18n:common.internal-id |
| i18n:order.fields.tracking-number |
| i18n:order.fields.date-scheduled |
| i18n:order.fields.date-dispatched |
| i18n:order.fields.date-started |
| i18n:common.type |
| i18n:order.fields.proof-of-delivery |

## Buttons

_none_

## Conditionals

- `#if @resource.dispatched`
- `#if @resource.adhoc`
- `#if @resource.isMultiDrop`
- `#if @resource.pod_required`
- `#if (or @resource.time_window_start @resource.time_window_end @resource.required_skills.length @resource.orchestrator_priority)`
- `#if (or @resource.time_window_start @resource.time_window_end)`
- `#if @resource.required_skills.length`
- `#if @resource.orchestrator_priority`

## Child components

- `Driver::Pill`
- `Vehicle::Pill`
- `Order::CustomerAvatarStack`

## Custom UI notes

Rebuild as a tab panel inside OrderDetailPage. Bind to `order` model properties from doc 33.


---


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Controller state & services

**Injected services:** `orderActions`, `driverActions`, `leafletMapManager`, `intl`

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| common.edit | `inline fn` | `this.args.resource.status === 'canceled'` |
| (action) | `inline fn` | `this.args.resource.status === 'canceled'` |

- **Setup/teardown:** @action focusOrderAssignedDriver

### Template conditionals

- `{{#if @resource.dispatched}}` — branch UI visibility
- `{{#if @resource.adhoc}}` — branch UI visibility
- `{{#if @resource.isMultiDrop}}` — branch UI visibility
- `{{#if @resource.pod_required}}` — branch UI visibility
- `{{#if (or @resource.time_window_start @resource.time_window_end @resource.required_skills.length @resource.orchestrator_priority)}}` — branch UI visibility
- `{{#if (or @resource.time_window_start @resource.time_window_end)}}` — branch UI visibility
- `{{#if @resource.required_skills.length}}` — branch UI visibility
- `{{#if @resource.orchestrator_priority}}` — branch UI visibility

### Loading / empty states

- Button/component `@isLoading` binds to async task running state

### Service action flows

#### `order-actions.editOrderDetails()`


#### `order-actions.assignDriver()`


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

`packages/fleetops/addon/components/order/details/detail.js`

**Branches:**
- `#if @resource.dispatched`
- `#if @resource.adhoc`
- `#if @resource.isMultiDrop`
- `#if @resource.pod_required`
- `#if (or @resource.time_window_start @resource.time_window_end @resource.required_skills.length @resource.orchestrator_priority)`
- `#if (or @resource.time_window_start @resource.time_window_end)`
- `#if @resource.required_skills.length`
- `#if @resource.orchestrator_priority`

