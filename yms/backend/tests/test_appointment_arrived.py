"""Tests for appointment arrived / check-in workflow."""

import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from enums import STATUS_TRANSITIONS


def test_scheduled_appointment_can_check_in():
    """Arrived action must be allowed from SCHEDULED."""
    assert "CHECKED_IN" in STATUS_TRANSITIONS["SCHEDULED"]


def test_check_in_advances_to_waiting():
    """After gate check-in, vehicle and appointment sit in WAITING for queue."""
    assert "WAITING" in STATUS_TRANSITIONS["CHECKED_IN"]
    assert "CALLED" in STATUS_TRANSITIONS["WAITING"]


def test_create_queue_entry_transitions_to_waiting():
    """create_queue_entry (used by check-in) moves appointment SCHEDULED -> WAITING."""

    async def run():
        appointment = {
            "id": "appt-1",
            "vehicle_id": "veh-1",
            "priority": 0,
            "reporting_time": datetime(2026, 6, 8, 9, 0, tzinfo=timezone.utc),
        }
        queue_row = {
            "id": "q-1",
            "appointment_id": "appt-1",
            "vehicle_id": "veh-1",
            "queue_number": "Q-TEST01",
            "status": "WAITING",
        }
        mock_db = AsyncMock()
        mock_db.fetchrow.return_value = queue_row

        with patch("services.yms_service.get_appointment", new_callable=AsyncMock, return_value=appointment), patch(
            "services.yms_service.update_appointment", new_callable=AsyncMock
        ) as mock_update_appt, patch(
            "services.yms_service.update_vehicle", new_callable=AsyncMock
        ) as mock_update_vehicle, patch(
            "services.yms_service.create_yard_event", new_callable=AsyncMock
        ):
            from services.yms_service import create_queue_entry

            await create_queue_entry(
                {
                    "appointment_id": "appt-1",
                    "queue_number": "Q-TEST01",
                    "queue_type": "Loading",
                },
                conn=mock_db,
            )

            appt_statuses = [c.args[1]["status"] for c in mock_update_appt.await_args_list]
            vehicle_statuses = [c.args[1]["status"] for c in mock_update_vehicle.await_args_list]
            assert appt_statuses == ["CHECKED_IN", "WAITING"]
            assert vehicle_statuses == ["CHECKED_IN", "WAITING"]

    asyncio.run(run())


def test_check_in_vehicle_delegates_to_create_queue_entry():
    """Arrived uses check_in_vehicle which creates queue entry then VEHICLE_CHECKED_IN."""

    async def run():
        fake_queue = {
            "id": "q-1",
            "appointment_id": "appt-1",
            "vehicle_id": "veh-1",
            "queue_number": "Q-TEST01",
            "status": "WAITING",
        }

        class _Tx:
            async def __aenter__(self):
                return None

            async def __aexit__(self, *args):
                return None

        mock_conn = MagicMock()
        mock_conn.transaction.return_value = _Tx()

        class _Acquire:
            async def __aenter__(self):
                return mock_conn

            async def __aexit__(self, *args):
                return None

        with patch("services.yms_service.get_pool") as mock_pool, patch(
            "services.yms_service.create_queue_entry", new_callable=AsyncMock, return_value=fake_queue
        ) as mock_create, patch("services.yms_service.create_yard_event", new_callable=AsyncMock) as mock_event, patch(
            "services.yard_service.auto_move_vehicle_by_type", new_callable=AsyncMock
        ), patch(
            "services.yard_service.sync_vehicle_zone_from_cargo", new_callable=AsyncMock
        ):
            mock_pool.return_value.acquire.return_value = _Acquire()
            from services.yms_service import check_in_vehicle

            result = await check_in_vehicle("appt-1", "Q-TEST01", "Loading")
            mock_create.assert_awaited_once()
            event_types = [c.kwargs.get("event_type") for c in mock_event.await_args_list]
            assert "VEHICLE_CHECKED_IN" in event_types
            assert result["status"] == "WAITING"

    asyncio.run(run())


def test_duplicate_check_in_rejected():
    """Second arrived click fails when queue already exists for appointment."""

    async def run():
        class _Tx:
            async def __aenter__(self):
                return None

            async def __aexit__(self, *args):
                return None

        mock_conn = MagicMock()
        mock_conn.transaction.return_value = _Tx()

        class _Acquire:
            async def __aenter__(self):
                return mock_conn

            async def __aexit__(self, *args):
                return None

        with patch("services.yms_service.get_pool") as mock_pool, patch(
            "services.yms_service.create_queue_entry",
            new_callable=AsyncMock,
            side_effect=HTTPException(status_code=409, detail="Queue entry already exists for appointment"),
        ):
            mock_pool.return_value.acquire.return_value = _Acquire()
            from services.yms_service import check_in_vehicle

            with pytest.raises(HTTPException) as exc:
                await check_in_vehicle("appt-dup", "Q-DUP", "STANDARD")
            assert exc.value.status_code == 409

    asyncio.run(run())
