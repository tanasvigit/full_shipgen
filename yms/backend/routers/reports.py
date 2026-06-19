"""Reports API — operational analytics from live YMS data."""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Query

from schemas import (
    DelayAnalysisReportOut,
    DockUtilizationReportOut,
    EquipmentUtilizationReportOut,
    LaborProductivityReportOut,
    OperationsDashboardOut,
    SlaComplianceReportOut,
    VehicleJourneyReportOut,
)
from services.operations_dashboard_service import get_operations_dashboard
from services.operational_reports_service import (
    get_delay_analysis_report,
    get_dock_utilization_report,
    get_equipment_utilization_report,
    get_labor_productivity_report,
    get_sla_compliance_report,
)
from services.report_export_service import export_response
from services.vehicle_journey_report_service import get_vehicle_journey_report, resolve_vehicle_id

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/operations-dashboard", response_model=OperationsDashboardOut)
async def operations_dashboard_endpoint():
    return OperationsDashboardOut(**(await get_operations_dashboard()))


def _parse_date(value: Optional[str]) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


@router.get("/vehicle-journey/{vehicle_id}", response_model=VehicleJourneyReportOut)
async def vehicle_journey_report_endpoint(
    vehicle_id: str,
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    return VehicleJourneyReportOut(
        **(
            await get_vehicle_journey_report(
                vehicle_id,
                date_from=_parse_date(date_from),
                date_to=_parse_date(date_to),
            )
        )
    )


@router.get("/vehicle-journey", response_model=VehicleJourneyReportOut)
async def vehicle_journey_lookup_endpoint(
    vehicle_number: Optional[str] = Query(None),
    appointment_ref: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    vehicle_id = await resolve_vehicle_id(
        vehicle_number=vehicle_number,
        appointment_ref=appointment_ref,
    )
    return VehicleJourneyReportOut(
        **(
            await get_vehicle_journey_report(
                vehicle_id,
                date_from=_parse_date(date_from),
                date_to=_parse_date(date_to),
            )
        )
    )


@router.get("/dock-utilization", response_model=DockUtilizationReportOut)
async def dock_utilization_endpoint(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    dock_id: Optional[str] = Query(None),
):
    return DockUtilizationReportOut(
        **(
            await get_dock_utilization_report(
                date_from=_parse_date(date_from),
                date_to=_parse_date(date_to),
                zone=zone,
                dock_id=dock_id,
            )
        )
    )


@router.get("/labor-productivity", response_model=LaborProductivityReportOut)
async def labor_productivity_endpoint(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    return LaborProductivityReportOut(
        **(
            await get_labor_productivity_report(
                date_from=_parse_date(date_from),
                date_to=_parse_date(date_to),
            )
        )
    )


@router.get("/equipment-utilization", response_model=EquipmentUtilizationReportOut)
async def equipment_utilization_endpoint(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    return EquipmentUtilizationReportOut(
        **(
            await get_equipment_utilization_report(
                date_from=_parse_date(date_from),
                date_to=_parse_date(date_to),
            )
        )
    )


@router.get("/delay-analysis", response_model=DelayAnalysisReportOut)
async def delay_analysis_endpoint(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    return DelayAnalysisReportOut(
        **(
            await get_delay_analysis_report(
                date_from=_parse_date(date_from),
                date_to=_parse_date(date_to),
            )
        )
    )


@router.get("/sla-compliance", response_model=SlaComplianceReportOut)
async def sla_compliance_endpoint(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    return SlaComplianceReportOut(
        **(
            await get_sla_compliance_report(
                date_from=_parse_date(date_from),
                date_to=_parse_date(date_to),
            )
        )
    )


@router.get("/dock-utilization/export")
async def dock_utilization_export(
    fmt: str = Query("csv"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    dock_id: Optional[str] = Query(None),
):
    report = await get_dock_utilization_report(
        date_from=_parse_date(date_from),
        date_to=_parse_date(date_to),
        zone=zone,
        dock_id=dock_id,
    )
    columns = [
        "dockCode",
        "dockName",
        "zone",
        "vehiclesHandled",
        "occupiedMinutes",
        "idleMinutes",
        "utilizationPct",
        "avgServiceMinutes",
        "avgDelayMinutes",
    ]
    return export_response(
        filename="dock-utilization",
        columns=columns,
        rows=report["rows"],
        fmt=fmt,
        sheet_name="Dock Utilization",
    )


@router.get("/labor-productivity/export")
async def labor_productivity_export(
    fmt: str = Query("csv"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    report = await get_labor_productivity_report(
        date_from=_parse_date(date_from),
        date_to=_parse_date(date_to),
    )
    columns = [
        "teamCode",
        "teamName",
        "assignments",
        "vehiclesServed",
        "loadingMinutes",
        "pausedMinutes",
        "exceptionsHandled",
        "utilizationPct",
    ]
    return export_response(
        filename="labor-productivity",
        columns=columns,
        rows=report["rows"],
        fmt=fmt,
        sheet_name="Labor Productivity",
    )


@router.get("/equipment-utilization/export")
async def equipment_utilization_export(
    fmt: str = Query("csv"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    report = await get_equipment_utilization_report(
        date_from=_parse_date(date_from),
        date_to=_parse_date(date_to),
    )
    columns = [
        "equipmentCode",
        "equipmentName",
        "assignments",
        "usageMinutes",
        "idleMinutes",
        "loadingMinutes",
        "utilizationPct",
    ]
    return export_response(
        filename="equipment-utilization",
        columns=columns,
        rows=report["rows"],
        fmt=fmt,
        sheet_name="Equipment Utilization",
    )


@router.get("/delay-analysis/export")
async def delay_analysis_export(
    fmt: str = Query("csv"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    report = await get_delay_analysis_report(
        date_from=_parse_date(date_from),
        date_to=_parse_date(date_to),
    )
    columns = ["category", "count", "avgDelayMinutes", "worstDelayMinutes", "affectedVehicles"]
    return export_response(
        filename="delay-analysis",
        columns=columns,
        rows=report["rows"],
        fmt=fmt,
        sheet_name="Delay Analysis",
    )


@router.get("/sla-compliance/export")
async def sla_compliance_export(
    fmt: str = Query("csv"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    report = await get_sla_compliance_report(
        date_from=_parse_date(date_from),
        date_to=_parse_date(date_to),
    )
    rows = [
        {"metric": "Waiting SLA %", "value": report["waitingSlaPct"]},
        {"metric": "Loading SLA %", "value": report["loadingSlaPct"]},
        {"metric": "Turnaround SLA %", "value": report["turnaroundSlaPct"]},
        {"metric": "Overall SLA %", "value": report["overallSlaPct"]},
    ]
    return export_response(
        filename="sla-compliance",
        columns=["metric", "value"],
        rows=rows,
        fmt=fmt,
        sheet_name="SLA Compliance",
    )
