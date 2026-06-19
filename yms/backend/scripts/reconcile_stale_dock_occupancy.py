"""One-off reconciliation: release docks still occupied after vehicle left loading lifecycle."""

from __future__ import annotations

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import close_db, get_pool, init_db
from services.operational_metrics import LOADING_PIPELINE_STATUSES
from services.yms_service import _release_vehicle_dock_assignments, list_docks, list_vehicles

RELEASE_STATUSES = frozenset({"COMPLETED", "EXIT_HOLDING", "EXIT_VERIFIED", "EXITED"})


async def main() -> None:
    await init_db()
    pool = get_pool()
    vehicles, _ = await list_vehicles()
    docks, _ = await list_docks()
    vehicle_by_id = {str(v["id"]): v for v in vehicles}
    released = 0

    async with pool.acquire() as conn:
        for dock in docks:
            vid = dock.get("current_vehicle_id")
            if not vid:
                continue
            vehicle = vehicle_by_id.get(str(vid))
            if not vehicle:
                continue
            status = vehicle.get("status") or ""
            if status in LOADING_PIPELINE_STATUSES:
                continue
            if status not in RELEASE_STATUSES and dock.get("status") == "OCCUPIED":
                # Occupied dock with vehicle past loading pipeline
                pass
            if status in RELEASE_STATUSES or (
                dock.get("status") == "OCCUPIED" and status not in LOADING_PIPELINE_STATUSES
            ):
                await _release_vehicle_dock_assignments(
                    str(vid),
                    conn=conn,
                    created_by="reconcile-stale-docks",
                    lifecycle_status=status or "RECONCILED",
                )
                released += 1
                print(f"Released {dock.get('dock_code')} (vehicle {vehicle.get('vehicle_number')} / {status})")

    print(f"Reconciled {released} stale dock(s)")
    await close_db()


if __name__ == "__main__":
    asyncio.run(main())
