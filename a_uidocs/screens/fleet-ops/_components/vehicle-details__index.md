# vehicle detail tab: index

| Property | Value |
|----------|-------|
| **Parent screen** | [vehicle detail complete](../MASTER__vehicle-detail-complete.md) |
| **Route** | `fleet-ops.management.vehicles.index.details.index` |
| **Component** | `Vehicle::Details` |
| **Template** | `templates/management/vehicles/index/details/index.hbs` |

## Layout

- ContentPanel section(s) with optional `@actionButtons`

## Display fields & labels

| Field / i18n key |
|----------------|
| Trim |
| Color |
| Serial Number |
| Class |
| Call Sign |
| System of Measurement |
| Fuel Volume Unit |
| Odometer Unit |
| Odometer at Purchase |
| Body Type |
| Body Subtype |
| Usage Type |
| Ownership Type |
| Fuel Type |
| Transmission |
| Engine Number |
| Engine Make |
| Engine Model |
| Engine Family |
| Engine Configuration |
| Cylinder Arrangement |
| Number of Cylinders |
| Engine Size |
| Engine Displacement |
| Horsepower |
| Horsepower RPM |
| Torque |
| Torque RPM |
| Fuel Capacity |
| Payload Capacity |
| Towing Capacity |
| Seating Capacity |
| Vehicle Weight |
| Length |
| Width |
| Height |
| Cargo Volume |
| Payload Volume |
| Pallet Capacity |
| Parcel Capacity |
| Passenger Volume |
| Interior Volume |
| Ground Clearance |
| Bed Length |
| Emission Standard |
| DPF Equipped |
| SCR Equipped |
| GVWR |
| GCWR |
| Acquisition Cost |
| Current Value |
| Insurance Value |
| Depreciation Rate (%) |
| Estimated Service Life (Distance) |
| Service Life Distance Unit |
| Estimated Service Life (Months) |
| Purchase Date |
| Lease Expiry Date |
| Loan Amount |
| Number of Payments |
| First Payment Date |
| Skills & Capabilities |
| Available From |
| Available Until |
| Max Tasks |
| i18n:common.details |
| i18n:common.name |
| i18n:common.internal-id |
| i18n:vehicle.fields.plate-number |
| i18n:vehicle.fields.vin-number |
| i18n:vehicle.fields.make |
| i18n:vehicle.fields.model |
| i18n:vehicle.fields.year |
| i18n:vehicle.fields.driver-assigned |
| i18n:common.status |
| i18n:common.coordinates |
| i18n:common.yes |
| i18n:common.no |
| i18n:common.avatar |
| i18n:common.metadata |

## Buttons

_see actionButtons in component JS_

## Conditionals

- `#if @resource.engine_size`
- `#if @resource.engine_displacement`
- `#if @resource.horsepower`
- `#if @resource.torque`
- `#if @resource.fuel_capacity`
- `#if @resource.payload_capacity`
- `#if @resource.towing_capacity`
- `#if @resource.weight`
- `#if @resource.length`
- `#if @resource.width`
- `#if @resource.height`
- `#if @resource.cargo_volume`
- `#if @resource.payload_capacity_volume`
- `#if @resource.passenger_volume`
- `#if @resource.interior_volume`
- `#if @resource.ground_clearance`
- `#if @resource.bed_length`
- `#if (eq @resource.dpf_equipped true)`
- `#if (eq @resource.scr_equipped true)`
- `#if @resource.gvwr`
- `#if @resource.gcwr`
- `#if (or @resource.skills.length @resource.time_window_start @resource.time_window_end @resource.max_tasks)`
- `#if @resource.skills.length`
- `#if (or @resource.time_window_start @resource.time_window_end)`
- `#if @resource.max_tasks`

## Child components

- `ContentPanel`
- `ContentPanel`
- `ContentPanel`
- `ContentPanel`
- `ContentPanel`
- `CustomField::Yield`
- `ContentPanel`
- `ContentPanel`
- `Image`
- `RegistryYield`
- `RegistryComponent`
- `ContentPanel`
- `MetadataViewer`
- `Spacer`

## Custom UI notes

Rebuild as a tab inside vehicle detail. Model: `vehicle` (doc 33).


---


---

## 17. Runtime behavior (source-traced)

> Traced from controllers, routes, services, and templates. Reproduce this section for parity without opening Ember source.

### Controller state & services

**Injected services:** `resourceMetadata`


### Template conditionals

- `{{#if @resource.engine_size}}` — branch UI visibility
- `{{#if @resource.engine_displacement}}` — branch UI visibility
- `{{#if @resource.horsepower}}` — branch UI visibility
- `{{#if @resource.torque}}` — branch UI visibility
- `{{#if @resource.fuel_capacity}}` — branch UI visibility
- `{{#if @resource.payload_capacity}}` — branch UI visibility
- `{{#if @resource.towing_capacity}}` — branch UI visibility
- `{{#if @resource.weight}}` — branch UI visibility
- `{{#if @resource.length}}` — branch UI visibility
- `{{#if @resource.width}}` — branch UI visibility
- `{{#if @resource.height}}` — branch UI visibility
- `{{#if @resource.cargo_volume}}` — branch UI visibility
- `{{#if @resource.payload_capacity_volume}}` — branch UI visibility
- `{{#if @resource.passenger_volume}}` — branch UI visibility
- `{{#if @resource.interior_volume}}` — branch UI visibility
- `{{#if @resource.ground_clearance}}` — branch UI visibility
- `{{#if @resource.bed_length}}` — branch UI visibility
- `{{#if (eq @resource.dpf_equipped true)}}` — branch UI visibility
- `{{#if (eq @resource.scr_equipped true)}}` — branch UI visibility
- `{{#if @resource.gvwr}}` — branch UI visibility
- `{{#if @resource.gcwr}}` — branch UI visibility
- `{{#if (or @resource.skills.length @resource.time_window_start @resource.time_window_end @resource.max_tasks)}}` — branch UI visibility
- `{{#if @resource.skills.length}}` — branch UI visibility
- `{{#if (or @resource.time_window_start @resource.time_window_end)}}` — branch UI visibility
- `{{#if @resource.max_tasks}}` — branch UI visibility

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

### Component source

`packages/fleetops/addon/components/vehicle/details.js`

**Branches:**
- `#if @resource.engine_size`
- `#if @resource.engine_displacement`
- `#if @resource.horsepower`
- `#if @resource.torque`
- `#if @resource.fuel_capacity`
- `#if @resource.payload_capacity`
- `#if @resource.towing_capacity`
- `#if @resource.weight`
- `#if @resource.length`
- `#if @resource.width`
- `#if @resource.height`
- `#if @resource.cargo_volume`
- `#if @resource.payload_capacity_volume`
- `#if @resource.passenger_volume`
- `#if @resource.interior_volume`
- `#if @resource.ground_clearance`
- `#if @resource.bed_length`
- `#if (eq @resource.dpf_equipped true)`
- `#if (eq @resource.scr_equipped true)`
- `#if @resource.gvwr`
- `#if @resource.gcwr`
- `#if (or @resource.skills.length @resource.time_window_start @resource.time_window_end @resource.max_tasks)`
- `#if @resource.skills.length`
- `#if (or @resource.time_window_start @resource.time_window_end)`
- `#if @resource.max_tasks`

