from datetime import date, datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator


class StatusCheck(BaseModel):
    id: str
    client_name: str
    timestamp: datetime


class StatusCheckCreate(BaseModel):
    client_name: str = Field(min_length=1, max_length=255)


class VehicleBase(BaseModel):
    vehicle_number: str = Field(min_length=3, max_length=32)
    vehicle_type: str = Field(min_length=1, max_length=64)
    ownership_type: str
    transporter_name: str = Field(min_length=1, max_length=255)
    driver_name: Optional[str] = Field(default=None, max_length=255)
    driver_phone: Optional[str] = Field(default=None, max_length=32)
    status: str = "SCHEDULED"
    display_name: Optional[str] = Field(default=None, max_length=255)
    operation_type: str = Field(default="Loading", max_length=64)
    material_type: str = Field(default="GENERAL", max_length=64)
    expected_arrival: Optional[datetime] = None
    remarks: Optional[str] = None
    registration_source: str = Field(default="manual", max_length=32)


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    ownership_type: Optional[str] = None
    transporter_name: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    status: Optional[str] = None
    display_name: Optional[str] = None
    operation_type: Optional[str] = None
    material_type: Optional[str] = None
    expected_arrival: Optional[datetime] = None
    remarks: Optional[str] = None


class VehicleOut(VehicleBase):
    id: UUID
    vehicle_reference: Optional[str] = None
    current_zone_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


class VehicleJourneyOut(BaseModel):
    vehicle: VehicleOut
    appointment: Optional[dict] = None
    queue_entry: Optional[dict] = None
    dock: Optional[dict] = None
    labor: Optional[dict] = None
    equipment: Optional[dict] = None
    readiness: Optional[dict] = None
    zone_name: Optional[str] = None
    zone_code: Optional[str] = None
    events: List[dict] = Field(default_factory=list)
    loading: Optional[dict] = None
    current_stage: str = "Scheduled"
    queue_status: Optional[str] = None


class AppointmentBase(BaseModel):
    booking_reference: str = Field(min_length=3, max_length=64)
    vehicle_id: str
    customer_name: str = Field(min_length=1, max_length=255)
    shipment_reference: str = Field(min_length=1, max_length=255)
    booking_date: date
    reporting_time: datetime
    scheduled_slot: str = Field(min_length=1, max_length=64)
    gate_number: str = Field(min_length=1, max_length=32)
    priority: int = 0
    status: str = "SCHEDULED"
    remarks: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    created_by: str = "appointments-ui"


class AppointmentUpdate(BaseModel):
    customer_name: Optional[str] = None
    shipment_reference: Optional[str] = None
    booking_date: Optional[date] = None
    reporting_time: Optional[datetime] = None
    scheduled_slot: Optional[str] = None
    gate_number: Optional[str] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    remarks: Optional[str] = None
    created_by: str = "appointments-ui"


class AppointmentOut(AppointmentBase):
    id: UUID
    vehicle_id: UUID
    created_at: datetime
    updated_at: datetime


class QueueEntryBase(BaseModel):
    appointment_id: str
    vehicle_id: str
    queue_number: str = Field(min_length=3, max_length=64)
    queue_type: str = Field(min_length=1, max_length=64)
    priority_score: int
    checkin_time: Optional[datetime] = None
    called_time: Optional[datetime] = None
    dock_assigned_time: Optional[datetime] = None
    status: str = "WAITING"
    tare_weight_kg: Optional[float] = None
    gross_weight_kg: Optional[float] = None
    net_weight_kg: Optional[float] = None


class QueueEntryCreate(BaseModel):
    appointment_id: str
    queue_number: str = Field(min_length=3, max_length=64)
    queue_type: str = Field(min_length=1, max_length=64)
    checkin_time: Optional[datetime] = None


class QueueEntryUpdate(BaseModel):
    queue_type: Optional[str] = None
    priority_score: Optional[int] = None
    status: Optional[str] = None
    called_time: Optional[datetime] = None
    dock_assigned_time: Optional[datetime] = None


class QueueEntryOut(QueueEntryBase):
    id: UUID
    appointment_id: UUID
    vehicle_id: UUID
    dock_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime


