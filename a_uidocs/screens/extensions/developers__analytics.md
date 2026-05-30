# Screen: developers/analytics

| Property | Value |
|----------|-------|
| **Engine** | Registry |
| **Route name** | `extensions.developers.analytics` |
| **URL** | `/extensions/developers/analytics` |
| **Template** | `packages/registry-bridge/addon/templates/developers/analytics.hbs` |
| **Controller** | `packages\registry-bridge\addon\controllers\developers\analytics.js` |
| **Route** | `packages\registry-bridge\addon\routes\developers\analytics.js` |

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



---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- Template: `{{#if (eq this.selectedExtension.id extension.id)}}`
- Template: `{{#if this.getExtensionAnalytics.isRunning}}`
- Template: `{{#if this.selectedExtension}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `store.query('registry-extension')` |


---

## 10. Permissions

- `registry-bridge list extension-analytic`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/extensions/developers/analytics`
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
| `DropdownButton` | TBD |
| `Layout::Section::Body` | TBD |
| `ExtensionModalTitle` | TBD |
| `StatWidget` | TBD |
| `Image` | TBD |

---

## 15. Composed components (full UI)

### `ExtensionModalTitle`

**Source:** `packages\registry-bridge\addon\components\extension-modal-title.hbs`


---

## 16. Source files to mirror

- Template: `packages/registry-bridge/addon/templates/developers/analytics.hbs`
- Controller: `packages\registry-bridge\addon\controllers\developers\analytics.js`
- Route: `packages\registry-bridge\addon\routes\developers\analytics.js`


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
| `registry-bridge list extension-analytic` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console`

### Controller state & services

**Injected services:** `fetch`, `notifications`

**Tasks:** `getExtensionAnalytics` — use `.perform()`, UI bound via `.isRunning`

- **Setup/teardown:** @action selectExtension

### Template conditionals

- `{{#if (eq this.selectedExtension.id extension.id)}}` — branch UI visibility
- `{{#if this.getExtensionAnalytics.isRunning}}` — branch UI visibility
- `{{#if this.selectedExtension}}` — branch UI visibility

### Loading / empty states

- Spinner shown during upload/async operations
- Task `.isRunning` disables UI during ember-concurrency task
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

