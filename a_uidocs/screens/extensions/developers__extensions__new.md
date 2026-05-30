# Screen: developers/extensions/new

| Property | Value |
|----------|-------|
| **Engine** | Registry |
| **Route name** | `extensions.developers.extensions.new` |
| **URL** | `/extensions/developers/extensions/new` |
| **Template** | `packages/registry-bridge/addon/templates/developers/extensions/new.hbs` |
| **Controller** | `packages\registry-bridge\addon\controllers\developers\extensions\new.js` |
| **Route** | `packages\registry-bridge\addon\routes\developers\extensions\new.js` |

---

## 1. Layout structure

- Section header with title/actions
- Scrollable section body
- Collapsible content panels

```
[Section Header + actions]
[Section Body - scrollable form/panels]
```

---

## 2. Fields (form inputs)

| Label | Value binding | Type | Notes |
|-------|---------------|------|-------|
| t "registry-bridge.developers.extensions.extension-form.extension-name" | `—` | text | |
| t "registry-bridge.developers.extensions.extension-form.extension-description" | `—` | text | |

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
| Continue | `—` | |
| Cancel | `—` | |


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

- `registry-bridge create extension-bundle`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/extensions/developers/extensions/new`
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
| `Layout::Section::Body` | TBD |
| `ContentPanel` | TBD |
| `InputGroup` | TBD |
| `Textarea` | TBD |
| `Button` | TBD |
| `Spacer` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/registry-bridge/addon/templates/developers/extensions/new.hbs`
- Controller: `packages\registry-bridge\addon\controllers\developers\extensions\new.js`
- Route: `packages\registry-bridge\addon\routes\developers\extensions\new.js`


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
| `registry-bridge create extension-bundle` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console`

### Controller state & services

**Injected services:** `store`, `universe`, `hostRouter`, `notifications`

**Tasks:** `save` — use `.perform()`, UI bound via `.isRunning`

- **Setup/teardown:** @action cancel

### Loading / empty states

- Button/component `@isLoading` binds to async task running state
- Waits for task `.isIdle` before rendering (e.g. 2FA settings)

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

