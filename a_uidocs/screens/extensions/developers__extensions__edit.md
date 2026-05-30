# Screen: developers/extensions/edit

| Property | Value |
|----------|-------|
| **Engine** | Registry |
| **Route name** | `extensions.developers.extensions.edit` |
| **URL** | `/extensions/developers/extensions/edit` |
| **Template** | `packages/registry-bridge/addon/templates/developers/extensions/edit.hbs` |
| **Controller** | `packages\registry-bridge\addon\controllers\developers\extensions\edit.js` |
| **Route** | `packages\registry-bridge\addon\routes\developers\extensions\edit.js` |

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
| t "common.back" | `—` | |
| t "common.save" | `—` | |
| t "registry-bridge.developers.extensions.extension-form.submit-for-review" | `—` | |


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
| Data load | `store.queryRecord('registry-extension', ...)` |


---

## 10. Permissions

- `registry-bridge update extension-bundle`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/extensions/developers/extensions/edit`
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
| `Badge` | TBD |
| `Button` | TBD |
| `Layout::Section::Body` | TBD |
| `Spacer` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/registry-bridge/addon/templates/developers/extensions/edit.hbs`
- Controller: `packages\registry-bridge\addon\controllers\developers\extensions\edit.js`
- Route: `packages\registry-bridge\addon\routes\developers\extensions\edit.js`


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

