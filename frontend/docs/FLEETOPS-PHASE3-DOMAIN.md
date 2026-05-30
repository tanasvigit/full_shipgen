# FleetOps Phase 3 — Domain Consistency & Workflow Maturity

Phase 3 shifts FleetOps from rich operational UI toward a **cohesive workflow platform** with centralized domain logic, mutation orchestration, and decomposed detail surfaces.

## 1. Workflow engine architecture

```
frontend/src/domain/fleetops/
  status.js                 # normalizeStatus, terminal states
  transitions/orderTransitions.js   # declarative transition catalog
  guards/orderGuards.js     # canEditOrder, getAvailableTransitions
  workflows/orderWorkflow.js # executeOrderTransition, optimistic patches
  policies/assignmentPolicy.js
  warnings/evaluateWarnings.js, scheduleRules.js
  events/types.js, registry.js, transformers.js
  compliance/rules.js, evaluateCompliance.js
  mutations/orchestrator.js
  cache/keys.js, store.js
  documents/categories.js
  index.js                  # public barrel
```

**Flow:** UI → guards (eligibility) → transitions (catalog) → workflow executor (API) → cache invalidation → refetch.

Legacy imports (`@/lib/fleetops/orderWorkflow`, `mapActivity`, `scheduleConflicts`) re-export from domain for gradual migration.

## 2. Centralized domain logic

| Concern | Location |
|--------|----------|
| Allowed transitions | `ORDER_TRANSITIONS` |
| Terminal / edit guards | `orderGuards.js`, `status.js` |
| Warnings | `evaluateOperationalWarnings` |
| Assignment policy | `assignmentPolicy.js` |
| Schedule conflicts | `scheduleRules.js` |
| Compliance | `evaluateCompliance.js` |
| Events | `normalizeOperationalEvents`, `EVENT_REGISTRY` |

`useFleetopsWarnings` now composes domain warnings + compliance issues.

## 3. Mutation orchestration

`mutations/orchestrator.js`:

- Per-scope serialized queue (prevents concurrent race on same order)
- In-flight deduplication by `scope:id:method`
- Optimistic apply / rollback
- Cache invalidation hooks
- Toast on success/failure

`useMutationOrchestrator` + `useOrderDetail.runOrderTransition` use the orchestrator instead of ad-hoc `useOptimisticMutation` for workflow actions.

## 4. Detail page decomposition

Order detail split under `components/fleetops/orders/detail/`:

- `workflow/OrderWorkflowPanel`
- `sections/OrderOverviewSection`
- `panels/OrderRoutePanel`
- `assignments/OrderAssignmentsPanel`
- `timeline/OrderActivityPanel`
- `documents/OrderDocumentsPanel`
- `CollapsibleSection` (progressive disclosure)

`OrderDetail.jsx` is a thin orchestrator (~200 lines).

Driver/Vehicle detail: `HealthBanner` + compliance evaluation (fleet detail can follow same pattern).

## 5. Compliance / health

- `domain/fleetops/compliance/` — license/insurance/POD rules
- `components/fleetops/health/HealthBanner.jsx` — unified surface on order/driver/vehicle detail

Severity: `info` | `warning` | `danger` | `blocking` with optional remediation text.

## 6. Document ecosystem

- `documents/categories.js` — POD, compliance, manifest, invoice taxonomy
- `AttachmentList` — grouped list, pending/failed states
- `DocumentViewer` — category chip (extensible preview)

Order documents tab uses categorized attachments + uploader.

## 7. Cache consistency

- `fleetopsCacheKeys` — canonical key factory
- `fleetopsCache` — generation bump + subscriber bus
- `invalidateAfterOrderMutation(orderId)` — list + detail + activity + files

`useOrderDetail` subscribes to cache bumps for the active order id.

## 8. Operational UX

- Sticky workflow panel
- Collapsible detail sections
- Health banner above workflow
- Domain-backed warnings (no duplicate hook logic)

Keyboard/command palette deferred — structure supports quick actions on workflow panel.

## 9. Playwright workflow coverage

| Spec | Scenarios |
|------|-----------|
| `order-workflow.spec.ts` | Tabs, edit dialog, dispatch confirm |
| `order-workflow-chains.spec.ts` | Terminal vs editable, confirm cancel, activity/documents chain, refresh stability |

Uses `waitForApiSettle` and test ids — no arbitrary `sleep`.

## 10. Technical debt eliminated

- Duplicated workflow rules removed from page-level switch (central `executeOrderTransition`)
- Duplicate activity normalization (`mapActivity` → domain events)
- Duplicate schedule conflict logic (lib → domain re-export)
- Scattered warnings consolidated in `evaluateOperationalWarnings`
- God-component OrderDetail decomposed

## Remaining (Phase 4 candidates)

- Fleet detail health + documents panel
- Full `useOptimisticMutation` migration for non-order entities
- Backend-driven compliance fields (license/insurance dates)
- PDF/image preview in `DocumentViewer`
- Command palette / keyboard shortcuts
- React Query adapter on top of `fleetopsCache` (optional)

## Verification

```bash
cd frontend
npm run build
npm run test:e2e:fleetops   # requires e2e/.env auth
```
