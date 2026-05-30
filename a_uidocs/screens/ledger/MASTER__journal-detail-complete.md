# Screen: Journal detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/ledger/accounting/journal/:public_id` |
| **Route name** | `ledger.accounting.journal.index.details` |
| **Controller** | `controllers/accounting/journal/index/details.js` |
| **Route** | `routes/accounting/journal/index/details.js` |
| **Model** | `journal` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `ledger view journal` |
| API | `store.findRecord(...)` |

**Error:** `serverError` + redirect to list if not found.

---

## Parent controller — tabs

| Tab | Route |
|-----|-------|
| (single panel) | details index |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| — | — | — |

---

## Tab panels

### Tab: `index`

**Renders:** `Journal::Details`

| Field |
|-------|
| Entry Number |
| Type |
| Entry Date |
| Source |
| Amount |
| Currency |
| Description |
| Debit Account |
| Debit Account Code |
| Credit Account |
| Credit Account Code |
| Internal ID |
| Created |
| Last Updated |


## Related list spec

[`accounting__journal__index.md`](./accounting__journal__index.md)

## Service

`resource-action (base)`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle


### Controller state & services

**Injected services:** `notifications`, `modalsManager`, `hostRouter`

**Tabs:**
- Overview
- route: accounting.journal.index.details.index

- **Setup/teardown:** @action async

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

