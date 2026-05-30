# Screen: warehouses/index/new

| Property | Value |
|----------|-------|
| **Engine** | Pallet |
| **Route name** | `pallet.warehouses.index.new` |
| **URL** | `/pallet/warehouses/index/new` |
| **Template** | `packages/pallet/addon/templates/warehouses/index/new.hbs` |
| **Controller** | `packages\pallet\addon\controllers\warehouses\index\new.js` |
| **Route** | `packages\pallet\addon\routes\warehouses\index\new.js` |

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

- **Enter:** Navigate to `/pallet/warehouses/index/new`
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
| `WarehouseFormPanel` | TBD |

---

## 15. Composed components (full UI)

### `WarehouseFormPanel`

**Source:** `packages\pallet\addon\components\warehouse-form-panel.hbs`

**Layout:** Right overlay panel; Collapsible content panels

| Field | Binding |
|-------|----------|
| Name | `this.warehouse.name` |
| Street 1 | `this.warehouse.street1` |
| Street 2 | `this.warehouse.street2` |
| Neighborhood | `this.warehouse.neighborhood` |
| Building | `this.warehouse.building` |
| Security Access Code | `this.warehouse.security_access_code` |
| Postal Code | `this.warehouse.postal_code` |
| City | `this.warehouse.city` |
| State | `this.warehouse.province` |
| Country | `this.warehouse.country` |
| Coordinates | `this.warehouse.location` |
| Phone | `this.warehouse.phone` |
| Description | `this.warehouse.meta.description` |
| (input) | `this.warehouse.name` |

**Buttons:** if this.warehouse.id "Save Warehouse" "Create Warehouse"

#### Child: `WarehouseEditor`

| Field | Binding |
|-------|----------|
| Name | `section.name` |
| Description | `section.description` |
| Name | `aisle.name` |
| Description | `aisle.description` |
| Name | `rack.name` |
| Description | `rack.description` |
| Name | `bin.bin_number` |
| Name | `section.name` |
| Description | `section.description` |
| Aisle Number | `aisle.aisle_number` |
| Rack Number | `rack.rack_number` |
| Rack Capacity | `rack.capacity` |
| Bin Number | `bin.bin_number` |
| Size | `bin.size` |
| Max Weight | `bin.max_weight` |
| Dock Number | `dock.dock_number` |
| Direction | `dock.direction` |
| Capacity | `dock.capacity` |
| (input) | `section.name` |


---

## 16. Source files to mirror

- Template: `packages/pallet/addon/templates/warehouses/index/new.hbs`
- Controller: `packages\pallet\addon\controllers\warehouses\index\new.js`
- Route: `packages\pallet\addon\routes\warehouses\index\new.js`


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

