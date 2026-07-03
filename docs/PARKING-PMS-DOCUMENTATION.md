# Parking Management System (PMS) — Feature Documentation

| Field | Value |
|-------|--------|
| **Product name (facility UI)** | Security Systems |
| **Internal / API name** | ParkFlow |
| **Platform integration** | Shipgen engine — **Parking** (`/parking/*`) |
| **Public API path** | `/api/pms/*` → PMS backend `/api/v1/*` |
| **Version** | As of Shipgen `merge_web` (June 2026) |
| **Audience** | Customer demos, operations, product, implementation |

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Deployment modes](#2-deployment-modes)
3. [User roles & permissions](#3-user-roles--permissions)
4. [Feature catalog by module](#4-feature-catalog-by-module)
5. [Ticket lifecycle & business rules](#5-ticket-lifecycle--business-rules)
6. [Floor & occupancy](#6-floor--occupancy)
7. [Pricing](#7-pricing)
8. [Reports & analytics](#8-reports--analytics)
9. [Monitoring & hardware](#9-monitoring--hardware)
10. [OCR (license plate)](#10-ocr-license-plate)
11. [Administration & audit](#11-administration--audit)
12. [Shipgen integration](#12-shipgen-integration)
13. [Demo credentials](#13-demo-credentials)
14. [Technical stack & architecture](#14-technical-stack--architecture)
15. [API surface (summary)](#15-api-surface-summary)
16. [Out of scope / limitations](#16-out-of-scope--limitations)

---

## 1. Executive summary

The **Parking Management System (PMS)** operates multi-floor parking facilities: vehicle entry ticketing, payment collection, live occupancy tracking, supervisor oversight, revenue reporting, and hardware monitoring.

**Primary business outcomes:**

- Replace paper tickets with digital tickets and QR codes
- Track occupancy by floor and vehicle category (2-wheeler, 4-wheeler, heavy)
- Enforce payment before or at exit
- Give supervisors real-time visibility into operators and facility activity
- Provide management reports and PDF export for finance

**Three staff roles:** Admin · Supervisor · Operator

---

## 2. Deployment modes

| Mode | Description |
|------|-------------|
| **Embedded in Shipgen** | Parking engine inside the Shipgen web console (`/parking/*`). Shared header, sidebar, and Shipgen login. Shipgen administrators are bridged to **parking admin** via platform SSO. |
| **Standalone ParkFlow** | Run `Parking management/frontend` + `backend` independently (dedicated login at `/login`). For facilities that only need parking. |
| **Optional mobile** | Expo app under `Parking management/mobile-app/` (separate from Shipgen mobile). |

**Docker (Shipgen stack):**

- `pms-postgres` — PostgreSQL database (`parkflow`)
- `pms-service` — FastAPI backend
- Gateway route: `https://<host>/api/pms/*`

---

## 3. User roles & permissions

### 3.1 Roles

| Role | Who | Access level |
|------|-----|--------------|
| **Admin** | Facility manager, IT | Full configuration + all supervisor/operator functions |
| **Supervisor** | Shift lead | Monitor floors, operators, tickets, reports (no pricing/user admin) |
| **Operator** | Booth staff | Entry, payment, exit, search, QR print |

### 3.2 Permission matrix (summary)

| Capability | Admin | Supervisor | Operator |
|------------|:-----:|:----------:|:--------:|
| Dashboard KPIs | ✓ | ✓ | ✓ |
| Create entry ticket | ✓ | | ✓ |
| Collect payment | ✓ | | ✓ |
| Process exit | ✓ | | ✓ |
| Vehicle search | ✓ | ✓ | ✓ |
| QR print / monitoring | ✓ | ✓ | ✓ |
| Recent tickets | ✓ | ✓ | ✓ |
| Floor occupancy (view) | ✓ | ✓ | Summary only |
| Floor capacity (edit) | ✓ | | |
| Parking monitoring stream | ✓ | ✓ | |
| Operator activity | ✓ | ✓ | |
| Reports (view) | ✓ | ✓ | |
| Reports (PDF export) | ✓ | | |
| Pricing configuration | ✓ | | |
| Employee management | ✓ | | |
| Hardware configuration | ✓ | | |
| Audit logs | ✓ | | |
| System / security settings | ✓ | | |

Permissions are enforced on **both** the FastAPI backend and React router.

---

## 4. Feature catalog by module

### 4.1 Admin screens

| Screen | Route (embedded) | Features |
|--------|------------------|----------|
| **Dashboard** | `/parking/admin/dashboard` | Facility KPIs: vehicles inside, today entries/exits, revenue today, occupancy; hardware snapshot; recent audit; recent tickets |
| **Employees** | `/parking/admin/users` | Create/edit/disable parking staff; assign role (admin/supervisor/operator) |
| **Pricing** | `/parking/admin/pricing` | Rate rules by vehicle category: base price, per-hour, max daily; activate/deactivate |
| **Parking sessions** | `/parking/admin/parking` | General parking facility settings and session overview |
| **Floors** | `/parking/admin/parking-floors` | Multi-floor setup; capacity per category (2W / 4W / heavy); live occupied counts |
| **Reports** | `/parking/admin/reports` | Revenue, traffic, category breakdown; date presets + custom range; vehicle filter; **PDF export** |
| **Hardware** | `/parking/admin/hardware` | Register devices: QR scanners, boom barriers, printers, network controllers; online/offline status |
| **QR monitoring** | `/parking/admin/qr-monitoring` | Live QR scan event stream |
| **Audit logs** | `/parking/admin/audit-logs` | Who changed what — pricing, users, tickets, settings |
| **Settings** | `/parking/admin/settings` | System and security preferences |

### 4.2 Supervisor screens

| Screen | Route (embedded) | Features |
|--------|------------------|----------|
| **Dashboard** | `/parking/supervisor/dashboard` | Shift overview, occupancy %, active operators, open alerts |
| **Monitoring** | `/parking/supervisor/monitoring` | Live entry/exit event stream |
| **Floors** | `/parking/supervisor/parking-floors` | View-only floor occupancy (monitor mode) |
| **Vehicle search** | `/parking/supervisor/vehicle-search` | Find ticket by plate number or ticket code |
| **QR monitoring** | `/parking/supervisor/qr-monitoring` | Scan activity oversight |
| **Reports** | `/parking/supervisor/reports` | View reports (no PDF export) |
| **Operator activity** | `/parking/supervisor/operator-activity` | Timeline of operator actions |
| **Recent tickets** | `/parking/supervisor/recent-tickets` | Last transactions across facility |

### 4.3 Operator screens

| Screen | Route (embedded) | Features |
|--------|------------------|----------|
| **Dashboard** | `/parking/operator/dashboard` | Shift summary for current operator |
| **Occupancy** | `/parking/operator/occupancy` | Quick floor fill levels (summary view) |
| **New ticket** | `/parking/operator/new-ticket` | Vehicle entry: plate, category, entry type, payment; OCR plate upload; QR generation |
| **Collect payment** | `/parking/operator/collect-payment` | Search unpaid ticket → collect cash/UPI/card |
| **QR print** | `/parking/operator/qr-print` | Print/display QR ticket for windshield |
| **Vehicle search** | `/parking/operator/vehicle-search` | Lookup parked vehicle; process exit |
| **Recent tickets** | `/parking/operator/recent-tickets` | Operator's recent handled tickets |
| **Settings** | `/parking/operator/settings` | Operator preferences |

---

## 5. Ticket lifecycle & business rules

### 5.1 Status flow

```
Created (Unpaid or Paid at entry) → Paid (if was unpaid) → Exited
```

| Status | Meaning |
|--------|---------|
| **Unpaid** | Entry recorded; payment pending |
| **Paid** | Payment collected (at entry or later) |
| **Exited** | Vehicle left; slot freed |

### 5.2 New ticket (entry) — step by step

1. Operator enters **vehicle number** (manual or OCR from photo)
2. Selects **vehicle category**: 2 Wheeler · 4 Wheeler · Heavy Vehicles
3. Selects **entry type**: Paid Entry · Free Entry
4. System looks up active **pricing rule** for category
5. System calculates amount (₹0 for free entry)
6. If pay-at-entry: operator selects payment method (Cash, UPI, Card, etc.)
7. System generates unique **ticket code** (e.g. `PK102399`)
8. System assigns **floor** with available capacity; increments occupancy
9. Logs vehicle **entry** event
10. Operator prints **QR ticket**

**Business rules:**

- Cannot create ticket without active pricing rule (except free entry)
- Free entry requires explicit entry type selection
- Ticket code is unique sequential
- Amount is **locked at creation** (price changes do not affect existing tickets)
- If no floor has capacity for category → error `NO_FLOOR_CAPACITY`

### 5.3 Payment collection

1. Operator searches **unpaid** ticket (plate or code)
2. System validates status = Unpaid
3. Operator selects payment method
4. System marks **Paid**, records payment with collector identity
5. Audit log entry created

**Rule:** Only Unpaid tickets accept payment.

### 5.4 Exit

1. Operator searches ticket (plate or code)
2. System confirms not already Exited
3. Operator processes exit
4. System sets exit time, marks **Exited**, frees slot
5. Floor occupancy decremented for vehicle category
6. Vehicle **exit** event logged
7. Audit log entry created

---

## 6. Floor & occupancy

### 6.1 Structure

Each facility has **multiple floors**. Each floor has separate capacity buckets:

| Bucket | Examples |
|--------|----------|
| **2-wheeler** | Bikes, scooters |
| **4-wheeler** | Cars, SUVs |
| **Heavy vehicle** | Trucks, buses |

### 6.2 Demo seed data (example)

| Floor | 2W (cap/occ) | 4W (cap/occ) | Heavy (cap/occ) |
|-------|--------------|--------------|-----------------|
| Floor 1 | 80 / 62 | 60 / 48 | 10 / 4 |
| Floor 2 | 70 / 55 | 55 / 40 | 8 / 6 |
| Floor 3 | 65 / 65 | 50 / 50 | 6 / 6 |
| Basement | 90 / 24 | 45 / 12 | 12 / 2 |

### 6.3 Business rules

| Rule | Description |
|------|-------------|
| BR-PK-01 | Each floor has capacity buckets: 2W, 4W, heavy |
| BR-PK-02 | Occupancy cannot exceed capacity (system blocks/warns) |
| BR-PK-03 | Exit always frees occupancy count |
| BR-PK-04 | Supervisor sees occupancy; only admin edits capacities |
| BR-PK-05 | Operator sees summary only, not full floor admin |

---

## 7. Pricing

### 7.1 Default demo rules (seed)

| Category | Base (₹) | Per hour (₹) | Max daily (₹) |
|----------|----------|--------------|---------------|
| 2 Wheeler | 20 | 10 | 100 |
| 4 Wheeler | 50 | 20 | 300 |
| Heavy Vehicles | 100 | 50 | 500 |
| Free Entry | 0 | 0 | 0 |

### 7.2 Business rules

| Rule | Description |
|------|-------------|
| BR-PK-10 | One active rule per vehicle category |
| BR-PK-11 | Admin configures base price and category |
| BR-PK-12 | Price change is audited |
| BR-PK-13 | Amount locked on ticket at creation time |

---

## 8. Reports & analytics

### 8.1 Available reports

| Report | Content | Admin | Supervisor |
|--------|---------|:-----:|:----------:|
| **Revenue** | Collections by day/period | ✓ + PDF | View only |
| **Traffic** | Entry and exit volumes | ✓ + PDF | View only |
| **Category breakdown** | Mix of 2W / 4W / heavy | ✓ + PDF | View only |

### 8.2 Filters

- **Period:** Today · This week (7 days) · This month (30 days) · Custom date range
- **Vehicle filter:** All · 2 Wheeler · 4 Wheeler · Other

### 8.3 PDF export

- **Admin only** — Security Systems branded PDF of current report view

### 8.4 Dashboard KPIs (all roles, scoped)

| KPI | Description |
|-----|-------------|
| Vehicles inside | Active (non-exited) tickets |
| Today entries | Entry count since midnight |
| Today exits | Exit count since midnight |
| Revenue today | Sum of payments collected today |
| Occupied / total slots | Facility-wide from floor summary |
| 2W / 4W counts | Active tickets by category |

---

## 9. Monitoring & hardware

### 9.1 Hardware registry (admin)

Device types supported in seed/UI:

- QR Scanner (entry/exit)
- Boom Barrier
- Thermal Printer
- Network Controller

Each device has: name, type, **Online/Offline** status, location.

**Note:** Hardware is **monitored and configured** in software — automatic barrier control is not in scope (monitoring/configuration only).

### 9.2 Supervisor monitoring

| Feature | Description |
|---------|-------------|
| **Parking monitoring** | Live entry/exit stream |
| **QR monitoring** | QR scan events (admin + supervisor) |
| **Operator activity** | Staff action timeline |
| **Supervisor alerts** | Unresolved facility alerts on dashboard |

---

## 10. OCR (license plate)

| Feature | Detail |
|---------|--------|
| **Technology** | EasyOCR (backend) |
| **Use case** | Operator uploads plate photo on **New ticket** screen → auto-fills vehicle number |
| **Formats** | JPEG, PNG, WebP (max 10 MB) |
| **Permission** | Requires `tickets.create` |
| **First run** | May download OCR models (few minutes on first startup) |

---

## 11. Administration & audit

### 11.1 Employee management (admin)

- Create users with name, email, password, role
- Disable/reactivate staff
- External employee codes (e.g. U001, P001)

### 11.2 Audit trail

Logged actions include (non-exhaustive):

- Ticket create / payment / exit
- Pricing changes
- User changes
- Settings updates

Visible on **Audit logs** screen (admin).

---

## 12. Shipgen integration

### 12.1 How it works

| Feature | Description |
|---------|-------------|
| **Embedded UI** | PMS React app loaded inside Shipgen at `/parking/*` |
| **Shared chrome** | Shipgen header + sidebar; Parking engine switcher |
| **Platform SSO** | Shipgen admin session → `POST /api/pms/auth/platform-login` → PMS JWT with **admin** role |
| **Parking-only login** | Facility staff can use dedicated parking credentials without FleetOps/Yard access |
| **Role routing** | Sidebar shows admin/supervisor/operator items based on PMS JWT role |

### 12.2 Business rules (Shipgen)

| ID | Rule |
|----|------|
| BR-PK-30 | Parking embedded in Shipgen console |
| BR-PK-31 | Shipgen platform admin SSO → parking admin role |
| BR-PK-32 | Parking-only login for facility staff |
| BR-PK-33 | Standalone parking app remains for dedicated deployments |

### 12.3 Environment (Shipgen frontend)

```env
VITE_PARKING_BASE_PATH=/parking
VITE_PMS_API_BASE_URL=/api/pms
```

Gateway proxies `/api/pms/*` → `pms-service`.

---

## 13. Demo credentials

Created by `python -m app.seed.run` on backend startup.

### ParkFlow standalone

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@parkflow.com` | `admin123` |
| Supervisor | `supervisor@parkflow.com` | `supervisor123` |
| Operator | `operator@parkflow.com` | `operator123` |

Additional operators: `amit@parkflow.com`, `vikram@parkflow.com` (operator123)

### Shipgen-integrated demo

| Role | Email | Password |
|------|--------|----------|
| Parking Admin | `parking.admin@shipgen.demo` | `admin123` |
| Parking Supervisor | `parking.supervisor@shipgen.demo` | `supervisor123` |
| Parking Operator | `parking.operator@shipgen.demo` | `operator123` |

**Production:** Shipgen company admin (`admin@techliv.net` or equivalent) can open Parking engine after platform-login bridge (when deployed).

---

## 14. Technical stack & architecture

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Recharts, jsPDF |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2, Alembic |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT Bearer tokens |
| **Tests** | pytest (backend flows), Playwright (frontend E2E) |
| **Optional mobile** | Expo / React Native |

**Repository path:** `Parking management/`

```text
Parking management/
├── frontend/     Web UI (also embedded in Shipgen via @pms alias)
├── backend/      FastAPI API (/api/v1)
└── mobile-app/   Optional Expo client
```

---

## 15. API surface (summary)

Base path: `/api/v1` (public via gateway: `/api/pms/...`)

| Router | Purpose |
|--------|---------|
| `auth` | Login, refresh, platform-login (Shipgen SSO), me |
| `tickets` | CRUD, search, payment, exit, QR payload |
| `floors` | Floor list, capacity, facility summary |
| `pricing` | Pricing rules CRUD |
| `dashboard` | Role-specific dashboard payloads |
| `reports` | Revenue, traffic, category reports |
| `monitoring` | Entry/exit stream, alerts, QR events, operator activity |
| `hardware` | Device registry and status |
| `users` | Employee management |
| `audit` | Audit log queries |
| `ocr` | Plate detection from image upload |

Interactive docs when backend running: `/docs` (Swagger UI).

---

## 16. Out of scope / limitations

| Item | Status |
|------|--------|
| Automatic boom barrier / gate control | Not implemented — monitoring only |
| ANPR camera direct integration | OCR via uploaded image only |
| Multi-facility enterprise tenancy | Single facility per deployment (demo) |
| Ledger invoice sync | Planned cross-engine (not automatic today) |
| Shipgen mobile app parking module | Separate optional `mobile-app/`; not in Shipgen driver/yard mobile |

---

## Related documentation

- [`Parking management/README.md`](../Parking%20management/README.md) — setup & dev commands
- [`docs/SHIPGEN-BRD.md`](./SHIPGEN-BRD.md) — Section 11 Parking / PMS (business requirements)
- [`docs/SHIPGEN-SUPER-ADMIN-BRD.md`](./SHIPGEN-SUPER-ADMIN-BRD.md) — platform governance

---

*Document generated from Shipgen codebase — ParkFlow PMS (`Parking management/`).*
