# Order detail tab: purchase-rate

| Property | Value |
|----------|-------|
| **Parent screen** | [Order detail complete](../MASTER__order-detail-complete.md) |
| **Component** | `Order::Details::Purchase-rate` |
| **Source** | `packages/fleetops/addon/components/order/details/purchase-rate.hbs` |

## Layout

- ContentPanel (bordered-top) with optional actionButtons

## Display fields & labels

| Field / i18n key |
|----------------|
| i18n:order.fields.purchase-rate-panel-title |
| i18n:order.fields.breakdown |
| i18n:common.total |

## Buttons

_none_

## Conditionals

- `#if @resource.purchase_rate`

## Child components



## Custom UI notes

Rebuild as a tab panel inside OrderDetailPage. Bind to `order` model properties from doc 33.


---


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Controller state & services

**Injected services:** _none_


### Template conditionals

- `{{#if @resource.purchase_rate}}` — branch UI visibility

### Loading / empty states

- Button/component `@isLoading` binds to async task running state

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

`packages/fleetops/addon/components/order/details/purchase-rate.js`

**Branches:**
- `#if @resource.purchase_rate`

