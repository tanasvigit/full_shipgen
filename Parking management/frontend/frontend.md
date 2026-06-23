# ParkFlow Frontend Reference

This document describes what the ParkFlow frontend currently implements, how it behaves, and what the backend should provide when mock data and in-memory state are replaced with real APIs.

The product is a parking management system for a multi-floor facility with three roles: **admin**, **supervisor**, and **operator**.

## 1. Frontend scope

### Web app

- Location: `frontend/` (source in `frontend/src/`)
- Stack: React 19, TypeScript, Vite, React Router, Tailwind CSS, Recharts, Lucide icons
- Run: `npm run dev`
- Build: `npm run build`

### Mobile app

- Location: `mobile-app/`
- Stack: Expo SDK 54, React Native, Expo Router, TypeScript
- Run: `cd mobile-app && npm start`
- Purpose: mobile-first views for the same roles, flows, and mock domain model as the web app

Both clients currently use **mock data and client-side state**. There is no backend integration yet.

## 2. Product goals

The frontend supports:

- Role-based access to dashboards and workflows
- Floor-level occupancy tracking by vehicle category
- Parking ticket creation with automatic floor assignment
- Payment collection for unpaid tickets
- Vehicle and ticket lookup
- Supervisor monitoring of occupancy, operators, alerts, QR activity, and reports
- Admin management of users, pricing, parking floors, hardware, audit logs, and reports

## 3. High-level architecture

### Web routing and layout

- Entry: `src/App.tsx`
- Global providers:
  - `src/context/AuthContext.tsx`
  - `src/context/ParkingFloorContext.tsx`
- Route protection: `src/guards/ProtectedRoute.tsx`
- Shared shell: `src/components/layout/DashboardLayout.tsx`
- Navigation config: `src/config/navigation.ts`
- Permission config: `src/config/permissions.ts`

### Mobile routing and layout

- Entry: `mobile-app/app/_layout.tsx`
- Auth redirect: `mobile-app/app/index.tsx`
- Login: `mobile-app/app/login.tsx`
- Role groups:
  - `mobile-app/app/(admin)/`
  - `mobile-app/app/(supervisor)/`
  - `mobile-app/app/(operator)/`
- Shared domain code: `mobile-app/src/`

### Shared domain logic

The most important reusable business logic lives in:

- `src/types/index.ts`
- `src/utils/parkingFloors.ts`
- `src/data/mockData.ts`
- `src/data/parkingFloorMockData.ts`
- `src/data/supervisorMockData.ts`

The mobile app mirrors the same types, permissions, mock data, contexts, and parking-floor rules.

## 4. Authentication and authorization

### Current auth behavior

Auth is **demo-only** and stored only in React state.

- Login page: `src/pages/LoginPage.tsx`
- Email substring decides role:
  - contains `admin` -> admin user
  - contains `supervisor` -> supervisor user
  - contains `operator`, `priya`, or `amit` -> operator user
  - otherwise defaults to operator
- Password is accepted but not validated
- Session is lost on refresh
- No JWT, refresh token, cookies, or server session

Demo accounts shown in the UI:

- `admin@parkflow.com`
- `supervisor@parkflow.com`
- `operator@parkflow.com`

### Default demo users

| ID | Name | Email | Role |
|---|---|---|---|
| U001 | Rajesh Kumar | admin@parkflow.com | admin |
| U007 | Sunil Mehta | supervisor@parkflow.com | supervisor |
| U002 | Priya Sharma | operator@parkflow.com | operator |

Additional mock users exist in `mockUsers` for admin user-management screens.

### Route protection

`ProtectedRoute` enforces:

1. User must be authenticated
2. Optional allowed role list
3. Optional permission check

If access fails, the user is redirected to login or their role dashboard.

### Permission model

Permissions are string constants in `src/config/permissions.ts`.

Role mapping:

- **Operator**: dashboard, ticket creation, payment collection, QR print, vehicle search, recent tickets, settings, floor summary
- **Supervisor**: operator permissions except ticket/payment/QR/settings, plus parking monitoring, reports view, operator activity, floor monitor, QR monitoring, occupancy analytics
- **Admin**: supervisor + operator capabilities, plus parking management, floor management, admin reports, user management, role management, pricing, hardware, audit, system/security settings

The backend should return the authenticated user's role and permission list, or enough role data for the frontend to derive permissions using the same rules.

## 5. Core domain entities

