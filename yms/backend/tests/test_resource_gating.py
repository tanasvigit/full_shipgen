"""Unit tests for resource gating validation and status transitions."""

import asyncio
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from enums import STATUS_TRANSITIONS, YMS_STATUSES
from services.resource_gating_service import (
    raise_resource_gating_error,
    sync_vehicle_readiness_status,
    validate_resource_readiness_for_loading,
)


def test_readiness_statuses_in_yms_statuses():
    assert "RESOURCE_PENDING" in YMS_STATUSES
    assert "READY_FOR_LOADING" in YMS_STATUSES


def test_status_transitions_workflow():
    assert "RESOURCE_PENDING" in STATUS_TRANSITIONS["DOCK_ASSIGNED"]
    assert "READY_FOR_LOADING" in STATUS_TRANSITIONS["DOCK_ASSIGNED"]
    assert "LOADING" in STATUS_TRANSITIONS["READY_FOR_LOADING"]
    assert "LOADING" not in STATUS_TRANSITIONS["DOCK_ASSIGNED"]
    assert "LOADING" not in STATUS_TRANSITIONS["RESOURCE_PENDING"]
    assert "READY_FOR_LOADING" in STATUS_TRANSITIONS["RESOURCE_PENDING"]
    assert "RESOURCE_PENDING" in STATUS_TRANSITIONS["READY_FOR_LOADING"]


def test_raise_resource_gating_error():
    with pytest.raises(Exception) as exc:
        raise_resource_gating_error(["labor"])
    assert exc.value.status_code == 409
    assert exc.value.detail["error"] == "RESOURCE_GATING_FAILED"
    assert exc.value.detail["missing"] == ["labor"]


def test_case_1_dock_labor_no_equipment_ready_for_loading():
    """Dock + Labor, no Equipment → READY_FOR_LOADING."""

    async def run():
        with patch(
            "services.yms_service.check_dock_readiness",
            new_callable=AsyncMock,
            return_value={"dockAssigned": True, "dockId": "d1"},
        ), patch(
            "services.labor_service.check_labor_readiness",
            new_callable=AsyncMock,
            return_value={"laborAssigned": True},
        ), patch(
            "services.equipment_service.check_equipment_readiness",
            new_callable=AsyncMock,
            return_value={"equipmentAssigned": False},
        ):
            return await validate_resource_readiness_for_loading(
                "vehicle-1", enforce_queue_dock=False
            )

    result = asyncio.run(run())
    assert result["ready"] is True
    assert result["missing"] == []
    assert result["equipmentAssigned"] is False
    assert result["equipmentRecommended"] is True


def test_case_2_dock_labor_equipment_ready_for_loading():
    """Dock + Labor + Equipment → READY_FOR_LOADING."""

    async def run():
        with patch(
            "services.yms_service.check_dock_readiness",
            new_callable=AsyncMock,
            return_value={"dockAssigned": True, "dockId": "d1"},
        ), patch(
            "services.labor_service.check_labor_readiness",
            new_callable=AsyncMock,
            return_value={"laborAssigned": True},
        ), patch(
            "services.equipment_service.check_equipment_readiness",
            new_callable=AsyncMock,
            return_value={"equipmentAssigned": True},
        ):
            return await validate_resource_readiness_for_loading(
                "vehicle-1", enforce_queue_dock=False
            )

    result = asyncio.run(run())
    assert result["ready"] is True
    assert result["missing"] == []
    assert result["equipmentAssigned"] is True
    assert result["equipmentRecommended"] is False


def test_case_3_dock_only_resource_pending():
    """Dock only → RESOURCE_PENDING (missing labor)."""

    async def run():
        with patch(
            "services.yms_service.check_dock_readiness",
            new_callable=AsyncMock,
            return_value={"dockAssigned": True, "dockId": "d1"},
        ), patch(
            "services.labor_service.check_labor_readiness",
            new_callable=AsyncMock,
            return_value={"laborAssigned": False},
        ), patch(
            "services.equipment_service.check_equipment_readiness",
            new_callable=AsyncMock,
            return_value={"equipmentAssigned": False},
        ):
            return await validate_resource_readiness_for_loading(
                "vehicle-1", enforce_queue_dock=False
            )

    result = asyncio.run(run())
    assert result["ready"] is False
    assert result["missing"] == ["labor"]
    assert "equipment" not in result["missing"]


