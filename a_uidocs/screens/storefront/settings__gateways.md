# Screen: settings/gateways

| Property | Value |
|----------|-------|
| **Engine** | Storefront |
| **Route name** | `storefront.settings.gateways` |
| **URL** | `/storefront/settings/gateways` |
| **Template** | `packages/storefront/addon/templates/settings/gateways.hbs` |
| **Controller** | `packages\storefront\addon\controllers\settings\gateways.js` |
| **Route** | `packages\storefront\addon\routes\settings\gateways.js` |

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
| t "storefront.settings.gateways.gateway-name" | `—` | text | |
| t "storefront.settings.gateways.gateway-code" | `—` | text | |
| t "storefront.settings.gateways.callback-url" | `—` | text | |
| t "storefront.settings.gateways.return-url" | `—` | text | |
| smart-humanize key | `—` | text | |

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
| t "storefront.settings.gateways.create-new-gateway" | `—` | |
| t "storefront.settings.gateways.delete-payment-gateway" | `—` | |
| Edit Gateway | `—` | |


---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- Template: `{{#if (is-bool-value value)}}`
- Template: `{{#if (can "storefront update gateway")}}`
- Template: `{{#if (can "storefront delete gateway")}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `store.query('gateway')` |


---

## 10. Permissions

- _Check abilities service in route beforeModel_

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/storefront/settings/gateways`
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
| `SettingsContainer` | TBD |
| `Button` | TBD |
| `ContentPanel` | TBD |
| `InputGroup` | TBD |
| `Checkbox` | TBD |

---

## 15. Composed components (full UI)

### `SettingsContainer`

**Source:** `packages\storefront\addon\components\settings-container.hbs`


---

## 16. Source files to mirror

- Template: `packages/storefront/addon/templates/settings/gateways.hbs`
- Controller: `packages\storefront\addon\controllers\settings\gateways.js`
- Route: `packages\storefront\addon\routes\settings\gateways.js`


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

**Injected services:** `notifications`, `intl`, `hostRouter`, `modalsManager`, `store`, `crud`, `storefront`

- **Setup/teardown:** @action createGateway
- **Setup/teardown:** @action editGateway
- **Setup/teardown:** @action deleteGateway

### Template conditionals

- `{{#if (is-bool-value value)}}` — branch UI visibility
- `{{#if (can "storefront update gateway")}}` — branch UI visibility
- `{{#if (can "storefront delete gateway")}}` — branch UI visibility

### Loading / empty states

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