Canonical TypeScript models are in `src/types/index.ts`.

### User

- `id`, `name`, `email`, `role`, `status`, `createdAt`, optional `avatar`
- `role`: `admin | supervisor | operator`
- `status`: `active | inactive`

### Parking floor

- `id`, `floorNumber`, `floorName`
- Per-category slot stats:
  - `twoWheeler`
  - `fourWheeler`
  - `heavyVehicle`
- Each category has `capacity`, `occupied`, `available`
- `status`: `available | partial | full`

### Facility occupancy summary

Aggregated across all floors:

- `totalFloors`, `totalCapacity`, `totalOccupied`, `totalAvailable`, `occupancyPercent`
- Category totals for 2W / 4W / heavy vehicle

### Parking ticket

- `id`
- `vehicleNumber`
- `category`: `2 Wheeler | 4 Wheeler | Bus | Free Entry`
- `entryType`: `Paid Entry | Free Entry`
- `amount`
- `status`: `Paid | Unpaid | Exited`
- `paymentMethod`: `Cash | UPI | Card`
- `entryTime`, optional `exitTime`
- `operatorId`
- Optional `floorNumber`, `floorName`, `slotStatus`

### Dashboard stats

- `vehiclesInside`
- `todayEntries`
- `todayExits`
- `revenueToday`
- `occupiedSlots`
- `totalSlots`
- `twoWheelerCount`
- `fourWheelerCount`

### Pricing rule

- `id`
- `category`
- `basePrice`
- `perHour`
- `maxDaily`
- `isActive`

### Hardware device

- `id`, `name`, `type`, `status`, `lastPing`, `location`
- `type`: `QR Scanner | Thermal Printer | Boom Barrier | Network Controller`
- `status`: `Online | Offline`

### Audit log

- `id`, `action`, `user`, `role`, `timestamp`, `details`

### Supervisor monitoring entities

- `ActiveOperator`
- `SupervisorAlert`
- `QrScanEvent`
- `OperatorActivity`
- `RecentExit`
- `RecentEntry`
- `RevenueData`

## 6. Business rules implemented in the frontend

These rules should move to the backend.

### Vehicle category to floor bucket mapping

From `src/utils/parkingFloors.ts`:

- `2 Wheeler` and `Free Entry` -> `twoWheeler`
- `4 Wheeler` -> `fourWheeler`
- `Bus` -> `heavyVehicle`

### Floor status derivation

- `available`: no capacity or zero occupied
- `full`: occupied equals capacity
- `partial`: otherwise

### Facility summary

Totals and occupancy percent are computed from all floors.

### Ticket creation and floor assignment

Implemented in `ParkingFloorContext.createTicketWithFloor()`:

1. Find the first floor with available capacity for the ticket category
2. If none exists, return an error
3. Generate next ticket ID in format `PK######`
4. Create ticket with:
   - `entryTime` as current local time string
   - `slotStatus = Occupied`
   - `floorNumber` and `floorName` from assigned floor
5. Increment occupied count for the assigned category on that floor
6. Recompute floor status and facility summary

Current frontend pricing shortcut on ticket creation:

- `2 Wheeler`: 20
- `4 Wheeler`: 50
- `Bus`: 100
- `Free Entry`: 0
- If `entryType = Free Entry`, amount is forced to 0
- Ticket `status` is currently set to `Paid` even when amount > 0; unpaid handling is only simulated on existing mock tickets

### Floor CRUD

Admin floor management supports:

- Add floor
- Update floor category capacity/occupied values
- Remove floor

Supervisor/admin floor pages can view occupancy; only admin has manage permission.

### Collect payment

Current behavior is UI-only:

- Lists tickets with `status = Unpaid`
- Marks a ticket as collected in local component state
- Does not persist payment to shared ticket store

### Vehicle search

Filters tickets by:

- vehicle number substring
- ticket ID substring

### QR print / monitoring

- Operator QR print page is presentation-only
- Admin/supervisor QR monitoring pages read mock scan events
- No real QR generation, scanning, or printer integration yet

## 7. Web routes by role

### Public

| Route | Screen |
|---|---|
| `/login` | Login |
| `/` | Redirect to login |

### Admin

