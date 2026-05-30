# Screen: home

| Property | Value |
|----------|-------|
| **Engine** | Storefront |
| **Route name** | `storefront.home` |
| **URL** | `/storefront/home` |
| **Template** | `packages/storefront/addon/templates/home.hbs` |
| **Controller** | `packages\storefront\addon\controllers\home.js` |
| **Route** | `packages\storefront\addon\routes\home.js` |

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



---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- _See controller and component JS for business rules_

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | _Infer model from route/controller_ |


---

## 10. Permissions

- _Check abilities service in route beforeModel_

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/storefront/home`
- **Exit:** Standard back or transition per host router


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
| `Widget::StorefrontMetrics` | TBD |
| `Widget::Orders` | TBD |
| `Widget::Customers` | TBD |
| `Spacer` | TBD |

---

## 15. Composed components (full UI)

### `Widget::StorefrontMetrics`

**Source:** `packages\storefront\addon\components\widget\storefront-metrics.hbs`

### `Widget::Orders`

**Source:** `packages\storefront\addon\components\widget\orders.hbs`

**Layout:** Collapsible content panels

**Buttons:** t "storefront.common.view", if order.has_driver_assigned (t "storefront.component.widget.orders.change-driver") (t "storefront.component.widget.orders.assign-driver"), t "storefront.component.widget.orders.accept-order", t "storefront.component.widget.orders.mark-as-preparing", if order.meta.is_pickup (t "storefront.component.widget.orders.mark-as-ready") (t "storefront.component.widget.orders.dispatch"), t "storefront.component.widget.orders.mark-as-completed", t "storefront.component.widget.orders.cancel-order", if
                                                    order.has_driver_assigned
                                                    (t "storefront.component.modals.incoming-order.change-driver")
                                                    (t "storefront.component.modals.incoming-order.assign-driver")
                                                , t "storefront.component.widget.orders.accept-order", t "storefront.component.widget.orders.mark-as-preparing", if order.meta.is_pickup (t "storefront.component.widget.orders.mark-as-ready") (t "storefront.component.widget.orders.dispatch"), t "storefront.component.widget.orders.mark-as-completed"

#### Child: `DisplayPlace`


### `Widget::Customers`

**Source:** `packages\storefront\addon\components\widget\customers.hbs`

**Layout:** Collapsible content panels


---

## 16. Source files to mirror

- Template: `packages/storefront/addon/templates/home.hbs`
- Controller: `packages\storefront\addon\controllers\home.js`
- Route: `packages\storefront\addon\routes\home.js`


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

