# Screen: settings/index

| Property | Value |
|----------|-------|
| **Engine** | Storefront |
| **Route name** | `storefront.settings` |
| **URL** | `/storefront/settings` |
| **Template** | `packages/storefront/addon/templates/settings/index.hbs` |
| **Controller** | `packages\storefront\addon\controllers\settings\index.js` |
| **Route** | `packages\storefront\addon\routes\settings\index.js` |

---

## 1. Layout structure

- Collapsible content panels

```
[Page outlet content]
```

---

## 2. Fields (form inputs)

| Label | Value binding | Type | Notes |
|-------|---------------|------|-------|
| t "storefront.common.description" | `—` | text | |
| t "storefront.common.tag" | `—` | text | |
| t "storefront.common.currency" | `—` | text | |
| t "storefront.common.phone" | `—` | text | |
| t "storefront.common.website" | `—` | text | |
| t "storefront.common.facebook" | `—` | text | |
| t "storefront.common.instagram" | `—` | text | |
| t "storefront.common.twitter" | `—` | text | |
| t "storefront.common.logo" | `—` | text | |
| t "storefront.common.backdrop" | `—` | text | |
| t "storefront.settings.index.new-order-alert" | `—` | text | |
| t "storefront.settings.index.name-select" | `—` | text | |
| Default Order Config | `@model.order_config_uuid` | text | |
| (input) | `@model.phone` | primary | |

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
| t "storefront.settings.index.save-changes" | `—` | |


---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- Template: `{{#if queue.files.length}}`
- Template: `{{#if queue.files.length}}`
- Template: `{{#if this.isUploading}}`
- Template: `{{#if dropzone.active}}`
- Template: `{{#if dropzone.valid}}`
- Template: `{{#if dropzone.supported}}`
- Template: `{{#if this.uploadQueue}}`
- Template: `{{#if @model.options.tax_enabled}}`
- Template: `{{#if @model.options.required_checkout_min}}`
- Template: `{{#if @model.options.require_pod}}`
- Template: `{{#if @model.options.integrated_vendors_enabled}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | _Infer model from route/controller_ |


---

## 10. Permissions

- `storefront view settings`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/storefront/settings`
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
| `InputGroup` | TBD |
| `TagInput` | TBD |
| `CurrencySelect` | TBD |
| `Select` | TBD |
| `ContentPanel` | TBD |
| `PhoneInput` | TBD |
| `FileUpload` | TBD |
| `PageLoader` | TBD |
| `FileDropzone` | TBD |
| `FileRecord` | TBD |
| `ModelSelectMultiple` | TBD |
| `Toggle` | TBD |
| `MoneyInput` | TBD |
| `Button` | TBD |
| `Spacer` | TBD |

---

## 15. Composed components (full UI)

### `FileRecord`

**Source:** `packages\storefront\addon\components\file-record.hbs`


---

## 16. Source files to mirror

- Template: `packages/storefront/addon/templates/settings/index.hbs`
- Controller: `packages\storefront\addon\controllers\settings\index.js`
- Route: `packages\storefront\addon\routes\settings\index.js`


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
| `storefront view settings` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `afterModel`: secondary loads after primary model
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console`

### Controller state & services

**Injected services:** `intl`

**Tabs:**
- route: settings.index
- route: settings.locations
- route: settings.gateways
- route: settings.api
- route: settings.notifications


### Template conditionals

- `{{#if queue.files.length}}` — branch UI visibility
- `{{#if queue.files.length}}` — branch UI visibility
- `{{#if this.isUploading}}` — branch UI visibility
- `{{#if dropzone.active}}` — branch UI visibility
- `{{#if dropzone.valid}}` — branch UI visibility
- `{{#if dropzone.supported}}` — branch UI visibility
- `{{#if this.uploadQueue}}` — branch UI visibility
- `{{#if @model.options.tax_enabled}}` — branch UI visibility
- `{{#if @model.options.required_checkout_min}}` — branch UI visibility
- `{{#if @model.options.require_pod}}` — branch UI visibility
- `{{#if @model.options.integrated_vendors_enabled}}` — branch UI visibility

### Loading / empty states

- Button/component `@isLoading` binds to async task running state
- Spinner shown during upload/async operations
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

