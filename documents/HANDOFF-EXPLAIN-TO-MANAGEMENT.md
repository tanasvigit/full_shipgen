# Fleetbase UI documentation — what to tell management

**Folder:** `a_uidocs/`  
**Audience:** Leadership, product, program managers  
**Purpose:** Plain-language summary of what was delivered and how the team should use it.

---

## One sentence summary

We captured the **entire Fleetbase admin console** in **one requirements document** so engineering can rebuild the UI in a new design system **without reading the old Ember codebase**.

---

## What to hand to whom

| Role | Document | Why |
|------|----------|-----|
| **Executives / sponsors** | This file | Scope, coverage, timeline, risks |
| **Engineering leads** | [README.md](./README.md) | How to open the spec and jump to sections |
| **Developers & QA** | [LOW-LEVEL-REQUIREMENTS.md](./LOW-LEVEL-REQUIREMENTS.md) | Full build + test specification (~103k lines) |

**Developers need only one file:** [LOW-LEVEL-REQUIREMENTS.md](./LOW-LEVEL-REQUIREMENTS.md).  
Other folders (`screens/`, `behavior/`, etc.) exist only to regenerate that file if the product changes.

---

## What we delivered

| Deliverable | Size / scale |
|-------------|----------------|
| **Single LLRD** | ~103,000 lines, ~2.3 MB |
| **Screen-level specs** | **469** (436 routes + 33 FleetOps detail tabs) |
| **Feature modules** | 28 (auth, FleetOps, Storefront, Ledger, IAM, …) |
| **Global UX rules** | 90+ (loading, errors, forms, tables, accessibility) |
| **QA traceability** | REQ IDs → `TC-*` test cases (Part X) |
| **Rollout plan** | Phased checklist (Appendix at end of LLRD) |

### What is inside the requirements file

| Part | Contents |
|------|----------|
| **0** | System architecture |
| **I** | Global UX (applies to every screen) |
| **II** | Platform behavior (modals, CRUD, permissions, sockets) |
| **III & VII** | Feature journeys & business rules |
| **IV–IX** | Every screen: fields, tables, APIs, runtime behavior |
| **V-A** | Order / driver / vehicle / place detail tabs |
| **X** | Traceability & test IDs |
| **Appendix** | 20-week rollout + per-screen definition of done |

---

## Business value

| Before | After |
|--------|--------|
| Knowledge trapped in Ember code across many packages | Written spec any stack can follow |
| Discovery by clicking through the live app | 469 documented screens with test IDs |
| Inconsistent rebuild risk | Shared UX rules (Part I) and patterns (Part II) |
| Hard to estimate | Phased plan in Appendix + Part X for QA scope |

**Estimated documentation completeness for rebuild:** ~**90%**. Remaining work is visual design (your new component library) and normal backend coordination—not missing screen inventory.

---

## What the team can do without Ember source

1. Rebuild login, shell, settings, and admin (Console)  
2. Rebuild FleetOps (orders, map, drivers, vehicles, maintenance, analytics)  
3. Rebuild Storefront, Ledger, IAM, Developers, Registry, optional Pallet  
4. Enforce permissions and API behavior as documented  
5. Run structured QA using `TC-*` IDs in Part X  

## What is out of scope

- End-customer **consumer** storefront (shopper-facing app)—admin console only  
- Hosting, DevOps, and infrastructure  
- Picking colors/fonts—team maps “Console component → your design system” during build  

---

## Coverage (honest status)

| Area | Status |
|------|--------|
| Console + auth + admin | ✅ Complete in LLRD |
| FleetOps routes + detail tabs | ✅ Complete (incl. Part V-A) |
| Storefront & Ledger | ✅ Complete |
| IAM, Developers, Registry, Pallet | ✅ Complete |
| Design-system visual mapping | ⚠️ Filled by your team during implementation |
| Consumer storefront app | ❌ Not in scope |

---

## Suggested program timeline (indicative)

| Phase | Weeks | Scope | LLRD parts |
|-------|------:|-------|------------|
| 1 — Foundation | 2–3 | Global UX, platform patterns, auth, shell | I, II, IV |
| 2 — FleetOps | 6–8 | Operations core + detail tabs | III, V, V-A |
| 3 — Commerce & finance | 4–6 | Storefront + Ledger | VII, VIII, IX |
| 4 — Platform | 2–3 | IAM, dev tools, registry, Pallet | III, VI |
| 5 — Quality | 2 | Full regression vs Part X | X + Appendix |

**Total indicative duration:** ~16–22 weeks with a sized squad (varies by team and design-system readiness).

---

## Risks to flag early

| Risk | Mitigation |
|------|------------|
| New design system not ready | Use Part I UX rules + section 14 component mapping early |
| Scope creep (new screens) | Regenerate LLRD from source when Ember changes |
| QA under-scoped | Part X lists `TC-*` per feature area |
| “We still need Ember” | Only for edge cases; 469 screens are already written down |

---

## FAQ for leadership

**Do we still need the old frontend repo?**  
For day-to-day build: **no**. Keep it for regeneration if Fleetbase ships changes, or rare edge-case clarification.

**Is one 103k-line file usable?**  
Yes. The file has a **Go to line** table at the top (Ctrl+G) and search for routes (`#### Screen:`) and tabs (`#### Detail tab:`).

**How do we track progress?**  
Use the **Appendix** checklist (line ~102984 in LLRD) and close `TC-*` tests from Part X.

**When is this “done”?**  
When Appendix phases are complete and Part X tests pass for shipped scope.

---

## Regenerating after product changes

```bash
git submodule update --init
node a_uidocs/_complete-documentation.mjs
node a_uidocs/_build-standalone-llrd.mjs
```

---

## Bottom line for a steering meeting

> “We have a single, self-contained requirements document for the full admin console—469 screens, global UX, APIs, permissions, and test IDs. Engineering can rebuild in our new UI stack from that file alone. Plan ~4–5 months phased delivery; design system mapping is the main dependency on our side.”

---

*Technical entry: [README.md](./README.md) · Full spec: [LOW-LEVEL-REQUIREMENTS.md](./LOW-LEVEL-REQUIREMENTS.md)*