| Route | Screen | Permission |
|---|---|---|
| `/admin/dashboard` | Admin dashboard | `dashboard.view` |
| `/admin/users` | User management | `users.manage` |
| `/admin/pricing` | Pricing configuration | `pricing.configure` |
| `/admin/parking` | Parking management | `parking.manage` |
| `/admin/parking-floors` | Floor management | `floors.manage` |
| `/admin/reports` | Reports | `reports.admin` |
| `/admin/hardware` | Hardware status | `hardware.configure` |
| `/admin/qr-monitoring` | QR monitoring | `qr.monitoring` |
| `/admin/audit-logs` | Audit logs | `audit.view` |
| `/admin/settings` | Settings | `settings.manage` |

### Supervisor

| Route | Screen | Permission |
|---|---|---|
| `/supervisor/dashboard` | Supervisor dashboard | `dashboard.view` |
| `/supervisor/monitoring` | Parking monitoring | `parking.status.view` |
| `/supervisor/parking-floors` | Floor occupancy view | `floors.monitor` |
| `/supervisor/vehicle-search` | Vehicle search | `vehicle.search` |
| `/supervisor/qr-monitoring` | QR monitoring | `qr.monitoring` |
| `/supervisor/reports` | Reports | `reports.view` |
| `/supervisor/operator-activity` | Operator activity | `operator.activity` |
| `/supervisor/recent-tickets` | Recent tickets | `recent.tickets` |

### Operator

| Route | Screen | Permission |
|---|---|---|
| `/operator/dashboard` | Operator dashboard | `dashboard.view` |
| `/operator/occupancy` | Occupancy summary | `floors.summary` |
| `/operator/new-ticket` | Create ticket | `tickets.create` |
| `/operator/collect-payment` | Collect payment | `payments.collect` |
| `/operator/qr-print` | QR ticket print | `qr.print` |
| `/operator/vehicle-search` | Vehicle search | `vehicle.search` |
| `/operator/recent-tickets` | Recent tickets | `recent.tickets` |
| `/operator/settings` | Settings | `settings.manage` |

## 8. Mobile screens

Mobile does not expose every web route, but it covers the main operational flows.

### Operator tabs

- Home dashboard
- Floor occupancy
- New ticket
- Vehicle search
- More: collect payment, recent tickets, settings, logout

### Supervisor tabs

- Dashboard
- Parking monitoring
- Vehicle search
- Recent tickets
- Reports

### Admin tabs

- Dashboard
- Parking management
- Users
- Reports
- Settings with demo role switching and logout

## 9. Screen-to-data mapping

This section helps define backend endpoints and payloads.

### Auth

- Login form -> authenticated user profile + permissions + session token
- Logout -> invalidate session

### Dashboards

- Admin dashboard: facility summary, hardware list, audit logs, recent tickets, aggregate stats
- Supervisor dashboard: occupancy %, active operators, alerts, recent entries/exits, QR activity, recent tickets, revenue/entry stats
- Operator dashboard: facility summary, ticket counts, unpaid count, payment mix, recent tickets

### Tickets

- List recent tickets
- Create ticket
- Search by vehicle number or ticket ID
- Collect payment for unpaid ticket
- Reprint ticket / QR payload

### Floors

- List floors with per-category capacity and occupancy
- Facility summary aggregate
- Admin create/update/delete floor

### Users

- List users
- Search users
- Create user modal exists in UI, but no persistence yet

### Pricing

- List pricing rules by vehicle category
- Update base/per-hour/max values
- Activate/deactivate rule

### Hardware

- List devices with online/offline status and last ping

### Audit

- List audit events with actor, role, action, timestamp, details

### Reports

- Daily entries/exits/revenue
- Weekly revenue trend
- Vehicle mix counts
- Operator activity timeline

### Supervisor monitoring

- Active operators on shift
- Alerts by severity
- QR scan events
- Recent entries and exits

## 10. Current data sources

### Shared live client state

`ParkingFloorContext` owns:

- `floors`
- `tickets`
- `facilitySummary`
- `addFloor`
- `updateFloor`
- `removeFloor`
- `createTicketWithFloor`

### Static mock modules

- `src/data/mockData.ts`
  - users, tickets, dashboard stats, hardware, pricing, revenue chart data, recent entries, audit logs
- `src/data/parkingFloorMockData.ts`
  - initial floors
- `src/data/supervisorMockData.ts`
  - active operators, alerts, QR scans, operator activity, recent exits

### UI-only local state

These screens do not write back to shared stores yet:

- Collect payment
- User create/edit modal
- Pricing edits after initial load
- QR print actions
- Most admin hardware/report interactions

