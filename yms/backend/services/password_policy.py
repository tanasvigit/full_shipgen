"""Password rules aligned with Shipgen IAM (CreateUserRequest / OnboardRequest)."""

from __future__ import annotations

import re

_PASSWORD_MIN_LEN = 8
_PASSWORD_MAX_LEN = 128

_SHIPGEN_PASSWORD_HINT = (
    "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol."
)


def validate_password(password: str) -> None:
    if not isinstance(password, str) or not password:
        raise ValueError("Password is required.")
    if len(password) < _PASSWORD_MIN_LEN:
        raise ValueError("Password must be at least 8 characters.")
    if len(password) > _PASSWORD_MAX_LEN:
        raise ValueError("Password must be at most 128 characters.")
    if not re.search(r"[A-Z]", password):
        raise ValueError(_SHIPGEN_PASSWORD_HINT)
    if not re.search(r"[a-z]", password):
        raise ValueError(_SHIPGEN_PASSWORD_HINT)
    if not re.search(r"\d", password):
        raise ValueError(_SHIPGEN_PASSWORD_HINT)
    if not re.search(r"[^\w\s]", password):
        raise ValueError(_SHIPGEN_PASSWORD_HINT)


def normalize_login_identity(identity: str) -> str:
    return identity.strip().lower()
