# Screen: products/index/new

| Property | Value |
|----------|-------|
| **Engine** | Pallet |
| **Route name** | `pallet.products.index.new` |
| **URL** | `/pallet/products/index/new` |
| **Template** | `packages/pallet/addon/templates/products/index/new.hbs` |
| **Controller** | `packages\pallet\addon\controllers\products\index\new.js` |
| **Route** | `packages\pallet\addon\routes\products\index\new.js` |

---

## 1. Layout structure

- Standard section outlet (infer from parent route template)

```
[Page outlet content]
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

- **Enter:** Navigate to `/pallet/products/index/new`
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
| `ProductFormPanel` | TBD |

---

## 15. Composed components (full UI)

### `ProductFormPanel`

**Source:** `packages\pallet\addon\components\product-form-panel.hbs`

**Layout:** Right overlay panel; Collapsible content panels

| Field | Binding |
|-------|----------|
| Name | `this.product.name` |
| Internal ID | `this.product.internal_id` |
| SKU | `this.product.sku` |
| Product Category | `this.product.description` |
| Price | `this.product.price` |
| Sale Price | `this.product.sale_price` |
| Declared Value | `this.product.declared_value` |
| Length | `this.product.length` |
| Width | `this.product.width` |
| Height | `this.product.height` |
| Weight | `this.product.weight` |

**Buttons:** if this.product.id "Save Product" "Add Product", Make Primary


---

## 16. Source files to mirror

- Template: `packages/pallet/addon/templates/products/index/new.hbs`
- Controller: `packages\pallet\addon\controllers\products\index\new.js`
- Route: `packages\pallet\addon\routes\products\index\new.js`


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

**Injected services:** `store`, `hostRouter`, `modalsManager`

- **Setup/teardown:** @action setOverlayContext
- **Setup/teardown:** @action transitionBack
- **Setup/teardown:** @action onAfterSave

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

