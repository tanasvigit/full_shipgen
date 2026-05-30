# Screen: maintenance/work-orders/index

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.maintenance.work_orders` |
| **URL** | `/fleet-ops/maintenance/work-orders` |
| **Template** | `packages/fleetops/addon/templates/maintenance/work-orders/index.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\maintenance\work-orders\index.js` |
| **Route** | `packages\fleetops\addon\routes\maintenance\work-orders\index.js` |

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
| column.code | `code` | yes | yes |
| column.subject | `subject` | yes | yes |
| column.status | `status` | yes | yes |
| column.priority | `priority` | yes | yes |
| column.assignee | `assignee_name` | yes | yes |
| column.due-at | `dueAt` | yes | yes |
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
| Data load | `store.query('work-order')` |


---

## 10. Permissions

- `fleet-ops view work-order`
- `fleet-ops update work-order`
- `fleet-ops delete work-order`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/maintenance/work-orders`
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

- Template: `packages/fleetops/addon/templates/maintenance/work-orders/index.hbs`
- Controller: `packages\fleetops\addon\controllers\maintenance\work-orders\index.js`
- Route: `packages\fleetops\addon\routes\maintenance\work-orders\index.js`


---

## Deep specification (auto-enriched)

### Controller actions/tabs (`packages/fleetops/addon/controllers/maintenance/work-orders/index.js`)

**Tabs:**
- Delete selected...
- Send Work Order to Vendor



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

**Injected services:** `workOrderActions`, `intl`

**Query params:** `status`, `priority`, `page`, `limit`, `sort`, `query`, `public_id`, `created_at`, `updated_at`

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| common.refresh | `workOrderActions.refresh` | `—` |
| common.new | `workOrderActions.transition` | `—` |
| common.import | `workOrderActions.import` | `—` |
| common.export | `workOrderActions.export` | `—` |


### Service action flows

#### `work-order-actions.refresh()`


**Navigation:**
- `router.refresh()` after success

#### `work-order-actions.import()`


#### `work-order-actions.export()`


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