class DockBase(BaseModel):
    dock_code: str = Field(min_length=1, max_length=32)
    dock_name: str = Field(min_length=1, max_length=255)
    dock_type: str = Field(min_length=1, max_length=64)
    zone: Optional[str] = None
    supported_vehicle_types: List[str] = Field(default_factory=list)
    supported_cargo_types: List[str] = Field(default_factory=list)
    max_capacity: int = Field(default=1, ge=1, le=20)
    status: str = "AVAILABLE"
    notes: Optional[str] = None
    estimated_service_time_min: int = Field(default=90, ge=15, le=480)


class DockCreate(BaseModel):
    dock_name: str = Field(min_length=1, max_length=255)
    dock_type: str = Field(min_length=1, max_length=64)
    zone: str = Field(min_length=1, max_length=32)
    supported_vehicle_types: List[str] = Field(min_length=1)
    supported_cargo_types: List[str] = Field(min_length=1)
    max_capacity: int = Field(default=1, ge=1, le=20)
    status: str = "AVAILABLE"
    notes: Optional[str] = None
    estimated_service_time_min: int = Field(default=90, ge=15, le=480)
    created_by: str = "docks-ui"


class DockUpdate(BaseModel):
    dock_name: Optional[str] = None
    dock_type: Optional[str] = None
    zone: Optional[str] = None
    supported_vehicle_types: Optional[List[str]] = None
    supported_cargo_types: Optional[List[str]] = None
    max_capacity: Optional[int] = Field(default=None, ge=1, le=20)
    status: Optional[str] = None
    current_vehicle_id: Optional[str] = None
    notes: Optional[str] = None
    estimated_service_time_min: Optional[int] = Field(default=None, ge=15, le=480)
    event_note: Optional[str] = None
    created_by: str = "docks-ui"


class DockReadinessOut(BaseModel):
    dockAssigned: bool
    dockId: Optional[str] = None
    dockCode: Optional[str] = None
    dockName: Optional[str] = None
    dockStatus: Optional[str] = None


class ResourceReadinessOut(BaseModel):
    ready: bool
    missing: list[str] = Field(default_factory=list)
    dockAssigned: bool = False
    laborAssigned: bool = False
    equipmentAssigned: bool = False
    equipmentOptional: bool = True
    equipmentRecommended: bool = False
    dockId: Optional[str] = None
    dockCode: Optional[str] = None
    dockName: Optional[str] = None
    teamId: Optional[str] = None
    teamName: Optional[str] = None
    teamCode: Optional[str] = None
    equipmentId: Optional[str] = None
    equipmentCode: Optional[str] = None
    equipmentName: Optional[str] = None


class DockOut(DockBase):
    id: UUID
    current_vehicle_id: Optional[UUID] = None
    assigned_since: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class YardEventCreate(BaseModel):
    vehicle_id: Optional[str] = None
    appointment_id: Optional[str] = None
    queue_entry_id: Optional[str] = None
    dock_id: Optional[str] = None
    equipment_id: Optional[str] = None
    labor_id: Optional[str] = None
    event_type: str = Field(min_length=1, max_length=64)
    event_time: Optional[datetime] = None
    event_note: Optional[str] = None
    created_by: str = Field(min_length=1, max_length=128)


class YardEventOut(BaseModel):
    id: UUID
    vehicle_id: Optional[UUID] = None
    appointment_id: Optional[UUID] = None
    queue_entry_id: Optional[UUID] = None
    dock_id: Optional[UUID] = None
    equipment_id: Optional[UUID] = None
    labor_id: Optional[UUID] = None
    event_type: str
    event_time: datetime
    event_note: Optional[str] = None
    created_by: str
    created_at: datetime
    updated_at: datetime


class CheckInRequest(BaseModel):
    appointment_id: str
    queue_number: str = Field(min_length=3, max_length=64)
    queue_type: str = Field(min_length=1, max_length=64, default="STANDARD")


class AssignDockRequest(BaseModel):
    dock_id: str


class TransitionRequest(BaseModel):
    status: str
    event_note: Optional[str] = None
    created_by: str = "system"


