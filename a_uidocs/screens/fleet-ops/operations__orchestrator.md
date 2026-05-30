# Screen: operations/orchestrator

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.operations.orchestrator` |
| **URL** | `/fleet-ops/operations/orchestrator` |
| **Template** | `packages/fleetops/addon/templates/operations/orchestrator.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\operations\orchestrator.js` |
| **Route** | `packages\fleetops\addon\routes\operations\orchestrator.js` |

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

- `fleet-ops list order`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/operations/orchestrator`
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
| `OrchestratorWorkbench` | TBD |

---

## 15. Composed components (full UI)

### `OrchestratorWorkbench`

**Source:** `packages\fleetops\addon\components\orchestrator-workbench.hbs`

**Layout:** Section header with title/actions

**Buttons:** t "orchestrator.phases", t "orchestrator.card-fields", t "orchestrator.commit-plan", t "orchestrator.discard-plan", if this.phaseCount (t "orchestrator.run-phases" count=this.phaseCount) (t "orchestrator.run-orchestration"), t "orchestrator.try-again", t "orchestrator.change-resources"

#### Child: `Orchestrator::PhaseBuilder`

| Field | Binding |
|-------|----------|
| t "orchestrator.phase-label" | `—` |
| t "orchestrator.mode" | `—` |
| t "orchestrator.include-order-statuses" | `—` |
| t "orchestrator.engine" | `—` |
| t "orchestrator.constraints" | `—` |

#### Child: `Orchestrator::CardFieldsSettings`


#### Child: `Orchestrator::OrderPool`


#### Child: `Orchestrator::PlanViewer`


#### Child: `Orchestrator::ResourcePanel`



---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/operations/orchestrator.hbs`
- Controller: `packages\fleetops\addon\controllers\operations\orchestrator.js`
- Route: `packages\fleetops\addon\routes\operations\orchestrator.js`


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
| `fleet-ops list order` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console.fleet-ops`

### Controller state & services

**Injected services:** _none_


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

