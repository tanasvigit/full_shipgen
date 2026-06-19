"""Global command-palette search across operational entities."""

from __future__ import annotations

import asyncio
from typing import Any

from db import get_pool
from pagination import DEFAULT_LIST_CAP, build_ilike
from services.detention_service import list_detention_records, normalize_detention_row
from services.yms_service import _to_dict


async def _search_table(
    table: str,
    columns: list[str],
    q: str,
    limit: int,
    extra_where: str = "",
    extra_args: list[Any] | None = None,
    order_by: str = "created_at DESC",
) -> list[dict[str, Any]]:
    pool = get_pool()
    args: list[Any] = list(extra_args or [])
    idx = len(args) + 1
    ilike_sql, idx = build_ilike(q, columns, args, idx)
    where_parts = [ilike_sql]
    if extra_where:
        where_parts.append(extra_where)
    where = " AND ".join(where_parts)
    args.append(limit)
    sql = f"SELECT * FROM {table} WHERE {where} ORDER BY {order_by} LIMIT ${idx}"
    rows = await pool.fetch(sql, *args)
    return [_to_dict(r) for r in rows]


async def global_search(q: str, limit_per_group: int = 4) -> dict[str, Any]:
    q = (q or "").strip()
    if not q:
        return {"results": [], "unavailable": [{"kind": "ai", "reason": "AI Insights uses demo data only"}]}

    cap = max(1, min(limit_per_group, 20))
    pool = get_pool()
    vehicles, appointments, docks, queues, events, equipment, labor, detentions = await asyncio.gather(
        _search_table(
            "vehicles",
            ["vehicle_number", "transporter_name", "driver_name", "driver_phone", "status"],
            q,
            cap,
            order_by="updated_at DESC",
        ),
        _search_table(
            "appointments",
            ["booking_reference", "customer_name", "shipment_reference", "scheduled_slot", "gate_number", "status"],
            q,
            cap,
            order_by="created_at DESC",
        ),
        _search_table(
            "docks",
            ["dock_code", "dock_name", "dock_type", "status"],
            q,
            cap,
            order_by="dock_code ASC",
        ),
        _search_table(
            "queue_entries",
            ["queue_number", "queue_type", "status"],
            q,
            cap,
            order_by="priority_score DESC",
        ),
        _search_table(
            "yard_events",
            ["event_type", "event_note", "created_by"],
            q,
            cap,
            order_by="event_time DESC",
        ),
        _search_table(
            "equipment",
            [
                "equipment_code",
                "equipment_type",
                "model",
                "status",
                "operator_name",
                "current_location",
                "notes",
            ],
            q,
            cap,
            order_by="equipment_code ASC",
        ),
        _search_table(
            "labor_teams",
            [
                "team_code",
                "team_name",
                "shift_start",
                "shift_end",
                "status",
                "supervisor_name",
                "current_assignment",
                "current_location",
            ],
            q,
            cap,
            order_by="team_code ASC",
        ),
        _search_detention(q, cap),
    )

    vehicle_map = {v["id"]: v for v in vehicles}
    if appointments:
        appt_vehicle_ids = list({a["vehicle_id"] for a in appointments if a.get("vehicle_id")})
        if appt_vehicle_ids:
            extra_rows = await pool.fetch(
                "SELECT id, vehicle_number, transporter_name FROM vehicles WHERE id = ANY($1::uuid[])",
                appt_vehicle_ids,
            )
            for r in extra_rows:
                d = _to_dict(r)
                vehicle_map[d["id"]] = {**vehicle_map.get(d["id"], {}), **d}

    results: list[dict[str, Any]] = []

    for v in vehicles:
        results.append(
            {
                "kind": "vehicle",
                "id": v["id"],
                "label": v.get("vehicle_number") or v["id"],
                "sub": f"{v.get('transporter_name', '—')} · {v.get('vehicle_type', '—')}",
                "meta": v.get("status"),
                "payload": {"vehicleId": v["id"], "rowSnapshot": {
                    "plate": v.get("vehicle_number"),
                    "transporter": v.get("transporter_name"),
                    "status": v.get("status"),
                }},
            }
        )

    for a in appointments:
        veh = vehicle_map.get(a.get("vehicle_id")) or {}
        plate = veh.get("vehicle_number", "—")
        results.append(
            {
                "kind": "appointment",
                "id": a["id"],
                "label": a.get("booking_reference") or a["id"],
                "sub": f"{plate} · {a.get('scheduled_slot', '—')} · {a.get('shipment_reference', '—')}",
                "meta": a.get("status"),
                "payload": {"appointmentId": a["id"], "bookingReference": a.get("booking_reference")},
            }
        )

    for d in docks:
        results.append(
            {
                "kind": "dock",
                "id": d["id"],
                "label": d.get("dock_name") or d.get("dock_code"),
                "sub": d.get("dock_type", "—"),
                "meta": d.get("status"),
                "payload": {"dockId": d["id"], "dockCode": d.get("dock_code")},
            }
        )

    for qe in queues:
        veh = vehicle_map.get(qe.get("vehicle_id")) or {}
        results.append(
            {
                "kind": "queue",
                "id": qe["id"],
                "label": qe.get("queue_number") or qe["id"],
                "sub": veh.get("vehicle_number", "—"),
                "meta": qe.get("status"),
                "payload": {
                    "queueEntryId": qe["id"],
                    "vehicleId": qe.get("vehicle_id"),
                    "appointmentId": qe.get("appointment_id"),
                    "rowSnapshot": {
                        "plate": veh.get("vehicle_number"),
                        "transporter": veh.get("transporter_name"),
                        "status": qe.get("status"),
                    },
                },
            }
        )

    for e in events:
        results.append(
            {
                "kind": "yard_event",
                "id": e["id"],
                "label": e.get("event_type") or "Event",
                "sub": (e.get("event_note") or "—")[:80],
                "meta": None,
                "payload": {"eventId": e["id"], "vehicleId": e.get("vehicle_id")},
            }
        )

    for eq in equipment:
        results.append(
            {
                "kind": "equipment",
                "id": eq["id"],
                "label": eq.get("equipment_code") or eq["id"],
                "sub": f"{eq.get('model', '—')} · {eq.get('equipment_type', '—')}",
                "meta": eq.get("status"),
                "payload": {"equipmentId": eq["id"]},
            }
        )

    for team in labor:
        results.append(
            {
                "kind": "labor",
                "id": team["id"],
                "label": team.get("team_code") or team["id"],
                "sub": team.get("team_name", "—"),
                "meta": team.get("status"),
                "payload": {"laborId": team["id"]},
            }
        )

    for row in detentions:
        norm = normalize_detention_row(row)
        results.append(
            {
                "kind": "detention",
                "id": norm["id"],
                "label": norm.get("detention_ref") or norm["id"],
                "sub": f"{norm.get('transporter', '—')} · {norm.get('plate', '—')}",
                "meta": norm.get("status"),
                "payload": {"detentionId": norm["id"]},
            }
        )

    return {
        "results": results[: DEFAULT_LIST_CAP],
        "unavailable": [{"kind": "ai", "reason": "AI Insights search is unavailable (demo module only)"}],
    }


async def _search_detention(q: str, limit: int) -> list[dict[str, Any]]:
    records = await list_detention_records(q=q)
    return records[:limit]
