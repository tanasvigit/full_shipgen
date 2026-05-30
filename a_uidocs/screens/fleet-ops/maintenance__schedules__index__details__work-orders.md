# Screen: maintenance/schedules/index/details/work-orders

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.maintenance.schedules.index.details.work_orders` |
| **URL** | `/fleet-ops/maintenance/schedules/index/details/work-orders` |
| **Template** | `packages/fleetops/addon/templates/maintenance/schedules/index/details/work-orders.hbs` |
| **Controller** | _none / parent controller_ |
| **Route** | `packages\fleetops\addon\routes\maintenance\schedules\index\details\work-orders.js` |

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

- Template: `{{#if @model.length}}`
- Template: `{{#if workOrder.opened_at}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `store.query('work-order')` |


---

## 10. Permissions

- _Check abilities service in route beforeModel_

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/maintenance/schedules/index/details/work-orders`
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
| `Badge` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/maintenance/schedules/index/details/work-orders.hbs`
- Route: `packages\fleetops\addon\routes\maintenance\schedules\index\details\work-orders.js`


---


---


---


---


---


---


> **Full merged spec:** [MASTER__maintenance-detail-complete.md](./MASTER__maintenance-detail-complete.md)


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle

| Permission | Effect |
|------------|--------|
| `fleet-ops view maintenance-schedule` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- `error` action: `notifications.serverError` + redirect
- On failure redirects to `maintenance.schedules.index`
- On failure redirects to `maintenance.schedules.index`

### Controller state & services

**Injected services:** `maintenanceScheduleActions`, `fetch`, `hostRouter`, `intl`, `abilities`, `universe/menu-service`

**Tabs:**
- route: maintenance.schedules.index.details.index
- route: maintenance.schedules.index.details.work-orders

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| Download .ics | `inline fn` | `—` |
| Add to Google Calendar | `inline fn` | `—` |

- **Setup/teardown:** @action edit
- **Setup/teardown:** @action triggerNow
- **Setup/teardown:** @action delete
- **Setup/teardown:** @action downloadIcal
- **Setup/teardown:** @action addToGoogleCalendar

### Template conditionals

- `{{#if @model.length}}` — branch UI visibility
- `{{#if workOrder.opened_at}}` — branch UI visibility

### Loading / empty states

- Empty state: `{{else}}` branch on `#each` when no records

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

