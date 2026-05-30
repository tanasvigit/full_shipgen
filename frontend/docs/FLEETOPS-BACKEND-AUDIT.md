# FleetOps backend ↔ frontend alignment audit

Source of truth: `documents/BACKEND-LOW-LEVEL-REQUIREMENTS.md`, `documents/LOW-LEVEL-REQUIREMENTS.md`, and `packages/fleetops/server` (models, migrations, form requests, API resources).

## Payload wrappers (internal API)

| Resource | POST/PATCH body key | Builder |
|----------|---------------------|---------|
| Order | `order` | `buildOrderPayload()` |
| Driver | `driver` | `buildDriverPayload()` |
| Vehicle | `vehicle` | `buildVehiclePayload()` |
| Place | `place` | `buildPlacePayload()` |
| Fleet | `fleet` | `buildFleetPayload()` |
| Schedule item | `schedule_item` | `buildScheduleItemPayload()` → `schedulesService.createScheduleItem()` |

## Module gap matrix

### Orders

| Backend (CreateOrderRequest + order model) | Frontend `OrderForm` | Gap / notes |
|--------------------------------------------|----------------------|-------------|
| `order_config_uuid` **required** | Yes | Must exist in tenant; empty state shown on Order New |
| `payload.pickup_uuid` / `dropoff_uuid` or `waypoints[]` (min 2) | Yes (pickup/dropoff + multi-waypoint) | Map picker / geocode inline still shallow |
| `customer`, `facilitator`, `driver`, `vehicle_assigned` | Async selects | Fleet assignment not separate field (uses vehicle) |
| `scheduled_at`, `status`, `priority`, `service_type` | Yes | |
| `notes`, `dispatch_notes`, `instructions` | Yes | |
| `pod_required`, `pod_method` | Yes | Method required when POD on |
| `time_window_start/end`, `required_skills`, `orchestrator_priority` | Partial | Skills via checkboxes on driver; order skills list basic |
| `payload.entities[]` | Yes (dynamic rows) | |
| `meta`, `custom_field_values`, `files` | Meta pairs + JSON; files | **Gap:** file upload UI not wired |
| `service_quote`, `purchase_rate` | Quote id field only | Purchase rate not exposed |
| `adhoc`, `adhoc_distance`, `dispatched` | Yes | |
| Activity timeline, audit, proof attachments on detail | Read-only on detail | **Gap:** no edit order modal on detail page |
| Route assignment, billing/cost, tags | Not in internal create rules | Operational UI placeholders only |

### Routing

| Backend | Frontend `RoutingOptimization` | Gap |
|---------|-------------------------------|-----|
| Orders with coordinates → route cards + map | Yes (list + Leaflet) | No dedicated route CRUD entity in FleetOps package |
| OSRM / optimization APIs | Not found as first-class internal resource | **Backend gap** for stop optimization UI |
| Depot, constraints, load balancing | — | **Future:** needs route model or order-batch API |

### Schedule

| Backend | Frontend | Gap |
|---------|----------|-----|
| `schedule-items` CRUD | `ShiftForm` + weekly grid | No drag/drop, recurring templates, exceptions |
| Driver + weekday + hours | Yes | Timezone, breaks, conflict detection not implemented |
| Full `schedules` resource | List only via items | Shift templates UI **gap** |

### Drivers

| Backend (CreateDriverRequest) | Frontend `DriverForm` | Gap |
|------------------------------|----------------------|-----|
| `name`, `email`, `phone`, `password` | Yes | Password optional on edit |
| `drivers_license_number`, `internal_id`, `country`, `city` | Yes | License **expiry**, certifications **gap** |
| `vehicle`, `vendor`, `status` | Yes | |
| `latitude`/`longitude`, skills, max travel/distance, time windows | Yes | |
| `photo_uuid` / `avatar_uuid` | — | **Gap:** profile image upload |
| Emergency contacts, payroll IDs, onboarding, compliance docs | — | **Gap** (not in create request) |
| Detail edit | `PATCH` via edit dialog | Activity/compliance alerts **gap** |

