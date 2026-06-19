"""Unit tests for virtual queue metrics and display status."""

import asyncio
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException

from services.queue_service import (
    derive_display_status,
    detention_cost_inr,
    detention_risk_level,
    override_queue_priority,
    queue_aging_level,
    recommend_dock,
)


def test_detention_risk_levels():
    assert detention_risk_level(10, 200) == "LOW"
    assert detention_risk_level(45, 1500) == "MEDIUM"
    assert detention_risk_level(75, 3500) == "HIGH"
    assert detention_risk_level(130, 6000) == "CRITICAL"


def test_queue_aging_levels():
    assert queue_aging_level(20) == "NORMAL"
    assert queue_aging_level(60) == "WARNING"
    assert queue_aging_level(100) == "CRITICAL"


def test_derive_display_status_ready_to_call():
    assert derive_display_status("WAITING", "WAITING", rank=1, priority_score=80) == "READY_TO_CALL"


def test_derive_display_status_resource_pending():
    assert derive_display_status("DOCK_ASSIGNED", "RESOURCE_PENDING", rank=3, priority_score=50) == "RESOURCE_PENDING"


def test_derive_display_status_reporting_to_dock():
    assert derive_display_status("CALLED", "CALLED", rank=2, priority_score=70) == "REPORTING_TO_DOCK"


def test_recommend_dock_prefers_available_match():
    appointment = {"shipment_reference": "Pharma cold chain"}
    docks = [
        {"id": "d1", "dock_code": "DK-1", "dock_name": "Cold 1", "status": "AVAILABLE", "supported_cargo_types": ["COLD_CHAIN"], "current_vehicle_id": None},
        {"id": "d2", "dock_code": "DK-2", "dock_name": "General", "status": "OCCUPIED", "supported_cargo_types": ["GENERAL"], "current_vehicle_id": "v1"},
    ]
    rec = recommend_dock(appointment=appointment, docks=docks, labor_rows=[{"status": "ON_DUTY"}], equipment_rows=[{"status": "IDLE"}])
    assert rec is not None
    assert rec["dockCode"] == "DK-1"
    assert rec["materialMatch"] is True


def test_override_requires_reason():
    async def run():
        with patch("services.queue_service.get_pool") as mock_pool:
            mock_pool.return_value.acquire = AsyncMock()
            return await override_queue_priority("q1", target_rank=1, reason="", supervisor="Sup", created_by="test")

    with pytest.raises(HTTPException) as exc:
        asyncio.run(run())
    assert exc.value.status_code == 400
