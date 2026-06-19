"""Dock release must clear docks.current_vehicle_id even when queue.dock_id is null."""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from services.yms_service import _release_vehicle_dock_assignments


def test_release_clears_dock_by_current_vehicle_id():
    async def run():
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value=None)
        mock_conn.fetch = AsyncMock(return_value=[{"id": "d-stale"}])
        mock_conn.execute = AsyncMock()

        with patch(
            "services.yms_service.get_dock",
            new_callable=AsyncMock,
            return_value={"dock_code": "DK-007"},
        ), patch(
            "services.yms_service._log_dock_event",
            new_callable=AsyncMock,
        ):
            await _release_vehicle_dock_assignments(
                "v-exit",
                conn=mock_conn,
                created_by="test",
                queue_entry_id=None,
                explicit_dock_id=None,
                lifecycle_status="EXIT_HOLDING",
            )

        execute_sql = [str(c.args[0]) for c in mock_conn.execute.await_args_list]
        assert any("docks SET" in sql and "current_vehicle_id = NULL" in sql for sql in execute_sql)
        assert any("queue_entries SET" in sql and "dock_id = NULL" in sql for sql in execute_sql)

    asyncio.run(run())
