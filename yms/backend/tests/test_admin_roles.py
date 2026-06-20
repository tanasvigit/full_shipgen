"""Admin role management API and seed persistence tests."""

from __future__ import annotations

import asyncio
import os
import uuid
from unittest.mock import patch

import pytest
from fastapi import HTTPException
from starlette.testclient import TestClient

from auth_rbac import AuthContext
from db import get_pool, init_db
from routers.admin import list_admin_roles, update_role
from schemas import AdminRoleUpdateIn
from services.auth_service import authenticate_user, create_access_token

from services.demo_credentials import DEFAULT_DEMO_USERS, YMS_DEMO_PASSWORD

ADMIN_EMAIL = DEFAULT_DEMO_USERS[0]["email"]
GATE_EMAIL = next(u["email"] for u in DEFAULT_DEMO_USERS if u["role"] == "gate_operator")

VALID_SECRET = "this-is-a-strong-test-jwt-secret-key-123"


def _admin_context(user: dict) -> AuthContext:
    return AuthContext(
        user_id=user["user_id"],
        username=user["username"],
        role=user["role"],
        permissions=set(user["permissions"]),
    )


def test_get_admin_roles_returns_seeded_roles():
    async def run() -> None:
        await init_db()
        user = await authenticate_user(ADMIN_EMAIL, YMS_DEMO_PASSWORD)
        assert user is not None
        roles = await list_admin_roles(_ctx=_admin_context(user))
        codes = {role.code for role in roles}
        assert "yard_admin" in codes
        assert "dock_supervisor" in codes
        for role in roles:
            assert isinstance(role.permissions, list)
            assert role.id

    asyncio.run(run())


def test_put_admin_role_updates_permissions_and_description():
    async def run() -> None:
        await init_db()
        user = await authenticate_user(ADMIN_EMAIL, YMS_DEMO_PASSWORD)
        assert user is not None
        ctx = _admin_context(user)
        roles = await list_admin_roles(_ctx=ctx)
        target = next(role for role in roles if role.code == "dock_supervisor")
        original_description = target.description
        original_permissions = list(target.permissions)

        custom_description = f"Custom dock profile {uuid.uuid4().hex[:8]}"
        custom_permissions = sorted(set(original_permissions + ["module.reports"]))

        updated = await update_role(
            target.id,
            AdminRoleUpdateIn(description=custom_description, permissions=custom_permissions),
            _ctx=ctx,
        )
        assert updated.description == custom_description
        assert "module.reports" in updated.permissions

        listed = await list_admin_roles(_ctx=ctx)
        persisted = next(role for role in listed if role.code == "dock_supervisor")
        assert persisted.description == custom_description
        assert "module.reports" in persisted.permissions

        await update_role(
            target.id,
            AdminRoleUpdateIn(description=original_description, permissions=original_permissions),
            _ctx=ctx,
        )

    asyncio.run(run())


def test_role_edits_survive_init_db_restart():
    async def run() -> None:
        await init_db()
        pool = get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT r.id, r.description,
                       COALESCE(array_agg(p.code ORDER BY p.code) FILTER (WHERE p.code IS NOT NULL), '{}') AS permissions
                FROM roles r
                LEFT JOIN role_permissions rp ON rp.role_id = r.id
                LEFT JOIN permissions p ON p.id = rp.permission_id
                WHERE r.code = 'yard_coordinator'
                GROUP BY r.id
                """
            )
            assert row is not None
            role_id = str(row["id"])
            original_description = row["description"]
            original_permissions = list(row["permissions"] or [])

        user = await authenticate_user(ADMIN_EMAIL, YMS_DEMO_PASSWORD)
        assert user is not None
        ctx = _admin_context(user)
        custom_description = f"Coordinator custom {uuid.uuid4().hex[:8]}"
        custom_permissions = sorted(set(original_permissions + ["module.reports"]))

        await update_role(
            role_id,
            AdminRoleUpdateIn(description=custom_description, permissions=custom_permissions),
            _ctx=ctx,
        )

        await init_db()

        async with pool.acquire() as conn:
            after = await conn.fetchrow(
                """
                SELECT r.description,
                       COALESCE(array_agg(p.code ORDER BY p.code) FILTER (WHERE p.code IS NOT NULL), '{}') AS permissions
                FROM roles r
                LEFT JOIN role_permissions rp ON rp.role_id = r.id
                LEFT JOIN permissions p ON p.id = rp.permission_id
                WHERE r.id = $1::uuid
                GROUP BY r.id, r.description
                """,
                role_id,
            )
            assert after is not None
            assert after["description"] == custom_description
            assert "module.reports" in list(after["permissions"] or [])

        await update_role(
            role_id,
            AdminRoleUpdateIn(description=original_description, permissions=original_permissions),
            _ctx=ctx,
        )

    asyncio.run(run())


def test_put_admin_role_rejects_unknown_permission():
    async def run() -> None:
        await init_db()
        user = await authenticate_user(ADMIN_EMAIL, YMS_DEMO_PASSWORD)
        assert user is not None
        ctx = _admin_context(user)
        roles = await list_admin_roles(_ctx=ctx)
        target = next(role for role in roles if role.code == "gate_operator")

        with pytest.raises(HTTPException) as exc:
            await update_role(
                target.id,
                AdminRoleUpdateIn(description=target.description, permissions=["not.a.real.permission"]),
                _ctx=ctx,
            )
        assert exc.value.status_code == 400

    asyncio.run(run())


def test_get_admin_roles_requires_admin_permission():
    with patch.dict(os.environ, {"JWT_SECRET_KEY": VALID_SECRET}, clear=False):
        async def get_token() -> str:
            await init_db()
            user = await authenticate_user(GATE_EMAIL, YMS_DEMO_PASSWORD)
            assert user is not None
            return create_access_token(
                user_id=user["user_id"],
                username=user["username"],
                role=user["role"],
                permissions=user["permissions"],
            )

        token = asyncio.run(get_token())
        from server import app

        with TestClient(app) as client:
            response = client.get(
                "/api/admin/roles",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 403


def test_admin_roles_http_endpoints():
    with patch.dict(os.environ, {"JWT_SECRET_KEY": VALID_SECRET}, clear=False):
        async def get_token() -> str:
            await init_db()
            user = await authenticate_user(ADMIN_EMAIL, YMS_DEMO_PASSWORD)
            assert user is not None
            return create_access_token(
                user_id=user["user_id"],
                username=user["username"],
                role=user["role"],
                permissions=user["permissions"],
            )

        token = asyncio.run(get_token())
        from server import app

        with TestClient(app) as client:
            response = client.get(
                "/api/admin/roles",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 200
            assert any(role["code"] == "yard_admin" for role in response.json())
