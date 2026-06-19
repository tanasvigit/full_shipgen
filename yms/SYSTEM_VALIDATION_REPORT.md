# System Validation Report — Smart Yard / YMS

**Audit date:** June 2026  
**Method:** Static code review + live API probes against `http://localhost:8001/api` (Docker stack running)  
**Scope:** Completed operational modules (excludes `/vehicles` mock page and `/ai` mock page)  
**Code changes:** None (read-only audit)

---

## 1. Executive Summary

The YMS platform has a **coherent live backend** and **mostly integrated frontend** for yard operations. Core vehicle lifecycle flows work end-to-end **when the correct RBAC role is used on API calls**. Pagination and RBAC guards are present on mutation routes.

Two **critical defects** block production validation of whole-system behavior:

1. **`GET /api/detention` returns HTTP 500** on every request due to variable shadowing in `list_detention_records()` (`q` search parameter overwritten by queue loop variable).
2. **`GET /api/search` returns HTTP 500** due to SQL referencing non-existent columns (`equipment_name`, `category` on `equipment`; `shift` on `labor_teams`).

A **high-severity RBAC/UX mismatch** affects Gate: default frontend role is `operations`, but `flow.check_in` is only allowed for `gate` (and not `operations`). Gate check-in from the UI will receive **403** unless the user switches role in TopNav.

**Overall verdict:** **NOT READY** for production; **READY FOR QA** after fixing critical backend bugs and validating Gate role defaults. **READY FOR PILOT** only with documented workarounds (role switcher, no global search, detention page broken).

---

## 2. Pass/Fail Matrix

| # | Area | Result | Notes |
|---|------|--------|-------|
| 1 | End-to-end operational flow | **PARTIAL PASS** | Backend flow passes with `gate` check-in + `operations` for call/assign/loading/exit; default UI role breaks check-in |
| 2 | Equipment workflow | **PARTIAL PASS** | Create/assign/release/maintenance APIs work; list `category` filter fails; search broken |
| 3 | Labor workflow | **PARTIAL PASS** | CRUD/status/assign APIs exist; search SQL invalid; loading integration is label-only |
| 4 | Detention workflow | **FAIL** | `GET /detention` always 500; status PATCH untested live |
| 5 | Global search | **FAIL** | `/api/search` → 500 |
| 6 | RBAC | **PARTIAL PASS** | Guards enforced; `read_only` → 403 on mutations verified; role matrix vs UI mismatch |
| 7 | Pagination & filters | **PARTIAL PASS** | Array default + `{items,total,skip,limit}` with `limit` verified on vehicles; equipment `category` filter fails |
| 8 | Cross-module sync | **PASS** | Emit/listen pattern consistent across live modules |
| 9 | Dashboard validation | **PARTIAL PASS** | Control Tower/KPIs load pattern sound; detention source fails → degraded KPI bundle |
| 10 | Backend validation | **PARTIAL PASS** | Schema and routers complete; search + detention bugs; filter column mismatches |
| 11 | Frontend validation | **PARTIAL PASS** | Routes/listeners wired; no action-level RBAC; Gate/detention/search at risk |
| 12 | Mock data scan | **PASS** (documented) | Mock isolated to deferred modules + branding |

---

## 3. Critical Issues

### C1 — Detention bundle always crashes (`GET /api/detention` → 500)

**Evidence:** Docker backend log:

```
AttributeError: 'dict' object has no attribute 'strip'
  File "/app/services/detention_service.py", line 309, in list_detention_records
    q_lower = q.strip().lower()
```

**Cause:** Function parameter `q` (search text) is shadowed inside `for q_row in queues:` by `q = _to_dict(q_row)`. After the loop, `if q:` is always true (last queue dict), then `.strip()` fails.

**Impact:** Detention page, Executive KPIs detention tile, Daily Report detention section, and any `fetchDetentionBundle()` call fail or degrade.

---

### C2 — Global search endpoint broken (`GET /api/search` → 500)

