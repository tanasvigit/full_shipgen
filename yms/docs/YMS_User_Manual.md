# User Manual — YARD.OS
# Smart Yard Management System

---

| Field | Value |
|-------|-------|
| **Product** | YARD.OS — Vehicle Orchestration Platform |
| **Version** | 1.0 |
| **Audience** | Gate Operators, Queue Operators, Dock Supervisors, Loading Supervisors, Control Tower Operators, Managers |
| **Date** | June 2026 |

---

## Table of Contents

1. [Welcome](#1-welcome)
2. [Login and Access](#2-login-and-access)
3. [Navigation Overview](#3-navigation-overview)
4. [Role Guide — Who Does What](#4-role-guide--who-does-what)
5. [Dashboard Overview (Control Tower)](#5-dashboard-overview-control-tower)
6. [Appointment Management](#6-appointment-management)
7. [Gate Entry Approval](#7-gate-entry-approval)
8. [Queue Operations](#8-queue-operations)
9. [Calling Vehicles](#9-calling-vehicles)
10. [Dock Assignment](#10-dock-assignment)
11. [Labor Assignment](#11-labor-assignment)
12. [Equipment Assignment](#12-equipment-assignment)
13. [Loading Operations](#13-loading-operations)
14. [Exception Management](#14-exception-management)
15. [Exit Verification](#15-exit-verification)
16. [Gate Out](#16-gate-out)
17. [Control Tower Monitoring](#17-control-tower-monitoring)
18. [Yard Map Usage](#18-yard-map-usage)
19. [Reports](#19-reports)
20. [Executive KPIs](#20-executive-kpis)
21. [Quick Reference Card](#21-quick-reference-card)

---

# 1. Welcome

YARD.OS helps your yard team move every vehicle from **appointment → gate entry → queue → dock → loading → exit** in a controlled, traceable way.

This manual explains **what to click** and **what should happen** for each daily task. Screenshot placeholders are included where training materials should add images.

> **Training tip:** New operators should complete Gate Entry and Queue Calling first, then Dock Assignment, then Loading and Exit.

---

# 2. Login and Access

## 2.1 Purpose

Open YARD.OS with the correct **role** so you can perform your job (gate, queue, dock, etc.) without permission errors.

## 2.2 Steps

1. Open your browser and go to: **`http://localhost:3001`** (or your facility URL).
2. YARD.OS loads the **Control Tower** home screen.
3. Click your **user avatar** (top-right corner).
4. Under **Access role (dev)**, select your role:
   - **Gate** — gate entry and exit
   - **Operations** — full yard operations
   - **Supervisor** — queue override, dock assign, detention
   - **Administrator** — all actions
   - **Read only** — view only (no buttons)
5. Confirm the role label under your name updates (e.g. "Gate", "Operations").

> **[Screenshot: Login / role selector in TopNav user menu]**  
> `![Figure 2-1: User menu with role selection](screenshots/02-login-role-selector.png)`

## 2.3 Expected Result

- Application loads without errors.
- Your role appears under your name in the top bar.
- Action buttons match your role (e.g. Gate operators see **Approve Entry**; read-only users do not).

## 2.4 Common Errors

| Problem | Likely Cause |
|---------|----------------|
| Blank page | Backend not running — ask IT to start Docker (`docker compose up`) |
| "Cannot reach backend" toast | API at port 8001 is down |
| Buttons missing | Wrong role (e.g. Read only) |

## 2.5 Troubleshooting

| Issue | What to Do |
|-------|------------|
| Permission denied (403) | Switch role via user menu; contact supervisor if production login is used |
| Page stuck loading | Press **Refresh** on the page or reload browser (F5) |
| Wrong facility shown | Check facility name in left sidebar — contact admin if incorrect |

---

# 3. Navigation Overview

## 3.1 Purpose

Find the screen you need quickly using the **top menu** (desktop) or **sidebar** (large screens).

## 3.2 Main Menu Sections

| Section | Screens | Typical Users |
|---------|---------|---------------|
| **Control** | Control Tower, Virtual Queue, Yard Map, Recommendations | Control Tower operators, supervisors |
| **Operations** | Appointments, Gate Management, Docks, Loading Ops | Gate, queue, dock, loading teams |
| **Resources** | Vehicles, Equipment, Labor | Supervisors, resource planners |
| **Reports** | Operations Dashboard, Delay Analysis, Detention, Executive KPIs, etc. | Managers, supervisors |

> **[Screenshot: Top navigation with Control / Operations / Resources / Reports menus]**  
> `![Figure 3-1: Top navigation bar](screenshots/03-top-navigation.png)`

## 3.3 Global Tools (Top Bar)

| Tool | Location | Use |
|------|----------|-----|
| **Search** | Top of each page | Filter current list by plate, booking ref, transporter |
| **Alert triangle** | Top-right | Critical alerts count — click to open Control Tower |
| **Bell** | Top-right | Warning alerts count |
| **Book Appointment** | Top-right (if permitted) | Quick book a new slot |
| **Live clock** | Top-right | Current time and shift |

## 3.4 Drawers (Side Panels)

Click any vehicle, dock, or appointment row to open a **drawer** on the right with full details and actions. Drawers refresh automatically when other users make changes.

---

# 4. Role Guide — Who Does What

| Task | Gate | Operations | Supervisor | Manager |
|------|:----:|:----------:|:----------:|:-------:|
| Book appointment | ✓ | ✓ | ✓ | View |
| Approve gate entry | ✓ | ✓ | — | View |
| Call vehicle from queue | — | ✓ | ✓ | View |
| Override queue priority | — | — | ✓ | View |
| Assign dock | — | ✓ | ✓ | View |
| Assign labor / equipment | — | ✓ | — | View |
| Start / complete loading | — | ✓ | ✓ | View |
| Raise / resolve exceptions | — | ✓ | ✓ | View |
| Exit verification / gate out | ✓ | ✓ | ✓ | View |
| Approve detention | — | — | ✓ | View |
| View reports & KPIs | ✓ | ✓ | ✓ | ✓ |

---

# 5. Dashboard Overview (Control Tower)

**Screen:** Control Tower (`/` — home)  
**Audience:** Control Tower operators, managers, supervisors

---

## 5.1 Purpose

See the **whole yard at a glance**: how many vehicles are waiting, loading, in exit holding, dock utilization, and active alerts.

## 5.2 Steps

1. Open **Control** → **Control Tower** (or click the YARD.OS logo).
2. Review the **KPI cards** at the top:
   - In Yard, Waiting, Loading, Exit Holding
   - Dock utilization, Yard occupancy
   - Average turnaround, Detention exposure
3. Check the **Active Alerts** panel (critical items listed first).
4. Review **Queue Snapshot**, **Dock Summary**, and **Zone Occupancy** sections.
5. Click any alert or row to open the related vehicle/dock drawer.
6. Optional: use **Export** to download a daily PDF summary.

> **[Screenshot: Control Tower KPI cards and alert panel]**  
> `![Figure 5-1: Control Tower dashboard](screenshots/05-control-tower.png)`

## 5.3 Expected Result

- Numbers refresh every **30 seconds** automatically.
- Alert counts match the triangle/bell icons in the top bar.
- Clicking an alert opens the correct vehicle or dock.

## 5.4 Common Errors

| Problem | Cause |
|---------|-------|
| All KPIs show zero | No vehicles in system, or API connection failed |
| Alerts empty but queue is long | Threshold not yet reached (e.g. wait &lt; 60 min) |

## 5.5 Troubleshooting

| Issue | Action |
|-------|--------|
| Stale numbers | Wait 30s or perform any action elsewhere (triggers refresh) |
| Red error banner | Check backend is running; click refresh on page |

---

# 6. Appointment Management

**Screen:** Appointments (`/appointments`)  
**Audience:** Scheduling staff, gate coordinators, supervisors

---

## 6.1 Purpose

Book and manage vehicle visit slots **before** the truck arrives at the gate.

## 6.2 Steps — View Appointments

1. Go to **Operations** → **Appointments**.
2. Use the **date arrows** to move between days.
3. Switch **List** or **Calendar** view.
4. Use filters: status, operation type, gate.
5. Review KPI cards: Scheduled, Loading, Completed for the selected date.

> **[Screenshot: Appointments calendar view]**  
> `![Figure 6-1: Appointments screen](screenshots/06-appointments.png)`

## 6.3 Steps — Book a New Appointment

1. Click **Book Appointment** (top bar or Appointments page).
2. Fill in the booking form:
   - **Vehicle number** (plate) — create new vehicle if needed
   - **Customer name** and **shipment reference**
   - **Booking date** and **reporting time**
   - **Scheduled slot** (e.g. `08:00-09:00`)
   - **Gate** (G1–G4)
   - **Priority**: Normal / High / Urgent
   - **Operation type**: Loading, Unloading, etc.
3. Click **Confirm Booking**.

## 6.4 Expected Result

- New row appears in the appointments list with status **Scheduled**.
- Booking reference is generated (e.g. `APT-2026-001`).
- Vehicle status is **Scheduled**.

## 6.5 Common Errors

| Error Message | Meaning |
|---------------|---------|
| Booking reference already exists | Duplicate reference — use a unique ID |
| Vehicle not found | Create vehicle first or check plate spelling |
| Permission denied | Your role cannot book — switch to Operations |

## 6.6 Troubleshooting

| Issue | Action |
|-------|--------|
| Slot looks full (5+ bookings) | Book next slot or escalate to supervisor |
| Cannot cancel vehicle in loading | Use workflow — only Scheduled/Cancelled via direct edit |

---

# 7. Gate Entry Approval

**Screen:** Gate Management (`/gate`) — **Entry** mode  
**Audience:** Gate operators

---

## 7.1 Purpose

Verify that an arriving truck has a valid appointment **today**, then admit it to the yard and place it in the **virtual queue**.

## 7.2 Steps

1. Go to **Operations** → **Gate Management**.
2. Confirm **Entry** tab is selected (not Exit).
3. In the **Vehicle Lookup** box, enter:
   - Vehicle plate (e.g. `MH12AB1234`), or
   - Booking reference (e.g. `APT-2026-001`)
4. Click **Search** (or press Enter).
5. Review the **Entry Checks** panel — all six checks must show green:
   - Appointment exists
   - Appointment active
   - Correct date (today)
   - Vehicle match
   - Not already checked in
   - Gate open
6. If all checks pass, click **Approve Entry**.
7. Confirm success toast: vehicle checked in.

> **[Screenshot: Gate entry lookup with six green checks]**  
> `![Figure 7-1: Gate entry approval](screenshots/07-gate-entry.png)`

### Optional: Scan at Gate

If QR/ANPR hardware is connected, click **Scan** instead of typing. Otherwise manual entry works the same way.

## 7.3 Expected Result

- Vehicle status changes to **Waiting**.
- Vehicle appears in **Virtual Queue** with a queue number.
- Gate KPI **Waiting** count increases by one.
- Vehicle is auto-placed in the **Waiting Area** on the Yard Map.

## 7.4 Common Errors

| Error | Meaning | Fix |
|-------|---------|-----|
| No vehicle found | Plate/ref not in system | Book appointment or check spelling |
| Entry blocked: appointment_exists | No appointment linked | Create appointment first |
| Entry blocked: correct_date | Appointment is not today | Reschedule or wait for correct date |
| Entry blocked: not_checked_in | Already checked in | Do not re-admit — check queue |
| Vehicle already checked in | Duplicate entry attempt | Look up vehicle in queue |

## 7.5 Troubleshooting

| Issue | Action |
|-------|--------|
| Approve button disabled | One or more entry checks failed — read red items |
| Wrong gate (G2 vs G1) | Appointment gate_number must match; supervisor may rebook |
| Driver has no appointment | Send to scheduling — do not force entry without appointment |

---

# 8. Queue Operations

**Screen:** Virtual Queue (`/queue`)  
**Audience:** Queue operators, control tower staff

---

## 8.1 Purpose

Monitor all checked-in vehicles waiting for a dock, see **wait time**, **detention risk**, and **priority rank**.

## 8.2 Steps

1. Go to **Control** → **Virtual Queue**.
2. Review summary KPIs:
   - **In Queue** — total waiting
   - **Avg Wait** — average minutes
   - **Detention Cost** — estimated exposure
   - **Ready to Call** — vehicles eligible for call-in
3. Scan the table (sorted by priority score, highest first):
   - Rank, Plate, Transporter, Wait time, Risk badge, Priority score
4. Click a row to open the **Vehicle Drawer** for full journey details.
5. Use **Export** if you need a CSV for shift handover.

> **[Screenshot: Virtual Queue table with priority ranks]**  
> `![Figure 8-1: Virtual Queue](screenshots/08-virtual-queue.png)`

## 8.3 Expected Result

- List updates every 30 seconds.
- Highest priority vehicles appear at the top.
- Detention risk shows LOW → CRITICAL based on wait time.

## 8.4 Common Errors

| Problem | Cause |
|---------|-------|
| Empty queue | No vehicles checked in today |
| Vehicle missing after gate entry | Refresh page; check gate entry succeeded |

## 8.5 Troubleshooting

| Issue | Action |
|-------|--------|
| Wait time seems wrong | Based on check-in time — verify gate entry timestamp |
| Priority seems unfair | Supervisor can override rank (see Section 9) |

---

# 9. Calling Vehicles

**Screen:** Virtual Queue (`/queue`)  
**Audience:** Queue operators, supervisors

---

## 9.1 Purpose

**Call in** the next vehicle so it is ready for dock assignment. Changes status from **Waiting** to **Called** (displayed as "Staging").

## 9.2 Steps

1. Open **Virtual Queue**.
2. Find a vehicle with status **Waiting** (or eligible per rank).
3. Click **Call In** on that row.
4. Wait for success confirmation.
5. Vehicle moves to **Called** status and appears in **Docks → Awaiting Assignment**.

> **[Screenshot: Call In button on queue row]**  
> `![Figure 9-1: Call In action](screenshots/09-call-in.png)`

### Supervisor Override (Optional)

1. Click **Override** on a queue row.
2. Enter **target rank** (position in queue).
3. Enter **reason** (minimum 3 characters).
4. Enter **supervisor name**.
5. Confirm override.

## 9.3 Expected Result

- Vehicle status: **Called**.
- Row shows in Docks page under **Vehicles Awaiting Dock Assignment**.
- Recommended dock may appear on queue detail.

## 9.4 Common Errors

| Error | Meaning |
|-------|---------|
| Queue entry is not in callable state | Vehicle not Waiting — may already be Called or assigned |
| Permission denied | Role lacks call permission — use Supervisor or Operations |

## 9.5 Troubleshooting

| Issue | Action |
|-------|--------|
| Call In button greyed out | Vehicle not in Waiting status |
| Called vehicle not on Docks page | Refresh Docks page (F5) |

---

# 10. Dock Assignment

**Screen:** Docks (`/docks`)  
**Audience:** Dock supervisors, operations

---

## 10.1 Purpose

Assign a **called** vehicle to an available loading/unloading bay.

## 10.2 Steps

1. Go to **Operations** → **Docks**.
2. Review the **Vehicles Awaiting Dock Assignment** section (Called vehicles).
3. Click **Assign Dock** on the vehicle row.
4. In the dialog, select an **AVAILABLE** dock (green).
5. Confirm assignment.
6. Alternatively: click a dock card → open **Dock Drawer** → assign from there.

> **[Screenshot: Dock assignment dialog]**  
> `![Figure 10-1: Assign dock dialog](screenshots/10-dock-assign.png)`

7. After assignment, assign **labor** and **equipment** (see Sections 11–12) before starting loading.

## 10.3 Expected Result

- Dock status: **Occupied**.
- Vehicle status: **Dock Assigned** → may show **Resource Pending** until labor is assigned.
- When labor is ready: **Ready for Loading**.

## 10.4 Common Errors

| Error | Meaning |
|-------|---------|
| Dock is not available | Bay occupied, maintenance, or blocked |
| Queue entry not callable | Vehicle must be Called first |

## 10.5 Troubleshooting

| Issue | Action |
|-------|--------|
| No available docks | Wait for loading to complete; check MAINTENANCE docks |
| Wrong dock type | Match dock supported cargo/vehicle types |
| Resource Pending stuck | Assign labor team to vehicle (Section 11) |

---

# 11. Labor Assignment

**Screen:** Labor (`/labor`) or Dock Drawer  
**Audience:** Dock supervisors, operations

---

## 11.1 Purpose

Assign a **labor team** to the vehicle at dock. Labor is **required** before loading can start.

## 11.2 Steps — From Labor Screen

1. Go to **Resources** → **Labor**.
2. Find a team with status **On Duty** or **Available**.
3. Click the team row to open **Labor Drawer**.
4. Click **Assign**.
5. Select **dock** and/or **vehicle**.
6. Confirm assignment.

## 11.3 Steps — From Dock Drawer

1. Open an **Occupied** dock.
2. In **Current Assignment**, use **Assign Labor** dropdown.
3. Select team and confirm.

> **[Screenshot: Labor assignment in dock drawer]**  
> `![Figure 11-1: Labor assignment](screenshots/11-labor-assign.png)`

## 11.4 Expected Result

- Team status: **Assigned**.
- Vehicle readiness updates: **Resource Pending** → **Ready for Loading** (when all requirements met).
- Green indicators on Resource Readiness panel.

## 11.5 Common Errors

| Error | Meaning |
|-------|---------|
| Team unavailable | Off duty, on break, or already assigned elsewhere |
| Cannot delete assigned team | Release assignment first |

## 11.6 Troubleshooting

| Issue | Action |
|-------|--------|
| Ready for Loading not appearing | Ensure dock assigned AND labor assigned |
| Wrong material specialization | Match team material_type to cargo |

---

# 12. Equipment Assignment

**Screen:** Equipment (`/equipment`) or Dock Drawer  
**Audience:** Dock supervisors, operations

---

## 12.1 Purpose

Assign forklifts, cranes, or other equipment to support loading. Equipment is **recommended** but not always required to start loading.

## 12.2 Steps

1. Go to **Resources** → **Equipment**.
2. Find equipment with status **Idle** and battery **≥ 20%**.
3. Open **Equipment Drawer** → **Assign**.
4. Link to dock and/or vehicle.
5. Optional: set **In Use** when operation begins.

> **[Screenshot: Equipment list with battery levels]**  
> `![Figure 12-1: Equipment screen](screenshots/12-equipment.png)`

## 12.3 Expected Result

- Equipment status: **Assigned** or **In Use**.
- Equipment appears on dock drawer and loading ops screen.

## 12.4 Common Errors

| Error | Meaning |
|-------|---------|
| Battery too low for assignment | Charge equipment first (≥ 20%) |
| Equipment in maintenance | Select different unit |

## 12.5 Troubleshooting

| Issue | Action |
|-------|--------|
| Loading blocked despite equipment | Check **labor** — labor is mandatory, equipment is not |
| Equipment not releasing after load | Completing loading auto-releases resources |

---

# 13. Loading Operations

**Screen:** Loading Ops (`/loading`)  
**Audience:** Loading supervisors, dock operators

---

## 13.1 Purpose

Monitor active loading/unloading, track progress against dock time estimate, and start or complete loading.

## 13.2 Steps — Start Loading

1. Confirm vehicle is **Ready for Loading** (dock drawer shows green readiness).
2. Open **Dock Drawer** or **Vehicle Drawer**.
3. Click **Start Loading**.
4. Vehicle status becomes **Loading**.

## 13.3 Steps — Monitor Progress

1. Go to **Operations** → **Loading Ops**.
2. Review KPI cards: Active operations, Open exceptions, Paused count.
3. Each row shows:
   - Progress bar (green / amber / red = on time / at risk / delayed)
   - ETA, remaining time, dock, labor, equipment
4. Click a row to open **Loading Operation Drawer**.

> **[Screenshot: Loading Ops with progress bars]**  
> `![Figure 13-1: Loading Operations](screenshots/13-loading-ops.png)`

## 13.4 Steps — Complete Loading

1. When physical loading is finished, open the vehicle/dock drawer.
2. Click **Complete Loading**.
3. Vehicle automatically moves to **Exit Holding**.

## 13.5 Expected Result

- Loading: progress bar advances; health shows ON_TIME / AT_RISK / DELAYED.
- Complete: vehicle → **Exit Holding**; dock released; labor/equipment released.

## 13.6 Common Errors

| Error | Meaning |
|-------|---------|
| RESOURCE_GATING_FAILED | Labor or dock not ready — assign resources first |
| Cannot complete loading from status X | Vehicle must be in Loading status |

## 13.7 Troubleshooting

| Issue | Action |
|-------|--------|
| Cannot start loading | Open Resource Readiness — assign missing labor |
| Progress bar red | Loading exceeded dock estimated time — consider exception |
| Pause needed | Use Pause in loading drawer (Section 14) |

---

# 14. Exception Management

**Screen:** Loading Ops (`/loading`) — Exceptions section and drawer  
**Audience:** Loading supervisors

---

## 14.1 Purpose

Record and resolve problems during loading (material shortage, equipment failure, safety hold, etc.).

## 14.2 Steps — Raise Exception

1. Open **Loading Operation Drawer** for the vehicle.
2. Click **Raise Exception**.
3. Select type:
   - Material Shortage, Equipment Failure, Labor Delay, Documentation Hold
   - Safety Hold, Quality Hold, Weather Delay, Generic Delay
4. Enter description.
5. Submit.

## 14.3 Steps — Resolve Exception

1. In Loading Ops, find the exception in the **Active Exceptions** table.
2. Click **Assign** → enter supervisor/owner name.
3. When fixed, click **Resolve** → add resolution notes.
4. Click **Close** to archive.

### Pause / Resume Loading

1. In drawer, click **Pause Loading** → select reason.
2. When issue cleared, click **Resume Loading**.

> **[Screenshot: Exception table and pause controls]**  
> `![Figure 14-1: Exception management](screenshots/14-exceptions.png)`

## 14.4 Expected Result

- Exception status: Open → In Progress → Resolved → Closed.
- Pause: vehicle stays Loading but progress shows PAUSED.
- Control Tower may show **LOADING_EXCEPTION** or **LOADING_DELAY** alert.

## 14.5 Common Errors

| Error | Meaning |
|-------|---------|
| Vehicle not in LOADING | Cannot pause — vehicle not actively loading |
| Invalid exception type | Select from dropdown list only |

## 14.6 Troubleshooting

| Issue | Action |
|-------|--------|
| Alert still showing after resolve | Close exception; wait for alert refresh (30s) |
| Safety Hold | Treat as CRITICAL — escalate immediately |

---

# 15. Exit Verification

**Screen:** Gate Management — **Exit** mode, or Exit Verification Drawer  
**Audience:** Gate operators

---

## 15.1 Purpose

After loading completes, verify all **exit documents and clearances** before the truck leaves the yard.

## 15.2 Steps

1. Go to **Gate Management**.
2. Switch to **Exit** mode (tab at top).
3. Review **Exit Holding** list — vehicles waiting for clearance.
4. Click a vehicle row → **Exit Verification Drawer** opens.
5. Complete all **seven checklist items** (toggle each to green):
   - Loading Completed
   - Appointment Completed
   - Vehicle Verified
   - Delivery Document Verified
   - Invoice Verified
   - Gate Pass Verified
   - Security Clearance Verified
6. Add optional remarks.
7. Click **Verify Exit**.

> **[Screenshot: Exit verification checklist — all seven items]**  
> `![Figure 15-1: Exit verification drawer](screenshots/15-exit-verification.png)`

## 15.3 Expected Result

- Vehicle status: **Exit Verified**.
- **Gate Out** button becomes available.
- Vehicle appears ready for physical departure.

## 15.4 Common Errors

| Error | Meaning |
|-------|---------|
| Exit checklist incomplete | Not all 7 items checked |
| Cannot verify exit from status X | Vehicle must be in Exit Holding |
| Vehicle not in exit holding | Loading may not be completed |

## 15.5 Troubleshooting

| Issue | Action |
|-------|--------|
| Vehicle not in exit list | Confirm loading was completed in Loading Ops |
| Checklist resets | Do not refresh mid-process; toggle items again |
| Long exit holding time | Control Tower alerts after 30 minutes |

---

# 16. Gate Out

**Screen:** Exit Verification Drawer or Gate Exit mode  
**Audience:** Gate operators

---

## 16.1 Purpose

Final step — release the vehicle from the facility and record exit time.

## 16.2 Steps

1. Open vehicle in **Exit Verification Drawer** (status must be **Exit Verified**).
2. Click **Gate Out**.
3. Confirm success toast: "Gate out approved — vehicle exited".
4. Physical gate opens (if integrated) or operator directs driver to exit lane.

> **[Screenshot: Gate Out button on verified vehicle]**  
> `![Figure 16-1: Gate out confirmation](screenshots/16-gate-out.png)`

## 16.3 Expected Result

- Vehicle status: **Exited**.
- Exit time recorded.
- Vehicle removed from yard counts.
- Dock/labor/equipment already released at loading complete.

## 16.4 Common Errors

| Error | Meaning |
|-------|---------|
| Gate out requires EXIT_VERIFIED | Complete exit verification first |
| Vehicle already exited | Do not process again |

## 16.5 Troubleshooting

| Issue | Action |
|-------|--------|
| Gate Out button disabled | Verify exit not completed — finish checklist |
| Exited Today count wrong | Counts reset at midnight; refresh gate dashboard |

---

# 17. Control Tower Monitoring

**Screen:** Control Tower + Recommendations (`/ai`)  
**Audience:** Control tower operators, managers

---

## 17.1 Purpose

Watch live alerts and act on operational recommendations before delays become detention charges.

## 17.2 Steps — Monitor Alerts

1. Watch the **alert triangle** (critical) and **bell** (warning) in the top bar.
2. Open **Control Tower** for full alert list.
3. Alerts are sorted: **Critical first**, then by duration.
4. Click an alert to jump to the vehicle or dock.

| Alert Type | What It Means | Typical Action |
|------------|---------------|----------------|
| Vehicle Waiting Too Long | In queue &gt; 60 min | Call vehicle or assign dock |
| Queue Congestion | 10+ waiting | Open extra dock capacity |
| Loading Delay | Loading over estimate | Check exceptions |
| Labor/Equipment Unavailable | Resources missing at dock | Assign team/equipment |
| Exit Holding Delay | Exit wait &gt; 30 min | Complete verification |
| Hazmat SLA Breach | Hazmat waiting &gt; 30 min | Priority escalation |

## 17.3 Steps — Recommendations

1. Go to **Control** → **Recommendations**.
2. Review cards mapped from live alerts.
3. Follow suggested actions (e.g. "Assign labor to Bay 3").

> **[Screenshot: Control Tower alerts and Recommendations page]**  
> `![Figure 17-1: Alerts and recommendations](screenshots/17-control-tower-alerts.png)`

## 17.4 Expected Result

- Alerts refresh every 30 seconds.
- Acting on an alert resolves the underlying condition; alert disappears on next refresh.

## 17.5 Common Errors

| Problem | Cause |
|---------|-------|
| No alerts but yard feels busy | Thresholds not met yet |
| Same alert repeats | Root cause not fixed |

## 17.6 Troubleshooting

| Issue | Action |
|-------|--------|
| Alert count mismatch | Refresh page; counts are live-derived |
| Cannot dismiss alert | Alerts auto-clear when condition resolves — no manual dismiss |

---

# 18. Yard Map Usage

**Screen:** Yard Map (`/yard`)  
**Audience:** Control tower, supervisors

---

## 18.1 Purpose

See **where vehicles are** in the yard by zone and manage zone capacity.

## 18.2 Steps

1. Go to **Control** → **Yard Map**.
2. Review zone grid — each zone shows occupancy vs capacity.
3. Color indicates status: Active, Full, Blocked, Maintenance.
4. Click a zone to see vehicles currently in that zone.
5. To **move a vehicle manually**:
   - Open vehicle drawer or use move action
   - Select target zone
   - Enter reason (required for audit)

> **[Screenshot: Yard Map zone grid with occupancy]**  
> `![Figure 18-1: Yard Map](screenshots/18-yard-map.png)`

## 18.3 Expected Result

- Vehicles auto-place by status (e.g. Waiting → Waiting Area, Loading → Loading zone).
- Manual moves create audit history.

## 18.4 Common Errors

| Error | Meaning |
|-------|---------|
| Zone is full | At capacity — choose another zone |
| Zone rule violation | Vehicle cargo/status not allowed in zone (e.g. hazmat) |

## 18.5 Troubleshooting

| Issue | Action |
|-------|--------|
| Vehicle in wrong zone | Status may have changed — use manual move or wait for auto-sync |
| Zone shows FULL | Wait for vehicles to exit or reassign |

---

# 19. Reports

**Screens:** Reports section in sidebar / Operations Dashboard  
**Audience:** Managers, supervisors

---

## 19.1 Purpose

Review historical performance: delays, dock utilization, labor productivity, SLA compliance, and individual vehicle journeys.

## 19.2 Available Reports

| Report | Path | Use |
|--------|------|-----|
| Operations Dashboard | `/operations-dashboard` | Shift KPIs — waiting, loading, TAT (Reports top menu) |
| Delay Analysis | `/reports/delay-analysis` | Where delays happen |
| Dock Utilization | `/reports/dock-utilization` | Bay usage and idle time |
| Labor Productivity | `/reports/labor-productivity` | Team output |
| Equipment Utilization | `/reports/equipment-utilization` | Asset usage |
| SLA Compliance | `/reports/sla-compliance` | SLA % by category |
| Vehicle Journey | `/reports/vehicle-journey` | Full timeline for one visit |

## 19.3 Steps — Run a Report

1. Open the report from **Finance & Reports** in the sidebar (or **Reports** top menu).
2. Set **date range** (from / to) if filters are shown.
3. Review table and charts.
4. Click **Export** → choose CSV or Excel for management meetings.

> **[Screenshot: Delay Analysis report with date filters]**  
> `![Figure 19-1: Sample report screen](screenshots/19-reports.png)`

## 19.4 Expected Result

- Data reflects live database for selected date range.
- Export downloads a file to your computer.

## 19.5 Common Errors

| Problem | Cause |
|---------|-------|
| Empty report | No activity in date range |
| Vehicle journey not found | Check plate spelling or appointment ref |

## 19.6 Troubleshooting

| Issue | Action |
|-------|--------|
| Numbers differ from Control Tower | Reports use date filters; Control Tower is live snapshot |
| Slow load | Large date range — narrow to one week |

---

# 20. Executive KPIs

**Screen:** Executive KPIs (`/kpis`)  
**Audience:** Managers, senior supervisors

---

## 20.1 Purpose

Management **scorecard** with targets, trends, and week-over-week comparison for key yard metrics.

## 20.2 Steps

1. Go to **Finance & Reports** → **Executive KPIs** (or Reports menu).
2. Review the **scorecard** table:
   - Metric, Current value, Target, Trend arrow, Status (green/amber/red)
3. Review headline metrics and **7-day trend charts** (turnaround, yard occupancy).
4. Use **Export** for management packs.
5. Read **Assumptions** footnotes for how each metric is calculated.

> **[Screenshot: Executive KPI scorecard]**  
> `![Figure 20-1: Executive KPIs](screenshots/20-executive-kpis.png)`

### Key Metrics

| Metric | Target (example) | Good Direction |
|--------|------------------|----------------|
| Avg Waiting Time | ≤ 30 min | Lower |
| Avg Turnaround | ≤ 90 min | Lower |
| Dock Utilization | ≥ 85% | Higher |
| Yard Occupancy | ≤ 75% | Lower |
| Detention Today | ≤ ₹1,00,000 | Lower |
| Shipment Completion | ≥ 95% | Higher |

## 20.3 Expected Result

- Scorecard refreshes every 30 seconds.
- Green = on target; amber = warning; red = action needed.

## 20.4 Common Errors

| Problem | Cause |
|---------|-------|
| Partial data / fetch errors listed | One API failed — scorecard still shows available data |
| CSAT seems estimated | Customer satisfaction is a proxy formula, not survey data |

## 20.5 Troubleshooting

| Issue | Action |
|-------|--------|
| All metrics zero | Backend down — check with IT |
| Detention mismatch vs Detention screen | KPI uses summary.today from detention bundle |

---

# 21. Quick Reference Card

## Daily Vehicle Flow

```
Appointment (Scheduled)
    ↓
Gate Entry (Waiting) — Approve Entry
    ↓
Virtual Queue — Call In (Called)
    ↓
Docks — Assign Dock (Dock Assigned)
    ↓
Labor + Equipment — Assign (Ready for Loading)
    ↓
Start Loading → Complete Loading (Exit Holding)
    ↓
Exit Verification (Exit Verified)
    ↓
Gate Out (Exited) ✓
```

## Status Quick Guide

| Status | Where to Act |
|--------|--------------|
| Scheduled | Appointments |
| Waiting | Virtual Queue |
| Called | Docks — Awaiting Assignment |
| Dock Assigned / Resource Pending | Docks + Labor |
| Ready for Loading | Dock Drawer — Start Loading |
| Loading | Loading Ops |
| Exit Holding | Gate — Exit mode |
| Exit Verified | Gate Out |
| Exited | Complete — in reports only |

## Who to Call

| Situation | Contact |
|-----------|---------|
| System down | IT / Yard systems |
| Permission issue | Supervisor |
| Detention dispute | Supervisor + Finance |
| Safety hold | Yard safety officer immediately |
| Hazmat alert | Hazmat supervisor immediately |

## Keyboard & Tips

- **F5** — Refresh browser page
- **Search box** — Filters current page list only
- Data auto-refreshes every **30 seconds** on operational screens
- After any action, other open screens update within 30s (or immediately on same page)

---

# Appendix A — Screenshot Checklist for Trainers

Use this checklist when capturing training images:

| # | Filename | Screen |
|---|----------|--------|
| 1 | `02-login-role-selector.png` | User menu / role |
| 2 | `03-top-navigation.png` | Top nav menus |
| 3 | `05-control-tower.png` | Control Tower home |
| 4 | `06-appointments.png` | Appointments booking |
| 5 | `07-gate-entry.png` | Gate entry checks |
| 6 | `08-virtual-queue.png` | Queue table |
| 7 | `09-call-in.png` | Call In button |
| 8 | `10-dock-assign.png` | Assign dock dialog |
| 9 | `11-labor-assign.png` | Labor in dock drawer |
| 10 | `12-equipment.png` | Equipment list |
| 11 | `13-loading-ops.png` | Loading progress |
| 12 | `14-exceptions.png` | Exception table |
| 13 | `15-exit-verification.png` | Exit checklist |
| 14 | `16-gate-out.png` | Gate out button |
| 15 | `17-control-tower-alerts.png` | Alerts panel |
| 16 | `18-yard-map.png` | Yard zones |
| 17 | `19-reports.png` | Sample report |
| 18 | `20-executive-kpis.png` | KPI scorecard |

Store images in: `docs/screenshots/`

---

# Appendix B — Glossary

| Term | Meaning |
|------|---------|
| **Appointment** | Scheduled vehicle visit with slot and gate |
| **Booking reference** | Unique ID (e.g. APT-2026-001) |
| **Called** | Vehicle called from queue for dock staging |
| **Detention** | Charge for excessive wait time |
| **Dock / Bay** | Physical loading/unloading position |
| **Exit Holding** | Post-loading wait for document clearance |
| **Priority score** | Queue ranking (priority + lateness) |
| **Readiness** | Dock + labor assigned → ready to load |
| **TAT** | Turnaround time — check-in to exit |
| **Virtual Queue** | Priority waiting list after gate entry |

---

*End of User Manual — YARD.OS v1.0*
