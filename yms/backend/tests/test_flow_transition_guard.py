"""Flow transition endpoint guards — lifecycle stabilization."""

import asyncio
from unittest.mock import patch

import pytest
from fastapi import HTTPException


def test_flow_endpoint_rejects_wait_to_loading():
    async def run():
        from routers import yms as yms_router
        from schemas import TransitionRequest

        with pytest.raises(HTTPException) as exc:
            await yms_router.transition_vehicle_endpoint(
                "v1",
                TransitionRequest(status="WAITING", created_by="test"),
                _auth=None,
            )
        assert exc.value.status_code == 400
        assert "cannot be set via flow transition" in exc.value.detail.lower()

    asyncio.run(run())


def test_flow_endpoint_rejects_exit_verified():
    async def run():
        from routers import yms as yms_router
        from schemas import TransitionRequest

        with pytest.raises(HTTPException) as exc:
            await yms_router.transition_vehicle_endpoint(
                "v1",
                TransitionRequest(status="EXIT_VERIFIED", created_by="test"),
                _auth=None,
            )
        assert exc.value.status_code == 400

    asyncio.run(run())


def test_flow_endpoint_allowed_statuses():
    from enums import FLOW_VEHICLE_TRANSITION_STATUSES

    assert "LOADING" in FLOW_VEHICLE_TRANSITION_STATUSES
    assert "COMPLETED" in FLOW_VEHICLE_TRANSITION_STATUSES
    assert "CANCELLED" in FLOW_VEHICLE_TRANSITION_STATUSES
    assert "EXIT_VERIFIED" not in FLOW_VEHICLE_TRANSITION_STATUSES
    assert "WAITING" not in FLOW_VEHICLE_TRANSITION_STATUSES
