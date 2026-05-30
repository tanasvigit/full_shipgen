# Screen: console/settings/two-fa

| Property | Value |
|----------|-------|
| **Engine** | Console |
| **Route name** | `console.console.settings.two_fa` |
| **URL** | `/console/settings/two-fa` |
| **Template** | `console/app/templates/console/settings/two-fa.hbs` |
| **Controller** | `console\app\controllers\console\settings\two-fa.js` |
| **Route** | `console\app\routes\console\settings\two-fa.js` |

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
| Save 2FA Settings | `—` | |


---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- Template: `{{#if this.loadCompanyTwoFaSettings.isIdle}}`

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

- **Enter:** Navigate to `/console/settings/two-fa`
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
| `Layout::Section::Header` | TBD |
| `Layout::Section::Body` | TBD |
| `ContentPanel` | TBD |
| `TwoFaSettings` | TBD |
| `Button` | TBD |
| `Spacer` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `console/app/templates/console/settings/two-fa.hbs`
- Controller: `console\app\controllers\console\settings\two-fa.js`
- Route: `console\app\routes\console\settings\two-fa.js`


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

**Injected services:** `fetch`, `notifications`

**Tasks:** `loadCompanyTwoFaSettings`, `loadSystemTwoFaConfig`, `loadUserTwoFaSettings`, `saveTwoFactorSettingsForCompany` — use `.perform()`, UI bound via `.isRunning`

- **Setup/teardown:** @action onTwoFaToggled
- **Setup/teardown:** @action onTwoFaMethodSelected
- **Setup/teardown:** @action onTwoFaEnforceToggled
- **Setup/teardown:** @action saveTwoFactor

### Template conditionals

- `{{#if this.loadCompanyTwoFaSettings.isIdle}}` — branch UI visibility

### Loading / empty states

- Button/component `@isLoading` binds to async task running state
- Spinner shown during upload/async operations
- Task `.isRunning` disables UI during ember-concurrency task
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

