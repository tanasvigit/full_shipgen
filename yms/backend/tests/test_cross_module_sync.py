"""Cross-module sync: dock/labor/equipment assignment, loading lifecycle, resource release."""

import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.resource_gating_service import release_loading_resources


def _loading_prereq_queue_row():
    return {
        "id": "q1",
        "status": "READY_FOR_LOADING",
        "checkin_time": datetime(2026, 6, 3, 8, 0, tzinfo=timezone.utc),
        "dock_id": "d1",
    }


def test_release_loading_resources_releases_labor_and_equipment():
    async def run():
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(
            side_effect=[
                [
                    {
                        "id": "l1",
                        "team_code": "LT001",
                        "status": "ASSIGNED",
                        "members_count": 4,
                        "assigned_dock_id": "d1",
                        "assigned_vehicle_id": "v1",
                    }
                ],
                [
                    {
                        "id": "e1",
                        "equipment_code": "EQ001",
                        "assigned_dock_id": "d1",
                        "assigned_vehicle_id": "v1",
                    }
                ],
            ]
        )
        mock_conn.execute = AsyncMock()

        with patch(
            "services.labor_service._log_labor_event",
            new_callable=AsyncMock,
        ) as mock_labor_log, patch(
            "services.equipment_service._log_equipment_event",
            new_callable=AsyncMock,
        ) as mock_equip_log:
            await release_loading_resources("v1", "d1", conn=mock_conn, created_by="test")
            assert mock_conn.execute.await_count == 2
            mock_labor_log.assert_awaited_once()
            assert mock_labor_log.await_args.kwargs["event_type"] == "TEAM_RELEASED"
            mock_equip_log.assert_awaited_once()
            assert mock_equip_log.await_args.kwargs["event_type"] == "EQUIPMENT_RELEASED"

    asyncio.run(run())


def test_transition_loading_promotes_resource_pending_before_validate():
    """Start loading must sync RESOURCE_PENDING → READY_FOR_LOADING before transition validation."""

    async def run():
        from services.yms_service import transition_vehicle_status

        vehicle = {"id": "v1", "status": "RESOURCE_PENDING", "vehicle_number": "MH01"}
        queue = {"id": "q1", "status": "DOCK_ASSIGNED", "dock_id": "d1"}
        readiness = {
            "ready": True,
            "missing": [],
            "dockId": "d1",
            "dockAssigned": True,
            "laborAssigned": True,
            "equipmentAssigned": True,
        }

        mock_conn = MagicMock()
        mock_conn.transaction = MagicMock(return_value=AsyncMock())
        mock_conn.transaction.return_value.__aenter__ = AsyncMock(return_value=None)
        mock_conn.transaction.return_value.__aexit__ = AsyncMock(return_value=None)

        pool = MagicMock()
        pool.acquire = MagicMock(return_value=AsyncMock())
        pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        pool.acquire.return_value.__aexit__ = AsyncMock(return_value=None)

        with patch("services.yms_service.get_pool", return_value=pool), patch(
            "services.yms_service.get_vehicle",
            new_callable=AsyncMock,
            side_effect=[
                vehicle,
                {**vehicle, "status": "READY_FOR_LOADING"},
            ],
        ), patch(
            "services.resource_gating_service.sync_vehicle_readiness_status",
            new_callable=AsyncMock,
            return_value={**vehicle, "status": "READY_FOR_LOADING"},
        ) as mock_sync, patch(
            "services.resource_gating_service.validate_resource_readiness_for_loading",
            new_callable=AsyncMock,
            return_value=readiness,
        ), patch(
            "services.yms_service.update_vehicle",
            new_callable=AsyncMock,
            return_value={**vehicle, "status": "LOADING"},
        ), patch(
            "services.yms_service.get_appointment",
            new_callable=AsyncMock,
            return_value={"id": "a1", "status": "READY_FOR_LOADING"},
        ), patch(
            "services.yms_service.update_appointment",
            new_callable=AsyncMock,
        ), patch(
            "services.yms_service.get_queue_entry",
            new_callable=AsyncMock,
            return_value=queue,
        ), patch(
            "services.yms_service.update_queue_entry",
            new_callable=AsyncMock,
        ), patch(
            "services.yms_service.create_yard_event",
            new_callable=AsyncMock,
        ):
            mock_conn.fetchrow = AsyncMock(
                side_effect=[
                    _loading_prereq_queue_row(),
                    {"id": "a1"},
                    {"id": "q1", "dock_id": "d1"},
                ]
            )
            await transition_vehicle_status("v1", "LOADING", "test start", "test")
            mock_sync.assert_awaited_once()

    asyncio.run(run())


