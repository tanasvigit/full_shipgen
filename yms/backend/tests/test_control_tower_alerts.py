"""Control Tower alert detection tests."""

from datetime import datetime, timedelta, timezone

from services.control_tower_alerts_service import compute_control_tower_alerts

TZ = timezone.utc
NOW = datetime(2026, 6, 3, 14, 0, tzinfo=TZ)


def _vehicle(vid: str, status: str, **extra) -> dict:
    return {"id": vid, "vehicle_number": f"VH-{vid}", "status": status, **extra}


def _queue(vid: str, dock_id: str, **extra) -> dict:
    return {"vehicle_id": vid, "dock_id": dock_id, "status": "LOADING", **extra}


def _event(vid: str, event_type: str, event_time: datetime, dock_id: str | None = None) -> dict:
    row = {"vehicle_id": vid, "event_type": event_type, "event_time": event_time}
    if dock_id:
        row["dock_id"] = dock_id
    return row


def _compute(**kwargs):
    return compute_control_tower_alerts(
        vehicles=kwargs.get("vehicles", []),
        appointments=kwargs.get("appointments", []),
        queues=kwargs.get("queues", []),
        docks=kwargs.get("docks", []),
        labor_teams=kwargs.get("labor_teams", []),
        equipment_rows=kwargs.get("equipment_rows", []),
        events=kwargs.get("events", []),
        loading_exceptions=kwargs.get("loading_exceptions", []),
        now=kwargs.get("now", NOW),
    )


def test_waiting_delay_alert():
    vid = "v1"
    checkin = NOW - timedelta(minutes=75)
    result = _compute(
        vehicles=[_vehicle(vid, "WAITING")],
        queues=[{"vehicle_id": vid, "checkin_time": checkin, "status": "WAITING"}],
    )
    types = [a["alertType"] for a in result["activeAlerts"]]
    assert "VEHICLE_WAITING_TOO_LONG" in types
    alert = next(a for a in result["activeAlerts"] if a["alertType"] == "VEHICLE_WAITING_TOO_LONG")
    assert alert["severity"] == "WARNING"
    assert alert["durationMin"] == 75


def test_loading_delay_alert():
    vid = "v1"
    dock_id = "d1"
    started = NOW - timedelta(minutes=100)
    result = _compute(
        vehicles=[_vehicle(vid, "LOADING")],
        queues=[_queue(vid, dock_id, dock_assigned_time=started)],
        docks=[{"id": dock_id, "dock_code": "DK-001", "status": "OCCUPIED", "estimated_service_time_min": 90}],
        labor_teams=[
            {
                "team_code": "LT001",
                "team_name": "Bravo",
                "assigned_dock_id": dock_id,
                "status": "ASSIGNED",
            }
        ],
        equipment_rows=[
            {
                "equipment_code": "EQ-001",
                "equipment_name": "Forklift-01",
                "assigned_vehicle_id": vid,
                "status": "ASSIGNED",
            }
        ],
        events=[_event(vid, "LOADING_STARTED", started, dock_id)],
    )
    alert = next(a for a in result["activeAlerts"] if a["alertType"] == "LOADING_DELAY")
    assert alert["severity"] == "CRITICAL"
    assert alert["durationMin"] == 100
    assert alert["delayMin"] == 10
    assert alert["dock"] == "DK-001"
    assert alert["labor"] == "LT001 · Bravo"
    assert alert["equipment"] == "EQ-001 · Forklift-01"


def test_exit_holding_delay_alert():
    vid = "v1"
    holding = NOW - timedelta(minutes=45)
    result = _compute(
        vehicles=[_vehicle(vid, "EXIT_HOLDING", exit_holding_at=holding)],
    )
    alert = next(a for a in result["activeAlerts"] if a["alertType"] == "EXIT_HOLDING_DELAY")
    assert alert["severity"] == "WARNING"
    assert alert["durationMin"] == 45


def test_dock_blocked_alert():
    vid = "v1"
    dock_id = "d1"
    progress = NOW - timedelta(minutes=35)
    result = _compute(
        vehicles=[_vehicle(vid, "LOADING")],
        queues=[_queue(vid, dock_id)],
        docks=[{"id": dock_id, "dock_code": "DK-006", "status": "OCCUPIED", "estimated_service_time_min": 120}],
        events=[_event(vid, "LOADING_STARTED", progress, dock_id)],
    )
    alert = next(a for a in result["activeAlerts"] if a["alertType"] == "DOCK_BLOCKED")
    assert alert["severity"] == "CRITICAL"
    assert alert["durationMin"] == 35


def test_waiting_alert_clears_when_vehicle_advances():
    vid = "v1"
    checkin = NOW - timedelta(minutes=75)
    waiting = _compute(
        vehicles=[_vehicle(vid, "WAITING")],
        queues=[{"vehicle_id": vid, "checkin_time": checkin, "status": "WAITING"}],
    )
    assert any(a["alertType"] == "VEHICLE_WAITING_TOO_LONG" for a in waiting["activeAlerts"])

    advanced = _compute(
        vehicles=[_vehicle(vid, "CALLED")],
        queues=[{"vehicle_id": vid, "checkin_time": checkin, "status": "CALLED"}],
    )
    assert not any(a["alertType"] == "VEHICLE_WAITING_TOO_LONG" for a in advanced["activeAlerts"])


def test_queue_congestion_alert():
    vehicles = [_vehicle(f"v{i}", "WAITING") for i in range(11)]
    queues = [
        {"vehicle_id": f"v{i}", "checkin_time": NOW - timedelta(minutes=10), "status": "WAITING"}
        for i in range(11)
    ]
    result = _compute(vehicles=vehicles, queues=queues)
    alert = next(a for a in result["activeAlerts"] if a["alertType"] == "QUEUE_CONGESTION")
    assert alert["severity"] == "WARNING"
    assert alert["durationMin"] == 11
    assert result["warningCount"] >= 1


def test_hazmat_sla_breach_alert():
    vid = "hz1"
    checkin = NOW - timedelta(minutes=40)
    result = _compute(
        vehicles=[_vehicle(vid, "WAITING", material_type="HAZMAT")],
        appointments=[
            {
                "id": "a1",
                "vehicle_id": vid,
                "booking_reference": "APT-HZ-1",
                "shipment_reference": "hazmat cargo",
            }
        ],
        queues=[{"vehicle_id": vid, "checkin_time": checkin, "status": "WAITING"}],
    )
    alert = next(a for a in result["activeAlerts"] if a["alertType"] == "HAZMAT_SLA_BREACH")
    assert alert["severity"] == "CRITICAL"
    assert alert["durationMin"] == 40
    assert result["criticalCount"] >= 1