class EquipmentBase(BaseModel):
    equipment_code: str = Field(min_length=2, max_length=32)
    equipment_name: str = Field(min_length=1, max_length=128)
    equipment_type: str = Field(min_length=1, max_length=64)
    model: str = Field(min_length=1, max_length=128)
    status: str = "IDLE"
    battery_level: Optional[int] = Field(default=None, ge=0, le=100)
    operator_name: Optional[str] = None
    asset_number: Optional[str] = None
    current_location: Optional[str] = None
    assigned_dock_id: Optional[str] = None
    assigned_vehicle_id: Optional[str] = None
    assigned_queue_entry_id: Optional[str] = None
    assigned_since: Optional[datetime] = None
    maintenance_due: Optional[date] = None
    notes: Optional[str] = None


class EquipmentCreate(BaseModel):
    equipment_name: str = Field(min_length=1, max_length=128)
    equipment_type: str = Field(min_length=1, max_length=64)
    model: Optional[str] = Field(default="—", max_length=128)
    asset_number: Optional[str] = Field(default=None, max_length=64)
    operator_name: Optional[str] = None
    current_location: Optional[str] = None
    battery_level: Optional[int] = Field(default=None, ge=0, le=100)
    status: str = "IDLE"
    notes: Optional[str] = None
    created_by: str = "equipment-ui"


class EquipmentUpdate(BaseModel):
    equipment_name: Optional[str] = None
    equipment_type: Optional[str] = None
    model: Optional[str] = None
    asset_number: Optional[str] = None
    status: Optional[str] = None
    battery_level: Optional[int] = Field(default=None, ge=0, le=100)
    operator_name: Optional[str] = None
    current_location: Optional[str] = None
    assigned_dock_id: Optional[str] = None
    assigned_vehicle_id: Optional[str] = None
    maintenance_due: Optional[date] = None
    notes: Optional[str] = None
    event_note: Optional[str] = None
    created_by: str = "equipment-ui"


class EquipmentStatusUpdate(BaseModel):
    status: str
    event_note: Optional[str] = None
    created_by: str = "equipment-ui"


class EquipmentAssignRequest(BaseModel):
    dock_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    queue_entry_id: Optional[str] = None
    appointment_id: Optional[str] = None
    set_in_use: bool = False
    current_location: Optional[str] = None
    event_note: Optional[str] = None
    created_by: str = "equipment-ui"


class DockAssignEquipmentRequest(BaseModel):
    equipment_id: str
    set_in_use: bool = False
    event_note: Optional[str] = None
    created_by: str = "docks-ui"


class EquipmentReadinessOut(BaseModel):
    equipmentAssigned: bool
    equipmentId: Optional[str] = None
    equipmentCode: Optional[str] = None
    equipmentName: Optional[str] = None


class EquipmentOut(EquipmentBase):
    id: UUID
    assigned_dock_id: Optional[UUID] = None
    assigned_vehicle_id: Optional[UUID] = None
    assigned_queue_entry_id: Optional[UUID] = None
    assigned_appointment_id: Optional[UUID] = None
    assigned_since: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def normalize_legacy_row(cls, data: object) -> object:
        if not isinstance(data, dict):
            return data
        name = data.get("equipment_name")
        if not name:
            code = data.get("equipment_code") or "Equipment"
            eq_type = data.get("equipment_type")
            data["equipment_name"] = f"{code} · {eq_type}" if eq_type else str(code)
        if not data.get("model"):
            data["model"] = "—"
        return data


class LaborTeamBase(BaseModel):
    team_code: str = Field(min_length=2, max_length=16)
    team_name: str = Field(min_length=1, max_length=64)
    shift_start: str = Field(min_length=4, max_length=8)
    shift_end: str = Field(min_length=4, max_length=8)
    members_count: int = Field(ge=0, le=200)
    available_count: int = Field(ge=0, le=200)
    assigned_count: int = Field(default=0, ge=0, le=200)
    status: str = "ON_DUTY"
    supervisor_name: Optional[str] = None
    supervisor_phone: Optional[str] = None
    team_type: Optional[str] = None
    material_type: str = "GENERAL"
    skills: list[str] = Field(default_factory=list)
    current_assignment: Optional[str] = None
    current_location: Optional[str] = None
    assigned_dock_id: Optional[str] = None
    assigned_vehicle_id: Optional[str] = None
    assigned_queue_entry_id: Optional[str] = None
    assigned_appointment_id: Optional[str] = None
    assigned_since: Optional[datetime] = None
    notes: Optional[str] = None


