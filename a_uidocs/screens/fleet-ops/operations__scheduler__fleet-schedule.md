# Screen: operations/scheduler/fleet-schedule

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.operations.scheduler.fleet_schedule` |
| **URL** | `/fleet-ops/operations/scheduler/fleet-schedule` |
| **Template** | `packages/fleetops/addon/templates/operations/scheduler/fleet-schedule.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\operations\scheduler\fleet-schedule.js` |
| **Route** | `packages\fleetops\addon\routes\operations\scheduler\fleet-schedule.js` |

---

## 1. Layout structure

- Section header with title/actions
- Scrollable section body

```
[Section Header + actions]
[Section Body - scrollable form/panels]
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
| t "scheduler.today" | `—` | |
| t "scheduler.add-shift" | `—` | |


---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- Template: `{{#if this.loadScheduleItems.isRunning}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `store.query('driver')` |


---

## 10. Permissions

- `fleet-ops list driver`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/operations/scheduler/fleet-schedule`
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
| `Layout::Section::Header` | TBD |
| `Button` | TBD |
| `Layout::Section::Body` | TBD |
| `FullCalendar` | TBD |
| `Spacer` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/operations/scheduler/fleet-schedule.hbs`
- Controller: `packages\fleetops\addon\controllers\operations\scheduler\fleet-schedule.js`
- Route: `packages\fleetops\addon\routes\operations\scheduler\fleet-schedule.js`


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
| `fleet-ops list driver` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console.fleet-ops.operations.scheduler.index`

### Controller state & services

**Injected services:** `modalsManager`, `notifications`, `store`, `fetch`, `intl`

**Tasks:** `loadScheduleItems`, `loadScheduleExceptions` — use `.perform()`, UI bound via `.isRunning`

- **Setup/teardown:** @action setCalendarApi
- **Setup/teardown:** @action onEventClick
- **Setup/teardown:** @action async
- **Setup/teardown:** @action addShiftForDriver
- **Setup/teardown:** @action addShift
- **Setup/teardown:** @action previousWeek
- **Setup/teardown:** @action nextWeek
- **Setup/teardown:** @action goToToday

### Template conditionals

- `{{#if this.loadScheduleItems.isRunning}}` — branch UI visibility

### Loading / empty states

- Spinner shown during upload/async operations
- Task `.isRunning` disables UI during ember-concurrency task

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

