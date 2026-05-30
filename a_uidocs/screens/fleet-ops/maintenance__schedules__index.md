# Screen: maintenance/schedules/index

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.maintenance.schedules` |
| **URL** | `/fleet-ops/maintenance/schedules` |
| **Template** | `packages/fleetops/addon/templates/maintenance/schedules/index.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\maintenance\schedules\index.js` |
| **Route** | `packages\fleetops\addon\routes\maintenance\schedules\index.js` |

---

## 1. Layout structure

- Section header with title/actions
- Scrollable section body
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
| column.id | `public_id` | yes | yes |
| column.name | `name` | yes | yes |
| column.subject | `subject.name` | yes | yes |
| column.type | `type` | yes | yes |
| column.status | `status` | yes | yes |
| column.next-due | `nextDueAtShort` | yes | yes |
| column.created-at | `createdAt` | yes | yes |


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

- Template: `{{#if (eq this.layout "calendar")}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `store.query('maintenance-schedule')` |


---

## 10. Permissions

- `fleet-ops view maintenance-schedule`
- `fleet-ops update maintenance-schedule`
- `fleet-ops delete maintenance-schedule`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/maintenance/schedules`
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
| `Layout::Resource::TabularActions` | TBD |
| `Layout::Section::Body` | TBD |
| `FullCalendar` | TBD |
| `Layout::Resource::Tabular` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/maintenance/schedules/index.hbs`
- Controller: `packages\fleetops\addon\controllers\maintenance\schedules\index.js`
- Route: `packages\fleetops\addon\routes\maintenance\schedules\index.js`


---

## Deep specification (auto-enriched)

### Controller actions/tabs (`packages/fleetops/addon/controllers/maintenance/schedules/index.js`)

**Tabs:**
- Delete selected...



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

**Injected services:** `maintenanceScheduleActions`, `fetch`, `intl`, `appCache`, `notifications`

**Query params:** `status`, `page`, `limit`, `sort`, `query`, `public_id`, `created_at`, `updated_at`

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| common.new | `maintenanceScheduleActions.transition` | `—` |
| common.import | `maintenanceScheduleActions.import` | `—` |

- **Setup/teardown:** @action setCalendarApi
- **Setup/teardown:** @action onCalendarEventClick
- **Setup/teardown:** @action setLayoutList
- **Setup/teardown:** @action setLayoutCalendar

### Template conditionals

- `{{#if (eq this.layout "calendar")}}` — branch UI visibility

### Service action flows

#### `maintenance-schedule-actions.import()`


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

