"""SQL list queries with optional filters and pagination."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from db import get_pool
from pagination import DEFAULT_LIST_CAP, build_ilike, clamp_limit
def _to_dict(record: Any) -> dict[str, Any]:
    return dict(record) if record is not None else {}


async def query_rows(
    table: str,
    order_by: str,
    *,
    search_columns: list[str] | None = None,
    q: str | None = None,
    eq_filters: dict[str, Any] | None = None,
    skip: int = 0,
    limit: int | None = None,
    date_column: str | None = None,
    date_from: date | datetime | None = None,
    date_to: date | datetime | None = None,
    dock_id: str | None = None,
    category: str | None = None,
) -> tuple[list[dict[str, Any]], int]:
    pool = get_pool()
    conditions: list[str] = []
    args: list[Any] = []
    idx = 1

    if q and search_columns:
        ilike, idx = build_ilike(q, search_columns, args, idx)
        conditions.append(ilike)

    for key, value in (eq_filters or {}).items():
        if value is not None and value != "":
            conditions.append(f"{key} = ${idx}")
            args.append(value)
            idx += 1

    if dock_id:
        conditions.append(f"dock_id = ${idx}::uuid")
        args.append(dock_id)
        idx += 1

    if category:
        conditions.append(f"category = ${idx}")
        args.append(category)
        idx += 1

    if date_column and date_from is not None:
        conditions.append(f"{date_column} >= ${idx}")
        args.append(date_from)
        idx += 1

    if date_column and date_to is not None:
        conditions.append(f"{date_column} <= ${idx}")
        args.append(date_to)
        idx += 1

    where = " AND ".join(conditions) if conditions else "TRUE"
    count_row = await pool.fetchrow(f"SELECT COUNT(*)::int AS c FROM {table} WHERE {where}", *args)
    total = int(count_row["c"]) if count_row else 0

    effective_limit = clamp_limit(limit) if limit is not None else DEFAULT_LIST_CAP
    args.append(max(0, skip))
    args.append(effective_limit)
    skip_idx, limit_idx = idx, idx + 1

    rows = await pool.fetch(
        f"SELECT * FROM {table} WHERE {where} ORDER BY {order_by} OFFSET ${skip_idx} LIMIT ${limit_idx}",
        *args,
    )
    return [_to_dict(r) for r in rows], total
