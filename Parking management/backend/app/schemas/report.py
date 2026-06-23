from decimal import Decimal

from pydantic import BaseModel


class RevenuePoint(BaseModel):
    day: str
    revenue: Decimal


class RevenueReportResponse(BaseModel):
    range: str
    points: list[RevenuePoint]
    total: Decimal


class TrafficReportResponse(BaseModel):
    range: str
    todayEntries: int
    todayExits: int
    vehiclesInside: int


class OccupancyReportResponse(BaseModel):
    range: str
    occupiedSlots: int
    totalSlots: int
    occupancyPercent: int
    twoWheelerCount: int
    fourWheelerCount: int
    otherCount: int = 0