class LaborTeamCreate(BaseModel):
    team_name: str = Field(min_length=1, max_length=64)
    shift_start: str = Field(min_length=4, max_length=8)
    shift_end: str = Field(min_length=4, max_length=8)
    members_count: int = Field(ge=1, le=200)
    status: str = "ON_DUTY"
    supervisor_name: str = Field(min_length=1, max_length=64)
    supervisor_phone: str = Field(min_length=1, max_length=32)
    material_type: str = "GENERAL"
    notes: Optional[str] = None
    created_by: str = "labor-ui"


class LaborTeamUpdate(BaseModel):
    team_name: Optional[str] = None
    shift_start: Optional[str] = None
    shift_end: Optional[str] = None
    members_count: Optional[int] = Field(default=None, ge=0, le=200)
    available_count: Optional[int] = Field(default=None, ge=0, le=200)
    assigned_count: Optional[int] = Field(default=None, ge=0, le=200)
    status: Optional[str] = None
    supervisor_name: Optional[str] = None
    supervisor_phone: Optional[str] = None
    team_type: Optional[str] = None
    material_type: Optional[str] = None
    skills: Optional[list[str]] = None
    current_assignment: Optional[str] = None
    current_location: Optional[str] = None
    assigned_dock_id: Optional[str] = None
    assigned_vehicle_id: Optional[str] = None
    assigned_queue_entry_id: Optional[str] = None
    notes: Optional[str] = None


class LaborStatusUpdate(BaseModel):
    status: str
    event_note: Optional[str] = None
    created_by: str = "labor-ui"


class LaborAssignRequest(BaseModel):
    dock_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    queue_entry_id: Optional[str] = None
    appointment_id: Optional[str] = None
    current_assignment: Optional[str] = None
    current_location: Optional[str] = None
    workers_assigned: Optional[int] = Field(default=None, ge=1, le=200)
    event_note: Optional[str] = None
    created_by: str = "labor-ui"


class DockAssignLaborRequest(BaseModel):
    labor_id: str
    workers_assigned: Optional[int] = Field(default=None, ge=1, le=200)
    event_note: Optional[str] = None
    created_by: str = "docks-ui"


class DockReleaseResourcesOut(BaseModel):
    labor_released: int
    equipment_released: int


class LaborReadinessOut(BaseModel):
    laborAssigned: bool
    teamId: Optional[str] = None
    teamName: Optional[str] = None
    teamCode: Optional[str] = None


class LaborTeamOut(LaborTeamBase):
    id: UUID
    assigned_dock_id: Optional[UUID] = None
    assigned_vehicle_id: Optional[UUID] = None
    assigned_queue_entry_id: Optional[UUID] = None
    assigned_appointment_id: Optional[UUID] = None
    assigned_since: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class DetentionConfigOut(BaseModel):
    formula: str
    free_hours: float
    standard_rate: int
    hazmat_rate: int
    outside_surcharge_pct: int
    contract_multiplier: float
    company_multiplier: float


class DetentionStatusUpdate(BaseModel):
    status: str
    remarks: Optional[str] = None
    created_by: str = "detention-ui"


class DetentionSummaryOut(BaseModel):
    today: int
    monthToDate: int
    disputedCount: int
    targetedSavings: int
    recordCount: int
    breakdown: list[dict]


class DetentionBundleOut(BaseModel):
    records: list["DetentionOut"]
    summary: DetentionSummaryOut
    config: "DetentionConfigOut"


class DetentionOut(BaseModel):
    id: UUID
    detention_ref: str
    vehicle_id: UUID
    queue_entry_id: Optional[UUID] = None
    appointment_id: Optional[UUID] = None
    billing_date: date
    plate: str
    category: str
    transporter: str
    free_hours: float
    actual_hours: float
    rate: int
    cost: int
    status: str
    remarks: Optional[str] = None
    is_estimated: bool = True
    created_at: datetime
    updated_at: datetime


class DetentionDetailOut(DetentionOut):
    events: list[YardEventOut] = Field(default_factory=list)


class SearchHitOut(BaseModel):
    kind: str
    id: UUID
    label: str
    sub: str
    meta: Optional[str] = None
    payload: dict = Field(default_factory=dict)


class SearchUnavailableOut(BaseModel):
    kind: str
    reason: str


