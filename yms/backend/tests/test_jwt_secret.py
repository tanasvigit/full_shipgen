"""JWT secret startup validation."""

from __future__ import annotations

import os
from unittest.mock import patch

import pytest

from services.auth_service import validate_jwt_secret

VALID_SECRET = "this-is-a-strong-test-jwt-secret-key-123"


def test_validate_jwt_secret_accepts_strong_secret():
    with patch.dict(os.environ, {"JWT_SECRET_KEY": VALID_SECRET}, clear=False):
        validate_jwt_secret()


def test_validate_jwt_secret_rejects_missing():
    with patch.dict(os.environ, {}, clear=True):
        with pytest.raises(RuntimeError, match="JWT_SECRET_KEY is required"):
            validate_jwt_secret()


def test_validate_jwt_secret_rejects_empty():
    with patch.dict(os.environ, {"JWT_SECRET_KEY": "   "}, clear=False):
        with pytest.raises(RuntimeError, match="JWT_SECRET_KEY is required"):
            validate_jwt_secret()


def test_validate_jwt_secret_rejects_short():
    with patch.dict(os.environ, {"JWT_SECRET_KEY": "too-short"}, clear=False):
        with pytest.raises(RuntimeError, match="at least 32 characters"):
            validate_jwt_secret()


@pytest.mark.parametrize(
    "placeholder",
    [
        "<YOUR_LONG_RANDOM_SECRET_MIN_32_CHARS>",
        "replace-with-very-long-random-secret-at-least-32-chars",
        "your-secret-key-for-development-only",
    ],
)
def test_validate_jwt_secret_rejects_placeholders(placeholder: str):
    with patch.dict(os.environ, {"JWT_SECRET_KEY": placeholder}, clear=False):
        with pytest.raises(RuntimeError, match="placeholder or insecure default"):
            validate_jwt_secret()
