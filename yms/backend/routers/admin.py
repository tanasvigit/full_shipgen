from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException

from auth_rbac import MOD_ROLE_MGMT, MOD_USER_MGMT, AuthContext, require_permission
from db import get_pool
from schemas import (
    AdminRoleOut,
    AdminRoleUpdateIn,
    AdminUserCreateIn,
    AdminUserOut,
    AdminUserUpdateIn,
    PermissionOut,
)
from services.auth_service import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[AdminUserOut])
async def list_admin_users(_ctx: AuthContext = Depends(require_permission(MOD_USER_MGMT))):
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT u.id, u.display_name, u.username, u.email, u.is_active,
                   COALESCE(r.code, 'yard_manager') AS role_code
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            ORDER BY u.created_at ASC
            """
        )
    return [
        AdminUserOut(
            id=str(r["id"]),
            full_name=r["display_name"] or r["username"],
            username=r["username"],
            email=r["email"],
            role=r["role_code"],
            status="active" if r["is_active"] else "inactive",
        )
        for r in rows
    ]


@router.post("/users", response_model=AdminUserOut)
async def create_admin_user(
    body: AdminUserCreateIn,
    _ctx: AuthContext = Depends(require_permission(MOD_USER_MGMT)),
):
    role_code = body.role.strip().lower()
    username = body.username.strip().lower()
    email = body.email.strip().lower() if body.email else None
    pool = get_pool()
    async with pool.acquire() as conn:
        role = await conn.fetchrow("SELECT id, code FROM roles WHERE code = $1", role_code)
        if role is None:
            raise HTTPException(status_code=400, detail=f"Unknown role: {role_code}")
        exists = await conn.fetchrow("SELECT id FROM users WHERE username = $1", username)
        if exists:
            raise HTTPException(status_code=409, detail="Username already exists")
        user_id = uuid.uuid4()
        await conn.execute(
            """
            INSERT INTO users (id, username, email, password_hash, display_name, is_active)
            VALUES ($1, $2, $3, $4, $5, $6)
            """,
            user_id,
            username,
            email,
            hash_password(body.password),
            body.full_name.strip(),
            body.status == "active",
        )
        await conn.execute(
            "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
            user_id,
            role["id"],
        )
    return AdminUserOut(
        id=str(user_id),
        full_name=body.full_name.strip(),
        username=username,
        email=email,
        role=role["code"],
        status=body.status,
    )


@router.put("/users/{user_id}", response_model=AdminUserOut)
async def update_admin_user(
    user_id: str,
    body: AdminUserUpdateIn,
    _ctx: AuthContext = Depends(require_permission(MOD_USER_MGMT)),
):
    uid = uuid.UUID(user_id)
    pool = get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow("SELECT id, username FROM users WHERE id = $1", uid)
        if existing is None:
            raise HTTPException(status_code=404, detail="User not found")

        role_id = None
        role_code = None
        if body.role:
            role_code = body.role.strip().lower()
            role = await conn.fetchrow("SELECT id, code FROM roles WHERE code = $1", role_code)
            if role is None:
                raise HTTPException(status_code=400, detail=f"Unknown role: {role_code}")
            role_id = role["id"]

        await conn.execute(
            """
            UPDATE users
            SET display_name = COALESCE($2, display_name),
                email = COALESCE($3, email),
                is_active = COALESCE($4, is_active),
                password_hash = COALESCE($5, password_hash),
                updated_at = NOW()
            WHERE id = $1
            """,
            uid,
            body.full_name.strip() if body.full_name else None,
            body.email.strip().lower() if body.email else None,
            None if body.status is None else body.status == "active",
            hash_password(body.password) if body.password else None,
        )
        if role_id:
            await conn.execute("DELETE FROM user_roles WHERE user_id = $1", uid)
            await conn.execute("INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)", uid, role_id)

        row = await conn.fetchrow(
            """
            SELECT u.id, u.display_name, u.username, u.email, u.is_active,
                   COALESCE(r.code, 'yard_manager') AS role_code
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            WHERE u.id = $1
            """,
            uid,
        )
    return AdminUserOut(
        id=str(row["id"]),
        full_name=row["display_name"] or row["username"],
        username=row["username"],
        email=row["email"],
        role=row["role_code"],
        status="active" if row["is_active"] else "inactive",
    )


@router.delete("/users/{user_id}")
async def delete_admin_user(
    user_id: str,
    ctx: AuthContext = Depends(require_permission(MOD_USER_MGMT)),
):
    uid = uuid.UUID(user_id)
    if ctx.user_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    pool = get_pool()
    async with pool.acquire() as conn:
        deleted = await conn.execute("DELETE FROM users WHERE id = $1", uid)
    if deleted.endswith("0"):
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True}


@router.get("/roles", response_model=list[AdminRoleOut])
async def list_admin_roles(_ctx: AuthContext = Depends(require_permission(MOD_ROLE_MGMT))):
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT r.id, r.code, r.name, r.display_name, r.description,
                   COALESCE(array_agg(p.code ORDER BY p.code) FILTER (WHERE p.code IS NOT NULL), '{}') AS permissions
            FROM roles r
            LEFT JOIN role_permissions rp ON rp.role_id = r.id
            LEFT JOIN permissions p ON p.id = rp.permission_id
            GROUP BY r.id
            ORDER BY r.code
            """
        )
    return [
        AdminRoleOut(
            id=str(r["id"]),
            code=r["code"],
            name=r["name"],
            display_name=r["display_name"] or r["name"],
            description=r["description"],
            permissions=list(r["permissions"] or []),
        )
        for r in rows
    ]


