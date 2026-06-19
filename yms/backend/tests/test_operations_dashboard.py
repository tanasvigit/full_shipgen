"""Operations Dashboard KPI calculations."""

import asyncio
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, patch

from services.operations_dashboard_service import (
    OPERATIONS_SLA,
    compute_operations_dashboard,
    is_vehicle_sla_compliant,
    vehicle_timing_metrics,
)


TODAY = date(2026, 6, 3)
TZ = timezone.utc


def _dt(hour: int, minute: int = 0) -> datetime:
    return datetime(2026, 6, 3, hour, minute, tzinfo=TZ)


def _vehicle(vid: str, status: str = "EXITED", exit_time: datetime | None = None) -> dict:
    return {"id": vid, "status": status, "exit_time": exit_time}


def _queue(vid: str, checkin: datetime) -> dict:
    return {"vehicle_id": vid, "checkin_time": checkin, "status": "EXITED"}


def _event(vid: str, event_type: str, event_time: datetime) -> dict:
    return {"vehicle_id": vid, "event_type": event_type, "event_time": event_time}


def test_operations_dashboard_counts():
    vehicles = [
        _vehicle("v1", "WAITING"),
        _vehicle("v2", "CALLED"),
        _vehicle("v3", "LOADING"),
        _vehicle("v4", "READY_FOR_LOADING"),
        _vehicle("v5", "EXIT_HOLDING"),
        _vehicle("v6", "EXIT_VERIFIED"),
        _vehicle("v7", "EXITED", _dt(18)),
        _vehicle("v8", "CANCELLED"),
        _vehicle("v9", "SCHEDULED"),
    ]
    appointments = [
        {"booking_date": TODAY},
        {"booking_date": TODAY},
        {"booking_date": date(2026, 6, 2)},
    ]
    queues = [
        _queue("v1", _dt(8)),
        _queue("v7", _dt(7, 30)),
    ]
    events = [_event("v10", "VEHICLE_CHECKED_IN", _dt(9))]

    result = compute_operations_dashboard(
        vehicles=vehicles,
        appointments=appointments,
        queues=queues,
        events=events,
        today=TODAY,
    )

    assert result["appointmentsToday"] == 2
    assert result["vehiclesEnteredToday"] == 3
    assert result["vehiclesExitedToday"] == 1
    assert result["vehiclesInYard"] == 7
    assert result["vehiclesWaiting"] == 1  # WAITING only (CALLED is staging, not waiting)
    assert result["vehiclesLoading"] == 2
    assert result["vehiclesInExitHolding"] == 2


def test_turnaround_calculation():
    vid = "v-turn"
    vehicle = _vehicle(vid, "EXITED", _dt(14))
    queues = [_queue(vid, _dt(8))]
    events = []

    metrics = vehicle_timing_metrics(vehicle, {vid: queues[0]}, {})
    assert metrics["turnaround_minutes"] == 360

    result = compute_operations_dashboard(
        vehicles=[vehicle],
        appointments=[],
        queues=queues,
        events=events,
        today=TODAY,
    )
    assert result["avgTurnaroundMinutes"] == 360.0


def test_waiting_time_calculation():
    vid = "v-wait"
    vehicle = _vehicle(vid, "EXITED", _dt(16))
    queues = [_queue(vid, _dt(8))]
    events = [
        _event(vid, "LOADING_STARTED", _dt(9, 30)),
        _event(vid, "LOADING_COMPLETED", _dt(11)),
    ]

    metrics = vehicle_timing_metrics(vehicle, {vid: queues[0]}, {vid: events})
    assert metrics["waiting_minutes"] == 90

    result = compute_operations_dashboard(
        vehicles=[vehicle],
        appointments=[],
        queues=queues,
        events=events,
        today=TODAY,
    )
    assert result["avgWaitingMinutes"] == 90.0


def test_loading_time_calculation():
    vid = "v-load"
    vehicle = _vehicle(vid, "EXITED", _dt(15))
    queues = [_queue(vid, _dt(7))]
    events = [
        _event(vid, "LOADING_STARTED", _dt(10)),
        _event(vid, "LOADING_COMPLETED", _dt(12, 30)),
    ]

    metrics = vehicle_timing_metrics(vehicle, {vid: queues[0]}, {vid: events})
    assert metrics["loading_minutes"] == 150

    result = compute_operations_dashboard(
        vehicles=[vehicle],
        appointments=[],
        queues=queues,
        events=events,
        today=TODAY,
    )
    assert result["avgLoadingMinutes"] == 150.0


def test_sla_compliance():
    compliant_metrics = {
        "waiting_minutes": 45,
        "loading_minutes": 90,
        "turnaround_minutes": 200,
    }
    non_compliant_metrics = {
        "waiting_minutes": 75,
        "loading_minutes": 90,
        "turnaround_minutes": 200,
    }
    assert is_vehicle_sla_compliant(compliant_metrics) is True
    assert is_vehicle_sla_compliant(non_compliant_metrics) is False

    good = _vehicle("good", "EXITED", _dt(12))
    bad = _vehicle("bad", "EXITED", _dt(13))
    queues = [_queue("good", _dt(8)), _queue("bad", _dt(8))]
    events = [
        _event("good", "LOADING_STARTED", _dt(8, 30)),
        _event("good", "LOADING_COMPLETED", _dt(9, 30)),
        _event("bad", "LOADING_STARTED", _dt(9, 30)),
        _event("bad", "LOADING_COMPLETED", _dt(10)),
    ]

    result = compute_operations_dashboard(
        vehicles=[good, bad],
        appointments=[],
        queues=queues,
        events=events,
        today=TODAY,
    )
    assert result["slaCompliancePct"] == 50.0
    assert OPERATIONS_SLA["waiting_minutes"] == 60


def test_live_vehicle_counts():
    async def run():
        vehicles = [
            _vehicle("a", "WAITING"),
            _vehicle("b", "LOADING"),
            _vehicle("c", "EXITED", _dt(20)),
        ]
        with patch(
            "services.operations_dashboard_service.list_vehicles",
            new_callable=AsyncMock,
            return_value=(vehicles, 3),
        ), patch(
            "services.operations_dashboard_service.list_appointments",
            new_callable=AsyncMock,
            return_value=([], 0),
        ), patch(
            "services.operations_dashboard_service.list_queue_entries",
            new_callable=AsyncMock,
            return_value=([], 0),
        ), patch(
            "services.operations_dashboard_service.list_yard_events",
            new_callable=AsyncMock,
            return_value=([], 0),
        ), patch(
            "services.operations_dashboard_service._today",
            return_value=TODAY,
        ):
            from services.operations_dashboard_service import get_operations_dashboard

            return await get_operations_dashboard()

    result = asyncio.run(run())
    assert result["vehiclesInYard"] == 2
    assert result["vehiclesWaiting"] == 1
    assert result["vehiclesLoading"] == 1
    assert result["vehiclesExitedToday"] == 1
