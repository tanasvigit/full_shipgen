# Screen: settings/payments/index

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.settings.payments` |
| **URL** | `/fleet-ops/settings/payments` |
| **Template** | `packages/fleetops/addon/templates/settings/payments/index.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\settings\payments\index.js` |
| **Route** | `packages\fleetops\addon\routes\settings\payments\index.js` |

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
| Start payments onboard | `—` | |


---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- Template: `{{#if this.hasStripeConnectAccount}}`
- Template: `{{#if this.lookupStripeConnectAccount.isRunning}}`
- Template: `{{#if this.hasStripeConnectAccount}}`
- Template: `{{#if this.isStripeEnabled}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `GET fleet-ops/payments/payments-received` |


---

## 10. Permissions

- `fleet-ops list purchase-rate`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/settings/payments`
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
| `Table` | TBD |
| `InfoBlock` | TBD |
| `Button` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/settings/payments/index.hbs`
- Controller: `packages\fleetops\addon\controllers\settings\payments\index.js`
- Route: `packages\fleetops\addon\routes\settings\payments\index.js`


---

## Deep specification (auto-enriched)

### Controller actions/tabs (`packages/fleetops/addon/controllers/settings/payments/index.js`)

**Tabs:**
- Purchase Rate ID
- Service Quote
- Order
- Customer
- Amount
- Date



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


### Controller state & services

**Injected services:** _none_


### Template conditionals

- `{{#if this.hasStripeConnectAccount}}` — branch UI visibility
- `{{#if this.lookupStripeConnectAccount.isRunning}}` — branch UI visibility
- `{{#if this.hasStripeConnectAccount}}` — branch UI visibility
- `{{#if this.isStripeEnabled}}` — branch UI visibility

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

