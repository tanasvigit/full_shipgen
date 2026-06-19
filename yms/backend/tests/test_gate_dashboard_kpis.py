"""Gate dashboard KPIs align with operational_metrics canonical counts."""

from services.gate_service import _derive_activity_tab
from services.operational_metrics import (
    LOADING_PIPELINE_STATUSES,
    count_vehicles_exit_holding,
    count_vehicles_loading_pipeline,
    count_vehicles_waiting,
)


def test_derive_activity_tab_waiting_only_for_waiting_status():
    tab = _derive_activity_tab(
        {"status": "WAITING"},
        {"status": "WAITING"},
        {"status": "WAITING"},
        [],
    )
    assert tab == "WAITING"


def test_derive_activity_tab_loading_pipeline_for_called():
    tab = _derive_activity_tab(
        {"status": "CALLED"},
        {"status": "CALLED"},
        {"status": "CALLED"},
        [],
    )
    assert tab == "LOADING_PIPELINE"


def test_derive_activity_tab_loading_pipeline_for_loading():
    tab = _derive_activity_tab(
        {"status": "LOADING"},
        {"status": "LOADING"},
        {"status": "LOADING"},
        [],
    )
    assert tab == "LOADING_PIPELINE"


def test_canonical_kpi_counts_match_operations_definitions():
    vehicles = [
        {"status": "WAITING"},
        {"status": "WAITING"},
        {"status": "WAITING"},
        {"status": "CALLED"},
        {"status": "LOADING"},
        {"status": "READY_FOR_LOADING"},
        {"status": "RESOURCE_PENDING"},
        {"status": "EXIT_HOLDING"},
        {"status": "EXIT_VERIFIED"},
        {"status": "ARRIVED"},
    ]
    assert count_vehicles_waiting(vehicles) == 3
    assert count_vehicles_loading_pipeline(vehicles) == 4
    assert count_vehicles_exit_holding(vehicles) == 2
    assert LOADING_PIPELINE_STATUSES == {
        "CALLED",
        "DOCK_ASSIGNED",
        "RESOURCE_PENDING",
        "READY_FOR_LOADING",
        "LOADING",
    }
