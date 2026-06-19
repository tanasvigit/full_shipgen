"""Dock release — stale queue dock_id must not keep dock drawer occupied."""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from services.yms_service import transition_vehicle_status


def test_transition_exited_clears_queue_dock_id_on_dock_release():
    async def run():
        mock_conn = MagicMock()
        mock_conn.transaction = MagicMock(return_value=AsyncMock())
        mock_conn.transaction.return_value.__aenter__ = AsyncMock(return_value=None)
        mock_conn.transaction.return_value.__aexit__ = AsyncMock(return_value=None)
        mock_conn.fetchrow = AsyncMock(
            side_effect=[
                {"id": "a1"},
                {"id": "q1", "dock_id": "d1"},
                {"dock_id": "d1"},
            ]
        )
        mock_conn.fetch = AsyncMock(return_value=[])
        mock_conn.execute = AsyncMock()

        pool = MagicMock()
        pool.acquire = MagicMock(return_value=AsyncMock())
        pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        pool.acquire.return_value.__aexit__ = AsyncMock(return_value=None)

        vehicle_row = {
            "id": "v1",
            "status": "EXIT_VERIFIED",
            "vehicle_number": "APXI4000",
            "vehicle_type": "TRUCK",
            "ownership_type": "OWNED",
            "transporter_name": "Test",
        }

        with patch("services.yms_service.get_pool", return_value=pool), patch(
            "services.yms_service.get_vehicle",
            new_callable=AsyncMock,
            return_value=vehicle_row,
        ), patch(
            "services.yms_service.update_vehicle",
            new_callable=AsyncMock,
            return_value={**vehicle_row, "status": "EXITED"},
        ), patch(
            "services.yms_service.get_appointment",
            new_callable=AsyncMock,
            return_value={"id": "a1", "status": "EXIT_VERIFIED"},
        ), patch(
            "services.yms_service.update_appointment",
            new_callable=AsyncMock,
        ), patch(
            "services.yms_service.get_queue_entry",
            new_callable=AsyncMock,
            return_value={"id": "q1", "status": "EXIT_VERIFIED", "dock_id": "d1"},
        ), patch(
            "services.yms_service.update_queue_entry",
            new_callable=AsyncMock,
        ), patch(
            "services.yms_service.get_dock",
            new_callable=AsyncMock,
            return_value={"dock_code": "DK-006"},
        ), patch(
            "services.yms_service._log_dock_event",
            new_callable=AsyncMock,
        ), patch(
            "services.yms_service.create_yard_event",
            new_callable=AsyncMock,
        ), patch(
            "services.yard_service.auto_move_vehicle_by_type",
            new_callable=AsyncMock,
        ):
            await transition_vehicle_status("v1", "EXITED", "gate out", "gate-ui")

        execute_sql = [str(c.args[0]) for c in mock_conn.execute.await_args_list]
        assert any("queue_entries SET" in sql and "dock_id = NULL" in sql for sql in execute_sql)
        assert any("docks SET" in sql and "current_vehicle_id = NULL" in sql for sql in execute_sql)

    asyncio.run(run())
