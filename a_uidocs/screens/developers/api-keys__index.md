# Screen: api-keys/index

| Property | Value |
|----------|-------|
| **Engine** | Developers |
| **Route name** | `developers.api_keys` |
| **URL** | `/developers/api-keys` |
| **Template** | `packages/dev-engine/addon/templates/api-keys/index.hbs` |
| **Controller** | `packages\dev-engine\addon\controllers\api-keys\index.js` |
| **Route** | `packages\dev-engine\addon\routes\api-keys\index.js` |

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
| t "developers.common.new" | `—` | |
| t "developers.common.export" | `—` | |


---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_

- Template uses filter components — see Layout::Resource::Tabular filterPicker props

---

## 8. Validations & conditional logic

- Template: `{{#if this.isTestMode}}`
- Template: `{{#if (safe-has this.table "selectedRows")}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `store.query('api-credential')` |


---

## 10. Permissions

- `developers view api-key`
- `developers roll api-key`
- `developers view log`
- `developers delete api-key`
- `developers list api-key`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/developers/api-keys`
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
| `Toggle` | TBD |
| `Button` | TBD |
| `DropdownButton` | TBD |
| `Layout::Section::Body` | TBD |
| `Table` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/dev-engine/addon/templates/api-keys/index.hbs`
- Controller: `packages\dev-engine\addon\controllers\api-keys\index.js`
- Route: `packages\dev-engine\addon\routes\api-keys\index.js`


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
| `developers list api-key` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console.developers.home`

### Controller state & services

**Injected services:** `currentUser`, `intl`, `modalsManager`, `notifications`, `store`, `crud`, `fetch`, `theme`, `hostRouter`, `universe`, `abilities`

**Query params:** `page`, `limit`, `sort`

- **Setup/teardown:** @action toggleTestMode
- **Setup/teardown:** @action toggleTestKey
- **Setup/teardown:** @action createApiKey
- **Setup/teardown:** @action editApiKey
- **Setup/teardown:** @action renameApiKey
- **Setup/teardown:** @action deleteApiKey
- **Setup/teardown:** @action bulkDeleteApiCredentials
- **Setup/teardown:** @action rollApiKey
- **Setup/teardown:** @action viewRequestLogs
- **Setup/teardown:** @action exportApiKeys
- **Setup/teardown:** @action reload

### Template conditionals

- `{{#if this.isTestMode}}` — branch UI visibility
- `{{#if (safe-has this.table "selectedRows")}}` — branch UI visibility

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

