# Screen: orders/index

| Property | Value |
|----------|-------|
| **Engine** | Storefront |
| **Route name** | `storefront.orders` |
| **URL** | `/storefront/orders` |
| **Template** | `packages/storefront/addon/templates/orders/index.hbs` |
| **Controller** | `packages\storefront\addon\controllers\orders\index.js` |
| **Route** | `packages\storefront\addon\routes\orders\index.js` |

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
| t "storefront.common.export" | `—` | |


---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_

- Template uses filter components — see Layout::Resource::Tabular filterPicker props

---

## 8. Validations & conditional logic

- Template: `{{#if (safe-has this.table "selectedRows")}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `store.query('order')` |


---

## 10. Permissions

- `fleet-ops view order`
- `fleet-ops dispatch order`
- `fleet-ops cancel order`
- `fleet-ops delete order`
- `storefront list order`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/storefront/orders`
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
| `FiltersPicker` | TBD |
| `VisibleColumnPicker` | TBD |
| `DropdownButton` | TBD |
| `Button` | TBD |
| `Layout::Section::Body` | TBD |
| `Table` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/storefront/addon/templates/orders/index.hbs`
- Controller: `packages\storefront\addon\controllers\orders\index.js`
- Route: `packages\storefront\addon\routes\orders\index.js`


---

## Deep specification (auto-enriched)

### Controller actions/tabs (`packages/storefront/addon/controllers/orders/index.js`)

**Tabs:**
- # Items



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
| `storefront list order` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console.storefront`

### Controller state & services

**Injected services:** `notifications`, `intl`, `modalsManager`, `crud`, `fetch`, `filters`, `hostRouter`, `storefront`

**Query params:** `page`, `limit`, `sort`, `query`, `public_id`, `internal_id`, `payload`, `tracking_number`, `facilitator`, `customer`, `driver`, `pickup`, `dropoff`, `created_by`, `updated_by`, `status`, ``

- **Setup/teardown:** @action viewOrder
- **Setup/teardown:** @action cancelOrder
- **Setup/teardown:** @action dispatchOrder
- **Setup/teardown:** @action deleteOrder
- **Setup/teardown:** @action bulkDeleteOrders
- **Setup/teardown:** @action bulkCancelOrders
- **Setup/teardown:** @action bulkDispatchOrders

### Template conditionals

- `{{#if (safe-has this.table "selectedRows")}}` — branch UI visibility

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

