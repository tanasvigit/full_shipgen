# Screen: products/index/category/new

| Property | Value |
|----------|-------|
| **Engine** | Storefront |
| **Route name** | `storefront.products.index.category.new` |
| **URL** | `/storefront/products/index/category/new` |
| **Template** | `packages/storefront/addon/templates/products/index/category/new.hbs` |
| **Controller** | `packages\storefront\addon\controllers\products\index\category\new.js` |
| **Route** | `packages\storefront\addon\routes\products\index\category\new.js` |

---

## 1. Layout structure

- Right overlay panel
- Collapsible content panels

```
[Page outlet content]
```

---

## 2. Fields (form inputs)

| Label | Value binding | Type | Notes |
|-------|---------------|------|-------|
| Product Name | `this.product.name` | text | |
| Product Description | `this.product.description` | text | |
| Product Category | `this.product.status` | text | |
| Product Tags | `this.product.sku` | text | |
| Price | `this.product.price` | text | |
| Sale Price | `this.product.sale_price` | text | |

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
| this.overlayActionButtonTitle | `—` | |
| concat "New " (lowercase variant.name) " option" | `—` | |
| New Variant | `—` | |
| Remove Variant | `—` | |
| Edit Variant | `—` | |
| Select Addon Categories | `—` | |
| Make Primary | `—` | |


---

## 6. Modals, drawers, overlays

- `Overlay` — right-side panel (check @width, @onClose)

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- Template: `{{#if this.product.is_service}}`
- Template: `{{#if this.isUploading}}`
- Template: `{{#if dropzone.active}}`
- Template: `{{#if dropzone.valid}}`
- Template: `{{#if dropzone.supported}}`
- Template: `{{#if this.uploadQueue}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | _Infer model from route/controller_ |


---

## 10. Permissions

- `storefront create product`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/storefront/products/index/category/new`
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
| `Overlay` | TBD |
| `Overlay::Header` | TBD |
| `Button` | TBD |
| `Overlay::Body` | TBD |
| `ContentPanel` | TBD |
| `InputGroup` | TBD |
| `Textarea` | TBD |
| `ModelSelect` | TBD |
| `Select` | TBD |
| `TagInput` | TBD |
| `MoneyInput` | TBD |
| `MetadataEditor` | TBD |
| `TranslationsEditor` | TBD |
| `Checkbox` | TBD |
| `TabNavigation` | TBD |
| `ScheduleManager` | TBD |
| `FileDropzone` | TBD |
| `FileUpload` | TBD |
| `FileRecord` | TBD |
| `ArrayInput` | TBD |
| `InputLabel` | TBD |
| `Spacer` | TBD |

---

## 15. Composed components (full UI)

### `ScheduleManager`

**Source:** `packages\storefront\addon\components\schedule-manager.hbs`

**Buttons:** t "storefront.component.schedule-manager.add-hours"

### `FileRecord`

**Source:** `packages\storefront\addon\components\file-record.hbs`


---

## 16. Source files to mirror

- Template: `packages/storefront/addon/templates/products/index/category/new.hbs`
- Controller: `packages\storefront\addon\controllers\products\index\category\new.js`
- Route: `packages\storefront\addon\routes\products\index\category\new.js`


---

## Deep specification (auto-enriched)

### Controller actions/tabs (`packages/storefront/addon/controllers/products/index/category/new.js`)


**Actions:**
- Add Metafield



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
| `storefront create product` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console.storefront`

### Controller state & services

**Injected services:** `notifications`, `modalsManager`, `currentUser`, `store`, `intl`, `storefront`, `fetch`, `loader`, `crud`, `hostRouter`

**Tasks:** `saveProduct`, `promptSelectAddonCategories` — use `.perform()`, UI bound via `.isRunning`

- **Setup/teardown:** @action reset
- **Setup/teardown:** @action addTag
- **Setup/teardown:** @action removeTag
- **Setup/teardown:** @action queueFile
- **Setup/teardown:** @action removeFile
- **Setup/teardown:** @action makePrimaryFile
- **Setup/teardown:** @action transitionBack
- **Setup/teardown:** @action exit
- **Setup/teardown:** @action selectAddonCategory
- **Setup/teardown:** @action createProductVariant
- **Setup/teardown:** @action editProductVariant
- **Setup/teardown:** @action removeProductVariant
- **Setup/teardown:** @action addVariantOption
- **Setup/teardown:** @action removeVariantOption
- **Setup/teardown:** @action removeAddonCategory
- **Setup/teardown:** @action excludeAddon
- **Setup/teardown:** @action addMetaField
- **Setup/teardown:** @action removeMetaField

### Template conditionals

- `{{#if this.product.is_service}}` — branch UI visibility
- `{{#if this.isUploading}}` — branch UI visibility
- `{{#if dropzone.active}}` — branch UI visibility
- `{{#if dropzone.valid}}` — branch UI visibility
- `{{#if dropzone.supported}}` — branch UI visibility
- `{{#if this.uploadQueue}}` — branch UI visibility

### Loading / empty states

- Button/component `@isLoading` binds to async task running state
- Spinner shown during upload/async operations
- Waits for task `.isIdle` before rendering (e.g. 2FA settings)
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

