# Screen: Invoice detail (complete)

| Property | Value |
|----------|-------|
| **URL** | `/ledger/billing/invoices/:public_id` |
| **Route name** | `ledger.billing.invoices.index.details` |
| **Controller** | `controllers/billing/invoices/index/details.js` |
| **Route** | `routes/billing/invoices/index/details.js` |
| **Model** | `invoice` |

---

## Parent route — data load

| Item | Value |
|------|-------|
| Permission | `ledger view invoice` |
| API | `store.findRecord(...)` |

**Error:** `serverError` + redirect to list if not found.

---

## Parent controller — tabs

| Tab | Route |
|-----|-------|
| Transactions | `billing.invoices.index.details.index` |

---

## Parent controller — actions

| Action | Permission | Handler |
|--------|------------|---------|
| — | — | — |

---

## Tab panels

### Tab: `index`

**Renders:** `Invoice::Details`

| Field |
|-------|
| Invoice Number |
| Status |
| Invoice Date |
| Due Date |
| Currency |
| Template |
| Sent At |
| Viewed At |
| Paid At |
| Invoice URL |
| Name |
| Email |
| Phone |
| Total Amount |
| Amount Paid |
| Balance Due |
| Internal ID |
| Created |
| Last Updated |

### Tab: `line-items`

**Renders:** `Invoice::LineItems`

| Field |
|-------|
| Invoice Number |
| Status |
| Invoice Date |
| Due Date |
| Currency |
| Template |
| Sent At |
| Viewed At |
| Paid At |
| Invoice URL |
| Name |
| Email |
| Phone |
| Total Amount |
| Amount Paid |
| Balance Due |
| Internal ID |
| Created |
| Last Updated |

### Tab: `transactions`

**Renders:** `Invoice::Transactions`

| Field |
|-------|
| Invoice Number |
| Status |
| Invoice Date |
| Due Date |
| Currency |
| Template |
| Sent At |
| Viewed At |
| Paid At |
| Invoice URL |
| Name |
| Email |
| Phone |
| Total Amount |
| Amount Paid |
| Balance Due |
| Internal ID |
| Created |
| Last Updated |


## Related list spec

[`billing__invoices__index.md`](./billing__invoices__index.md)

## Service

`resource-action (base)`


---


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Route lifecycle


### Controller state & services

**Injected services:** `notifications`, `modalsManager`, `fetch`, `hostRouter`, `invoiceActions`, `intl`

**Tabs:**
- Details
- Transactions
- route: billing.invoices.index.details.index
- route: billing.invoices.index.details.transactions

- **Setup/teardown:** @action async
- **Setup/teardown:** @action async
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

