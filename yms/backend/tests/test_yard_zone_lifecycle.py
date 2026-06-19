"""Integration-style lifecycle zone assignment (requires running DB)."""

import asyncio
import uuid
from datetime import datetime, timezone

import pytest

from db import get_pool, init_db
from services.yard_service import find_zone_by_map_code, sync_vehicle_zone_for_status


def test_loading_zone_a_exists():
    async def run():
        await init_db()
        zone = await find_zone_by_map_code("A")
        assert zone is not None
        assert zone["zone_type"] == "LOADING"
        assert zone["zone_name"] == "Loading"

    asyncio.run(run())


def test_lifecycle_zone_assignments():
    """Walk vehicle through statuses and verify current_zone_id after each step."""

    async def run():
        await init_db()
        pool = get_pool()
        plate = f"YM-{uuid.uuid4().hex[:8].upper()}"
        vehicle_id = str(uuid.uuid4())
        appointment_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        steps = []

        async with pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(
                    """
                    INSERT INTO vehicles (
                        id, vehicle_reference, vehicle_number, display_name, vehicle_type,
                        ownership_type, operation_type, material_type, transporter_name,
                        status, registration_source, created_at, updated_at
                    )
                    VALUES ($1, $2, $3, $4, 'TRUCK', 'outside', 'Loading', 'GENERAL', 'Test Co',
                            'SCHEDULED', 'manual', NOW(), NOW())
                    """,
                    vehicle_id,
                    f"VR-{plate}",
                    plate,
                    plate,
                )
                await conn.execute(
                    """
                    INSERT INTO appointments (
                        id, booking_reference, vehicle_id, customer_name, shipment_reference,
                        booking_date, reporting_time, scheduled_slot, gate_number, priority,
                        status, created_at, updated_at
                    )
                    VALUES ($1, $2, $3, 'Cust', 'Loading|General|Hub', $4::date, $5, '08:00', 'G1', 1,
                            'SCHEDULED', NOW(), NOW())
                    """,
                    appointment_id,
                    f"BK-{plate}",
                    vehicle_id,
                    now.date(),
                    now,
                )

        async def record(label, status):
            async with pool.acquire() as conn:
                async with conn.transaction():
                    await conn.execute(
                        "UPDATE vehicles SET status = $2, updated_at = NOW() WHERE id = $1::uuid",
                        vehicle_id,
                        status,
                    )
                    await sync_vehicle_zone_for_status(
                        vehicle_id,
                        status,
                        reason=f"Test {label}",
                        created_by="test",
                        conn=conn,
                    )
                    row = await conn.fetchrow(
                        """
                        SELECT v.status, v.current_zone_id, z.zone_name, z.zone_type, z.map_code
                        FROM vehicles v
                        LEFT JOIN yard_zones z ON z.id = v.current_zone_id
                        WHERE v.id = $1::uuid
                        """,
                        vehicle_id,
                    )
            steps.append(
                {
                    "step": label,
                    "status": row["status"],
                    "zone_name": row["zone_name"],
                    "zone_type": row["zone_type"],
                    "map_code": row["map_code"],
                    "current_zone_id": str(row["current_zone_id"]) if row["current_zone_id"] else None,
                }
            )

        await record("SCHEDULED", "SCHEDULED")
        assert steps[-1]["zone_type"] == "GATE_IN"

        await record("ARRIVED", "ARRIVED")
        assert steps[-1]["zone_type"] == "GATE_IN"

        await record("WAITING", "WAITING")
        assert steps[-1]["zone_type"] == "WAITING_AREA"

        await record("CALLED", "CALLED")
        assert steps[-1]["zone_type"] == "STAGING"

        for st in ("DOCK_ASSIGNED", "RESOURCE_PENDING", "READY_FOR_LOADING", "LOADING"):
            await record(st, st)
            assert steps[-1]["zone_type"] == "LOADING"
            assert steps[-1]["map_code"] == "A"

        await record("EXIT_HOLDING", "EXIT_HOLDING")
        assert steps[-1]["zone_type"] == "EXIT_HOLDING"

        await record("EXIT_VERIFIED", "EXIT_VERIFIED")
        assert steps[-1]["zone_type"] == "GATE_OUT"

        await record("EXITED", "EXITED")
        assert steps[-1]["current_zone_id"] is None

        async with pool.acquire() as conn:
            await conn.execute("DELETE FROM vehicle_zone_history WHERE vehicle_id = $1::uuid", vehicle_id)
            await conn.execute("DELETE FROM appointments WHERE id = $1::uuid", appointment_id)
            await conn.execute("DELETE FROM vehicles WHERE id = $1::uuid", vehicle_id)

        return steps

    steps = asyncio.run(run())
    assert len(steps) >= 10
