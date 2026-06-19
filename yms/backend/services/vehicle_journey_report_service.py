"""Vehicle Journey Analytics report — timeline + metrics from live YMS tables."""

from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import HTTPException

from services.loading_exceptions_service import list_loading_exceptions
from services.reporting_common import (
    build_timeline,
    exception_metrics,
    journey_milestone_times,
    material_type_from_appointment,
    sla_analysis,
)
from services.equipment_service import list_equipment
from services.labor_service import list_labor_teams
from services.yms_service import (
    get_vehicle,
    list_appointments,
    list_docks,
    list_queue_entries,
    list_yard_events,
    list_vehicles,
)


async def resolve_vehicle_id(
    *,
    vehicle_id: str | None = None,
    vehicle_number: str | None = None,
    appointment_ref: str | None = None,
) -> str:
    if vehicle_id:
        return vehicle_id
    if vehicle_number:
        vehicles, _ = await list_vehicles()
        match = next(
            (v for v in vehicles if (v.get("vehicle_number") or "").upper() == vehicle_number.strip().upper()),
            None,
        )
        if match:
            return str(match["id"])
    if appointment_ref:
        appointments, _ = await list_appointments()
        appt = next(
            (
                a
                for a in appointments
                if (a.get("booking_reference") or "").upper() == appointment_ref.strip().upper()
            ),
            None,
        )
        if appt and appt.get("vehicle_id"):
            return str(appt["vehicle_id"])
    raise HTTPException(status_code=404, detail="Vehicle not found for search criteria")


async def _collect_vehicle_events(
    vehicle_id: str,
    appointment_id: str | None,
    queue_entry_id: str | None,
    all_events: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    vid = str(vehicle_id)
    appt_id = str(appointment_id) if appointment_id else None
    qid = str(queue_entry_id) if queue_entry_id else None
    rows = [
        e
        for e in all_events
        if str(e.get("vehicle_id") or "") == vid
        or (appt_id and str(e.get("appointment_id") or "") == appt_id)
        or (qid and str(e.get("queue_entry_id") or "") == qid)
    ]
    rows.sort(key=lambda e: e.get("event_time") or "")
    return rows


def _related_labor(labor_teams: list[dict[str, Any]], vehicle_id: str, dock_id: str | None, queue_id: str | None) -> list[dict[str, Any]]:
    rows = []
    for team in labor_teams:
        if str(team.get("assigned_vehicle_id") or "") == vehicle_id:
            rows.append(team)
            continue
        if queue_id and str(team.get("assigned_queue_entry_id") or "") == queue_id:
            rows.append(team)
            continue
        if dock_id and str(team.get("assigned_dock_id") or "") == dock_id:
            rows.append(team)
    return rows


def _related_equipment(
    equipment_rows: list[dict[str, Any]], vehicle_id: str, dock_id: str | None, queue_id: str | None
) -> list[dict[str, Any]]:
    rows = []
    for row in equipment_rows:
        if str(row.get("assigned_vehicle_id") or "") == vehicle_id:
            rows.append(row)
            continue
        if queue_id and str(row.get("assigned_queue_entry_id") or "") == queue_id:
            rows.append(row)
            continue
        if dock_id and str(row.get("assigned_dock_id") or "") == dock_id:
            rows.append(row)
    return rows


def compute_vehicle_journey_report(
    *,
    vehicle: dict[str, Any],
    appointment: dict[str, Any] | None,
    queue: dict[str, Any] | None,
    dock: dict[str, Any] | None,
    labor: list[dict[str, Any]],
    equipment: list[dict[str, Any]],
    exceptions: list[dict[str, Any]],
    events: list[dict[str, Any]],
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict[str, Any]:
    milestones = journey_milestone_times(events, queue, vehicle)
    exc_metrics = exception_metrics(exceptions)
    metrics = {
        "waitingMinutes": milestones.get("waitingMinutes"),
        "calledMinutes": milestones.get("calledMinutes"),
        "dockAssignmentMinutes": milestones.get("dockAssignmentMinutes"),
        "loadingMinutes": milestones.get("loadingMinutes"),
        "pausedMinutes": milestones.get("pausedMinutes"),
        "exitHoldingMinutes": milestones.get("exitHoldingMinutes"),
        "turnaroundMinutes": milestones.get("turnaroundMinutes"),
        **exc_metrics,
        "sla": sla_analysis(milestones),
    }

    material = material_type_from_appointment(appointment)
    operation_type = vehicle.get("operation_type") or "Loading"

    return {
        "vehicle": vehicle,
        "appointment": appointment,
        "queue": queue,
        "dock": dock,
        "labor": labor,
        "equipment": equipment,
        "exceptions": exceptions,
        "timeline": build_timeline(events, queue=queue, date_from=date_from, date_to=date_to),
        "metrics": metrics,
        "summary": {
            "vehicleNumber": vehicle.get("vehicle_number"),
            "appointmentRef": appointment.get("booking_reference") if appointment else None,
            "transporter": vehicle.get("transporter_name"),
            "driver": vehicle.get("driver_name"),
            "dockCode": dock.get("dock_code") if dock else None,
            "operationType": operation_type,
            "material": material,
        },
    }


async def get_vehicle_journey_report(
    vehicle_id: str,
    *,
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict[str, Any]:
    vehicle = await get_vehicle(vehicle_id)
    queues, _ = await list_queue_entries()
    appointments, _ = await list_appointments()
    docks, _ = await list_docks()
    labor_teams, _ = await list_labor_teams()
    equipment_rows, _ = await list_equipment()
    all_events, _ = await list_yard_events()

    queue = next((q for q in queues if str(q.get("vehicle_id")) == str(vehicle_id)), None)
    appointment = None
    if queue and queue.get("appointment_id"):
        appointment = next((a for a in appointments if str(a.get("id")) == str(queue["appointment_id"])), None)
    if appointment is None:
        appointment = next((a for a in appointments if str(a.get("vehicle_id")) == str(vehicle_id)), None)

    dock = None
    if queue and queue.get("dock_id"):
        dock = next((d for d in docks if str(d.get("id")) == str(queue["dock_id"])), None)
    if dock is None:
        dock = next((d for d in docks if str(d.get("current_vehicle_id") or "") == str(vehicle_id)), None)

    events = await _collect_vehicle_events(
        vehicle_id,
        str(appointment["id"]) if appointment and appointment.get("id") else None,
        str(queue["id"]) if queue and queue.get("id") else None,
        all_events,
    )

    exceptions = await list_loading_exceptions(vehicle_id=vehicle_id, limit=500)
    labor = _related_labor(
        labor_teams,
        str(vehicle_id),
        str(dock["id"]) if dock and dock.get("id") else None,
        str(queue["id"]) if queue and queue.get("id") else None,
    )
    equipment = _related_equipment(
        equipment_rows,
        str(vehicle_id),
        str(dock["id"]) if dock and dock.get("id") else None,
        str(queue["id"]) if queue and queue.get("id") else None,
    )

    return compute_vehicle_journey_report(
        vehicle=vehicle,
        appointment=appointment,
        queue=queue,
        dock=dock,
        labor=labor,
        equipment=equipment,
        exceptions=exceptions,
        events=events,
        date_from=date_from,
        date_to=date_to,
    )
