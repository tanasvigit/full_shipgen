"""Unit tests for yard zone master, capacity, and rules."""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from enums import MANDATORY_YARD_ZONE_TYPES, YARD_ZONE_STATUSES, YARD_ZONE_TYPES
from services.yard_service import (
    _validate_zone_status,
    _validate_zone_type,
    build_yard_dashboard,
    validate_zone_rules,
)


def test_yard_zone_types_complete():
    for t in [
        "LOADING",
        "UNLOADING",
        "DOCUMENTATION",
        "WAITING_AREA",
        "STAGING",
        "HAZMAT",
        "COLD_CHAIN",
        "EMERGENCY_HOLDING",
        "EXIT_HOLDING",
        "GATE_IN",
        "GATE_OUT",
        "CUSTOM",
    ]:
        assert t in YARD_ZONE_TYPES


def test_mandatory_zones():
    assert MANDATORY_YARD_ZONE_TYPES == {"GATE_IN", "GATE_OUT", "WAITING_AREA", "EXIT_HOLDING"}


def test_zone_statuses():
    assert YARD_ZONE_STATUSES == {"ACTIVE", "FULL", "BLOCKED", "MAINTENANCE"}


def test_validate_zone_type_rejects_unknown():
    with pytest.raises(HTTPException) as exc:
        _validate_zone_type("INVALID")
    assert exc.value.status_code == 400


def test_validate_zone_status_rejects_unknown():
    with pytest.raises(HTTPException) as exc:
        _validate_zone_status("OPEN")
    assert exc.value.status_code == 400


def test_build_yard_dashboard_aggregates():
    zones = [
        {"max_capacity": 10, "currentOccupancy": 5, "status": "ACTIVE"},
        {"max_capacity": 20, "currentOccupancy": 20, "status": "FULL"},
        {"max_capacity": 5, "currentOccupancy": 0, "status": "BLOCKED"},
    ]

    async def run():
        with patch(
            "services.yard_service.list_yard_zones",
            new_callable=AsyncMock,
            return_value=(zones, 3),
        ):
            return await build_yard_dashboard()

    result = asyncio.run(run())
    assert result["totalZones"] == 3
    assert result["totalCapacity"] == 35
    assert result["currentOccupancy"] == 25
    assert result["availableSlots"] == 10
    assert result["blockedZones"] == 1
    assert result["fullZones"] == 1


def test_hazmat_rule_blocks_non_hazmat_cargo():
    zone = {"zone_type": "HAZMAT", "zone_name": "Hazmat", "zone_code": "ZN-D"}
    conn = AsyncMock()
    conn.fetchrow = AsyncMock(return_value={"status": "WAITING"})
    conn.fetch = AsyncMock(return_value=[])

    async def run():
        with patch(
            "services.yard_service._get_vehicle_context",
            new_callable=AsyncMock,
            return_value=({}, {"shipment_reference": "General cargo bags"}, None),
        ):
            return await validate_zone_rules("v1", zone, conn=conn)

    ok, reason = asyncio.run(run())
    assert ok is False
    assert "HAZMAT" in (reason or "")


def test_cold_chain_rule_allows_matching_cargo():
    zone = {"zone_type": "COLD_CHAIN", "zone_name": "Cold", "zone_code": "ZN-E"}
    conn = AsyncMock()
    conn.fetchrow = AsyncMock(return_value={"status": "WAITING"})
    conn.fetch = AsyncMock(return_value=[])

    async def run():
        with patch(
            "services.yard_service._get_vehicle_context",
            new_callable=AsyncMock,
            return_value=({}, {"shipment_reference": "Pharma cold chain pallets"}, None),
        ):
            return await validate_zone_rules("v1", zone, conn=conn)

    ok, reason = asyncio.run(run())
    assert ok is True
    assert reason is None
