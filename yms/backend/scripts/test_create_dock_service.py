import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from db import init_db, close_db
from schemas import DockCreate, DockOut
from services.yms_service import create_dock


async def main():
    await init_db()
    try:
        payload = DockCreate(
            dock_name="E2E Test Dock",
            dock_type="GENERAL",
            zone="Zone A",
            supported_vehicle_types=["TRUCK"],
            supported_cargo_types=["GENERAL"],
            max_capacity=1,
            status="AVAILABLE",
            estimated_service_time_min=90,
        )
        row = await create_dock(payload.model_dump())
        print("create_dock row keys:", list(row.keys()))
        out = DockOut(**row)
        print("DockOut OK:", out.dock_code, out.id)
    except Exception as exc:
        print("FAILED:", type(exc).__name__, exc)
        import traceback
        traceback.print_exc()
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(main())