**Evidence:** `Invoke-WebRequest http://localhost:8001/api/search?q=EQ` → 500.

**Cause:** `search_service._search_table()` uses columns not in `db.py` schema:

| Table | Invalid columns in search |
|-------|---------------------------|
| `equipment` | `equipment_name`, `category` |
| `labor_teams` | `shift` (schema has `shift_start`, `shift_end`) |

**Impact:** TopBar jump-to shows error state; no live global search.

---

### C3 — Gate check-in forbidden for default app role

**Evidence:** `POST /api/flow/check-in` with `X-YMS-Role: operations` → 403  
`{"detail":"Role 'operations' is not allowed to perform this action (flow.check_in)"}`

**Cause:** `auth_rbac.py` grants `flow.check_in` only to `gate` (and `admin`). Frontend `authStorage.js` defaults to `operations`; `gateManagementApi.approveCheckIn()` uses `ymsApi` with that default.

**Impact:** Primary gate workflow fails out-of-the-box until user selects **Gate** role in TopNav.

---

## 4. Medium Issues

### M1 — Equipment list filter `category` invalid

`GET /api/equipment?category=...` fails — no `category` column on `equipment` table (filter wired in `list_filters.py` / router).

### M2 — No frontend permission guards

`useAuth().can()` exists but **no page** checks permissions before actions. Users see toast/API errors on 403 instead of disabled controls.

### M3 — Exit vehicle not in Loading Ops “complete” alone

`loadingOpsApi.completeOperation()` transitions to `COMPLETED` only. Full journey requires **additional** transition to `EXITED` (via Docks release, Vehicle drawer, or manual flow). Documented in code paths; easy to miss in UAT.

### M4 — Control Tower vs Executive KPIs detention semantics differ

Control Tower uses **estimated exposure**; KPIs use **billed** `summary.today`. Both can be “correct” but confuse validators comparing numbers.

### M5 — Executive KPIs / Daily Report partial degradation

`fetchExecutiveKpisBundle()` tolerates per-source failure, but with detention always failing, `fetchErrors` will always include detention and “Detention Today” KPI will be wrong or zero.

### M6 — `operations` cannot check-in; `supervisor` cannot check-in

Only `gate` (+ `admin`) can check-in. Operations team must use Gate role or admin for that step — not documented in UI.

### M7 — Detention status filter on router vs broken list

`GET /api/detention?status=Pending` still hits broken `list_detention_records()` before filter matters.

---

## 5. Low Issues

| ID | Issue |
|----|--------|
| L1 | `useEventFeed.js` imports mock `db.js` but is **unused** — dead code |
| L2 | `utils/jumpTo.js` stub `buildJumpResults()` returns `[]` — harmless if tests not run |
| L3 | Control Tower metrics reference `DELAYED` dock status not in `DOCK_STATUSES` enum |
| L4 | Virtual Queue: failed priority API keeps local order without `notifyYmsDataChanged()` |
| L5 | ESLint warnings in `Kpis.jsx`, `VirtualQueue.jsx` (pre-existing) |
| L6 | No automated integration test suite in repo for these flows |
| L7 | Search unavailable banner for AI is correct; AI route still mock-only |

---

## 6. Deferred Items (intentional — out of scope)

| Item | Status |
|------|--------|
| `/vehicles` page | Mock `VEHICLES` from `data/db.js` |
| `/ai` page | Mock `AI_INSIGHTS` |
| JWT / login / session store | Not implemented |
| Server-side Control Tower / KPI aggregates | Client-side only |
| Yard zone master table / GIS | Derived in frontend |
| Containers, customs, ports, freight, vendors | Not in backend |
| `hooks/useEventFeed.js` | Mock, unused |

---

## 7. Detailed Validation Notes

### 7.1 End-to-end operational flow

**Expected journey:** Appointment → Gate lookup → Approve check-in → Queue → Call → Assign dock → Loading → Complete → Exit

