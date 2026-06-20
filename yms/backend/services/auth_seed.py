"""Seed production roles, permissions, and default users.

Seeding is idempotent: existing role descriptions and role_permissions are
never overwritten so Role Management edits remain the database source of truth.
Demo user emails/passwords are synced to Shipgen-format credentials on startup.
"""

from __future__ import annotations

import os
import uuid

import asyncpg

from auth_rbac import ALL_PERMISSIONS, ROLE_PERMISSIONS
from services.auth_service import hash_password
from services.demo_credentials import DEFAULT_DEMO_USERS

ROLE_META = {
    "yard_admin": ("Yard Administrator", "Full system access"),
    "yard_manager": ("Yard Manager", "Operational management and reports"),
    "gate_operator": ("Gate Operator", "Gate entry and exit operations"),
    "yard_coordinator": ("Yard Coordinator", "Queue and staging coordination"),
    "dock_supervisor": ("Dock Supervisor", "Dock, labor, equipment, and loading"),
}

_SYNC_DEMO_CREDENTIALS = os.environ.get("YMS_SYNC_DEMO_CREDENTIALS", "true").lower() in (
    "1",
    "true",
    "yes",
)


async def _ensure_permissions(conn: asyncpg.Connection) -> dict[str, uuid.UUID]:
    """Insert missing permission catalog rows; never mutate existing rows."""
    for code, desc, category in ALL_PERMISSIONS:
        existing = await conn.fetchrow("SELECT id FROM permissions WHERE code = $1", code)
        if existing:
            continue
        await conn.execute(
            """
            INSERT INTO permissions (id, code, description, category)
            VALUES ($1, $2, $3, $4)
            """,
            uuid.uuid4(),
            code,
            desc,
            category,
        )

    perm_ids: dict[str, uuid.UUID] = {}
    rows = await conn.fetch("SELECT id, code FROM permissions")
    for row in rows:
        perm_ids[row["code"]] = row["id"]
    return perm_ids


async def _ensure_roles(conn: asyncpg.Connection) -> tuple[dict[str, uuid.UUID], set[str]]:
    """Insert missing roles; never overwrite descriptions on existing rows."""
    role_ids: dict[str, uuid.UUID] = {}
    newly_created: set[str] = set()
    for role_code, (display, desc) in ROLE_META.items():
        existing = await conn.fetchrow(
            "SELECT id, code FROM roles WHERE code = $1 OR name = $2",
            role_code,
            display,
        )
        if existing:
            role_ids[role_code] = existing["id"]
            if not existing["code"]:
                await conn.execute(
                    "UPDATE roles SET code = $2 WHERE id = $1",
                    existing["id"],
                    role_code,
                )
            continue

        role_id = uuid.uuid4()
        await conn.execute(
            """
            INSERT INTO roles (id, code, name, display_name, description)
            VALUES ($1, $2, $3, $3, $4)
            """,
            role_id,
            role_code,
            display,
            desc,
        )
        role_ids[role_code] = role_id
        newly_created.add(role_code)
    return role_ids, newly_created


async def _seed_role_permissions_for_new_roles(
    conn: asyncpg.Connection,
    role_ids: dict[str, uuid.UUID],
    newly_created: set[str],
    perm_ids: dict[str, uuid.UUID],
) -> None:
    """Apply default ROLE_PERMISSIONS only for roles created during this seed run."""
    for role_name in newly_created:
        perms = ROLE_PERMISSIONS.get(role_name)
        role_id = role_ids.get(role_name)
        if role_id is None or perms is None:
            continue
        target_perms = (
            perm_ids.values() if "*" in perms else [perm_ids[c] for c in perms if c in perm_ids]
        )
        for pid in target_perms:
            await conn.execute(
                """
                INSERT INTO role_permissions (role_id, permission_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
                """,
                role_id,
                pid,
            )


async def _ensure_default_users(
    conn: asyncpg.Connection,
    role_ids: dict[str, uuid.UUID],
) -> None:
    """Create or sync Shipgen-format demo users for each yard role."""
    for spec in DEFAULT_DEMO_USERS:
        role_id = role_ids.get(spec["role"])
        if role_id is None:
            continue

        existing = await conn.fetchrow(
            """
            SELECT id FROM users
            WHERE LOWER(email) = LOWER($1)
               OR username = $2
               OR username = $3
            LIMIT 1
            """,
            spec["email"],
            spec["username"],
            spec["legacy_username"],
        )

        password_hash = hash_password(spec["password"])

        if existing:
            user_id = existing["id"]
            if _SYNC_DEMO_CREDENTIALS:
                await conn.execute(
                    """
                    UPDATE users
                    SET username = $2,
                        email = $3,
                        password_hash = $4,
                        display_name = $5,
                        is_active = TRUE
                    WHERE id = $1
                    """,
                    user_id,
                    spec["username"],
                    spec["email"].lower(),
                    password_hash,
                    spec["display_name"],
                )
        else:
            user_id = uuid.uuid4()
            await conn.execute(
                """
                INSERT INTO users (id, username, email, password_hash, display_name, is_active)
                VALUES ($1, $2, $3, $4, $5, TRUE)
                """,
                user_id,
                spec["username"],
                spec["email"].lower(),
                password_hash,
                spec["display_name"],
            )

        await conn.execute(
            """
            INSERT INTO user_roles (user_id, role_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            """,
            user_id,
            role_id,
        )


async def seed_auth_data(conn: asyncpg.Connection) -> None:
    perm_ids = await _ensure_permissions(conn)
    role_ids, newly_created = await _ensure_roles(conn)
    await _seed_role_permissions_for_new_roles(conn, role_ids, newly_created, perm_ids)
    await _ensure_default_users(conn, role_ids)
