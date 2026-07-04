"""Loading operation exceptions — pause state and Control Tower integration."""

from datetime import datetime, timedelta, timezone

from services.control_tower_alerts_service import compute_control_tower_alerts
from services.loading_exceptions_service import (
    compute_loading_complete_state,
    compute_pause_state,
    exception_severity,
)

TZ = timezone.utc
NOW = datetime(2026, 6, 3, 14, 0, tzinfo=TZ)


def test_exception_severity_mapping():
    assert exception_severity("EQUIPMENT_FAILURE") == "CRITICAL"
    assert exception_severity("SAFETY_HOLD") == "CRITICAL"
    assert exception_severity("MATERIAL_SHORTAGE") == "WARNING"


def test_compute_pause_state_active_and_total():
    started = NOW - timedelta(minutes=20)
    events = [
        {
            "vehicle_id": "v1",
            "event_type": "LOADING_PAUSED",
            "event_time": started,
            "event_note": "Material Shortage",
        },
    ]
    state = compute_pause_state(events, vehicle_id="v1", queue_entry_id=None, now=NOW)
    assert state["paused"] is True
    assert state["pause_reason"] == "Material Shortage"
    assert state["paused_duration_min"] == 20
    assert state["total_paused_min"] == 20


def test_compute_pause_state_resume_preserves_total():
    pause1 = NOW - timedelta(minutes=50)
    resume1 = NOW - timedelta(minutes=40)
    pause2 = NOW - timedelta(minutes=15)
    events = [
        {"vehicle_id": "v1", "event_type": "LOADING_PAUSED", "event_time": pause1, "event_note": "Hold"},
        {"vehicle_id": "v1", "event_type": "LOADING_RESUMED", "event_time": resume1},
        {"vehicle_id": "v1", "event_type": "LOADING_PAUSED", "event_time": pause2, "event_note": "Safety"},
    ]
    state = compute_pause_state(events, vehicle_id="v1", queue_entry_id=None, now=NOW)
    assert state["paused"] is True
    assert state["total_paused_min"] == 25  # 10 + 15


def test_compute_loading_complete_state_awaiting_release():
    started = NOW - timedelta(minutes=40)
    completed = NOW - timedelta(minutes=5)
    events = [
        {"vehicle_id": "v1", "event_type": "LOADING_STARTED", "event_time": started},
        {"vehicle_id": "v1", "event_type": "LOADING_COMPLETED", "event_time": completed},
    ]
    state = compute_loading_complete_state(events, vehicle_id="v1", queue_entry_id=None)
    assert state["awaiting_release"] is True
    assert state["loading_completed"] is True


def test_compute_loading_complete_state_cleared_after_dock_release():
    started = NOW - timedelta(minutes=40)
    completed = NOW - timedelta(minutes=10)
    released = NOW - timedelta(minutes=2)
    events = [
        {"vehicle_id": "v1", "event_type": "LOADING_STARTED", "event_time": started},
        {"vehicle_id": "v1", "event_type": "LOADING_COMPLETED", "event_time": completed},
        {"vehicle_id": "v1", "event_type": "DOCK_RELEASED", "event_time": released},
    ]
    state = compute_loading_complete_state(events, vehicle_id="v1", queue_entry_id=None)
    assert state["awaiting_release"] is False


def test_control_tower_loading_exception_alert():
    created = NOW - timedelta(minutes=22)
    result = compute_control_tower_alerts(
        vehicles=[{"id": "v1", "vehicle_number": "APXI1000", "status": "LOADING"}],
        appointments=[],
        queues=[{"vehicle_id": "v1", "dock_id": "d1", "status": "LOADING"}],
        docks=[{"id": "d1", "dock_code": "DK-006"}],
        labor_teams=[],
        equipment_rows=[],
        events=[],
        loading_exceptions=[
            {
                "id": "ex-1",
                "vehicle_id": "v1",
                "dock_id": "d1",
                "exception_type": "MATERIAL_SHORTAGE",
                "status": "OPEN",
                "created_at": created,
            }
        ],
        now=NOW,
    )
    alert = next(a for a in result["activeAlerts"] if a["alertType"] == "LOADING_EXCEPTION")
    assert alert["severity"] == "WARNING"
    assert alert["vehicle"] == "APXI1000"
    assert alert["dock"] == "DK-006"
    assert alert["exceptionType"] == "MATERIAL_SHORTAGE"
    assert alert["exceptionStatus"] == "OPEN"
    assert alert["durationMin"] == 22