| Step | Backend (live test) | Frontend wiring |
|------|---------------------|-----------------|
| Create appointment | PASS — `POST /vehicles`, `POST /appointments` | `appointmentsApi.createBookingFromForm` + notify |
| Gate lookup | PASS — client bundle from lists | `gateManagementApi.lookupGateVehicle` |
| Approve check-in | PASS with `X-YMS-Role: gate` | `approveCheckIn` → `flow/check-in` — **403 with default role** |
| Queue entry | PASS — status `WAITING` after check-in | Virtual Queue lists active entries |
| Call vehicle | PASS — `CALLED` | `ymsApi.callQueueEntry` + notify |
| Assign dock | PASS — `DOCK_ASSIGNED`, dock `OCCUPIED` | `docksApi.assignQueueToDock` / flow API |
| Start loading | PASS — `LOADING` via transition | Docks `startLoadingAtDock` / Loading Ops `startLoadingOperation` |
| Complete loading | PASS — `COMPLETED` | `loadingOpsApi.completeOperation` |
| Exit vehicle | PASS — `EXITED`, dock `AVAILABLE` | Requires explicit `transition` to `EXITED` (not automatic on complete) |
| Yard events | PASS — 4+ events for test plate | Written on flow transitions |
| Detention generation | **FAIL** — bundle endpoint 500 | Derived on read in service (never returns) |
| Dashboard / KPI refresh | PARTIAL — listener fires; detention metrics wrong | `yms-data-changed` on 10+ pages |

**Live API proof (roles: gate check-in, operations thereafter):**  
`plate=AUD37989` → `veh=EXITED`, `queue=EXITED`, `dock=AVAILABLE`.

**Result:** **PARTIAL PASS**

---

### 7.2 Equipment workflow

| Step | Result |
|------|--------|
| Create equipment | PASS |
| Assign / in-use / release / maintenance shortcuts | PASS (POST routes guarded) |
| Yard events on status | PASS — `equipment_service` logs events |
| Dock integration | PASS — `assigned_dock_id` FK |
| Loading integration | PARTIAL — `deriveEquipment` labels only |
| Global search | FAIL — endpoint 500 |

**Result:** **PARTIAL PASS**

---

### 7.3 Labor workflow

| Step | Result |
|------|--------|
| Create / update / status / assign / release | PASS — routes in `labor_service` |
| Break / resume | PASS — `break`, `break-end` endpoints |
| Utilization | PASS — computed client-side in `laborApi.computeLaborKpis` |
| Dock integration | PASS — `assigned_dock_id` |
| Loading integration | PARTIAL — labels via `deriveLaborTeam` |
| Search | FAIL — invalid `shift` column in search SQL |

**Result:** **PARTIAL PASS**

---

### 7.4 Detention workflow

| Step | Result |
|------|--------|
| Generate / list records | **FAIL** — `GET /api/detention` 500 |
| Review → Dispute → Approve → Paid | NOT VERIFIED — list never succeeds |
| KPI updates | FAIL — detention source fails |
| Report updates | FAIL — `dailyReport` detention fetch fails |
| Event logging on status change | Code present in `update_detention_status` — untested live |

**Result:** **FAIL**

---

### 7.5 Global search

| Check | Result |
|-------|--------|
| Vehicle / appointment / dock / queue in search | FAIL — endpoint 500 before results |
| Labor / equipment / detention in search | FAIL — same |
| Navigation / drawers | Code in `JumpToResults.jsx` looks correct **if** API succeeds |
| AI | Correctly marked unavailable in response payload (when API works) |

**Result:** **FAIL**

---

### 7.6 RBAC

| Role | Mutations (sample) | Read lists |
|------|-------------------|------------|
| `admin` | Allowed (`*`) | Allowed |
| `operations` | vehicle/appointment/queue/dock/call/assign/transition/equipment/labor — **not** check-in | Allowed |
| `gate` | check-in, appointment, queue — **not** call/assign (typical) | Allowed |
| `supervisor` | call, assign, detention, queue, appointment | Allowed |
| `read_only` | **403** on check-in (verified) | Allowed |

