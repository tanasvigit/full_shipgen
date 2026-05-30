# Order detail tab: notes

| Property | Value |
|----------|-------|
| **Parent screen** | [Order detail complete](../MASTER__order-detail-complete.md) |
| **Component** | `Order::Details::Notes` |
| **Source** | `packages/fleetops/addon/components/order/details/notes.hbs` |

## Layout

- ContentPanel (bordered-top) with optional actionButtons

## Display fields & labels

| Field / i18n key |
|----------------|
| i18n:order.fields.notes-title |
| i18n:order.fields.notes-placeholder |
| i18n:order.fields.save-order-note |
| i18n:common.cancel |

## Buttons

- order.fields.save-order-note
- common.cancel

## Conditionals

- `#if this.isEditing`
- `#if @resource.notes`

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

**Injected services:** `intl`, `notifications`

**Tasks:** `save` — use `.perform()`, UI bound via `.isRunning`

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| Edit | `inline fn` | `this.isEditing === true` |

- **Setup/teardown:** @action stopEditing

### Template conditionals

- `{{#if this.isEditing}}` — branch UI visibility
- `{{#if @resource.notes}}` — branch UI visibility

### Loading / empty states

- Button/component `@isLoading` binds to async task running state
- Task `.isRunning` disables UI during ember-concurrency task

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

`packages/fleetops/addon/components/order/details/notes.js`

**Branches:**
- `#if this.isEditing`
- `#if @resource.notes`