class GlobalSearchOut(BaseModel):
    results: list[SearchHitOut]
    unavailable: list[SearchUnavailableOut] = Field(default_factory=list)


class AuthMeOut(BaseModel):
    user_id: str
    username: str
    display_name: Optional[str] = None
    role: str
    permissions: list[str] = Field(default_factory=list)
    impersonating: bool = False


class RolePermissionsOut(BaseModel):
    role: str
    permissions: list[str]


class LoginIn(BaseModel):
    identity: str = Field(min_length=1, max_length=256)
    password: str = Field(min_length=8, max_length=128)
    remember: bool = False
    username: Optional[str] = Field(default=None, max_length=64)

    @model_validator(mode="before")
    @classmethod
    def resolve_identity(cls, data):
        if isinstance(data, dict) and not str(data.get("identity") or "").strip():
            legacy = str(data.get("username") or "").strip()
            if legacy:
                data = {**data, "identity": legacy}
        return data


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshIn(BaseModel):
    refresh_token: str


class LogoutIn(BaseModel):
    refresh_token: str


class ImpersonateIn(BaseModel):
    role: str = Field(min_length=1, max_length=64)


class AdminUserOut(BaseModel):
    id: str
    full_name: str
    username: str
    email: Optional[str] = None
    role: str
    status: str


class AdminUserCreateIn(BaseModel):
    full_name: str = Field(min_length=1, max_length=128)
    username: str = Field(min_length=1, max_length=64)
    email: Optional[str] = Field(default=None, max_length=256)
    role: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=8, max_length=128)
    status: str = Field(default="active", pattern="^(active|inactive)$")

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        from services.password_policy import validate_password

        validate_password(value)
        return value


class AdminUserUpdateIn(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=128)
    email: Optional[str] = Field(default=None, max_length=256)
    role: Optional[str] = Field(default=None, min_length=1, max_length=64)
    status: Optional[str] = Field(default=None, pattern="^(active|inactive)$")
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        from services.password_policy import validate_password

        validate_password(value)
        return value


class AdminRoleOut(BaseModel):
    id: str
    code: str
    name: str
    display_name: str
    description: Optional[str] = None
    permissions: list[str] = Field(default_factory=list)


class AdminRoleUpdateIn(BaseModel):
    description: Optional[str] = None
    permissions: list[str] = Field(default_factory=list)


class PermissionOut(BaseModel):
    code: str
    description: str
    category: str


class YardZoneCreate(BaseModel):
    zone_name: str = Field(min_length=1, max_length=128)
    zone_type: str
    max_capacity: int = Field(default=1, ge=1, le=500)
    status: str = "ACTIVE"
    description: Optional[str] = None
    remarks: Optional[str] = None
    map_code: Optional[str] = Field(default=None, max_length=8)
    linked_dock_id: Optional[str] = None
    created_by: str = "yard-ui"


class YardZoneUpdate(BaseModel):
    zone_name: Optional[str] = Field(default=None, min_length=1, max_length=128)
    zone_type: Optional[str] = None
    max_capacity: Optional[int] = Field(default=None, ge=1, le=500)
    status: Optional[str] = None
    description: Optional[str] = None
    remarks: Optional[str] = None
    map_code: Optional[str] = Field(default=None, max_length=8)
    linked_dock_id: Optional[str] = None
    event_note: Optional[str] = None
    created_by: str = "yard-ui"


class YardZoneOut(BaseModel):
    id: UUID
    zone_code: str
    zone_name: str
    zone_type: str
    max_capacity: int
    status: str
    description: Optional[str] = None
    remarks: Optional[str] = None
    map_code: Optional[str] = None
    linked_dock_id: Optional[UUID] = None
    is_mandatory: bool = False
    currentOccupancy: int = 0
    availableSlots: int = 0
    occupancyPct: int = 0
    created_at: datetime
    updated_at: datetime
    vehiclesPresent: Optional[list[dict]] = None


class YardDashboardOut(BaseModel):
    totalZones: int
    activeZones: int
    blockedZones: int
    fullZones: int
    maintenanceZones: int
    totalCapacity: int
    currentOccupancy: int
    availableSlots: int
    yardUtilizationPct: float


