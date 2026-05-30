# Screen: networks/index/network/stores

| Property | Value |
|----------|-------|
| **Engine** | Storefront |
| **Route name** | `storefront.networks.index.network.stores` |
| **URL** | `/storefront/networks/index/network/stores` |
| **Template** | `packages/storefront/addon/templates/networks/index/network/stores.hbs` |
| **Controller** | `packages\storefront\addon\controllers\networks\index\network\stores.js` |
| **Route** | `packages\storefront\addon\routes\networks\index\network\stores.js` |

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
| t "storefront.networks.index.network.stores.add-stores-button-text" | `—` | |
| t "storefront.networks.index.network.stores.invite-stores-button-text" | `—` | |
| Edit Category | `—` | |
| Delete Category | `—` | |


---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- Template: `{{#if this.categoryModel}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `store.query('store')` |


---

## 10. Permissions

- _Check abilities service in route beforeModel_

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/storefront/networks/index/network/stores`
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
| `Button` | TBD |
| `Layout::Section::Body` | TBD |
| `NetworkCategoryPicker` | TBD |
| `Table` | TBD |

---

## 15. Composed components (full UI)

### `NetworkCategoryPicker`

**Source:** `packages\storefront\addon\components\network-category-picker.hbs`


---

## 16. Source files to mirror

- Template: `packages/storefront/addon/templates/networks/index/network/stores.hbs`
- Controller: `packages\storefront\addon\controllers\networks\index\network\stores.js`
- Route: `packages\storefront\addon\routes\networks\index\network\stores.js`


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

**Injected services:** `notifications`, `intl`, `modalsManager`, `crud`, `fetch`, `store`, `hostRouter`

**Query params:** `category`, `status`, `storeQuery`

- **Setup/teardown:** @action setCategoryPickerContext
- **Setup/teardown:** @action selectCategory
- **Setup/teardown:** @action deleteCategory
- **Setup/teardown:** @action async
- **Setup/teardown:** @action assignStoreToCategory
- **Setup/teardown:** @action addStoreToCategory
- **Setup/teardown:** @action createNewCategory
- **Setup/teardown:** @action editCategory
- **Setup/teardown:** @action async
- **Setup/teardown:** @action async
- **Setup/teardown:** @action viewStoreDetails
- **Setup/teardown:** @action editStore
- **Setup/teardown:** @action invite

### Template conditionals

- `{{#if this.categoryModel}}` — branch UI visibility

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

