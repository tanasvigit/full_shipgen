"""Build list endpoint responses — plain array (default) or paginated object."""

from __future__ import annotations

from typing import Any, Type

from pydantic import BaseModel

from pagination import wants_paginated_response


def build_list_response(
    rows: list[dict[str, Any]],
    total: int,
    model: Type[BaseModel],
    *,
    skip: int,
    limit: int | None,
) -> list[BaseModel] | dict[str, Any]:
    items = [model(**row) for row in rows]
    if wants_paginated_response(limit, skip):
        return {
            "items": items,
            "total": total,
            "skip": skip,
            "limit": limit,
        }
    return items