def test_transition_loading_emits_loading_started():
    async def run():
        from services.yms_service import transition_vehicle_status

        vehicle = {"id": "v1", "status": "READY_FOR_LOADING", "vehicle_number": "MH01"}
        queue = {"id": "q1", "status": "READY_FOR_LOADING", "dock_id": "d1"}
        readiness = {
            "ready": True,
            "missing": [],
            "dockId": "d1",
            "dockAssigned": True,
            "laborAssigned": True,
            "equipmentAssigned": False,
        }

        mock_conn = MagicMock()
        mock_conn.transaction = MagicMock(return_value=AsyncMock())
        mock_conn.transaction.return_value.__aenter__ = AsyncMock(return_value=None)
        mock_conn.transaction.return_value.__aexit__ = AsyncMock(return_value=None)

        pool = MagicMock()
        pool.acquire = MagicMock(return_value=AsyncMock())
        pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        pool.acquire.return_value.__aexit__ = AsyncMock(return_value=None)

        with patch("services.yms_service.get_pool", return_value=pool), patch(
            "services.yms_service.get_vehicle",
            new_callable=AsyncMock,
            return_value=vehicle,
        ), patch(
            "services.resource_gating_service.sync_vehicle_readiness_status",
            new_callable=AsyncMock,
            return_value=vehicle,
        ), patch(
            "services.resource_gating_service.validate_resource_readiness_for_loading",
            new_callable=AsyncMock,
            return_value=readiness,
        ), patch(
            "services.yms_service.update_vehicle",
            new_callable=AsyncMock,
            return_value={**vehicle, "status": "LOADING"},
        ), patch(
            "services.yms_service.get_appointment",
            new_callable=AsyncMock,
            return_value={"id": "a1", "status": "READY_FOR_LOADING"},
        ), patch(
            "services.yms_service.update_appointment",
            new_callable=AsyncMock,
        ), patch(
            "services.yms_service.get_queue_entry",
            new_callable=AsyncMock,
            return_value=queue,
        ), patch(
            "services.yms_service.update_queue_entry",
            new_callable=AsyncMock,
        ), patch(
            "services.yms_service.create_yard_event",
            new_callable=AsyncMock,
        ) as mock_event:
            mock_conn.fetchrow = AsyncMock(
                side_effect=[
                    _loading_prereq_queue_row(),
                    {"id": "a1"},
                    {"id": "q1", "dock_id": "d1"},
                ]
            )
            await transition_vehicle_status("v1", "LOADING", "test start", "test")
            event_types = [c.kwargs.get("event_type") for c in mock_event.await_args_list]
            assert "LOADING_STARTED" in event_types
            assert "VEHICLE_STATUS_CHANGED" in event_types

    asyncio.run(run())


