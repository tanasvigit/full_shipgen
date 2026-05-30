# FleetOps Phase 2 — Production hardening summary

## 1. Workflow depth summary

### Order detail (`OrderDetail.jsx`)
- **Tabs:** Overview (map, assignments, notes), Activity (timeline), Documents (files + upload)
- **Workflow panel:** Dispatch, Start, Advance activity, Complete, Cancel — with confirmation dialogs
- **Edit:** Full `OrderForm` in dialog via `updateOrder` + wrapped payloads
- **Optimistic updates:** Status changes via `useOptimisticMutation` with rollback on API failure
- **Guards:** `orderWorkflow.js` — transitions only offered for valid source statuses; terminal orders block edit

### API methods added (`fleetopsService`)
| Method | Endpoint pattern |
|--------|------------------|
| `startOrder` | `PATCH /orders/{id}/start` |
| `completeOrder` | `PATCH /orders/{id}/complete` |
| `getNextActivity` | `GET /orders/{id}/next-activity` |
| `updateOrderActivity` | `PATCH /orders/{id}/update-activity` |
| `getOrderEta` | `GET /orders/{id}/eta` |
| `listActivities` | `GET /activities` (fallback) |

## 2. Architecture improvements

| Layer | Purpose |
|-------|---------|
| `lib/fleetops/orderWorkflow.js` | Transition guards & labels |
| `lib/fleetops/mapActivity.js` | Normalize timeline from API or synthetic from timestamps |
| `lib/fleetops/scheduleConflicts.js` | Client-side shift overlap detection |
| `hooks/fleetops/useOrderDetail.js` | Single source for order detail state |
| `hooks/useOptimisticMutation.js` | Reusable optimistic + rollback |
| `hooks/fleetops/useFleetopsWarnings.js` | Cross-entity warnings |
| `hooks/uploads/useFileUpload.js` | Upload queue, progress, retry |
| `components/activity/*` | Reusable timeline |
| `components/files/FileUploader.jsx` | Drag/drop upload |
| `components/fleetops/orders/OrderWorkflowActions.jsx` | Confirmed lifecycle actions |

## 3. Upload system summary

- **Service:** `services/files.js` — `POST /files/upload`, `uploadBase64`, `downloadUrl`
- **UI:** `FileUploader` — drag/drop, progress, retry, type/size validation
- **Orders:** Upload on detail Documents tab; UUIDs included on `updateOrder` when saving edit dialog

## 4. Activity system summary

- **Sources:** `order.activities`, `activity_log`, `timeline`, or synthetic from `created_at` / `dispatched_at` / status
- **UI:** `ActivityTimeline` + `ActivityItem` — relative time, actor, status badges, icons by event type
- **Empty state:** Guided copy when no events

## 5. Scheduling improvements

- **Conflict detection:** `detectScheduleConflicts` before creating shift
- **Warnings UI:** `OperationalWarnings` in shift dialog
- **Utilization helper:** `driverUtilization` (hours per day, overload flag)
- **Documented gap:** Recurring templates / timezone — not in current schedule-items API

## 6. Relationship intelligence summary

`useFleetopsWarnings` surfaces:
- Inactive/offline driver on assignment
- Vehicle in maintenance / decommissioned
- Non-active fleet status
- Schedule overlap on new shift
- Expired document metadata (when provided)

## 7. UX hardening summary

- `PageLoader` + detail skeleton on order load
- `EmptyState` with retry/back on load failure
- `StickySaveBar` + `useUnsavedChangesGuard` for edit sessions
- `OperationalWarnings` banners
- Loading: map loader, timeline skeleton, form submit spinners
- Confirm dialogs for destructive/operational actions

## 8. Playwright expansion

- `e2e/fleetops/order-workflow.spec.ts` — detail tabs, edit dialog, dispatch confirm, schedule note
- Uses `getByTestId`, skips gracefully when no data

## 9. Backend gaps discovered

| Feature | Status |
|---------|--------|
| Recurring schedule templates | Not exposed on `/schedule-items` |
| Timezone on schedule items | Assumed local hours only |
| Dedicated order activity feed | May need `GET /activities?order=` — fallback to embedded/synthetic |
| `arrived` / `failed` / `delayed` | Activity-flow driven; use `update-activity` not flat status PATCH |
| File attach to order | Upload works; persist via `order.files[]` on update — verify tenant returns files on GET |

## 10. Technical debt eliminated

- Removed placeholder toasts on driver/vehicle/place edit (prior phase)
- Centralized order lifecycle actions (no duplicate dispatch/cancel in header only)
- Shared activity normalization (no per-page ad hoc timelines)
- Shared upload hook (no one-off FormData in forms)
