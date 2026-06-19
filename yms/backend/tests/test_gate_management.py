"""Gate Management — entry/exit verification lifecycle tests."""

import asyncio
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from enums import STATUS_TRANSITIONS


def test_arrived_status_in_transitions():
    assert "ARRIVED" in STATUS_TRANSITIONS["SCHEDULED"]
    assert "CHECKED_IN" in STATUS_TRANSITIONS["ARRIVED"]


def test_build_entry_checks_blocks_duplicate_checkin():
    from services.gate_service import _build_entry_checks

    vehicle = {"id": "v1", "vehicle_number": "MH01", "status": "WAITING"}
    appointment = {
        "id": "a1",
        "vehicle_id": "v1",
        "booking_reference": "APT-1",
        "status": "WAITING",
        "booking_date": date.today().isoformat(),
    }
    queue = {"id": "q1", "queue_number": "Q-1"}
    checks = _build_entry_checks(vehicle, appointment, queue, "G1")
    not_checked = next(c for c in checks if c["id"] == "not_checked_in")
    assert not_checked["passed"] is False


def test_exit_status_transitions():
    assert "EXIT_HOLDING" in STATUS_TRANSITIONS["COMPLETED"]
    assert "EXIT_VERIFIED" in STATUS_TRANSITIONS["EXIT_HOLDING"]
    assert "EXITED" in STATUS_TRANSITIONS["EXIT_VERIFIED"]


def test_build_exit_checks_requires_all_manual_items():
    from services.gate_service import _build_exit_checks, _exit_approved

    checks = _build_exit_checks(None)
    assert _exit_approved(checks) is False
    verification = {
        "loading_completed_verified": True,
        "appointment_completed_verified": True,
        "vehicle_verified": True,
        "delivery_document_verified": True,
        "gate_pass_approved": True,
        "invoice_approved": True,
        "security_cleared": True,
    }
    checks_ok = _build_exit_checks(verification)
    assert _exit_approved(checks_ok) is True


def test_approve_entry_blocks_when_already_checked_in():
    async def run():
        from services.gate_service import approve_entry

        with patch(
            "services.gate_service.get_vehicle",
            new_callable=AsyncMock,
            return_value={"id": "v1", "vehicle_number": "MH01", "status": "ARRIVED"},
        ), patch(
            "services.gate_service._fetch_latest_appointment_for_vehicle",
            new_callable=AsyncMock,
            return_value={"id": "a1", "vehicle_id": "v1", "status": "ARRIVED"},
        ), patch(
            "services.gate_service._fetch_latest_queue_for_vehicle",
            new_callable=AsyncMock,
            return_value={"appointment_id": "a1", "id": "q1"},
        ):
            with pytest.raises(HTTPException) as exc:
                await approve_entry("v1", "G1", "test")
            assert exc.value.status_code == 409

    asyncio.run(run())


