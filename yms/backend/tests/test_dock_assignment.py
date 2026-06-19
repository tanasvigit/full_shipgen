"""Tests for dock assignment bridge — recommendation, capacity, staging flow."""

from services.queue_service import (
    _dock_has_capacity,
    _dock_occupancy,
    recommend_dock,
)


def test_recommend_dock_returns_reasons_and_score():
    appointment = {"shipment_reference": "Loading|Auto Parts|Hub"}
    vehicle = {"vehicle_type": "Tempo"}
    docks = [
        {
            "id": "d1",
            "dock_code": "DK-01",
            "dock_name": "General 1",
            "dock_type": "GENERAL",
            "status": "AVAILABLE",
            "supported_cargo_types": ["GENERAL"],
            "supported_vehicle_types": ["TEMPO", "LCV"],
            "max_capacity": 1,
            "current_vehicle_id": None,
        }
    ]
    rec = recommend_dock(
        appointment=appointment,
        vehicle=vehicle,
        docks=docks,
        labor_rows=[{"status": "ON_DUTY"}],
        equipment_rows=[{"status": "IDLE"}],
        queue_rows=[],
    )
    assert rec is not None
    assert rec["dockCode"] == "DK-01"
    assert rec["score"] > 0
    assert "Material Match" in rec["reasons"]
    assert "Dock Available" in rec["reasons"]


def test_dock_capacity_blocks_when_full():
    dock = {
        "id": "d1",
        "max_capacity": 1,
        "current_vehicle_id": "v-existing",
    }
    assert _dock_occupancy(dock, []) == 1
    assert _dock_has_capacity(dock, []) is False


def test_dock_capacity_allows_when_under_max():
    dock = {
        "id": "d1",
        "max_capacity": 3,
        "current_vehicle_id": None,
    }
    queues = [{"dock_id": "d1", "status": "DOCK_ASSIGNED"}]
    assert _dock_occupancy(dock, queues) == 1
    assert _dock_has_capacity(dock, queues) is True
