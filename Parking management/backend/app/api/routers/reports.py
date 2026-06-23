from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import DbSession, require_permissions
from app.schemas.report import OccupancyReportResponse, RevenueReportResponse, TrafficReportResponse
from app.services import reports as reports_service
from app.services.report_filters import normalize_vehicle_type

router = APIRouter()
ReportReader = Annotated[object, Depends(require_permissions("reports.view", "reports.admin"))]


def _report_params(
    range: str | None,
    start_date: date | None,
    end_date: date | None,
) -> tuple[str | None, date | None, date | None]:
    if start_date is not None or end_date is not None:
        if start_date is None or end_date is None:
            raise HTTPException(
                status_code=400,
                detail="Both start_date and end_date are required for a custom range.",
            )
        if start_date > end_date:
            raise HTTPException(status_code=400, detail="start_date must not be after end_date.")
        return None, start_date, end_date
    return range, None, None


def _vehicle_type_param(vehicle_type: str | None) -> str | None:
    if vehicle_type is None:
        return None
    try:
        return normalize_vehicle_type(vehicle_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/revenue", response_model=RevenueReportResponse)
def revenue_report(
    db: DbSession,
    _: ReportReader,
    range: str | None = Query(default="7d"),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    vehicle_type: str | None = Query(default=None),
) -> RevenueReportResponse:
    range_key, start, end = _report_params(range, start_date, end_date)
    vehicle = _vehicle_type_param(vehicle_type)
    return reports_service.revenue_report(db, range_key, start, end, vehicle)


@router.get("/traffic", response_model=TrafficReportResponse)
def traffic_report(
    db: DbSession,
    _: ReportReader,
    range: str | None = Query(default="today"),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    vehicle_type: str | None = Query(default=None),
) -> TrafficReportResponse:
    range_key, start, end = _report_params(range, start_date, end_date)
    vehicle = _vehicle_type_param(vehicle_type)
    return reports_service.traffic_report(db, range_key, start, end, vehicle)


@router.get("/occupancy", response_model=OccupancyReportResponse)
def occupancy_report(
    db: DbSession,
    _: ReportReader,
    range: str | None = Query(default="today"),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    vehicle_type: str | None = Query(default=None),
) -> OccupancyReportResponse:
    range_key, start, end = _report_params(range, start_date, end_date)
    vehicle = _vehicle_type_param(vehicle_type)
    return reports_service.occupancy_report(db, range_key, start, end, vehicle)
