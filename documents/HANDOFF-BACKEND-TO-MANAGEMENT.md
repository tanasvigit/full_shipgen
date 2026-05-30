# Fleetbase Backend documentation — what to tell management

**Folder:** `documents/`  
**Audience:** Leadership, product, program managers, backend leads  
**Purpose:** Plain-language summary of the backend low-level requirements deliverable.

---

## One sentence summary

We captured the **entire Fleetbase backend API platform**—routes, services, database schema, infrastructure, security, and workflows—in **one requirements document** so teams can operate, extend, or re-platform the API **without spelunking six PHP packages**.

---

## What to hand to whom

| Role | Document | Why |
|------|----------|-----|
| **Executives / sponsors** | This file | Scope, coverage, risks |
| **Engineering leads** | [README.md](./README.md) | How to navigate backend + frontend docs |
| **Backend / DevOps / QA** | [BACKEND-LOW-LEVEL-REQUIREMENTS.md](./BACKEND-LOW-LEVEL-REQUIREMENTS.md) | Full API + architecture specification |
| **Frontend rebuild team** | [LOW-LEVEL-REQUIREMENTS.md](./LOW-LEVEL-REQUIREMENTS.md) | UI specs (pairs with backend doc) |

---

## What we delivered

| Deliverable | Scale |
|-------------|--------|
| **Backend LLRD** | ~26,000+ lines (regenerated from source) |
| **PHP packages documented** | 6 (core-api, fleetops, storefront, ledger, pallet, registry-bridge) |
| **REST resources** | 100+ `fleetbaseRoutes` registrations |
| **Controllers** | 190+ with method inventories |
| **Database tables** | 300+ create migrations indexed |
| **Regenerator** | `node documents/_build-backend-llrd.mjs` |

### What is inside the backend requirements file

| Part | Contents |
|------|----------|
| **0** | System architecture (Laravel shell, packages, URL tiers) |
| **I** | API contracts, middleware, auth, multi-tenancy |
| **II** | Docker, K8s, queues, cache, scheduled jobs |
| **III** | Core platform API (IAM, webhooks, schedules, files, …) |
| **IV** | FleetOps API + models |
| **IV-B** | Order lifecycle & orchestration (deep dive) |
| **V–VI** | Storefront, Ledger, Pallet, Registry |
| **VII** | Events, jobs, webhooks (catalog) |
| **VII-D–J** | Runtime platform: queues, event chains, webhooks, SocketCluster, tenancy directives, RBAC matrix, workflow graphs, scheduler |
| **XII** | Architecture intelligence: dispatch graphs, controller flows, DI map, package deps, ORM/lineage, cache, topology, observability, risks, JSON knowledge graphs |
| **XIII** | Engineering OS: AST semantic parsing, call graph, change impact, tests, performance, security, dead code, governance, AI semantic index, refactor safety, health dashboard |
| **XIV** | Platform intelligence: git churn, drift, deployment risk, evolution timeline, governance trends, DevX, doc integrity, analytics, AI remediation, snapshots |
| **VIII** | Database schema index (all packages) |
| **IX** | Security, caching, hidden rules |
| **X** | Per-endpoint request/response schemas (Form Requests + API Resources) |
| **Appendix** | Operations checklist |

---

## Business value

| Before | After |
|--------|--------|
| API knowledge spread across Composer packages and registry versions | Single inventory tied to this monorepo’s `packages/*` |
| Onboarding requires reading Laravel macros and route files | Documented REST convention + per-resource custom actions |
| Security/ops rules implicit in middleware code | Part IX explicit checklist |
| Frontend/backend drift | Cross-link to UI LLRD and `a_uidocs/behavior/services/*` |

**Estimated backend documentation completeness for operations and extension:** ~**85–90%**. Remaining gaps: vendor packages when not checked out, runtime `.env` per deployment, and proprietary registry package versions not in tree.

---

## Technical stack (for non-engineers)

- **Language:** PHP 8.0–8.2  
- **Framework:** Laravel 10 (+ optional Octane)  
- **Data:** MySQL 8, Redis (cache + queues)  
- **Realtime:** SocketCluster  
- **Deploy:** Docker Compose locally; Helm chart for Kubernetes  

---

## Pairing with frontend documentation

| Backend | Frontend |
|---------|----------|
| [BACKEND-LOW-LEVEL-REQUIREMENTS.md](./BACKEND-LOW-LEVEL-REQUIREMENTS.md) | [LOW-LEVEL-REQUIREMENTS.md](./LOW-LEVEL-REQUIREMENTS.md) |
| Parts III–VI list API resources | Parts IV–IX list screens that call those APIs |
| Part IV-B order workflow | Part V-A order detail tabs |

---

## Regeneration

When PHP routes or migrations change in `packages/*`:

```bash
node documents/_build-backend-llrd.mjs
```

Commit the updated markdown if your process keeps docs in git.

---

## FAQ

**Q: Does this replace OpenAPI/Swagger?**  
A: No—it is a **requirements and inventory** doc. Generate OpenAPI separately if needed for client SDKs.

**Q: Why isn’t `api/vendor` documented?**  
A: Source of truth is **`packages/*` submodules** in this repo; production uses the same code via Composer.

**Q: Are consumer storefront shopper APIs included?**  
A: Yes—Storefront **consumable** routes under `/storefront/v1/` (carts, checkouts, customer login) are in Part V.
