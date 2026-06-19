"""Dock occupancy consistency guards."""

import asyncio

import pytest
from fastapi import HTTPException


def test_update_dock_rejects_available_with_vehicle():
    async def run():
        from services.yms_service import _validate_dock_status_invariants

        current = {
            "id": "d1",
            "dock_code": "D1",
            "dock_name": "Dock 1",
            "dock_type": "Loading",
            "zone": "A",
            "supported_vehicle_types": ["TRUCK"],
            "supported_cargo_types": ["GENERAL"],
            "max_capacity": 1,
            "status": "OCCUPIED",
            "current_vehicle_id": "v1",
            "notes": None,
            "estimated_service_time_min": 90,
            "default_labor_id": None,
            "default_equipment_id": None,
        }
        merged = {**current, "status": "AVAILABLE", "current_vehicle_id": "v1"}
        with pytest.raises(HTTPException) as exc:
            _validate_dock_status_invariants(merged, current)
        assert exc.value.status_code == 409

    asyncio.run(run())


def test_update_dock_rejects_occupied_without_vehicle():
    async def run():
        from services.yms_service import _validate_dock_status_invariants

        current = {
            "id": "d1",
            "dock_code": "D1",
            "dock_name": "Dock 1",
            "dock_type": "Loading",
            "zone": "A",
            "supported_vehicle_types": ["TRUCK"],
            "supported_cargo_types": ["GENERAL"],
            "max_capacity": 1,
            "status": "AVAILABLE",
            "current_vehicle_id": None,
            "notes": None,
            "estimated_service_time_min": 90,
            "default_labor_id": None,
            "default_equipment_id": None,
        }
        merged = {**current, "status": "OCCUPIED", "current_vehicle_id": None}
        with pytest.raises(HTTPException) as exc:
            _validate_dock_status_invariants(merged, current)
        assert exc.value.status_code == 409

    asyncio.run(run())