## 11. Suggested backend API surface

The frontend does not call these yet. This is the recommended contract to implement.

### Auth

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Users

- `GET /users`
- `POST /users`
- `PATCH /users/:id`
- `DELETE /users/:id` or deactivate endpoint

### Floors

- `GET /floors`
- `GET /floors/summary`
- `POST /floors`
- `PATCH /floors/:id`
- `DELETE /floors/:id`

### Tickets

- `GET /tickets`
- `GET /tickets/:id`
- `POST /tickets`
- `GET /tickets/search?query=`
- `POST /tickets/:id/payments`
- `POST /tickets/:id/exit`
- `GET /tickets/:id/qr`

### Pricing

- `GET /pricing`
- `PATCH /pricing/:id`

### Reports and dashboards

- `GET /dashboard/admin`
- `GET /dashboard/supervisor`
- `GET /dashboard/operator`
- `GET /reports/revenue?range=`
- `GET /reports/traffic?range=`

### Monitoring

- `GET /monitoring/operators`
- `GET /monitoring/alerts`
- `GET /monitoring/qr-scans`
- `GET /monitoring/entries`
- `GET /monitoring/exits`

### Hardware

- `GET /hardware`
- `POST /hardware/:id/restart` if device actions are supported

### Audit

- `GET /audit-logs`

## 12. Suggested backend responsibilities

The backend should own logic that is currently mocked or duplicated in the frontend:

- Password validation and session/JWT issuance
- Role and permission enforcement
- Ticket ID generation
- Pricing calculation from active pricing rules
- Floor assignment based on available category capacity
- Atomic update of ticket creation and floor occupancy
- Payment status transitions: `Unpaid` -> `Paid`
- Exit processing and slot release
- Dashboard/report aggregation
- Audit log creation for login, ticket create, payment collect, pricing update, hardware actions, user changes
- QR token generation and scan validation
- Hardware heartbeat and online/offline status

## 13. Validation and error cases already expected by the UI

The frontend already surfaces or should support these cases:

- Missing login email/password
- Invalid credentials
- No floor available for selected vehicle category
- No search results for vehicle/ticket query
- Empty unpaid ticket list
- Permission denied redirect to role dashboard
- Inactive user handling is implied by `status` but not fully enforced in UI yet

Recommended API error shape:

```json
{
  "error": "NO_FLOOR_CAPACITY",
  "message": "No available 4 Wheeler capacity on any floor."
}
```

## 14. Frontend integration plan for backend

When APIs are ready, replace mock/context usage in this order:

1. Auth login/logout/session restore
2. Floors list and facility summary
3. Ticket list, search, and create
4. Payment collection
5. Admin users and pricing
6. Reports and dashboards
7. Supervisor monitoring feeds
8. Hardware and audit logs
9. QR generate/validate and print workflow

Recommended client changes:

- Add API client layer in both web and mobile apps
- Keep `src/types` as shared response models or generate types from OpenAPI
- Move `createTicketWithFloor` rules to backend
- Persist auth in secure storage on mobile and http-only cookie or token storage on web
- Replace `mockData` imports screen by screen

## 15. Known gaps and non-persistent UI

These are visible in the frontend but not fully implemented end-to-end:

- Real authentication and authorization server
- Persistent ticket payment updates
- Persistent user CRUD
- Persistent pricing updates
- Real QR code generation, scanning, and printer integration
- Real-time updates for supervisor monitoring
- File export/print beyond browser print hooks
- Pagination, filtering, and sorting on server side
- Timezone-safe timestamps; UI currently uses display strings like `10:12 AM`
- Database-backed audit trail
- Hardware device control and telemetry ingestion

## 16. Key frontend files for backend developers

- `src/types/index.ts` - entity contracts
- `src/config/permissions.ts` - RBAC rules
- `src/context/ParkingFloorContext.tsx` - ticket/floor write behavior
- `src/utils/parkingFloors.ts` - occupancy and assignment rules
- `src/data/mockData.ts` - seed examples for users, tickets, pricing, stats, hardware, audit
- `src/data/parkingFloorMockData.ts` - seed floors
- `src/data/supervisorMockData.ts` - seed monitoring data
- `src/App.tsx` - full web route map
- `mobile-app/app/` - mobile route map

Use this document as the frontend contract while designing database schema, API endpoints, authorization middleware, and domain services for the ParkFlow backend.
