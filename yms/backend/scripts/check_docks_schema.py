import asyncio
import os
import uuid
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


async def main():
    url = os.environ["DATABASE_URL"]
    conn = await asyncpg.connect(url)
    try:
        cols = await conn.fetch(
            """
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'docks'
            ORDER BY ordinal_position
            """
        )
        print("DOCKS COLUMNS:")
        for c in cols:
            print(f"  {c['column_name']}: {c['data_type']}")

        dock_id = str(uuid.uuid4())
        try:
            row = await conn.fetchrow(
                """
                INSERT INTO docks (
                    id, dock_code, dock_name, dock_type, zone,
                    supported_vehicle_types, supported_cargo_types,
                    max_capacity, status, notes,
                    estimated_service_time_min, default_labor_id, default_equipment_id,
                    current_vehicle_id, assigned_since, created_at, updated_at
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6::text[], $7::text[], $8, $9, $10,
                    $11, $12::uuid, $13::uuid,
                    NULL, NULL, NOW(), NOW()
                )
                RETURNING *
                """,
                dock_id,
                f"TEST-{dock_id[:8]}",
                "Test Dock",
                "GENERAL",
                "Zone A",
                ["TRUCK"],
                ["GENERAL"],
                1,
                "AVAILABLE",
                None,
                90,
                None,
                None,
            )
            print("INSERT OK:", dict(row))
            await conn.execute("DELETE FROM docks WHERE id = $1::uuid", dock_id)
        except Exception as exc:
            print("INSERT FAILED:", type(exc).__name__, exc)
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
