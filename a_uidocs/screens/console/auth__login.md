# Screen: auth/login

| Property | Value |
|----------|-------|
| **Engine** | Console |
| **Route name** | `console.auth.login` |
| **URL** | `/auth/login` |
| **Template** | `console/app/templates/auth/login.hbs` |
| **Controller** | `console\app\controllers\auth\login.js` |
| **Route** | `console\app\routes\auth\login.js` |

---

## 1. Layout structure

- Extension registry injection slot

```
[Page outlet content]
```

---

## 2. Fields (form inputs)

| Label | Value binding | Type | Notes |
|-------|---------------|------|-------|
| (input) | `this.identity` | menu | |

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
| t "auth.login.failed-attempt.button-text" | `—` | |
| t "auth.login.form.sign-in-button" | `—` | |
| t "auth.login.form.create-account-button" | `—` | |
| menuItem.title | `—` | |


---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- Template: `{{#if (gte this.failedAttempts 3)}}`

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

- RegistryYield / registry: `auth:login`
- registry: `auth:login`

---

## 12. Navigation flow

- **Enter:** Navigate to `/auth/login`
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
| `LogoIcon` | TBD |
| `Button` | TBD |
| `RegistryYield` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `console/app/templates/auth/login.hbs`
- Controller: `console\app\controllers\auth\login.js`
- Route: `console\app\routes\auth\login.js`


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

**Injected services:** `notifications`, `urlSearchParams`, `session`, `router`, `intl`, `fetch`

- **Setup/teardown:** @action async
- **Setup/teardown:** @action transitionToOnboard
- **Setup/teardown:** @action forgotPassword
- **Setup/teardown:** @action sendUserForEmailVerification
- **Setup/teardown:** @action sendUserForPasswordReset

### Template conditionals

- `{{#if (gte this.failedAttempts 3)}}` — branch UI visibility

### Loading / empty states

- Button/component `@isLoading` binds to async task running state

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

