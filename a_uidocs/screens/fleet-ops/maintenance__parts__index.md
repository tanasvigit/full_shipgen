# Screen: maintenance/parts/index

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.maintenance.parts` |
| **URL** | `/fleet-ops/maintenance/parts` |
| **Template** | `packages/fleetops/addon/templates/maintenance/parts/index.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\maintenance\parts\index.js` |
| **Route** | `packages\fleetops\addon\routes\maintenance\parts\index.js` |

---

## 1. Layout structure

- Section header with title/actions
- Scrollable section body
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
| column.part-number | `sku` | yes | yes |
| column.type | `type` | yes | yes |
| column.status | `status` | yes | yes |
| column.quantity-on-hand | `quantity_on_hand` | yes | yes |
| column.unit-cost | `unit_cost` | yes | yes |
| column.created-at | `createdAt` | yes | yes |
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

- Template: `{{#if (eq this.layout "table")}}`

---

## 9. API & data

| Interaction | Detail |
|-------------|--------|
| Data load | `store.query('part')` |


---

## 10. Permissions

- `fleet-ops view part`
- `fleet-ops update part`
- `fleet-ops delete part`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/maintenance/parts`
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
| `Layout::Section::Header` | TBD |
| `Layout::Resource::TabularActions` | TBD |
| `Layout::Section::Body` | TBD |
| `Layout::Resource::CardsGrid` | TBD |
| `Part::Card` | TBD |

---

## 15. Composed components (full UI)

### `Part::Card`

**Source:** `packages\fleetops\addon\components\part\card.hbs`


---

## 16. Source files to mirror

- Template: `packages/fleetops/addon/templates/maintenance/parts/index.hbs`
- Controller: `packages\fleetops\addon\controllers\maintenance\parts\index.js`
- Route: `packages\fleetops\addon\routes\maintenance\parts\index.js`


---

## Deep specification (auto-enriched)

### Controller actions/tabs (`packages/fleetops/addon/controllers/maintenance/parts/index.js`)

**Tabs:**
- Delete selected...



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

**Injected services:** `partActions`, `intl`, `appCache`

**Query params:** `type`, `status`, `page`, `limit`, `sort`, `query`, `public_id`, `created_at`, `updated_at`

### Action menu / header buttons

| Action | Handler | Disabled when |
|--------|---------|---------------|
| common.new | `partActions.transition` | `—` |
| common.import | `partActions.import` | `—` |


### Template conditionals

- `{{#if (eq this.layout "table")}}` — branch UI visibility

### Service action flows

#### `part-actions.import()`


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

