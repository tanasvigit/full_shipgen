"""Production JWT auth/RBAC with dev header compatibility layer."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable

from fastapi import Depends, Header, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services.auth_service import decode_access_token, get_user_permissions_for_role

_bearer = HTTPBearer(auto_error=False)


class Role(str, Enum):
    YARD_ADMIN = "yard_admin"
    YARD_MANAGER = "yard_manager"
    GATE_OPERATOR = "gate_operator"
    YARD_COORDINATOR = "yard_coordinator"
    DOCK_SUPERVISOR = "dock_supervisor"


ALL_ROLES = {r.value for r in Role}

LEGACY_ROLE_MAP: dict[str, str] = {
    "admin": Role.YARD_ADMIN.value,
    "operations": Role.YARD_MANAGER.value,
    "gate": Role.GATE_OPERATOR.value,
    "supervisor": Role.DOCK_SUPERVISOR.value,
    "read_only": Role.YARD_COORDINATOR.value,
}

MOD_CONTROL_TOWER = "module.control_tower"
MOD_APPOINTMENTS = "module.appointments"
MOD_APPOINTMENTS_VIEW = "module.appointments.view"
MOD_GATE = "module.gate"
MOD_QUEUE = "module.queue"
MOD_YARD_MAP = "module.yard_map"
MOD_YARD_MAP_VIEW = "module.yard_map.view"
MOD_VEHICLES = "module.vehicles"
MOD_DOCKS = "module.docks"
MOD_LABOR = "module.labor"
MOD_EQUIPMENT = "module.equipment"
MOD_LOADING = "module.loading"
MOD_DETENTION = "module.detention"
MOD_OPS_DASHBOARD = "module.operations_dashboard"
MOD_DELAY_ANALYSIS = "module.delay_analysis"
MOD_KPIS = "module.kpis"
MOD_REPORTS = "module.reports"
MOD_USER_MGMT = "module.user_management"
MOD_ROLE_MGMT = "module.role_management"
MOD_SETTINGS = "module.settings"
MOD_AI = "module.ai"

PERM_VEHICLE_WRITE = "vehicle.write"
PERM_APPOINTMENT_WRITE = "appointment.write"
PERM_QUEUE_WRITE = "queue.write"
PERM_DOCK_WRITE = "dock.write"
PERM_FLOW_CHECK_IN = "flow.check_in"
PERM_FLOW_CALL = "flow.call"
PERM_FLOW_ASSIGN_DOCK = "flow.assign_dock"
PERM_FLOW_VEHICLE_TRANSITION = "flow.vehicle_transition"
PERM_DETENTION_WRITE = "detention.write"
PERM_EQUIPMENT_WRITE = "equipment.write"
PERM_LABOR_WRITE = "labor.write"
PERM_YARD_EVENT_WRITE = "yard_event.write"
PERM_YARD_ZONE_WRITE = "yard_zone.write"
PERM_REPORTS_VIEW = "reports.view"
PERM_REPORTS_EXPORT = "reports.export"
PERM_GATE_APPROVE_ENTRY = "gate.approve_entry"
PERM_GATE_REJECT_ENTRY = "gate.reject_entry"
PERM_GATE_VERIFY_EXIT = "gate.verify_exit"
PERM_GATE_GATE_OUT = "gate.gate_out"
PERM_DOCK_VIEW_AVAILABILITY = "dock.view_availability"
PERM_LOADING_START = "loading.start"
PERM_LOADING_COMPLETE = "loading.complete"
PERM_LOADING_MANAGE_EXCEPTIONS = "loading.manage_exceptions"

ALL_PERMISSIONS: list[tuple[str, str, str]] = [
    (MOD_CONTROL_TOWER, "Control Tower", "module"),
    (MOD_APPOINTMENTS, "Appointments (full)", "module"),
    (MOD_APPOINTMENTS_VIEW, "Appointments (view)", "module"),
    (MOD_GATE, "Gate Management", "module"),
    (MOD_QUEUE, "Virtual Queue", "module"),
    (MOD_YARD_MAP, "Yard Map (full)", "module"),
    (MOD_YARD_MAP_VIEW, "Yard Map (view)", "module"),
    (MOD_VEHICLES, "Vehicle Operations Monitor", "module"),
    (MOD_DOCKS, "Dock Management", "module"),
    (MOD_LABOR, "Labor Management", "module"),
    (MOD_EQUIPMENT, "Equipment Management", "module"),
    (MOD_LOADING, "Loading Operations", "module"),
    (MOD_DETENTION, "Detention Management", "module"),
    (MOD_OPS_DASHBOARD, "Operations Dashboard", "module"),
    (MOD_DELAY_ANALYSIS, "Delay Analysis", "module"),
    (MOD_KPIS, "Executive KPIs", "module"),
    (MOD_REPORTS, "Reports", "module"),
    (MOD_USER_MGMT, "User Management", "module"),
    (MOD_ROLE_MGMT, "Role Management", "module"),
    (MOD_SETTINGS, "System Settings", "module"),
    (MOD_AI, "AI Recommendations", "module"),
    (PERM_VEHICLE_WRITE, "Write vehicles", "action"),
    (PERM_APPOINTMENT_WRITE, "Write appointments", "action"),
    (PERM_QUEUE_WRITE, "Manage queue", "action"),
    (PERM_DOCK_WRITE, "Write docks", "action"),
    (PERM_FLOW_CHECK_IN, "Check in vehicles", "action"),
    (PERM_FLOW_CALL, "Call vehicles", "action"),
    (PERM_FLOW_ASSIGN_DOCK, "Assign dock", "action"),
    (PERM_FLOW_VEHICLE_TRANSITION, "Transition vehicle status", "action"),
    (PERM_DETENTION_WRITE, "Write detention", "action"),
    (PERM_EQUIPMENT_WRITE, "Write equipment", "action"),
    (PERM_LABOR_WRITE, "Write labor", "action"),
    (PERM_YARD_EVENT_WRITE, "Write yard events", "action"),
    (PERM_YARD_ZONE_WRITE, "Write yard zones", "action"),
    (PERM_REPORTS_VIEW, "View reports", "action"),
    (PERM_REPORTS_EXPORT, "Export reports", "action"),
    (PERM_GATE_APPROVE_ENTRY, "Approve entry", "action"),
    (PERM_GATE_REJECT_ENTRY, "Reject entry", "action"),
    (PERM_GATE_VERIFY_EXIT, "Verify exit", "action"),
    (PERM_GATE_GATE_OUT, "Gate out", "action"),
    (PERM_DOCK_VIEW_AVAILABILITY, "View dock availability", "action"),
    (PERM_LOADING_START, "Start loading", "action"),
    (PERM_LOADING_COMPLETE, "Complete loading", "action"),
    (PERM_LOADING_MANAGE_EXCEPTIONS, "Manage loading exceptions", "action"),
]

ROLE_PERMISSIONS: dict[str, set[str]] = {
    Role.YARD_ADMIN.value: {"*"},
    Role.YARD_MANAGER.value: {
        MOD_CONTROL_TOWER,
        MOD_APPOINTMENTS,
        MOD_QUEUE,
        MOD_YARD_MAP,
        MOD_VEHICLES,
        MOD_DOCKS,
        MOD_LABOR,
        MOD_EQUIPMENT,
        MOD_LOADING,
        MOD_DETENTION,
        MOD_OPS_DASHBOARD,
        MOD_DELAY_ANALYSIS,
        MOD_KPIS,
        MOD_REPORTS,
        MOD_AI,
        PERM_VEHICLE_WRITE,
        PERM_APPOINTMENT_WRITE,
        PERM_QUEUE_WRITE,
        PERM_DOCK_WRITE,
        PERM_FLOW_CHECK_IN,
        PERM_FLOW_CALL,
        PERM_FLOW_ASSIGN_DOCK,
        PERM_FLOW_VEHICLE_TRANSITION,
        PERM_DETENTION_WRITE,
        PERM_EQUIPMENT_WRITE,
        PERM_LABOR_WRITE,
        PERM_YARD_EVENT_WRITE,
        PERM_YARD_ZONE_WRITE,
        PERM_REPORTS_VIEW,
        PERM_REPORTS_EXPORT,
        PERM_DOCK_VIEW_AVAILABILITY,
        PERM_LOADING_START,
        PERM_LOADING_COMPLETE,
        PERM_LOADING_MANAGE_EXCEPTIONS,
    },
    Role.GATE_OPERATOR.value: {
        MOD_GATE,
        MOD_VEHICLES,
        MOD_APPOINTMENTS_VIEW,
        MOD_YARD_MAP_VIEW,
        PERM_FLOW_CHECK_IN,
        PERM_FLOW_VEHICLE_TRANSITION,
        PERM_YARD_EVENT_WRITE,
        PERM_GATE_APPROVE_ENTRY,
        PERM_GATE_REJECT_ENTRY,
        PERM_GATE_VERIFY_EXIT,
        PERM_GATE_GATE_OUT,
    },
    Role.YARD_COORDINATOR.value: {
        MOD_QUEUE,
        MOD_YARD_MAP,
        MOD_VEHICLES,
        MOD_LABOR,
        MOD_EQUIPMENT,
        MOD_APPOINTMENTS_VIEW,
        PERM_QUEUE_WRITE,
        PERM_FLOW_CALL,
        PERM_YARD_ZONE_WRITE,
        PERM_DOCK_VIEW_AVAILABILITY,
        PERM_LABOR_WRITE,
        PERM_EQUIPMENT_WRITE,
    },
    Role.DOCK_SUPERVISOR.value: {
        MOD_DOCKS,
        MOD_QUEUE,
        MOD_LABOR,
        MOD_EQUIPMENT,
        MOD_LOADING,
        MOD_VEHICLES,
        MOD_YARD_MAP,
        PERM_DOCK_WRITE,
        PERM_LABOR_WRITE,
        PERM_EQUIPMENT_WRITE,
        PERM_FLOW_ASSIGN_DOCK,
        PERM_FLOW_VEHICLE_TRANSITION,
        PERM_YARD_EVENT_WRITE,
        PERM_LOADING_START,
        PERM_LOADING_COMPLETE,
        PERM_LOADING_MANAGE_EXCEPTIONS,
        PERM_DOCK_VIEW_AVAILABILITY,
    },
}

ROUTE_MODULE_GUARDS: list[tuple[str, str]] = [
    ("/api/admin/users", MOD_USER_MGMT),
    ("/api/admin/roles", MOD_ROLE_MGMT),
    ("/api/admin/permissions", MOD_ROLE_MGMT),
    ("/api/gate", MOD_GATE),
    ("/api/queue", MOD_QUEUE),
    ("/api/yard", MOD_YARD_MAP),
    ("/api/loading-operations", MOD_LOADING),
    ("/api/control-tower", MOD_CONTROL_TOWER),
    ("/api/reports", MOD_REPORTS),
    ("/api/vehicles", MOD_VEHICLES),
    ("/api/appointments", MOD_APPOINTMENTS),
    ("/api/queue-entries", MOD_QUEUE),
    ("/api/docks", MOD_DOCKS),
    ("/api/equipment", MOD_EQUIPMENT),
    ("/api/labor", MOD_LABOR),
    ("/api/detention", MOD_DETENTION),
    ("/api/yard-events", MOD_VEHICLES),
    ("/api/flow", MOD_VEHICLES),
]


@dataclass
class AuthContext:
    user_id: str
    username: str
    role: str
    permissions: set[str] = field(default_factory=set)
    impersonating: bool = False


def _dev_override_enabled() -> bool:
    return os.environ.get("ENABLE_DEV_ROLE_OVERRIDE", "false").lower() in ("1", "true", "yes")


def _normalize_role(raw: str | None) -> str:
    role_str = (raw or "").strip().lower()
    if role_str in ALL_ROLES:
        return role_str
    if role_str in LEGACY_ROLE_MAP:
        return LEGACY_ROLE_MAP[role_str]
    default = os.environ.get("YMS_DEFAULT_ROLE", Role.YARD_MANAGER.value)
    if default in LEGACY_ROLE_MAP:
        default = LEGACY_ROLE_MAP[default]
    if default not in ALL_ROLES:
        default = Role.YARD_MANAGER.value
    return default


def has_permission(ctx: AuthContext, permission: str) -> bool:
    perms = ctx.permissions
    if "*" in perms:
        return True
    if permission in perms:
        return True
    if permission == MOD_APPOINTMENTS and MOD_APPOINTMENTS_VIEW in perms:
        return True
    if permission == MOD_YARD_MAP and MOD_YARD_MAP_VIEW in perms:
        return True
    aliases = {
        PERM_GATE_APPROVE_ENTRY: {PERM_FLOW_CHECK_IN},
        PERM_GATE_REJECT_ENTRY: {PERM_FLOW_VEHICLE_TRANSITION},
        PERM_GATE_VERIFY_EXIT: {PERM_FLOW_VEHICLE_TRANSITION},
        PERM_GATE_GATE_OUT: {PERM_FLOW_VEHICLE_TRANSITION},
        PERM_LOADING_MANAGE_EXCEPTIONS: {PERM_YARD_EVENT_WRITE},
        PERM_LOADING_START: {PERM_YARD_EVENT_WRITE},
        PERM_LOADING_COMPLETE: {PERM_YARD_EVENT_WRITE},
    }
    for alt in aliases.get(permission, set()):
        if alt in perms:
            return True
    return False


def permissions_for_role(role: str) -> set[str]:
    return set(ROLE_PERMISSIONS.get(role, set()))


def _auth_from_jwt_payload(payload: dict) -> AuthContext:
    perms = set(payload.get("permissions") or [])
    return AuthContext(
        user_id=str(payload.get("user_id") or payload.get("sub")),
        username=str(payload.get("username") or "unknown"),
        role=str(payload.get("role") or Role.YARD_MANAGER.value),
        permissions=perms,
        impersonating=bool(payload.get("impersonating")),
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    x_yms_role: str | None = Header(None, alias="X-YMS-Role"),
    x_yms_user: str | None = Header(None, alias="X-YMS-User"),
) -> AuthContext:
    if credentials and credentials.scheme.lower() == "bearer":
        payload = decode_access_token(credentials.credentials)
        ctx = _auth_from_jwt_payload(payload)
        # Keep DB as source of truth so role edits apply immediately.
        try:
            ctx.permissions = set(await get_user_permissions_for_role(ctx.role))
        except Exception:
            # Fallback to token claims if DB is unavailable mid-request.
            pass
        return ctx

    if _dev_override_enabled():
        role = _normalize_role(x_yms_role)
        user_id = (x_yms_user or "dev-user").strip() or "dev-user"
        return AuthContext(
            user_id=user_id,
            username=user_id,
            role=role,
            permissions=permissions_for_role(role),
        )

    raise HTTPException(status_code=401, detail="Authentication required")


async def get_auth_context(
    ctx: AuthContext = Depends(get_current_user),
) -> AuthContext:
    return ctx


def require_permission(permission: str) -> Callable:
    async def _guard(ctx: AuthContext = Depends(get_current_user)) -> AuthContext:
        if not has_permission(ctx, permission):
            raise HTTPException(
                status_code=403,
                detail=f"Role '{ctx.role}' is not allowed to perform this action ({permission})",
            )
        return ctx

    return _guard


def require_role(*roles: str) -> Callable:
    allowed = set(roles)

    async def _guard(ctx: AuthContext = Depends(get_current_user)) -> AuthContext:
        if ctx.role not in allowed and "*" not in ctx.permissions:
            raise HTTPException(
                status_code=403,
                detail=f"Role '{ctx.role}' is not allowed for this resource",
            )
        return ctx

    return _guard


def require_module(permission: str) -> Callable:
    return require_permission(permission)


def check_route_module_access(path: str, ctx: AuthContext) -> None:
    for prefix, module_perm in ROUTE_MODULE_GUARDS:
        if path.startswith(prefix):
            if not has_permission(ctx, module_perm):
                raise HTTPException(
                    status_code=403,
                    detail=f"Role '{ctx.role}' cannot access module ({module_perm})",
                )
            return
