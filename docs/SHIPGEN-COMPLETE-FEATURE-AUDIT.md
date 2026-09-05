# ShipGen Complete Feature Audit

**Audit date:** 2026-07-13  
**Scope:** Entire repository at `d:\fleetbase` (branded ShipGen / Fleetbase logistics OS)  
**Method:** Code extraction only — routes, migrations, UI routers, services, configs, Docker, auth schemas  
**Exclusions:** No competitor comparison, no improvement suggestions, no estimated/planned features unless marked Planned from absent code

**Status legend**

| Status | Meaning |
|--------|---------|
| **Implemented** | Code paths, UI, and/or APIs exist and are wired |
| **Partial** | Present but incomplete, optional, unwired, or docs-only |
| **Planned** | Documented/named but no product implementation found |
| **Deprecated** | Removed or archive-only |
| **Not present** | Requested scope item with no implementation in codebase |

---

# Executive Summary

ShipGen is a modular logistics operating system built on Fleetbase packages plus specialized Yard (YMS) and Parking (PMS) FastAPI services, a React console, an Expo mobile app, nginx API gateway, and optional PHP microservice slices.

**What exists as product modules**

| Area | Implementation |
|------|----------------|
| FleetOps (TMS) | Laravel package + React console + mobile |
| YMS (Yard) | FastAPI + Postgres + React (standalone + console embed) |
| PMS (Parking / ParkFlow) | FastAPI + Postgres + React (standalone + console embed) |
| IAM / Auth / Multi-tenant | core-api (Sanctum + Spatie + policies/directives) |
| Storefront | Laravel package + console pages |
| Pallet (WMS-lite) | Laravel package + console pages |
| Ledger (billing) | Laravel package + console pages |
| Registry / Extensions | registry-bridge package + console home |
| Developers platform | API keys, webhooks, events, logs, sockets |
| Mobile | Expo app (FleetOps + Yard) |
| Infrastructure | Docker Compose, Redis, MySQL, OSRM, tiles, SocketCluster, Helm |

**Explicitly not found in application code**

- AI Gateway / LLM orchestration service (OpenAI, Anthropic, LangChain clients, etc.)
- Dedicated enterprise document-management system beyond platform Files API
- YMS/PMS background workers or cron (request-driven only)
- Live Ember console (removed; archive docs only)

YMS “Recommendations / AI” UI is **rule-based operational insights**, not an LLM. PMS plate recognition uses optional **EasyOCR**, not a generative AI gateway.

---

# Complete Module Inventory

| # | Module | Primary path(s) | Status |
|---|--------|-----------------|--------|
| 1 | Authentication | `packages/core-api`, console `/auth/*`, mobile login | Implemented |
| 2 | Authorization / RBAC | Spatie + Auth Schemas; YMS/PMS own RBAC | Implemented |
| 3 | User Management | IAM users/groups/roles/policies | Implemented |
| 4 | Multi-Tenant / Organizations | Companies, switch-org, company-scoped roles | Implemented |
| 5 | FleetOps (Orders, Trips/Routes, Dispatch) | `packages/fleetops`, console `/fleet-ops/*` | Implemented |
| 6 | Drivers | FleetOps drivers + mobile | Implemented |
| 7 | Vehicles | FleetOps vehicles + tracking | Implemented |
| 8 | Customers / Contacts / Vendors | FleetOps management resources | Implemented |
| 9 | Tracking / Maps / Live | Live API, geocoder, OSRM, Leaflet/Google Maps | Implemented |
| 10 | Route Planning / Orchestrator | Routes, orchestrator, routing settings | Implemented |
| 11 | Proof of Delivery | Signatures, QR, photo, proofs | Implemented |
| 12 | Geofences | Events, inventory, dwell, history | Implemented |
| 13 | Telematics / Devices / Sensors | Providers: Samsara, Geotab, Flespi | Implemented |
| 14 | Maintenance / Work Orders | Schedules, records, equipment, parts, warranties | Implemented |
| 15 | YMS (Yard / Dock / Queue) | `yms/` | Implemented |
| 16 | PMS (Parking) | `Parking management/` | Implemented |
| 17 | Warehouse (Pallet) | `packages/pallet` | Implemented |
| 18 | Storefront / Commerce | `packages/storefront` | Implemented |
| 19 | Ledger / Billing | `packages/ledger` | Implemented |
| 20 | Notifications | Mail, DB, broadcast, FCM, APN, Twilio | Implemented |
| 21 | Reports / Analytics / Dashboards | core-api reports + FleetOps analytics + YMS/PMS reports | Implemented |
| 22 | Chat | Chat channels/messages/participants | Implemented |
| 23 | Schedules (platform) | Schedules, templates, exceptions, materialize job | Implemented |
| 24 | Files / Uploads | Files CRUD, base64, download | Implemented |
| 25 | Search / Filters / Export / Import | Per-resource search, export, import on many FleetOps resources | Implemented |
| 26 | Developers / Webhooks / API credentials | Developers console + registry | Implemented |
| 27 | Settings / Branding | Platform + FleetOps + module settings | Implemented |
| 28 | Audit / Activity / API logs | Activities, api-request-logs, webhook logs; PMS audit_logs | Implemented |
| 29 | Rate Limiting | API + auth + storefront throttles | Implemented |
| 30 | Queue / Workers / Scheduler | Redis queue worker + go-crond schedule:run | Implemented |
| 31 | Caching | Redis cache, response cache, geocode cache | Implemented |
| 32 | Event Gateway (HTTP) | `docker/gateway` nginx | Implemented |
| 33 | Provider Layer | Telematics + Ledger payment drivers | Implemented |
| 34 | Contracts (microservice DTOs) | `packages/contracts` (`shipgen/contracts`) | Implemented |
| 35 | Mobile Support | `frontend_mobile/frontend` | Implemented |
| 36 | Responsive Web Console | `frontend/` React | Implemented |
| 37 | AI Gateway (LLM) | — | **Not present** |
| 38 | YMS Recommendations (“AI”) | Rule-based client insights | Implemented (non-LLM) |
| 39 | PMS OCR | EasyOCR optional | Partial |
| 40 | Ember Console | Archive docs only | Deprecated |

---

# Detailed Module Documentation

---

## Authentication

### Purpose
Authenticate console users, drivers, gateway clients, YMS/PMS users, and mobile sessions.

### Existing Features
- Email/password login (`POST int/v1/auth/login`)
- Google OAuth login (`login-with-google`)
- Sign-up / onboard account creation
- Magic password reset link + reset password
- Email verification sessions
- SMS verification (onboard)
- Two-factor authentication (check / validate / verify / resend / invalidate + enforce config)
- Session bootstrap (`auth/session`, `auth/bootstrap`)
- Logout
- Organization switch / join / create
- Impersonation (start/stop)
- Change user password
- Accept company invite
- Driver login / SMS login / verify code (FleetOps public API)
- Driver device registration
- YMS login, refresh, logout, platform-login (SSO from console), impersonate
- PMS login, platform-login, logout, me
- Mobile unified login + two-factor screen
- API key / basic auth for public `fleetbase.api` group
- Gateway auth (`GET int/v1/gateway/auth`) with gateway secret middleware
- Internal service JWT trust (`TrustInternalServiceJwt`)