def test_transition_completed_releases_resources_and_emits_loading_completed():
    async def run():
        from services.yms_service import transition_vehicle_status

        vehicle = {"id": "v1", "status": "LOADING", "vehicle_number": "MH01"}
        queue = {"id": "q1", "status": "LOADING", "dock_id": "d1"}
        dock = {"id": "d1", "dock_code": "DK-001", "current_vehicle_id": "v1"}

        mock_conn = MagicMock()
        mock_conn.transaction = MagicMock(return_value=AsyncMock())
        mock_conn.transaction.return_value.__aenter__ = AsyncMock(return_value=None)
        mock_conn.transaction.return_value.__aexit__ = AsyncMock(return_value=None)
        mock_conn.execute = AsyncMock()

        pool = MagicMock()
        pool.acquire = MagicMock(return_value=AsyncMock())
        pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        pool.acquire.return_value.__aexit__ = AsyncMock(return_value=None)

        with patch("services.yms_service.get_pool", return_value=pool), patch(
            "services.yms_service.get_vehicle",
            new_callable=AsyncMock,
            return_value=vehicle,
        ), patch(
            "services.yms_service.update_vehicle",
            new_callable=AsyncMock,
            return_value={**vehicle, "status": "COMPLETED"},
        ), patch(
            "services.yms_service.get_appointment",
            new_callable=AsyncMock,
            return_value={"id": "a1", "status": "LOADING"},
        ), patch(
            "services.yms_service.update_appointment",
            new_callable=AsyncMock,
        ), patch(
            "services.yms_service.get_queue_entry",
            new_callable=AsyncMock,
            return_value=queue,
        ), patch(
            "services.yms_service.update_queue_entry",
            new_callable=AsyncMock,
        ), patch(
            "services.yms_service.get_dock",
            new_callable=AsyncMock,
            return_value=dock,
        ), patch(
            "services.yms_service._log_dock_event",
            new_callable=AsyncMock,
        ), patch(
            "services.yard_service.auto_move_vehicle_by_type",
            new_callable=AsyncMock,
        ), patch(
            "services.resource_gating_service.release_loading_resources",
            new_callable=AsyncMock,
        ) as mock_release, patch(
            "services.yms_service.create_yard_event",
            new_callable=AsyncMock,
        ) as mock_event:
            mock_conn.fetchrow = AsyncMock(
                side_effect=[
                    {"id": "a1"},
                    {"id": "q1", "dock_id": "d1"},
                    {"dock_id": "d1"},
                ]
            )
            mock_conn.fetch = AsyncMock(return_value=[])
            await transition_vehicle_status("v1", "COMPLETED", "test complete", "test")
            mock_release.assert_awaited_once()
            event_types = [c.kwargs.get("event_type") for c in mock_event.await_args_list]
            assert "LOADING_COMPLETED" in event_types
            assert "VEHICLE_STATUS_CHANGED" in event_types

    asyncio.run(run())


def test_transition_loading_preserves_called_time():
    """LOADING transition must not overwrite queue_entries.called_time."""

    async def run():
        from services.yms_service import transition_vehicle_status

        original_called = datetime(2026, 6, 3, 8, 15, tzinfo=timezone.utc)
        vehicle = {"id": "v1", "status": "READY_FOR_LOADING", "vehicle_number": "MH01"}
        queue = {
            "id": "q1",
            "status": "READY_FOR_LOADING",
            "dock_id": "d1",
            "called_time": original_called,
        }
        readiness = {
            "ready": True,
            "missing": [],
            "dockId": "d1",
            "dockAssigned": True,
            "laborAssigned": True,
            "equipmentAssigned": True,
        }

        mock_conn = MagicMock()
        mock_conn.transaction = MagicMock(return_value=AsyncMock())
        mock_conn.transaction.return_value.__aenter__ = AsyncMock(return_value=None)
        mock_conn.transaction.return_value.__aexit__ = AsyncMock(return_value=None)

        pool = MagicMock()
        pool.acquire = MagicMock(return_value=AsyncMock())
        pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        pool.acquire.return_value.__aexit__ = AsyncMock(return_value=None)

        update_queue_kwargs = []

        async def capture_queue_update(_qid, payload, conn=None, *, internal=False):
            update_queue_kwargs.append(payload)
            return {**queue, **payload}

        with patch("services.yms_service.get_pool", return_value=pool), patch(
            "services.yms_service.get_vehicle",
            new_callable=AsyncMock,
            return_value=vehicle,
        ), patch(
            "services.resource_gating_service.sync_vehicle_readiness_status",
            new_callable=AsyncMock,
            return_value=vehicle,
        ), patch(
            "services.resource_gating_service.validate_resource_readiness_for_loading",
            new_callable=AsyncMock,
            return_value=readiness,
        ), patch(
            "services.yms_service.update_vehicle",
            new_callable=AsyncMock,
            return_value={**vehicle, "status": "LOADING"},
        ), patch(
            "services.yms_service.get_appointment",
            new_callable=AsyncMock,
            return_value={"id": "a1", "status": "READY_FOR_LOADING"},
        ), patch(
            "services.yms_service.update_appointment",
            new_callable=AsyncMock,
        ), patch(
            "services.yms_service.get_queue_entry",
            new_callable=AsyncMock,
            return_value=queue,
        ), patch(
            "services.yms_service.update_queue_entry",
            new_callable=AsyncMock,
            side_effect=capture_queue_update,
        ), patch(
            "services.yms_service.create_yard_event",
            new_callable=AsyncMock,
        ):
            mock_conn.fetchrow = AsyncMock(
                side_effect=[
                    _loading_prereq_queue_row(),
                    {"id": "a1"},
                    {"id": "q1", "dock_id": "d1"},
                ]
            )
            await transition_vehicle_status("v1", "LOADING", "test start", "test")
            assert update_queue_kwargs
            assert "called_time" not in update_queue_kwargs[0]
            assert update_queue_kwargs[0]["status"] == "LOADING"

    asyncio.run(run())


