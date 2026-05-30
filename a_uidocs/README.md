# Fleetbase Ember UI — Documentation Checklist

Complete documentation set for rebuilding the Fleetbase Console UI in a custom design system.  
**Location:** `a_uidocs/`  
**Overview library (docs 01–62):** single file **[COMPLETE-OVERVIEW-DOCS-01-62.md](./COMPLETE-OVERVIEW-DOCS-01-62.md)** (table of contents inside)

**For management / handoff to leadership:** read **[HANDOFF-EXPLAIN-TO-MANAGEMENT.md](./HANDOFF-EXPLAIN-TO-MANAGEMENT.md)** — plain-language summary of what this package is and what the team can do with it.

## How to use

1. Read **[COMPLETE-OVERVIEW-DOCS-01-62.md](./COMPLETE-OVERVIEW-DOCS-01-62.md)** — all 62 overview topics in one place (use the table of contents).
2. For each screen, open the matching file under [`screens/`](./screens/README.md).
3. For deep detail flows, use the **MASTER** specs under `screens/fleet-ops/` and `screens/ledger/`.
4. For buttons/modals/APIs, see [`behavior/`](./behavior/README.md).

## Prerequisites

```bash
git submodule update --init
```

Engine and `ember-ui` docs require `packages/` submodules to be checked out.

To regenerate everything from source:

```bash
git submodule update --init packages/ember-ui packages/ember-core packages/fleetops-data packages/fleetops packages/storefront packages/ledger packages/iam-engine packages/dev-engine packages/registry-bridge packages/pallet
node a_uidocs/_generate-screen-specs.mjs      # 419 per-screen specs → screens/
node a_uidocs/_enrich-screen-specs-deep.mjs
node a_uidocs/_generate-behavior-catalog.mjs
node a_uidocs/_enrich-screen-specs-behavior.mjs
node a_uidocs/_generate-all-masters.mjs
node a_uidocs/_generate-detail-masters.mjs
node a_uidocs/_complete-documentation.mjs
node a_uidocs/_enrich-components-behavior.mjs
node a_uidocs/_enrich-pass2.mjs
```

> Overview docs 01–62 live only in `COMPLETE-OVERVIEW-DOCS-01-62.md`. Regenerating that file from source requires restoring individual `NN-*.md` files via `_generate-all.mjs` if needed.

### Per-screen documentation (`screens/`)

Every template has its own markdown file with **sections 1–16** (UI structure) plus **section 17 — Runtime behavior** (traced modals, APIs, toasts, permissions, sockets, disabled rules).

| Resource | Path |
|----------|------|
| Screen index (419+ URLs) | [`screens/README.md`](./screens/README.md) |
| Service behavior catalog (31 services) | [`behavior/README.md`](./behavior/README.md) |
| Platform patterns | [`behavior/PLATFORM-RUNTIME-PATTERNS.md`](./behavior/PLATFORM-RUNTIME-PATTERNS.md) |
| Order detail (full UI + behavior) | [`screens/fleet-ops/MASTER__order-detail-complete.md`](./screens/fleet-ops/MASTER__order-detail-complete.md) |
| Driver detail | [`screens/fleet-ops/MASTER__driver-detail-complete.md`](./screens/fleet-ops/MASTER__driver-detail-complete.md) |
| Vehicle detail | [`screens/fleet-ops/MASTER__vehicle-detail-complete.md`](./screens/fleet-ops/MASTER__vehicle-detail-complete.md) |
| Place detail | [`screens/fleet-ops/MASTER__place-detail-complete.md`](./screens/fleet-ops/MASTER__place-detail-complete.md) |

### Depth by document

| Depth | Documents |
|-------|-----------|
| **Full field-level** | 05, 12–14, 32–34, 36–37, 46, 33 (52 models) |
| **Full component catalog** | 27–28 (206 components) |
| **Full template inventory** | 35, 46–60 (engine routes + every `.hbs`) |
| **Architecture / patterns** | 01–04, 08–11, 15–31, 38–45, 61–62 |

## Existing reference material (do not duplicate blindly)

| File | Use for |
|------|---------|
| `frontend_blue_print.txt` | Console routes, flows, APIs |
| `admin-docs/admin-panel-documentation.md` | Admin built-in pages |
| `admin-docs/admin-route-tree-reference.md` | Admin route tree |
| `admin-docs/home page/ember-homepage-documentation.md` | Homepage shell |

---

## Overview docs (01–62)

All **62** topics are in **[COMPLETE-OVERVIEW-DOCS-01-62.md](./COMPLETE-OVERVIEW-DOCS-01-62.md)** — open that file and use its **table of contents** (doc-01 through doc-62).

**Status:** ✅ complete  
**Per-screen specs:** see [`screens/README.md`](./screens/README.md) (**419+** files, one per route/template)

---

## Recommended order for UI rebuild

| Phase | Docs | Goal |
|-------|------|------|
| **A — Context** | 01 → 03 | Understand system |
| **B — Shell & routes** | 04, 08, 09, 18, 19 | Layout and navigation first |
| **C — Console pages** | 05 → 07, 10 → 17 | Host app screens |
| **D — Design system** | 18 → 28 | Reusable components |
| **E — Platform** | 29 → 34 | Services, data, APIs |
| **F — FleetOps** | 35 → 46 | Largest product module |
| **G — Other engines** | 47 → 58 | Storefront, Ledger, IAM, Dev, Registry |
| **H — Optional** | 59 → 60 | Pallet (if enabled) |
| **I — Finish** | 61 → 62 | Permissions, i18n, handoff |

---

## Volume legend

| Vol | Name |
|-----|------|
| 0 | Program & architecture |
| 1 | Console host (`console/`) |
| 2 | Design system (`@fleetbase/ember-ui`) |
| 3 | Platform services (`@fleetbase/ember-core`) |
| 4 | Data & API |
| 5 | Extension engines (`packages/*-engine`) |
| 6 | Cross-cutting & handoff |

---

## Deliverable definition of “Done”

A document is **Done** when:

- All checkboxes in that file are checked
- A developer can implement the screens **without reading Ember source**
- Custom design-system mapping is filled in (doc 62 guides the pattern)

## Completion status (automated pass)

| Layer | Status |
|-------|--------|
| Overview docs 01–62 (single file) | ✅ [COMPLETE-OVERVIEW-DOCS-01-62.md](./COMPLETE-OVERVIEW-DOCS-01-62.md) |
| Screen specs (~405 routes) | ✅ + section 17 |
| MASTER detail specs | ✅ FleetOps + Ledger (auto-discovered) |
| Behavior services | ✅ + inherited `resource-action` API |
| Validation / flags / adapters | ✅ [`behavior/VALIDATION-FEATURES-ADAPTERS.md`](./behavior/VALIDATION-FEATURES-ADAPTERS.md) |

**Regenerate everything:**

```bash
node a_uidocs/_complete-documentation.mjs
```