class OperationsDashboardOut(BaseModel):
    appointmentsToday: int
    vehiclesEnteredToday: int
    vehiclesExitedToday: int
    vehiclesInYard: int
    vehiclesWaiting: int
    vehiclesLoading: int
    vehiclesInExitHolding: int
    avgTurnaroundMinutes: float
    avgWaitingMinutes: float
    avgLoadingMinutes: float
    slaCompliancePct: float


class ControlTowerAlertOut(BaseModel):
    id: str
    alertType: str
    severity: str
    vehicleId: Optional[str] = None
    vehicle: Optional[str] = None
    appointmentId: Optional[str] = None
    appointment: Optional[str] = None
    dockId: Optional[str] = None
    dock: Optional[str] = None
    labor: Optional[str] = None
    equipment: Optional[str] = None
    exceptionType: Optional[str] = None
    exceptionStatus: Optional[str] = None
    durationMin: int = 0
    delayMin: Optional[int] = None
    createdAt: Optional[str] = None
    status: str = "ACTIVE"


class ControlTowerAlertsOut(BaseModel):
    activeAlerts: List[ControlTowerAlertOut]
    criticalCount: int
    warningCount: int


class VehicleZoneHistoryOut(BaseModel):
    id: UUID
    vehicle_id: UUID
    previous_zone_id: Optional[UUID] = None
    new_zone_id: Optional[UUID] = None
    previous_zone_name: Optional[str] = None
    previous_zone_code: Optional[str] = None
    new_zone_name: Optional[str] = None
    new_zone_code: Optional[str] = None
    moved_by: str
    moved_at: datetime
    reason: Optional[str] = None


class MoveVehicleRequest(BaseModel):
    zone_id: str
    reason: Optional[str] = None
    created_by: str = "yard-ui"


class WeighTareRequest(BaseModel):
    weight_kg: float = Field(gt=0, le=200_000)
    created_by: str = "queue-ui"


class WeighGrossRequest(BaseModel):
    weight_kg: float = Field(gt=0, le=200_000)
    created_by: str = "dock-ui"


class WeighingOut(BaseModel):
    queueEntryId: str
    tareWeightKg: Optional[float] = None
    grossWeightKg: Optional[float] = None
    netWeightKg: Optional[float] = None


class QueueOverrideRequest(BaseModel):
    target_rank: int = Field(ge=1, le=500)
    reason: str = Field(min_length=3, max_length=500)
    supervisor: str = Field(min_length=2, max_length=128)
    created_by: str = "supervisor"


class DockRecommendationOut(BaseModel):
    dockId: str
    dockCode: Optional[str] = None
    dockName: Optional[str] = None
    score: int = 0
    materialMatch: bool = False
    laborAvailable: bool = False
    equipmentAvailable: bool = False
    reason: str = ""


class QueueEntryMetricsOut(BaseModel):
    queueEntryId: str
    vehicleId: str
    appointmentId: str
    dockId: Optional[str] = None
    plate: Optional[str] = None
    transporter: Optional[str] = None
    vehicleStatus: Optional[str] = None
    displayStatus: str
    queueRank: int
    waitingMin: int
    detentionCost: int
    detentionRisk: str
    queueAging: str
    priorityScore: int
    expectedCallTime: Optional[str] = None
    dockCode: Optional[str] = None
    dockAssignedSince: Optional[datetime] = None
    laborTeam: Optional[str] = None
    equipment: Optional[str] = None
    material: Optional[str] = None
    gateNumber: Optional[str] = None
    recommendedDock: Optional[DockRecommendationOut] = None
    queueNumber: Optional[str] = None
    queueType: Optional[str] = None
    status: Optional[str] = None
    checkinTime: Optional[datetime] = None
    category: Optional[str] = None
    tareWeightKg: Optional[float] = None
    grossWeightKg: Optional[float] = None
    netWeightKg: Optional[float] = None


class QueueBundleSummaryOut(BaseModel):
    inQueue: int
    avgWaitMin: int
    totalDetentionCost: int
    highPriority: int
    readyToCall: int
    criticalWait: int
    engineNote: str


class QueueBundleOut(BaseModel):
    entries: list[QueueEntryMetricsOut]
    summary: QueueBundleSummaryOut


class QueueEntryDetailOut(BaseModel):
    entry: QueueEntryOut
    vehicle: VehicleOut
    appointment: AppointmentOut
    dock: Optional[DockOut] = None
    readiness: dict
    metrics: QueueEntryMetricsOut
    labor: Optional[dict] = None
    equipment: Optional[dict] = None
    recommendedDock: Optional[DockRecommendationOut] = None


