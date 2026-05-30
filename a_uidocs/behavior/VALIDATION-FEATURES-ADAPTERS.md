# Validation, feature flags, and adapter patterns

Source-traced patterns for Ember Data forms and API calls across Fleetbase engines.

## Form validation

| Pattern | Where | Behavior |
|---------|-------|----------|
| Changeset + validations | `ember-changeset` on create/edit forms | Invalid save blocked; errors on fields |
| Model validators | `packages/fleetops-data` validators (e.g. order) | Server-aligned rules before `save()` |
| Modal confirm | `resource-action` / `*-actions` | `saveTask` catches validation → `serverError` toast |
| Early exit | Action services | `notifications.warning` when preconditions fail (no API call) |

**Order-specific:** see `packages/fleetops/addon/validations/order-validation.js` — status transitions, required payload fields.

**Rebuild rule:** Mirror validations in your framework schema (Zod/Yup) using the same attribute names as doc 33.

## Feature flags and options

| Source | Usage |
|--------|--------|
| `currentUser.getOption('key')` | Per-user toggles |
| `company.options` / `company.getOption` | Tenant-level features |
| Extension registry | Hides/shows tabs and menu items |

Grep Ember source: `getOption`, `company.options`, `abilities.cannot` on the screen you implement.

## Adapters and serializers

| Layer | Path | Role |
|-------|------|------|
| FleetOps adapter | `packages/fleetops-data/addon/adapters/` | Namespace, headers, coalesce |
| Serializers | `packages/fleetops-data/addon/serializers/` | Payload key transforms, embedded records |
| `fetch` service | `ember-core` | Non-Ember-Data PATCH/POST (bulk, custom endpoints) |

**Bulk actions:** `crud.bulkAction({ actionPath, actionMethod })` — not always Ember Data `save()`.

**Order route save:** `PATCH orders/route/:id` via `order-actions.saveRoute`.

## Import / export

- `resource-action.export` → download with current table filters
- `resource-action.import` → modal + file upload + `importTemplatePath`
- List controllers pass `onImportComplete` → `refresh`

## Drag-drop and layout

| UI | Controller signal |
|----|-------------------|
| Orders kanban/map/table | `changeLayout('map'|'table'|'kanban')` |
| Vehicles table/grid | `appCache` key `fleetops:vehicles:layout` |
| Gridstack (where used) | Widget dashboard — see console home |

## Empty / loading / error (standard)

- List: `Layout::Resource::Tabular` + query params → route `model()` refresh
- Detail: route `error` → toast + redirect list
- Tasks: `@isLoading={{task.isRunning}}`
- `#each` `{{else}}` → empty state copy from template `{{t ...}}` keys