### Vehicles

| Backend (vehicle fillable + create rules) | Frontend `VehicleForm` | Gap |
|-------------------------------------------|------------------------|-----|
| `name`, `plate_number`, `vin`, make/model/year | Yes | |
| `vehicle_type`, `status`, `driver`, `fuel_type` | Yes | |
| `odometer`, dimensions, `payload_capacity`, `cargo_volume`, `ownership_type` | Yes | |
| Insurance, registration expiry, inspection, telematics IDs | — | **Gap** (model may have meta; not in form) |
| Maintenance schedules, fleet assignment | Detail tabs placeholder | **Gap** |
| Detail edit | `PATCH` via edit dialog | Service history / alerts **gap** |

### Places

| Backend (CreatePlaceRequest) | Frontend `PlaceForm` | Gap |
|-----------------------------|----------------------|-----|
| name **or** street **or** lat/lng | Yes (zod refine mirrors) | |
| Full address, `opening_hours`, `security_access_code` | Yes | |
| Geocoding / address autocomplete | Manual fields | **Gap:** no Places API autocomplete |
| Contacts, dock metadata, geofence radius | Notes in meta only | **Gap** |
| Detail edit | `PATCH` via edit dialog | |

### Fleets

| Backend | Frontend `FleetForm` | Gap |
|---------|---------------------|-----|
| `name`, `description`, `service_area` | Yes | |
| `meta` region, territory, status, manager | Yes | |
| Assigned drivers/vehicles on create | — | Managed via relations on backend; UI shows on detail only |
| KPIs, utilization, maintenance metrics | Card counts only | **Gap** (computed server-side if exposed) |
| Detail edit | `PATCH` via edit dialog | |

## Validation & lifecycle

- **Orders:** Status transitions via `dispatch` / `cancel` endpoints on detail; create allows optional `status`.
- **Drivers:** `status` ∈ `active`, `inactive`; email/phone unique on create.
- **Vehicles:** `status` ∈ `operational`, `maintenance`, `decommissioned`.
- **Places:** Flexible create rule (name OR address OR coordinates).
- **Fleets:** Name required; service area UUID optional.

## Frontend architecture (implemented)

```
frontend/src/
  lib/fleetops/          constants, schemas (zod), payloads, parseApiErrors
  services/fleetops.js   wrapped CRUD + order transitions + lookups
  services/schedules.js  schedule_item wrapper on create
  hooks/fleetops/useFleetopsLookups.js
  components/fleetops/
    FleetOpsFormDialog.jsx, EntityAsyncSelect.jsx, FormSection.jsx
    forms/*Form.jsx      react-hook-form + zod + valuesFromApi helpers
    useFleetopsFormDialog.js
  pages/fleetops/        list create dialogs + OrderNew + detail edit dialogs
```

## Playwright coverage

- `e2e/fleetops/ui-complete.spec.ts` — routes, nav, orders views, tables, **FleetOps form dialogs** (`openFleetOpsFormAndCancel`), detail edit dialog smoke (driver).
- Stable selectors: `data-testid` on pages, forms, and dialog shells.

## Recommended next increments

1. Order detail: edit modal using `OrderForm` + `updateOrder`.
2. File upload + `custom_field_values` driven by `order_config`.
3. Address geocode component for places/orders.
4. Schedule: recurring shifts + conflict hints when API schema confirmed.
5. Routing: align with any OSRM/proxy endpoints once documented in backend LLD.

## Backend gaps discovered

- No standalone **Route** CRUD matching LLD “routing module” — routing UI derives from orders.
- **Schedule item** request class not located under `Http/Requests`; payload shape inferred from controller usage (`driver_uuid`, `weekday`, `start_hour`, `end_hour`).
- Driver **compliance** fields (license expiry, certifications) not in `CreateDriverRequest` — would need migration + request rules before UI.