class GateLookupRequest(BaseModel):
    query: str = Field(min_length=1, max_length=128)
    gate_id: str = Field(default="G1", max_length=16)


class GateActionRequest(BaseModel):
    gate_id: str = Field(default="G1", max_length=16)
    created_by: str = Field(default="gate-ui", max_length=64)


class GateRejectRequest(GateActionRequest):
    reason: str = Field(min_length=1, max_length=500)


class GateApproveEntryRequest(GateActionRequest):
    queue_number: Optional[str] = None
    queue_type: str = Field(default="Loading", max_length=64)


class GateClearanceUpdate(BaseModel):
    loading_completed_verified: Optional[bool] = None
    appointment_completed_verified: Optional[bool] = None
    vehicle_verified: Optional[bool] = None
    delivery_document_verified: Optional[bool] = None
    gate_pass_approved: Optional[bool] = None
    invoice_approved: Optional[bool] = None
    security_cleared: Optional[bool] = None
    gate_id: str = Field(default="G1", max_length=16)


class GateVerifyExitRequest(GateActionRequest):
    remarks: Optional[str] = Field(default=None, max_length=1000)


class GateScanRequest(BaseModel):
    query: str = Field(min_length=1, max_length=128)
    gate_id: str = Field(default="G1", max_length=16)
    scan_type: str = Field(default="QR", max_length=32)
    created_by: str = Field(default="gate-ui", max_length=64)


class LoadingExceptionCreate(BaseModel):
    vehicle_id: Optional[str] = None
    appointment_id: Optional[str] = None
    queue_entry_id: Optional[str] = None
    dock_id: Optional[str] = None
    exception_type: str = Field(min_length=1, max_length=64)
    description: Optional[str] = Field(default=None, max_length=2000)
    created_by: str = Field(default="loading-ops-ui", max_length=64)


class LoadingExceptionAssign(BaseModel):
    assigned_to: str = Field(min_length=1, max_length=128)
    created_by: str = Field(default="loading-ops-ui", max_length=64)


class LoadingExceptionResolve(BaseModel):
    resolved_by: str = Field(min_length=1, max_length=128)
    resolution_notes: Optional[str] = Field(default=None, max_length=2000)
    created_by: str = Field(default="loading-ops-ui", max_length=64)


class LoadingExceptionClose(BaseModel):
    closed_by: str = Field(min_length=1, max_length=128)
    created_by: str = Field(default="loading-ops-ui", max_length=64)


class LoadingPauseRequest(BaseModel):
    vehicle_id: Optional[str] = None
    appointment_id: Optional[str] = None
    queue_entry_id: Optional[str] = None
    dock_id: Optional[str] = None
    reason_code: str = Field(min_length=1, max_length=64)
    note: Optional[str] = Field(default=None, max_length=2000)
    created_by: str = Field(default="loading-ops-ui", max_length=64)


class LoadingResumeRequest(BaseModel):
    vehicle_id: Optional[str] = None
    appointment_id: Optional[str] = None
    queue_entry_id: Optional[str] = None
    dock_id: Optional[str] = None
    created_by: str = Field(default="loading-ops-ui", max_length=64)


class LoadingExceptionOut(BaseModel):
    id: UUID
    vehicle_id: Optional[UUID] = None
    appointment_id: Optional[UUID] = None
    queue_entry_id: Optional[UUID] = None
    dock_id: Optional[UUID] = None
    exception_type: str
    status: str
    description: Optional[str] = None
    created_at: datetime
    created_by: str
    assigned_to: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    closed_at: Optional[datetime] = None
    closed_by: Optional[str] = None
    updated_at: datetime


class LoadingPauseStateOut(BaseModel):
    paused: bool
    paused_since: Optional[datetime] = None
    pause_reason: Optional[str] = None
    paused_duration_min: int = 0
    total_paused_min: int = 0


class LoadingCompleteRequest(BaseModel):
    vehicle_id: Optional[str] = None
    appointment_id: Optional[str] = None
    queue_entry_id: Optional[str] = None
    dock_id: Optional[str] = None
    note: Optional[str] = Field(default=None, max_length=2000)
    created_by: str = Field(default="loading-ops-ui", max_length=64)


