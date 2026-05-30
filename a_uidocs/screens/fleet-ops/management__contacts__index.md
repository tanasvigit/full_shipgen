# Screen: management/contacts/index

| Property | Value |
|----------|-------|
| **Engine** | FleetOps |
| **Route name** | `fleet_ops.management.contacts` |
| **URL** | `/fleet-ops/management/contacts` |
| **Template** | `packages/fleetops/addon/templates/management/contacts/index.hbs` |
| **Controller** | `packages\fleetops\addon\controllers\management\contacts\index.js` |
| **Route** | `packages\fleetops\addon\routes\management\contacts\index.js` |

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
| column.id | `public_id` | yes | yes |
| column.internal-id | `internal_id` | yes | yes |
| column.title | `title` | yes | yes |
| column.email | `email` | yes | yes |
| column.phone | `phone` | yes | yes |
| column.address | `address` | yes | yes |
| column.created | `createdAt` | yes | yes |
| column.updated | `updatedAt` | yes | yes |


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
| Data load | `store.query('contact')` |


---

## 10. Permissions

- `fleet-ops view contact`
- `fleet-ops update contact`
- `fleet-ops delete contact`

---

## 11. Registries / extensions / hooks

_No registry slots in this template_

---

## 12. Navigation flow

- **Enter:** Navigate to `/fleet-ops/management/contacts`
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

- Template: `packages/fleetops/addon/templates/management/contacts/index.hbs`
- Controller: `packages\fleetops\addon\controllers\management\contacts\index.js`
- Route: `packages\fleetops\addon\routes\management\contacts\index.js`


---

## Deep specification (auto-enriched)

### Controller actions/tabs (`packages/fleetops/addon/controllers/management/contacts.js`)

**Tabs:**
- Contacts
- Customers



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
| `fleet-ops list contact` | redirect/warning — see route for target |

**beforeModel:** unauthorized users get warning toast + redirect (see route source)
- `beforeModel`: auth/permission gate before fetch
- On failure redirects to `console.fleet-ops`

### Controller state & services

**Injected services:** `hostRouter`

**Tabs:**
- Contacts
- Customers
- route: management.contacts.index
- route: management.contacts.customers


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

