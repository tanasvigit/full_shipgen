"""Operational reporting — timeline, metrics, utilization, delay, SLA."""

from datetime import datetime, timedelta, timezone

from services.operational_reports_service import (
    compute_delay_analysis_report,
    compute_dock_utilization_report,
    compute_equipment_utilization_report,
    compute_labor_productivity_report,
    compute_sla_compliance_report,
)
from services.report_export_service import rows_to_csv
from services.reporting_common import (
    REPORT_SLA,
    build_timeline,
    journey_milestone_times,
    sla_analysis,
)
from services.vehicle_journey_report_service import compute_vehicle_journey_report

TZ = timezone.utc
T0 = datetime(2026, 6, 3, 8, 0, tzinfo=TZ)


def _event(vid, event_type, offset_min, **extra):
    return {
        "vehicle_id": vid,
        "event_type": event_type,
        "event_time": T0 + timedelta(minutes=offset_min),
        "created_by": "test",
        "event_note": extra.pop("note", None),
        **extra,
    }


def test_build_timeline_orders_events():
    vid = "v1"
    events = [
        _event(vid, "VEHICLE_CHECKED_IN", 20),
        _event(vid, "LOADING_STARTED", 75),
        _event(vid, "LOADING_COMPLETED", 150),
    ]
    timeline = build_timeline(events)
    assert len(timeline) >= 3
    assert timeline[0]["eventType"] == "Checked In"
    assert timeline[-1]["eventType"] == "Loading Completed"


def test_journey_metrics_and_sla():
    vid = "v1"
    events = [
        _event(vid, "VEHICLE_CHECKED_IN", 0),
        _event(vid, "VEHICLE_CALLED", 30),
        _event(vid, "DOCK_ASSIGNED", 45),
        _event(vid, "LOADING_STARTED", 60),
        _event(vid, "LOADING_COMPLETED", 180),
        _event(vid, "VEHICLE_EXITED", 200),
    ]
    queue = {
        "id": "q1",
        "checkin_time": T0,
        "called_time": T0 + timedelta(minutes=30),
        "dock_assigned_time": T0 + timedelta(minutes=45),
    }
    vehicle = {"id": vid, "exit_time": T0 + timedelta(minutes=200)}
    milestones = journey_milestone_times(events, queue, vehicle)
    assert milestones["waitingMinutes"] == 30
    assert milestones["loadingMinutes"] == 120
    assert milestones["turnaroundMinutes"] == 200
    sla = sla_analysis(milestones)
    assert sla["loadingSlaMet"] is True
    assert sla["turnaroundSlaMet"] is True


def test_compute_vehicle_journey_report_shape():
    vid = "v1"
    events = [_event(vid, "LOADING_STARTED", 10), _event(vid, "LOADING_COMPLETED", 70)]
    report = compute_vehicle_journey_report(
        vehicle={"id": vid, "vehicle_number": "APXI1000"},
        appointment={"booking_reference": "APT-1"},
        queue={"id": "q1", "checkin_time": T0},
        dock={"dock_code": "DK-1"},
        labor=[],
        equipment=[],
        exceptions=[],
        events=events,
    )
    assert report["summary"]["vehicleNumber"] == "APXI1000"
    assert report["metrics"]["loadingMinutes"] == 60
    assert len(report["timeline"]) >= 2


def test_dock_utilization_from_sessions():
    vid = "v1"
    dock_id = "d1"
    events = [
        _event(vid, "DOCK_ASSIGNED", 0, dock_id=dock_id),
        _event(vid, "LOADING_COMPLETED", 90, dock_id=dock_id),
    ]
    report = compute_dock_utilization_report(
        docks=[{"id": dock_id, "dock_code": "DK-1", "estimated_service_time_min": 75}],
        events=events,
        queues_by_vehicle={},
        events_by_vehicle={vid: events},
    )
    row = report["rows"][0]
    assert row["vehiclesHandled"] == 1
    assert row["occupiedMinutes"] == 90


def test_delay_analysis_categories():
    vid = "v1"
    events = [
        _event(vid, "VEHICLE_CHECKED_IN", 0),
        _event(vid, "LOADING_STARTED", 90),
        _event(vid, "LOADING_COMPLETED", 300),
    ]
    queues = {vid: {"vehicle_id": vid, "checkin_time": T0, "dock_id": "d1"}}
    report = compute_delay_analysis_report(
        vehicles=[{"id": vid}],
        queues_by_vehicle=queues,
        events_by_vehicle={vid: events},
        docks_by_id={"d1": {"estimated_service_time_min": 90}},
        exceptions=[],
    )
    cats = {r["categoryKey"]: r for r in report["rows"]}
    assert cats["waitingDelay"]["count"] >= 0
    assert cats["loadingDelay"]["count"] >= 1


def test_sla_compliance_report():
    vid = "v1"
    events = [
        _event(vid, "VEHICLE_CHECKED_IN", 0),
        _event(vid, "LOADING_STARTED", 30),
        _event(vid, "LOADING_COMPLETED", 100),
    ]
    queues = {vid: {"vehicle_id": vid, "checkin_time": T0, "dock_id": "d1"}}
    report = compute_sla_compliance_report(
        vehicles=[{"id": vid}],
        queues_by_vehicle=queues,
        events_by_vehicle={vid: events},
        docks_by_id={"d1": {"dock_code": "DK-1", "estimated_service_time_min": 90}},
        appointments_by_vehicle={},
        labor_teams=[],
        equipment_rows=[],
    )
    assert report["loadingSlaPct"] >= 0
    assert REPORT_SLA["waiting_minutes"] == 60


def test_labor_and_equipment_reports():
    vid = "v1"
    events = [
        _event(vid, "TEAM_ASSIGNED", 5, labor_id="l1"),
        _event(vid, "EQUIPMENT_ASSIGNED", 6, equipment_id="e1"),
        _event(vid, "LOADING_STARTED", 10),
        _event(vid, "LOADING_COMPLETED", 70),
    ]
    labor_report = compute_labor_productivity_report(
        labor_teams=[{"id": "l1", "team_code": "LT1", "team_name": "Alpha"}],
        events=events,
        queues_by_vehicle={vid: {"vehicle_id": vid, "checkin_time": T0}},
        vehicles=[{"id": vid}],
        events_by_vehicle={vid: events},
        exceptions=[],
    )
    assert labor_report["rows"][0]["teamCode"] == "LT1"

    equip_report = compute_equipment_utilization_report(
        equipment_rows=[{"id": "e1", "equipment_code": "EQ-1", "equipment_name": "Forklift"}],
        events=events,
        queues_by_vehicle={vid: {"vehicle_id": vid}},
        vehicles=[{"id": vid}],
        events_by_vehicle={vid: events},
    )
    assert equip_report["rows"][0]["equipmentCode"] == "EQ-1"


def test_csv_export_generation():
    content = rows_to_csv(["a", "b"], [{"a": 1, "b": 2}])
    assert b"a,b" in content
    assert b"1,2" in content
