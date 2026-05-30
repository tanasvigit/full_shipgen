# driver detail tab: index

| Property | Value |
|----------|-------|
| **Parent screen** | [driver detail complete](../MASTER__driver-detail-complete.md) |
| **Route** | `fleet-ops.management.drivers.index.details.index` |
| **Component** | `Driver::Details` |
| **Template** | `templates/management/drivers/index/details/index.hbs` |

## Layout

- ContentPanel section(s) with optional `@actionButtons`

## Display fields & labels

| Field / i18n key |
|----------------|
| Skills & Certifications |
| Max Driving Time |
| Max Distance |
| i18n:driver.fields.user-account |
| i18n:common.name |
| i18n:common.email |
| i18n:common.phone |
| i18n:driver.fields.driver-details |
| i18n:common.id |
| i18n:common.internal-id |
| i18n:driver.fields.driver-license |
| i18n:common.city |
| i18n:common.country |
| i18n:common.coordinates |
| i18n:common.metadata |

## Buttons

_see actionButtons in component JS_

## Conditionals

- `#if (or @resource.skills.length @resource.max_distance @resource.max_travel_time)`
- `#if @resource.skills.length`
- `#if @resource.max_travel_time`
- `#if @resource.max_distance`

## Child components

- `ContentPanel`
- `ClickToCopy`
- `ClickToCopy`
- `ContentPanel`
- `ClickToCopy`
- `CountryName`
- `CustomField::Yield`
- `RegistryYield`
- `RegistryComponent`
- `ContentPanel`
- `ContentPanel`
- `MetadataViewer`

## Custom UI notes

Rebuild as a tab inside driver detail. Model: `driver` (doc 33).


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Controller state & services

**Injected services:** `resourceMetadata`


### Template conditionals

- `{{#if (or @resource.skills.length @resource.max_distance @resource.max_travel_time)}}` — branch UI visibility
- `{{#if @resource.skills.length}}` — branch UI visibility
- `{{#if @resource.max_travel_time}}` — branch UI visibility
- `{{#if @resource.max_distance}}` — branch UI visibility

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

`packages/fleetops/addon/components/driver/details.js`

**Branches:**
- `#if (or @resource.skills.length @resource.max_distance @resource.max_travel_time)`
- `#if @resource.skills.length`
- `#if @resource.max_travel_time`
- `#if @resource.max_distance`