**Routes missing permission guards:** `GET` list/detail endpoints (by design); `GET /search`, `GET /auth/*` (by design).

**Frontend:** Only TopNav uses `useAuth`; no `can()` on buttons.

**Result:** **PARTIAL PASS**

---

### 7.7 Pagination & filters

| Endpoint | Backward compat (`limit` omitted) | Paginated (`limit=2`) | Filters |
|----------|-----------------------------------|------------------------|---------|
| `/vehicles` | PASS — JSON array, count=8 | PASS — `items,total,skip,limit` | `q`, `status`, `ownership_type` — code present |
| `/appointments` | Code present | Code present | `date_from`, `date_to` |
| `/queue-entries` | Code present | Code present | `dock_id` |
| `/docks` | Code present | Code present | `status` |
| `/yard-events` | Code present | Code present | `date_from`, `date_to` |
| `/equipment` | Code present | Code present | **`category` filter FAIL** |
| `/labor` | Code present | Code present | `q`, `status` |
| `/detention` | N/A bundle shape | N/A | **Broken list** |

**Result:** **PARTIAL PASS**

---

### 7.8 Cross-module sync (`yms-data-changed`)

| Module | Listens | Emits |
|--------|---------|-------|
| Control Tower (`/`) | Yes | No |
| Executive KPIs (`/kpis`) | Yes | No |
| Appointments | Yes | Yes (`appointmentsApi`) |
| Gate | Yes | Yes (`gateManagementApi`) |
| Virtual Queue | Yes | Yes (call, `persistOrder`) |
| Docks | Yes | Yes (`docksApi`) |
| Loading Ops | Yes | Yes (`loadingOpsApi`) |
| Detention | Yes | Yes (`detentionApi`) |
| Equipment | Yes | Yes |
| Labor | Yes | Yes |
| Yard Map | Yes | Yes |

**Stale risk:** Pages not open do not refresh until visit or 30s timer (Dashboard, KPIs, Detention). No module in scope lacks listener if it displays live API data.

**Result:** **PASS**

---

### 7.9 Dashboard validation

| Surface | Loading / error / retry | Refresh | Live vs estimated |
|---------|-------------------------|---------|-------------------|
| Control Tower | Yes — skeleton, toast, live toggle | 30s + event | Documented in `CONTROL_TOWER_NOTE.md` |
| Executive KPIs | Yes — full-page error + retry | 30s + event | Documented in `EXECUTIVE_KPI_NOTE.md`; detention broken |
| Detention page | Error path exists | 30s + event | **Cannot load data (500)** |
| Yard Map | Standard load | Event only | Zones derived — documented |

**Result:** **PARTIAL PASS**

---

### 7.10 Backend validation

| Check | Result |
|-------|--------|
| Tables / FKs / indexes | PASS — `db.py` schema coherent |
| Services map to routers | PASS |
| Auth module | PASS — `auth_rbac.py` + Depends on mutations |
| Search service | **FAIL** — invalid columns |
| Detention service | **FAIL** — variable shadow |
| Orphan routes | None found — status + auth + search + yms |
| Status transitions | PASS — enums + validation in `yms_service` |

**Result:** **PARTIAL PASS**

---

### 7.11 Frontend validation

| Check | Result |
|-------|--------|
| Routes (`App.js`) | PASS — all scoped pages registered |
| Drawers | PASS — Vehicle, Appointment, Dock, Loading, Equipment, Labor, Detention |
| `AuthProvider` | PASS — wraps app |
| Listeners | PASS — see §7.8 |
| Jump-to | FAIL at runtime (API 500) |
| Crash risks | Loading Ops `parseExceptions` — **fixed** (uses `startIso` param) |
| Stale `db.js` imports | Only Vehicles, AI, COMPANY, unused hook |

**Result:** **PARTIAL PASS**

---

### 7.12 Mock data scan

