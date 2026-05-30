# Order detail tab: payload

| Property | Value |
|----------|-------|
| **Parent screen** | [Order detail complete](../MASTER__order-detail-complete.md) |
| **Component** | `Order::Details::Payload` |
| **Source** | `packages/fleetops/addon/components/order/details/payload.hbs` |

## Layout

- ContentPanel (bordered-top) with optional actionButtons

## Display fields & labels

| Field / i18n key |
|----------------|
| i18n:order.fields.payload |
| i18n:order.fields.tracking |
| i18n:order.fields.waypoint-actions |
| i18n:order.fields.get-label |
| i18n:order.fields.view-activity |
| i18n:order.fields.add-item-button |

## Buttons

- order.fields.add-item-button

## Conditionals

- `#if @resource.isMultiDrop`
- `#if group.waypoint.customer`
- `#if group.waypoint.customer`

## Child components

- `Entity::Card`
- `Entity::Card`

## Custom UI notes

Rebuild as a tab panel inside OrderDetailPage. Bind to `order` model properties from doc 33.


---


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Controller state & services

**Injected services:** `entityActions`, `modalsManager`, `notifications`, `store`, `fetch`, `intl`

**Tasks:** `addEntity` — use `.perform()`, UI bound via `.isRunning`

- **Setup/teardown:** @action async

### Template conditionals

- `{{#if @resource.isMultiDrop}}` — branch UI visibility
- `{{#if group.waypoint.customer}}` — branch UI visibility
- `{{#if group.waypoint.customer}}` — branch UI visibility

### Loading / empty states

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

`packages/fleetops/addon/components/order/details/payload.js`

**Branches:**
- `#if @resource.isMultiDrop`
- `#if group.waypoint.customer`
- `#if group.waypoint.customer`

