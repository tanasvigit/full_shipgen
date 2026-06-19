"""Shared list query helpers — backward compatible full lists unless limit is set."""

from __future__ import annotations

from typing import Any

DEFAULT_LIST_CAP = 1000
MAX_PAGE_LIMIT = 500


def clamp_limit(limit: int | None) -> int | None:
    if limit is None:
        return None
    return max(1, min(int(limit), MAX_PAGE_LIMIT))


def wants_paginated_response(limit: int | None, skip: int, **filters: Any) -> bool:
    """Paginated JSON wrapper when client passes limit (explicit pagination)."""
    return limit is not None


def has_active_filters(**filters: Any) -> bool:
    return any(v is not None and v != "" for v in filters.values())


def build_ilike(q: str, columns: list[str], args: list[Any], idx: int) -> tuple[str, int]:
    pattern = f"%{q.strip()}%"
    parts = [f"{col}::text ILIKE ${idx}" for col in columns]
    args.append(pattern)
    return f"({' OR '.join(parts)})", idx + 1
