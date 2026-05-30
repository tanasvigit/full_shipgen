# place detail tab: activity

| Property | Value |
|----------|-------|
| **Parent screen** | [place detail complete](../MASTER__place-detail-complete.md) |
| **Route** | `fleet-ops.management.places.index.details.activity` |
| **Component** | `Place::Activity` |
| **Template** | `templates/management/places/index/details/activity.hbs` |

## Layout

- See template / component source

## Display fields & labels

| Field / i18n key |
|----------------|
| _parse template manually_ |

## Buttons

_see actionButtons in component JS_

## Conditionals

_none_

## Child components

_none_

## Custom UI notes

Rebuild as a tab inside place detail. Model: `place` (doc 33).


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Controller state & services

**Injected services:** _none_


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

`packages/fleetops/addon/components/place/activity.js`

