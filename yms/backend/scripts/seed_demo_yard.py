"""
Seed Smart Yard with realistic demo data for all operator modules.

Uses workflow APIs only (no lifecycle logic changes). Idempotent on DEMO-* plates.
Run: python scripts/seed_demo_yard.py
Env: API_BASE (default http://localhost:8001/api), DATABASE_URL (optional, for detention backdate)
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import time
import urllib.error
import urllib.request
from collections import Counter
from datetime import date, datetime, timezone
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE = os.environ.get("API_BASE", "http://localhost:8001/api").rstrip("/")
HEADERS = {"Content-Type": "application/json", "X-YMS-Role": "admin", "X-YMS-User": "demo-seed"}

TODAY = date.today()
NOW = datetime.now(timezone.utc)

# 20 appointments across lifecycle (vehicle status = operational truth)
STATUS_PLAN: list[tuple[str, int]] = [
    ("ARRIVED", 2),
    ("WAITING", 3),
    ("CALLED", 3),
    ("DOCK_ASSIGNED", 2),
    ("RESOURCE_PENDING", 2),
    ("READY_FOR_LOADING", 2),
    ("LOADING", 3),
    ("EXIT_HOLDING", 2),
    ("EXIT_VERIFIED", 1),
]

CARGO_PROFILES = [
    ("General Cargo", "GENERAL", "Loading"),
    ("Electronics", "GENERAL", "Loading"),
    ("FMCG", "BAGS", "Loading"),
    ("Pharma", "PHARMA", "Unloading"),
    ("Cold Chain", "COLD_CHAIN", "Loading"),
    ("Hazardous", "HAZMAT", "Loading"),
]

VEHICLE_TYPES = ["Truck", "Container", "Trailer", "Tanker"]
PLATES = [
    "MH12DE1001", "GJ01AB1002", "KA05CD1003", "DL01EF1004", "TN09GH1005",
    "HR26IJ1006", "RJ14KL1007", "UP32MN1008", "WB19OP1009", "PB10QR1010",
    "MH14ST1011", "GJ05UV1012", "KA03WX1013", "DL09YZ1014", "TN07AA1015",
    "MH22BB1016", "GJ11CC1017", "KA15DD1018", "DL03EE1019", "WB25FF1020",
]

TRANSPORTERS = [
    "BlueLine Logistics", "Swift Haul India", "National Freight Co",
    "Prime Movers Ltd", "Eastern Carriers", "West Coast Transport",
]

DOCK_SPECS = [
    ("General Loading A", "LOADING", "Zone A", ["GENERAL", "BAGS"], 90),
    ("General Loading B", "LOADING", "Zone A", ["GENERAL", "STEEL"], 75),
    ("General Loading C", "MIXED", "Zone B", ["GENERAL", "PALLETS"], 60),
    ("General Loading D", "LOADING", "Zone B", ["GENERAL"], 90),
    ("Cold Chain A", "COLD_CHAIN", "Zone E", ["COLD_CHAIN", "PHARMA"], 120),
    ("Cold Chain B", "COLD_CHAIN", "Zone E", ["PHARMA", "COLD_CHAIN"], 100),
    ("Cold Chain C", "COLD_CHAIN", "Zone E", ["PHARMA"], 110),
    ("Hazmat A", "HAZMAT", "Zone D", ["HAZMAT", "CHEMICALS"], 150),
    ("Hazmat B", "HAZMAT", "Zone D", ["HAZMAT"], 140),
    ("Hazmat C", "HAZMAT", "Zone D", ["CHEMICALS", "HAZMAT"], 130),
]

LABOR_SPECS = [
    "Team Alpha", "Team Bravo", "Team Charlie", "Team Delta", "Team Echo",
]

EQUIPMENT_SPECS = [
    ("Forklift A", "FORKLIFT", "IDLE"),
    ("Forklift B", "FORKLIFT", "IDLE"),
    ("Forklift C", "FORKLIFT", "IDLE"),
    ("Reach Stacker 1", "REACH_STACKER", "IDLE"),
    ("Reach Stacker 2", "REACH_STACKER", "IDLE"),
    ("Crane 1", "CRANE", "IDLE"),
    ("Pallet Jack 1", "PALLET_JACK", "IDLE"),
    ("Pallet Jack 2", "PALLET_JACK", "IDLE"),
]

STATUS_RANK = {
    "SCHEDULED": 0,
    "ARRIVED": 1,
    "CHECKED_IN": 2,
    "WAITING": 3,
    "CALLED": 4,
    "DOCK_ASSIGNED": 5,
    "RESOURCE_PENDING": 6,
    "READY_FOR_LOADING": 7,
    "LOADING": 8,
    "COMPLETED": 9,
    "EXIT_HOLDING": 10,
    "EXIT_VERIFIED": 11,
    "EXITED": 12,
}

created: dict[str, list[dict[str, Any]]] = {
    "vehicles": [],
    "appointments": [],
    "queues": [],
    "docks": [],
    "labor": [],
    "equipment": [],
    "exceptions": [],
}


def req(method: str, path: str, body: dict | None = None) -> Any:
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(url, data=data, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(request, timeout=120) as res:
            raw = res.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode()
        raise RuntimeError(f"{method} {path} -> HTTP {exc.code}: {detail}") from exc


def list_all(path: str) -> list[dict]:
    data = req("GET", path)
    if isinstance(data, list):
        return data
    if isinstance(data, dict) and "items" in data:
        return data["items"]
    return []


def find_vehicle(plate: str) -> dict | None:
    for v in list_all("/vehicles?limit=500"):
        if v.get("vehicle_number") == plate:
            return v
    return None


SEED_DOCK_NAMES = {f"Demo {name}" for name, *_ in DOCK_SPECS}


def is_seed_demo_dock(dock: dict) -> bool:
    name = dock.get("dock_name") or ""
    if name in SEED_DOCK_NAMES:
        return True
    return name.startswith("Demo ") and (dock.get("notes") or "") == "Demo seed dock"


def ensure_docks() -> list[dict]:
    existing = list_all("/docks")
    demo_docks = [d for d in existing if is_seed_demo_dock(d)]
    if len(demo_docks) >= 10:
        created["docks"] = demo_docks[:10]
        return demo_docks[:10]

    docks = list(demo_docks)
    for idx, (name, dtype, zone, cargo, svc_min) in enumerate(DOCK_SPECS):
        if len(docks) >= 10:
            break
        label = f"Demo {name}"
        if any(d.get("dock_name") == label for d in existing):
            continue
        row = req(
            "POST",
            "/docks",
            {
                "dock_name": label,
                "dock_type": dtype,
                "zone": zone,
                "supported_vehicle_types": ["TRUCK", "TRAILER", "CONTAINER", "TANKER"],
                "supported_cargo_types": cargo,
                "max_capacity": 2 if idx % 3 == 0 else 1,
                "status": "AVAILABLE",
                "estimated_service_time_min": svc_min,
                "notes": "Demo seed dock",
                "created_by": "demo-seed",
            },
        )
        docks.append(row)
    created["docks"] = docks[:10]
    return docks[:10]


def ensure_labor() -> list[dict]:
    existing = list_all("/labor")
    demo = [t for t in existing if (t.get("team_name") or "") in LABOR_SPECS]
    if len(demo) >= 5:
        created["labor"] = demo[:5]
        return demo[:5]

    teams = list(demo)
    for name in LABOR_SPECS:
        if any(t.get("team_name") == name for t in existing):
            continue
        row = req(
            "POST",
            "/labor",
            {
                "team_name": name,
                "shift_start": "06:00",
                "shift_end": "18:00",
                "members_count": 6,
                "status": "ON_DUTY",
                "supervisor_name": f"{name} Lead",
                "supervisor_phone": "+91-9800000001",
                "material_type": "GENERAL",
                "notes": "Demo seed team",
                "created_by": "demo-seed",
            },
        )
        teams.append(row)
    created["labor"] = teams[:5]
    return teams[:5]


def ensure_equipment() -> list[dict]:
    existing = list_all("/equipment")
    demo = [e for e in existing if (e.get("equipment_name") or "") in {s[0] for s in EQUIPMENT_SPECS}]
    if len(demo) >= 8:
        created["equipment"] = demo[:8]
        return demo[:8]

    assets = list(demo)
    for name, etype, status in EQUIPMENT_SPECS:
        if any(e.get("equipment_name") == name for e in existing):
            continue
        row = req(
            "POST",
            "/equipment",
            {
                "equipment_name": name,
                "equipment_type": etype,
                "model": "Demo Model",
                "status": status,
                "battery_level": 85,
                "current_location": "Yard equipment bay",
                "notes": "Demo seed asset",
                "created_by": "demo-seed",
            },
        )
        assets.append(row)
    created["equipment"] = assets[:8]
    return assets[:8]


def refresh_demo_docks() -> list[dict]:
    docks = list_all("/docks")
    demo = [d for d in docks if is_seed_demo_dock(d)]
    created["docks"] = demo[:10] if demo else created.get("docks", [])
    return created["docks"]


def _available_docks(cargo_types: list[str], *, demo_only: bool) -> list[dict]:
    docks = refresh_demo_docks() if demo_only else list_all("/docks")
    out: list[dict] = []
    for dock in docks:
        if dock.get("status") != "AVAILABLE" or dock.get("current_vehicle_id"):
            continue
        supported = set(dock.get("supported_cargo_types") or [])
        if cargo_types and supported and not supported.intersection(cargo_types):
            continue
        out.append(dock)
    return out


def assign_dock_for_queue(queue_id: str, cargo_types: list[str]) -> dict:
    """Try demo docks first, then any yard dock with capacity."""
    last_err: Exception | None = None
    cargo_passes = [cargo_types, []] if cargo_types else [[]]
    for demo_only in (True, False):
        for cargo in cargo_passes:
            docks = _available_docks(cargo, demo_only=demo_only)
            if not docks and not demo_only:
                docks = [
                    d for d in list_all("/docks")
                    if d.get("status") == "AVAILABLE" and not d.get("current_vehicle_id")
                ]
            for dock in docks:
                try:
                    req(
                        "POST",
                        f"/flow/queue-entries/{queue_id}/assign-dock",
                        {"dock_id": dock["id"], "created_by": "demo-seed"},
                    )
                    return dock
                except RuntimeError as exc:
                    last_err = exc
    raise RuntimeError(f"No dock accepted assignment: {last_err}")


def get_queue(vehicle_id: str) -> dict | None:
    for q in list_all("/queue-entries?limit=500"):
        if str(q.get("vehicle_id")) == str(vehicle_id):
            return q
    return None


def pick_available_labor(labor_pool: list[dict]) -> dict:
    by_name = {t.get("team_name"): t for t in list_all("/labor") if t.get("team_name") in LABOR_SPECS}
    for name in LABOR_SPECS:
        team = by_name.get(name)
        if team and not team.get("assigned_dock_id"):
            return team
    for name in LABOR_SPECS:
        team = by_name.get(name)
        if team and team.get("status") in {"ON_DUTY", "AVAILABLE"}:
            return team
    return labor_pool[0]


def pick_available_equipment(equip_pool: list[dict]) -> dict:
    by_name = {e.get("equipment_name"): e for e in list_all("/equipment") if e.get("equipment_name") in {s[0] for s in EQUIPMENT_SPECS}}
    for name, _, _ in EQUIPMENT_SPECS:
        asset = by_name.get(name)
        if asset and asset.get("status") == "IDLE" and not asset.get("assigned_dock_id"):
            return asset
    for name, _, _ in EQUIPMENT_SPECS:
        asset = by_name.get(name)
        if asset and asset.get("status") in {"IDLE", "ASSIGNED"}:
            return asset
    return equip_pool[0]


def wait_until_ready(plate: str, attempts: int = 20) -> dict | None:
    for _ in range(attempts):
        vehicle = find_vehicle(plate)
        if vehicle and vehicle.get("status") == "READY_FOR_LOADING":
            return vehicle
        time.sleep(0.15)
    return find_vehicle(plate)


def assign_resources_for_loading(dock_id: str, labor: dict, equipment: dict) -> None:
    labor = pick_available_labor([labor])
    equipment = pick_available_equipment([equipment])
    req(
        "POST",
        f"/docks/{dock_id}/assign-labor",
        {"labor_id": labor["id"], "created_by": "demo-seed"},
    )
    try:
        req(
            "POST",
            f"/docks/{dock_id}/assign-equipment",
            {"equipment_id": equipment["id"], "set_in_use": True, "created_by": "demo-seed"},
        )
    except RuntimeError:
        pass


def complete_exit_checklist(vehicle_id: str) -> None:
    req(
        "PATCH",
        f"/gate/vehicles/{vehicle_id}/exit-checklist",
        {
            "gate_id": "G1",
            "loading_completed_verified": True,
            "appointment_completed_verified": True,
            "vehicle_verified": True,
            "delivery_document_verified": True,
            "gate_pass_approved": True,
            "invoice_approved": True,
            "security_cleared": True,
        },
    )


def advance_vehicle(
    plate: str,
    target: str,
    cargo: tuple[str, str, str],
    dock_pool: list[dict],
    labor_pool: list[dict],
    equip_pool: list[dict],
    labor_idx: list[int],
    equip_idx: list[int],
) -> dict[str, Any]:
    material_label, material_code, op_type = cargo
    vehicle = find_vehicle(plate)
    if not vehicle:
        vtype = VEHICLE_TYPES[(int(plate[-2:]) - 1) % len(VEHICLE_TYPES)]
        vehicle = req(
            "POST",
            "/vehicles",
            {
                "vehicle_number": plate,
                "vehicle_type": vtype,
                "ownership_type": ["company", "contract", "outside"][int(plate[-1]) % 3],
                "transporter_name": TRANSPORTERS[int(plate[-2:]) % len(TRANSPORTERS)],
                "driver_name": f"Driver {plate[-4:]}",
                "driver_phone": "+91-9876500000",
                "status": "SCHEDULED",
                "operation_type": op_type,
                "material_type": material_code,
                "registration_source": "appointment",
            },
        )
        created["vehicles"].append(vehicle)

    vid = vehicle["id"]
    appt = next(
        (a for a in list_all("/appointments?limit=500") if str(a.get("vehicle_id")) == str(vid)),
        None,
    )
    if not appt:
        slot = f"{6 + (int(plate[-2:]) % 12):02d}:00"
        appt = req(
            "POST",
            "/appointments",
            {
                "booking_reference": f"DEMO-APT-{plate[-4:]}",
                "vehicle_id": vid,
                "customer_name": "Demo Operations",
                "shipment_reference": f"{op_type}|{material_label}|Hub",
                "booking_date": TODAY.isoformat(),
                "reporting_time": NOW.isoformat(),
                "scheduled_slot": slot,
                "gate_number": ["G1", "G2", "G3"][int(plate[-1]) % 3],
                "priority": 50 if material_code == "HAZMAT" else 0,
                "status": "SCHEDULED",
                "remarks": f"Demo seed | {material_label}",
                "created_by": "demo-seed",
            },
        )
        created["appointments"].append(appt)

    vehicle = find_vehicle(plate) or vehicle
    status = vehicle.get("status", "SCHEDULED")

    if target != "SCHEDULED" and status == "SCHEDULED":
        try:
            req("POST", f"/gate/vehicles/{vid}/arrived", {"gate_id": "G1", "created_by": "demo-seed"})
        except RuntimeError as exc:
            if "ZONE_CAPACITY" not in str(exc):
                raise
        vehicle = find_vehicle(plate) or vehicle
        status = vehicle.get("status")

    if target == "ARRIVED":
        return vehicle

    if status in {"SCHEDULED", "ARRIVED"} and STATUS_RANK.get(target, 0) >= STATUS_RANK["WAITING"]:
        try:
            req(
                "POST",
                f"/gate/vehicles/{vid}/approve-entry",
                {
                    "gate_id": "G1",
                    "created_by": "demo-seed",
                    "queue_number": f"DEMO-Q{plate[-4:]}",
                    "queue_type": op_type,
                },
            )
        except RuntimeError as exc:
            if "already checked in" not in str(exc).lower():
                raise
        vehicle = find_vehicle(plate) or vehicle
        status = vehicle.get("status")

    if target == "WAITING":
        q = get_queue(vid)
        if q:
            created["queues"].append(q)
        return vehicle

    queue = get_queue(vid)
    if not queue:
        raise RuntimeError(f"No queue for {plate}")

    if target in {"CALLED", "DOCK_ASSIGNED", "RESOURCE_PENDING", "READY_FOR_LOADING", "LOADING", "EXIT_HOLDING", "EXIT_VERIFIED"}:
        if queue.get("status") in {"WAITING", "CHECKED_IN"}:
            req("POST", f"/flow/queue-entries/{queue['id']}/call", {})
            queue = get_queue(vid) or queue

    if target == "CALLED":
        return find_vehicle(plate) or vehicle

    cargo_types = [material_code] if material_code != "GENERAL" else ["GENERAL", "BAGS"]
    dock = None
    if target in {"DOCK_ASSIGNED", "RESOURCE_PENDING", "READY_FOR_LOADING", "LOADING", "EXIT_HOLDING", "EXIT_VERIFIED"}:
        vehicle = find_vehicle(plate) or vehicle
        queue = get_queue(vid) or queue
        if queue.get("status") == "CALLED":
            dock = assign_dock_for_queue(queue["id"], cargo_types)
        elif queue.get("dock_id"):
            dock = next((d for d in refresh_demo_docks() if str(d["id"]) == str(queue["dock_id"])), None)

    vehicle = find_vehicle(plate) or vehicle
    if target == "DOCK_ASSIGNED":
        return vehicle

    if target in {"RESOURCE_PENDING", "READY_FOR_LOADING", "LOADING", "EXIT_HOLDING", "EXIT_VERIFIED"}:
        li = labor_idx[0] % len(labor_pool)
        ei = equip_idx[0] % len(equip_pool)
        labor_idx[0] += 1
        equip_idx[0] += 1
        queue = get_queue(vid) or queue
        dock_id = str(queue.get("dock_id") or (dock["id"] if dock else ""))
        if target in {"READY_FOR_LOADING", "LOADING", "EXIT_HOLDING", "EXIT_VERIFIED"}:
            assign_resources_for_loading(dock_id, labor_pool[li], equip_pool[ei])

    vehicle = find_vehicle(plate) or vehicle
    if target == "RESOURCE_PENDING":
        return vehicle

    if target in {"LOADING", "EXIT_HOLDING", "EXIT_VERIFIED"}:
        vehicle = wait_until_ready(plate) or find_vehicle(plate) or vehicle
        if vehicle.get("status") != "READY_FOR_LOADING":
            raise RuntimeError(
                f"{plate} not READY_FOR_LOADING before loading (status={vehicle.get('status')})"
            )
        req(
            "POST",
            f"/flow/vehicles/{vid}/transition",
            {"status": "LOADING", "created_by": "demo-seed", "event_note": "Demo loading started"},
        )

    vehicle = find_vehicle(plate) or vehicle
    if target == "READY_FOR_LOADING":
        return vehicle

    if target in {"EXIT_HOLDING", "EXIT_VERIFIED"}:
        req(
            "POST",
            f"/flow/vehicles/{vid}/transition",
            {"status": "COMPLETED", "created_by": "demo-seed", "event_note": "Demo loading completed"},
        )

    vehicle = find_vehicle(plate) or vehicle
    if target == "EXIT_HOLDING":
        return vehicle

    if target == "EXIT_VERIFIED":
        complete_exit_checklist(vid)
        req(
            "POST",
            f"/gate/vehicles/{vid}/verify-exit",
            {"gate_id": "G1", "created_by": "demo-seed", "remarks": "Demo exit verified"},
        )

    return find_vehicle(plate) or vehicle


def seed_loading_exceptions(loading_vehicles: list[dict]) -> None:
    if len(loading_vehicles) < 3:
        return
    existing_types = {
        e.get("exception_type")
        for e in list_all("/loading-operations/exceptions")
        if e.get("status") == "OPEN"
    }
    specs = [
        ("MATERIAL_SHORTAGE", "Pallet shortage on lane — awaiting replenishment"),
        ("LABOR_DELAY", "Assigned team delayed — shift handover running late"),
        ("EQUIPMENT_FAILURE", "Forklift hydraulic fault — maintenance dispatched"),
    ]
    for veh, (exc_type, desc) in zip(loading_vehicles[:3], specs):
        if exc_type in existing_types:
            continue
        vid = veh["id"]
        appt = next(
            (a for a in list_all("/appointments?limit=500") if str(a.get("vehicle_id")) == str(vid)),
            None,
        )
        queue = get_queue(vid)
        try:
            row = req(
                "POST",
                "/loading-operations/exceptions",
                {
                    "vehicle_id": vid,
                    "appointment_id": appt["id"] if appt else None,
                    "queue_entry_id": queue["id"] if queue else None,
                    "dock_id": queue.get("dock_id") if queue else None,
                    "exception_type": exc_type,
                    "description": desc,
                    "created_by": "demo-seed",
                },
            )
            created["exceptions"].append(row)
        except RuntimeError as exc:
            print(f"  [warn] exception {exc_type}: {exc}", file=sys.stderr)


async def reset_demo_fleet() -> None:
    """Reset demo plates and infrastructure so lifecycle seeding is repeatable."""
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("  [warn] DATABASE_URL not set — skipping demo fleet reset")
        return
    from db import init_db, get_pool

    await init_db()
    pool = get_pool()
    equip_names = [s[0] for s in EQUIPMENT_SPECS]
    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute(
                """
                DELETE FROM queue_entries
                WHERE vehicle_id IN (
                    SELECT id FROM vehicles WHERE vehicle_number = ANY($1::text[])
                )
                """,
                PLATES,
            )
            await conn.execute(
                """
                UPDATE vehicles
                SET current_zone_id = NULL
                WHERE vehicle_number = ANY($1::text[])
                """,
                PLATES,
            )
            await conn.execute(
                """
                UPDATE vehicles v
                SET current_zone_id = staging.id
                FROM yard_zones gate_in
                JOIN yard_zones staging ON staging.zone_code = 'ZN-F'
                WHERE v.current_zone_id = gate_in.id
                  AND gate_in.zone_code = 'ZN-GATE-IN'
                  AND v.vehicle_number <> ALL($1::text[])
                """,
                PLATES,
            )
            await conn.execute(
                """
                UPDATE vehicles
                SET status = 'SCHEDULED',
                    exit_holding_at = NULL,
                    updated_at = NOW()
                WHERE vehicle_number = ANY($1::text[])
                """,
                PLATES,
            )
            await conn.execute(
                """
                UPDATE appointments
                SET status = 'SCHEDULED', updated_at = NOW()
                WHERE booking_reference LIKE 'DEMO-APT-%'
                """,
            )
            await conn.execute(
                """
                UPDATE docks
                SET status = 'AVAILABLE',
                    current_vehicle_id = NULL,
                    assigned_since = NULL,
                    updated_at = NOW()
                WHERE dock_name = ANY($1::text[])
                   OR notes = 'Demo seed dock'
                """,
                list(SEED_DOCK_NAMES),
            )
            await conn.execute(
                """
                UPDATE labor_teams
                SET status = 'ON_DUTY',
                    assigned_dock_id = NULL,
                    assigned_vehicle_id = NULL,
                    assigned_queue_entry_id = NULL,
                    assigned_appointment_id = NULL,
                    assigned_count = 0,
                    available_count = members_count,
                    assigned_since = NULL,
                    updated_at = NOW()
                WHERE team_name = ANY($1::text[])
                """,
                LABOR_SPECS,
            )
            await conn.execute(
                """
                UPDATE equipment
                SET status = 'IDLE',
                    assigned_dock_id = NULL,
                    assigned_vehicle_id = NULL,
                    assigned_queue_entry_id = NULL,
                    updated_at = NOW()
                WHERE equipment_name = ANY($1::text[])
                """,
                equip_names,
            )


async def backdate_waiting_checkins() -> None:
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        return
    try:
        from db import get_pool, init_db

        await init_db()
        pool = get_pool()
        async with pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE queue_entries q
                SET checkin_time = NOW() - INTERVAL '3 hours',
                    updated_at = NOW()
                FROM vehicles v
                WHERE q.vehicle_id = v.id
                  AND v.vehicle_number = ANY($1::text[])
                  AND q.status = 'WAITING'
                """,
                PLATES,
            )
    except Exception as exc:
        print(f"  [warn] detention backdate skipped: {exc}", file=sys.stderr)


