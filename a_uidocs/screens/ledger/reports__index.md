# Screen: reports/index

| Property | Value |
|----------|-------|
| **Engine** | Ledger |
| **Route name** | `ledger.reports` |
| **URL** | `/ledger/reports` |
| **Template** | `packages/ledger/addon/templates/reports/index.hbs` |
| **Controller** | `packages\ledger\addon\controllers\reports\index.js` |
| **Route** | `packages\ledger\addon\routes\reports\index.js` |

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



---

## 6. Modals, drawers, overlays

_None in template — may be triggered from controller actions_

---

## 7. Filters & query params

**Query params:** _none in controller_



---

## 8. Validations & conditional logic

- Template: `{{#if this.isLoading}}`
- Template: `{{#if (eq this.activeReport "balance-sheet")}}`

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

- **Enter:** Navigate to `/ledger/reports`
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
| `Layout::Section::Body` | TBD |
| `Button` | TBD |
| `Report::BalanceSheet` | TBD |
| `Report::IncomeStatement` | TBD |
| `Report::CashFlow` | TBD |
| `Report::ArAging` | TBD |

---

## 15. Composed components (full UI)

### `Report::BalanceSheet`

**Source:** `packages\ledger\addon\components\report\balance-sheet.hbs`

### `Report::IncomeStatement`

**Source:** `packages\ledger\addon\components\report\income-statement.hbs`

### `Report::CashFlow`

**Source:** `packages\ledger\addon\components\report\cash-flow.hbs`

### `Report::ArAging`

**Source:** `packages\ledger\addon\components\report\ar-aging.hbs`


---

## 16. Source files to mirror

- Template: `packages/ledger/addon/templates/reports/index.hbs`
- Controller: `packages\ledger\addon\controllers\reports\index.js`
- Route: `packages\ledger\addon\routes\reports\index.js`


---

## Deep specification (auto-enriched)

### Controller actions/tabs (`packages/ledger/addon/controllers/reports/index.js`)

**Tabs:**
- Balance Sheet
- Income Statement
- Cash Flow
- AR Aging



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

**Injected services:** `fetch`

**Tasks:** `loadReport` — use `.perform()`, UI bound via `.isRunning`

- **Setup/teardown:** @action selectReport
- **Setup/teardown:** @action runReport

### Template conditionals

- `{{#if this.isLoading}}` — branch UI visibility
- `{{#if (eq this.activeReport "balance-sheet")}}` — branch UI visibility

### Loading / empty states

- Button/component `@isLoading` binds to async task running state
- Spinner shown during upload/async operations
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

