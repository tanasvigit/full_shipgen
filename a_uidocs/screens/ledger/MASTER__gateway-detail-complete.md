# Screen: Gateway detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/ledger/payments/gateways/:public_id` |
| **Route name** | `ledger.payments.gateways.index.details` |
| **Controller** | `controllers/payments/gateways/index/details.js` |
| **Route** | `routes/payments/gateways/index/details.js` |
| **Model** | `gateway` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `ledger view gateway` |
| API | `store.findRecord(...)` |

**Error:** `serverError` + redirect to list if not found.

---

## Parent controller — tabs

| Tab | Route |
|-----|-------|
| Transactions | `payments.gateways.index.details.index` |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| — | — | — |

---

## Tab panels

### Tab: `index`

**Renders:** `Gateway::Details`

| Field |
|-------|
| Name |
| Code |
| Driver |
| Type |
| Environment |
| Status |
| Description |
| Webhook URL |
| Capabilities |
| Internal ID |
| Created |
| Last Updated |

### Tab: `webhooks`

**Renders:** `Gateway::WebhookEvents`

| Field |
|-------|
| Name |
| Code |
| Driver |
| Type |
| Environment |
| Status |
| Description |
| Webhook URL |
| Capabilities |
| Internal ID |
| Created |
| Last Updated |


## Related list spec

[`payments__gateways__index.md`](./payments__gateways__index.md)

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
- Transactions
- route: payments.gateways.index.details.index
- route: payments.gateways.index.details.webhooks

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| (action) | `inline fn` | `—` |
| (action) | `inline fn` | `—` |

- **Setup/teardown:** @action editGateway
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