def validate_and_report() -> dict[str, Any]:
    vehicles = list_all("/vehicles?limit=500")
    plate_set = set(PLATES)
    demo_vehicles = [v for v in vehicles if v.get("vehicle_number") in plate_set]

    appointments = [a for a in list_all("/appointments?limit=500") if str(a.get("booking_reference", "")).startswith("DEMO-APT")]
    docks = refresh_demo_docks() or created["docks"] or list_all("/docks")
    labor = [t for t in list_all("/labor") if t.get("team_name") in LABOR_SPECS]
    equipment = [
        e for e in list_all("/equipment")
        if e.get("equipment_name") in {s[0] for s in EQUIPMENT_SPECS}
    ]
    queues = list_all("/queue-entries?limit=500")

    status_counts = Counter(v.get("status") for v in demo_vehicles)
    dock_occupied = sum(1 for d in docks if d.get("status") == "OCCUPIED" or d.get("current_vehicle_id"))
    dock_available = sum(1 for d in docks if d.get("status") == "AVAILABLE" and not d.get("current_vehicle_id"))

    loading_vehs = [v for v in demo_vehicles if v.get("status") == "LOADING"]
    alerts = req("GET", "/control-tower/alerts")
    ops = req("GET", "/reports/operations-dashboard")
    yard = req("GET", "/yard/dashboard")
    zones = list_all("/yard/zones?limit=500")
    detention = req("GET", "/detention")
    try:
        delay_analysis = req("GET", "/reports/delay-analysis")
    except RuntimeError:
        delay_analysis = {}
    demo_exceptions = list_all("/loading-operations/exceptions?active_only=true")
    demo_exceptions = [
        e for e in demo_exceptions
        if (e.get("vehicle_id") and any(
            str(e.get("vehicle_id")) == str(v.get("id")) for v in demo_vehicles
        ))
    ]

    labor_assigned = [
        t for t in labor
        if t.get("team_name") in LABOR_SPECS
        and (t.get("status") == "ASSIGNED" or t.get("assigned_dock_id"))
    ]
    equip_assigned = [
        e for e in equipment
        if e.get("equipment_name") in {s[0] for s in EQUIPMENT_SPECS}
        and e.get("status") in {"ASSIGNED", "IN_USE"}
    ]

    report = {
        "vehicles_seeded": len(demo_vehicles),
        "appointments_seeded": len(appointments),
        "status_distribution": dict(status_counts),
        "docks": {"total": len(docks), "occupied": dock_occupied, "available": dock_available},
        "labor_assigned": len(labor_assigned),
        "equipment_active": len(equip_assigned),
        "loading_operations": len(loading_vehs),
        "active_alerts": alerts.get("activeAlerts", []),
        "alert_counts": {"critical": alerts.get("criticalCount"), "warning": alerts.get("warningCount")},
        "operations_dashboard": ops,
        "yard_dashboard": yard,
        "zone_occupancy_total": sum(z.get("currentOccupancy") or 0 for z in zones),
        "detention_summary": detention.get("summary") if isinstance(detention, dict) else detention,
        "delay_analysis": delay_analysis,
        "demo_exceptions_open": demo_exceptions,
    }
    return report


