# Screen: operations/service-rates/index/new

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.operations.service_rates.index.new` |
| **URL** | `/fleet-ops/operations/service-rates/index/new` |
| **Template** | `packages/fleetops/addon/templates/operations/service-rates/index/new.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\operations\service-rates\index\new.js` |
| **Route** | `packages\fleetops\addon\routes\operations\service-rates\index\new.js` |

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

- _Check abilities service in route beforeModel_

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/operations/service-rates/index/new`
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
| `Layout::Resource::Panel` | TBD |
| `ServiceRate::Form` | TBD |
| `Spacer` | TBD |

---

## 15. Composed components (full UI)

### `ServiceRate::Form`

**Source:** `packages\fleetops\addon\components\service-rate\form.hbs`

**Layout:** Collapsible content panels

| Field | Binding |
|-------|----------|
| t "service-rate.fields.service-name" | `—` |
| t "service-rate.fields.service-order-label" | `—` |
| t "service-rate.fields.base-fee-label" | `—` |
| t "service-rate.fields.rate-calculation-label" | `—` |
| t "service-rate.fields.estimated-days" | `—` |
| t "service-rate.fields.duration-terms-label" | `—` |
| t "service-rate.fields.maximum-distance" | `—` |
| t "service-rate.fields.per-meter-rate-fee" | `—` |
| t "service-rate.fields.distance-unit" | `—` |
| t "service-rate.fields.algorithm-label" | `—` |
| t "service-rate.fields.length-label" | `—` |
| t "service-rate.fields.width-label" | `—` |
| t "service-rate.fields.height-label" | `—` |
| t "service-rate.fields.weight-label" | `—` |
| t "service-rate.fields.deminsions-unit" | `—` |
| t "service-rate.fields.weight-unit" | `—` |
| t "service-rate.fields.additional-fee" | `—` |
| t "service-rate.fields.calculation-method-label" | `—` |
| t "service-rate.fields.delivery-flat-fee" | `—` |
| t "service-rate.fields.fee-percentage" | `—` |
| t "service-rate.fields.peak-hours-start-label" | `—` |
| t "service-rate.fields.peak-hours-end-label" | `—` |
| t "service-rate.fields.peak-hours-fee-label" | `—` |
| t "service-rate.fields.flat-fee-label" | `—` |
| t "service-rate.fields.peak-hours-percentage-label" | `—` |
| t "service-rate.fields.service-area-label" | `—` |
| t "service-rate.fields.zone-label" | `—` |
| Max Distance Unit | `rateFee.fee` |
| (input) | `@resource.base_fee` |

**Buttons:** t "service-rate.fields.add-drop-off-button"


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/operations/service-rates/index/new.hbs`
- Controller: `packages\fleetops\addon\controllers\operations\service-rates\index\new.js`
- Route: `packages\fleetops\addon\routes\operations\service-rates\index\new.js`


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

**Injected services:** `serviceRateActions`, `hostRouter`, `intl`, `notifications`, `events`

**Tasks:** `save` — use `.perform()`, UI bound via `.isRunning`

- **Setup/teardown:** @action resetForm

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

