"""Operations Dashboard KPIs — derived from live YMS tables (no mock data)."""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any

from services.operational_metrics import (
    count_vehicles_exit_holding,
    count_vehicles_in_yard,
    count_vehicles_loading,
    count_vehicles_waiting,
)
from services.yms_service import (
    list_appointments,
    list_queue_entries,
    list_vehicles,
    list_yard_events,
)

OPERATIONS_SLA = {
    "waiting_minutes": 60,
    "loading_minutes": 120,
    "turnaround_minutes": 240,
}

CHECK_IN_EVENT_TYPES = frozenset({"VEHICLE_CHECKED_IN", "QUEUE_ENTRY_CREATED"})


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _today() -> date:
    return _now().date()


def _coerce_datetime(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, date):
        return datetime.combine(value, datetime.min.time(), tzinfo=timezone.utc)
    text = str(value).strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    parsed = datetime.fromisoformat(text)
    return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)


def _date_of(value: Any) -> date | None:
    dt = _coerce_datetime(value)
    return dt.date() if dt else None


def _minutes_between(start_at: Any, end_at: Any) -> int | None:
    start = _coerce_datetime(start_at)
    end = _coerce_datetime(end_at)
    if start is None or end is None:
        return None
    mins = int((end - start).total_seconds() / 60)
    return max(0, mins)


def _avg(values: list[int]) -> float:
    if not values:
        return 0.0
    return round(sum(values) / len(values), 1)


