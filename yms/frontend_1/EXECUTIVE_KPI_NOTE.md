# Executive KPIs — Live Reporting Notes

Route: `/kpis` → `pages/Kpis.jsx`  
Data layer: `services/executiveKpisApi.js`

**Status:** **Live** — scorecard, trends, export, and search run on API data. **No** `KPI_HEADLINE`, `KPI_TARGETS`, or trend arrays from `data/db.js`.

---

## APIs used

`fetchExecutiveKpisBundle()` loads each source independently (partial failure tolerated):

| Endpoint | Data |
|----------|------|
| `GET /vehicles` | Fleet + lifecycle |
| `GET /appointments` | Bookings |
| `GET /queue-entries` | Wait times |
| `GET /docks` | Utilization |
| `GET /yard-events` | TAT, trends, dock replay |
| `GET /detention` | `records`, **`summary.today`**, `config` |

There is **no** `/executive-kpis` backend route. Aggregation matches Control Tower (client-side).

On failure: failed sources → empty arrays + entry in `bundle.fetchErrors`. Page errors only if **all** sources fail.

---

## Targets (scorecard)

Hardcoded in `TARGETS` (`executiveKpisApi.js`):

| Metric | Target |
|--------|--------|
| Avg Waiting Time | 30 min |
| Avg Turnaround | 90 min |
| Dock Utilization | 85% |
| Yard Occupancy | 75% |
| Detention Today | ₹1,00,000 |
| Fuel Wastage | 200 L |
| Shipment Completion | 95% |
| Customer Satisfaction | 92% |

Related constants: `YARD_CAPACITY` (72), `DETENTION_TARGET_INR`, `FUEL_LITRES_PER_WAITING_VEHICLE`, `CUSTOMER_SAT_FALLBACK`, `CSAT_FORMULA_BASELINE_PCT` (90).

---

## KPI formulas (today / current)

| KPI | Formula | Live vs estimated |
|-----|---------|-------------------|
| **Avg Waiting** | Mean minutes from `checkin_time` for `WAITING` queue entries | **Live** |
| **Avg Turnaround** | Gate-in event → exit for vehicles `EXITED` with `updated_at` today (UTC) | **Live** where events exist |
| **Dock Utilization** | OCCUPIED docks / total docks | **Live** |
| **Yard Occupancy** | Active in-yard vehicles / 72, capped 100% | **Live count**, **fixed capacity** |
| **Detention Today** | `summary.today` from detention bundle; fallback sum `cost` where `billing_date` is today UTC | **Live** from detention service |
| **Fuel Wastage** | COUNT(WAITING queue) × 6 L | **Placeholder** |
| **Shipment Completion** | Today UTC: non-cancelled appointments touched today → share COMPLETED or EXITED | **Live**, today-scoped (`shipmentCompletionForDay`) |
| **Customer Satisfaction** | `94 + (shipmentCompletion − 90) × 0.4`, clamp 60–100 | **Proxy** |

Gate-in event types: `VEHICLE_CHECKED_IN`, `QUEUE_ENTRY_CREATED`, `APPOINTMENT_CREATED`, `VEHICLE_CREATED` (earliest per vehicle).

---

## Δ vs Yesterday

Same formulas applied to **prior UTC calendar day** where possible:

| KPI | Yesterday basis |
|-----|-----------------|
| Avg Waiting | Queue entries active on yesterday |
| Avg Turnaround | Vehicles exited yesterday |
| Dock Utilization | Dock state replay from yesterday’s yard_events |
| Yard Occupancy | In-yard estimate at end of yesterday |
| Detention Today | Sum `cost` with `billing_date` = yesterday |
| Fuel | Yesterday waiting count × 6 L |
| Shipment Completion | Appointments touched yesterday |
| CSAT | Proxy from yesterday completion % |

Delta %: `round((current − yesterday) / |yesterday| × 100)`; if yesterday is 0 and current > 0 → +100%.

**Caveat:** Reconstructed from **current** DB export, not time-series tables.

---

## Performance % and state

**Bar width**

- Lower-is-better (wait, TAT, detention, fuel): `min(100, round(target / actual × 100))`
- Higher-is-better (dock, yard, shipments, CSAT): `min(100, round(actual / target × 100))`

**State** (`resolveStatus`): On Track / Watch / Critical / Steady — thresholds in `executiveKpisApi.js`.

---

## 7-day charts

### Turnaround (7 days)

For each of last 7 UTC days: vehicles `EXITED` with `updated_at` on that day; average TAT by ownership (Company, Contract, Outside). Labels = weekday short names.

### Yard occupancy (7 days)

End-of-day in-yard estimate from check-in/exit timeline; `occ% = min(100, count/72×100)`; target line 75%.

---

## Search and filter

Top-bar `UIContext.search` filters **scorecard rows** only (metric name, value, target, state). Charts are **not** filtered.

`matchesSearch` from `utils/search.js`.

---

## Refresh and live mode

| Mechanism | Behavior |
|-----------|----------|
| Mount | Initial load |
| Auto | **30s** silent `load(true)` |
| `yms-data-changed` | Silent reload |
| Manual | Refresh in page actions |
| Error | Retry on first-load failure |

---

## Export

`ExportMenu` + `toExportRows(visibleRows)`:

- CSV / PDF respect current search filter on scorecard rows.
- PDF meta uses live headline values from bundle.

---

## Daily Operations Report

`utils/dailyReport.js` uses this module for KPI sections (not `db.js` KPI mocks). See `CONTROL_TOWER_NOTE.md` for report composition.

---

## Assumptions

See `ASSUMPTIONS` export in `executiveKpisApi.js`. Summary:

1. Yard capacity **72** — config/API absent.
2. Detention today prefers backend **summary**; records may be `is_estimated`.
3. Fuel is idle-queue litres, not telematics.
4. CSAT is completion-derived, not surveys.
5. Yesterday and 7-day metrics are **reconstructed**, not warehoused history.
6. Dock util yesterday uses event replay approximation.
7. Equipment/labor are **not** inputs to the eight KPIs.

---

## Limitations

1. No dedicated executive KPI API or snapshot DB.
2. TAT excludes vehicles without gate-in events.
3. Partial API outage degrades individual metrics silently (`fetchErrors`).
4. Control Tower on `/` shows different detention semantics (**exposure** vs **billed today**).
5. Targets are **hardcoded** — not editable in UI or admin API.

---

## Related files

- `src/pages/Kpis.jsx`
- `src/services/executiveKpisApi.js`
- `src/services/detentionApi.js`
- `src/services/ymsApi.js`
- `CONTROL_TOWER_NOTE.md`
- `../update.md`
- `../docs/MODULE_STATUS.md`