### UI Screens
- `/auth` Login
- `/auth/onboard` Onboard
- `/auth/onboard/verify-email`
- `/auth/forgot-password`
- `/auth/two-fa`
- Mobile: `/login`, `/two-fa`
- YMS: `/login`, `/unauthorized`
- PMS: `/login` (standalone)

### APIs
See [API Inventory — Auth](#api-inventory)

### Database Tables
`users`, `personal_access_tokens`, `login_attempts`, `verification_codes`, `user_devices`, `invites`, `companies`, `company_users`; YMS `users`, `refresh_tokens`; PMS `users`, `token_denylist`

### Permissions
Protected by Sanctum session/token; auth routes throttled

### Integrations
Google OAuth, Twilio/CallPro SMS, email providers

### AI Features
None

### Infrastructure
Throttle on auth routes; Redis sessions in Docker

### Status
**Implemented**

---

## Authorization / RBAC

### Purpose
Permission-based access control for platform resources and module UIs.

### Existing Features
- Spatie Laravel Permission (`permissions`, `roles`, `model_has_*`, `role_has_permissions`)
- Custom **Policy** and **Directive** models (scoped authorization)
- Auth Schemas generate permissions via `fleetbase:create-permissions`
- Pattern: `{service} {action} {resource}` with wildcards
- Always-created `Administrator` role + `AdministratorAccess` policy
- Per-schema FullAccess / ReadOnly policies
- Company-scoped roles (`company_uuid`)
- Console `RequirePermission` guards on IAM routes
- YMS module permissions (`module.*`) + action permissions (`flow.*`, `gate.*`, etc.)
- PMS role permissions: admin / supervisor / operator
- Engine/module access gating in console (`engineAccess.js`)

### Permissions / Roles (platform named roles)
See [Security Inventory](#security-inventory)

### Status
**Implemented** (Pallet has no Auth Schema directory — API protected by `fleetbase.protected` only)

---

## User Management / Organization / Multi-Tenant

### Purpose
Manage users, companies/organizations, groups, invites, and company context.

### Existing Features
- Users CRUD + me, export, activate/deactivate/verify, remove-from-company, bulk-delete
- Invites
- Groups + group users + export
- Roles / Policies / Permissions management UI and API
- Companies: users list, two-FA company config, transfer ownership, leave, export
- Create / join / switch organization
- Current organization public endpoint
- Branding & platform settings
- User locale / devices
- Sandbox session support
- FleetOps customer credentials reset
- YMS admin user & role management
- PMS employee/user management

### UI Screens
- `/iam`, `/iam/users`, `/iam/users/drivers`, `/iam/users/customers`, `/iam/users/:id`
- `/iam/roles`, `/iam/groups`, `/iam/groups/:id`, `/iam/policies`
- `/settings` (org, branding, modules, billing tabs)
- `/account`
- YMS `/admin/users`, `/admin/roles`
- PMS `/admin/users`

### Database Tables
`users`, `companies`, `company_users`, `groups`, `group_users`, `roles`, `policies`, `permissions`, `invites`, `directives`, …

### Status
**Implemented**

---

## FleetOps

### Purpose
Transport / fleet operations: orders, routes, drivers, vehicles, dispatch, tracking, rates, maintenance, telematics.

### Existing Features
- Order CRUD, search, statuses, types, labels
- Order schedule / dispatch / start / cancel / complete / update-activity
- Bulk assign driver, bulk cancel, bulk dispatch, bulk delete
- Order import (`process-imports`)
- Order tracker + ETA + distance-and-time
- Next activity workflow
- Editable entity fields
- Proof of delivery: signature, QR, photo capture; proofs list
- Order configs / workflow configuration
- Routes CRUD + route patch
- Orchestrator: list orders, run, commit, preview, engines, import-orders, order-config-fields
- Schedule planner (operations schedule UI)
- Service rates / service quotes (including preliminary, Stripe checkout session)
- Purchase rates
- Drivers: track, toggle online, schedule items, availabilities, HOS status, active shift, avatars, statuses, import/export
- Vehicles: track, devices
- Fleets: assign/remove driver/vehicle, import/export
- Places: search, lookup, geocode, avatars, import/export
- Zones & service areas
- Geofences: events, inventory, dwell-report, driver history
- Contacts, customers, facilitators, vendors, integrated vendors
- Entities, payloads, positions (replay, metrics)
- Tracking numbers (incl. from QR) & tracking statuses
- Fuel reports, issues
- Live map data: coordinates, routes, orders, drivers, vehicles, places
- Manifests & manifest stops
- Labels
- Metrics endpoint
- Driver onboard settings
- Navigator app link endpoints
- Payments: Stripe Connect account/session, payments received
- Settings: routing, scheduling, orchestrator, notifications, avatars, payments, entity editing, customer order configs
- Maintenance schedules (pause/resume/trigger, calendar-feed, iCal), maintenances (line items), work orders (send), equipment, parts, warranties
- Telematics providers registry, discover, link-device, test connection/credentials
- Devices, sensors, device events
- Custom fields (platform + FleetOps UI)
- Analytics reports builder (core reports API surfaced in FleetOps UI)
- Ad-hoc / scheduled order dispatch commands
- Distance/time estimation command
- Simulation commands (navigation, geofence)
- Import/export on many resources

### UI Screens (console)
**Operations:** Orders, Order New, Routes, Route New, Orchestrator, Schedule, Order Config, Service Rates  
**Management:** Drivers, Vehicles, Places, Fleets, Vendors, Integrated Vendors, Contacts, Fuel Reports, Issues, Customers  
**Connectivity:** Telematics, Devices, Sensors, Device Events, Tracking Hub, Vehicle Devices  
**Maintenance:** Calendar, Schedules, Records, Work Orders, Equipment, Parts  
**Platform:** Service Areas, Geofences, Custom Fields, Analytics Reports (list/new/edit/result/detail), Tracking Lookup  
**Admin resources:** Warranties, Manifests, Payloads, Entities, Proofs, Purchase Rates, Tracking Numbers, Tracking Statuses  
**Settings:** FleetOps settings home, Navigator, Routing, Orchestrator, Scheduling, Notifications, Avatars, Payments, Entity Editing  
**Note:** `RoutingOptimization.jsx` exists but routing URL redirects to Routes list (component not mounted as primary page)

### APIs
Public `v1` + internal `int/v1` FleetOps resources and custom actions — see [API Inventory](#api-inventory)

### Database Tables
`orders`, `order_configs`, `routes`, `waypoints`, `drivers`, `vehicles`, `fleets`, `fleet_drivers`, `fleet_vehicles`, `places`, `zones`, `service_areas`, `contacts`, `vendors`, `vendor_personnels`, `integrated_vendors`, `entities`, `payloads`, `positions`, `proofs`, `purchase_rates`, `service_rates`, `service_rate_fees`, `service_rate_parcel_fees`, `service_quotes`, `service_quote_items`, `tracking_numbers`, `tracking_statuses`, `fuel_reports`, `issues`, `devices`, `device`/`vehicle_device_events`, `sensors`, `telematics`, `assets`, `equipments`, `parts`, `warranties`, `maintenance_schedules`, `maintenance_schedule_reminders`, `maintenances`, `work_orders`, `manifests`, `manifest_stops`, `geofence_events_log`, `driver_geofence_states`, `vehicle_geofence_states`, …

### Permissions
FleetOps schema roles: Operations Manager, Fleet Supervisor, Service Coordinator, Operations Administrator, Maintenance Technician, Driver Coordinator, Navigator App Manager, Driver, Fleet-Ops Customer, Fleet-Ops Contact

### Integrations
Google Maps geocoding, OSRM routing, map tiles, Stripe Connect, telematics (Samsara, Geotab, Flespi), Lalamove integration package, Firebase push, SocketCluster live

### AI Features
None in FleetOps package

### Infrastructure
Scheduled: `fleetops:dispatch-orders`, `dispatch-adhoc` (every minute), estimations, purge quotes, maintenance triggers/reminders; Jobs for geofence dwell, allocation, telematics sync, position replay, route simulation

### Status
**Implemented** (Routing Optimization page file **Partial** — not primary-routed)

---

## YMS (Yard Management / YARD.OS)

### Purpose
Yard control tower: appointments, gate, virtual queue, docks, loading, detention, zones, resources, reports, RBAC.

### Existing Features
- Control Tower dashboard & alerts
- Appointments management
- Gate: lookup/scan, arrive, approve/reject entry, exit holding, verify, gate-out, weighing hooks
- Virtual queue: priority, override, tare/gross weight
- Yard map / zones CRUD, move vehicle, vehicle history, zone rules
- Docks management & utilization
- Loading operations: exceptions, pause/resume/complete
- Vehicles lifecycle / operations monitor
- Equipment management
- Labor teams / shifts
- Detention records / cost & disputes
- Operations dashboard (shift KPIs)
- Delay analysis report
- Executive KPIs
- Recommendations page (rule-based insights from alerts)
- Global search
- Reports export (CSV/Excel; PDF stub on backend; client daily PDF/CSV)
- User management & role management
- System settings
- Platform SSO (`platform-login`) for ShipGen console embed
- Auth: login, refresh, logout, me, impersonate
- Health/status checks

### UI Screens
`/`, `/appointments`, `/gate`, `/queue`, `/yard`, `/docks`, `/vehicles`, `/loading`, `/detention`, `/equipment`, `/labor`, `/ai`, `/kpis`, `/operations-dashboard`, `/reports/delay-analysis`, `/settings`, `/admin/users`, `/admin/roles`, `/unauthorized`, `/login`  
**Unwired page files (exist, not in App router):** SlaComplianceReport, DockUtilizationReport, EquipmentUtilizationReport, LaborProductivityReport, VehicleJourneyAnalytics  
**Console embed:** `/yard/*`

### APIs
~133 FastAPI route handlers under `/api` (gateway `/api/yms/` → `/api/`)

Routers: `auth`, `status`, `search`, `yms`, `yard`, `queue`, `gate`, `reports`, `control_tower`, `loading_ops`, `admin`

### Database Tables (Postgres `smart_yard`)
`status_checks`, `vehicles`, `appointments`, `docks`, `queue_entries`, `equipment`, `labor_teams`, `detention_records`, `yard_events`, `loading_operation_exceptions`, `gate_verifications`, `yard_zones`, `vehicle_zone_history`, `zone_rules`, `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `refresh_tokens`

### Permissions
Module codes: control_tower, appointments(+view), gate, queue, yard_map(+view), vehicles, docks, labor, equipment, loading, detention, operations_dashboard, delay_analysis, kpis, reports, user_management, role_management, settings, ai  
Action codes: vehicle/appointment/queue/dock write, flow check-in/call/assign_dock/transition, gate approve/reject/verify/gate-out, loading start/complete/exceptions, reports view/export, etc.

### Integrations
ShipGen IAM userinfo (`PLATFORM_USERINFO_URL` → iam-service); nginx gateway

### AI Features
**Recommendations:** client maps Control Tower alerts to insights; savings are not ML predictions (`aiInsightsApi.js`)

### Infrastructure
No YMS queue workers or cron; schema via startup DDL (`db.py`); Docker `yms-postgres` + `yms-service`

### Status
**Implemented** (extra report pages **Partial**/unwired; “AI” = non-LLM)

---

## PMS (Parking Management / ParkFlow)

### Purpose
Multi-floor parking tickets, payments, occupancy, pricing, QR, hardware, role dashboards, audit.

### Existing Features
- Role dashboards: admin, supervisor, operator
- Ticket create / pay / exit / QR / search
- Floor & capacity management; occupancy summary
- Pricing rules
- Revenue / traffic / occupancy reports
- Admin PDF export (client jsPDF)
- Monitoring: operators, alerts, QR scans, entries, exits
- Hardware list + restart
- Audit logs
- Plate OCR upload (`/ocr/plate`) — EasyOCR optional
- Users CRUD
- Settings (admin/operator)
- Platform SSO for console embed
- QR monitoring & print

### UI Screens
**Admin:** dashboard, users, pricing, parking, parking-floors, reports, hardware, qr-monitoring, audit-logs, settings  
**Supervisor:** dashboard, monitoring, parking-floors, vehicle-search, qr-monitoring, reports, operator-activity, recent-tickets  
**Operator:** dashboard, occupancy, new-ticket, collect-payment, qr-print, vehicle-search, exit-vehicle, recent-tickets, settings  
**Console embed:** `/parking/*`

### APIs
~37 FastAPI handlers under `/api/v1` (gateway `/api/pms/` → `/api/v1/`)  
Routers: auth, users, floors, tickets, ocr, pricing, dashboard, reports, monitoring, hardware, audit

### Database Tables (Postgres `parkflow`)
`parking_floors`, `parking_floor_capacities`, `tickets`, `payments`, `vehicle_events`, `pricing_rules`, `hardware_devices`, `supervisor_alerts`, `qr_scan_events`, `users`, `roles`, `permissions`, `role_permissions`, `token_denylist`, `audit_logs`

### Permissions
Roles: `admin`, `supervisor`, `operator` with ~27 permission codes (dashboard, tickets, payments, floors, reports, hardware, audit, etc.)

### Integrations
ShipGen IAM platform-login; optional EasyOCR

### AI Features
OCR plate reading only (not generative AI)

### Infrastructure
No PMS workers/cron; `Base.metadata.create_all` seed path; Docker `pms-postgres` + `pms-service`

### Status
**Implemented** (OCR **Partial** — optional dependency; README mentions Alembic/mobile-app not present in tree)

---

## Pallet (Warehouse)

### Purpose
Inventory and warehouse management extension.

### Existing Features
- Warehouses (extends FleetOps Place; aisles, bins, docks, racks, sections in schema)
- Inventories, batches, products
- Purchase orders, sales orders
- Stock adjustments / stock transactions
- Suppliers
- Audits
- Bulk-delete on several resources
- Console: inventory, warehouses, transfers, suppliers, purchase-orders

### UI Screens
`/pallet`, `/pallet/inventory`, `/pallet/warehouses`, `/pallet/transfers`, `/pallet/suppliers`, `/pallet/purchase-orders`

### APIs
Protected `pallet/int/v1` REST for audits, batches, inventories, products, sales-orders, purchase-orders, stock-adjustments, suppliers, warehouses

### Database Tables
`pallet_audits`, `pallet_batches`, `pallet_inventories`, `pallet_purchase_orders`, `pallet_sales_orders`, `pallet_stock_adjustment`, `pallet_stock_transactions`, `pallet_warehouse_aisles`, `pallet_warehouse_bins`, `pallet_warehouse_docks`, `pallet_warehouse_racks`, `pallet_warehouse_sections`

### Permissions
No dedicated Auth Schema (uses platform protected middleware)

### Status
**Implemented**

---

## Storefront

### Purpose
Headless commerce / marketplace: stores, products, carts, checkouts, networks.

### Existing Features
- Stores, store hours, store locations
- Products, variants, addons, hours, categories
- Catalogs & catalog hours/categories
- Networks & network stores
- Customers (auth, Stripe, account closure, phone verify)
- Carts, checkouts (incl. QPay capture)
- Service quotes from cart
- Orders (picked-up, receipt flows)
- Food trucks
- Reviews, votes
- Gateways & notification channels
- Promotions & coupons UI pages
- Checkout preview UI
- Metrics / store-count / push actions (internal)
- Nearby order notifications (scheduled)
- Cart purge (scheduled)
- Stripe customer migration command

### UI Screens
`/storefront`, products (+ new/:id), catalogs, customers (+ :id), networks, promotions, coupons, checkout

### APIs
`storefront/v1` public API + `storefront/int/v1` internal

### Database Tables
Separate storefront DB connection: `carts`, `catalogs`, `checkouts`, `food_trucks`, `gateways`, `networks`, `network_stores`, `notification_channels`, `payment_methods`, `products` (+ variant/addon/hours tables), `reviews`, `stores`, `store_hours`, `store_locations`, `votes`, …

### Permissions
Roles: Storefront Administrator, Customer Service, Inventory Manager

### Integrations
Stripe, QPay, Google Maps (geocoder), push/SMS notifications

### Status
**Implemented**

---

## Ledger (Billing / Accounting)

### Purpose
Invoicing, wallets, journals, payment gateways, financial reports.

### Existing Features
- Chart of accounts
- Invoices (+ public pay page, gateways, pay)
- Journals
- Wallets (balance, transactions, topup via API key route)
- Transactions
- Gateways: list drivers, charge, refund, setup-intent
- Settings
- Financial reports
- Webhook endpoint `ledger/webhooks/{driver}`
- Commands: provision defaults, update overdue invoices, backfill direction
- Payment drivers: Stripe, QPay, Cash

### UI Screens
`/ledger`, invoices (+ :id), transactions, wallets, reports, chart-of-accounts, journal

### Database Tables
`ledger_accounts`, `ledger_invoices`, `ledger_invoice_items`, `ledger_journals`, `ledger_wallets`, `ledger_gateways`, `ledger_gateway_transactions`

### Permissions
Roles: Ledger Administrator, Billing Specialist, Accountant, Finance Viewer, Payments Operator

### Status
**Implemented**

---

## Registry Bridge / Extensions

### Purpose
Bridge to extensions registry: publish, install, purchase, developer accounts.

### Existing Features
- Public extension list/lookup/bundle-upload
- Developer account register/verify/resend/generate-token
- Composer authenticate
- Install / uninstall
- Stripe payments for extensions
- REST: registry-extensions, registry-extension-bundles
- `registry:init` command
- Console Registry home

### UI Screens
`/registry`

### Database Tables
`registry_developer_accounts`, `registry_extension_bundles`, `registry_extension_installs`, `registry_extension_purchases`, `registry_extensions`, `registry_users`

### Permissions
Roles: Extension Developer, Quality Assurance, Extension Auditor, Extension Admin

### Status
**Implemented** (README still mentions Ember in places; UI is React home)

---

## Developers Platform

### Purpose
API credentials, webhooks, events, request logs, sockets for integrators.

### Existing Features
- API credentials CRUD, roll key, bulk-delete, export
- Webhook endpoints enable/disable, events, versions
- Webhook request logs
- API events & API request logs
- Activities
- Schedule monitor tasks/logs
- Socket listing UI
- Metrics IAM / IAM dashboard

### UI Screens
`/developers`, api-keys, webhooks (+ :id), events, logs, sockets

### Status
**Implemented**

---

## Notifications

### Purpose
Multi-channel user and operational notifications.

### Existing Features
- Notification registry, notifiables, settings, mark-as-read, bulk-delete
- Channels in code: mail, database, broadcast, FCM, APN, Twilio (storefront)
- Core notifications: chat, password reset, invites, user created, test push
- FleetOps: order assigned/canceled/completed/dispatched/failed/ping/split, waypoint completed, driver geofence, shift changed
- Storefront: order lifecycle + nearby + promotional push
- Console `/notifications`
- FleetOps notification settings page
- Platform settings notification-channels config + tests

### Status
**Implemented**

---

## Reports / Dashboards / Analytics

### Purpose
Operational KPIs and custom reporting.

### Existing Features
- Console Dashboard (KPIs, map, charts, live orders/drivers)
- Platform reports: schema introspection, validate/execute/analyze/export, recommendations, scheduled run command
- Report templates, executions, cache, audit logs (tables)
- Dashboards & dashboard widgets (switch, reset-default)
- FleetOps analytics reports UI (builder/result)
- Ledger financial reports
- YMS control tower, ops dashboard, KPIs, delay analysis, report exports
- PMS revenue/traffic/occupancy reports + dashboards
- Mobile dashboard KPIs

### Status
**Implemented**

---

## Chat

### Purpose
In-app messaging.

### Existing Features
- Chat channels CRUD + available participants
- Send/delete/read messages
- Add/remove participants
- Chat participants, messages, attachments, receipts
- Unread count
- `ChatMessageReceived` notification

### Database Tables
`chat_channels`, `chat_messages`, `chat_participants`, `chat_attachments`, `chat_receipts`, `chat_logs`

### Status
**Implemented**

---

## Files / Document Handling

### Purpose
Platform file upload/download (not a full DMS).

### Existing Features
- Files CRUD (public v1 + internal)
- Base64 upload
- Download
- Filesystem settings (config + test)
- Order POD media capture (photo/signature/QR)
- PMS OCR image upload
- YMS gate document verification flags (checklist), not file DMS
- Excel import/export (Maatwebsite), DomPDF, barcodes in stack

### Status
**Implemented** (platform files); **Not present** as enterprise document management module

---

## Search / Filters / Export / Import

### Existing Features
- Resource search endpoints (orders, places, etc.)
- Geocoder query/reverse
- Lookup endpoints (timezones, countries, currencies, whois, blog, icons)
- FleetOps export/import on contacts, drivers, fleets, orders, places, service-rates, maintenance, work-orders, etc.
- Reports export
- YMS global search + report export
- PMS ticket/vehicle search + PDF report export
- Console list filters (UI patterns across list pages)

### Status
**Implemented**

---

## Tracking / Maps

### Existing Features
- Driver/vehicle track endpoints
- Live FleetOps coordinates/routes/orders/drivers/vehicles/places
- Positions replay + metrics
- ETA / distance-and-time
- Tracking numbers & statuses
- Track order lookup UI
- Fleet Tracking Hub UI
- Google Maps API key geocoding
- OSRM backend + CORS proxy in Docker
- Map tiles service
- Leaflet + Google Maps in React console
- Mobile maps / tracking tab
- YMS yard map

### Status
**Implemented**

---

## Dispatch / Route Planning / Orchestrator

### Existing Features
- Order dispatch (single + bulk) + scheduled dispatch commands
- Ad-hoc dispatch
- Routes management
- Orchestrator run/commit/preview/engines/import
- Orchestrator & routing & scheduling settings
- Allocation job (`ProcessAllocationJob`)
- Order workflow helper (`frontend/src/domain/fleetops/workflows/orderWorkflow.js`)

### Status
**Implemented**

---

## Telematics / Provider Layer

### Existing Features
- Abstract telematic provider + registry
- Providers: Samsara, Geotab, Flespi
- Sync devices job, test connection job
- Telematics webhooks ingest
- Ledger PaymentGatewayManager: Stripe, QPay, Cash
- Laravel package service providers for each extension

### Status
**Implemented**

---

## Contracts / Microservices Slice

### Purpose
Shared DTOs for ShipGen microservices.

### Existing Features
- Package `shipgen/contracts`: `UserSnapshot`, `DomainEvent`
- Docker services: `iam-service`, `fleetops-service`, `pallet-service`, `ledger-service`, `storefront-service`, `application`
- `services/*/README.md` documentation stubs (no app code in `services/`)
- Gateway path routing to slices
- Internal JWT between services

### Status
**Implemented** (contracts + compose slices); `services/` folder **Partial** (docs only)

---

## AI Gateway / AI Features

### Purpose (requested scope)
LLM/AI gateway for logistics intelligence.

### Existing Features Found
| Capability | Location | Nature |
|------------|----------|--------|
| YMS Recommendations UI | `yms/.../AiInsights.jsx`, `aiInsightsApi.js` | Rule-based from alerts |
| Registry category label “Artificial Intelligence” | ExtensionsCategorySeeder | Taxonomy only |
| PMS plate OCR | EasyOCR optional | Computer vision, not LLM |
| openai-php in lockfile (Ignition suggestion) | composer.lock | Not an app feature |

### Not Found
AI Gateway service, OpenAI/Anthropic/LangChain app clients, embedding pipelines, LLM routes

### Status
AI Gateway: **Not present**  
YMS Recommendations: **Implemented** (non-LLM)  
PMS OCR: **Partial**

---

## Infrastructure / Security Platform Features

### Existing Features
- Docker Compose full stack (see Infrastructure Inventory)
- Redis: cache, queue, sessions
- MySQL 8 primary; Postgres for YMS/PMS
- Queue worker `php artisan queue:work`
- Scheduler via `go-crond` → `schedule:run` every minute
- Nginx API gateway
- SocketCluster realtime
- OSRM routing engine + tiles
- Helm chart (`infra/helm`) with HPA, ingress, events/scheduler deployments
- Rate limiting (API 120/min default; storefront 600/min; auth throttled)
- Sentry config
- Activity / API / webhook log purge commands
- Telemetry ping command
- Health: console `/admin/health`; YMS status routes
- Sandbox DB sync/migrate
- MySQL S3 backup command
- CORS / Octane / Sanctum configs in API host

### Status
**Implemented**

---

## Mobile Support

### Purpose
Expo React Native app for FleetOps drivers/dispatchers and Yard modules.

### Existing Features
- Unified login + 2FA
- Tabs: Dashboard, Orders, Tracking, Fleet, Profile
- Order detail/create, route detail, vehicle detail/create, driver detail, place, issue, fuel, manifest
- Lists: drivers, places, routes, issues, fuels, manifests, schedule, notifications
- Report fuel / report issue
- Yard tabs: overview, ops, gate, appointments, queue, docks, search, alerts, more, profile
- Yard modules: detention, vehicles, yard-map, loading-ops, labor, equipment
- Org switch, online/tracking toggles
- Maps, camera, secure store, SocketCluster, Sentry

### Status
**Implemented**

---

## Responsive Web Console

### Purpose
Primary ShipGen operator UI.

### Tech
React 18, Vite, React Router 7, TanStack Query, Tailwind, Radix/shadcn-style, Leaflet/Google Maps, Recharts, SocketCluster  
Embeds YMS (`@yard`) and PMS (`@pms`) via Vite aliases

### Status
**Implemented**  
Ember console: **Deprecated** (removed; archives under `admin-docs/_archive/ember`)

---

# Database Inventory

## Platform (MySQL) — core-api
`activity_log`, `alerts`, `api_credentials`, `api_events`, `api_request_logs`, `categories`, `chat_attachments`, `chat_channels`, `chat_logs`, `chat_messages`, `chat_participants`, `chat_receipts`, `comments`, `companies`, `company_users`, `custom_field_values`, `custom_fields`, `dashboard_widgets`, `dashboards`, `directives`, `email_templates`, `extension_installs`, `extensions`, `failed_jobs`, `files`, `group_users`, `groups`, `invites`, `login_attempts`, `model_has_policies`, `monitored_scheduled_task_log_items`, `monitored_scheduled_tasks`, `notifications`, `personal_access_tokens`, `policies`, `report_audit_logs`, `report_cache`, `report_executions`, `report_templates`, `reports`, `schedule_availability`, `schedule_constraints`, `schedule_exceptions`, `schedule_items`, `schedule_templates`, `schedules`, `settings`, `template_queries`, `templates`, `transaction_items`, `transactions`, `types`, `user_devices`, `users`, `verification_codes`, `webhook_endpoints`, `webhook_request_logs`

**Spatie:** `permissions`, `roles`, `model_has_permissions`, `model_has_roles`, `role_has_permissions`

## FleetOps
`assets`, `contacts`, `devices`, `driver_geofence_states`, `drivers`, `entities`, `equipments`, `fleet_drivers`, `fleet_vehicles`, `fleets`, `fuel_reports`, `geofence_events_log`, `integrated_vendors`, `issues`, `maintenance_schedule_reminders`, `maintenance_schedules`, `maintenances`, `manifest_stops`, `manifests`, `order_configs`, `orders`, `parts`, `payloads`, `places`, `positions`, `proofs`, `purchase_rates`, `routes`, `sensors`, `service_areas`, `service_quote_items`, `service_quotes`, `service_rate_fees`, `service_rate_parcel_fees`, `service_rates`, `telematics`, `tracking_numbers`, `tracking_statuses`, `vehicle_device_events`, `vehicle_geofence_states`, `vehicles`, `vendor_personnels`, `vendors`, `warranties`, `waypoints`, `work_orders`, `zones`

## Pallet
`pallet_audits`, `pallet_batches`, `pallet_inventories`, `pallet_purchase_orders`, `pallet_sales_orders`, `pallet_stock_adjustment`, `pallet_stock_transactions`, `pallet_warehouse_aisles`, `pallet_warehouse_bins`, `pallet_warehouse_docks`, `pallet_warehouse_racks`, `pallet_warehouse_sections`

## Storefront (separate connection)
`carts`, `catalog_category_products`, `catalog_hours`, `catalog_subjects`, `catalogs`, `checkouts`, `food_trucks`, `gateways`, `network_stores`, `networks`, `notification_channels`, `payment_methods`, `product_addon_categories`, `product_addons`, `product_hours`, `product_store_locations`, `product_variant_options`, `product_variants`, `products`, `reviews`, `store_hours`, `store_locations`, `stores`, `votes`

## Ledger
`ledger_accounts`, `ledger_gateway_transactions`, `ledger_gateways`, `ledger_invoice_items`, `ledger_invoices`, `ledger_journals`, `ledger_wallets`

## Registry Bridge
`registry_developer_accounts`, `registry_extension_bundles`, `registry_extension_installs`, `registry_extension_purchases`, `registry_extensions`, `registry_users`

## YMS (Postgres)
`status_checks`, `vehicles`, `appointments`, `docks`, `queue_entries`, `equipment`, `labor_teams`, `detention_records`, `yard_events`, `loading_operation_exceptions`, `gate_verifications`, `yard_zones`, `vehicle_zone_history`, `zone_rules`, `users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `refresh_tokens`

## PMS (Postgres)
`parking_floors`, `parking_floor_capacities`, `tickets`, `payments`, `vehicle_events`, `pricing_rules`, `hardware_devices`, `supervisor_alerts`, `qr_scan_events`, `users`, `roles`, `permissions`, `role_permissions`, `token_denylist`, `audit_logs`

**Migration file counts (Laravel packages):** core-api 108, fleetops 137, pallet 14, storefront 44, ledger 18, registry-bridge 12  
**Approx distinct product tables:** ~190 (platform + extensions + YMS + PMS; excluding pure alter-only migration noise)

---

# API Inventory

## Conventions
- `fleetbaseRoutes('{name}')` → `GET /`, `GET /{id}`, `POST /`, `PUT|PATCH /{id}`, `DELETE /{id}`
- **Approx Laravel package endpoints:** `113 × 5 + 368 custom ≈ 933`
- **YMS FastAPI handlers:** ~133
- **PMS FastAPI handlers:** ~37
- **Combined approx:** ~1,103 route handlers

## REST resources (Laravel)

### core-api (41)
`api-credentials`, `metrics`, `settings`, `schedule-monitor`, `two-fa`, `activities`, `api-events`, `api-request-logs`, `webhook-endpoints`, `webhook-request-logs`, `companies`, `users`, `user-devices`, `groups`, `roles`, `policies`, `permissions`, `extensions`, `categories`, `comments`, `custom-fields`, `custom-field-values`, `chat-channels`, `chat-participants`, `chat-messages`, `chat-attachments`, `chat-receipts`, `files`, `transactions`, `notifications`, `dashboards`, `dashboard-widgets`, `reports`, `schedules`, `schedule-items`, `schedule-templates`, `schedule-exceptions`, `schedule-availabilities`, `schedule-constraints`, `templates`, `template-queries`

### fleetops (34)
`contacts`, `drivers`, `entities`, `fleets`, `fuel-reports`, `issues`, `integrated-vendors`, `orders`, `order-configs`, `payloads`, `places`, `proofs`, `purchase-rates`, `routes`, `positions`, `service-areas`, `zones`, `service-quotes`, `service-rates`, `tracking-numbers`, `tracking-statuses`, `vehicles`, `vehicle-devices`, `vendors`, `devices`, `device-events`, `sensors`, `telematics`, `maintenance-schedules`, `work-orders`, `maintenances`, `equipment`, `parts`, `warranties`

### storefront (21)
`orders`, `networks`, `customers`, `stores`, `store-hours`, `store-locations`, `products`, `product-hours`, `product-variants`, `product-variant-options`, `product-addons`, `product-addon-categories`, `addon-categories`, `gateways`, `notification-channels`, `reviews`, `votes`, `food-trucks`, `catalogs`, `catalog-categories`, `catalog-hours`

### ledger (6)
`accounts`, `invoices`, `journals`, `wallets`, `transactions`, `gateways`

### pallet (9)
`audits`, `batches`, `inventories`, `products`, `sales-orders`, `purchase-orders`, `stock-adjustments`, `suppliers`, `warehouses`

### registry-bridge (2)
`registry-extensions`, `registry-extension-bundles`

## Auth & onboarding (selected custom)
`POST int/v1/auth/login`, `login-with-google`, `sign-up`, `logout`, `get-magic-reset-link`, `reset-password`, verification session endpoints, `switch-organization`, `join-organization`, `create-organization`, `GET session|organizations|services|bootstrap`, `POST change-user-password`, impersonate, installer initialize/createdb/migrate/seed, onboard endpoints, `GET int/v1/gateway/auth`, two-FA endpoints

## FleetOps high-value custom actions (selected)
Orders: schedule, dispatch, start, cancel, update-activity, complete, tracker, eta, proofs, capture-signature/qr/photo, bulk-*, export, import  
Drivers/vehicles: track, toggle-online, HOS, availabilities  
Live: `/fleet-ops/live/{coordinates|routes|orders|drivers|vehicles|places}`  
Orchestrator: run, commit, preview, engines, import-orders  
Geofences: events, inventory, dwell-report, history  
Telematics webhooks + provider actions  
Geocoder reverse/query  
Manifests CRUD/cancel  

## YMS API groups
`/api/auth/*`, `/api/search`, vehicle/appointment/queue/dock/equipment/labor/detention/yard-event/flow under yms router, `/api/yard/*`, `/api/queue/*`, `/api/gate/*`, `/api/reports/*` (+ export), `/api/control-tower/alerts`, `/api/loading-operations/*`, `/api/admin/*`, status/health

## PMS API groups
`/api/v1/auth/*`, `/users`, `/floors`, `/tickets` (+ payments, exit, QR, search), `/ocr/plate`, `/pricing`, `/dashboard/*`, `/reports/*`, `/monitoring/*`, `/hardware/*`, `/audit-logs`

**Sources:** `packages/*/src/routes.php`, `packages/*/server/src/routes.php`, `yms/backend/routers/*`, `Parking management/backend/app/api/routers/*`

---

# Infrastructure Inventory

| Component | Implementation |
|-----------|----------------|
| HTTP API Gateway | nginx `docker/gateway` — path routing `/api/yms/`, `/api/pms/`, PHP slices |
| App slices | `iam-service`, `fleetops-service`, `pallet-service`, `ledger-service`, `storefront-service`, `application` |
| Frontend | `frontend` container (React console) |
| Queue worker | `queue` → `php artisan queue:work` |
| Scheduler | `scheduler` → `go-crond` + `docker/crontab` (`* * * * * schedule:run`) |
| Redis | `cache` service (`redis:4-alpine`) — cache/queue/session |
| MySQL | `database` |
| YMS Postgres | `yms-postgres` + `yms-service` |
| PMS Postgres | `pms-postgres` + `pms-service` |
| OSRM | `osrm-backend` + `osrm` CORS proxy |
| Map tiles | `tiles` |
| Realtime | `socket` (SocketCluster) |
| Static/httpd | `httpd` |
| Helm | `infra/helm` — Deployment, HPA, Ingress, Redis, SocketCluster, events+scheduler |
| CI | `.github/workflows/*` (ci, cd, cloud, playwright, docker publish, …) |
| Caching | Redis default; Spatie responsecache; geocode Redis DB |
| Logging | Laravel logging; API request logs; webhook logs; activity logs; Sentry config |
| Health | Platform health UI; YMS status; compose healthchecks where defined |
| Rate limiting | `ThrottleRequests` — API 120/min; storefront 600/min; auth throttled |
| Backup | `db:backup` MysqlS3Backup command |

### Background Jobs (Laravel Job classes)
1. `LogApiRequest`  
2. `MaterializeSchedulesJob`  
3. `CallWebhookJob`  
4. `CheckGeofenceDwell`  
5. `ProcessAllocationJob`  
6. `ReplayPositions`  
7. `SendPositionReplay`  
8. `SimulateDrivingRoute`  
9. `SimulateWaypointReached`  
10. `SyncTelematicDevicesJob`  
11. `TestTelematicConnectionJob`  
12. `DownloadProductImageUrl`  

**Total Job classes: 12**

### Artisan commands
~46 command classes across core-api, fleetops, storefront, ledger, registry-bridge (dispatch, estimations, purge logs, permissions, sandbox, ledger overdue, etc.)

### Workers (compose processes)
| Worker / long-running service | Role |
|-------------------------------|------|
| `queue` | Laravel queue consumer |
| `scheduler` | Cron → schedule:run |
| `socket` | Realtime |
| `osrm-backend` | Routing engine |
| `gateway` | API edge |
| PHP slice services | HTTP app processes (not queue workers) |
| `yms-service` / `pms-service` | FastAPI app processes |

**Dedicated YMS/PMS queue workers:** none

---

# Security Inventory

## Platform auth stack
- Laravel Sanctum
- Spatie Permission
- Custom Policy + Directive scoping
- `AuthorizationGuard` middleware
- Gateway secret + internal JWT
- Two-factor enforcement
- Login attempt tracking
- API key unlimited throttle allowlist

## Named platform roles (26 + Administrator)
IAM User Manager, IAM Policy Manager, IAM Administrator, Fleetbase Developer, Operations Manager, Fleet Supervisor, Service Coordinator, Operations Administrator, Maintenance Technician, Driver Coordinator, Navigator App Manager, Driver, Fleet-Ops Customer, Fleet-Ops Contact, Storefront Administrator, Customer Service, Inventory Manager, Ledger Administrator, Billing Specialist, Accountant, Finance Viewer, Payments Operator, Extension Developer, Quality Assurance, Extension Auditor, Extension Admin, plus **Administrator**

## Named policies (29 in `$policies` arrays)
UserManager, PolicyManager, FLBDeveloper, FLBDevProjectManager, DispatchManager, FleetManager, OrderCoordinator, ServiceRateManager, ServiceAreaManager, MaintenanceManager, OperationsAdmin, NavigatorSettingsManager, DriverOperations, InventoryManager, OrderManager, CustomerService, MarketplaceManager, InvoiceManager, PaymentsManager, WalletManager, AccountingManager, FinancialReporter, LedgerSettingsManager, LedgerReadOnly, ExtensionDeveloper, ExtensionMarketing, ExtensionFinance, ExtensionSales, ExtensionManager

## Permission resources (schemas generate action×resource permissions)
IAM, Developers, FleetOps (~30 resources), Storefront (~23), Ledger (~13), RegistryBridge (~7) — **dozens to hundreds of generated permission strings** via `fleetbase:create-permissions` (exact DB count depends on seed/reset)

## YMS permissions
~23 module codes + ~20 action codes (see YMS section)

## PMS permissions
27 permission codes; 3 roles (admin, supervisor, operator)

## Audit surfaces
- `activities`, `api_request_logs`, `api_events`, `webhook_request_logs`, `report_audit_logs`
- PMS `audit_logs`
- YMS `yard_events` operational event log

---

# AI Capability Inventory

| Capability | Status | Evidence |
|------------|--------|----------|
| AI Gateway (LLM routing/orchestration) | **Not present** | No service/code |
| Generative AI / OpenAI / Anthropic / LangChain | **Not present** | No app usage |
| YMS Recommendations | **Implemented** | Rule-based insights UI |
| PMS License Plate OCR | **Partial** | EasyOCR optional |
| Registry “Artificial Intelligence” category | Taxonomy only | Seeder label |
| Report “recommendations” API | **Implemented** | SQL/report helper, not LLM |

---

# Integrations Inventory

| Integration | Where used |
|-------------|------------|
| Google Maps Geocoding | FleetOps / Storefront geocoder |
| OSRM | Routing engine (Docker) |
| Map tiles | Docker `tiles` + config tile URL |
| Leaflet / Google Maps JS | React console maps |
| Twilio SMS | Notifications / SMS config |
| CallPro / MessagePro.mn SMS | `api/config/services.php` for +976 |
| Firebase FCM | Push notifications |
| APN | Apple push |
| SocketCluster | Broadcasting / live |
| Stripe | Storefront, Ledger, Registry, FleetOps Connect |
| QPay | Ledger driver + Storefront checkout capture |
| Cash (offline) | Ledger driver |
| AWS SES | Default mailer option |
| AWS S3 / GCS | Files / backups (composer + backup) |
| Mailgun / Postmark / SendGrid / Resend | `services.php` mail options |
| MS Graph Mail | composer package |
| Google OAuth | Login |
| Sentry | Error monitoring config |
| Telematics: Samsara | FleetOps provider |
| Telematics: Geotab | FleetOps provider |
| Telematics: Flespi | FleetOps provider |
| Lalamove | FleetOps Integrations folder |
| Excel (Maatwebsite) | Import/export |
| DomPDF | PDF generation |
| Barcodes (milon/barcode) | Labels/barcodes |
| EasyOCR | PMS plate OCR (optional) |
| ShipGen IAM SSO | YMS/PMS platform-login |

**Counted integrations (distinct vendors/systems above): 26**

---

# UI Pages Inventory

## React Console (`frontend/src/App.jsx`)

### Auth (5)
Login, Onboard, Onboard Verify Email, Forgot Password, Two FA

### Shell (6)
Dashboard, Notifications, Account, Settings, FleetOps Onboarding, Platform Health

### FleetOps (~55 routed surfaces including settings + report variants)
Orders, Order New, Routes, Route New, Orchestrator, Schedule, Order Config, Service Rates, Drivers, Vehicles, Places, Fleets, Vendors, Integrated Vendors, Contacts, Fuel Reports, Issues, Customers, Telematics, Devices, Sensors, Device Events, Tracking Hub, Vehicle Devices, Maintenance Calendar/Schedules/Records/Work Orders/Equipment/Parts, Service Areas, Geofences, Custom Fields, Reports (list/new/edit/result/detail), Track Lookup, Warranties, Manifests, Payloads, Entities, Proofs, Purchase Rates, Tracking Numbers, Tracking Statuses, Settings (+ 8 subpages)

### IAM (7)
Home, Users, Users Drivers, Users Customers, User Detail, Roles, Groups, Group Detail, Policies

### Storefront (9)
Home, Products, Product New, Product Detail, Catalogs, Customers, Customer Detail, Networks, Promotions, Coupons, Checkout

### Ledger (7)
Home, Invoices, Invoice Detail, Transactions, Wallets, Reports, Chart of Accounts, Journal

### Developers (7)
Home, API Keys, Webhooks, Webhook Detail, Events, Logs, Sockets

### Pallet (6)
Home, Inventory, Warehouses, Transfers, Suppliers, Purchase Orders

### Registry (1)
Registry Home

### Embedded Yard (~18)
Same as YMS routed pages under `/yard/*`

### Embedded Parking (~27)
Admin 10 + Supervisor 8 + Operator 9 under `/parking/*`

**Console unique route path declarations (incl. embeds & params):** ~150+ `path=` entries in `App.jsx` (many `:id` drawer redirects)

## YMS standalone
18 primary routes + login/unauthorized (+ 5 unwired report page files)

## PMS standalone
~27 role pages + login

## Mobile (`frontend_mobile`)
~45 file-based screens (fleet tabs/stack + yard tabs + auth)

## Docs UI
Docusaurus `docs/` (documentation site, not ops console)

## Deprecated
Ember console — archive docs only

**Approx distinct product UI pages/screens (console unique + YMS + PMS + mobile, counting embeds once for yard/parking):** ~160+

---

# Feature Inventory

Flat list of implemented product capabilities extracted from code:

1. Multi-tenant organizations  
2. User/invite/group/role/policy management  
3. Sanctum + API key auth  
4. Google OAuth  
5. Two-factor authentication  
6. Impersonation  
7. Gateway service auth / internal JWT  
8. Order lifecycle management  
9. Bulk order dispatch/cancel/assign  
10. Order scheduling  
11. Order import/export  
12. Order activity workflow / next-activity  
13. ETA & distance/time  
14. Order tracker  
15. POD signature / QR / photo  
16. Order configs  
17. Routes management  
18. Dispatch orchestrator  
19. Schedule planner  
20. Service rates & quotes  
21. Purchase rates  
22. Driver management & online toggle  
23. Driver HOS / shift / availability endpoints  
24. Vehicle management & tracking  
25. Fleet assignment  
26. Places / geocoding / search  
27. Zones & service areas  
28. Geofence monitoring & dwell  
29. Live fleet map data  
30. Contacts / customers / vendors / integrated vendors  
31. Entities & payloads  
32. Tracking numbers & statuses  
33. Labels  
34. Fuel reports  
35. Issues  
36. Manifests  
37. Telematics (Samsara/Geotab/Flespi)  
38. Devices / sensors / device events  
39. Maintenance schedules & reminders  
40. Work orders  
41. Equipment / parts / warranties  
42. Custom fields  
43. Custom reports builder  
44. Dashboards & widgets  
45. Platform schedules/templates/exceptions  
46. Chat messaging  
47. File uploads/downloads  
48. Webhooks  
49. API credentials  
50. API/request/activity logging  
51. Notifications (mail/DB/push/SMS)  
52. Branding & platform settings  
53. FleetOps module settings  
54. Stripe Connect payments (FleetOps)  
55. Storefront commerce  
56. Storefront checkouts (Stripe/QPay)  
57. Pallet inventory/warehouse  
58. Ledger invoices/wallets/journals/gateways  
59. Extension registry  
60. YMS control tower  
61. YMS appointments  
62. YMS gate management  
63. YMS virtual queue  
64. YMS yard map/zones  
65. YMS docks  
66. YMS loading ops  
67. YMS detention  
68. YMS equipment & labor  
69. YMS reports/KPIs/delay analysis  
70. YMS recommendations (rule-based)  
71. YMS RBAC admin  
72. PMS tickets & payments  
73. PMS floors & occupancy  
74. PMS pricing  
75. PMS QR tickets  
76. PMS hardware monitoring  
77. PMS audit logs  
78. PMS OCR plate read  
79. PMS role dashboards  
80. Mobile FleetOps  
81. Mobile Yard  
82. Redis queues & cache  
83. Cron scheduler  
84. Rate limiting  
85. OSRM routing  
86. Realtime sockets  
87. Helm/K8s deploy chart  
88. Microservice Docker slices  
89. Sandbox database tooling  
90. Excel import/export  
91. Search (platform + YMS + PMS)  

---

# Project Statistics

Counts are derived from repository code as of audit date. Approximations marked.

| Metric | Count |
|--------|------:|
| Product modules (inventory table) | **40** (incl. Not present / Deprecated entries) |
| Implemented primary modules | **36** |
| Laravel packages | **7** (`core-api`, `fleetops`, `storefront`, `pallet`, `ledger`, `registry-bridge`, `contracts`) |
| Specialized FastAPI apps | **2** (YMS, PMS) |
| Frontend apps | **4** (console, YMS UI, PMS UI, mobile) + docs site |
| Console route path entries | **~150+** |
| Distinct UI pages/screens (approx) | **~160+** |
| Laravel `fleetbaseRoutes` resources | **113** call sites / **109** unique names |
| Laravel custom route lines | **368** |
| Approx Laravel API endpoints | **~933** |
| YMS API handlers | **133** |
| PMS API handlers | **37** |
| Approx total API handlers | **~1,103** |
| Laravel migration files | **333** |
| Approx distinct DB tables | **~190** |
| Background Job classes | **12** |
| Artisan command classes | **46** |
| Compose long-running services | **21** (excl. `volumes`) |
| Queue workers | **1** (`queue`) |
| Schedulers | **1** (`scheduler`) |
| Notification classes | **28** |
| Named platform roles | **27** (26 schema + Administrator) |
| Named policies in schemas | **29** |
| YMS permission codes | **~43** (modules + actions) |
| PMS permission codes | **27** |
| PMS roles | **3** |
| Telematics providers | **3** |
| Ledger payment drivers | **3** |
| Integrations (distinct) | **26** |
| AI / LLM modules | **0** |
| Non-LLM “AI-named” features | **1** (YMS Recommendations) |
| OCR modules | **1** (PMS, partial) |
| Provider registries | **2** (telematics, ledger payments) |

### Totals (summary block)

```
Modules (documented inventory rows): 40
Implemented product modules:         36
Pages / screens (approx):            160+
API endpoints (approx):              1103
Database tables (approx):            190
Background jobs:                     12
Queue workers:                       1
Schedulers:                          1
Artisan commands:                    46
Notification classes:                18–28 (28 notification classes)
AI LLM modules:                      0
AI-named non-LLM features:           1
OCR modules:                         1
Provider layers:                     2
Integrations:                        26
Platform named roles:                27
PMS roles:                           3
Compose services:                    21
```

---

# Appendix: Source Anchors

| Area | Path |
|------|------|
| Console routes | `frontend/src/App.jsx` |
| Core API routes | `packages/core-api/src/routes.php` |
| FleetOps routes | `packages/fleetops/server/src/routes.php` |
| Storefront routes | `packages/storefront/server/src/routes.php` |
| Pallet routes | `packages/pallet/server/src/routes.php` |
| Ledger routes | `packages/ledger/server/src/routes.php` |
| Registry routes | `packages/registry-bridge/server/src/routes.php` |
| Auth schemas | `packages/*/Auth/Schemas/*.php` |
| YMS backend | `yms/backend/` |
| YMS UI | `yms/frontend_1/` |
| PMS backend | `Parking management/backend/` |
| PMS UI | `Parking management/frontend/` |
| Mobile | `frontend_mobile/frontend/` |
| Docker | `docker-compose.yml`, `docker/gateway/`, `docker/crontab` |
| Helm | `infra/helm/` |
| Contracts | `packages/contracts` (`shipgen/contracts`) |

---

*End of audit. All statements are based on code present in the repository; runtime enablement still depends on environment configuration (API keys, provider credentials, OSRM data, etc.).*
