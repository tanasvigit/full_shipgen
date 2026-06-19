"""Canonical operational vehicle counts shared across dashboards and reports."""

from __future__ import annotations

from typing import Any

from services.yard_service import IN_YARD_VEHICLE_STATUSES

WAITING_VEHICLE_STATUSES = frozenset({"WAITING"})
LOADING_VEHICLE_STATUSES = frozenset({"READY_FOR_LOADING", "LOADING"})
LOADING_PIPELINE_STATUSES = frozenset({
    "CALLED",
    "DOCK_ASSIGNED",
    "RESOURCE_PENDING",
    "READY_FOR_LOADING",
    "LOADING",
})
EXIT_HOLDING_VEHICLE_STATUSES = frozenset({"EXIT_HOLDING", "EXIT_VERIFIED"})


def count_vehicles_in_yard(vehicles: list[dict[str, Any]]) -> int:
    return sum(1 for v in vehicles if v.get("status") in IN_YARD_VEHICLE_STATUSES)


def count_vehicles_waiting(vehicles: list[dict[str, Any]]) -> int:
    return sum(1 for v in vehicles if v.get("status") in WAITING_VEHICLE_STATUSES)


def count_vehicles_loading(vehicles: list[dict[str, Any]]) -> int:
    return sum(1 for v in vehicles if v.get("status") in LOADING_VEHICLE_STATUSES)


def count_vehicles_exit_holding(vehicles: list[dict[str, Any]]) -> int:
    return sum(1 for v in vehicles if v.get("status") in EXIT_HOLDING_VEHICLE_STATUSES)


def count_vehicles_loading_pipeline(vehicles: list[dict[str, Any]]) -> int:
    return sum(1 for v in vehicles if v.get("status") in LOADING_PIPELINE_STATUSES)
