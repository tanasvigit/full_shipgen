"""Shipgen platform SSO — exchange IAM session for PMS JWT."""

from __future__ import annotations

import json
import secrets
import urllib.error
import urllib.request
from typing import Any

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import get_settings
from app.core.security import hash_password
from app.models.auth import Role
from app.models.user import User


def _extract_platform_user(payload: dict[str, Any]) -> dict[str, Any]:
    user = payload.get("user")
    if user is None and isinstance(payload.get("data"), dict):
        data = payload["data"]
        nested = data.get("user")
        user = nested if isinstance(nested, dict) else data
    if user is None:
        candidate = payload.get("me")
        user = candidate if isinstance(candidate, dict) else payload

    if not isinstance(user, dict):
        raise HTTPException(status_code=401, detail="Invalid platform session")
    return user


def _permission_names(user: dict[str, Any]) -> set[str]:
    names: set[str] = set()
    for entry in user.get("permissions") or []:
        if isinstance(entry, str):
            names.add(entry.lower())
        elif isinstance(entry, dict):
            name = entry.get("name")
            if name:
                names.add(str(name).lower())
    return names


def _resolve_platform_role_name(user: dict[str, Any]) -> str:
    role = user.get("role")
    if isinstance(role, dict):
        return str(role.get("name") or "").lower()
    if isinstance(role, str):
        return role.lower()
    return str(user.get("role_name") or "").lower()


def _resolve_platform_admin(user: dict[str, Any]) -> bool:
    """Mirror Shipgen console admin detection (type, Administrator role, IAM perms)."""
    if user.get("is_admin"):
        return True

    user_type = str(user.get("type") or "").lower()
    if user_type == "admin":
        return True

    role_name = _resolve_platform_role_name(user)
    if role_name in {"admin", "administrator"}:
        return True

    permissions = _permission_names(user)
    if "roles.view" in permissions and "users.view" in permissions:
        return True
    if "fleet-ops see admin" in permissions:
        return True

    return False


def _fetch_platform_userinfo(platform_token: str) -> dict[str, Any]:
    settings = get_settings()
    url = settings.platform_userinfo_url
    if not url:
        raise HTTPException(status_code=503, detail="Platform SSO is not configured")

    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {platform_token}", "Accept": "application/json"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        if exc.code in (401, 403):
            raise HTTPException(status_code=401, detail="Invalid platform session") from exc
        raise HTTPException(status_code=502, detail="Platform identity service unavailable") from exc
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=502, detail="Platform identity service unavailable") from exc

    if not isinstance(payload, dict):
        raise HTTPException(status_code=401, detail="Invalid platform session")

    user = _extract_platform_user(payload)

    email = str(user.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=401, detail="Platform account has no email")

    name = (
        user.get("name")
        or user.get("full_name")
        or user.get("display_name")
        or email.split("@", 1)[0]
    )
    is_admin = _resolve_platform_admin(user)

    return {
        "email": email,
        "display_name": str(name).strip() or email.split("@", 1)[0],
        "is_admin": is_admin,
    }


def _default_platform_role(identity: dict[str, Any]) -> str:
    return "admin" if identity.get("is_admin") else "supervisor"


def _next_external_code(db: Session) -> str:
    for _ in range(12):
        code = f"P{secrets.token_hex(2).upper()}"
        if db.scalar(select(User).where(User.external_code == code)) is None:
            return code
    return f"P{secrets.token_hex(4).upper()}"


def provision_platform_user(db: Session, *, email: str, display_name: str, role_name: str) -> User:
    role = db.scalar(select(Role).where(Role.name == role_name))
    if role is None:
        raise HTTPException(status_code=500, detail=f"PMS role not configured: {role_name}")

    user = User(
        external_code=_next_external_code(db),
        name=display_name,
        email=email.lower(),
        password_hash=hash_password(secrets.token_urlsafe(32)),
        status="active",
        role_id=role.id,
    )
    db.add(user)
    db.flush()
    db.refresh(user, attribute_names=["role"])
    user.role.permissions  # noqa: B018 — load permissions
    return user


def _sync_platform_user(db: Session, user: User, identity: dict[str, Any]) -> User:
    """Keep platform SSO users aligned with Shipgen admin status (upgrade only)."""
    expected_role = _default_platform_role(identity)
    display_name = identity.get("display_name")
    if display_name and user.name != display_name:
        user.name = display_name

    if user.role.name == expected_role:
        db.flush()
        return user

    if expected_role != "admin":
        db.flush()
        return user

    admin_role = db.scalar(select(Role).where(Role.name == "admin"))
    if admin_role is None:
        db.flush()
        return user

    user.role_id = admin_role.id
    db.flush()
    db.refresh(user, attribute_names=["role"])
    user.role.permissions  # noqa: B018 — load permissions
    return user


def authenticate_platform_token(db: Session, platform_token: str) -> User:
    identity = _fetch_platform_userinfo(platform_token)
    existing = db.scalar(
        select(User)
        .options(joinedload(User.role).joinedload(Role.permissions))
        .where(User.email == identity["email"])
    )
    if existing is not None:
        if existing.status != "active":
            raise HTTPException(status_code=403, detail="User account is inactive")
        user = _sync_platform_user(db, existing, identity)
        db.commit()
        db.refresh(user, attribute_names=["role"])
        return user

    role_name = _default_platform_role(identity)
    user = provision_platform_user(
        db,
        email=identity["email"],
        display_name=identity["display_name"],
        role_name=role_name,
    )
    db.commit()
    db.refresh(user, attribute_names=["role"])
    return user
