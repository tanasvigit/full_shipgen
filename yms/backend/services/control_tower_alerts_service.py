"""Control Tower alerts — operational exceptions from live YMS data."""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from enums import ACTIVE_DOCK_QUEUE_STATUSES
from services.equipment_service import list_equipment
from services.labor_service import list_labor_teams
from services.loading_exceptions_service import exception_severity, list_loading_exceptions
from services.yms_service import (
    list_appointments,
    list_docks,
    list_queue_entries,
    list_vehicles,
    list_yard_events,
)

ALERT_THRESHOLDS = {
    "waiting_minutes": 60,
    "exit_holding_minutes": 30,
    "dock_stalled_minutes": 30,
    "queue_congestion": 10,
    "hazmat_waiting_minutes": 30,
}

LOADING_PROGRESS_EVENTS = frozenset({
    "LOADING_STARTED",
    "LOADING_RESUMED",
    "LOADING_COMPLETED",
    "LOADING_DELAY",
    "LOADING_PAUSED",
    "VEHICLE_STATUS_CHANGED",
})

ASSIGNED_VEHICLE_STATUSES = frozenset({
    "DOCK_ASSIGNED",
    "RESOURCE_PENDING",
    "READY_FOR_LOADING",
    "LOADING",
})

EQUIPMENT_ACTIVE_STATUSES = frozenset({"ASSIGNED", "IN_USE"})


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _coerce_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    text = str(value).strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    parsed = datetime.fromisoformat(text)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _minutes_since(value: Any, *, now: datetime | None = None) -> int:
    start = _coerce_datetime(value)
    if start is None:
        return 0
    end = now or _now()
    return max(0, int((end - start).total_seconds() / 60))


def _minutes_between(start_at: Any, end_at: Any) -> int:
    start = _coerce_datetime(start_at)
    end = _coerce_datetime(end_at)
    if start is None or end is None:
        return 0
    return max(0, int((end - start).total_seconds() / 60))


def _is_hazmat_vehicle(vehicle: dict[str, Any], appointment: dict[str, Any] | None) -> bool:
    if (vehicle.get("material_type") or "").upper() == "HAZMAT":
        return True
    blob = " ".join(
        [
            str(vehicle.get("material_type") or ""),
            str(appointment.get("shipment_reference") or "") if appointment else "",
            str(appointment.get("remarks") or "") if appointment else "",
            str(appointment.get("customer_name") or "") if appointment else "",
        ]
    ).lower()
    return bool(re.search(r"hazmat|hazard|chem|class\s*3|flamm", blob, re.I))


def _index_by_vehicle_id(rows: list[dict[str, Any]], key: str = "vehicle_id") -> dict[str, dict[str, Any]]:
    out: dict[str, dict[str, Any]] = {}
    for row in rows:
        vid = row.get(key)
        if not vid:
            continue
        out[str(vid)] = row
    return out


