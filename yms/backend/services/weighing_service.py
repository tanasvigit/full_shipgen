"""Weighbridge capture — tare at queue, gross at dock release, net = gross − tare."""

from __future__ import annotations

from decimal import Decimal
from typing import Any

from fastapi import HTTPException

from db import get_pool
from services.yms_service import create_yard_event, get_queue_entry


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _validate_weight(weight_kg: float, *, label: str) -> float:
    if weight_kg <= 0:
        raise HTTPException(status_code=400, detail=f"{label} must be greater than zero")
    if weight_kg > 200_000:
        raise HTTPException(status_code=400, detail=f"{label} exceeds maximum (200,000 kg)")
    return round(weight_kg, 2)


def weighing_payload(entry: dict[str, Any]) -> dict[str, Any]:
    return {
        "queueEntryId": str(entry["id"]),
        "tareWeightKg": _to_float(entry.get("tare_weight_kg")),
        "grossWeightKg": _to_float(entry.get("gross_weight_kg")),
        "netWeightKg": _to_float(entry.get("net_weight_kg")),
    }


async def record_tare_weight(queue_entry_id: str, weight_kg: float, *, created_by: str = "queue-ui") -> dict[str, Any]:
    weight = _validate_weight(weight_kg, label="Tare weight")
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            entry = await get_queue_entry(queue_entry_id, conn=conn)
            if entry.get("status") in {"COMPLETED", "EXITED", "CANCELLED"}:
                raise HTTPException(status_code=409, detail="Cannot weigh a completed queue entry")
            row = await conn.fetchrow(
                """
                UPDATE queue_entries
                SET tare_weight_kg = $2,
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                queue_entry_id,
                weight,
            )
            if not row:
                raise HTTPException(status_code=404, detail="Queue entry not found")
            await create_yard_event(
                vehicle_id=str(entry["vehicle_id"]),
                appointment_id=str(entry["appointment_id"]),
                queue_entry_id=queue_entry_id,
                dock_id=str(entry["dock_id"]) if entry.get("dock_id") else None,
                event_type="WEIGH_TARE_RECORDED",
                event_note=f"Tare weight recorded: {weight:,.2f} kg",
                created_by=created_by,
                conn=conn,
            )
    return weighing_payload(dict(row))


async def record_gross_weight(queue_entry_id: str, weight_kg: float, *, created_by: str = "dock-ui") -> dict[str, Any]:
    weight = _validate_weight(weight_kg, label="Gross weight")
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            entry = await get_queue_entry(queue_entry_id, conn=conn)
            tare = _to_float(entry.get("tare_weight_kg"))
            if tare is None:
                raise HTTPException(
                    status_code=400,
                    detail="Tare weight must be recorded in the virtual queue before gross weight",
                )
            if weight <= tare:
                raise HTTPException(
                    status_code=400,
                    detail="Gross weight must be greater than tare weight",
                )
            net = round(weight - tare, 2)
            row = await conn.fetchrow(
                """
                UPDATE queue_entries
                SET gross_weight_kg = $2,
                    net_weight_kg = $3,
                    updated_at = NOW()
                WHERE id = $1::uuid
                RETURNING *
                """,
                queue_entry_id,
                weight,
                net,
            )
            if not row:
                raise HTTPException(status_code=404, detail="Queue entry not found")
            await create_yard_event(
                vehicle_id=str(entry["vehicle_id"]),
                appointment_id=str(entry["appointment_id"]),
                queue_entry_id=queue_entry_id,
                dock_id=str(entry["dock_id"]) if entry.get("dock_id") else None,
                event_type="WEIGH_GROSS_RECORDED",
                event_note=f"Gross {weight:,.2f} kg · Net {net:,.2f} kg (tare {tare:,.2f} kg)",
                created_by=created_by,
                conn=conn,
            )
    return weighing_payload(dict(row))


async def get_weighing_for_queue_entry(queue_entry_id: str) -> dict[str, Any]:
    entry = await get_queue_entry(queue_entry_id)
    return weighing_payload(entry)
