"""
Execute demo data cleanup per audit SAFE_TO_DELETE + test-pattern vehicle removal.
Does not modify workflows or APIs.
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE = os.environ.get("API_BASE", "http://localhost:8001/api").rstrip("/")
HEADERS = {"Content-Type": "application/json", "X-YMS-Role": "admin", "X-YMS-User": "demo-cleanup"}
AUDIT_PATH = os.path.join(os.path.dirname(__file__), "demo_cleanup_audit_report.json")

DEMO_PLATES = {
    "MH12DE1001", "GJ01AB1002", "KA05CD1003", "DL01EF1004", "TN09GH1005",
    "HR26IJ1006", "RJ14KL1007", "UP32MN1008", "WB19OP1009", "PB10QR1010",
    "MH14ST1011", "GJ05UV1012", "KA03WX1013", "DL09YZ1014", "TN07AA1015",
    "MH22BB1016", "GJ11CC1017", "KA15DD1018", "DL03EE1019", "WB25FF1020",
}

TEST_PLATE_RE = re.compile(
    r"^(FIX|TEST|TXFAIL|FLOW|LC|TBD|APXI)",
    re.I,
)
TEST_BOOKING_RE = re.compile(
    r"^(FIXBK|TXFAILBK|FLOWBK|BK-LC|TXBK)",
    re.I,
)


def req(method: str, path: str) -> Any:
    url = f"{BASE}{path}"
    request = urllib.request.Request(url, headers=HEADERS, method=method)
    with urllib.request.urlopen(request, timeout=120) as res:
        raw = res.read()
        return json.loads(raw) if raw else None


def capture_metrics() -> dict[str, Any]:
    try:
        ops = req("GET", "/reports/operations-dashboard")
        yard = req("GET", "/yard/dashboard")
        alerts = req("GET", "/control-tower/alerts")
        detention = req("GET", "/detention")
        delay = req("GET", "/reports/delay-analysis")
        return {
            "operations_dashboard": ops,
            "yard_dashboard": yard,
            "alerts": {
                "total": len(alerts.get("activeAlerts") or []),
                "critical": alerts.get("criticalCount"),
                "warning": alerts.get("warningCount"),
                "items": alerts.get("activeAlerts") or [],
            },
            "detention_summary": detention.get("summary") if isinstance(detention, dict) else {},
            "delay_analysis": delay,
        }
    except Exception as exc:
        return {"error": str(exc)}


def load_safe_to_delete() -> dict[str, list[dict]]:
    with open(AUDIT_PATH, encoding="utf-8") as fh:
        audit = json.load(fh)
    plan = audit.get("phase6_cleanup_plan", {})
    grouped: dict[str, list[dict]] = {"vehicle": [], "appointment": [], "dock": [], "queue_entry": []}
    for item in plan.get("SAFE_TO_DELETE", []):
        entity = item.get("entity", "")
        if entity in grouped:
            grouped[entity].append(item)
    return grouped


def is_demo_vehicle(plate: str | None, booking: str | None = None) -> bool:
    if plate and plate in DEMO_PLATES:
        return True
    if booking and str(booking).startswith("DEMO-APT"):
        return True
    return False


async def run_cleanup() -> dict[str, Any]:
    from db import get_pool, init_db

    await init_db()
    pool = get_pool()
    deleted: dict[str, int] = defaultdict(int)
    stats: dict[str, Any] = {
        "deleted": deleted,
        "archived": {"note": "ARCHIVE cohort (e.g. AUD79387) retained; zones cleared if terminal", "count": 0},
        "preserved": {"demo_vehicles": 20, "demo_appointments": 20},
    }

    safe = load_safe_to_delete()
    safe_vehicle_ids = {x["id"] for x in safe["vehicle"]}
    safe_appt_ids = {x["id"] for x in safe["appointment"]}
    safe_dock_ids = {x["id"] for x in safe["dock"]}
    safe_queue_ids = {x["id"] for x in safe["queue_entry"]}

    async with pool.acquire() as conn:
        async with conn.transaction():
            # --- Identify test-pattern vehicles (req 5) still active (ARCHIVE cohort) ---
            extra_test_rows = await conn.fetch(
                """
                SELECT id, vehicle_number, status FROM vehicles
                WHERE vehicle_number ~* '^(FIX|TEST|TXFAIL|FLOW|LC|TBD|APXI)'
                  AND vehicle_number <> ALL($1::text[])
                """,
                list(DEMO_PLATES),
            )
            for row in extra_test_rows:
                safe_vehicle_ids.add(str(row["id"]))

            extra_appts = await conn.fetch(
                """
                SELECT id FROM appointments
                WHERE booking_reference ~* '^(FIXBK|TXFAILBK|FLOWBK|BK-LC|TXBK)'
                  AND booking_reference NOT LIKE 'DEMO-APT-%'
                """
            )
            for row in extra_appts:
                safe_appt_ids.add(str(row["id"]))

            # All vehicle IDs targeted
            vehicle_ids = list(safe_vehicle_ids)
            appt_ids = list(safe_appt_ids)

            if vehicle_ids:
                # 4. Release dock assignments for targeted + inactive vehicles
                released_docks = await conn.fetch(
                    """
                    UPDATE docks SET
                        status = 'AVAILABLE',
                        current_vehicle_id = NULL,
                        assigned_since = NULL,
                        updated_at = NOW()
                    WHERE current_vehicle_id = ANY($1::uuid[])
                    RETURNING id, dock_name
                    """,
                    vehicle_ids,
                )
                deleted["docks_released"] = len(released_docks)

                await conn.execute(
                    """
                    UPDATE labor_teams SET
                        assigned_vehicle_id = NULL,
                        assigned_dock_id = NULL,
                        assigned_queue_entry_id = NULL,
                        assigned_appointment_id = NULL,
                        status = 'ON_DUTY',
                        updated_at = NOW()
                    WHERE assigned_vehicle_id = ANY($1::uuid[])
                    """,
                    vehicle_ids,
                )
                await conn.execute(
                    """
                    UPDATE equipment SET
                        assigned_vehicle_id = NULL,
                        assigned_dock_id = NULL,
                        assigned_queue_entry_id = NULL,
                        status = 'IDLE',
                        updated_at = NOW()
                    WHERE assigned_vehicle_id = ANY($1::uuid[])
                    """,
                    vehicle_ids,
                )

                deleted["loading_exceptions"] += await _delete_count(
                    conn, vehicle_ids, "loading_operation_exceptions", "vehicle_id"
                )

                deleted["yard_events"] += await _delete_count(conn, vehicle_ids, "yard_events", "vehicle_id")
                deleted["gate_verifications"] += await _delete_count(conn, vehicle_ids, "gate_verifications", "vehicle_id")
                deleted["detention_records"] += await _delete_count(conn, vehicle_ids, "detention_records", "vehicle_id")
                deleted["vehicle_zone_history"] += await _delete_count(conn, vehicle_ids, "vehicle_zone_history", "vehicle_id")
                deleted["queue_entries"] += await _delete_count(conn, vehicle_ids, "queue_entries", "vehicle_id")

            if appt_ids:
                deleted["queue_entries"] += await _delete_count(conn, appt_ids, "queue_entries", "appointment_id")
                deleted["appointments"] += await conn.fetchval(
                    """
                    WITH doomed AS (
                        DELETE FROM appointments
                        WHERE id = ANY($1::uuid[])
                          AND booking_reference NOT LIKE 'DEMO-APT-%'
                        RETURNING id
                    )
                    SELECT COUNT(*)::int FROM doomed
                    """,
                    appt_ids,
                )

            if vehicle_ids:
                # Any remaining non-demo appointments for doomed vehicles
                deleted["appointments"] += await conn.fetchval(
                    """
                    WITH doomed AS (
                        DELETE FROM appointments
                        WHERE vehicle_id = ANY($1::uuid[])
                          AND booking_reference NOT LIKE 'DEMO-APT-%'
                        RETURNING id
                    )
                    SELECT COUNT(*)::int FROM doomed
                    """,
                    vehicle_ids,
                ) or 0

                deleted["vehicles"] = await conn.fetchval(
                    """
                    WITH doomed AS (
                        DELETE FROM vehicles
                        WHERE id = ANY($1::uuid[])
                          AND vehicle_number <> ALL($2::text[])
                        RETURNING id
                    )
                    SELECT COUNT(*)::int FROM doomed
                    """,
                    vehicle_ids,
                    list(DEMO_PLATES),
                )

            if safe_queue_ids:
                deleted["queue_entries"] += await conn.fetchval(
                    """
                    WITH doomed AS (
                        DELETE FROM queue_entries WHERE id = ANY($1::uuid[]) RETURNING id
                    )
                    SELECT COUNT(*)::int FROM doomed
                    """,
                    list(safe_queue_ids),
                )

            # 8. Clear zone for terminal non-demo vehicles (ARCHIVE preserved)
            deleted["zones_cleared"] = await conn.fetchval(
                """
                WITH updated AS (
                    UPDATE vehicles SET current_zone_id = NULL, updated_at = NOW()
                    WHERE vehicle_number <> ALL($1::text[])
                      AND status IN ('SCHEDULED', 'CANCELLED', 'EXITED')
                    RETURNING id
                )
                SELECT COUNT(*)::int FROM updated
                """,
                list(DEMO_PLATES),
            )

            # Also clear zone on deleted-target patterns if any remain
            await conn.execute(
                """
                UPDATE vehicles SET current_zone_id = NULL, updated_at = NOW()
                WHERE vehicle_number ~* '^(FIX|TEST|TXFAIL|FLOW|LC|TBD|APXI|VF-|UI-CHECK|APTTEST)'
                  AND vehicle_number <> ALL($1::text[])
                """,
                list(DEMO_PLATES),
            )

            # 7. Legacy dock — release then delete
            for dock_id in safe_dock_ids:
                await conn.execute(
                    """
                    UPDATE docks SET current_vehicle_id = NULL, status = 'AVAILABLE',
                        assigned_since = NULL, updated_at = NOW()
                    WHERE id = $1::uuid
                    """,
                    dock_id,
                )
                await conn.execute(
                    "UPDATE queue_entries SET dock_id = NULL WHERE dock_id = $1::uuid",
                    dock_id,
                )
                await conn.execute(
                    "UPDATE labor_teams SET assigned_dock_id = NULL WHERE assigned_dock_id = $1::uuid",
                    dock_id,
                )
                await conn.execute(
                    "UPDATE equipment SET assigned_dock_id = NULL WHERE assigned_dock_id = $1::uuid",
                    dock_id,
                )
                n = await conn.fetchval(
                    """
                    WITH doomed AS (
                        DELETE FROM docks WHERE id = $1::uuid AND dock_name = 'Demo Dock' RETURNING id
                    )
                    SELECT COUNT(*)::int FROM doomed
                    """,
                    dock_id,
                )
                deleted["docks"] += int(n or 0)

            # 9. Deduplicate OPEN loading exceptions — keep newest per vehicle+type
            dupes = await conn.fetch(
                """
                SELECT id FROM loading_operation_exceptions e
                WHERE status = 'OPEN'
                  AND id NOT IN (
                    SELECT DISTINCT ON (vehicle_id, exception_type) id
                    FROM loading_operation_exceptions
                    WHERE status = 'OPEN'
                    ORDER BY vehicle_id, exception_type, created_at DESC
                  )
                """
            )
            if dupes:
                dupe_ids = [str(r["id"]) for r in dupes]
                n = await conn.execute(
                    "DELETE FROM loading_operation_exceptions WHERE id = ANY($1::uuid[])",
                    dupe_ids,
                )
                deleted["loading_exceptions_deduped"] = await conn.fetchval(
                    """
                    WITH doomed AS (
                        DELETE FROM loading_operation_exceptions WHERE id = ANY($1::uuid[]) RETURNING id
                    )
                    SELECT COUNT(*)::int FROM doomed
                    """,
                    dupe_ids,
                )

            # Preserve counts
            stats["preserved"]["demo_vehicles"] = await conn.fetchval(
                "SELECT COUNT(*)::int FROM vehicles WHERE vehicle_number = ANY($1::text[])",
                list(DEMO_PLATES),
            )
            stats["preserved"]["demo_appointments"] = await conn.fetchval(
                "SELECT COUNT(*)::int FROM appointments WHERE booking_reference LIKE 'DEMO-APT-%'",
            )

    stats["deleted"] = dict(deleted)
    return stats


async def _delete_count(conn, ids: list[str], table: str, col: str) -> int:
    return await conn.fetchval(
        f"""
        WITH doomed AS (
            DELETE FROM {table} WHERE {col} = ANY($1::uuid[]) RETURNING id
        )
        SELECT COUNT(*)::int FROM doomed
        """,
        ids,
    ) or 0


def compute_readiness_score(metrics: dict, demo_vehicles: int = 20) -> int:
    score = 70
    ops = metrics.get("operations_dashboard") or {}
    alerts = metrics.get("alerts") or {}
    yard = metrics.get("yard_dashboard") or {}
    in_yard = ops.get("vehiclesInYard", 99)
    if in_yard == demo_vehicles:
        score += 15
    elif in_yard <= demo_vehicles + 2:
        score += 8
    else:
        score -= 10
    non_demo_alerts = sum(
        1 for a in (alerts.get("items") or [])
        if (a.get("vehicle") or "") not in DEMO_PLATES
    )
    if non_demo_alerts == 0:
        score += 10
    elif non_demo_alerts <= 3:
        score += 5
    else:
        score -= non_demo_alerts
    occ = yard.get("currentOccupancy", 99)
    if occ <= 25:
        score += 5
    return max(0, min(100, score))


async def main() -> None:
    print("=== DEMO DATA CLEANUP EXECUTION ===\n")
    before = capture_metrics()
    print("Before metrics captured.\n")

    cleanup_stats = await run_cleanup()
    print("Cleanup complete:", json.dumps(cleanup_stats, indent=2))

    print("\nRe-running seed_demo_yard.py ...")
    env = os.environ.copy()
    script = os.path.join(os.path.dirname(__file__), "seed_demo_yard.py")
    subprocess.run([sys.executable, script], env=env, check=False)

    after = capture_metrics()
    score = compute_readiness_score(after, cleanup_stats["preserved"].get("demo_vehicles", 20))

    report = {
        "executed_at": datetime.now(timezone.utc).isoformat(),
        "before": before,
        "after": after,
        "cleanup_stats": cleanup_stats,
        "demo_readiness_score": score,
        "comparison": {
            "vehicles_in_yard": {
                "before": (before.get("operations_dashboard") or {}).get("vehiclesInYard"),
                "after": (after.get("operations_dashboard") or {}).get("vehiclesInYard"),
            },
            "yard_occupancy": {
                "before": (before.get("yard_dashboard") or {}).get("currentOccupancy"),
                "after": (after.get("yard_dashboard") or {}).get("currentOccupancy"),
            },
            "alerts_total": {
                "before": (before.get("alerts") or {}).get("total"),
                "after": (after.get("alerts") or {}).get("total"),
            },
        },
    }

    out = os.path.join(os.path.dirname(__file__), "demo_cleanup_execution_report.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, default=str)
    print(f"\nReport: {out}")
    print(f"Demo Readiness Score: {score}/100")
    print(json.dumps(report["comparison"], indent=2))


if __name__ == "__main__":
    asyncio.run(main())
