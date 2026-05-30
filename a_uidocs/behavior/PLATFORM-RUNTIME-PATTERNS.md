# Platform runtime patterns

Implementation contracts traced from `packages/ember-ui`, `packages/ember-core`, and FleetOps services.

## modalsManager (`ember-ui`)

| Method | Contract |
|--------|----------|
| `confirm(options)` | Returns RSVP defer; `options.confirm(modal)` async — call `modal.startLoading()` before API, `modal.done()` on success, `modal.stopLoading()` on error |
| `show(componentOrTemplate, options)` | Pushes modal onto `modals[]` stack; top modal drives `componentToRender` |
| `modal.done()` | Resolves defer fulfilled, removes modal |
| Decline | Typically `rollbackAttributes()` on edited model |

Default button copy: confirm/decline pending/fulfilled/rejected text keys in service defaults.

## ember-concurrency tasks

- UI: `@isLoading={{task.isRunning}}` or `{{or task.isRunning otherFlag}}`
- Route/controller: `@task *refresh() { yield hostRouter.refresh(); }`
- Component tasks: catch → `notifications.serverError(err)`

## ResourceActionService (base for `*-actions`)

| Action | Flow |
|--------|------|
| `delete` | `modalsManager.confirm` → `deleteRecord` task → optional `hostRouter.refresh` / callback |
| `bulkDelete` | `tableContext.getSelectedRows()` → `crud.bulkDelete` → `untoggleSelectAll` |
| `create/update` | modal or panel → `save()` → success toast + `events.track*` |
| `refresh` | `router.refresh()` or `hostRouter.refresh()` |

## notifications

| Method | When |
|--------|------|
| `success(intlKey, ...)` | After save/API success |
| `warning(intlKey)` | Permission denied, validation, precondition |
| `serverError(error)` | API failure; parses first error message |

## order-socket-events

See [`services/order-socket-events.md`](./services/order-socket-events.md).

## abilities

- Route `beforeModel`: `abilities.cannot('fleet-ops view order')` → `notifications.warning(unauthorized)` + `transitionTo` list
- Table columns: `permission: 'fleet-ops view order'` hides column/actions

## tableContext

- Bulk: `getSelectedRows()`, `getSelectedIds()`, `untoggleSelectAll()` after bulk success
- Row selection drives `bulkActions` handlers on list controllers

## resourceContextPanel / map layout

- Orders list: `changeLayout('map'|'table'|'kanban')` on index controller
- Detail `setup`: forces map layout, hides sidebar, routing control on map

## appCache (component UI prefs)

- Example: `fleetops:order:activity:layout` → `timeline` | `list`
- Toggle persists across sessions via `appCache.set`

## Registry / extensions

- `menuService.getMenuItems('fleet-ops:component:order:details')` appends tabs after Overview
- `RegistryYield` with `@permission` for extension panels

## Drag-drop / map interactions

- Orders map: Leaflet routing control, layer visibility for assigned driver
- Kanban/grid layouts where `changeLayout('kanban')` — see fleet-ops orders index controller

## Retry / failure

- Socket pump errors: logged via `debug`, subscription continues where possible
- Route `error` action: `serverError` + redirect to safe parent list
- Modal errors: `stopLoading()` leaves modal open for retry
