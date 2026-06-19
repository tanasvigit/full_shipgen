OWNERSHIP_TYPES = {"company", "contract", "outside"}

YMS_STATUSES = {
    "DRAFT",
    "SCHEDULED",
    "ARRIVED",
    "CHECKED_IN",
    "WAITING",
    "CALLED",
    "DOCK_ASSIGNED",
    "RESOURCE_PENDING",
    "READY_FOR_LOADING",
    "LOADING",
    "COMPLETED",
    "EXIT_HOLDING",
    "EXIT_VERIFIED",
    "EXITED",
    "CANCELLED",
}

DOCK_STATUSES = {"AVAILABLE", "OCCUPIED", "MAINTENANCE", "BLOCKED", "OUT_OF_SERVICE"}

# Vehicle readiness states (also listed in YMS_STATUSES)
DOCK_STATUSES_FUTURE = {"RESOURCE_PENDING", "READY_FOR_LOADING"}

DOCK_TYPES = {
    "LOADING",
    "UNLOADING",
    "MIXED",
    "HAZMAT",
    "COLD_CHAIN",
    "CONTAINER",
    "GENERAL",
    "CUSTOM",
}

DOCK_ZONES = {"Zone A", "Zone B", "Zone C", "Zone D", "Zone E", "Zone F"}

DOCK_VEHICLE_TYPES = {
    "TRUCK",
    "TRAILER",
    "CONTAINER",
    "TANKER",
    "LCV",
    "TEMPO",
    "CUSTOM",
}

# Alias for vehicle registry UI (same values as dock vehicle types)
VEHICLE_TYPES = DOCK_VEHICLE_TYPES

OPERATION_TYPES = {"Loading", "Unloading", "Transit", "Inter-Warehouse"}

REGISTRATION_SOURCES = {"appointment", "manual"}

# Display labels for vehicle journey stages (table + drawer)
VEHICLE_STAGE_LABELS = {
    "SCHEDULED": "Scheduled",
    "EN_ROUTE": "En Route",
    "APPROACHING": "Approaching",
    "ARRIVED": "Arrived",
    "CHECKED_IN": "Checked In",
    "WAITING": "Waiting",
    "CALLED": "Called",
    "DOCK_ASSIGNED": "Dock Assigned",
    "RESOURCE_PENDING": "Resource Pending",
    "READY_FOR_LOADING": "Ready For Loading",
    "LOADING": "Loading",
    "COMPLETED": "Completed",
    "EXIT_HOLDING": "Exit Holding",
    "EXIT_VERIFIED": "Exit Verified",
    "EXITED": "Exited",
    "CANCELLED": "Cancelled",
}

DOCK_MATERIAL_TYPES = {
    "GENERAL",
    "BAGS",
    "PALLETS",
    "STEEL",
    "CEMENT",
    "CHEMICALS",
    "HAZMAT",
    "PHARMA",
    "COLD_CHAIN",
    "CONTAINERS",
    "CUSTOM",
}

EQUIPMENT_STATUSES = {"IDLE", "ASSIGNED", "IN_USE", "MAINTENANCE", "CHARGING", "OUT_OF_SERVICE"}

EQUIPMENT_STATUS_TRANSITIONS = {
    "IDLE": {"ASSIGNED", "IN_USE", "MAINTENANCE", "CHARGING", "OUT_OF_SERVICE"},
    "ASSIGNED": {"IN_USE", "IDLE", "MAINTENANCE", "OUT_OF_SERVICE"},
    "IN_USE": {"IDLE", "ASSIGNED", "MAINTENANCE"},
    "MAINTENANCE": {"IDLE", "OUT_OF_SERVICE", "CHARGING"},
    "CHARGING": {"IDLE", "MAINTENANCE"},
    "OUT_OF_SERVICE": {"MAINTENANCE", "IDLE"},
}

# Minimum battery % required to assign equipment to a dock/operation
EQUIPMENT_MIN_ASSIGN_BATTERY = 20

EQUIPMENT_TYPES = {
    "FORKLIFT",
    "CRANE",
    "REACH_STACKER",
    "PALLET_JACK",
    "HAND_TRUCK",
    "CONVEYOR",
    "LOADER",
    "STACKER",
    "CUSTOM",
}

LABOR_STATUSES = {"ON_DUTY", "OFF_DUTY", "ASSIGNED", "AVAILABLE", "BREAK", "UNAVAILABLE"}

LABOR_MATERIAL_TYPES = {
    "GENERAL",
    "BAGS",
    "PALLETS",
    "STEEL",
    "CEMENT",
    "CHEMICALS",
    "HAZMAT",
    "PHARMA",
    "COLD_CHAIN",
    "CONTAINERS",
    "CUSTOM",
}

