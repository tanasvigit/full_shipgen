# Control Tower — Live Dashboard Notes

Route: `/` → `pages/Dashboard.jsx`  
Data layer: `services/controlTowerApi.js`

**Status:** **Live** — all widgets load from YMS REST APIs. Several headline metrics remain **estimated or proxy** (documented below). This is not a mock dashboard.

---

## Data sources

`fetchControlTowerDashboard()` runs these in parallel via `ymsApi` (single refresh bundle):

| Endpoint | Entity |
|----------|--------|
| `GET /vehicles` | `vehicles` |
| `GET /appointments` | `appointments` |
| `GET /queue-entries` | `queue_entries` |
| `GET /docks` | `docks` |
| `GET /yard-events` | `yard_events` |

There is **no** `GET /control-tower` aggregation endpoint. All metrics are computed in the browser.

**Not used on this page:** `GET /detention` (detention widget uses **estimated exposure**, not billed records). Equipment and labor lists are not inputs to Control Tower KPIs.

---

## Refresh and sync

| Mechanism | Behavior |
|-----------|----------|
| Initial load | Full load with skeleton |
| Live toggle | When on, **30s** `setInterval` silent reload |
| `yms-data-changed` | Silent reload after gate, queue, appointments, docks, loading, detention, etc. |
| Manual | TopBar / page refresh controls |
| Pause | User can turn off 30s polling (`isLive`) |

---

## KPI logic (headline metrics)

| KPI | Source | Live vs estimated |
|-----|--------|-------------------|
| In Yard | Count vehicles in active yard statuses (not EXITED/CANCELLED) | **Live** |
| Waiting | Queue `status = WAITING` | **Live** |
| Loading | Vehicles `status = LOADING` | **Live** |
| Exited today | Vehicles EXITED with `updated_at` today (UTC) | **Live** |
| Yard occupancy | `inYard / YARD_CAPACITY` | **Live count**, **fixed capacity 72** |
| Dock utilization | OCCUPIED docks / total | **Live** |
| Avg wait | Mean minutes from `queue_entries.checkin_time` for waiting/active | **Live** |
| Avg TAT | Gate-in yard_event → exit for vehicles exited today | **Live** where events exist; `tatPartial` if exits lack gate-in |
| Detention (exposure) | Waiting/loading minutes × risk factor by ownership | **Estimated** — not `detention_records` |
| Fuel wasted | `waiting count × 6` litres | **Placeholder** (`FUEL_LITRES_PER_WAITING_VEHICLE`) |
| Shipments | COMPLETED+EXITED appointments / non-cancelled | **Live** (all appointments in bundle, not today-scoped) |
| Customer Sat | `94 + (completion% − 90) × 0.4`, clamped 60–100 | **Proxy** — no CSAT API |

Constants: `YARD_CAPACITY`, `FUEL_LITRES_PER_WAITING_VEHICLE`, `CUSTOMER_SAT_FALLBACK`, `SHIPMENT_TARGET_PCT` in `controlTowerApi.js`.  
Export object: `ASSUMPTIONS`.

---

## Charts and widgets

| Widget | Logic |
|--------|--------|
| **Throughput 24h** | Hourly buckets from `yard_events` (gate-in types vs exit-related status changes) |
| **Vehicle mix** | In-yard vehicles by `ownership_type` (pie) |
| **Priority queue** | Active queue entries by `priority_score`; opens vehicle drawer |
| **Live events** | Latest yard events with labels from `formatEventMessage` |
| **Yard zones** | **Derived** — no zone table; mapping from `gate_number`, dock type, queue type, shipment keywords (`deriveZoneOccupancy`) |
| **Detention by category** | **Estimated** exposure by Company / Contract / Outside |
| **Dock status** | Live dock list; click may toast (no dock drawer from tower) |
| **Recommendations** | `buildRuleBasedRecommendations(metrics)` — labeled rule-based, not ML |

---

## Search (TopBar)

`filterDashboardBySearch()` filters priority queue, live events, and dock list client-side. **KPI cards stay global** (not filtered by search query).

Global jump-to uses **`GET /api/search`** (separate from dashboard filter).

---

## Daily Operations Report

`utils/dailyReport.js` → `exportDailyOperationsReport()`:

- KPI cover tiles and scorecard: **`executiveKpisApi`** (live).
- Detention, docks, recommendations: live fetches with per-section fallbacks.
- Company name/branding: still **`COMPANY`** from `data/db.js` only.

---

## Difference vs Executive KPIs (`/kpis`)

| Topic | Control Tower | Executive KPIs |
|-------|---------------|----------------|
| Detention metric | Estimated **exposure** ₹ | **Billed** `summary.today` from `/detention` |
| Shipment completion | All non-cancelled appointments | **Today UTC** scoped appointments |
| 7-day trends | 24h throughput chart | 7-day TAT / occupancy trends |
| Targets | Implicit in recommendations | Explicit `TARGETS` + performance bars |

---

## Assumptions (explicit)

From `ASSUMPTIONS` in `controlTowerApi.js`:

1. Yard capacity fixed at **72** — no capacity API.
2. Fuel = waiting vehicles × **6 L/hr** — no telematics.
3. CSAT derived from shipment completion vs **90%** baseline.
4. TAT depends on yard_events for gate-in and exit notes.
5. Zones inferred from gate/dock/shipment — not stored coordinates.
6. Detention widget is financial **risk estimate**, not accounts receivable.
7. Recommendations are **rule-based heuristics**.

---

## Limitations

1. No historical snapshot tables — charts rebuild from current event download.
2. Large lists capped by backend default (1000 rows) unless pagination used.
3. Dock “DELAYED” count in metrics may not match `DOCK_STATUSES` enum (AVAILABLE/OCCUPIED/MAINTENANCE/BLOCKED only in backend).
4. No WebSocket — polling + event bus only.
5. AI Insights not integrated on this page.

---

## Related files

- `src/pages/Dashboard.jsx`
- `src/services/controlTowerApi.js`
- `src/services/ymsApi.js`
- `EXECUTIVE_KPI_NOTE.md`
- `../update.md`
