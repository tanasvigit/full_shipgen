# Screen: management/fuel-reports/index/edit

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.management.fuel_reports.index.edit` |
| **URL** | `/fleet-ops/management/fuel-reports/edit/:public_id` |
| **Template** | `packages/fleetops/addon/templates/management/fuel-reports/index/edit.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\management\fuel-reports\index\edit.js` |
| **Route** | `packages\fleetops\addon\routes\management\fuel-reports\index\edit.js` |

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
| Data load | `store.queryRecord('fuel-report', ...)` |
| Includes | driver, vehicle, reporter |

---

## 10. Permissions

- `fleet-ops update fuel-report`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/management/fuel-reports/index/edit`
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
| `Layout::Resource::Panel` | TBD |
| `FuelReport::Form` | TBD |
| `Spacer` | TBD |

---

## 15. Composed components (full UI)

### `FuelReport::Form`

**Source:** `packages\fleetops\addon\components\fuel-report\form.hbs`

**Layout:** Collapsible content panels; Extension registry injection slot

| Field | Binding |
|-------|----------|
| t "fuel-report.fields.reporter" | `—` |
| t "resource.driver" | `—` |
| t "resource.vehicle" | `—` |
| t "common.status" | `—` |
| t "fuel-report.fields.odometer" | `—` |
| t "fuel-report.fields.fuel-cost" | `—` |
| t "fuel-report.fields.fuel-volume" | `—` |
| t "common.coordinates" | `—` |


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/management/fuel-reports/index/edit.hbs`
- Controller: `packages\fleetops\addon\controllers\management\fuel-reports\index\edit.js`
- Route: `packages\fleetops\addon\routes\management\fuel-reports\index\edit.js`


---

## Deep specification (auto-enriched)

### Route model (`packages/fleetops/addon/routes/management/fuel-reports/index/edit.js`)

- **Model:** `fuel-report`
- **With:** driver, vehicle, reporter
- **Permissions:** fleet-ops update fuel-report
- **Hooks:** beforeModel — permission gate



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
| `fleet-ops update fuel-report` | redirect/warning — see route for target |

**Model load:** `store.queryRecord('fuel-report', { single: true, with: [driver, vehicle, reporter] })`

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `console.fleet-ops.management.fuel-reports.index`
- On failure redirects to `console.fleet-ops.management.fuel-reports.index`

### Controller state & services

**Injected services:** `hostRouter`, `intl`, `notifications`, `modalsManager`, `events`

**Tasks:** `save` — use `.perform()`, UI bound via `.isRunning`

- **Setup/teardown:** @action cancel
- **Setup/teardown:** @action view

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