# Legacy — kept for backward-compatible DB reads only
LABOR_TEAM_TYPES = LABOR_MATERIAL_TYPES

DETENTION_STATUSES = {"Pending", "Approved", "Disputed", "Paid", "Reviewed"}

DETENTION_STATUS_TRANSITIONS = {
    "Pending": {"Approved", "Disputed", "Reviewed"},
    "Reviewed": {"Approved", "Disputed", "Paid"},
    "Approved": {"Paid", "Disputed"},
    "Disputed": {"Approved", "Reviewed", "Paid"},
    "Paid": set(),
}

LABOR_STATUS_TRANSITIONS = {
    "ON_DUTY": {"ASSIGNED", "AVAILABLE", "BREAK", "OFF_DUTY", "UNAVAILABLE"},
    "OFF_DUTY": {"ON_DUTY", "AVAILABLE"},
    "ASSIGNED": {"ON_DUTY", "AVAILABLE", "BREAK", "UNAVAILABLE"},
    "AVAILABLE": {"ASSIGNED", "ON_DUTY", "BREAK", "OFF_DUTY", "UNAVAILABLE"},
    "BREAK": {"ON_DUTY", "AVAILABLE", "OFF_DUTY"},
    "UNAVAILABLE": {"ON_DUTY", "OFF_DUTY"},
}

STATUS_TRANSITIONS = {
    "DRAFT": {"SCHEDULED", "CANCELLED"},
    "SCHEDULED": {"ARRIVED", "CHECKED_IN", "CANCELLED"},
    "ARRIVED": {"CHECKED_IN", "WAITING", "CANCELLED"},
    "CHECKED_IN": {"WAITING", "CANCELLED"},
    "WAITING": {"CALLED", "DOCK_ASSIGNED", "CANCELLED"},
    "CALLED": {"DOCK_ASSIGNED", "CANCELLED"},
    "DOCK_ASSIGNED": {"RESOURCE_PENDING", "READY_FOR_LOADING", "CANCELLED"},
    "RESOURCE_PENDING": {"READY_FOR_LOADING", "CANCELLED"},
    "READY_FOR_LOADING": {"LOADING", "RESOURCE_PENDING", "CANCELLED"},
    "LOADING": {"COMPLETED", "CANCELLED"},
    "COMPLETED": {"EXIT_HOLDING"},
    "EXIT_HOLDING": {"EXIT_VERIFIED"},
    "EXIT_VERIFIED": {"EXITED"},
    "EXITED": set(),
    "CANCELLED": set(),
}

# Allowed via POST /flow/vehicles/{id}/transition (gate uses transition_vehicle_status directly for exit)
FLOW_VEHICLE_TRANSITION_STATUSES = frozenset({"LOADING", "COMPLETED", "CANCELLED"})

# Operational lifecycle — must not be set via direct PATCH; use workflow services.
OPERATIONAL_LIFECYCLE_STATUSES = frozenset(
    {
        "ARRIVED",
        "CHECKED_IN",
        "WAITING",
        "CALLED",
        "DOCK_ASSIGNED",
        "RESOURCE_PENDING",
        "READY_FOR_LOADING",
        "LOADING",
        "COMPLETED",
        "EXIT_HOLDING",
        "EXIT_VERIFIED",
        "EXITED",
    }
)

# Scheduling / cancellation targets permitted on direct PATCH (appointments, vehicles).
DIRECT_PATCH_STATUS_TARGETS = frozenset({"DRAFT", "SCHEDULED", "CANCELLED"})

# Dock statuses that block loading at an assigned dock
DOCK_INACTIVE_FOR_LOADING = {"MAINTENANCE", "BLOCKED", "OUT_OF_SERVICE"}

# Queue rows tied to a dock through resource gating / loading (include readiness stages)
ACTIVE_DOCK_QUEUE_STATUSES = (
    "CALLED",
    "DOCK_ASSIGNED",
    "RESOURCE_PENDING",
    "READY_FOR_LOADING",
    "LOADING",
)

YARD_ZONE_TYPES = {
    "LOADING",
    "UNLOADING",
    "DOCUMENTATION",
    "WAITING_AREA",
    "STAGING",
    "HAZMAT",
    "COLD_CHAIN",
    "EMERGENCY_HOLDING",
    "EXIT_HOLDING",
    "GATE_IN",
    "GATE_OUT",
    "CUSTOM",
}

YARD_ZONE_STATUSES = {"ACTIVE", "FULL", "BLOCKED", "MAINTENANCE"}

MANDATORY_YARD_ZONE_TYPES = {"GATE_IN", "GATE_OUT", "WAITING_AREA", "EXIT_HOLDING"}