def _latest_appointments_by_vehicle(appointments: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    by_vehicle: dict[str, dict[str, Any]] = {}
    for appt in appointments:
        vid = appt.get("vehicle_id")
        if not vid:
            continue
        key = str(vid)
        existing = by_vehicle.get(key)
        if existing is None or str(appt.get("updated_at") or "") > str(existing.get("updated_at") or ""):
            by_vehicle[key] = appt
    return by_vehicle


def _events_by_vehicle(events: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    by_vehicle: dict[str, list[dict[str, Any]]] = {}
    for event in events:
        vid = event.get("vehicle_id")
        if not vid:
            continue
        by_vehicle.setdefault(str(vid), []).append(event)
    for rows in by_vehicle.values():
        rows.sort(key=lambda e: _coerce_datetime(e.get("event_time")) or datetime.min.replace(tzinfo=timezone.utc))
    return by_vehicle


def _resolve_check_in_time(
    vehicle_id: str,
    queue: dict[str, Any] | None,
    veh_events: list[dict[str, Any]],
) -> Any:
    if queue and queue.get("checkin_time"):
        return queue["checkin_time"]
    for event in veh_events:
        if event.get("event_type") in {"VEHICLE_CHECKED_IN", "QUEUE_ENTRY_CREATED"}:
            return event.get("event_time")
    return None


def _resolve_loading_started(veh_events: list[dict[str, Any]]) -> Any:
    for event in reversed(veh_events):
        if event.get("event_type") == "LOADING_STARTED":
            return event.get("event_time")
    return None


def _labor_assigned(
    vehicle_id: str,
    queue: dict[str, Any] | None,
    labor_teams: list[dict[str, Any]],
) -> bool:
    vid = str(vehicle_id)
    for team in labor_teams:
        if str(team.get("assigned_vehicle_id") or "") == vid and team.get("status") == "ASSIGNED":
            return True
    dock_id = str(queue.get("dock_id") or "") if queue else ""
    if dock_id:
        for team in labor_teams:
            if (
                str(team.get("assigned_dock_id") or "") == dock_id
                and team.get("status") == "ASSIGNED"
            ):
                return True
    return False


def _equipment_assigned(
    vehicle_id: str,
    queue: dict[str, Any] | None,
    equipment_rows: list[dict[str, Any]],
) -> bool:
    vid = str(vehicle_id)
    for row in equipment_rows:
        if (
            str(row.get("assigned_vehicle_id") or "") == vid
            and row.get("status") in EQUIPMENT_ACTIVE_STATUSES
        ):
            return True
    dock_id = str(queue.get("dock_id") or "") if queue else ""
    if dock_id:
        for row in equipment_rows:
            if (
                str(row.get("assigned_dock_id") or "") == dock_id
                and row.get("status") in EQUIPMENT_ACTIVE_STATUSES
            ):
                return True
    return False


def _equipment_required(dock: dict[str, Any] | None, vehicle_status: str) -> bool:
    if dock and dock.get("default_equipment_id"):
        return True
    return vehicle_status in {"READY_FOR_LOADING", "LOADING"}


def _last_loading_progress_at(veh_events: list[dict[str, Any]], dock_id: str | None) -> Any:
    last = None
    for event in veh_events:
        if event.get("event_type") not in LOADING_PROGRESS_EVENTS:
            continue
        if dock_id and event.get("dock_id") and str(event["dock_id"]) != str(dock_id):
            continue
        last = event.get("event_time")
    return last


def _format_resource_label(code: str | None, name: str | None) -> str | None:
    code = (code or "").strip()
    name = (name or "").strip()
    if code and name:
        return f"{code} · {name}"
    return code or name or None


def _resolve_labor_label(
    vehicle_id: str,
    queue: dict[str, Any] | None,
    labor_teams: list[dict[str, Any]],
) -> str | None:
    vid = str(vehicle_id)
    qid = str(queue.get("id") or "") if queue else ""
    dock_id = str(queue.get("dock_id") or "") if queue else ""
    for team in labor_teams:
        if team.get("status") != "ASSIGNED":
            continue
        label = _format_resource_label(team.get("team_code"), team.get("team_name"))
        if not label:
            continue
        if str(team.get("assigned_vehicle_id") or "") == vid:
            return label
        if qid and str(team.get("assigned_queue_entry_id") or "") == qid:
            return label
        if dock_id and str(team.get("assigned_dock_id") or "") == dock_id:
            return label
    return None


def _resolve_equipment_label(
    vehicle_id: str,
    queue: dict[str, Any] | None,
    equipment_rows: list[dict[str, Any]],
) -> str | None:
    vid = str(vehicle_id)
    qid = str(queue.get("id") or "") if queue else ""
    dock_id = str(queue.get("dock_id") or "") if queue else ""
    for row in equipment_rows:
        if row.get("status") not in EQUIPMENT_ACTIVE_STATUSES:
            continue
        label = _format_resource_label(row.get("equipment_code"), row.get("equipment_name"))
        if not label:
            continue
        if str(row.get("assigned_vehicle_id") or "") == vid:
            return label
        if qid and str(row.get("assigned_queue_entry_id") or "") == qid:
            return label
        if dock_id and str(row.get("assigned_dock_id") or "") == dock_id:
            return label
    return None


def _make_alert(
    alert_id: str,
    alert_type: str,
    severity: str,
    *,
    vehicle_id: str | None = None,
    vehicle: str | None = None,
    appointment_id: str | None = None,
    appointment: str | None = None,
    dock_id: str | None = None,
    dock: str | None = None,
    labor: str | None = None,
    equipment: str | None = None,
    exception_type: str | None = None,
    exception_status: str | None = None,
    duration_min: int = 0,
    delay_min: int | None = None,
    created_at: Any = None,
    status: str = "ACTIVE",
) -> dict[str, Any]:
    return {
        "id": alert_id,
        "alertType": alert_type,
        "severity": severity,
        "vehicleId": vehicle_id,
        "vehicle": vehicle,
        "appointmentId": appointment_id,
        "appointment": appointment,
        "dockId": dock_id,
        "dock": dock,
        "labor": labor,
        "equipment": equipment,
        "exceptionType": exception_type,
        "exceptionStatus": exception_status,
        "durationMin": duration_min,
        "delayMin": delay_min,
        "createdAt": _coerce_datetime(created_at).isoformat() if created_at else None,
        "status": status,
    }


def compute_control_tower_alerts(
    *,
    vehicles: list[dict[str, Any]],
    appointments: list[dict[str, Any]],
    queues: list[dict[str, Any]],
    docks: list[dict[str, Any]],
    labor_teams: list[dict[str, Any]],
    equipment_rows: list[dict[str, Any]],
    events: list[dict[str, Any]],
    loading_exceptions: list[dict[str, Any]] | None = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    now = now or _now()
    queues_by_vehicle = _index_by_vehicle_id(queues)
    appointments_by_vehicle = _latest_appointments_by_vehicle(appointments)
    docks_by_id = {str(d["id"]): d for d in docks}
    events_by_vehicle = _events_by_vehicle(events)
    alerts: list[dict[str, Any]] = []

    waiting_count = 0

    for vehicle in vehicles:
        vid = str(vehicle["id"])
        status = vehicle.get("status") or ""
        queue = queues_by_vehicle.get(vid)
        appt = appointments_by_vehicle.get(vid)
        veh_events = events_by_vehicle.get(vid, [])
        plate = vehicle.get("vehicle_number")
        appt_id = str(appt["id"]) if appt and appt.get("id") else None
        appt_ref = appt.get("booking_reference") if appt else None
        dock_id = str(queue["dock_id"]) if queue and queue.get("dock_id") else None
        dock = docks_by_id.get(dock_id) if dock_id else None
        dock_code = dock.get("dock_code") if dock else None
        check_in = _resolve_check_in_time(vid, queue, veh_events)

        if status == "WAITING":
            waiting_count += 1
            wait_min = _minutes_since(check_in, now=now) if check_in else 0
            if wait_min > ALERT_THRESHOLDS["waiting_minutes"]:
                alerts.append(
                    _make_alert(
                        f"waiting-too-long-{vid}",
                        "VEHICLE_WAITING_TOO_LONG",
                        "WARNING",
                        vehicle_id=vid,
                        vehicle=plate,
                        appointment_id=appt_id,
                        appointment=appt_ref,
                        dock_id=dock_id,
                        dock=dock_code,
                        duration_min=wait_min,
                        created_at=check_in,
                    )
                )
            if _is_hazmat_vehicle(vehicle, appt) and wait_min > ALERT_THRESHOLDS["hazmat_waiting_minutes"]:
                alerts.append(
                    _make_alert(
                        f"hazmat-sla-{vid}",
                        "HAZMAT_SLA_BREACH",
                        "CRITICAL",
                        vehicle_id=vid,
                        vehicle=plate,
                        appointment_id=appt_id,
                        appointment=appt_ref,
                        duration_min=wait_min,
                        created_at=check_in,
                    )
                )

        if status == "LOADING":
            loading_start = _resolve_loading_started(veh_events)
            service_min = int(dock.get("estimated_service_time_min") or 90) if dock else 90
            loading_min = _minutes_since(loading_start, now=now) if loading_start else 0
            if loading_start and loading_min > service_min:
                delay_min = max(0, loading_min - service_min)
                alerts.append(
                    _make_alert(
                        f"loading-delay-{vid}",
                        "LOADING_DELAY",
                        "CRITICAL",
                        vehicle_id=vid,
                        vehicle=plate,
                        appointment_id=appt_id,
                        appointment=appt_ref,
                        dock_id=dock_id,
                        dock=dock_code,
                        labor=_resolve_labor_label(vid, queue, labor_teams),
                        equipment=_resolve_equipment_label(vid, queue, equipment_rows),
                        duration_min=loading_min,
                        delay_min=delay_min,
                        created_at=loading_start,
                    )
                )

        if status == "EXIT_HOLDING":
            holding_start = vehicle.get("exit_holding_at") or vehicle.get("updated_at")
            hold_min = _minutes_since(holding_start, now=now)
            if hold_min > ALERT_THRESHOLDS["exit_holding_minutes"]:
                alerts.append(
                    _make_alert(
                        f"exit-holding-delay-{vid}",
                        "EXIT_HOLDING_DELAY",
                        "WARNING",
                        vehicle_id=vid,
                        vehicle=plate,
                        appointment_id=appt_id,
                        appointment=appt_ref,
                        duration_min=hold_min,
                        created_at=holding_start,
                    )
                )

        if status in ASSIGNED_VEHICLE_STATUSES and queue and queue.get("dock_id"):
            if not _labor_assigned(vid, queue, labor_teams):
                alerts.append(
                    _make_alert(
                        f"labor-unavailable-{vid}",
                        "LABOR_UNAVAILABLE",
                        "WARNING",
                        vehicle_id=vid,
                        vehicle=plate,
                        appointment_id=appt_id,
                        appointment=appt_ref,
                        dock_id=dock_id,
                        dock=dock_code,
                        duration_min=_minutes_since(queue.get("dock_assigned_time"), now=now),
                        created_at=queue.get("dock_assigned_time"),
                    )
                )
            if _equipment_required(dock, status) and not _equipment_assigned(vid, queue, equipment_rows):
                alerts.append(
                    _make_alert(
                        f"equipment-unavailable-{vid}",
                        "EQUIPMENT_UNAVAILABLE",
                        "WARNING",
                        vehicle_id=vid,
                        vehicle=plate,
                        appointment_id=appt_id,
                        appointment=appt_ref,
                        dock_id=dock_id,
                        dock=dock_code,
                        duration_min=_minutes_since(queue.get("dock_assigned_time"), now=now),
                        created_at=queue.get("dock_assigned_time"),
                    )
                )

    for dock in docks:
        if dock.get("status") != "OCCUPIED":
            continue
        dock_id = str(dock["id"])
        dock_code = dock.get("dock_code")
        queue = next(
            (
                q
                for q in queues
                if str(q.get("dock_id") or "") == dock_id
                and q.get("status") in ACTIVE_DOCK_QUEUE_STATUSES
            ),
            None,
        )
        if not queue:
            continue
        vid = str(queue["vehicle_id"])
        vehicle = next((v for v in vehicles if str(v["id"]) == vid), None)
        if not vehicle or vehicle.get("status") != "LOADING":
            continue
        veh_events = events_by_vehicle.get(vid, [])
        last_progress = _last_loading_progress_at(veh_events, dock_id)
        stalled_min = _minutes_since(last_progress, now=now) if last_progress else 0
        if last_progress and stalled_min >= ALERT_THRESHOLDS["dock_stalled_minutes"]:
            appt = appointments_by_vehicle.get(vid)
            alerts.append(
                _make_alert(
                    f"dock-blocked-{dock_id}",
                    "DOCK_BLOCKED",
                    "CRITICAL",
                    vehicle_id=vid,
                    vehicle=vehicle.get("vehicle_number"),
                    appointment_id=str(appt["id"]) if appt and appt.get("id") else None,
                    appointment=appt.get("booking_reference") if appt else None,
                    dock_id=dock_id,
                    dock=dock_code,
                    duration_min=stalled_min,
                    created_at=last_progress,
                )
            )

    if waiting_count > ALERT_THRESHOLDS["queue_congestion"]:
        alerts.append(
            _make_alert(
                "queue-congestion",
                "QUEUE_CONGESTION",
                "WARNING",
                duration_min=waiting_count,
                created_at=now,
                status="ACTIVE",
            )
        )

    vehicles_by_id = {str(v["id"]): v for v in vehicles}
    for exc in loading_exceptions or []:
        if exc.get("status") not in {"OPEN", "IN_PROGRESS"}:
            continue
        exc_id = str(exc["id"])
        vid = str(exc["vehicle_id"]) if exc.get("vehicle_id") else None
        vehicle = vehicles_by_id.get(vid) if vid else None
        plate = vehicle.get("vehicle_number") if vehicle else None
        dock_id = str(exc["dock_id"]) if exc.get("dock_id") else None
        dock = docks_by_id.get(dock_id) if dock_id else None
        dock_code = dock.get("dock_code") if dock else None
        appt_id = str(exc["appointment_id"]) if exc.get("appointment_id") else None
        appt = appointments_by_vehicle.get(vid) if vid else None
        appt_ref = appt.get("booking_reference") if appt else None
        exc_type = exc.get("exception_type") or "GENERIC_DELAY"
        age_min = _minutes_since(exc.get("created_at"), now=now)
        alerts.append(
            _make_alert(
                f"loading-exception-{exc_id}",
                "LOADING_EXCEPTION",
                exception_severity(exc_type),
                vehicle_id=vid,
                vehicle=plate,
                appointment_id=appt_id,
                appointment=appt_ref,
                dock_id=dock_id,
                dock=dock_code,
                exception_type=exc_type,
                exception_status=exc.get("status"),
                duration_min=age_min,
                created_at=exc.get("created_at"),
            )
        )

    severity_rank = {"CRITICAL": 0, "WARNING": 1, "INFO": 2}
    alerts.sort(key=lambda a: (severity_rank.get(a["severity"], 9), -(a.get("durationMin") or 0)))

    critical_count = sum(1 for a in alerts if a["severity"] == "CRITICAL")
    warning_count = sum(1 for a in alerts if a["severity"] == "WARNING")

    return {
        "activeAlerts": alerts,
        "criticalCount": critical_count,
        "warningCount": warning_count,
    }


async def get_control_tower_alerts() -> dict[str, Any]:
    vehicles, _ = await list_vehicles()
    appointments, _ = await list_appointments()
    queues, _ = await list_queue_entries()
    docks, _ = await list_docks()
    labor_teams, _ = await list_labor_teams()
    equipment_rows, _ = await list_equipment()
    events, _ = await list_yard_events()
    loading_exceptions = await list_loading_exceptions(active_only=True)
    return compute_control_tower_alerts(
        vehicles=vehicles,
        appointments=appointments,
        queues=queues,
        docks=docks,
        labor_teams=labor_teams,
        equipment_rows=equipment_rows,
        events=events,
        loading_exceptions=loading_exceptions,
    )