def _index_events_by_vehicle(events: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    by_vehicle: dict[str, list[dict[str, Any]]] = {}
    for event in events:
        vid = event.get("vehicle_id")
        if not vid:
            continue
        key = str(vid)
        by_vehicle.setdefault(key, []).append(event)
    for rows in by_vehicle.values():
        rows.sort(key=lambda e: _coerce_datetime(e.get("event_time")) or datetime.min.replace(tzinfo=timezone.utc))
    return by_vehicle


def _index_queues_by_vehicle(queues: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    by_vehicle: dict[str, dict[str, Any]] = {}
    for queue in queues:
        vid = queue.get("vehicle_id")
        if not vid:
            continue
        key = str(vid)
        existing = by_vehicle.get(key)
        if existing is None:
            by_vehicle[key] = queue
            continue
        existing_checkin = _coerce_datetime(existing.get("checkin_time"))
        new_checkin = _coerce_datetime(queue.get("checkin_time"))
        if new_checkin and (existing_checkin is None or new_checkin < existing_checkin):
            by_vehicle[key] = queue
    return by_vehicle


def resolve_check_in_time(
    vehicle_id: Any,
    queues_by_vehicle: dict[str, dict[str, Any]],
    events_by_vehicle: dict[str, list[dict[str, Any]]],
) -> Any:
    """Check-in time from queue_entries.checkin_time, else earliest gate-in yard event."""
    key = str(vehicle_id)
    queue = queues_by_vehicle.get(key)
    if queue and queue.get("checkin_time"):
        return queue["checkin_time"]
    for event in events_by_vehicle.get(key, []):
        if event.get("event_type") in CHECK_IN_EVENT_TYPES:
            return event.get("event_time")
    return None


def resolve_loading_started(events: list[dict[str, Any]]) -> Any:
    for event in reversed(events):
        if event.get("event_type") == "LOADING_STARTED":
            return event.get("event_time")
    return None


def resolve_loading_completed(events: list[dict[str, Any]]) -> Any:
    for event in reversed(events):
        if event.get("event_type") == "LOADING_COMPLETED":
            return event.get("event_time")
    return None


def vehicle_timing_metrics(
    vehicle: dict[str, Any],
    queues_by_vehicle: dict[str, dict[str, Any]],
    events_by_vehicle: dict[str, list[dict[str, Any]]],
) -> dict[str, int | None]:
    vid = str(vehicle["id"])
    veh_events = events_by_vehicle.get(vid, [])
    check_in = resolve_check_in_time(vid, queues_by_vehicle, events_by_vehicle)
    loading_start = resolve_loading_started(veh_events)
    loading_end = resolve_loading_completed(veh_events)
    exit_time = vehicle.get("exit_time")

    waiting = _minutes_between(check_in, loading_start) if check_in and loading_start else None
    loading = _minutes_between(loading_start, loading_end) if loading_start and loading_end else None
    turnaround = _minutes_between(check_in, exit_time) if check_in and exit_time else None

    return {
        "waiting_minutes": waiting,
        "loading_minutes": loading,
        "turnaround_minutes": turnaround,
    }


def is_vehicle_sla_compliant(metrics: dict[str, int | None]) -> bool:
    waiting = metrics.get("waiting_minutes")
    loading = metrics.get("loading_minutes")
    turnaround = metrics.get("turnaround_minutes")
    if waiting is None or loading is None or turnaround is None:
        return False
    return (
        waiting <= OPERATIONS_SLA["waiting_minutes"]
        and loading <= OPERATIONS_SLA["loading_minutes"]
        and turnaround <= OPERATIONS_SLA["turnaround_minutes"]
    )


def compute_operations_dashboard(
    *,
    vehicles: list[dict[str, Any]],
    appointments: list[dict[str, Any]],
    queues: list[dict[str, Any]],
    events: list[dict[str, Any]],
    today: date | None = None,
) -> dict[str, Any]:
    today = today or _today()
    queues_by_vehicle = _index_queues_by_vehicle(queues)
    events_by_vehicle = _index_events_by_vehicle(events)

    appointments_today = sum(1 for a in appointments if _date_of(a.get("booking_date")) == today)

    entered_vehicle_ids: set[str] = set()
    for queue in queues:
        if queue.get("checkin_time") and _date_of(queue["checkin_time"]) == today:
            entered_vehicle_ids.add(str(queue["vehicle_id"]))
    for event in events:
        if event.get("event_type") in CHECK_IN_EVENT_TYPES and _date_of(event.get("event_time")) == today:
            vid = event.get("vehicle_id")
            if vid:
                entered_vehicle_ids.add(str(vid))

    vehicles_exited_today = [
        v for v in vehicles if v.get("status") == "EXITED" and _date_of(v.get("exit_time")) == today
    ]

    vehicles_in_yard = count_vehicles_in_yard(vehicles)
    vehicles_waiting = count_vehicles_waiting(vehicles)
    vehicles_loading = count_vehicles_loading(vehicles)
    vehicles_exit_holding = count_vehicles_exit_holding(vehicles)

    turnaround_samples: list[int] = []
    waiting_samples: list[int] = []
    loading_samples: list[int] = []
    sla_evaluated = 0
    sla_compliant = 0

    for vehicle in vehicles_exited_today:
        metrics = vehicle_timing_metrics(vehicle, queues_by_vehicle, events_by_vehicle)
        if metrics["turnaround_minutes"] is not None:
            turnaround_samples.append(metrics["turnaround_minutes"])
        if metrics["waiting_minutes"] is not None:
            waiting_samples.append(metrics["waiting_minutes"])
        if metrics["loading_minutes"] is not None:
            loading_samples.append(metrics["loading_minutes"])
        if all(metrics[k] is not None for k in ("waiting_minutes", "loading_minutes", "turnaround_minutes")):
            sla_evaluated += 1
            if is_vehicle_sla_compliant(metrics):
                sla_compliant += 1

    sla_pct = round((sla_compliant / sla_evaluated) * 100, 1) if sla_evaluated else 0.0

    return {
        "appointmentsToday": appointments_today,
        "vehiclesEnteredToday": len(entered_vehicle_ids),
        "vehiclesExitedToday": len(vehicles_exited_today),
        "vehiclesInYard": vehicles_in_yard,
        "vehiclesWaiting": vehicles_waiting,
        "vehiclesLoading": vehicles_loading,
        "vehiclesInExitHolding": vehicles_exit_holding,
        "avgTurnaroundMinutes": _avg(turnaround_samples),
        "avgWaitingMinutes": _avg(waiting_samples),
        "avgLoadingMinutes": _avg(loading_samples),
        "slaCompliancePct": sla_pct,
    }


async def get_operations_dashboard() -> dict[str, Any]:
    vehicles, _ = await list_vehicles()
    appointments, _ = await list_appointments()
    queues, _ = await list_queue_entries()
    events, _ = await list_yard_events()
    return compute_operations_dashboard(
        vehicles=vehicles,
        appointments=appointments,
        queues=queues,
        events=events,
    )
