# Resource Gating Workflow

## Business rule

Loading cannot start until **all** resources are assigned:

- Dock
- Labor
- Equipment

Backend enforces this on every `POST /flow/vehicles/{id}/transition` with `status: LOADING`.

## Status flow

```
DOCK_ASSIGNED
      ↓ (automatic readiness evaluation)
RESOURCE_PENDING  ←→  READY_FOR_LOADING
      ↓ (operator starts loading — only when READY_FOR_LOADING + all resources)
   LOADING
```

| Status | Meaning |
|--------|---------|
| `DOCK_ASSIGNED` | Vehicle assigned to dock (brief; auto-sync moves to pending/ready) |
| `RESOURCE_PENDING` | One or more resources missing |
| `READY_FOR_LOADING` | Dock + labor + equipment all assigned |
| `LOADING` | Loading in progress |

## Backend

| Component | Location |
|-----------|----------|
| Unified validator | `services/resource_gating_service.py` → `validate_resource_readiness_for_loading()` |
| Transition gate | `services/yms_service.py` → `transition_vehicle_status()` when `status == LOADING` |
| Auto sync | `sync_vehicle_readiness_status()` after dock/labor/equipment assign or release |
| Readiness API | `GET /flow/readiness/vehicle/{vehicle_id}` |
| Blocked event | `RESOURCE_GATE_BLOCKED` yard event with missing resources |
| Readiness update event | `RESOURCE_READINESS_UPDATED` |

### 409 response when blocked

```json
{
  "detail": {
    "error": "RESOURCE_GATING_FAILED",
    "message": "Cannot start loading.",
    "missing": ["labor", "equipment"]
  }
}
```

## Frontend

| Screen | Behavior |
|--------|----------|
| `DockDrawer` | Resource Readiness panel; Start Loading disabled when not ready |
| `LoadingOpDrawer` | Fetches readiness; Start Loading/Unloading disabled when not ready |
| `AppointmentDrawer` | In Progress disabled until ready; shows missing resources |
| Shared UI | `ResourceReadinessPanel.jsx`, `fetchResourceReadiness()` / `checkResourceReadiness` |

## Test scenarios

| Scenario | Dock | Labor | Equipment | Loading |
|----------|------|-------|-----------|---------|
| A | ✓ | ✗ | ✗ | Blocked |
| B | ✓ | ✓ | ✗ | Blocked |
| C | ✓ | ✗ | ✓ | Blocked |
| D | ✓ | ✓ | ✓ | Allowed |

Run unit tests: `cd yard_frontend/backend && python -m pytest tests/test_resource_gating.py -v`
