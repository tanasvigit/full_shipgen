"""Vehicle registry — reference generation and journey helpers."""

from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from enums import OPERATION_TYPES, VEHICLE_TYPES
from services.yms_service import _derive_current_stage, _validate_vehicle_type


def test_vehicle_types_enum_matches_dock():
    assert "TRUCK" in VEHICLE_TYPES
    assert "TRAILER" in VEHICLE_TYPES


def test_operation_types_include_loading():
    assert "Loading" in OPERATION_TYPES
    assert "Unloading" in OPERATION_TYPES


def test_validate_vehicle_type_rejects_legacy_fleet_type():
    with pytest.raises(HTTPException) as exc:
        _validate_vehicle_type("32ft SXL")
    assert exc.value.status_code == 400


def test_validate_vehicle_type_accepts_truck():
    _validate_vehicle_type("TRUCK")


def test_derive_current_stage_scheduled():
    vehicle = {"status": "SCHEDULED", "expected_arrival": None}
    assert _derive_current_stage(vehicle, None) == "Scheduled"


def test_derive_current_stage_en_route():
    vehicle = {"status": "SCHEDULED"}
    eta = datetime.now(timezone.utc) + timedelta(minutes=90)
    appointment = {"reporting_time": eta.isoformat()}
    assert _derive_current_stage(vehicle, appointment) == "En Route"


def test_derive_current_stage_approaching():
    vehicle = {"status": "SCHEDULED"}
    eta = datetime.now(timezone.utc) + timedelta(minutes=15)
    appointment = {"reporting_time": eta.isoformat()}
    assert _derive_current_stage(vehicle, appointment) == "Approaching"


def test_derive_current_stage_waiting_from_status():
    vehicle = {"status": "WAITING"}
    assert _derive_current_stage(vehicle, None) == "Waiting"


def test_generate_vehicle_reference_substring_uses_prefix_length():
    """asyncpg must not bind integer to SUBSTRING(... FROM n) — use char_length(prefix)."""
    import asyncio
    from unittest.mock import AsyncMock

    from services.yms_service import _generate_vehicle_reference

    async def run():
        conn = AsyncMock()
        conn.fetchval = AsyncMock(side_effect=[0, None])
        ref = await _generate_vehicle_reference(conn)
        assert ref.startswith("VEH-")
        assert ref.endswith("-001")
        sql = conn.fetchval.call_args_list[0].args[0]
        assert "char_length($2)" in sql
        prefix_arg = conn.fetchval.call_args_list[0].args[2]
        assert prefix_arg == ref.rsplit("-", 1)[0] + "-"

    asyncio.run(run())
