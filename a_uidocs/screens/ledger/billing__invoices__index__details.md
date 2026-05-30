# Screen: billing/invoices/index/details

| Property | Value |
|----------|-------|
| **Engine** | Ledger |
| **Route name** | `ledger.billing.invoices.index.details` |
| **URL** | `/ledger/billing/invoices/index/details` |
| **Template** | `packages/ledger/addon/templates/billing/invoices/index/details.hbs` |
| **Controller** | `packages\ledger\addon\controllers\billing\invoices\index\details.js` |
| **Route** | `packages\ledger\addon\routes\billing\invoices\index\details.js` |

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

- Details
- Transactions

---

## 5. Buttons & actions

| Label | Action / handler | Conditions |
|-------|------------------|------------|

| Send Invoice | controller `actionButtons` | see disabled rules in controller |

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
| Data load | _Infer model from route/controller_ |


---

## 10. Permissions

- _Check abilities service in route beforeModel_

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/ledger/billing/invoices/index/details`
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
| `Layout::Resource::Panel` | TBD |
| `TabNavigation` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/ledger/addon/templates/billing/invoices/index/details.hbs`
- Controller: `packages\ledger\addon\controllers\billing\invoices\index\details.js`
- Route: `packages\ledger\addon\routes\billing\invoices\index\details.js`


---


> **Full merged spec:** [MASTER__invoice-detail-complete.md](./MASTER__invoice-detail-complete.md)

## Deep specification (auto-enriched)

### Controller actions/tabs (`packages/ledger/addon/controllers/billing/invoices/index/details.js`)

**Tabs:**
- Details
- Transactions
- Preview
- Edit
- Bank Transfer
- Cash
- Cheque
- Credit Card
- Debit Card
- PayPal
- Stripe
- Other

**Actions:**
- Send Invoice



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

