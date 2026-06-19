"""Yard zone sync — status-driven current_zone_id assignment."""

import asyncio
from unittest.mock import AsyncMock, patch

import pytest

from services.yard_service import STATUS_ZONE_TYPE, sync_vehicle_zone_for_status


def test_status_zone_type_covers_lifecycle():
    assert STATUS_ZONE_TYPE["SCHEDULED"] == "GATE_IN"
    assert STATUS_ZONE_TYPE["ARRIVED"] == "GATE_IN"
    assert STATUS_ZONE_TYPE["WAITING"] == "WAITING_AREA"
    assert STATUS_ZONE_TYPE["CALLED"] == "STAGING"
    assert STATUS_ZONE_TYPE["DOCK_ASSIGNED"] == "LOADING"
    assert STATUS_ZONE_TYPE["RESOURCE_PENDING"] == "LOADING"
    assert STATUS_ZONE_TYPE["READY_FOR_LOADING"] == "LOADING"
    assert STATUS_ZONE_TYPE["LOADING"] == "LOADING"
    assert STATUS_ZONE_TYPE["COMPLETED"] == "EXIT_HOLDING"
    assert STATUS_ZONE_TYPE["EXIT_HOLDING"] == "EXIT_HOLDING"
    assert STATUS_ZONE_TYPE["EXIT_VERIFIED"] == "GATE_OUT"
    assert STATUS_ZONE_TYPE["EXITED"] is None


def test_sync_clears_zone_on_exited():
    async def run():
        conn = AsyncMock()
        await sync_vehicle_zone_for_status(
            "v1", "EXITED", reason="exit", conn=conn, created_by="test"
        )
        conn.execute.assert_awaited()

    asyncio.run(run())


def test_sync_moves_to_loading_zone():
    async def run():
        conn = AsyncMock()
        zone = {"id": "zone-a", "zone_code": "ZN-A", "zone_type": "LOADING", "max_capacity": 24, "status": "ACTIVE"}
        with patch(
            "services.yard_service.find_zone_by_type",
            new_callable=AsyncMock,
            return_value=zone,
        ):
            with patch(
                "services.yard_service.move_vehicle_to_zone",
                new_callable=AsyncMock,
            ) as move:
                await sync_vehicle_zone_for_status(
                    "v1", "LOADING", reason="loading", conn=conn, created_by="test"
                )
                move.assert_awaited_once()
                assert move.await_args.args[1] == "zone-a"

    asyncio.run(run())
