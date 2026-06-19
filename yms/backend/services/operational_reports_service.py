"""Operational reports — dock, labor, equipment, delay, SLA (live YMS data)."""

from __future__ import annotations

from collections import defaultdict
from datetime import date
from typing import Any

from services.loading_exceptions_service import compute_pause_state, list_loading_exceptions
from services.reporting_common import (
    REPORT_SLA,
    avg,
    coerce_datetime,
    date_of,
    event_in_range,
    filter_events_by_range,
    journey_milestone_times,
    material_type_from_appointment,
    minutes_between,
    pct,
)
from services.equipment_service import list_equipment
from services.labor_service import list_labor_teams
from services.yms_service import (
    list_appointments,
    list_docks,
    list_queue_entries,
    list_vehicles,
    list_yard_events,
)


def _index_by_vehicle(queues: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    by_vehicle: dict[str, dict[str, Any]] = {}
    for queue in queues:
        vid = queue.get("vehicle_id")
        if vid:
            by_vehicle[str(vid)] = queue
    return by_vehicle


def _index_appointments_by_vehicle(appointments: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    by_vehicle: dict[str, dict[str, Any]] = {}
    for appt in appointments:
        vid = appt.get("vehicle_id")
        if vid:
            by_vehicle[str(vid)] = appt
    return by_vehicle


def _vehicle_events_map(events: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    by_vehicle: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for event in events:
        vid = event.get("vehicle_id")
        if vid:
            by_vehicle[str(vid)].append(event)
    for rows in by_vehicle.values():
        rows.sort(key=lambda e: coerce_datetime(e.get("event_time")) or coerce_datetime("1970-01-01"))
    return by_vehicle


def _dock_visit_sessions(
    events: list[dict[str, Any]],
    date_from: date | None,
    date_to: date | None,
) -> list[dict[str, Any]]:
    """Derive dock occupancy sessions from DOCK_ASSIGNED → LOADING_COMPLETED/DOCK_RELEASED."""
    sessions: list[dict[str, Any]] = []
    open_by_vehicle: dict[str, dict[str, Any]] = {}

    for event in sorted(events, key=lambda e: coerce_datetime(e.get("event_time")) or coerce_datetime("1970-01-01")):
        if not event_in_range(event, date_from, date_to):
            continue
        et = event.get("event_type")
        vid = str(event.get("vehicle_id") or "")
        if not vid:
            continue
        if et in {"DOCK_ASSIGNED", "DOCK_REASSIGNED"}:
            open_by_vehicle[vid] = {
                "vehicleId": vid,
                "dockId": str(event.get("dock_id") or ""),
                "startedAt": event.get("event_time"),
            }
        elif et in {"LOADING_COMPLETED", "DOCK_RELEASED"} and vid in open_by_vehicle:
            session = open_by_vehicle.pop(vid)
            session["endedAt"] = event.get("event_time")
            sessions.append(session)
    return sessions


def compute_dock_utilization_report(
    *,
    docks: list[dict[str, Any]],
    events: list[dict[str, Any]],
    queues_by_vehicle: dict[str, dict[str, Any]],
    events_by_vehicle: dict[str, list[dict[str, Any]]],
    date_from: date | None = None,
    date_to: date | None = None,
    zone: str | None = None,
    dock_id: str | None = None,
) -> dict[str, Any]:
    sessions = _dock_visit_sessions(events, date_from, date_to)
    dock_map = {str(d["id"]): d for d in docks}
    rows: list[dict[str, Any]] = []

    for dock in docks:
        did = str(dock["id"])
        if dock_id and did != dock_id:
            continue
        if zone and (dock.get("zone") or "").upper() != zone.strip().upper():
            continue

        dock_sessions = [s for s in sessions if s.get("dockId") == did]
        vehicles_handled = len({s["vehicleId"] for s in dock_sessions})
        occupied_min = 0
        service_samples: list[int] = []
        delay_samples: list[int] = []
        sla_min = int(dock.get("estimated_service_time_min") or 90)

        for session in dock_sessions:
            mins = minutes_between(session.get("startedAt"), session.get("endedAt"))
            if mins is None:
                continue
            occupied_min += mins
            service_samples.append(mins)
            veh_events = events_by_vehicle.get(session["vehicleId"], [])
            loading_start = None
            loading_end = session.get("endedAt")
            for e in reversed(veh_events):
                if e.get("event_type") == "LOADING_STARTED":
                    loading_start = e.get("event_time")
                    break
            load_mins = minutes_between(loading_start, loading_end) if loading_start else mins
            if load_mins is not None:
                delay_samples.append(max(0, load_mins - sla_min))

        period_days = 1
        if date_from and date_to:
            period_days = max(1, (date_to - date_from).days + 1)
        available_min = period_days * 24 * 60
        idle_min = max(0, available_min - occupied_min)
        utilization = pct(occupied_min, available_min) if available_min else 0.0

        rows.append(
            {
                "dockId": did,
                "dockCode": dock.get("dock_code"),
                "dockName": dock.get("dock_name"),
                "zone": dock.get("zone"),
                "vehiclesHandled": vehicles_handled,
                "occupiedMinutes": occupied_min,
                "idleMinutes": idle_min,
                "utilizationPct": utilization,
                "avgServiceMinutes": avg(service_samples),
                "avgDelayMinutes": avg(delay_samples),
            }
        )

    rows.sort(key=lambda r: -(r.get("utilizationPct") or 0))
    return {"rows": rows, "dateFrom": date_from.isoformat() if date_from else None, "dateTo": date_to.isoformat() if date_to else None}


def compute_labor_productivity_report(
    *,
    labor_teams: list[dict[str, Any]],
    events: list[dict[str, Any]],
    queues_by_vehicle: dict[str, dict[str, Any]],
    vehicles: list[dict[str, Any]],
    events_by_vehicle: dict[str, list[dict[str, Any]]],
    exceptions: list[dict[str, Any]],
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict[str, Any]:
    filtered_events = filter_events_by_range(events, date_from, date_to)
    rows: list[dict[str, Any]] = []

    for team in labor_teams:
        tid = str(team["id"])
        team_code = team.get("team_code")
        assignments = [
            e
            for e in filtered_events
            if e.get("event_type") == "TEAM_ASSIGNED"
            and (
                str(e.get("labor_id") or "") == tid
                or team_code in (e.get("event_note") or "")
            )
        ]
        vehicle_ids: set[str] = set()
        for e in assignments:
            if e.get("vehicle_id"):
                vehicle_ids.add(str(e["vehicle_id"]))

        loading_minutes = 0
        paused_minutes = 0
        for vid in vehicle_ids:
            veh_events = events_by_vehicle.get(vid, [])
            queue = queues_by_vehicle.get(vid)
            vehicle = next((v for v in vehicles if str(v["id"]) == vid), {})
            milestones = journey_milestone_times(veh_events, queue, vehicle)
            if milestones.get("loadingMinutes"):
                loading_minutes += milestones["loadingMinutes"]
            pause = compute_pause_state(veh_events, vehicle_id=vid, queue_entry_id=None)
            paused_minutes += pause.get("total_paused_min", 0)

        exceptions_handled = sum(
            1
            for ex in exceptions
            if ex.get("assigned_to") and team_code and team_code in str(ex.get("assigned_to"))
        )

        shift_minutes = 8 * 60
        utilization = pct(loading_minutes, shift_minutes)

        rows.append(
            {
                "laborId": tid,
                "teamCode": team_code,
                "teamName": team.get("team_name"),
                "assignments": len(assignments),
                "vehiclesServed": len(vehicle_ids),
                "loadingMinutes": loading_minutes,
                "pausedMinutes": paused_minutes,
                "exceptionsHandled": exceptions_handled,
                "utilizationPct": utilization,
            }
        )

    rows.sort(key=lambda r: -(r.get("loadingMinutes") or 0))
    return {"rows": rows}


def compute_equipment_utilization_report(
    *,
    equipment_rows: list[dict[str, Any]],
    events: list[dict[str, Any]],
    queues_by_vehicle: dict[str, dict[str, Any]],
    vehicles: list[dict[str, Any]],
    events_by_vehicle: dict[str, list[dict[str, Any]]],
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict[str, Any]:
    filtered_events = filter_events_by_range(events, date_from, date_to)
    rows: list[dict[str, Any]] = []

    for equip in equipment_rows:
        eid = str(equip["id"])
        code = equip.get("equipment_code")
        assignments = [
            e
            for e in filtered_events
            if e.get("event_type") == "EQUIPMENT_ASSIGNED"
            and (str(e.get("equipment_id") or "") == eid or (code and code in (e.get("event_note") or "")))
        ]
        vehicle_ids: set[str] = set()
        for e in assignments:
            if e.get("vehicle_id"):
                vehicle_ids.add(str(e["vehicle_id"]))

        loading_minutes = 0
        for vid in vehicle_ids:
            veh_events = events_by_vehicle.get(vid, [])
            queue = queues_by_vehicle.get(vid)
            vehicle = next((v for v in vehicles if str(v["id"]) == vid), {})
            milestones = journey_milestone_times(veh_events, queue, vehicle)
            if milestones.get("loadingMinutes"):
                loading_minutes += milestones["loadingMinutes"]

        shift_minutes = 8 * 60
        idle_minutes = max(0, shift_minutes - loading_minutes)
        rows.append(
            {
                "equipmentId": eid,
                "equipmentCode": code,
                "equipmentName": equip.get("equipment_name"),
                "assignments": len(assignments),
                "usageMinutes": loading_minutes,
                "idleMinutes": idle_minutes,
                "loadingMinutes": loading_minutes,
                "utilizationPct": pct(loading_minutes, shift_minutes),
            }
        )

    rows.sort(key=lambda r: -(r.get("usageMinutes") or 0))
    return {"rows": rows}


def compute_delay_analysis_report(
    *,
    vehicles: list[dict[str, Any]],
    queues_by_vehicle: dict[str, dict[str, Any]],
    events_by_vehicle: dict[str, list[dict[str, Any]]],
    docks_by_id: dict[str, dict[str, Any]],
    exceptions: list[dict[str, Any]],
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict[str, Any]:
    categories: dict[str, dict[str, Any]] = {
        "waitingDelay": {"delays": [], "vehicles": set()},
        "loadingDelay": {"delays": [], "vehicles": set()},
        "exitDelay": {"delays": [], "vehicles": set()},
        "turnaroundDelay": {"delays": [], "vehicles": set()},
        "exceptionDelay": {"delays": [], "vehicles": set()},
    }

    for vehicle in vehicles:
        vid = str(vehicle["id"])
        if date_from or date_to:
            queue = queues_by_vehicle.get(vid)
            checkin = queue.get("checkin_time") if queue else None
            if checkin and not (date_from and date_of(checkin) and date_of(checkin) < date_from):
                pass
            elif date_to and checkin and date_of(checkin) and date_of(checkin) > date_to:
                continue

        veh_events = events_by_vehicle.get(vid, [])
        queue = queues_by_vehicle.get(vid)
        milestones = journey_milestone_times(veh_events, queue, vehicle)

        waiting = milestones.get("waitingMinutes")
        if waiting is not None and waiting > REPORT_SLA["waiting_minutes"]:
            over = waiting - REPORT_SLA["waiting_minutes"]
            categories["waitingDelay"]["delays"].append(over)
            categories["waitingDelay"]["vehicles"].add(vid)

        loading = milestones.get("loadingMinutes")
        dock_id = str(queue.get("dock_id") or "") if queue else ""
        dock = docks_by_id.get(dock_id)
        sla_load = int(dock.get("estimated_service_time_min") or REPORT_SLA["loading_minutes"]) if dock else REPORT_SLA["loading_minutes"]
        if loading is not None and loading > sla_load:
            over = loading - sla_load
            categories["loadingDelay"]["delays"].append(over)
            categories["loadingDelay"]["vehicles"].add(vid)

        exit_hold = milestones.get("exitHoldingMinutes")
        if exit_hold is not None and exit_hold > 30:
            categories["exitDelay"]["delays"].append(exit_hold)
            categories["exitDelay"]["vehicles"].add(vid)

        turnaround = milestones.get("turnaroundMinutes")
        if turnaround is not None and turnaround > REPORT_SLA["turnaround_minutes"]:
            over = turnaround - REPORT_SLA["turnaround_minutes"]
            categories["turnaroundDelay"]["delays"].append(over)
            categories["turnaroundDelay"]["vehicles"].add(vid)

    for ex in exceptions:
        if ex.get("status") not in {"OPEN", "IN_PROGRESS"}:
            continue
        vid = ex.get("vehicle_id")
        if not vid:
            continue
        from services.reporting_common import _now

        age = minutes_between(ex.get("created_at"), _now())
        if age is None:
            continue
        categories["exceptionDelay"]["delays"].append(age)
        categories["exceptionDelay"]["vehicles"].add(str(vid))

    rows = []
    labels = {
        "waitingDelay": "Waiting Delay",
        "loadingDelay": "Loading Delay",
        "exitDelay": "Exit Delay",
        "turnaroundDelay": "Turnaround Delay",
        "exceptionDelay": "Exception Delay",
    }
    for key, label in labels.items():
        delays = categories[key]["delays"]
        rows.append(
            {
                "category": label,
                "categoryKey": key,
                "count": len(delays),
                "avgDelayMinutes": avg(delays),
                "worstDelayMinutes": max(delays) if delays else 0,
                "affectedVehicles": len(categories[key]["vehicles"]),
            }
        )

    return {"rows": rows}


def _sla_bucket(
    *,
    label: str,
    key: str,
    evaluated: int,
    compliant: int,
) -> dict[str, Any]:
    return {
        "label": label,
        "key": key,
        "evaluated": evaluated,
        "compliant": compliant,
        "slaPct": pct(compliant, evaluated),
    }


def compute_sla_compliance_report(
    *,
    vehicles: list[dict[str, Any]],
    queues_by_vehicle: dict[str, dict[str, Any]],
    events_by_vehicle: dict[str, list[dict[str, Any]]],
    docks_by_id: dict[str, dict[str, Any]],
    appointments_by_vehicle: dict[str, dict[str, Any]],
    labor_teams: list[dict[str, Any]],
    equipment_rows: list[dict[str, Any]],
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict[str, Any]:
    waiting_eval = waiting_ok = 0
    loading_eval = loading_ok = 0
    turnaround_eval = turnaround_ok = 0

    by_dock: dict[str, dict[str, int]] = defaultdict(lambda: {"evaluated": 0, "compliant": 0})
    by_labor: dict[str, dict[str, int]] = defaultdict(lambda: {"evaluated": 0, "compliant": 0})
    by_equipment: dict[str, dict[str, int]] = defaultdict(lambda: {"evaluated": 0, "compliant": 0})
    by_material: dict[str, dict[str, int]] = defaultdict(lambda: {"evaluated": 0, "compliant": 0})

    for vehicle in vehicles:
        vid = str(vehicle["id"])
        queue = queues_by_vehicle.get(vid)
        if date_from or date_to:
            checkin = queue.get("checkin_time") if queue else vehicle.get("created_at")
            if checkin and date_from and date_of(checkin) and date_of(checkin) < date_from:
                continue
            if checkin and date_to and date_of(checkin) and date_of(checkin) > date_to:
                continue

        milestones = journey_milestone_times(events_by_vehicle.get(vid, []), queue, vehicle)
        waiting = milestones.get("waitingMinutes")
        loading = milestones.get("loadingMinutes")
        turnaround = milestones.get("turnaroundMinutes")

        compliant_all = True
        if waiting is not None:
            waiting_eval += 1
            ok = waiting <= REPORT_SLA["waiting_minutes"]
            waiting_ok += 1 if ok else 0
            compliant_all = compliant_all and ok
        if loading is not None:
            loading_eval += 1
            dock_id = str(queue.get("dock_id") or "") if queue else ""
            dock = docks_by_id.get(dock_id)
            load_sla = int(dock.get("estimated_service_time_min") or REPORT_SLA["loading_minutes"]) if dock else REPORT_SLA["loading_minutes"]
            ok = loading <= load_sla
            loading_ok += 1 if ok else 0
            compliant_all = compliant_all and ok
        if turnaround is not None:
            turnaround_eval += 1
            ok = turnaround <= REPORT_SLA["turnaround_minutes"]
            turnaround_ok += 1 if ok else 0
            compliant_all = compliant_all and ok

        if waiting is None and loading is None and turnaround is None:
            continue

        dock_id = str(queue.get("dock_id") or "") if queue else "unassigned"
        dock = docks_by_id.get(dock_id)
        dock_label = dock.get("dock_code") if dock else "Unassigned"
        by_dock[dock_label]["evaluated"] += 1
        by_dock[dock_label]["compliant"] += 1 if compliant_all else 0

        appt = appointments_by_vehicle.get(vid)
        material = material_type_from_appointment(appt)
        by_material[material]["evaluated"] += 1
        by_material[material]["compliant"] += 1 if compliant_all else 0

        for team in labor_teams:
            if str(team.get("assigned_vehicle_id") or "") == vid:
                label = team.get("team_code") or team.get("team_name") or str(team.get("id"))
                by_labor[label]["evaluated"] += 1
                by_labor[label]["compliant"] += 1 if compliant_all else 0
        for equip in equipment_rows:
            if str(equip.get("assigned_vehicle_id") or "") == vid:
                label = equip.get("equipment_code") or equip.get("equipment_name")
                by_equipment[label]["evaluated"] += 1
                by_equipment[label]["compliant"] += 1 if compliant_all else 0

    overall_eval = max(waiting_eval, loading_eval, turnaround_eval)
    overall_ok = min(waiting_ok, loading_ok, turnaround_ok) if overall_eval else 0

    def breakdown_map(data: dict[str, dict[str, int]]) -> list[dict[str, Any]]:
        return [
            _sla_bucket(label=k, key=k, evaluated=v["evaluated"], compliant=v["compliant"])
            for k, v in sorted(data.items(), key=lambda x: -x[1]["evaluated"])
        ]

    return {
        "waitingSlaPct": pct(waiting_ok, waiting_eval),
        "loadingSlaPct": pct(loading_ok, loading_eval),
        "turnaroundSlaPct": pct(turnaround_ok, turnaround_eval),
        "overallSlaPct": pct(overall_ok, overall_eval) if overall_eval else pct(
            waiting_ok + loading_ok + turnaround_ok,
            waiting_eval + loading_eval + turnaround_eval,
        ),
        "byDock": breakdown_map(by_dock),
        "byLaborTeam": breakdown_map(by_labor),
        "byEquipment": breakdown_map(by_equipment),
        "byMaterialType": breakdown_map(by_material),
    }


async def get_dock_utilization_report(
    *,
    date_from: date | None = None,
    date_to: date | None = None,
    zone: str | None = None,
    dock_id: str | None = None,
) -> dict[str, Any]:
    docks, _ = await list_docks()
    events, _ = await list_yard_events()
    queues, _ = await list_queue_entries()
    return compute_dock_utilization_report(
        docks=docks,
        events=events,
        queues_by_vehicle=_index_by_vehicle(queues),
        events_by_vehicle=_vehicle_events_map(events),
        date_from=date_from,
        date_to=date_to,
        zone=zone,
        dock_id=dock_id,
    )


async def get_labor_productivity_report(
    *,
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict[str, Any]:
    labor_teams, _ = await list_labor_teams()
    events, _ = await list_yard_events()
    queues, _ = await list_queue_entries()
    vehicles, _ = await list_vehicles()
    exceptions = await list_loading_exceptions(limit=500)
    return compute_labor_productivity_report(
        labor_teams=labor_teams,
        events=events,
        queues_by_vehicle=_index_by_vehicle(queues),
        vehicles=vehicles,
        events_by_vehicle=_vehicle_events_map(events),
        exceptions=exceptions,
        date_from=date_from,
        date_to=date_to,
    )


async def get_equipment_utilization_report(
    *,
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict[str, Any]:
    equipment_rows, _ = await list_equipment()
    events, _ = await list_yard_events()
    queues, _ = await list_queue_entries()
    vehicles, _ = await list_vehicles()
    return compute_equipment_utilization_report(
        equipment_rows=equipment_rows,
        events=events,
        queues_by_vehicle=_index_by_vehicle(queues),
        vehicles=vehicles,
        events_by_vehicle=_vehicle_events_map(events),
        date_from=date_from,
        date_to=date_to,
    )


async def get_delay_analysis_report(
    *,
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict[str, Any]:
    vehicles, _ = await list_vehicles()
    queues, _ = await list_queue_entries()
    events, _ = await list_yard_events()
    docks, _ = await list_docks()
    exceptions = await list_loading_exceptions(active_only=True)
    return compute_delay_analysis_report(
        vehicles=vehicles,
        queues_by_vehicle=_index_by_vehicle(queues),
        events_by_vehicle=_vehicle_events_map(events),
        docks_by_id={str(d["id"]): d for d in docks},
        exceptions=exceptions,
        date_from=date_from,
        date_to=date_to,
    )


async def get_sla_compliance_report(
    *,
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict[str, Any]:
    vehicles, _ = await list_vehicles()
    queues, _ = await list_queue_entries()
    appointments, _ = await list_appointments()
    events, _ = await list_yard_events()
    docks, _ = await list_docks()
    labor_teams, _ = await list_labor_teams()
    equipment_rows, _ = await list_equipment()
    return compute_sla_compliance_report(
        vehicles=vehicles,
        queues_by_vehicle=_index_by_vehicle(queues),
        events_by_vehicle=_vehicle_events_map(events),
        docks_by_id={str(d["id"]): d for d in docks},
        appointments_by_vehicle=_index_appointments_by_vehicle(appointments),
        labor_teams=labor_teams,
        equipment_rows=equipment_rows,
        date_from=date_from,
        date_to=date_to,
    )
