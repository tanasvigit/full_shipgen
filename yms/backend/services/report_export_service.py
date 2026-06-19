"""Report export — CSV and Excel (openpyxl). PDF architecture stub for future use."""

from __future__ import annotations

import csv
import io
from typing import Any

from fastapi import HTTPException
from fastapi.responses import Response


def rows_to_csv(columns: list[str], rows: list[dict[str, Any]]) -> bytes:
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=columns, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({k: row.get(k, "") for k in columns})
    return buffer.getvalue().encode("utf-8-sig")


def rows_to_excel(columns: list[str], rows: list[dict[str, Any]], sheet_name: str = "Report") -> bytes:
    try:
        from openpyxl import Workbook
    except ImportError as exc:
        raise HTTPException(
            status_code=501,
            detail="Excel export requires openpyxl on the server",
        ) from exc

    wb = Workbook()
    ws = wb.active
    ws.title = (sheet_name or "Report")[:31]
    ws.append(columns)
    for row in rows:
        ws.append([row.get(col, "") for col in columns])
    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()


def export_response(
    *,
    filename: str,
    columns: list[str],
    rows: list[dict[str, Any]],
    fmt: str,
    sheet_name: str = "Report",
) -> Response:
    fmt = (fmt or "csv").lower()
    if fmt == "csv":
        content = rows_to_csv(columns, rows)
        media = "text/csv"
        ext = "csv"
    elif fmt in {"xlsx", "excel"}:
        content = rows_to_excel(columns, rows, sheet_name=sheet_name)
        media = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ext = "xlsx"
    elif fmt == "pdf":
        raise HTTPException(
            status_code=501,
            detail="PDF export is planned — use client-side ExportMenu PDF for now",
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported export format '{fmt}'")

    return Response(
        content=content,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="{filename}.{ext}"'},
    )
