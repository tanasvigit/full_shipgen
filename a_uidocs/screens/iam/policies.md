# Screen: policies

| Property | Value |
|----------|-------|
| **Engine** | IAM |
| **Route name** | `iam.policies` |
| **URL** | `/iam/policies` |
| **Template** | `packages/iam-engine/addon/templates/policies.hbs` |
| **Controller** | `packages\iam-engine\addon\controllers\policies` |
| **Route** | `packages\iam-engine\addon\routes\policies.js` |

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

- _See controller and component JS for business rules_

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | _Infer model from route/controller_ |


---

## 10. Permissions

- `iam list policy`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/iam/policies`
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


---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/iam-engine/addon/templates/policies.hbs`
- Controller: `packages\iam-engine\addon\controllers\policies`
- Route: `packages\iam-engine\addon\routes\policies.js`


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
| `iam list policy` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console.iam.home`

### Controller state & services

**Injected services:** `store`, `intl`, `notifications`, `currentUser`, `modalsManager`, `hostRouter`, `crud`, `fetch`, `abilities`, `filters`, `iam`

**Query params:** `page`, `limit`, `sort`, `query`, `type`, `created_by`, `updated_by`, `status`, `service`, `type`

- **Setup/teardown:** @action bulkDeletePolicies
- **Setup/teardown:** @action createPolicy
- **Setup/teardown:** @action editPolicy
- **Setup/teardown:** @action viewPolicyPermissions
- **Setup/teardown:** @action deletePolicy
- **Setup/teardown:** @action exportPolicies
- **Setup/teardown:** @action reload

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

