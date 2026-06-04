# Screen: console/admin/organizations/index/users

| Property | Value |
|----------|-------|
| **Engine** | Console |
| **Route name** | `console.console.admin.organizations.index.users` |
| **URL** | `/console/admin/organizations/index/users` |
| **Template** | `console/app/templates/console/admin/organizations/index/users.hbs` |
| **Controller** | `console\app\controllers\console\admin\organizations\index\users.js` |
| **Route** | `console\app\routes\console\admin\organizations\index\users.js` |

---

## 1. Layout structure

- Section header with title/actions
- Scrollable section body
- Right overlay panel

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

- `Overlay` — right-side panel (check @width, @onClose)

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- Template: `{{#if (gt @model.meta.total this.nestedLimit)}}`

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

- **Enter:** Navigate to `/console/admin/organizations/index/users`
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
| `Overlay` | TBD |
| `Overlay::Header` | TBD |
| `Button` | TBD |
| `Overlay::Body` | TBD |
| `Layout::Section::Header` | TBD |
| `Pagination` | TBD |
| `Layout::Section::Body` | TBD |
| `Table` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `console/app/templates/console/admin/organizations/index/users.hbs`
- Controller: `console\app\controllers\console\admin\organizations\index\users.js`
- Route: `console\app\routes\console\admin\organizations\index\users.js`


---

## Deep specification (auto-enriched)

### Controller actions/tabs (`console/app/controllers/console/admin/organizations/index/users.js`)

**Tabs:**
- Impersonate
- Change Password



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

**Injected services:** `filters`, `intl`, `router`, `fetch`, `notifications`, `modalsManager`, `session`

**Query params:** `nestedPage`, `nestedLimit`, `nestedSort`, `nestedQuery`

- **Setup/teardown:** @action async
- **Setup/teardown:** @action changeUserPassword
- **Setup/teardown:** @action search
- **Setup/teardown:** @action setOverlayContext
- **Setup/teardown:** @action onPressClose

### Template conditionals

- `{{#if (gt @model.meta.total this.nestedLimit)}}` — branch UI visibility

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