def test_approve_entry_finds_appointment_with_uuid_vehicle_id():
    """Regression: list scan compared UUID vehicle_id to string path param and missed SCHEDULED appts."""
    import uuid

    async def run():
        from services.gate_service import approve_entry

        vid = uuid.UUID("8c7b9ba6-ad94-4ff6-b5fb-ad9ad4c38816")
        aid = uuid.UUID("0de37ba5-6e81-4862-8f24-ada8167a6d6e")
        vehicle = {"id": vid, "vehicle_number": "APXI1000", "status": "SCHEDULED"}
        appointment = {"id": aid, "vehicle_id": vid, "status": "SCHEDULED"}

        with patch(
            "services.gate_service.get_vehicle",
            new_callable=AsyncMock,
            side_effect=[vehicle, {**vehicle, "status": "ARRIVED"}],
        ), patch(
            "services.gate_service._fetch_latest_appointment_for_vehicle",
            new_callable=AsyncMock,
            side_effect=[appointment, {**appointment, "status": "ARRIVED"}],
        ), patch(
            "services.gate_service._fetch_latest_queue_for_vehicle",
            new_callable=AsyncMock,
            return_value=None,
        ), patch(
            "services.gate_service.mark_vehicle_arrived",
            new_callable=AsyncMock,
            return_value={"vehicle": {**vehicle, "status": "ARRIVED"}},
        ), patch(
            "services.gate_service.lookup_gate_context",
            new_callable=AsyncMock,
            return_value={"entryApproved": True, "entryChecks": [], "vehicle": vehicle},
        ), patch(
            "services.gate_service.check_in_vehicle",
            new_callable=AsyncMock,
            return_value={"id": "q1", "vehicle_id": vid, "appointment_id": aid},
        ), patch("services.gate_service.get_pool") as mock_pool, patch(
            "services.gate_service._get_or_create_verification",
            new_callable=AsyncMock,
            return_value={"id": "gv1"},
        ):
            mock_conn = MagicMock()
            mock_conn.transaction = MagicMock(return_value=AsyncMock())
            mock_conn.transaction.return_value.__aenter__ = AsyncMock(return_value=None)
            mock_conn.transaction.return_value.__aexit__ = AsyncMock(return_value=None)
            mock_conn.execute = AsyncMock()
            mock_pool.return_value.acquire = MagicMock(return_value=AsyncMock())
            mock_pool.return_value.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
            mock_pool.return_value.acquire.return_value.__aexit__ = AsyncMock(return_value=None)

            with patch("services.gate_service.create_yard_event", new_callable=AsyncMock):
                result = await approve_entry(str(vid), "G1", "test", queue_number="Q-REG1")
            assert result is not None

    asyncio.run(run())


def test_mark_vehicle_arrived_from_scheduled():
    async def run():
        from services.gate_service import mark_vehicle_arrived

        vehicle = {"id": "v1", "vehicle_number": "MH01", "status": "SCHEDULED"}
        mock_conn = MagicMock()
        mock_conn.transaction = MagicMock(return_value=AsyncMock())
        mock_conn.transaction.return_value.__aenter__ = AsyncMock(return_value=None)
        mock_conn.transaction.return_value.__aexit__ = AsyncMock(return_value=None)
        mock_conn.fetchrow = AsyncMock(return_value={"id": "a1", "status": "SCHEDULED"})
        mock_conn.execute = AsyncMock()

        pool = MagicMock()
        pool.acquire = MagicMock(return_value=AsyncMock())
        pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        pool.acquire.return_value.__aexit__ = AsyncMock(return_value=None)

        with patch("services.gate_service.get_pool", return_value=pool), patch(
            "services.gate_service.get_vehicle",
            new_callable=AsyncMock,
            return_value=vehicle,
        ), patch(
            "services.gate_service.update_vehicle",
            new_callable=AsyncMock,
        ), patch(
            "services.gate_service.update_appointment",
            new_callable=AsyncMock,
        ), patch(
            "services.gate_service.create_yard_event",
            new_callable=AsyncMock,
        ), patch(
            "services.gate_service.lookup_gate_context",
            new_callable=AsyncMock,
            return_value={"vehicle": {**vehicle, "status": "ARRIVED"}},
        ):
            result = await mark_vehicle_arrived("v1", "G1", "test")
            assert result["vehicle"]["status"] == "ARRIVED"

    asyncio.run(run())


def test_verify_exit_blocks_when_not_exit_holding():
    async def run():
        from services.gate_service import verify_exit

        with patch(
            "services.gate_service.get_exit_verification_detail",
            new_callable=AsyncMock,
            return_value={
                "vehicle": {"status": "LOADING"},
                "exitChecks": [{"passed": False, "label": "Loading Completed"}],
                "exitApproved": False,
            },
        ):
            with pytest.raises(HTTPException) as exc:
                await verify_exit("v1", "G1", "test")
            assert exc.value.status_code == 409

    asyncio.run(run())


