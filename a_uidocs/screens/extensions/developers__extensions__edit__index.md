# Screen: developers/extensions/edit/index

| Property | Value |
|----------|-------|
| **Engine** | Registry |
| **Route name** | `extensions.developers.extensions.edit` |
| **URL** | `/extensions/developers/extensions/edit` |
| **Template** | `packages/registry-bridge/addon/templates/developers/extensions/edit/index.hbs` |
| **Controller** | `packages\registry-bridge\addon\controllers\developers\extensions\edit\index.js` |
| **Route** | `packages\registry-bridge\addon\routes\developers\extensions\edit\index.js` |

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

- **Enter:** Navigate to `/extensions/developers/extensions/edit`
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
| `ExtensionForm` | TBD |

---

## 15. Composed components (full UI)

### `ExtensionForm`

**Source:** `packages\registry-bridge\addon\components\extension-form.hbs`

**Layout:** Collapsible content panels

| Field | Binding |
|-------|----------|
| t "registry-bridge.developers.extensions.extension-form.extension-name" | `—` |
| t "registry-bridge.developers.extensions.extension-form.extension-description" | `—` |
| t "registry-bridge.developers.extensions.extension-form.extension-category" | `—` |
| t "registry-bridge.developers.extensions.extension-form.extension-tags" | `—` |
| t "registry-bridge.developers.extensions.extension-form.extension-promotional-text" | `—` |
| t "registry-bridge.developers.extensions.extension-form.extension-subtitle" | `—` |
| t "registry-bridge.developers.extensions.extension-form.extension-copyright" | `—` |

**Buttons:** Select Bundle

#### Child: `ExtensionMonetizeForm`

| Field | Binding |
|-------|----------|
| t "registry-bridge.developers.extensions.extension-form.extension-subscription-billing-period" | `—` |
| t "registry-bridge.developers.extensions.extension-form.extension-subscription-amount" | `—` |
| t "registry-bridge.developers.extensions.extension-form.extension-price" | `—` |
| t "registry-bridge.developers.extensions.extension-form.extension-sale-price" | `—` |
| (input) | `@extension.subscription_amount` |


---

## 16. Source files to mirror

- Template: `packages/registry-bridge/addon/templates/developers/extensions/edit/index.hbs`
- Controller: `packages\registry-bridge\addon\controllers\developers\extensions\edit\index.js`
- Route: `packages\registry-bridge\addon\routes\developers\extensions\edit\index.js`


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
| `registry-bridge update extension-bundle` | redirect/warning — see route for target |

**Model load:** `store.queryRecord('registry-extension')`

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console`

### Controller state & services

**Injected services:** `notifications`, `intl`

**Tasks:** `save`, `startReview` — use `.perform()`, UI bound via `.isRunning`

- **Setup/teardown:** @action onIconUploaded
- **Setup/teardown:** @action submitForReview

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

