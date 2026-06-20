"""Default YMS demo accounts — email + password format matches Shipgen console rules."""

from __future__ import annotations

YMS_DEMO_PASSWORD = "Shipgen@Yms2026!"

DEFAULT_DEMO_USERS: tuple[dict[str, str], ...] = (
    {
        "email": "yard.admin@shipgen.demo",
        "username": "yard_admin",
        "password": YMS_DEMO_PASSWORD,
        "display_name": "Yard Administrator",
        "role": "yard_admin",
        "legacy_username": "admin",
    },
    {
        "email": "yard.manager@shipgen.demo",
        "username": "yard_manager",
        "password": YMS_DEMO_PASSWORD,
        "display_name": "Yard Manager",
        "role": "yard_manager",
        "legacy_username": "manager",
    },
    {
        "email": "yard.gate@shipgen.demo",
        "username": "yard_gate",
        "password": YMS_DEMO_PASSWORD,
        "display_name": "Gate Operator",
        "role": "gate_operator",
        "legacy_username": "gate",
    },
    {
        "email": "yard.coordinator@shipgen.demo",
        "username": "yard_coordinator",
        "password": YMS_DEMO_PASSWORD,
        "display_name": "Yard Coordinator",
        "role": "yard_coordinator",
        "legacy_username": "coordinator",
    },
    {
        "email": "yard.supervisor@shipgen.demo",
        "username": "yard_supervisor",
        "password": YMS_DEMO_PASSWORD,
        "display_name": "Dock Supervisor",
        "role": "dock_supervisor",
        "legacy_username": "supervisor",
    },
)