def test_gate_out_blocks_when_not_verified():
    async def run():
        from services.gate_service import gate_out

        with patch(
            "services.gate_service.get_vehicle",
            new_callable=AsyncMock,
            return_value={"id": "v1", "vehicle_number": "MH01", "status": "EXIT_HOLDING"},
        ):
            with pytest.raises(HTTPException) as exc:
                await gate_out("v1", "G1", "test")
            assert exc.value.status_code == 409

    asyncio.run(run())


def test_verify_exit_emits_yard_event_with_dock_id():
    async def run():
        from services.gate_service import verify_exit

        appt = {"id": "a1"}
        queue = {"id": "q1", "dock_id": "d1"}
        detail = {
            "vehicle": {"status": "EXIT_HOLDING"},
            "appointment": appt,
            "queueEntry": queue,
            "exitChecks": [{"passed": True, "label": "x"}],
            "exitApproved": True,
        }

        with patch(
            "services.gate_service.get_exit_verification_detail",
            new_callable=AsyncMock,
            side_effect=[detail, detail],
        ), patch(
            "services.gate_service.transition_vehicle_status",
            new_callable=AsyncMock,
        ), patch(
            "services.gate_service.create_yard_event",
            new_callable=AsyncMock,
        ) as mock_event, patch("services.gate_service.get_pool") as mock_pool:
            mock_conn = MagicMock()
            mock_conn.transaction = MagicMock(return_value=AsyncMock())
            mock_conn.transaction.return_value.__aenter__ = AsyncMock(return_value=None)
            mock_conn.transaction.return_value.__aexit__ = AsyncMock(return_value=None)
            mock_conn.execute = AsyncMock()
            mock_pool.return_value.acquire = MagicMock(return_value=AsyncMock())
            mock_pool.return_value.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
            mock_pool.return_value.acquire.return_value.__aexit__ = AsyncMock(return_value=None)

            await verify_exit("v1", "G1", "gate-ui")
            mock_event.assert_called_once()
            assert mock_event.await_args.kwargs["dock_id"] == "d1"
            assert mock_event.await_args.kwargs["event_type"] == "EXIT_VERIFIED"

    asyncio.run(run())


def test_get_exit_holding_dashboard_does_not_pass_string_date_to_asyncpg():
    async def run():
        from datetime import date
        from services.gate_service import get_exit_holding_dashboard

        mock_conn = MagicMock()
        mock_conn.fetchval = AsyncMock(return_value=2)
        pool = MagicMock()
        pool.acquire = MagicMock(return_value=AsyncMock())
        pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
        pool.acquire.return_value.__aexit__ = AsyncMock(return_value=None)

        with patch("services.gate_service.get_pool", return_value=pool), patch(
            "services.gate_service.list_vehicles",
            new_callable=AsyncMock,
            return_value=([{"id": "v1", "status": "EXIT_HOLDING"}], 1),
        ), patch(
            "services.gate_service.list_yard_events",
            new_callable=AsyncMock,
            return_value=([], 0),
        ), patch(
            "services.gate_service._now",
            return_value=__import__("datetime").datetime(
                2026, 6, 9, 12, 0, tzinfo=__import__("datetime").timezone.utc
            ),
        ):
            result = await get_exit_holding_dashboard("G1")
            assert result["kpis"]["vehiclesWaiting"] == 1
            assert result["kpis"]["exitApprovedToday"] == 2
            bind_date = mock_conn.fetchval.await_args[0][1]
            assert isinstance(bind_date, date)

    asyncio.run(run())


def test_duplicate_exit_blocked():
    async def run():
        from services.gate_service import gate_out

        with patch(
            "services.gate_service.get_vehicle",
            new_callable=AsyncMock,
            return_value={"id": "v1", "vehicle_number": "MH01", "status": "EXITED"},
        ):
            with pytest.raises(HTTPException) as exc:
                await gate_out("v1", "G1", "test")
            assert exc.value.status_code == 409
            assert "already exited" in exc.value.detail.lower()

    asyncio.run(run())
