"""
Demo Data Cleanup Audit — read-only inventory, orphan detection, KPI/alert pollution.
Run: DATABASE_URL=... API_BASE=... python scripts/demo_data_cleanup_audit.py
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import sys
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE = os.environ.get("API_BASE", "http://localhost:8001/api").rstrip("/")
HEADERS = {"Content-Type": "application/json", "X-YMS-Role": "admin", "X-YMS-User": "audit"}

DEMO_PLATES = {
    "MH12DE1001", "GJ01AB1002", "KA05CD1003", "DL01EF1004", "TN09GH1005",
    "HR26IJ1006", "RJ14KL1007", "UP32MN1008", "WB19OP1009", "PB10QR1010",
    "MH14ST1011", "GJ05UV1012", "KA03WX1013", "DL09YZ1014", "TN07AA1015",
    "MH22BB1016", "GJ11CC1017", "KA15DD1018", "DL03EE1019", "WB25FF1020",
}

DEMO_LABOR = {"Team Alpha", "Team Bravo", "Team Charlie", "Team Delta", "Team Echo"}
DEMO_EQUIPMENT = {
    "Forklift A", "Forklift B", "Forklift C", "Reach Stacker 1", "Reach Stacker 2",
    "Crane 1", "Pallet Jack 1", "Pallet Jack 2",
}

EXPECTED_STATUS = {
    "ARRIVED": 2, "WAITING": 3, "CALLED": 3, "DOCK_ASSIGNED": 2,
    "RESOURCE_PENDING": 2, "READY_FOR_LOADING": 2, "LOADING": 3,
    "EXIT_HOLDING": 2, "EXIT_VERIFIED": 1,
}
# DOCK_ASSIGNED collapses to RESOURCE_PENDING in workflow
EXPECTED_STATUS_ACTUAL = {
    "ARRIVED": 2, "WAITING": 3, "CALLED": 3, "RESOURCE_PENDING": 4,
    "READY_FOR_LOADING": 2, "LOADING": 3, "EXIT_HOLDING": 2, "EXIT_VERIFIED": 1,
}

TEST_PATTERNS = [
    re.compile(r"^FIX[-_]", re.I),
    re.compile(r"^TEST[-_]", re.I),
    re.compile(r"^TMP[-_]", re.I),
    re.compile(r"^TXFAIL", re.I),
    re.compile(r"^DUMMY", re.I),
    re.compile(r"^SAMPLE", re.I),
    re.compile(r"^DEBUG", re.I),
    re.compile(r"^MANUAL", re.I),
    re.compile(r"^DEMO_OLD", re.I),
    re.compile(r"^LC[-_]", re.I),
    re.compile(r"^FLOW", re.I),
    re.compile(r"^TBD[-_]", re.I),
    re.compile(r"^APXI", re.I),
    re.compile(r"^BK[-_]LC", re.I),
    re.compile(r"TXFAILBK", re.I),
    re.compile(r"FIXBK", re.I),
]

TERMINAL_STATUSES = frozenset({"EXITED", "CANCELLED", "COMPLETED"})
INACTIVE_VEHICLE = frozenset({"EXITED", "CANCELLED", "SCHEDULED", "DRAFT"})


def req(method: str, path: str) -> Any:
    url = f"{BASE}{path}"
    request = urllib.request.Request(url, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(request, timeout=120) as res:
            raw = res.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        raise RuntimeError(f"{method} {path} -> HTTP {exc.code}") from exc


def list_api(path: str) -> list[dict]:
    data = req("GET", path)
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and "items" in data:
        return data["items"]
    return []


def is_test_label(value: str | None) -> bool:
    if not value:
        return False
    return any(p.search(value) for p in TEST_PATTERNS)


def classify_vehicle(v: dict) -> str:
    plate = v.get("vehicle_number") or ""
    if plate in DEMO_PLATES:
        return "DEMO"
    if is_test_label(plate):
        return "TEST"
    if (v.get("booking_reference") or "").startswith("DEMO-APT"):
        return "DEMO"
    return "OTHER"


def classify_appointment(a: dict) -> str:
    ref = a.get("booking_reference") or ""
    if ref.startswith("DEMO-APT"):
        return "DEMO"
    if is_test_label(ref):
        return "TEST"
    return "OTHER"


def is_seed_dock(d: dict) -> bool:
    name = d.get("dock_name") or ""
    notes = d.get("notes") or ""
    if notes == "Demo seed dock":
        return True
    return name.startswith("Demo ") and any(
        x in name for x in ("General Loading", "Cold Chain", "Hazmat")
    )


async def fetch_db_inventory() -> dict[str, Any]:
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        return {"error": "DATABASE_URL not set — DB counts skipped"}

    from db import get_pool, init_db

    await init_db()
    pool = get_pool()
    out: dict[str, Any] = {}

    tables = [
        ("appointments", "SELECT * FROM appointments ORDER BY created_at"),
        ("vehicles", "SELECT * FROM vehicles ORDER BY created_at"),
        ("queue_entries", "SELECT * FROM queue_entries ORDER BY created_at"),
        ("docks", "SELECT * FROM docks ORDER BY created_at"),
        ("labor_teams", "SELECT * FROM labor_teams ORDER BY created_at"),
        ("equipment", "SELECT * FROM equipment ORDER BY created_at"),
        ("yard_events", "SELECT id, event_type, vehicle_id, appointment_id, event_time, created_at FROM yard_events ORDER BY created_at DESC LIMIT 2000"),
        ("gate_verifications", "SELECT * FROM gate_verifications ORDER BY created_at"),
        ("loading_operation_exceptions", "SELECT * FROM loading_operation_exceptions ORDER BY created_at"),
        ("detention_records", "SELECT * FROM detention_records ORDER BY created_at"),
        ("yard_zones", "SELECT * FROM yard_zones ORDER BY zone_code"),
    ]

    async with pool.acquire() as conn:
        out["_zone_occupancy"] = await conn.fetchval(
            "SELECT COUNT(*)::int FROM vehicles WHERE current_zone_id IS NOT NULL"
        )
        out["_demo_zone_occupancy"] = await conn.fetchval(
            """
            SELECT COUNT(*)::int FROM vehicles
            WHERE current_zone_id IS NOT NULL
              AND vehicle_number = ANY($1::text[])
            """,
            list(DEMO_PLATES),
        )
        for name, sql in tables:
            rows = await conn.fetch(sql)
            out[name] = [dict(r) for r in rows]

    return out


def build_inventory(db: dict[str, Any], api: dict[str, Any]) -> dict[str, Any]:
    vehicles = db.get("vehicles") or api.get("vehicles") or []
    appointments = db.get("appointments") or api.get("appointments") or []
    queues = db.get("queue_entries") or api.get("queue_entries") or []
    docks = db.get("docks") or api.get("docks") or []
    labor = db.get("labor_teams") or api.get("labor") or []
    equipment = db.get("equipment") or api.get("equipment") or []
    events = db.get("yard_events") or api.get("events") or []
    gate = db.get("gate_verifications") or []
    exceptions = db.get("loading_operation_exceptions") or api.get("exceptions") or []
    detention = db.get("detention_records") or []
    zones = db.get("yard_zones") or api.get("zones") or []

    def summarize_entity(rows: list, label_fn, active_fn=None):
        total = len(rows)
        test = [r for r in rows if label_fn(r) == "TEST"]
        demo = [r for r in rows if label_fn(r) == "DEMO"]
        other = [r for r in rows if label_fn(r) == "OTHER"]
        active = [r for r in rows if active_fn(r)] if active_fn else rows
        return {
            "total": total,
            "active": len(active),
            "demo": len(demo),
            "test_suspected": len(test),
            "other": len(other),
            "test_samples": [_sample(r) for r in test[:5]],
            "other_samples": [_sample(r) for r in other[:5]],
        }

    def _sample(r: dict) -> dict:
        keys = ["id", "vehicle_number", "booking_reference", "dock_name", "dock_code",
                "team_name", "equipment_name", "status", "event_type", "exception_type"]
        return {k: r.get(k) for k in keys if k in r and r.get(k) is not None}

    def veh_label(v):
        return classify_vehicle(v)

    def appt_label(a):
        return classify_appointment(a)

    def appt_active(a):
        return a.get("status") not in TERMINAL_STATUSES

    def veh_active(v):
        return v.get("status") not in TERMINAL_STATUSES | {"EXITED"}

    def queue_active(q):
        return q.get("status") not in TERMINAL_STATUSES | {"EXITED"}

    inv = {
        "appointments": summarize_entity(appointments, appt_label, appt_active),
        "vehicles": summarize_entity(vehicles, veh_label, veh_active),
        "queue_entries": {
            "total": len(queues),
            "active": sum(1 for q in queues if queue_active(q)),
            "cancelled": sum(1 for q in queues if q.get("status") == "CANCELLED"),
            "test_suspected": sum(1 for q in queues if _queue_is_test(q, vehicles)),
        },
        "docks": {
            "total": len(docks),
            "demo_seed": sum(1 for d in docks if is_seed_dock(d)),
            "legacy_demo": sum(1 for d in docks if (d.get("dock_name") or "").startswith("Demo ") and not is_seed_dock(d)),
            "production": sum(1 for d in docks if not (d.get("dock_name") or "").startswith("Demo ")),
            "occupied": sum(1 for d in docks if d.get("current_vehicle_id") or d.get("status") == "OCCUPIED"),
        },
        "labor_teams": {
            "total": len(labor),
            "demo": sum(1 for t in labor if (t.get("team_name") or "") in DEMO_LABOR),
            "assigned": sum(1 for t in labor if t.get("status") == "ASSIGNED" or t.get("assigned_dock_id")),
        },
        "equipment": {
            "total": len(equipment),
            "demo": sum(1 for e in equipment if (e.get("equipment_name") or "") in DEMO_EQUIPMENT),
            "in_use": sum(1 for e in equipment if e.get("status") in {"IN_USE", "ASSIGNED"}),
        },
        "yard_events": {"total": len(events), "note": "last 500 from DB if available"},
        "gate_verifications": {"total": len(gate)},
        "loading_operation_exceptions": {
            "total": len(exceptions),
            "open": sum(1 for e in exceptions if e.get("status") == "OPEN"),
        },
        "detention_records": {"total": len(detention)},
        "yard_zones": {"total": len(zones), "mandatory": sum(1 for z in zones if z.get("is_mandatory"))},
    }
    return inv, {
        "vehicles": vehicles, "appointments": appointments, "queues": queues,
        "docks": docks, "labor": labor, "equipment": equipment,
        "events": events, "gate": gate, "exceptions": exceptions,
        "detention": detention, "zones": zones,
    }


def _queue_is_test(q: dict, vehicles: list) -> bool:
    vid = str(q.get("vehicle_id") or "")
    v = next((x for x in vehicles if str(x.get("id")) == vid), None)
    if v:
        return classify_vehicle(v) == "TEST"
    return False


def orphan_report(entities: dict[str, list]) -> dict[str, Any]:
    vehicles = {str(v["id"]): v for v in entities["vehicles"]}
    appointments = {str(a["id"]): a for a in entities["appointments"]}
    appt_by_vehicle = defaultdict(list)
    for a in entities["appointments"]:
        if a.get("vehicle_id"):
            appt_by_vehicle[str(a["vehicle_id"])].append(a)

    orphans: dict[str, list] = defaultdict(list)

    for a in entities["appointments"]:
        vid = a.get("vehicle_id")
        if not vid or str(vid) not in vehicles:
            orphans["appointments_without_vehicle"].append(_brief_appt(a))

    for v in entities["vehicles"]:
        if v.get("status") not in INACTIVE_VEHICLE and not appt_by_vehicle.get(str(v["id"])):
            orphans["active_vehicles_without_appointment"].append(_brief_vehicle(v))

    for q in entities["queues"]:
        if q.get("status") in {"CANCELLED", "EXITED"}:
            continue
        vid = str(q.get("vehicle_id") or "")
        aid = str(q.get("appointment_id") or "")
        if vid and vid not in vehicles:
            orphans["queue_without_vehicle"].append(_brief_queue(q))
        elif not q.get("vehicle_id"):
            orphans["queue_without_vehicle"].append(_brief_queue(q))
        if aid and aid not in appointments:
            orphans["queue_without_appointment"].append(_brief_queue(q))

    for d in entities["docks"]:
        cv = d.get("current_vehicle_id")
        if cv:
            v = vehicles.get(str(cv))
            if not v:
                orphans["dock_refs_missing_vehicle"].append({"dock": d.get("dock_name"), "vehicle_id": str(cv)})
            elif v.get("status") in INACTIVE_VEHICLE | {"EXITED"}:
                orphans["dock_refs_inactive_vehicle"].append({
                    "dock": d.get("dock_name"), "vehicle": v.get("vehicle_number"), "status": v.get("status"),
                })

    for t in entities["labor"]:
        av = t.get("assigned_vehicle_id")
        if av:
            v = vehicles.get(str(av))
            if not v or v.get("status") in INACTIVE_VEHICLE | {"EXITED"}:
                orphans["labor_assigned_inactive"].append({
                    "team": t.get("team_name"), "vehicle": v.get("vehicle_number") if v else str(av),
                })

    for e in entities["equipment"]:
        av = e.get("assigned_vehicle_id")
        if av:
            v = vehicles.get(str(av))
            if not v or v.get("status") in INACTIVE_VEHICLE | {"EXITED"}:
                orphans["equipment_assigned_inactive"].append({
                    "equipment": e.get("equipment_name"), "vehicle": v.get("vehicle_number") if v else str(av),
                })

    for g in entities["gate"]:
        aid = g.get("appointment_id")
        if aid and str(aid) not in appointments:
            orphans["gate_verification_missing_appt"].append({"id": str(g.get("id")), "appointment_id": str(aid)})

    for ex in entities["exceptions"]:
        if ex.get("status") != "OPEN":
            continue
        vid = ex.get("vehicle_id")
        v = vehicles.get(str(vid)) if vid else None
        if v and v.get("status") in {"EXITED", "CANCELLED"}:
            orphans["exception_on_exited_vehicle"].append({
                "id": str(ex.get("id")), "type": ex.get("exception_type"),
                "vehicle": v.get("vehicle_number"), "status": v.get("status"),
            })

    for dr in entities["detention"]:
        vid = dr.get("vehicle_id")
        if vid and str(vid) not in vehicles:
            orphans["detention_missing_vehicle"].append({"id": str(dr.get("id")), "vehicle_id": str(vid)})

    return {k: {"count": len(v), "records": v[:20]} for k, v in orphans.items()}


def _brief_vehicle(v: dict) -> dict:
    return {"id": str(v.get("id")), "plate": v.get("vehicle_number"), "status": v.get("status")}


def _brief_appt(a: dict) -> dict:
    return {"id": str(a.get("id")), "ref": a.get("booking_reference"), "status": a.get("status")}


def _brief_queue(q: dict) -> dict:
    return {"id": str(q.get("id")), "status": q.get("status"), "vehicle_id": str(q.get("vehicle_id"))}


def demo_validation(vehicles: list) -> dict:
    demo = [v for v in vehicles if v.get("vehicle_number") in DEMO_PLATES]
    dist = Counter(v.get("status") for v in demo)
    return {
        "demo_vehicle_count": len(demo),
        "expected": 20,
        "status_distribution": dict(dist),
        "expected_distribution": EXPECTED_STATUS_ACTUAL,
        "gaps": {
            k: dist.get(k, 0) - EXPECTED_STATUS_ACTUAL.get(k, 0)
            for k in set(dist) | set(EXPECTED_STATUS_ACTUAL)
        },
    }


def kpi_pollution(entities: dict, ops: dict, yard: dict, alerts: list) -> dict:
    vehicles = entities["vehicles"]
    in_yard_statuses = {
        "ARRIVED", "WAITING", "CHECKED_IN", "CALLED", "DOCK_ASSIGNED",
        "RESOURCE_PENDING", "READY_FOR_LOADING", "LOADING", "EXIT_HOLDING", "EXIT_VERIFIED",
    }

    def in_yard(v):
        return v.get("status") in in_yard_statuses

    demo_in_yard = [v for v in vehicles if v.get("vehicle_number") in DEMO_PLATES and in_yard(v)]
    test_in_yard = [v for v in vehicles if classify_vehicle(v) == "TEST" and in_yard(v)]
    other_in_yard = [v for v in vehicles if classify_vehicle(v) == "OTHER" and in_yard(v)]

    pollution_ids = {
        "inflated_in_yard_count": [_brief_vehicle(v) for v in test_in_yard + other_in_yard],
        "demo_only_in_yard": len(demo_in_yard),
        "pollution_in_yard": len(test_in_yard) + len(other_in_yard),
    }

    waiting_pollution = [
        _brief_vehicle(v) for v in vehicles
        if v.get("status") in {"WAITING", "CHECKED_IN"} and v.get("vehicle_number") not in DEMO_PLATES
    ]

    loading_pollution = [
        _brief_vehicle(v) for v in vehicles
        if v.get("status") in {"LOADING", "READY_FOR_LOADING"} and v.get("vehicle_number") not in DEMO_PLATES
    ]

    exit_pollution = [
        _brief_vehicle(v) for v in vehicles
        if v.get("status") in {"EXIT_HOLDING", "EXIT_VERIFIED"} and v.get("vehicle_number") not in DEMO_PLATES
    ]

    zone_occ = yard.get("currentOccupancy") or 0
    demo_with_zone = [
        _brief_vehicle(v) for v in vehicles
        if v.get("vehicle_number") in DEMO_PLATES and v.get("current_zone_id")
    ]
    non_demo_with_zone = [
        _brief_vehicle(v) for v in vehicles
        if v.get("vehicle_number") not in DEMO_PLATES and v.get("current_zone_id")
    ]

    alert_pollution = []
    for a in alerts:
        plate = a.get("vehicle") or ""
        is_demo = plate in DEMO_PLATES
        alert_pollution.append({
            "id": a.get("id"),
            "vehicle": plate,
            "alertType": a.get("alertType"),
            "severity": a.get("severity"),
            "exceptionType": a.get("exceptionType"),
            "durationMin": a.get("durationMin"),
            "is_demo": is_demo,
            "should_remove": not is_demo,
            "reason": "Legacy test/debug vehicle" if not is_demo else "Valid demo scenario",
        })

    return {
        "operations_dashboard_current": ops,
        "yard_dashboard_current": yard,
        "pollution_summary": {
            "total_in_yard_api": ops.get("vehiclesInYard"),
            "demo_in_yard": len(demo_in_yard),
            "non_demo_in_yard": len(test_in_yard) + len(other_in_yard),
            "yard_zone_occupancy": zone_occ,
            "non_demo_zone_assignments": len(non_demo_with_zone),
            "waiting_pollution_count": len(waiting_pollution),
            "loading_pollution_count": len(loading_pollution),
            "exit_pollution_count": len(exit_pollution),
        },
        "polluting_vehicle_ids": pollution_ids,
        "waiting_pollution": waiting_pollution[:15],
        "loading_pollution": loading_pollution[:15],
        "exit_pollution": exit_pollution[:15],
        "non_demo_zone_vehicles": non_demo_with_zone[:20],
        "alert_pollution": alert_pollution,
    }


def cleanup_plan(entities: dict, pollution: dict) -> dict:
    plan = {"SAFE_TO_DELETE": [], "SAFE_TO_ARCHIVE": [], "KEEP": []}

    for v in entities["vehicles"]:
        plate = v.get("vehicle_number") or ""
        cls = classify_vehicle(v)
        entry = {
            "entity": "vehicle",
            "id": str(v.get("id")),
            "label": plate,
            "status": v.get("status"),
            "reason": "",
            "modules_affected": [],
        }
        if cls == "DEMO":
            plan["KEEP"].append({**entry, "reason": "Current demo seed fleet"})
        elif cls == "TEST" or is_test_label(plate):
            entry["reason"] = "Test/debug plate pattern"
            entry["modules_affected"] = ["Dashboards", "Control Tower", "Yard Map", "Detention"]
            if v.get("status") in {"EXITED", "CANCELLED"}:
                plan["SAFE_TO_DELETE"].append(entry)
            else:
                plan["SAFE_TO_ARCHIVE"].append({**entry, "reason": "Active test vehicle — archive or exit first"})
        else:
            entry["reason"] = "Non-demo operational residue (manual/APXI/APT-* etc.)"
            entry["modules_affected"] = ["KPI inflation", "Yard occupancy"]
            if v.get("status") in {"EXITED", "CANCELLED", "SCHEDULED"}:
                plan["SAFE_TO_DELETE"].append(entry)
            else:
                plan["SAFE_TO_ARCHIVE"].append(entry)

    for a in entities["appointments"]:
        cls = classify_appointment(a)
        entry = {
            "entity": "appointment",
            "id": str(a.get("id")),
            "label": a.get("booking_reference"),
            "status": a.get("status"),
        }
        if cls == "DEMO":
            plan["KEEP"].append({**entry, "reason": "Demo appointment"})
        elif cls == "TEST":
            plan["SAFE_TO_DELETE"].append({**entry, "reason": "Test booking reference", "modules_affected": ["Appointments", "Dashboard"]})
        elif a.get("status") in {"EXITED", "CANCELLED", "COMPLETED"}:
            plan["SAFE_TO_ARCHIVE"].append({**entry, "reason": "Historical non-demo appointment"})

    for d in entities["docks"]:
        if is_seed_dock(d):
            plan["KEEP"].append({"entity": "dock", "id": str(d.get("id")), "label": d.get("dock_name"), "reason": "Demo seed dock"})
        elif (d.get("dock_name") or "").startswith("Demo "):
            plan["SAFE_TO_DELETE"].append({
                "entity": "dock", "id": str(d.get("id")), "label": d.get("dock_name"),
                "reason": "Legacy misconfigured demo dock (e.g. TEMPO-only)", "modules_affected": ["Docks"],
            })
        elif d.get("dock_code", "").startswith("DK-") and not is_seed_dock(d):
            plan["SAFE_TO_ARCHIVE"].append({
                "entity": "dock", "id": str(d.get("id")), "label": d.get("dock_name"),
                "reason": "Pre-seed production dock used by test vehicles", "modules_affected": ["Docks", "Resource assignments"],
            })

    for q in entities["queues"]:
        if q.get("status") == "CANCELLED":
            plan["SAFE_TO_DELETE"].append({
                "entity": "queue_entry", "id": str(q.get("id")),
                "reason": "Cancelled queue from seed reset", "modules_affected": [],
            })

    return {
        "SAFE_TO_DELETE": plan["SAFE_TO_DELETE"][:50],
        "SAFE_TO_DELETE_total": len(plan["SAFE_TO_DELETE"]),
        "SAFE_TO_ARCHIVE": plan["SAFE_TO_ARCHIVE"][:50],
        "SAFE_TO_ARCHIVE_total": len(plan["SAFE_TO_ARCHIVE"]),
        "KEEP_total": len(plan["KEEP"]),
    }


def _derive_alert_candidates(db: dict, entities: dict) -> list[dict]:
    """Heuristic alert list when Control Tower API is offline."""
    vehicles = {str(v["id"]): v for v in db.get("vehicles") or []}
    alerts = []
    for v in db.get("vehicles") or []:
        plate = v.get("vehicle_number") or ""
        if v.get("status") in {"WAITING", "CHECKED_IN"}:
            mins = 0
            alerts.append({
                "vehicle": plate,
                "alertType": "VEHICLE_WAITING_TOO_LONG",
                "severity": "WARNING",
                "durationMin": mins,
                "is_demo": plate in DEMO_PLATES,
            })
        if v.get("status") == "RESOURCE_PENDING" and plate in DEMO_PLATES:
            alerts.append({
                "vehicle": plate,
                "alertType": "LABOR_UNAVAILABLE",
                "severity": "WARNING",
                "durationMin": 0,
                "is_demo": True,
            })
    for ex in db.get("loading_operation_exceptions") or []:
        if ex.get("status") != "OPEN":
            continue
        v = vehicles.get(str(ex.get("vehicle_id")))
        alerts.append({
            "vehicle": v.get("vehicle_number") if v else str(ex.get("vehicle_id")),
            "alertType": "LOADING_EXCEPTION",
            "severity": "CRITICAL" if ex.get("exception_type") == "EQUIPMENT_FAILURE" else "WARNING",
            "exceptionType": ex.get("exception_type"),
            "durationMin": 0,
            "is_demo": v and v.get("vehicle_number") in DEMO_PLATES,
        })
    return alerts


def post_cleanup_projection(ops: dict, yard: dict, demo_count: int, pollution: dict) -> dict:
    non_demo = pollution["pollution_summary"]["non_demo_in_yard"]
    return {
        "operations_dashboard_projected": {
            "vehiclesInYard": demo_count,
            "vehiclesWaiting": 3,
            "vehiclesLoading": 5,
            "vehiclesInExitHolding": 3,
            "avgTurnaroundMinutes": "Recalculated from demo events only (~15–45 min realistic)",
            "slaCompliancePct": "95–100% (demo-only cohort)",
            "note": f"Removes ~{non_demo} non-demo in-yard vehicles from KPI denominator",
        },
        "yard_dashboard_projected": {
            "currentOccupancy": pollution["pollution_summary"].get("demo_in_yard", demo_count),
            "yardUtilizationPct": round((demo_count / max(yard.get("totalCapacity") or 210, 1)) * 100, 1),
            "note": "Occupancy drops when non-demo current_zone_id cleared",
        },
        "control_tower_projected": {
            "activeAlerts": "3 demo exceptions + 4 LABOR_UNAVAILABLE (demo RESOURCE_PENDING)",
            "legacy_alerts_removed": sum(1 for a in pollution.get("alert_pollution", []) if a.get("should_remove")),
        },
    }


def sql_cleanup_snippets(plan: dict, entities: dict) -> list[str]:
    """Illustrative SQL — DO NOT RUN without review."""
    test_plates = [v.get("vehicle_number") for v in entities["vehicles"] if classify_vehicle(v) == "TEST"]
    return [
        "-- PHASE: Archive exited test vehicles (after workflow exit if still active)",
        f"-- DELETE FROM yard_events WHERE vehicle_id IN (SELECT id FROM vehicles WHERE vehicle_number ~* '^(FIX|TEST|TMP|TXFAIL|LC-|TBD-|APXI)');",
        f"-- DELETE FROM queue_entries WHERE status = 'CANCELLED';",
        "-- DELETE FROM queue_entries WHERE vehicle_id IN (SELECT id FROM vehicles WHERE vehicle_number = ANY($test_plates));",
        "-- DELETE FROM appointments WHERE booking_reference ~* '^(FIXBK|TXFAILBK|BK-LC)';",
        "-- DELETE FROM vehicles WHERE vehicle_number ~* '^(FIX|TEST|TMP|TXFAIL|LC-|TBD-|APXI)';",
        "-- UPDATE vehicles SET current_zone_id = NULL WHERE vehicle_number !~ '^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$' OR vehicle_number NOT IN (demo plates);",
        "-- DELETE FROM docks WHERE dock_name = 'Demo Dock' AND notes IS NULL;",
        "-- API alternative: no bulk delete endpoints — use admin DB migration script with FK order",
    ]


async def main() -> None:
    print("=== DEMO DATA CLEANUP AUDIT ===\n")

    api: dict[str, Any] = {}
    ops, yard, alerts, detention_api = {}, {}, [], {}
    try:
        api = {
            "vehicles": list_api("/vehicles?limit=500"),
            "appointments": list_api("/appointments?limit=500"),
            "queue_entries": list_api("/queue-entries?limit=500"),
            "docks": list_api("/docks"),
            "labor": list_api("/labor"),
            "equipment": list_api("/equipment"),
            "events": list_api("/yard-events?limit=300"),
            "zones": list_api("/yard/zones?limit=500"),
            "exceptions": list_api("/loading-operations/exceptions"),
        }
        ops = req("GET", "/reports/operations-dashboard")
        yard = req("GET", "/yard/dashboard")
        alerts_resp = req("GET", "/control-tower/alerts")
        alerts = alerts_resp.get("activeAlerts") or []
        detention_api = req("GET", "/detention")
    except Exception as exc:
        print(f"API unavailable ({exc}) — using database only for entity inventory\n")

    db = await fetch_db_inventory()
    if not yard and db.get("yard_zones"):
        cap = sum(int(z.get("max_capacity") or 0) for z in db["yard_zones"])
        occ = db.get("_zone_occupancy") or 0
        yard = {
            "totalCapacity": cap,
            "currentOccupancy": occ,
            "yardUtilizationPct": round((occ / cap) * 100, 1) if cap else 0,
        }
    if not ops and db.get("vehicles"):
        in_yard_s = {
            "ARRIVED", "WAITING", "CHECKED_IN", "CALLED", "DOCK_ASSIGNED",
            "RESOURCE_PENDING", "READY_FOR_LOADING", "LOADING", "EXIT_HOLDING", "EXIT_VERIFIED",
        }
        vs = db["vehicles"]
        ops = {
            "vehiclesInYard": sum(1 for v in vs if v.get("status") in in_yard_s),
            "vehiclesWaiting": sum(1 for v in vs if v.get("status") in {"WAITING", "CHECKED_IN"}),
            "vehiclesLoading": sum(1 for v in vs if v.get("status") in {"LOADING", "READY_FOR_LOADING"}),
            "vehiclesInExitHolding": sum(1 for v in vs if v.get("status") in {"EXIT_HOLDING", "EXIT_VERIFIED"}),
            "appointmentsToday": len(db.get("appointments") or []),
            "source": "derived_from_db",
        }
    inventory, entities = build_inventory(db, api)

    if not alerts and db.get("vehicles"):
        alerts = _derive_alert_candidates(db, entities)
        for a in alerts:
            a["should_remove"] = not a.get("is_demo")
            a["reason"] = "Legacy/test" if a["should_remove"] else "Demo scenario"
    orphans = orphan_report(entities)
    demo_val = demo_validation(entities["vehicles"])
    pollution = kpi_pollution(entities, ops, yard, alerts)
    plan = cleanup_plan(entities, pollution)
    projection = post_cleanup_projection(ops, yard, demo_val["demo_vehicle_count"], pollution)
    sql_hints = sql_cleanup_snippets(plan, entities)

    score = 72
    if demo_val["demo_vehicle_count"] == 20:
        score += 10
    if all(demo_val["gaps"].get(k, 0) == 0 for k in EXPECTED_STATUS_ACTUAL):
        score += 8
    if pollution["pollution_summary"]["non_demo_in_yard"] > 5:
        score -= 15
    if len([a for a in pollution["alert_pollution"] if a["should_remove"]]) > 5:
        score -= 10
    score = max(0, min(100, score))

    report = {
        "audit_timestamp": datetime.now(timezone.utc).isoformat(),
        "phase1_inventory": inventory,
        "phase2_orphans": orphans,
        "phase3_demo_validation": demo_val,
        "phase4_kpi_pollution": pollution,
        "phase5_alert_pollution": [a for a in pollution["alert_pollution"]],
        "phase6_cleanup_plan": plan,
        "phase7_post_cleanup_projection": projection,
        "sql_cleanup_hints": sql_hints,
        "demo_readiness_score": score,
    }

    out_path = os.path.join(os.path.dirname(__file__), "demo_cleanup_audit_report.json")
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, default=str)

    print(json.dumps(report, indent=2, default=str))
    print(f"\nReport saved: {out_path}")
    print(f"\nDemo Readiness Score: {score}/100")


if __name__ == "__main__":
    asyncio.run(main())
