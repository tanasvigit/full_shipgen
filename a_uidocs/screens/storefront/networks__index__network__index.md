# Screen: networks/index/network/index

| Property | Value |
|----------|-------|
| **Engine** | Storefront |
| **Route name** | `storefront.networks.index.network` |
| **URL** | `/storefront/networks/index/network` |
| **Template** | `packages/storefront/addon/templates/networks/index/network/index.hbs` |
| **Controller** | `packages\storefront\addon\controllers\networks\index\network\index.js` |
| **Route** | `packages\storefront\addon\routes\networks\index\network\index.js` |

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
| t "storefront.networks.index.network.index.general-network-settings-form.name" | `—` | text | |
| t "storefront.networks.index.network.index.general-network-settings-form.description" | `—` | text | |
| t "storefront.networks.index.network.index.general-network-settings-form.currency" | `—` | text | |
| t "storefront.networks.index.network.index.general-network-settings-form.contact-social-panel.phone" | `—` | text | |
| t "storefront.networks.index.network.index.general-network-settings-form.contact-social-panel.email" | `—` | text | |
| t "storefront.networks.index.network.index.general-network-settings-form.contact-social-panel.website" | `—` | text | |
| t "storefront.networks.index.network.index.general-network-settings-form.contact-social-panel.facebook" | `—` | text | |
| t "storefront.networks.index.network.index.general-network-settings-form.contact-social-panel.instagram" | `—` | text | |
| t "storefront.networks.index.network.index.general-network-settings-form.contact-social-panel.twitter" | `—` | text | |
| t "storefront.networks.index.network.index.general-network-settings-form.logo-backdrop-panel.logo-label" | `—` | text | |
| t "storefront.networks.index.network.index.general-network-settings-form.logo-backdrop-panel.backdrop-label" | `—` | text | |
| t "storefront.networks.index.network.index.general-network-settings-form.alert-panel.new-order-alert-label" | `—` | text | |
| t "storefront.networks.index.network.index.api-panel.network-key-label" | `—` | text | |
| t "storefront.networks.index.network.index.payment-gateways-panel.gateway-form.name" | `—` | text | |
| t "storefront.networks.index.network.index.payment-gateways-panel.gateway-form.code" | `—` | text | |
| t "storefront.networks.index.network.index.payment-gateways-panel.gateway-form.callback-url" | `—` | text | |
| t "storefront.networks.index.network.index.payment-gateways-panel.gateway-form.return-url" | `—` | text | |
| humanize key | `—` | text | |
| Default Order Config | `@model.order_config_uuid` | text | |
| (input) | `@model.phone` | danger | |

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
| t "storefront.networks.index.network.index.general-network-settings-form.save-changes-button-text" | `—` | |
| t "storefront.networks.index.network.index.payment-gateways-panel.new-gateway-button-text" | `—` | |
| t "storefront.networks.index.network.index.payment-gateways-panel.gateway-form.delete-gateway-button-text" | `—` | |
| t "storefront.networks.index.network.index.notification-channels-panel.new-channel-button-text" | `—` | |
| t "storefront.common.edit" | `—` | |
| t "storefront.common.delete" | `—` | |


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
- Template: `{{#if @model.options.tax_enabled}}`
- Template: `{{#if @model.options.required_checkout_min}}`
- Template: `{{#if @model.options.require_pod}}`
- Template: `{{#if (is-bool-value value)}}`

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

- **Enter:** Navigate to `/storefront/networks/index/network`
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
| `ContentPanel` | TBD |
| `InputGroup` | TBD |
| `CurrencySelect` | TBD |
| `Select` | TBD |
| `PhoneInput` | TBD |
| `FileUpload` | TBD |
| `ModelSelectMultiple` | TBD |
| `Toggle` | TBD |
| `MoneyInput` | TBD |
| `Button` | TBD |
| `ClickToReveal` | TBD |
| `Checkbox` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/storefront/addon/templates/networks/index/network/index.hbs`
- Controller: `packages\storefront\addon\controllers\networks\index\network\index.js`
- Route: `packages\storefront\addon\routes\networks\index\network\index.js`


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
| `storefront view network` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console.storefront`

### Controller state & services

**Injected services:** `modalsManager`, `intl`

**Tabs:**
- route: networks.index.network.index
- route: networks.index.network.stores
- route: networks.index.network.orders
- route: networks.index.network.customers

- **Setup/teardown:** @action transitionBack
- **Setup/teardown:** @action exit

### Template conditionals

- `{{#if queue.files.length}}` — branch UI visibility
- `{{#if queue.files.length}}` — branch UI visibility
- `{{#if @model.options.tax_enabled}}` — branch UI visibility
- `{{#if @model.options.required_checkout_min}}` — branch UI visibility
- `{{#if @model.options.require_pod}}` — branch UI visibility
- `{{#if (is-bool-value value)}}` — branch UI visibility

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

