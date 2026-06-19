"""Shared reporting utilities — timelines, durations, SLA (live YMS data only)."""

from __future__ import annotations

from datetime import date, datetime, timezone
from typing import Any

from services.loading_exceptions_service import compute_pause_state

REPORT_SLA = {
    "waiting_minutes": 60,
    "loading_minutes": 120,
    "turnaround_minutes": 240,
}

CHECK_IN_EVENT_TYPES = frozenset({"VEHICLE_CHECKED_IN", "QUEUE_ENTRY_CREATED"})

TIMELINE_EVENT_LABELS: dict[str, str] = {
    "APPOINTMENT_CREATED": "Appointment Created",
    "VEHICLE_CREATED": "Vehicle Registered",
    "VEHICLE_ARRIVED": "Arrived",
    "ENTRY_APPROVED": "Entry Approved",
    "VEHICLE_CHECKED_IN": "Checked In",
    "QUEUE_ENTRY_CREATED": "Checked In",
    "VEHICLE_CALLED": "Called",
    "QUEUE_CALLED": "Called",
    "DOCK_ASSIGNED": "Dock Assigned",
    "DOCK_REASSIGNED": "Dock Assigned",
    "TEAM_ASSIGNED": "Labor Assigned",
    "EQUIPMENT_ASSIGNED": "Equipment Assigned",
    "READY_FOR_LOADING": "Ready For Loading",
    "LOADING_STARTED": "Loading Started",
    "LOADING_PAUSED": "Loading Paused",
    "LOADING_RESUMED": "Loading Resumed",
    "LOADING_COMPLETED": "Loading Completed",
    "EXIT_HOLDING": "Exit Holding",
    "EXIT_VERIFIED": "Exit Verified",
    "GATE_OUT_APPROVED": "Gate Out",
    "VEHICLE_EXITED": "Exited",
    "EXCEPTION_CREATED": "Exception Created",
    "EXCEPTION_ASSIGNED": "Exception Assigned",
    "EXCEPTION_RESOLVED": "Exception Resolved",
    "EXCEPTION_CLOSED": "Exception Closed",
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def coerce_datetime(value: Any) -> datetime | None:
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


def date_of(value: Any) -> date | None:
    dt = coerce_datetime(value)
    return dt.date() if dt else None


def minutes_between(start_at: Any, end_at: Any) -> int | None:
    start = coerce_datetime(start_at)
    end = coerce_datetime(end_at)
    if start is None or end is None:
        return None
    return max(0, int((end - start).total_seconds() / 60))


def avg(values: list[int | float]) -> float:
    if not values:
        return 0.0
    return round(sum(values) / len(values), 1)


def pct(numerator: int, denominator: int) -> float:
    if denominator <= 0:
        return 0.0
    return round((numerator / denominator) * 100, 1)


def in_date_range(value: Any, date_from: date | None, date_to: date | None) -> bool:
    d = date_of(value)
    if d is None:
        return False
    if date_from and d < date_from:
        return False
    if date_to and d > date_to:
        return False
    return True


def event_in_range(event: dict[str, Any], date_from: date | None, date_to: date | None) -> bool:
    return in_date_range(event.get("event_time"), date_from, date_to)


def filter_events_by_range(
    events: list[dict[str, Any]],
    date_from: date | None,
    date_to: date | None,
) -> list[dict[str, Any]]:
    if not date_from and not date_to:
        return events
    return [e for e in events if event_in_range(e, date_from, date_to)]


def first_event_time(events: list[dict[str, Any]], event_types: set[str]) -> Any:
    for event in events:
        if event.get("event_type") in event_types:
            return event.get("event_time")
    return None


def last_event_time(events: list[dict[str, Any]], event_types: set[str]) -> Any:
    for event in reversed(events):
        if event.get("event_type") in event_types:
            return event.get("event_time")
    return None


def timeline_label(event: dict[str, Any]) -> str | None:
    event_type = event.get("event_type") or ""
    if event_type in TIMELINE_EVENT_LABELS:
        return TIMELINE_EVENT_LABELS[event_type]
    if event_type == "VEHICLE_STATUS_CHANGED":
        note = (event.get("event_note") or "").upper()
        for status, label in (
            ("WAITING", "Waiting"),
            ("CALLED", "Called"),
            ("READY_FOR_LOADING", "Ready For Loading"),
            ("LOADING", "Loading Started"),
            ("COMPLETED", "Loading Completed"),
            ("EXIT_HOLDING", "Exit Holding"),
            ("EXIT_VERIFIED", "Exit Verified"),
            ("EXITED", "Exited"),
        ):
            if status in note:
                return label
    return None


def build_timeline(
    events: list[dict[str, Any]],
    *,
    queue: dict[str, Any] | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[dict[str, Any]]:
    """Chronological timeline from yard_events + queue milestone fallbacks."""
    filtered = filter_events_by_range(events, date_from, date_to)
    items: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()

    for event in sorted(filtered, key=lambda e: coerce_datetime(e.get("event_time")) or datetime.min.replace(tzinfo=timezone.utc)):
        label = timeline_label(event)
        if not label:
            continue
        ts = event.get("event_time")
        key = (label, str(coerce_datetime(ts)))
        if key in seen:
            continue
        seen.add(key)
        items.append(
            {
                "eventType": label,
                "timestamp": coerce_datetime(ts).isoformat() if ts else None,
                "user": event.get("created_by") or "system",
                "notes": event.get("event_note"),
                "rawEventType": event.get("event_type"),
            }
        )

    synthetic: list[tuple[str, Any, str]] = []
    if queue:
        if queue.get("checkin_time"):
            synthetic.append(("Checked In", queue["checkin_time"], "queue.checkin_time"))
        if queue.get("called_time"):
            synthetic.append(("Called", queue["called_time"], "queue.called_time"))
        if queue.get("dock_assigned_time"):
            synthetic.append(("Dock Assigned", queue["dock_assigned_time"], "queue.dock_assigned_time"))

    for label, ts, source in synthetic:
        if not in_date_range(ts, date_from, date_to):
            continue
        key = (label, str(coerce_datetime(ts)))
        if key in seen:
            continue
        seen.add(key)
        items.append(
            {
                "eventType": label,
                "timestamp": coerce_datetime(ts).isoformat() if ts else None,
                "user": "system",
                "notes": source,
                "rawEventType": None,
            }
        )

    items.sort(key=lambda i: coerce_datetime(i.get("timestamp")) or datetime.min.replace(tzinfo=timezone.utc))
    return items


def journey_milestone_times(events: list[dict[str, Any]], queue: dict[str, Any] | None, vehicle: dict[str, Any]) -> dict[str, Any]:
    check_in = (
        queue.get("checkin_time") if queue and queue.get("checkin_time") else None
    ) or first_event_time(events, CHECK_IN_EVENT_TYPES)
    called = (
        queue.get("called_time") if queue and queue.get("called_time") else None
    ) or first_event_time(events, {"VEHICLE_CALLED", "QUEUE_CALLED"})
    dock_assigned = (
        queue.get("dock_assigned_time") if queue and queue.get("dock_assigned_time") else None
    ) or first_event_time(events, {"DOCK_ASSIGNED", "DOCK_REASSIGNED"})
    ready = first_event_time(events, {"READY_FOR_LOADING"}) or last_event_time(
        [e for e in events if e.get("event_type") == "VEHICLE_STATUS_CHANGED" and "READY_FOR_LOADING" in (e.get("event_note") or "").upper()],
        {"VEHICLE_STATUS_CHANGED"},
    )
    loading_start = last_event_time(events, {"LOADING_STARTED"})
    loading_end = last_event_time(events, {"LOADING_COMPLETED"})
    exit_holding = first_event_time(events, {"EXIT_HOLDING"}) or last_event_time(
        [e for e in events if "EXIT_HOLDING" in (e.get("event_note") or "").upper()],
        {"VEHICLE_STATUS_CHANGED"},
    )
    exit_verified = first_event_time(events, {"EXIT_VERIFIED"})
    gate_out = first_event_time(events, {"GATE_OUT_APPROVED", "VEHICLE_EXITED"})
    exited = vehicle.get("exit_time") or last_event_time(events, {"VEHICLE_EXITED"})

    pause_state = compute_pause_state(
        events,
        vehicle_id=str(vehicle.get("id")) if vehicle.get("id") else None,
        queue_entry_id=str(queue.get("id")) if queue and queue.get("id") else None,
    )

    waiting = minutes_between(check_in, called or dock_assigned or loading_start)
    called_duration = minutes_between(called, dock_assigned) if called and dock_assigned else None
    dock_assignment = minutes_between(dock_assigned, loading_start or ready)
    loading = minutes_between(loading_start, loading_end)
    exit_holding_duration = minutes_between(exit_holding, exit_verified or gate_out or exited)
    turnaround = minutes_between(check_in, exited or gate_out)

    return {
        "checkIn": check_in,
        "called": called,
        "dockAssigned": dock_assigned,
        "readyForLoading": ready,
        "loadingStart": loading_start,
        "loadingEnd": loading_end,
        "exitHolding": exit_holding,
        "exitVerified": exit_verified,
        "gateOut": gate_out,
        "exited": exited,
        "waitingMinutes": waiting,
        "calledMinutes": called_duration,
        "dockAssignmentMinutes": dock_assignment,
        "loadingMinutes": loading,
        "pausedMinutes": pause_state.get("total_paused_min", 0),
        "exitHoldingMinutes": exit_holding_duration,
        "turnaroundMinutes": turnaround,
    }


def sla_analysis(metrics: dict[str, Any]) -> dict[str, bool | None]:
    waiting = metrics.get("waitingMinutes")
    loading = metrics.get("loadingMinutes")
    turnaround = metrics.get("turnaroundMinutes")
    return {
        "waitingSlaMet": waiting <= REPORT_SLA["waiting_minutes"] if waiting is not None else None,
        "loadingSlaMet": loading <= REPORT_SLA["loading_minutes"] if loading is not None else None,
        "turnaroundSlaMet": (
            turnaround <= REPORT_SLA["turnaround_minutes"] if turnaround is not None else None
        ),
    }


def exception_metrics(exceptions: list[dict[str, Any]]) -> dict[str, Any]:
    count = len(exceptions)
    resolution_samples: list[int] = []
    for row in exceptions:
        if row.get("resolved_at") and row.get("created_at"):
            mins = minutes_between(row.get("created_at"), row.get("resolved_at"))
            if mins is not None:
                resolution_samples.append(mins)
    return {
        "exceptionCount": count,
        "exceptionResolutionMinutes": avg(resolution_samples) if resolution_samples else None,
    }


def material_type_from_appointment(appointment: dict[str, Any] | None) -> str:
    if not appointment:
        return "—"
    ref = appointment.get("shipment_reference") or ""
    parts = ref.split("|")
    if len(parts) >= 2 and parts[1].strip():
        return parts[1].strip()
    return ref or "—"
