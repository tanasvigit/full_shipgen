from decimal import Decimal

from pydantic import BaseModel

from app.schemas.common import CategorySlotStats, ORMModel
from app.schemas.floor import FloorResponse
from app.schemas.hardware import HardwareDeviceResponse
from app.schemas.ticket import TicketResponse


class DashboardStatsResponse(BaseModel):
    vehiclesInside: int
    todayEntries: int
    todayExits: int
    revenueToday: Decimal
    occupiedSlots: int
    totalSlots: int
    twoWheelerCount: int
    fourWheelerCount: int


class AdminDashboardResponse(BaseModel):
    stats: DashboardStatsResponse
    facilitySummary: "FacilitySummaryLite"
    hardware: list[HardwareDeviceResponse]
    auditLogs: list["AuditLogLite"]
    recentTickets: list[TicketResponse]


class SupervisorDashboardResponse(BaseModel):
    stats: DashboardStatsResponse
    occupancyPercent: int
    activeOperators: list["ActiveOperatorResponse"]
    alerts: list["SupervisorAlertResponse"]
    recentTickets: list[TicketResponse]


class OperatorDashboardResponse(BaseModel):
    stats: DashboardStatsResponse
    facilitySummary: "FacilitySummaryLite"
    ticketsToday: int
    unpaidCount: int
    upiCount: int
    cashCount: int
    recentTickets: list[TicketResponse]


class FacilitySummaryLite(BaseModel):
    totalFloors: int
    totalCapacity: int
    totalOccupied: int
    totalAvailable: int
    occupancyPercent: int
    twoWheeler: CategorySlotStats
    fourWheeler: CategorySlotStats
    heavyVehicle: CategorySlotStats


class AuditLogLite(ORMModel):
    id: str
    action: str
    user: str
    role: str
    timestamp: str
    details: str


class ActiveOperatorResponse(BaseModel):
    id: str
    name: str
    shift: str
    ticketsIssued: int
    status: str


class SupervisorAlertResponse(BaseModel):
    id: str
    severity: str
    title: str
    detail: str
    time: str
