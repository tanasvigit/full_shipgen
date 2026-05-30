# Screen: developers/extensions/edit/bundles

| Property | Value |
|----------|-------|
| **Engine** | Registry |
| **Route name** | `extensions.developers.extensions.edit.bundles` |
| **URL** | `/extensions/developers/extensions/edit/bundles` |
| **Template** | `packages/registry-bridge/addon/templates/developers/extensions/edit/bundles.hbs` |
| **Controller** | `packages\registry-bridge\addon\controllers\developers\extensions\edit\bundles.js` |
| **Route** | `packages\registry-bridge\addon\routes\developers\extensions\edit\bundles.js` |

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

- Template: `{{#if queue.files.length}}`
- Template: `{{#if this.lastError}}`
- Template: `{{#if @model.length}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `store.query('registry-extension-bundle')` |


---

## 10. Permissions

- _Check abilities service in route beforeModel_

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/extensions/developers/extensions/edit/bundles`
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
| `FileUpload` | TBD |
| `Badge` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/registry-bridge/addon/templates/developers/extensions/edit/bundles.hbs`
- Controller: `packages\registry-bridge\addon\controllers\developers\extensions\edit\bundles.js`
- Route: `packages\registry-bridge\addon\routes\developers\extensions\edit\bundles.js`


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

- `beforeModel`: auth/permission gate before fetch

### Controller state & services

**Injected services:** `store`, `fetch`, `hostRouter`, `notifications`

**Tasks:** `uploadBundle`, `createBundle` — use `.perform()`, UI bound via `.isRunning`


### Template conditionals

- `{{#if queue.files.length}}` — branch UI visibility
- `{{#if this.lastError}}` — branch UI visibility
- `{{#if @model.length}}` — branch UI visibility

### Loading / empty states

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