def test_case_4_labor_only_resource_pending():
    """Labor only → RESOURCE_PENDING (missing dock)."""

    async def run():
        with patch(
            "services.yms_service.check_dock_readiness",
            new_callable=AsyncMock,
            return_value={"dockAssigned": False},
        ), patch(
            "services.labor_service.check_labor_readiness",
            new_callable=AsyncMock,
            return_value={"laborAssigned": True},
        ), patch(
            "services.equipment_service.check_equipment_readiness",
            new_callable=AsyncMock,
            return_value={"equipmentAssigned": True},
        ):
            return await validate_resource_readiness_for_loading(
                "vehicle-1", enforce_queue_dock=False
            )

    result = asyncio.run(run())
    assert result["ready"] is False
    assert result["missing"] == ["dock"]


def test_sync_promotes_to_ready_when_dock_and_labor_only():
    """sync_vehicle_readiness_status → READY_FOR_LOADING without equipment."""

    async def run():
        vehicle = {
            "id": "v1",
            "status": "RESOURCE_PENDING",
            "vehicle_number": "MH01",
        }
        readiness = {
            "ready": True,
            "missing": [],
            "dockAssigned": True,
            "laborAssigned": True,
            "equipmentAssigned": False,
            "dockId": "d1",
        }
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(
            side_effect=[
                vehicle,
                None,
                None,
            ]
        )
        with patch(
            "services.resource_gating_service.validate_resource_readiness_for_loading",
            new_callable=AsyncMock,
            return_value=readiness,
        ), patch(
            "services.yms_service.update_vehicle",
            new_callable=AsyncMock,
            return_value={**vehicle, "status": "READY_FOR_LOADING"},
        ) as mock_update, patch(
            "services.yms_service.create_yard_event",
            new_callable=AsyncMock,
        ), patch(
            "services.yms_service.get_vehicle",
            new_callable=AsyncMock,
        ):
            result = await sync_vehicle_readiness_status("v1", conn=mock_conn, created_by="test")
            mock_update.assert_called_once()
            assert mock_update.call_args[0][1]["status"] == "READY_FOR_LOADING"
            return result

    asyncio.run(run())


def test_resource_pending_cannot_transition_directly_to_loading():
    assert "LOADING" not in STATUS_TRANSITIONS["RESOURCE_PENDING"]


def test_ready_for_loading_can_transition_to_loading():
    assert "LOADING" in STATUS_TRANSITIONS["READY_FOR_LOADING"]


def test_check_labor_readiness_uses_transaction_conn():
    """Readiness checks must use the same conn during assign+sync transaction."""

    async def run():
        from services.labor_service import check_labor_readiness

        mock_conn = AsyncMock()
        mock_conn.fetchval = AsyncMock(return_value=1)
        mock_conn.fetchrow = AsyncMock(
            return_value={"id": "team-1", "team_name": "Alpha", "team_code": "A1"}
        )
        result = await check_labor_readiness("vehicle-1", conn=mock_conn)
        assert result["laborAssigned"] is True
        assert mock_conn.fetchrow.await_count >= 1
        mock_conn.fetchval.assert_awaited()

    asyncio.run(run())


def test_sync_promotes_queue_status_when_ready():
    """sync_vehicle_readiness_status updates vehicle, appointment, and queue."""

    async def run():
        vehicle = {"id": "v1", "status": "RESOURCE_PENDING", "vehicle_number": "MH01"}
        readiness = {
            "ready": True,
            "missing": [],
            "dockAssigned": True,
            "laborAssigned": True,
            "equipmentAssigned": False,
            "dockId": "d1",
        }
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(
            side_effect=[
                vehicle,
                {"id": "a1"},
                {"id": "q1", "dock_id": "d1", "status": "DOCK_ASSIGNED"},
                {"status": "DOCK_ASSIGNED"},
            ]
        )

        with patch(
            "services.resource_gating_service.validate_resource_readiness_for_loading",
            new_callable=AsyncMock,
            return_value=readiness,
        ), patch(
            "services.yms_service.update_vehicle",
            new_callable=AsyncMock,
            return_value={**vehicle, "status": "READY_FOR_LOADING"},
        ) as mock_update_vehicle, patch(
            "services.yms_service.update_appointment",
            new_callable=AsyncMock,
        ) as mock_update_appt, patch(
            "services.yms_service.update_queue_entry",
            new_callable=AsyncMock,
        ) as mock_update_queue, patch(
            "services.yms_service.create_yard_event",
            new_callable=AsyncMock,
        ):
            await sync_vehicle_readiness_status("v1", conn=mock_conn, created_by="test")
            mock_update_vehicle.assert_awaited_once()
            assert mock_update_vehicle.await_args[0][1]["status"] == "READY_FOR_LOADING"
            mock_update_appt.assert_awaited_once()
            mock_update_queue.assert_awaited_once()
            assert mock_update_queue.await_args[0][1]["status"] == "READY_FOR_LOADING"

    asyncio.run(run())
