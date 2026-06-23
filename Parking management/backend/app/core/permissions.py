ROLE_PERMISSIONS: dict[str, list[str]] = {
    "supervisor": [
        "dashboard.view",
        "parking.status.view",
        "vehicle.monitoring",
        "entry_exit.monitoring",
        "recent.tickets",
        "qr.monitoring",
        "reports.view",
        "operator.activity",
        "vehicle.search",
        "occupancy.analytics",
        "floors.monitor",
    ],
    "operator": [
        "dashboard.view",
        "tickets.create",
        "payments.collect",
        "qr.print",
        "vehicle.search",
        "recent.tickets",
        "settings.manage",
        "floors.summary",
    ],
}

ROLE_PERMISSIONS["admin"] = sorted(
    set(ROLE_PERMISSIONS["supervisor"] + ROLE_PERMISSIONS["operator"] + [
        "parking.manage",
        "floors.manage",
        "reports.admin",
        "users.manage",
        "roles.manage",
        "pricing.configure",
        "hardware.configure",
        "audit.view",
        "system.configure",
        "security.settings",
    ])
)

ALL_PERMISSIONS = sorted({permission for permissions in ROLE_PERMISSIONS.values() for permission in permissions})
