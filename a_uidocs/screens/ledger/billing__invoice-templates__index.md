# Screen: billing/invoice-templates/index

| Property | Value |
|----------|-------|
| **Engine** | Ledger |
| **Route name** | `ledger.billing.invoice_templates` |
| **URL** | `/ledger/billing/invoice-templates` |
| **Template** | `packages/ledger/addon/templates/billing/invoice-templates/index.hbs` |
| **Controller** | `packages\ledger\addon\controllers\billing\invoice-templates\index.js` |
| **Route** | `packages\ledger\addon\routes\billing\invoice-templates\index.js` |

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
| column.name | `name` | yes | yes |
| column.description | `description` | yes | yes |
| column.orientation | `orientation` | yes | yes |
| column.default | `is_default` | yes | yes |
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

- _See controller and component JS for business rules_

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `store.query('template')` |


---

## 10. Permissions

- `ledger update template`
- `ledger view template`
- `ledger delete template`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/ledger/billing/invoice-templates`
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
| `TemplateBuilder` | TBD |

---

## 15. Composed components (full UI)


---

## 16. Source files to mirror

- Template: `packages/ledger/addon/templates/billing/invoice-templates/index.hbs`
- Controller: `packages\ledger\addon\controllers\billing\invoice-templates\index.js`
- Route: `packages\ledger\addon\routes\billing\invoice-templates\index.js`


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

**Injected services:** `invoiceTemplateActions`, `tableContext`, `intl`

**Query params:** `page`, `limit`, `sort`, `query`

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| common.refresh | `invoiceTemplateActions.refresh` | `—` |
| common.new | `invoiceTemplateActions.transition` | `—` |


### Service action flows

#### `invoice-template-actions.refresh()`


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

