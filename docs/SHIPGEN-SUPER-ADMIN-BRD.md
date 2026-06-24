# Business Requirements Document (BRD)
## Shipgen Super Admin — Cross-Engine Access & Permission Governance

| Field | Value |
|-------|--------|
| **Purpose** | Plan how a **Super Admin** (organization administrator) controls **all engines**, **all roles**, and **all permissions** from one platform |
| **Document type** | Business requirements — governance & access control (not technical/API design) |
| **Audience** | Product owners, security, operations leads planning RBAC rollout |
| **Version** | 1.0 |
| **Date** | June 2026 |
| **Companion** | `docs/SHIPGEN-BRD.md` (operational business flows) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Super Admin Definition](#2-super-admin-definition)
3. [Governance Architecture (Business View)](#3-governance-architecture-business-view)
4. [Session Scopes & Login Routing](#4-session-scopes--login-routing)
5. [Platform IAM (Master Control Layer)](#5-platform-iam-master-control-layer)
6. [Engine Access Matrix](#6-engine-access-matrix)
7. [FleetOps Permissions](#7-fleetops-permissions)
8. [Yard (YMS) Permissions](#8-yard-yms-permissions)
9. [Parking (PMS) Permissions](#9-parking-pms-permissions)
10. [Storefront, Ledger, Pallet, Developers, Registry](#10-storefront-ledger-pallet-developers-registry)
11. [Screen-to-Permission Mapping](#11-screen-to-permission-mapping)
12. [Super Admin Operational Workflows](#12-super-admin-operational-workflows)
13. [User Provisioning Scenarios](#13-user-provisioning-scenarios)
14. [SSO & Engine Bridges](#14-sso--engine-bridges)
15. [Permission Inheritance & Precedence](#15-permission-inheritance--precedence)
16. [Audit & Compliance for Access Changes](#16-audit--compliance-for-access-changes)
17. [Planning Decisions Super Admin Must Make](#17-planning-decisions-super-admin-must-make)
18. [Acceptance Criteria — Governance](#18-acceptance-criteria--governance)
19. [Appendix A — Complete Yard Role × Permission Matrix](#appendix-a--complete-yard-role--permission-matrix)
20. [Appendix B — Complete Parking Role × Permission Matrix](#appendix-b--complete-parking-role--permission-matrix)
21. [Appendix C — Demo Accounts Reference](#appendix-c--demo-accounts-reference)

---

## 1. Executive Summary

Shipgen is a **multi-engine platform**. A **Super Admin** is the person (or role) responsible for:

1. **Who** can log in (users, drivers, engine-only operators)
2. **Which engines** each person sees (FleetOps, Yard, Parking, Storefront, etc.)
3. **What they can do** inside each engine (view vs create vs approve vs export)
4. **How narrow** their session is (full platform vs yard-only vs parking-only)

**Critical business fact:** Permission control is **not one flat list**. It operates in **three layers**:

| Layer | What it controls | Who manages it |
|-------|------------------|----------------|
| **A. Platform IAM** | FleetOps, Storefront, Ledger, Pallet, IAM, Developers, Registry | Super Admin via IAM module |
| **B. Engine-native RBAC** | Yard modules/actions; Parking admin/supervisor/operator | Super Admin via Yard Admin + Parking Admin (or SSO auto-provision) |
| **C. Session scope** | Whether user is locked to one engine at login | Determined by login path + email pattern + account type |

Super Admin planning must address **all three layers** or users will see wrong menus, get blocked at gate/dock, or inherit too much access.

---

## 2. Super Admin Definition

### 2.1 Who qualifies as Super Admin (Console Administrator)

A user is treated as **Super Admin** when **any** of the following is true:

| # | Criterion | Business meaning |
|---|-----------|------------------|
| SA-01 | Account flag `is_admin` = true | Explicit platform administrator |
| SA-02 | User `type` = `admin` | Administrator user type in IAM |
| SA-03 | Assigned role name is `Administrator` or `admin` | Named admin role |
| SA-04 | Has FleetOps permission `fleet-ops see admin` | FleetOps admin visibility |
| SA-05 | Has **both** IAM permissions `users.view` **and** `roles.view` | IAM governance pair |

**Business rules:**

| ID | Rule |
|----|------|
| BR-SA-01 | Yard-only and parking-only sessions **never** count as Super Admin (even if email looks like admin) |
| BR-SA-02 | Super Admin sees **all engines** in the header switcher |
| BR-SA-03 | Super Admin bypasses FleetOps permission checks (`fleet-ops *` effective) |
| BR-SA-04 | Super Admin bypasses Yard sidebar module checks (all yard modules) |
| BR-SA-05 | Super Admin bypasses Parking sidebar checks **except** when in parking-only session |
| BR-SA-06 | Super Admin entering Yard/Parking uses **SSO bridge** — no second password for engine staff identity |

### 2.2 Super Admin vs other admin types

| Role type | Scope | Can manage IAM? | Can manage Yard roles? | Can manage Parking employees? |
|-----------|-------|-----------------|------------------------|------------------------------|
| **Super Admin (platform)** | All engines | Yes | Yes (via Yard Admin screens) | Yes (via Parking Admin or SSO) |
| **Yard Admin** | Yard only | No | Yes (yard users/roles only) | No |
| **Parking Admin** | Parking only | No | No | Yes (parking employees only) |
| **FleetOps dispatcher** | FleetOps subset | No | No | No |
| **IAM officer** | Users/roles/policies | Yes (IAM) | No unless also Super Admin | No |

### 2.3 Super Admin business responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Identity lifecycle** | Create, activate, deactivate, reset passwords |
| **Role design** | Define job templates (gate operator, dispatcher, parking supervisor) |
| **Engine entitlement** | Decide which engines each role may access |
| **Segregation of duties** | Ensure finance cannot approve own detention; operator cannot set pricing |
| **Onboarding** | New hire → role → verify correct home screen and tabs |
| **Offboarding** | Disable account → sessions end → engine bridges revoked |
| **Audit response** | Prove who had gate-out permission on a given date |

---

## 3. Governance Architecture (Business View)

```
                    ┌─────────────────────────────────────┐
                    │         SUPER ADMIN (IAM)           │
                    │  Users · Roles · Policies · Groups  │
                    └─────────────────┬───────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
   ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
   │  FleetOps   │            │    Yard     │            │   Parking   │
   │  permissions│            │  RBAC JWT   │            │  RBAC JWT   │
   │ fleet-ops * │            │ 5 roles     │            │ 3 roles     │
   └─────────────┘            └─────────────┘            └─────────────┘
          │                           │                           │
          ▼                           ▼                           ▼
   Storefront · Ledger        Gate·Queue·Dock            Ticket·Payment·Floor
   Pallet · Developers        Labor·Equipment·Reports    Monitor·Pricing·Audit
   Registry · Console
```

### 3.1 Layer interaction rules

| ID | Rule |
|----|------|
| BR-GOV-01 | Platform IAM does **not** automatically grant Yard `flow.check_in` — Yard has its own role assignment |
| BR-GOV-02 | Platform IAM does **not** automatically grant Parking `tickets.create` — Parking has its own employee roles |
| BR-GOV-03 | Super Admin **implicitly** gets all Yard and Parking capabilities when using platform session (SSO bridge) |
| BR-GOV-04 | Non–Super Admin with FleetOps only **cannot** open Yard unless given yard SSO account or yard-only login |
| BR-GOV-05 | Engine-only accounts (`yard.*@`, `parking.*@` demo pattern) never receive platform IAM session |
| BR-GOV-06 | Sidebar shows a menu item only if **both** engine access **and** screen permission pass |

---

## 4. Session Scopes & Login Routing

### 4.1 Session scope types

| Scope | Value | User experience |
|-------|-------|-----------------|
| **Platform** | `platform` | Full Shipgen; engine switcher; IAM available to permitted users |
| **Yard-only** | `yard-only` | Locked to `/yard/*`; no FleetOps header engines |
| **Parking-only** | `parking-only` | Locked to `/parking/*`; no other engines |

### 4.2 Unified login decision tree

```
User enters email + password on Shipgen login
│
├─ Email matches yard operator pattern (yard.*@shipgen.demo)?
│   └─ YES → Yard-only session → redirect /yard
│
├─ Email matches parking operator pattern (parking.*@shipgen.demo)?
│   └─ YES → Parking-only session → redirect /parking
│
├─ Try platform (Laravel IAM) login
│   ├─ SUCCESS → Platform session → dashboard / default engine
│   └─ FAIL (auth error only)
│       ├─ Try Yard login → yard-only if success
│       └─ Else try Parking login → parking-only if success
│       └─ Else show platform error
```

### 4.3 Super Admin planning implications

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Corporate email for yard staff | Platform user + yard role vs yard-only account | Platform + SSO if they need FleetOps; yard-only if floor-only |
| Parking operator email domain | `@shipgen.demo` pattern vs corporate | Use pattern only for demo; production: parking-only or SSO |
| Remember session scope | Persisted in browser | Offboarding must clear sessions on server **and** client |
| 2FA | Platform only today | Plan 2FA for Super Admin and IAM officers first |

---

## 5. Platform IAM (Master Control Layer)

### 5.1 IAM business objects

| Object | Super Admin can… | Business purpose |
|--------|------------------|------------------|
| **User** | Create, view, update, deactivate, verify, change password, export | Identity record |
| **Role** | Create, view, update, delete, export (non-reserved names) | Job function template |
| **Policy** | Create, view, update, delete, export | Bundle of permissions |
| **Group** | Create, view, update, delete | Team-based access assignment |
| **Driver user** | Manage via IAM drivers view | FleetOps field identity |
| **Customer user** | Manage via IAM customers view | Storefront buyer identity |

### 5.2 IAM permission catalog (platform)

| Permission slug | Business capability |
|-----------------|---------------------|
| `users.view` | See user list and profiles |
| `users.create` | Add new users |
| `users.update` | Edit user attributes |
| `users.delete` | Remove users |
| `users.export` | Export user directory |
| `users.deactivate` | Disable login |
| `users.activate` | Re-enable login |
| `users.verify` | Mark email/identity verified |
| `users.change-password` | Force/reset password |
| `roles.view` | See role definitions |
| `roles.create` | Create custom roles |
| `roles.update` | Edit role permissions |
| `roles.delete` | Delete non-reserved roles |
| `roles.export` | Export role catalog |
| `policies.view` | See policy bundles |
| `policies.create` | Create policies |
| `policies.update` | Edit policy permissions |
| `policies.delete` | Delete policies |
| `policies.export` | Export policies |
| `groups.view` | See groups |
| `groups.create` | Create groups |
| `groups.update` | Edit group membership |
| `groups.delete` | Delete groups |

**Reserved role names (cannot create):** `Administrator`, any name starting with `admin`

### 5.3 IAM screen access

| Screen | Required permission |
|--------|---------------------|
| `/iam/users` | `users.view` |
| `/iam/users/drivers` | `users.view` |
| `/iam/users/customers` | `users.view` |
| `/iam/roles` | `roles.view` |
| `/iam/policies` | `policies.view` |
| `/iam/groups` | `groups.view` |

### 5.4 Super Admin IAM workflows

#### WF-IAM-01 — Create corporate user

1. Super Admin opens IAM → Users → Create
2. Enters name, email, initial role(s)
3. Assigns policies or role with FleetOps/Storefront permissions
4. User receives credentials
5. User logs in → platform session
6. **Separate step:** If user needs Yard, Super Admin creates yard user OR relies on SSO on first yard visit

#### WF-IAM-02 — Design custom dispatcher role

1. Super Admin opens IAM → Roles → Create
2. Names role `Dispatcher — Mumbai`
3. Attaches policy with: `fleet-ops list order`, `fleet-ops update order`, `fleet-ops list driver`, `fleet-ops list vehicle`
4. Does **not** attach `fleet-ops see admin`
5. Assigns role to dispatch team group
6. Verifies user sees FleetOps only (no Yard/Parking in switcher)

#### WF-IAM-03 — Offboard employee

1. Super Admin deactivates IAM user
2. Deactivates Yard user (if exists) in Yard Admin
3. Deactivates Parking employee (if exists) in Parking Admin
4. Confirms driver app login fails
5. Documents effective date in audit record

---

## 6. Engine Access Matrix

### 6.1 When does a user see each engine in the header?

| Engine | Visible if… |
|--------|-------------|
| **Console** | Always (home) |
| **FleetOps** | Super Admin **OR** any of: list order, list driver, list vehicle, list route |
| **Storefront** | Super Admin **OR** permission prefix `storefront` / `storefront-*` |
| **Ledger** | Super Admin **OR** permission prefix `ledger` / `ledger-*` |
| **Pallet** | Super Admin **OR** permission prefix `pallet` / `pallet-*` |
| **Yard** | Super Admin **OR** yard-only session **OR** (future) explicit yard module grant |
| **Parking** | Super Admin **OR** parking-only session **OR** (future) explicit parking grant |
| **Developers** | Super Admin **OR** prefix `developers`, `api-key`, `webhook` |
| **Registry** | Super Admin **OR** prefix `registry`, `extension` |
| **IAM** | Super Admin **OR** any of: `users.view`, `roles.view`, `groups.view`, `policies.view` |

### 6.2 Default landing after login

| User type | Default home |
|-----------|--------------|
| Yard-only session | `/yard` |
| Parking-only session | `/parking` |
| Super Admin / FleetOps user | `/fleet-ops/operations/orders` if FleetOps visible |
| Yard visible (no FleetOps) | `/yard` |
| Parking visible (no FleetOps/Yard) | `/parking` |
| IAM-only user | `/iam` |
| Storefront user | `/storefront` |

### 6.3 Route guard behavior

| User attempts | System response |
|---------------|-----------------|
| Yard-only opens `/fleet-ops` | Redirect to `/yard` |
| Parking-only opens `/yard` | Redirect to `/parking` |
| Dispatcher opens `/iam` | Redirect to permitted default home |
| Super Admin opens any engine | Allowed |
| Non-admin opens `/yard` without bridge | Redirect away (no yard JWT) |

---

## 7. FleetOps Permissions

### 7.1 Permission naming convention

Format: **`fleet-ops {action} {resource}`**

| Component | Values |
|-----------|--------|
| Service | `fleet-ops` |
| Actions | `create`, `update`, `delete`, `view`, `list`, `see` (read aliases: see=list=view) |
| Resources | Per Auth Schema — e.g. `order`, `driver`, `vehicle`, `route`, `fleet`, `place`, `vendor`, `contact`, `issue`, `fuel-report`, `telematic`, `sensor`, `maintenance`, `work-order`, `equipment`, `part`, `service-area`, `setting`, `custom-field`, `admin`, etc. |

**Wildcards:**

| Permission | Grants |
|------------|--------|
| `fleet-ops *` | All FleetOps actions on all resources |
| `fleet-ops * order` | All actions on orders |
| `fleet-ops see admin` | FleetOps administration surfaces |

### 7.2 FleetOps sidebar → permission check

| Sidebar route | Required ability |
|---------------|------------------|
| `/fleet-ops/operations/orders` | list order |
| `/fleet-ops/operations/routes` | list route |
| `/fleet-ops/operations/schedule` | list order |
| `/fleet-ops/operations/order-config` | list order |
| `/fleet-ops/management/drivers` | list driver |
| `/fleet-ops/management/vehicles` | list vehicle |
| `/fleet-ops/management/places` | list place |
| `/fleet-ops/management/fleets` | list fleet |
| `/fleet-ops/management/vendors` | list vendor |
| `/fleet-ops/management/contacts` | list contact |
| `/fleet-ops/management/issues` | list issue |
| `/fleet-ops/management/fuel-reports` | list fuel-report |
| `/fleet-ops/connectivity/telematics` | list telematic |
| `/fleet-ops/connectivity/sensors` | list sensor |
| `/fleet-ops/connectivity/tracking` | list vehicle |
| `/fleet-ops/maintenance/schedules` | list maintenance |
| `/fleet-ops/maintenance/work-orders` | list work-order |
| `/fleet-ops/maintenance/equipment` | list equipment |
| `/fleet-ops/maintenance/parts` | list part |
| `/fleet-ops/service-areas` | list service-area |
| `/fleet-ops/settings` | list setting |
| `/fleet-ops/custom-fields` | list custom-field |
| `/fleet-ops/tracking/lookup` | list order |

**Super Admin rule:** All FleetOps sidebar items visible (admin bypass).

### 7.3 FleetOps role templates (planning)

| Template role | Minimum permissions | Typical user |
|---------------|---------------------|--------------|
| **Fleet Admin** | `fleet-ops *` | Super Admin delegate |
| **Dispatcher** | list/update order, list driver, list vehicle, list route | Control room |
| **Fleet manager** | list/update driver, vehicle, fleet, issue, fuel-report | Fleet owner |
| **Maintenance lead** | list/update work-order, maintenance, part, equipment | Workshop |
| **Read-only ops** | list order, list driver, list vehicle | Support desk |
| **Driver (mobile)** | Mobile auth — not console sidebar | Field |

### 7.4 FleetOps business rules (access)

| ID | Rule |
|----|------|
| BR-FO-A01 | Yard-only/parking-only sessions cannot call FleetOps APIs from console |
| BR-FO-A02 | Effective permissions = direct user permissions + role permissions + policy permissions |
| BR-FO-A03 | `is_admin` on platform user bypasses all FleetOps checks |
| BR-FO-A04 | Dispatch requires `update order` or wildcard |
| BR-FO-A05 | Delete driver requires `delete driver` — not implied by list |

---

## 8. Yard (YMS) Permissions

### 8.1 Yard role catalog

| Role code | Display name | Intended job |
|-----------|--------------|--------------|
| `yard_admin` | Yard Administrator | Full yard + user/role admin |
| `yard_manager` | Yard Manager | Operations oversight, detention, reports |
| `gate_operator` | Gate Operator | Entry/exit only |
| `yard_coordinator` | Yard Coordinator | Queue, labor, equipment, map |
| `dock_supervisor` | Dock Supervisor | Docks, loading, assignments |

**Legacy mapping (migration):** `admin`→yard_admin, `operations`→yard_manager, `gate`→gate_operator, `supervisor`→dock_supervisor, `read_only`→yard_coordinator

### 8.2 Yard permission types

#### A. Module permissions (screen access)

| Code | Label | Controls screen |
|------|-------|-----------------|
| `module.control_tower` | Control Tower | `/yard`, alerts |
| `module.appointments` | Appointments (full) | Book + edit |
| `module.appointments.view` | Appointments (view) | Read-only calendar |
| `module.gate` | Gate Management | `/yard/gate` |
| `module.queue` | Virtual Queue | `/yard/queue` |
| `module.yard_map` | Yard Map (full) | Move vehicles |
| `module.yard_map.view` | Yard Map (view) | View only |
| `module.vehicles` | Vehicle Monitor | `/yard/vehicles` |
| `module.docks` | Dock Management | `/yard/docks` |
| `module.labor` | Labor Management | `/yard/labor` |
| `module.equipment` | Equipment Management | `/yard/equipment` |
| `module.loading` | Loading Operations | `/yard/loading` |
| `module.detention` | Detention | `/yard/detention` |
| `module.operations_dashboard` | Operations Dashboard | Shift KPIs |
| `module.delay_analysis` | Delay Analysis | Report |
| `module.kpis` | Executive KPIs | Leadership scorecard |
| `module.reports` | Reports suite | All yard reports |
| `module.user_management` | User Management | `/yard/admin/users` |
| `module.role_management` | Role Management | `/yard/admin/roles` |
| `module.settings` | Yard Settings | `/yard/settings` |
| `module.ai` | Recommendations | `/yard/ai` |

#### B. Action permissions (workflow buttons)

| Code | Label | Business action |
|------|-------|-----------------|
| `vehicle.write` | Write vehicles | Create/edit vehicle registry |
| `appointment.write` | Write appointments | Book/modify appointments |
| `queue.write` | Manage queue | Override priority |
| `dock.write` | Write docks | CRUD docks |
| `flow.check_in` | Check in vehicles | Approve gate entry |
| `flow.call` | Call vehicles | Call-in from queue |
| `flow.assign_dock` | Assign dock | Assign bay |
| `flow.vehicle_transition` | Transition status | Mark arrived, gate-out, reject |
| `detention.write` | Write detention | Approve/dispute detention |
| `equipment.write` | Write equipment | CRUD equipment |
| `labor.write` | Write labor | CRUD labor teams |
| `yard_event.write` | Write yard events | Exceptions, reject exit |
| `yard_zone.write` | Write yard zones | Manual zone moves |
| `reports.view` | View reports | Open reports |
| `reports.export` | Export reports | CSV/XLSX/PDF |
| `gate.approve_entry` | Approve entry | Alias for check-in path |
| `gate.reject_entry` | Reject entry | Entry rejection |
| `gate.verify_exit` | Verify exit | Exit checklist complete |
| `gate.gate_out` | Gate out | Final exit |
| `dock.view_availability` | View dock availability | See bay grid |
| `loading.start` | Start loading | Begin load operation |
| `loading.complete` | Complete loading | Finish load |
| `loading.manage_exceptions` | Manage exceptions | Loading exception workflow |

**Wildcard:** `*` = all modules and actions (yard_admin only)

### 8.3 Yard permission aliases (business)

| Requested permission | Also satisfied by |
|---------------------|-------------------|
| `module.appointments` | `module.appointments.view` |
| `module.yard_map` | `module.yard_map.view` |
| `gate.approve_entry` | `flow.check_in` |
| `gate.reject_entry` | `flow.vehicle_transition` |
| `gate.verify_exit` | `flow.vehicle_transition` |
| `gate.gate_out` | `flow.vehicle_transition` |
| `loading.start` | `yard_event.write` |
| `loading.complete` | `yard_event.write` |
| `loading.manage_exceptions` | `yard_event.write` |

### 8.4 Yard sidebar → module permission

| Route | Module permission |
|-------|-------------------|
| `/yard` | `module.control_tower` |
| `/yard/queue` | `module.queue` |
| `/yard/yard` | `module.yard_map` |
| `/yard/ai` | `module.ai` |
| `/yard/appointments` | `module.appointments` |
| `/yard/gate` | `module.gate` |
| `/yard/docks` | `module.docks` |
| `/yard/loading` | `module.loading` |
| `/yard/vehicles` | `module.vehicles` |
| `/yard/equipment` | `module.equipment` |
| `/yard/labor` | `module.labor` |
| `/yard/operations-dashboard` | `module.operations_dashboard` |
| `/yard/reports/delay-analysis` | `module.delay_analysis` |
| `/yard/detention` | `module.detention` |
| `/yard/kpis` | `module.kpis` |
| `/yard/admin/users` | `module.user_management` |
| `/yard/admin/roles` | `module.role_management` |
| `/yard/settings` | `module.settings` |

**Super Admin on platform session:** All yard sidebar items visible.

### 8.5 Yard mobile tab → role mapping

| Role | Bottom tabs | More hub (typical) |
|------|-------------|-------------------|
| yard_admin | Overview, Alerts, Search, More, Profile | All modules |
| yard_manager | Overview, Alerts, Search, More, Profile | Detention, loading, labor, equipment |
| gate_operator | Gate, Appointments, Search, More, Profile | — |
| yard_coordinator | Queue, Search, More, Profile | Vehicles, labor, equipment, yard map |
| dock_supervisor | Docks, Search, More, Profile | Queue, loading ops, labor, equipment |

### 8.6 Super Admin yard governance workflows

#### WF-YARD-01 — Onboard gate operator (yard-only)

1. Super Admin creates user in **Yard Admin → Users**
2. Assigns role `gate_operator`
3. User logs in via unified login (yard email) or yard credentials
4. Session scope = yard-only
5. Verify: sees Gate + Appointments only; no Docks, no detention write

#### WF-YARD-02 — Promote coordinator to dock supervisor

1. Super Admin opens Yard Admin → Users
2. Changes role from `yard_coordinator` to `dock_supervisor`
3. User re-login or token refresh
4. Verify: mobile home = Docks; gains `flow.assign_dock`, loses queue-centric defaults

#### WF-YARD-03 — Custom role (planning)

1. Super Admin opens Yard Admin → Roles
2. Clones `yard_manager` template
3. Removes `detention.write` for "Manager — No Finance"
4. Assigns to users
5. Verify detention screen read-only or hidden

---

## 9. Parking (PMS) Permissions

### 9.1 Parking role catalog

| Role | Business scope |
|------|----------------|
| `admin` | Full facility: employees, pricing, floors, hardware, audit, all operator/supervisor functions |
| `supervisor` | Monitor floors, operators, tickets, QR, reports (view) — **no** pricing/user admin |
| `operator` | Tickets, payments, QR print, search, occupancy summary |

### 9.2 Parking permission catalog

| Permission | Label | Business capability |
|------------|-------|---------------------|
| `dashboard.view` | Dashboard | Role dashboard screen |
| `parking.status.view` | Parking status | Live monitoring view |
| `parking.manage` | Parking manage | Admin parking sessions config |
| `vehicle.monitoring` | Vehicle monitoring | Supervisor vehicle watch |
| `entry_exit.monitoring` | Entry/exit monitoring | Gate stream |
| `recent.tickets` | Recent tickets | Ticket list |
| `qr.monitoring` | QR monitoring | Scan events |
| `reports.view` | Reports view | Supervisor reports |
| `reports.admin` | Reports admin | Full export/PDF tier |
| `operator.activity` | Operator activity | Staff action feed |
| `vehicle.search` | Vehicle search | Find by plate/code |
| `occupancy.analytics` | Occupancy analytics | Supervisor analytics |
| `floors.manage` | Floors manage | Admin floor CRUD |
| `floors.monitor` | Floors monitor | Supervisor floor view |
| `floors.summary` | Floors summary | Operator occupancy card |
| `users.manage` | Users manage | Employee CRUD |
| `roles.manage` | Roles manage | Parking role config |
| `pricing.configure` | Pricing configure | Rate rules |
| `hardware.configure` | Hardware configure | Devices |
| `audit.view` | Audit view | Audit log |
| `settings.manage` | Settings manage | Operator/supervisor settings |
| `system.configure` | System configure | Admin system |
| `security.settings` | Security settings | Admin security |
| `tickets.create` | Tickets create | New entry ticket |
| `payments.collect` | Payments collect | Take payment |
| `qr.print` | QR print | Print ticket QR |

### 9.3 Parking sidebar rules (critical for Super Admin planning)

| Rule | Detail |
|------|--------|
| BR-PK-S01 | Admin users see only `/parking/admin/*` routes in sidebar |
| BR-PK-S02 | Supervisor users see only `/parking/supervisor/*` routes |
| BR-PK-S03 | Operator users see only `/parking/operator/*` routes |
| BR-PK-S04 | Permission must pass **and** route prefix must match role |
| BR-PK-S05 | Super Admin on platform session = effective parking role `admin` + all permissions |
| BR-PK-S06 | Super Admin does **not** bypass role prefix on parking-only session |

### 9.4 Parking route → permission (admin prefix)

| Route | Permission |
|-------|------------|
| `/parking/admin/dashboard` | `dashboard.view` |
| `/parking/admin/users` | `users.manage` |
| `/parking/admin/pricing` | `pricing.configure` |
| `/parking/admin/parking` | `parking.manage` |
| `/parking/admin/parking-floors` | `floors.manage` |
| `/parking/admin/reports` | `reports.admin` |
| `/parking/admin/hardware` | `hardware.configure` |
| `/parking/admin/qr-monitoring` | `qr.monitoring` |
| `/parking/admin/audit-logs` | `audit.view` |
| `/parking/admin/settings` | `settings.manage` |

*(Supervisor and operator routes mapped similarly — see `parkingSidebar.js`)*

### 9.5 Parking SSO role mapping (Super Admin)

| Platform identity | PMS provisioned role | Upgrade rule |
|-------------------|----------------------|--------------|
| Super Admin (SA-01…SA-05) | `admin` | Existing user upgraded to admin on SSO if platform gains admin |
| Non-admin platform user | `supervisor` | Default on first SSO |
| Parking-only login | As assigned in PMS employees | No platform IAM |

**Business rules:**

| ID | Rule |
|----|------|
| BR-PK-SSO-01 | SSO creates user on first login if email new |
| BR-PK-SSO-02 | Inactive PMS user cannot SSO |
| BR-PK-SSO-03 | Role upgrade on SSO is **upgrade-only** (supervisor→admin), never downgrade admin automatically |
| BR-PK-SSO-04 | Display name synced from platform on SSO |

---

## 10. Storefront, Ledger, Pallet, Developers, Registry

### 10.1 Engine visibility pattern

Each engine uses **permission prefix** on platform IAM permissions (unless Super Admin):

| Engine | Prefix examples | Business scope |
|--------|-----------------|----------------|
| **Storefront** | `storefront`, `storefront-*` | Catalog, customers, orders, promotions |
| **Ledger** | `ledger`, `ledger-*` | Invoices, payments, journals, COA |
| **Pallet** | `pallet`, `pallet-*` | Inventory, warehouses, POs |
| **Developers** | `developers`, `api-key`, `webhook` | API keys, webhooks, logs |
| **Registry** | `registry`, `extension` | Extension marketplace |

### 10.2 Planning note for Super Admin

Platform permissions for these engines are created by **`fleetbase:create-permissions`** from Auth Schemas — same pattern as FleetOps (`{service} {action} {resource}`).

Super Admin should plan **policy bundles** per department:

| Department policy | Engines included |
|-------------------|------------------|
| Finance | Ledger + FleetOps list order |
| E-commerce | Storefront + FleetOps list order |
| Warehouse | Pallet + Yard module.loading (separate yard role) |
| Engineering | Developers + Registry |

---

## 11. Screen-to-Permission Mapping

### 11.1 Console (platform shell)

| Screen | Access |
|--------|--------|
| `/` Dashboard | Platform session |
| `/notifications` | Platform session |
| `/account` | Any authenticated |
| `/settings` | Platform admin or org settings permission |
| `/admin/health` | Super Admin typical |
| `/onboarding` | Install/onboard flows |

### 11.2 Cross-engine guard summary

| Check layer | Applies to |
|-------------|------------|
| Session scope lock | yard-only, parking-only |
| Engine guard | URL prefix `/fleet-ops`, `/yard`, etc. |
| Sidebar filter | Each menu item |
| Action buttons | Yard/Parking/FleetOps action permissions |
| API module guard | Yard backend route prefixes |

---

## 12. Super Admin Operational Workflows

### WF-SA-01 — Greenfield organization setup

| Step | Action | Verification |
|------|--------|--------------|
| 1 | Complete platform onboarding | Org exists |
| 2 | Run permission seed (admin task) | IAM roles populated |
| 3 | Create Super Admin account | SA criteria met |
| 4 | Create IAM roles: Dispatcher, Fleet Manager, Finance | Policies attached |
| 5 | Seed Yard roles (system defaults) | 5 roles exist |
| 6 | Seed Parking roles | admin, supervisor, operator |
| 7 | Create yard gate operator (yard-only) | Yard-only session works |
| 8 | Create parking operator (parking-only) | Parking-only session works |
| 9 | Smoke test SSO: Super Admin opens Yard + Parking | No second password |
| 10 | Document role matrix in org runbook | Audit ready |

### WF-SA-02 — Monthly access review

| Step | Action |
|------|--------|
| 1 | Export IAM users and roles |
| 2 | Export Yard users (Yard Admin) |
| 3 | Export Parking employees |
| 4 | Compare to HR active list |
| 5 | Deactivate leavers |
| 6 | Review users with `*` or `fleet-ops *` |
| 7 | Review detention.write holders |
| 8 | Review pricing.configure holders |
| 9 | Sign off access review record |

### WF-SA-03 — Incident: revoke gate-out permission

| Step | Action |
|------|--------|
| 1 | Identify user in Yard Admin |
| 2 | Change role from gate_operator to custom read-only |
| 3 | Confirm `flow.vehicle_transition` removed |
| 4 | Force logout (disable + re-enable or password reset) |
| 5 | Verify gate-out button disabled on mobile |
| 6 | Log incident ticket |

### WF-SA-04 — Delegate IAM without full Super Admin

| Step | Action |
|------|--------|
| 1 | Create role "IAM Officer" |
| 2 | Grant users.view, roles.view, groups.view, policies.view + create/update |
| 3 | **Do not** grant fleet-ops *, detention.write, pricing.configure |
| 4 | User qualifies as console admin via SA-05 but not SA-01 |
| 5 | User can manage identities but not operational engines |

---

## 13. User Provisioning Scenarios

### Scenario matrix

| # | User type | IAM account | Yard account | Parking account | Session | Engines visible |
|---|-----------|-------------|--------------|-----------------|---------|-----------------|
| S1 | Super Admin | Yes (admin) | SSO auto | SSO auto | platform | All |
| S2 | Dispatcher | Yes (dispatcher role) | No | No | platform | FleetOps |
| S3 | Gate operator | No | Yes (gate_operator) | No | yard-only | Yard |
| S4 | Dock supervisor | No | Yes (dock_supervisor) | No | yard-only | Yard |
| S5 | Parking operator | No | No | Yes (operator) | parking-only | Parking |
| S6 | Parking supervisor | No | No | Yes (supervisor) | parking-only | Parking |
| S7 | Hybrid manager | Yes (limited) | Yes (yard_manager) | No | platform + yard SSO | FleetOps + Yard |
| S8 | Driver | Driver record | No | No | mobile driver | Driver app only |
| S9 | Finance clerk | Yes (ledger) | No | No | platform | Ledger |
| S10 | IAM officer | Yes (IAM only) | No | No | platform | IAM + Console |

### Provisioning checklist per hire

- [ ] Job function documented
- [ ] Session scope chosen (platform / yard-only / parking-only / mobile)
- [ ] IAM user created (if needed)
- [ ] FleetOps policy attached (if needed)
- [ ] Yard user + role (if needed)
- [ ] Parking employee + role (if needed)
- [ ] Driver record (if needed)
- [ ] Login tested on web + mobile
- [ ] Negative test: forbidden screen blocked
- [ ] Manager sign-off

---

## 14. SSO & Engine Bridges

### 14.1 Yard SSO bridge (Super Admin)

| Step | Business behavior |
|------|-------------------|
| 1 | Super Admin logged into platform (Shipgen token) |
| 2 | Navigates to `/yard` |
| 3 | System exchanges platform token for Yard JWT (`platformLogin`) |
| 4 | Yard session receives `*` permissions for admin |
| 5 | Yard sidebar fully unlocked |

**Failure cases:**

| Condition | User experience |
|-----------|-----------------|
| Platform token expired | Redirect to login |
| Yard SSO misconfigured | Yard engine hidden or error state |
| Non-admin without yard account | No yard access |

### 14.2 Parking SSO bridge (Super Admin)

Same pattern as Yard. Super Admin receives parking `admin` role and all permissions on bridge.

### 14.3 Business rules

| ID | Rule |
|----|------|
| BR-SSO-01 | Engine-only users never trigger platform bridge |
| BR-SSO-02 | Bridge is silent — no second login form for Super Admin |
| BR-SSO-03 | Yard bridge stores separate JWT in yard session storage |
| BR-SSO-04 | Logout from platform should clear yard/parking tokens (best effort) |

---

## 15. Permission Inheritance & Precedence

### 15.1 Platform (FleetOps / IAM)

```
Effective permission =
  User.direct permissions
  ∪ Role.permissions
  ∪ Policy.permissions (via role or direct)
  ∪ Admin bypass if is_admin
```

### 15.2 Yard

```
Effective yard permission =
  Role template permissions (from Yard Admin)
  ∪ Custom role overrides
  ∪ "*" if yard_admin
  ∪ "*" if Super Admin on platform session (UI layer)
```

### 15.3 Parking

```
Effective parking permission =
  ROLE_PERMISSIONS[role]
  ∪ Super Admin bypass (platform session only)
```

### 15.4 Precedence when rules conflict

| Situation | Wins |
|-----------|------|
| Super Admin vs deny in yard role | Super Admin (platform session) |
| parking-only session vs admin permissions | Role prefix routes (admin/supervisor/operator) |
| Missing module but has action permission | Module guard blocks screen |
| IAM grants storefront but not fleet-ops | Storefront only in switcher |
| `module.appointments.view` vs need book | View only — no Book button |

---

## 16. Audit & Compliance for Access Changes

### 16.1 Events Super Admin must track

| Domain | Log-worthy events |
|--------|-------------------|
| IAM | User created, role changed, deactivated, password reset |
| Yard | Yard user created, role changed, permission matrix edited |
| Parking | Employee created, role changed, pricing changed |
| SSO | First provision, role upgrade supervisor→admin |
| Session | Failed login spikes (security) |

### 16.2 Segregation of duties matrix (recommended)

| Permission | Should NOT combine with |
|------------|-------------------------|
| `pricing.configure` | `tickets.create` (operator) on same user |
| `detention.write` | `flow.check_in` on same user (optional policy) |
| `users.manage` (parking) | `payments.collect` on same user |
| `fleet-ops *` | Unrelated `yard_admin` on same person without review |
| IAM `roles.update` | No operational duties without approval |

### 16.3 Compliance reports Super Admin needs

| Report | Purpose |
|--------|---------|
| Users with wildcard permissions | Over-privilege detection |
| Inactive users still active | Offboarding gaps |
| Role change history | SOX-style access audit |
| Failed authorization count | Misconfigured roles |

---

## 17. Planning Decisions Super Admin Must Make

| # | Decision | Options | Impact |
|---|----------|---------|--------|
| D1 | Single identity vs dual identity | One email vs yard@ / parking@ | SSO complexity |
| D2 | Who is Super Admin | IT vs operations director | Segregation of duties |
| D3 | Custom yard roles | Yes/No | Yard Admin role matrix size |
| D4 | Parking supervisor can collect payment? | Allow/deny | Needs custom role if deny |
| D5 | Dispatcher sees yard read-only? | Yard manager read-only template | Cross-engine visibility |
| D6 | Driver also yard gate user? | Separate accounts recommended | Mobile module confusion |
| D7 | Finance disputes detention | detention.write role assignment | Usually manager only |
| D8 | API access | Developers engine for integrators | Security surface |
| D9 | Default deny vs permissive demo | Production must be deny-by-default | Security posture |
| D10 | Access review cadence | Monthly/quarterly | Compliance |

---

## 18. Acceptance Criteria — Governance

### Super Admin identity

- [ ] User meeting SA-01 receives all engines in switcher
- [ ] User meeting SA-05 (users.view + roles.view) treated as console admin
- [ ] Yard-only user never meets Super Admin criteria

### Engine isolation

- [ ] Yard-only cannot navigate to `/fleet-ops` (redirect)
- [ ] Parking-only cannot navigate to `/yard` (redirect)
- [ ] Dispatcher without yard account cannot open yard screens

### Yard RBAC

- [ ] gate_operator has `flow.check_in` but not `flow.assign_dock`
- [ ] dock_supervisor has `flow.assign_dock` but not `module.detention`
- [ ] yard_admin has `module.user_management` and `module.role_management`
- [ ] Custom role without `queue.write` cannot override queue

### Parking RBAC

- [ ] operator cannot open `/parking/admin/pricing`
- [ ] supervisor cannot open `/parking/admin/users`
- [ ] admin has all parking permissions
- [ ] Super Admin SSO creates parking admin, not supervisor

### FleetOps RBAC

- [ ] User with only `list order` sees orders sidebar, not drivers
- [ ] User without `update order` cannot dispatch (button hidden)
- [ ] `is_admin` bypasses all fleet-ops checks

### IAM

- [ ] Cannot create role named `Administrator` (reserved)
- [ ] User with only `groups.view` does not see roles screen
- [ ] Deactivated user cannot log in to any engine

### SSO bridges

- [ ] Super Admin opens yard without yard password
- [ ] Super Admin opens parking without parking password
- [ ] Platform admin upgraded to parking admin on repeat SSO after promotion

---

## Appendix A — Complete Yard Role × Permission Matrix

Legend: **Y** = granted, **—** = not granted

### Module permissions

| Permission | yard_admin | yard_manager | gate_operator | yard_coordinator | dock_supervisor |
|------------|:----------:|:------------:|:-------------:|:----------------:|:---------------:|
| module.control_tower | Y | Y | — | — | — |
| module.appointments | Y | Y | — | — | — |
| module.appointments.view | Y | Y | Y | Y | — |
| module.gate | Y | — | Y | — | — |
| module.queue | Y | Y | — | Y | Y |
| module.yard_map | Y | Y | — | Y | Y |
| module.yard_map.view | Y | Y | Y | Y | Y |
| module.vehicles | Y | Y | Y | Y | Y |
| module.docks | Y | Y | — | — | Y |
| module.labor | Y | Y | — | Y | Y |
| module.equipment | Y | Y | — | Y | Y |
| module.loading | Y | Y | — | — | Y |
| module.detention | Y | Y | — | — | — |
| module.operations_dashboard | Y | Y | — | — | — |
| module.delay_analysis | Y | Y | — | — | — |
| module.kpis | Y | Y | — | — | — |
| module.reports | Y | Y | — | — | — |
| module.user_management | Y* | — | — | — | — |
| module.role_management | Y* | — | — | — | — |
| module.settings | Y* | — | — | — | — |
| module.ai | Y | Y | — | — | — |

*yard_admin has `*` = all including admin modules

### Action permissions

| Permission | yard_admin | yard_manager | gate_operator | yard_coordinator | dock_supervisor |
|------------|:----------:|:------------:|:-------------:|:----------------:|:---------------:|
| vehicle.write | Y | Y | — | — | — |
| appointment.write | Y | Y | — | — | — |
| queue.write | Y | Y | — | Y | — |
| dock.write | Y | Y | — | — | Y |
| flow.check_in | Y | Y | Y | — | — |
| flow.call | Y | Y | — | Y | — |
| flow.assign_dock | Y | Y | — | — | Y |
| flow.vehicle_transition | Y | Y | Y | — | Y |
| detention.write | Y | Y | — | — | — |
| equipment.write | Y | Y | — | Y | Y |
| labor.write | Y | Y | — | Y | Y |
| yard_event.write | Y | Y | Y | — | Y |
| yard_zone.write | Y | Y | — | Y | — |
| reports.view | Y | Y | — | — | — |
| reports.export | Y | Y | — | — | — |
| loading.start/complete/exceptions | Y | Y | — | — | Y |
| gate approve/reject/verify/out | Y | Y | Y | — | — |

---

## Appendix B — Complete Parking Role × Permission Matrix

| Permission | admin | supervisor | operator |
|------------|:-----:|:----------:|:--------:|
| dashboard.view | Y | Y | Y |
| parking.status.view | Y | Y | — |
| parking.manage | Y | — | — |
| vehicle.monitoring | Y | Y | — |
| entry_exit.monitoring | Y | Y | — |
| recent.tickets | Y | Y | Y |
| qr.monitoring | Y | Y | — |
| reports.view | Y | Y | — |
| reports.admin | Y | — | — |
| operator.activity | Y | Y | — |
| vehicle.search | Y | Y | Y |
| occupancy.analytics | Y | Y | — |
| floors.manage | Y | — | — |
| floors.monitor | Y | Y | — |
| floors.summary | Y | — | Y |
| users.manage | Y | — | — |
| roles.manage | Y | — | — |
| pricing.configure | Y | — | — |
| hardware.configure | Y | — | — |
| audit.view | Y | — | — |
| settings.manage | Y | — | Y |
| system.configure | Y | — | — |
| security.settings | Y | — | — |
| tickets.create | Y | — | Y |
| payments.collect | Y | — | Y |
| qr.print | Y | — | Y |

---

## Appendix C — Demo Accounts Reference

### Yard (YMS) — typical demo pattern

| Role | Email pattern |
|------|---------------|
| Yard staff | `yard.*@shipgen.demo` |

### Parking (PMS) — seeded demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `parking.admin@shipgen.demo` | `admin123` |
| Supervisor | `parking.supervisor@shipgen.demo` | `supervisor123` |
| Operator | `parking.operator@shipgen.demo` | `operator123` |

### Super Admin testing

Use platform administrator account with SA criteria → verify all engines + SSO bridges.

---

*End of document — for operational workflows (gate, queue, tickets), see `docs/SHIPGEN-BRD.md`.*
