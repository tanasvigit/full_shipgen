# Fleetbase Documentation

Rebuild and operate Fleetbase from **self-contained requirements documents**—no need to read the entire Ember or PHP codebase for inventory-level work.

---

## Start here

| Who | Read |
|-----|------|
| **Frontend developers** | [LOW-LEVEL-REQUIREMENTS.md](./LOW-LEVEL-REQUIREMENTS.md) — Console UI (~103k lines) |
| **Backend / DevOps / integrators** | [BACKEND-LOW-LEVEL-REQUIREMENTS.md](./BACKEND-LOW-LEVEL-REQUIREMENTS.md) — API & architecture |
| **Management / sponsors** | [HANDOFF-EXPLAIN-TO-MANAGEMENT.md](./HANDOFF-EXPLAIN-TO-MANAGEMENT.md) (UI) · [HANDOFF-BACKEND-TO-MANAGEMENT.md](./HANDOFF-BACKEND-TO-MANAGEMENT.md) (API) |

---

## Frontend (Console UI)

| Metric | Value |
|--------|-------|
| File | [LOW-LEVEL-REQUIREMENTS.md](./LOW-LEVEL-REQUIREMENTS.md) |
| Route screens | 436 |
| FleetOps detail tabs | 33 |
| **Total specs** | **469** |

**Regenerate:**

```bash
node a_uidocs/_build-standalone-llrd.mjs
```

**Jump to line (Ctrl+G):** See the table at the top of `LOW-LEVEL-REQUIREMENTS.md`.

---

## Backend (API platform)

| Metric | Value |
|--------|-------|
| File | [BACKEND-LOW-LEVEL-REQUIREMENTS.md](./BACKEND-LOW-LEVEL-REQUIREMENTS.md) |
| Packages | core-api, fleetops, storefront, ledger, pallet, registry-bridge |
| Migrations indexed | ~326 |
| Foreign keys + logical UUID indexes | Part VIII-B (~267 FKs; logical-only where no `foreign()`) |
| Eloquent relationships | Part VIII-B (~539) |
| Event → listener matrix | Part VII |
| Permissions / policies / roles | Part VII-B (Auth Schemas) |
| Services & HTTP filters | Part VII-C |
| Jobs & queue runtime | Part VII-D |
| Event runtime flows (sync/async chains) | Part VII-E |
| Webhook contracts (inbound/outbound) | Part VII-F |
| SocketCluster / realtime channels | Part VII-G |
| Auth directives & tenancy scopes | Part VII-H |
| Workflow runtime graphs (Mermaid) | Part VII-I |
| Scheduler / cron runtime | Part VII-J |
| Runtime coverage summary | Part VII-D–J footer |
| Runtime metadata (JSON) | `documents/_meta/backend-runtime.json` |
| Architecture knowledge graphs | `documents/_meta/backend-architecture-graph.json`, `backend-runtime-graph.json`, `backend-dependency-graph.json` |
| Dispatch tracing & dependency graphs | Part XII (A–J) |
| Architecture risk hotspots | Part XII-J |
| Engineering OS (AST, impact, governance) | Part XIII |
| Call graph / semantic index (JSON) | `backend-callgraph.json`, `backend-semantic-index.json` |
| Platform health dashboard | Part XIII — Platform health summary |
| Continuous governance & git churn | Part XIV |
| Architecture snapshots (trends) | `documents/_meta/snapshots/latest.json` |
| Deployment risk / drift / remediation | Part XIV-C, XIV-B, XIV-I |
| Platform maturity index | Part XIV — Enterprise dashboard |
| FleetOps Flow / Activity | Part IV-C |
| API Resource `toArray()` catalogs | Part X (recursive `toArray()` + nested resources) |
| Response field tables (per endpoint) | Part X (~54%+ endpoints; confidence-scored) |
| Example JSON + error envelopes | Part X (priority: orders, drivers, auth, checkout, ledger) |
| Conditional validation | Part X (static, `if` branches, `required_if` / `sometimes` in rule strings) |
| SDK/OpenAPI metadata (internal) | `documents/_meta/backend-api-contracts.json` |
| UI ↔ API traceability | Part XI |
| REST resources | 100+ |
| Form request classes | 103 (Part X — static rules + conditional branches) |
| Endpoint specs | 1,354 (Part X — every `routes.php` route + schemas; count varies with parser) |

**Covers:** APIs, services, business logic, workflows (e.g. order lifecycle), database design, infrastructure (Docker/Helm), security, queues, caching, hidden rules, system behaviour.

**Regenerate:**

```bash
node documents/_build-backend-llrd.mjs
```

---

## Build order (greenfield team)

1. Backend Part 0 → II (architecture, auth, infra)  
2. Backend Parts III–VI + IV-B (domain APIs)  
3. Frontend Part I → II (global UX + runtime)  
4. Frontend Parts III–IX aligned to backend resources  
5. Backend Part VIII–IX + Frontend Part X (schema, security, QA traceability)

---

## Source trees

| Doc | Generated from |
|-----|----------------|
| UI LLRD | `a_uidocs/` (screens, behavior, overview) |
| Backend LLRD | `packages/*/server`, `packages/core-api/src`, `api/` |