def test_assign_dock_syncs_readiness_after_assignment():
    """assign_dock_to_queue should call sync_vehicle_readiness_status post-assignment."""

    async def run():
        from services.yms_service import assign_dock

        queue_row = {
            "id": "q1",
            "vehicle_id": "v1",
            "appointment_id": "a1",
            "status": "CALLED",
            "dock_id": None,
        }
        dock = {
            "id": "d1",
            "dock_code": "DK-001",
            "dock_name": "Dock 1",
            "dock_type": "LOADING",
            "zone": "A",
            "status": "AVAILABLE",
            "supported_vehicle_types": [],
            "supported_cargo_types": [],
            "max_capacity": 1,
            "current_vehicle_id": None,
            "notes": None,
        }

        mock_conn = MagicMock()
        mock_conn.transaction = MagicMock(return_value=AsyncMock())
        mock_conn.transaction.return_value.__aenter__ = AsyncMock(return_value=None)
        mock_conn.transaction.return_value.__aexit__ = AsyncMock(return_value=None)
        mock_conn.fetchval = AsyncMock(return_value=None)
        mock_conn.fetchrow = AsyncMock(
            side_effect=[
                dock,
                {**queue_row, "dock_id": "d1", "status": "DOCK_ASSIGNED"},
            ]
        )

        pool = MagicMock()
        pool.acquire = MagicMock(return_value=AsyncMock())
        pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        pool.acquire.return_value.__aexit__ = AsyncMock(return_value=None)

        with patch("services.yms_service.get_pool", return_value=pool), patch(
            "services.yms_service.get_queue_entry",
            new_callable=AsyncMock,
            return_value=queue_row,
        ), patch(
            "services.yms_service.get_dock",
            new_callable=AsyncMock,
            return_value=dock,
        ), patch(
            "services.yms_service.update_vehicle",
            new_callable=AsyncMock,
        ), patch(
            "services.yms_service.update_appointment",
            new_callable=AsyncMock,
        ), patch(
            "services.yms_service._log_dock_event",
            new_callable=AsyncMock,
        ), patch(
            "services.yard_service.resolve_operation_zone_type",
            new_callable=AsyncMock,
            return_value="LOADING",
        ), patch(
            "services.yard_service.find_zone_by_map_code",
            new_callable=AsyncMock,
            return_value=None,
        ), patch(
            "services.yard_service.auto_move_vehicle_by_type",
            new_callable=AsyncMock,
        ), patch(
            "services.resource_gating_service.sync_vehicle_readiness_status",
            new_callable=AsyncMock,
        ) as mock_sync:
            await assign_dock("q1", "d1", created_by="test")
            mock_sync.assert_awaited_once_with("v1", conn=mock_conn, created_by="test")

    asyncio.run(run())
