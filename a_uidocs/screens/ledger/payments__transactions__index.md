# Screen: payments/transactions/index

| Property | Value |
|----------|-------|
| **Engine** | Ledger |
| **Route name** | `ledger.payments.transactions` |
| **URL** | `/ledger/payments/transactions` |
| **Template** | `packages/ledger/addon/templates/payments/transactions/index.hbs` |
| **Controller** | `packages\ledger\addon\controllers\payments\transactions\index.js` |
| **Route** | `packages\ledger\addon\routes\payments\transactions\index.js` |

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
| column.id | `public_id` | yes | yes |
| column.date | `createdAt` | yes | yes |
| column.description | `description` | yes | yes |
| column.type | `type` | yes | yes |
| column.direction | `direction` | yes | yes |
| column.amount | `amount` | yes | yes |
| column.status | `status` | yes | yes |
| column.net-amount | `net_amount` | yes | yes |
| column.fee | `fee_amount` | yes | yes |
| column.tax | `tax_amount` | yes | yes |
| column.currency | `currency` | yes | yes |
| column.gateway | `gateway` | yes | yes |
| column.payment-method | `payment_method` | yes | yes |
| column.reference | `reference` | yes | yes |
| column.period | `period` | yes | yes |
| column.settled-at | `settled_at` | yes | yes |
| column.failure-reason | `failure_reason` | yes | yes |
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
| Data load | `store.query('ledger-transaction')` |


---

## 10. Permissions

- `ledger view transaction`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/ledger/payments/transactions`
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

- Template: `packages/ledger/addon/templates/payments/transactions/index.hbs`
- Controller: `packages\ledger\addon\controllers\payments\transactions\index.js`
- Route: `packages\ledger\addon\routes\payments\transactions\index.js`


---

## Deep specification (auto-enriched)

### Controller actions/tabs (`packages/ledger/addon/controllers/payments/transactions/index.js`)

**Tabs:**
- Credit
- Debit
- Card
- Bank Transfer
- Wallet
- Cash



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

**Injected services:** `transactionActions`, `tableContext`, `intl`

**Query params:** `page`, `limit`, `sort`, `query`, `public_id`, `description`, `type`, `status`, `direction`, `currency`, `gateway`, `payment_method`, `reference`, `period`, `failure_reason`, `created_at`, `updated_at`, `settled_at`, ``

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| common.refresh | `transactionActions.refresh` | `—` |


### Service action flows

#### `transaction-actions.refresh()`


**Navigation:**
- `router.refresh()` after success

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