| Location | Classification |
|----------|----------------|
| `pages/Vehicles.jsx` → `VEHICLES` | **C — Deferred** |
| `pages/AiInsights.jsx` → `AI_INSIGHTS` | **C — Deferred** |
| `TopNav.jsx`, `Sidebar.jsx`, `dailyReport.js` → `COMPANY` | **A — Acceptable** (branding only) |
| `hooks/useEventFeed.js` | **B — Should remove or wire** (unused) |
| `utils/jumpTo.js` empty stub | **A — Acceptable** (deprecated) |
| `controlTowerApi` / `executiveKpisApi` constants (72, 6L, CSAT) | **A — Acceptable** (documented estimates) |
| `yardMapApi` zone defs | **A — Acceptable** (documented derived) |

---

## 8. Readiness Score

| Dimension | Score (0–100) | Rationale |
|-----------|---------------|-----------|
| Architecture | 78 | Clear API + service split; client-side aggregation; event bus sync |
| Backend | 52 | Core YMS solid; detention + search regressions; filter/schema drift |
| Frontend | 70 | Live modules wired; RBAC not UX-integrated; critical deps on broken APIs |
| Integration | 58 | E2E works with role workaround; detention/search break cross-module |
| Reporting | 45 | KPIs/Control Tower logic sound; detention data path dead |
| Security | 62 | RBAC on mutations works; header-only auth; default role mismatch |
| Documentation | 85 | Recently aligned `update.md`, API inventory, module notes |
| **Overall** | **58** | |

---

## 9. Readiness Recommendation

| Level | Verdict |
|-------|---------|
| **READY FOR PRODUCTION** | **No** — detention and search unavailable; gate default role blocks check-in |
| **READY FOR PILOT** | **Conditional** — only with Gate role selected, no reliance on detention page or global search |
| **READY FOR QA** | **Yes** — after fixing C1–C3; use role matrix test plan below |
| **NOT READY** | **Yes (current build)** — for any pilot expecting full documented scope |

**Justification:** The operational spine (appointment → queue → dock → loading → exit) is demonstrably functional at the API layer. Two high-traffic platform features (detention, global search) are hard-failed by backend bugs, and the default operator role prevents gate check-in without manual role switching.

---

## 10. Recommended Next Actions (priority order)

1. **Fix detention `q` variable shadow** in `detention_service.py` (rename loop variable to `queue_row` / `queue_dict`).
2. **Fix search SQL columns** to match schema (`model`, `equipment_type`, `shift_start`, etc.).
3. **Resolve Gate RBAC vs default role** — either grant `flow.check_in` to `operations` or default frontend role to `gate` on Gate route / auto-switch.
4. **Remove or fix `equipment.category` list filter** to match schema.
5. **Add frontend `can()` disables** on Gate check-in, call, assign, detention approve (optional for QA clarity).
6. **Add integration tests** for E2E flow, search, detention, RBAC 403 matrix.
7. **Re-run this audit** after fixes (detention GET, search, gate check-in with default settings).

---

## 11. QA Test Plan Snippet (post-fix)

1. Set TopNav role to **Gate** → book appointment → approve check-in → confirm queue row.
2. Switch to **Operations** → call → assign dock → start/complete loading → exit vehicle.
3. Open Control Tower + KPIs — confirm counts change without manual refresh.
4. Search plate in TopBar — open vehicle drawer.
5. Set **Supervisor** → dispute/approve detention record.
6. Set **Read only** — confirm mutations return 403 with clear toast.

---

## Appendix — Evidence References

| Artifact | Path |
|----------|------|
| Detention bug | `backend/services/detention_service.py` ~268–309 |
| Search columns | `backend/services/search_service.py` ~80–92 |
| RBAC matrix | `backend/auth_rbac.py` |
| Sync hub | `frontend_1/src/services/gateManagementApi.js` |
| Default role | `frontend_1/src/services/authStorage.js` |
| Live E2E API | `gate` check-in + `operations` flow, plate `AUD37989` |
| Backend log | `docker compose logs backend` — detention AttributeError |

---

*This report reflects the codebase and running Docker environment at audit time. Re-validate after deployments or fixes.*
