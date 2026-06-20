"""Authentication and RBAC tests."""

from __future__ import annotations

import os
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from auth_rbac import (
    AuthContext,
    MOD_GATE,
    MOD_QUEUE,
    PERM_FLOW_CHECK_IN,
    Role,
    check_route_module_access,
    get_current_user,
    has_permission,
    permissions_for_role,
    require_permission,
    require_role,
)
from services.auth_service import create_access_token, decode_access_token, hash_password, verify_password


def test_password_hash_roundtrip():
    hashed = hash_password("Shipgen@Yms2026!")
    assert verify_password("Shipgen@Yms2026!", hashed)
    assert not verify_password("wrong", hashed)


def test_shipgen_password_policy():
    from services.password_policy import validate_password

    validate_password("Shipgen@Yms2026!")
    with pytest.raises(ValueError):
        validate_password("short1!")
    with pytest.raises(ValueError):
        validate_password("alllowercase1!")


def test_jwt_encode_decode():
    with patch.dict(os.environ, {"JWT_SECRET_KEY": "this-is-a-strong-test-jwt-secret-key-123"}, clear=False):
        token = create_access_token(
            user_id="u1",
            username="admin",
            role="yard_admin",
            permissions=["*"],
        )
        payload = decode_access_token(token)
        assert payload["user_id"] == "u1"
        assert payload["role"] == "yard_admin"
        assert "*" in payload["permissions"]


def test_yard_admin_has_all_permissions():
    ctx = AuthContext(
        user_id="1",
        username="admin",
        role=Role.YARD_ADMIN.value,
        permissions={"*"},
    )
    assert has_permission(ctx, MOD_GATE)
    assert has_permission(ctx, PERM_FLOW_CHECK_IN)


def test_gate_operator_permissions():
    perms = permissions_for_role(Role.GATE_OPERATOR.value)
    ctx = AuthContext(
        user_id="2",
        username="gate",
        role=Role.GATE_OPERATOR.value,
        permissions=perms,
    )
    assert has_permission(ctx, MOD_GATE)
    assert has_permission(ctx, PERM_FLOW_CHECK_IN)
    assert not has_permission(ctx, MOD_QUEUE)
    assert not has_permission(ctx, "module.docks")
    assert not has_permission(ctx, "module.operations_dashboard")


def test_yard_manager_cannot_access_gate_module():
    perms = permissions_for_role(Role.YARD_MANAGER.value)
    ctx = AuthContext(
        user_id="8",
        username="manager",
        role=Role.YARD_MANAGER.value,
        permissions=perms,
    )
    assert "module.gate" not in perms
    assert not has_permission(ctx, MOD_GATE)


def test_view_only_appointments():
    ctx = AuthContext(
        user_id="3",
        username="gate",
        role=Role.GATE_OPERATOR.value,
        permissions=permissions_for_role(Role.GATE_OPERATOR.value),
    )
    assert has_permission(ctx, "module.appointments")
    assert not has_permission(ctx, "appointment.write")


def test_dock_supervisor_cannot_access_gate_module():
    ctx = AuthContext(
        user_id="4",
        username="supervisor",
        role=Role.DOCK_SUPERVISOR.value,
        permissions=permissions_for_role(Role.DOCK_SUPERVISOR.value),
    )
    assert not has_permission(ctx, MOD_GATE)
    assert has_permission(ctx, "module.docks")


def test_route_module_guard_blocks_unauthorized():
    ctx = AuthContext(
        user_id="5",
        username="gate",
        role=Role.GATE_OPERATOR.value,
        permissions=permissions_for_role(Role.GATE_OPERATOR.value),
    )
    with pytest.raises(HTTPException) as exc:
        check_route_module_access("/api/queue/entries", ctx)
    assert exc.value.status_code == 403


def test_route_module_guard_allows_authorized():
    ctx = AuthContext(
        user_id="6",
        username="coord",
        role=Role.YARD_COORDINATOR.value,
        permissions=permissions_for_role(Role.YARD_COORDINATOR.value),
    )
    check_route_module_access("/api/queue/entries", ctx)


def test_get_current_user_requires_auth_without_dev_override():
    async def run():
        with patch.dict(os.environ, {"ENABLE_DEV_ROLE_OVERRIDE": "false"}, clear=False):
            with pytest.raises(HTTPException) as exc:
                await get_current_user(credentials=None, x_yms_role=None, x_yms_user=None)
            assert exc.value.status_code == 401

    import asyncio
    asyncio.run(run())


def test_get_current_user_dev_override():
    async def run():
        with patch.dict(os.environ, {"ENABLE_DEV_ROLE_OVERRIDE": "true", "YMS_DEFAULT_ROLE": "gate_operator"}, clear=False):
            ctx = await get_current_user(credentials=None, x_yms_role="gate", x_yms_user="dev")
            assert ctx.role == Role.GATE_OPERATOR.value

    import asyncio
    asyncio.run(run())


def test_require_permission_blocks():
    async def run():
        guard = require_permission(PERM_FLOW_CHECK_IN)
        ctx = AuthContext(
            user_id="7",
            username="coord",
            role=Role.YARD_COORDINATOR.value,
            permissions=permissions_for_role(Role.YARD_COORDINATOR.value),
        )
        with pytest.raises(HTTPException):
            await guard(ctx=ctx)

    import asyncio
    asyncio.run(run())


def test_require_role_admin_only():
    async def run():
        guard = require_role(Role.YARD_ADMIN.value)
        admin_ctx = AuthContext("1", "admin", Role.YARD_ADMIN.value, {"*"})
        await guard(ctx=admin_ctx)
        gate_ctx = AuthContext("2", "gate", Role.GATE_OPERATOR.value, permissions_for_role(Role.GATE_OPERATOR.value))
        with pytest.raises(HTTPException):
            await guard(ctx=gate_ctx)

    import asyncio
    asyncio.run(run())


def test_authenticate_user_success():
    async def run():
        from services.auth_service import authenticate_user

        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(
            return_value={
                "id": uuid.uuid4(),
                "username": "yard_admin",
                "password_hash": hash_password("Shipgen@Yms2026!"),
                "display_name": "Admin",
                "is_active": True,
                "roles": ["yard_admin"],
            }
        )
        mock_pool = MagicMock()
        mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)

        with patch("services.auth_service.get_pool", return_value=mock_pool):
            with patch(
                "services.auth_service.get_user_permissions_for_role",
                new=AsyncMock(return_value=["*"]),
            ):
                user = await authenticate_user("yard.admin@shipgen.demo", "Shipgen@Yms2026!")
        assert user is not None
        assert user["role"] == "yard_admin"

    import asyncio
    asyncio.run(run())
