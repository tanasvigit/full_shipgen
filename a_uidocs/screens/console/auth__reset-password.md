# Screen: auth/reset-password

| Property | Value |
|----------|-------|
| **Engine** | Console |
| **Route name** | `console.auth.reset_password` |
| **URL** | `/auth/reset-password` |
| **Template** | `console/app/templates/auth/reset-password.hbs` |
| **Controller** | `console\app\controllers\auth\reset-password.js` |
| **Route** | `console\app\routes\auth\reset-password.js` |

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
| t "auth.reset-password.form.code.label" | `—` | text | |
| t "auth.reset-password.form.password.label" | `—` | text | |
| t "auth.reset-password.form.confirm-password.label" | `—` | text | |

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
| t "auth.reset-password.form.submit-button" | `—` | |
| t "auth.reset-password.form.back-button" | `—` | |


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
| Data load | `GET auth/validate-verification` |


---

## 10. Permissions

- _Check abilities service in route beforeModel_

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/auth/reset-password`
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
| `LogoIcon` | TBD |
| `InputGroup` | TBD |
| `Button` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `console/app/templates/auth/reset-password.hbs`
- Controller: `console\app\controllers\auth\reset-password.js`
- Route: `console\app\routes\auth\reset-password.js`


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

- On failure redirects to `auth`

### Controller state & services

**Injected services:** `fetch`, `notifications`, `router`, `intl`

**Query params:** `code`

**Tasks:** `resetPassword` — use `.perform()`, UI bound via `.isRunning`


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

