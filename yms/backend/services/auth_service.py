"""JWT authentication, password hashing, and user session management."""

from __future__ import annotations

import asyncio
import hashlib
import json
import os
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib import error as urllib_error
from urllib import request as urllib_request

import bcrypt
import jwt
from fastapi import HTTPException

from db import get_pool

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = int(os.environ.get("JWT_ACCESS_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_DAYS = int(os.environ.get("JWT_REFRESH_EXPIRE_DAYS", "7"))

# Known template/placeholder values — must not be used in any environment.
_INSECURE_JWT_SECRET_MARKERS = (
    "<your_long_random_secret",
    "replace-with-very-long-random-secret",
    "your-secret-key",
    "changeme",
    "change-me",
    "dev-secret",
    "insecure",
    "placeholder",
)


def _jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET_KEY", "").strip()
    if not secret:
        raise RuntimeError(
            "JWT_SECRET_KEY is required. Set a cryptographically random secret of at least 32 characters."
        )
    if len(secret) < 32:
        raise RuntimeError("JWT_SECRET_KEY must be at least 32 characters long")
    lowered = secret.lower()
    if any(marker in lowered for marker in _INSECURE_JWT_SECRET_MARKERS):
        raise RuntimeError(
            "JWT_SECRET_KEY is set to a placeholder or insecure default. "
            "Generate a new secret (e.g. python -c \"import secrets; print(secrets.token_urlsafe(48))\")."
        )
    return secret


def validate_jwt_secret() -> None:
    """Fail fast during application startup if JWT secret is missing or insecure."""
    _jwt_secret()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        return False


def _hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(
    *,
    user_id: str,
    username: str,
    role: str,
    permissions: list[str],
    impersonating: bool = False,
) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "user_id": user_id,
        "username": username,
        "role": role,
        "permissions": permissions,
        "impersonating": impersonating,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token_value() -> str:
    return secrets.token_urlsafe(48)


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Access token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid access token")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    return payload


async def get_user_permissions_for_role(role_name: str) -> list[str]:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT COALESCE(array_agg(DISTINCT p.code ORDER BY p.code), '{}') AS permissions
            FROM roles r
            JOIN role_permissions rp ON rp.role_id = r.id
            JOIN permissions p ON p.id = rp.permission_id
            WHERE r.code = $1
            """,
            role_name,
        )
        if row is None:
            return []
        return list(row["permissions"] or [])


async def authenticate_user(identity: str, password: str) -> dict[str, Any] | None:
    from services.password_policy import normalize_login_identity

    normalized = normalize_login_identity(identity)
    if not normalized:
        return None

    pool = get_pool()
    async with pool.acquire() as conn:
        if "@" in normalized:
            row = await conn.fetchrow(
                """
                SELECT u.id, u.username, u.password_hash, u.display_name, u.is_active,
                       COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
                FROM users u
                LEFT JOIN user_roles ur ON ur.user_id = u.id
                LEFT JOIN roles r ON r.id = ur.role_id
                WHERE LOWER(u.email) = $1
                GROUP BY u.id
                """,
                normalized,
            )
        else:
            row = await conn.fetchrow(
                """
                SELECT u.id, u.username, u.password_hash, u.display_name, u.is_active,
                       COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
                FROM users u
                LEFT JOIN user_roles ur ON ur.user_id = u.id
                LEFT JOIN roles r ON r.id = ur.role_id
                WHERE u.username = $1
                GROUP BY u.id
                """,
                normalized,
            )
        if row is None or not row["is_active"]:
            return None
        if not verify_password(password, row["password_hash"]):
            return None
        roles = list(row["roles"] or [])
        if not roles:
            return None
        role = roles[0]
        permissions = await get_user_permissions_for_role(role)
        return _row_to_auth_user(row, role, permissions)


async def store_refresh_token(user_id: str, token: str) -> None:
    pool = get_pool()
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_DAYS)
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
            VALUES ($1, $2, $3, $4)
            """,
            uuid.uuid4(),
            uuid.UUID(user_id),
            _hash_refresh_token(token),
            expires_at,
        )


async def revoke_refresh_token(token: str) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE refresh_tokens
            SET revoked_at = NOW()
            WHERE token_hash = $1 AND revoked_at IS NULL
            """,
            _hash_refresh_token(token),
        )


async def validate_refresh_token(token: str) -> dict[str, Any] | None:
    pool = get_pool()
    token_hash = _hash_refresh_token(token)
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT rt.user_id, rt.expires_at, u.username, u.display_name, u.is_active
            FROM refresh_tokens rt
            JOIN users u ON u.id = rt.user_id
            WHERE rt.token_hash = $1
              AND rt.revoked_at IS NULL
              AND rt.expires_at > NOW()
            """,
            token_hash,
        )
        if row is None or not row["is_active"]:
            return None
        role_row = await conn.fetchrow(
            """
            SELECT r.code AS role
            FROM user_roles ur
            JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = $1
            ORDER BY r.code
            LIMIT 1
            """,
            row["user_id"],
        )
        if role_row is None:
            return None
        role = role_row["role"]
        permissions = await get_user_permissions_for_role(role)
        return {
            "user_id": str(row["user_id"]),
            "username": row["username"],
            "display_name": row["display_name"],
            "role": role,
            "permissions": permissions,
        }


