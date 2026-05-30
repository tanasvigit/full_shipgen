# Screen: webhooks/view

| Property | Value |
|----------|-------|
| **Engine** | Developers |
| **Route name** | `developers.webhooks.view` |
| **URL** | `/developers/webhooks/view` |
| **Template** | `packages/dev-engine/addon/templates/webhooks/view.hbs` |
| **Controller** | `packages\dev-engine\addon\controllers\webhooks\view.js` |
| **Route** | `packages\dev-engine\addon\routes\webhooks\view.js` |

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
| t "developers.webhooks.view.send-button-text" | `—` | |
| t "developers.webhooks.view.disable-button-text" | `—` | |
| t "developers.webhooks.view.enable-button-text" | `—` | |
| t "developers.webhooks.view.delete-button-text" | `—` | |


---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- Template: `{{#if @model.isTestMode}}`
- Template: `{{#if @model.isEnabled}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | _Infer model from route/controller_ |


---

## 10. Permissions

- `developers view webhook`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/developers/webhooks/view`
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
| `Layout::Section::Header` | TBD |
| `Button` | TBD |
| `Layout::Section::Body` | TBD |
| `Webhook::Metrics` | TBD |
| `Webhook::Details` | TBD |
| `Webhook::Attempts` | TBD |
| `Spacer` | TBD |

---

## 15. Composed components (full UI)

### `Webhook::Metrics`

**Source:** `packages\dev-engine\addon\components\webhook\metrics.hbs`

### `Webhook::Details`

**Source:** `packages\dev-engine\addon\components\webhook\details.hbs`

**Buttons:** t "developers.component.webhook.details.update-details"

### `Webhook::Attempts`

**Source:** `packages\dev-engine\addon\components\webhook\attempts.hbs`


---

## 16. Source files to mirror

- Template: `packages/dev-engine/addon/templates/webhooks/view.hbs`
- Controller: `packages\dev-engine\addon\controllers\webhooks\view.js`
- Route: `packages\dev-engine\addon\routes\webhooks\view.js`


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
| `developers view webhook` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console.developers.webhooks.index`

### Controller state & services

**Injected services:** `modalsManager`, `intl`, `notifications`, `fetch`, `universe`, `hostRouter`, `abilities`

- **Setup/teardown:** @action deleteWebhook
- **Setup/teardown:** @action disableWebhook
- **Setup/teardown:** @action enableWebhook
- **Setup/teardown:** @action updateWebhookDetails
- **Setup/teardown:** @action reload

### Template conditionals

- `{{#if @model.isTestMode}}` — branch UI visibility
- `{{#if @model.isEnabled}}` — branch UI visibility

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

