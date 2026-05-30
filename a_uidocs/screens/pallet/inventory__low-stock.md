# Screen: inventory/low-stock

| Property | Value |
|----------|-------|
| **Engine** | Pallet |
| **Route name** | `pallet.inventory.low_stock` |
| **URL** | `/pallet/inventory/low-stock` |
| **Template** | `packages/pallet/addon/templates/inventory/low-stock.hbs` |
| **Controller** | `packages\pallet\addon\controllers\inventory\low-stock.js` |
| **Route** | `packages\pallet\addon\routes\inventory\low-stock.js` |

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

- Template uses filter components — see Layout::Resource::Tabular filterPicker props

---

## 8. Validations & conditional logic

- _See controller and component JS for business rules_

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `store.query('inventory')` |


---

## 10. Permissions

- _Check abilities service in route beforeModel_

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/pallet/inventory/low-stock`
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
| `FiltersPicker` | TBD |
| `VisibleColumnPicker` | TBD |
| `Layout::Section::Body` | TBD |
| `Table` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/pallet/addon/templates/inventory/low-stock.hbs`
- Controller: `packages\pallet\addon\controllers\inventory\low-stock.js`
- Route: `packages\pallet\addon\routes\inventory\low-stock.js`


---

## Deep specification (auto-enriched)

### Controller actions/tabs (`packages/pallet/addon/controllers/inventory/low-stock.js`)

**Tabs:**
- Product
- Product SKU
- Quantity
- Batch
- Status
- Last Stocked
- Updated At
- View Inventory
- Edit Inventory



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

**Injected services:** `notifications`, `modalsManager`, `store`, `fetch`, `filters`, `hostRouter`, `crud`

**Query params:** `page`, `limit`, `sort`, `product`, `warehouse`, `batch`, `status`, `view`

- **Setup/teardown:** @action exportProcuts
- **Setup/teardown:** @action viewInventory
- **Setup/teardown:** @action createInventory
- **Setup/teardown:** @action makeStockAdjustment
- **Setup/teardown:** @action async

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

