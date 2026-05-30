# Screen: management/fleets/index

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.management.fleets` |
| **URL** | `/fleet-ops/management/fleets` |
| **Template** | `packages/fleetops/addon/templates/management/fleets/index.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\management\fleets\index.js` |
| **Route** | `packages\fleetops\addon\routes\management\fleets\index.js` |

---

## 1. Layout structure

- Resource tabular (list + filters + table)

```
[Header: title + actions]
[Filters row]
[Data table with pagination]
[Optional: map/kanban toggle above]
```

---

## 2. Fields (form inputs)

| Label | Value binding | Type | Notes |
|-------|---------------|------|-------|
| _No InputGroup fields in route template — see composed components below_ | | | |

---

## 3. Tables

| Column (i18n) | valuePath | Sort | Filter |
|---------------|-----------|------|--------|
| column.name | `name` | yes | yes |
| column.service-area | `service_area.name` | yes | yes |
| column.parent-fleet | `parent_fleet.name` | yes | yes |
| column.vendor | `vendor.name` | yes | yes |
| column.zone | `zone.name` | yes | yes |
| column.id | `public_id` | yes | yes |
| column.manpower | `drivers_count` | yes | yes |
| column.active-manpower | `drivers_online_count` | yes | yes |
| column.task | `task` | yes | yes |
| column.status | `status` | yes | yes |
| column.created-at | `createdAt` | yes | yes |
| column.updated-at | `updatedAt` | yes | yes |


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
| Data load | `store.query('fleet')` |


---

## 10. Permissions

- `fleet-ops view fleet`
- `fleet-ops view service-area`
- `fleet-ops view vendor`
- `fleet-ops view zone`
- `fleet-ops update fleet`
- `fleet-ops assign-driver-for fleet`
- `fleet-ops delete fleet`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/management/fleets`
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
| `Layout::Resource::Tabular` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/management/fleets/index.hbs`
- Controller: `packages\fleetops\addon\controllers\management\fleets\index.js`
- Route: `packages\fleetops\addon\routes\management\fleets\index.js`


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
| `fleet-ops list fleet` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console.fleet-ops`

### Controller state & services

**Injected services:** `fleetActions`, `serviceAreaActions`, `zoneActions`, `vendorActions`, `tableContext`, `intl`

**Query params:** `page`, `limit`, `sort`, `query`, `public_id`, `zone`, `service_area`, `parent_fleet`, `vendor`, `created_by`, `updated_by`, `status`, `task`, `name`

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| common.refresh | `fleetActions.refresh` | `—` |
| common.new | `fleetActions.transition` | `—` |
| common.import | `fleetActions.import` | `—` |
| common.export | `fleetActions.export` | `—` |


### Service action flows

#### `fleet-actions.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `fleet-actions.import()`


#### `fleet-actions.export()`


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

### List resource behavior

- Uses `Layout::Resource::Tabular` — search debounced via controller task
- Pagination: `page` query param updates model
- Bulk actions from `bulkActions` getter on controller
- Row click → transition to details route
- Export/import via `*Actions.export/import`