def main() -> None:
    print("=== Smart Yard Demo Seed ===\n")
    print(f"API: {BASE}\n")

    print("0. Reset demo fleet (DATABASE_URL)...")
    asyncio.run(reset_demo_fleet())

    print("1. Infrastructure (docks, labor, equipment)...")
    docks = ensure_docks()
    labor = ensure_labor()
    equipment = ensure_equipment()
    print(f"   Docks: {len(docks)}, Labor: {len(labor)}, Equipment: {len(equipment)}")

    print("2. Lifecycle scenarios (20 appointments)...")
    labor_idx = [0]
    equip_idx = [0]
    idx = 0
    loading_for_exceptions: list[dict] = []
    targets_flat: list[str] = []
    for target, count in STATUS_PLAN:
        targets_flat.extend([target] * count)

    # Exit paths first (while docks/labor are free), then dock-heavy states.
    process_order = list(range(8)) + [17, 18, 19] + list(range(8, 17))

    def run_scenario(pass_label: str) -> None:
        nonlocal idx
        for ord_idx in process_order:
            idx = ord_idx
            target = targets_flat[idx]
            plate = PLATES[idx]
            cargo = CARGO_PROFILES[idx % len(CARGO_PROFILES)]
            existing = find_vehicle(plate)
            current = existing.get("status") if existing else "SCHEDULED"
            cur_rank = STATUS_RANK.get(current, -1)
            tgt_rank = STATUS_RANK.get(target, 99)
            if (
                pass_label == "initial"
                and cur_rank >= tgt_rank
                and current not in {"SCHEDULED"}
                and not (current == "EXIT_HOLDING" and target == "EXIT_VERIFIED")
            ):
                print(f"   [{idx + 1}/20] {plate} skip (already {current})")
            else:
                print(f"   [{pass_label} {idx + 1}/20] {plate} -> {target} ({cargo[0]}) from {current}")
                try:
                    veh = advance_vehicle(plate, target, cargo, docks, labor, equipment, labor_idx, equip_idx)
                    if target == "LOADING":
                        loading_for_exceptions.append(veh)
                except RuntimeError as exc:
                    print(f"      [error] {exc}", file=sys.stderr)

    run_scenario("initial")
    for retry in range(1, 4):
        pending = [
            i for i, target in enumerate(targets_flat)
            if (v := find_vehicle(PLATES[i]))
            and (
                STATUS_RANK.get(v.get("status"), -1) < STATUS_RANK.get(target, 99)
                or (v.get("status") == "EXIT_HOLDING" and target == "EXIT_VERIFIED")
            )
        ]
        if not pending:
            break
        print(f"   Retry {retry}: {len(pending)} vehicles below target...")
        for i in sorted(pending, key=lambda n: (0 if targets_flat[n] in {"EXIT_HOLDING", "EXIT_VERIFIED"} and find_vehicle(PLATES[n]) and find_vehicle(PLATES[n]).get("status") in {"RESOURCE_PENDING", "READY_FOR_LOADING", "LOADING"} else 1, n)):
            plate = PLATES[i]
            target = targets_flat[i]
            cargo = CARGO_PROFILES[i % len(CARGO_PROFILES)]
            current = find_vehicle(plate).get("status")
            print(f"   [retry {plate}] -> {target} from {current}")
            try:
                advance_vehicle(plate, target, cargo, docks, labor, equipment, labor_idx, equip_idx)
            except RuntimeError as exc:
                print(f"      [error] {exc}", file=sys.stderr)

    print("3. Loading exceptions (Control Tower)...")
    loading_for_exceptions = [
        v for p in PLATES
        if (v := find_vehicle(p)) and v.get("status") == "LOADING"
    ]
    seed_loading_exceptions(loading_for_exceptions)

    print("4. Detention backdate (WAITING check-ins)...")
    asyncio.run(backdate_waiting_checkins())

    print("5. Validation report...\n")
    report = validate_and_report()
    print(json.dumps(report, indent=2, default=str))

    out_path = os.path.join(os.path.dirname(__file__), "seed_demo_report.json")
    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(report, fh, indent=2, default=str)
    print(f"\nReport saved: {out_path}")
    print("\n=== Demo seed complete ===")


if __name__ == "__main__":
    main()