def _row_to_auth_user(row: Any, role: str, permissions: list[str]) -> dict[str, Any]:
    return {
        "user_id": str(row["id"]),
        "username": row["username"],
        "display_name": row["display_name"],
        "role": role,
        "permissions": permissions,
    }


async def get_user_by_email(email: str) -> dict[str, Any] | None:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT u.id, u.username, u.display_name, u.is_active,
                   COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            WHERE LOWER(u.email) = LOWER($1)
            GROUP BY u.id
            """,
            email.strip(),
        )
        if row is None or not row["is_active"]:
            return None
        roles = list(row["roles"] or [])
        if not roles:
            return None
        role = roles[0]
        permissions = await get_user_permissions_for_role(role)
        return _row_to_auth_user(row, role, permissions)


async def _fetch_platform_userinfo(platform_token: str) -> dict[str, Any]:
    url = os.environ.get(
        "PLATFORM_USERINFO_URL",
        "http://iam-service:8000/int/v1/users/me",
    ).strip()
    if not url:
        raise HTTPException(status_code=503, detail="Platform identity service is not configured")

    def _request() -> dict[str, Any]:
        req = urllib_request.Request(
            url,
            headers={
                "Authorization": f"Bearer {platform_token}",
                "Accept": "application/json",
            },
            method="GET",
        )
        with urllib_request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode("utf-8"))

    try:
        payload = await asyncio.to_thread(_request)
    except urllib_error.HTTPError as exc:
        if exc.code in (401, 403):
            raise HTTPException(status_code=401, detail="Invalid platform session") from exc
        raise HTTPException(status_code=502, detail="Platform identity service unavailable") from exc
    except (urllib_error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=502, detail="Platform identity service unavailable") from exc

    if not isinstance(payload, dict):
        raise HTTPException(status_code=401, detail="Invalid platform session")

    user = payload.get("user")
    if user is None and isinstance(payload.get("data"), dict):
        user = payload["data"].get("user")
    if user is None:
        user = payload.get("me") or payload

    if not isinstance(user, dict):
        raise HTTPException(status_code=401, detail="Invalid platform session")

    email = str(user.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=401, detail="Platform account has no email")

    name = (
        user.get("name")
        or user.get("full_name")
        or user.get("display_name")
        or email.split("@", 1)[0]
    )
    user_type = str(user.get("type") or "").lower()
    role_raw = user.get("role")
    role_name = str(
        user.get("role_name")
        or (role_raw.get("name") if isinstance(role_raw, dict) else role_raw)
        or ""
    ).lower()
    is_admin = bool(
        user.get("is_admin")
        or user_type == "admin"
        or role_name in ("admin", "administrator")
    )

    return {
        "email": email,
        "display_name": str(name).strip() or email.split("@", 1)[0],
        "is_admin": is_admin,
    }


def _default_platform_role(identity: dict[str, Any]) -> str:
    return "yard_admin" if identity.get("is_admin") else "yard_manager"


async def _assign_user_role(user_id: uuid.UUID, role_code: str) -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        role_row = await conn.fetchrow("SELECT id FROM roles WHERE code = $1", role_code)
        if role_row is None:
            raise HTTPException(status_code=500, detail=f"Yard role not configured: {role_code}")
        await conn.execute("DELETE FROM user_roles WHERE user_id = $1", user_id)
        await conn.execute(
            """
            INSERT INTO user_roles (user_id, role_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            """,
            user_id,
            role_row["id"],
        )


async def _get_user_id_by_email(email: str) -> uuid.UUID | None:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND is_active = TRUE",
            email.strip(),
        )
        return row["id"] if row else None


async def provision_platform_user(
    *,
    email: str,
    display_name: str,
    role_code: str,
) -> dict[str, Any]:
    username_base = re.sub(r"[^a-z0-9]+", "_", email.split("@", 1)[0].lower()).strip("_")
    if not username_base:
        username_base = "user"

    pool = get_pool()
    async with pool.acquire() as conn:
        role_row = await conn.fetchrow("SELECT id FROM roles WHERE code = $1", role_code)
        if role_row is None:
            raise HTTPException(status_code=500, detail=f"Yard role not configured: {role_code}")

        username = username_base
        for _ in range(8):
            existing = await conn.fetchrow("SELECT id FROM users WHERE username = $1", username)
            if existing is None:
                break
            username = f"{username_base}_{secrets.token_hex(3)}"
        else:
            raise HTTPException(status_code=500, detail="Could not allocate yard username")

        user_id = uuid.uuid4()
        await conn.execute(
            """
            INSERT INTO users (id, username, email, password_hash, display_name, is_active)
            VALUES ($1, $2, $3, $4, $5, TRUE)
            """,
            user_id,
            username,
            email.lower(),
            hash_password(secrets.token_urlsafe(32)),
            display_name,
        )
        await conn.execute(
            """
            INSERT INTO user_roles (user_id, role_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
            """,
            user_id,
            role_row["id"],
        )

    user = await get_user_by_id(str(user_id))
    if user is None:
        raise HTTPException(status_code=500, detail="Failed to provision yard user")
    return user


async def authenticate_platform_token(platform_token: str) -> dict[str, Any]:
    identity = await _fetch_platform_userinfo(platform_token)
    role_code = _default_platform_role(identity)
    existing = await get_user_by_email(identity["email"])

    if existing is not None:
        if identity.get("is_admin") and existing["role"] != "yard_admin":
            user_id = uuid.UUID(existing["user_id"])
            await _assign_user_role(user_id, "yard_admin")
            upgraded = await get_user_by_id(str(user_id))
            if upgraded is not None:
                return upgraded
        return existing

    user_id = await _get_user_id_by_email(identity["email"])
    if user_id is not None:
        await _assign_user_role(user_id, role_code)
        linked = await get_user_by_id(str(user_id))
        if linked is not None:
            return linked

    return await provision_platform_user(
        email=identity["email"],
        display_name=identity["display_name"],
        role_code=role_code,
    )


async def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT u.id, u.username, u.display_name, u.is_active,
                   COALESCE(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            WHERE u.id = $1
            GROUP BY u.id
            """,
            uuid.UUID(user_id),
        )
        if row is None or not row["is_active"]:
            return None
        roles = list(row["roles"] or [])
        if not roles:
            return None
        role = roles[0]
        permissions = await get_user_permissions_for_role(role)
        return _row_to_auth_user(row, role, permissions)
