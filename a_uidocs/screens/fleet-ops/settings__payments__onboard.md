# Screen: settings/payments/onboard

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.settings.payments.onboard` |
| **URL** | `/fleet-ops/settings/payments/onboard` |
| **Template** | `packages/fleetops/addon/templates/settings/payments/onboard.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\settings\payments\onboard.js` |
| **Route** | `packages\fleetops\addon\routes\settings\payments\onboard.js` |

---

## 1. Layout structure

- Section header with title/actions
- Scrollable section body

```
[Section Header + actions]
[Section Body - scrollable form/panels]
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
| t "payment.settings.onboard.button-continue" | `—` | |
| if this.onboardInProgress (t "payment.settings.onboard.button-in-progress") (t "payment.settings.onboard.button-start") | `—` | |


---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- Template: `{{#if this.onboardCompleted}}`
- Template: `{{#if this.onboardCompleted}}`
- Template: `{{#if this.onboardCompleted}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `GET fleet-ops/payments/has-stripe-connect-account` |


---

## 10. Permissions

- `fleet-ops onboard payments`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/settings/payments/onboard`
- **Exit:** Standard back or transition per host router
- **Error/unauthorized:** redirect defined in route

---

## 13. Responsive / mobile

- Console shell uses `Layout::MobileNavbar` for primary nav on small screens
- Sidebar hidden on map-heavy FleetOps detail routes (see parent controller `sidebar.hideNow()`)
- Tables use horizontal scroll / pagination footer

---

## 14. Reusable component mapping

| Ember | Custom design system |
|-------|---------------------|
| `Layout::Section::Header` | TBD |
| `Layout::Section::Body` | TBD |
| `InfoBlock` | TBD |
| `Button` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/settings/payments/onboard.hbs`
- Controller: `packages\fleetops\addon\controllers\settings\payments\onboard.js`
- Route: `packages\fleetops\addon\routes\settings\payments\onboard.js`


---


---


---


---


---


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops onboard payments` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console.fleet-ops.settings.payments.index`
- On failure redirects to `console.fleet-ops.settings.payments.index`
- On failure redirects to `console.fleet-ops.settings.payments.index`
- On failure redirects to `console.fleet-ops.settings.payments.index`

### Controller state & services

**Injected services:** `fetch`, `notifications`

**Tasks:** `startOnboard` — use `.perform()`, UI bound via `.isRunning`

- **Setup/teardown:** @action createTrackedElement

### Template conditionals

- `{{#if this.onboardCompleted}}` — branch UI visibility
- `{{#if this.onboardCompleted}}` — branch UI visibility
- `{{#if this.onboardCompleted}}` — branch UI visibility

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

