"""Dock-centric resource assignment — master assignment source tests."""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from services.dock_resource_service import (
    assign_equipment_to_dock,
    assign_labor_to_dock,
    enrich_assignment_from_dock,
    is_dock_active,
    release_dock_resources,
    resolve_dock_assignment_context,
    validate_cross_active_dock_assignment,
)


def test_resolve_dock_assignment_context_from_queue():
    async def run():
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(
            side_effect=[
                {
                    "id": "d1",
                    "dock_code": "DK-01",
                    "dock_name": "Bay 1",
                    "status": "OCCUPIED",
                    "current_vehicle_id": "v1",
                },
                {
                    "id": "q1",
                    "vehicle_id": "v1",
                    "appointment_id": "a1",
                    "status": "DOCK_ASSIGNED",
                },
            ]
        )
        ctx = await resolve_dock_assignment_context("d1", mock_conn)
        assert ctx["dock_id"] == "d1"
        assert ctx["vehicle_id"] == "v1"
        assert ctx["queue_entry_id"] == "q1"
        assert ctx["appointment_id"] == "a1"

    asyncio.run(run())


def test_validate_cross_active_dock_assignment_blocks_active_dock():
    async def run():
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value={"dock_code": "DK-02"})
        with patch(
            "services.dock_resource_service.is_dock_active",
            new_callable=AsyncMock,
            return_value=True,
        ):
            with pytest.raises(HTTPException) as exc:
                await validate_cross_active_dock_assignment(
                    {"assigned_dock_id": "d-old"},
                    target_dock_id="d-new",
                    conn=mock_conn,
                    resource_label="Labor team",
                )
            assert exc.value.status_code == 409
            assert "active dock" in exc.value.detail.lower()

    asyncio.run(run())


def test_assign_labor_to_dock_delegates_with_dock_id_payload():
    async def run():
        with patch(
            "services.labor_service.assign_labor_team",
            new_callable=AsyncMock,
            return_value={"id": "l1", "status": "ASSIGNED"},
        ) as mock_assign:
            result = await assign_labor_to_dock("d1", "l1", {"workers_assigned": 2})
            assert result["status"] == "ASSIGNED"
            mock_assign.assert_awaited_once_with(
                "l1",
                {"workers_assigned": 2, "dock_id": "d1", "created_by": "docks-ui"},
            )

    asyncio.run(run())


def test_release_dock_resources_releases_labor_and_equipment():
    async def run():
        mock_conn = AsyncMock()
        mock_conn.fetch = AsyncMock(
            side_effect=[
                [{"id": "l1"}],
                [{"id": "e1"}],
            ]
        )
        with patch(
            "services.labor_service.release_labor_team",
            new_callable=AsyncMock,
        ) as mock_labor_release, patch(
            "services.equipment_service.release_equipment",
            new_callable=AsyncMock,
        ) as mock_equip_release:
            result = await release_dock_resources("d1", conn=mock_conn, created_by="test")
            assert result == {"labor_released": 1, "equipment_released": 1}
            mock_labor_release.assert_awaited_once_with(
                "l1", created_by="test", event_note="Released from dock", conn=mock_conn
            )
            mock_equip_release.assert_awaited_once_with(
                "e1", created_by="test", event_note="Released from dock", conn=mock_conn
            )

    asyncio.run(run())


def test_is_dock_active_when_occupied_or_has_vehicle():
    async def run():
        mock_conn = AsyncMock()
        mock_conn.fetchrow = AsyncMock(return_value={"status": "OCCUPIED", "current_vehicle_id": None})
        assert await is_dock_active("d1", mock_conn) is True

        mock_conn.fetchrow = AsyncMock(return_value={"status": "AVAILABLE", "current_vehicle_id": "v1"})
        assert await is_dock_active("d1", mock_conn) is True

        mock_conn.fetchrow = AsyncMock(return_value={"status": "AVAILABLE", "current_vehicle_id": None})
        assert await is_dock_active("d1", mock_conn) is False

    asyncio.run(run())


def test_enrich_assignment_from_dock_fills_missing_fields():
    async def run():
        mock_conn = AsyncMock()
        with patch(
            "services.dock_resource_service.resolve_dock_assignment_context",
            new_callable=AsyncMock,
            return_value={
                "vehicle_id": "v1",
                "queue_entry_id": "q1",
                "appointment_id": "a1",
            },
        ):
            enriched = await enrich_assignment_from_dock("d1", {"created_by": "docks-ui"}, mock_conn)
            assert enriched["dock_id"] == "d1"
            assert enriched["vehicle_id"] == "v1"
            assert enriched["queue_entry_id"] == "q1"
            assert enriched["appointment_id"] == "a1"

    asyncio.run(run())