class LoadingCompleteStateOut(BaseModel):
    awaiting_release: bool = False
    loading_completed: bool = False
    completed_at: Optional[datetime] = None


class JourneyTimelineItemOut(BaseModel):
    eventType: str
    timestamp: Optional[str] = None
    user: Optional[str] = None
    notes: Optional[str] = None
    rawEventType: Optional[str] = None


class JourneySlaOut(BaseModel):
    waitingSlaMet: Optional[bool] = None
    loadingSlaMet: Optional[bool] = None
    turnaroundSlaMet: Optional[bool] = None


class JourneyMetricsOut(BaseModel):
    waitingMinutes: Optional[int] = None
    calledMinutes: Optional[int] = None
    dockAssignmentMinutes: Optional[int] = None
    loadingMinutes: Optional[int] = None
    pausedMinutes: Optional[int] = None
    exitHoldingMinutes: Optional[int] = None
    turnaroundMinutes: Optional[int] = None
    exceptionCount: int = 0
    exceptionResolutionMinutes: Optional[float] = None
    sla: JourneySlaOut


class JourneySummaryOut(BaseModel):
    vehicleNumber: Optional[str] = None
    appointmentRef: Optional[str] = None
    transporter: Optional[str] = None
    driver: Optional[str] = None
    dockCode: Optional[str] = None
    operationType: Optional[str] = None
    material: Optional[str] = None


class VehicleJourneyReportOut(BaseModel):
    vehicle: dict
    appointment: Optional[dict] = None
    queue: Optional[dict] = None
    dock: Optional[dict] = None
    labor: List[dict] = []
    equipment: List[dict] = []
    exceptions: List[dict] = []
    timeline: List[JourneyTimelineItemOut]
    metrics: JourneyMetricsOut
    summary: JourneySummaryOut


class DockUtilizationRowOut(BaseModel):
    dockId: str
    dockCode: Optional[str] = None
    dockName: Optional[str] = None
    zone: Optional[str] = None
    vehiclesHandled: int = 0
    occupiedMinutes: int = 0
    idleMinutes: int = 0
    utilizationPct: float = 0.0
    avgServiceMinutes: float = 0.0
    avgDelayMinutes: float = 0.0


class DockUtilizationReportOut(BaseModel):
    rows: List[DockUtilizationRowOut]
    dateFrom: Optional[str] = None
    dateTo: Optional[str] = None


class LaborProductivityRowOut(BaseModel):
    laborId: str
    teamCode: Optional[str] = None
    teamName: Optional[str] = None
    assignments: int = 0
    vehiclesServed: int = 0
    loadingMinutes: int = 0
    pausedMinutes: int = 0
    exceptionsHandled: int = 0
    utilizationPct: float = 0.0


class LaborProductivityReportOut(BaseModel):
    rows: List[LaborProductivityRowOut]


class EquipmentUtilizationRowOut(BaseModel):
    equipmentId: str
    equipmentCode: Optional[str] = None
    equipmentName: Optional[str] = None
    assignments: int = 0
    usageMinutes: int = 0
    idleMinutes: int = 0
    loadingMinutes: int = 0
    utilizationPct: float = 0.0


class EquipmentUtilizationReportOut(BaseModel):
    rows: List[EquipmentUtilizationRowOut]


class DelayAnalysisRowOut(BaseModel):
    category: str
    categoryKey: str
    count: int = 0
    avgDelayMinutes: float = 0.0
    worstDelayMinutes: int = 0
    affectedVehicles: int = 0


class DelayAnalysisReportOut(BaseModel):
    rows: List[DelayAnalysisRowOut]


class SlaBreakdownRowOut(BaseModel):
    label: str
    key: str
    evaluated: int = 0
    compliant: int = 0
    slaPct: float = 0.0


class SlaComplianceReportOut(BaseModel):
    waitingSlaPct: float = 0.0
    loadingSlaPct: float = 0.0
    turnaroundSlaPct: float = 0.0
    overallSlaPct: float = 0.0
    byDock: List[SlaBreakdownRowOut] = []
    byLaborTeam: List[SlaBreakdownRowOut] = []
    byEquipment: List[SlaBreakdownRowOut] = []
    byMaterialType: List[SlaBreakdownRowOut] = []
