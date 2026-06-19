"""Direct PATCH lifecycle guard tests."""

import asyncio

import pytest
from fastapi import HTTPException

from services.yms_service import _guard_direct_lifecycle_status_patch


def test_blocks_direct_patch_to_loading():
    with pytest.raises(HTTPException) as exc:
        _guard_direct_lifecycle_status_patch(
            "WAITING",
            {"status": "LOADING"},
            internal=False,
            entity="vehicle",
        )
    assert exc.value.status_code == 409
    assert "workflow" in exc.value.detail.lower()


def test_allows_cancel_via_direct_patch():
    _guard_direct_lifecycle_status_patch(
        "SCHEDULED",
        {"status": "CANCELLED"},
        internal=False,
        entity="appointment",
    )


def test_allows_workflow_internal_status_change():
    _guard_direct_lifecycle_status_patch(
        "WAITING",
        {"status": "CALLED"},
        internal=True,
        entity="queue entry",
    )


def test_update_vehicle_blocks_operational_patch():
    async def run():
        from unittest.mock import AsyncMock, patch

        from services.yms_service import update_vehicle

        current = {
            "id": "v1",
            "vehicle_type": "TRUCK",
            "ownership_type": "company",
            "transporter_name": "T",
            "driver_name": "D",
            "driver_phone": "1",
            "status": "WAITING",
        }
        with patch("services.yms_service.get_pool") as mock_pool:
            mock_conn = AsyncMock()
            mock_conn.fetchrow = AsyncMock(return_value=current)
            mock_pool.return_value = mock_conn
            with pytest.raises(HTTPException) as exc:
                await update_vehicle("v1", {"status": "LOADING"})
            assert exc.value.status_code == 409

    asyncio.run(run())