@router.get("/permissions", response_model=list[PermissionOut])
async def list_permissions(_ctx: AuthContext = Depends(require_permission(MOD_ROLE_MGMT))):
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT code, description, category FROM permissions ORDER BY category, code"
        )
    return [PermissionOut(code=r["code"], description=r["description"], category=r["category"]) for r in rows]


@router.put("/roles/{role_id}", response_model=AdminRoleOut)
async def update_role(
    role_id: str,
    body: AdminRoleUpdateIn,
    _ctx: AuthContext = Depends(require_permission(MOD_ROLE_MGMT)),
):
    rid = uuid.UUID(role_id)
    permission_codes = sorted(set([p.strip() for p in body.permissions if p.strip()]))
    pool = get_pool()
    async with pool.acquire() as conn:
        role = await conn.fetchrow(
            "SELECT id, code, name, display_name, description FROM roles WHERE id = $1",
            rid,
        )
        if role is None:
            raise HTTPException(status_code=404, detail="Role not found")
        perm_rows = await conn.fetch(
            "SELECT id, code FROM permissions WHERE code = ANY($1::text[])",
            permission_codes,
        )
        found = {r["code"] for r in perm_rows}
        missing = [code for code in permission_codes if code not in found]
        if missing:
            raise HTTPException(status_code=400, detail=f"Unknown permissions: {', '.join(missing)}")

        await conn.execute(
            "UPDATE roles SET description = COALESCE($2, description) WHERE id = $1",
            rid,
            body.description,
        )
        await conn.execute("DELETE FROM role_permissions WHERE role_id = $1", rid)
        for p in perm_rows:
            await conn.execute(
                "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)",
                rid,
                p["id"],
            )

        updated = await conn.fetchrow(
            """
            SELECT r.id, r.code, r.name, r.display_name, r.description,
                   COALESCE(array_agg(p.code ORDER BY p.code) FILTER (WHERE p.code IS NOT NULL), '{}') AS permissions
            FROM roles r
            LEFT JOIN role_permissions rp ON rp.role_id = r.id
            LEFT JOIN permissions p ON p.id = rp.permission_id
            WHERE r.id = $1
            GROUP BY r.id
            """,
            rid,
        )
    return AdminRoleOut(
        id=str(updated["id"]),
        code=updated["code"],
        name=updated["name"],
        display_name=updated["display_name"] or updated["name"],
        description=updated["description"],
        permissions=list(updated["permissions"] or []),
    )
