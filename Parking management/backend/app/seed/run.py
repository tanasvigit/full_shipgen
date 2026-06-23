from decimal import Decimal

from sqlalchemy import select

from app.core.database import Base, SessionLocal, engine
from app.core.permissions import ALL_PERMISSIONS, ROLE_PERMISSIONS
from app.core.security import hash_password
from app.models.audit import AuditLog
from app.models.auth import Permission, Role, role_permissions_table
from app.models.hardware import HardwareDevice
from app.models.monitoring import QrScanEvent, SupervisorAlert
from app.models.parking import ParkingFloor, ParkingFloorCapacity
from app.models.pricing import PricingRule
from app.models.ticket import Ticket
from app.models.user import User


def seed_roles_and_permissions(db) -> dict[str, Role]:
    roles: dict[str, Role] = {}
    permissions_by_code: dict[str, Permission] = {}
    for code in ALL_PERMISSIONS:
        permission = db.scalar(select(Permission).where(Permission.code == code))
        if not permission:
            permission = Permission(code=code)
            db.add(permission)
            db.flush()
        permissions_by_code[code] = permission
    for role_name, permission_codes in ROLE_PERMISSIONS.items():
        role = db.scalar(select(Role).where(Role.name == role_name))
        if not role:
            role = Role(name=role_name)
            db.add(role)
            db.flush()
        role.permissions = [permissions_by_code[code] for code in permission_codes]
        roles[role_name] = role
    db.commit()
    return roles


def seed_users(db, roles: dict[str, Role]) -> None:
    users = [
        ("U001", "Rajesh Kumar", "admin@parkflow.com", "admin123", "admin"),
        ("U007", "Sunil Mehta", "supervisor@parkflow.com", "supervisor123", "supervisor"),
        ("U002", "Priya Sharma", "operator@parkflow.com", "operator123", "operator"),
        ("U003", "Amit Patel", "amit@parkflow.com", "operator123", "operator"),
        ("U005", "Vikram Singh", "vikram@parkflow.com", "operator123", "operator"),
        ("P001", "Parking Admin", "parking.admin@shipgen.demo", "admin123", "admin"),
        ("P002", "Parking Supervisor", "parking.supervisor@shipgen.demo", "supervisor123", "supervisor"),
        ("P003", "Parking Operator", "parking.operator@shipgen.demo", "operator123", "operator"),
    ]
    for external_code, name, email, password, role_name in users:
        if db.scalar(select(User).where(User.email == email)):
            continue
        db.add(
            User(
                external_code=external_code,
                name=name,
                email=email,
                password_hash=hash_password(password),
                status="active",
                role_id=roles[role_name].id,
            )
        )
    db.commit()


def seed_floors(db) -> None:
    if db.scalar(select(ParkingFloor).limit(1)):
        return
    floors = [
        (1, "Floor 1", (80, 62), (60, 48), (10, 4)),
        (2, "Floor 2", (70, 55), (55, 40), (8, 6)),
        (3, "Floor 3", (65, 65), (50, 50), (6, 6)),
        (4, "Basement", (90, 24), (45, 12), (12, 2)),
    ]
    for floor_number, floor_name, two, four, heavy in floors:
        floor = ParkingFloor(floor_number=floor_number, floor_name=floor_name)
        db.add(floor)
        db.flush()
        for key, stats in (("two_wheeler", two), ("four_wheeler", four), ("heavy_vehicle", heavy)):
            db.add(ParkingFloorCapacity(floor_id=floor.id, category_key=key, capacity=stats[0], occupied=stats[1]))
    db.commit()


def seed_pricing(db) -> None:
    rules = [
        ("PR001", "2 Wheeler", 20, 10, 100),
        ("PR002", "4 Wheeler", 50, 20, 300),
        ("PR003", "Heavy Vehicles", 100, 50, 500),
        ("PR004", "Free Entry", 0, 0, 0),
    ]
    for external_code, category, base, per_hour, max_daily in rules:
        if db.scalar(select(PricingRule).where(PricingRule.category == category)):
            continue
        db.add(
            PricingRule(
                external_code=external_code,
                category=category,
                base_price=Decimal(base),
                per_hour=Decimal(per_hour),
                max_daily=Decimal(max_daily),
                is_active=True,
            )
        )
    db.commit()


def seed_hardware(db) -> None:
    devices = [
        ("HW002", "Exit QR Scanner", "QR Scanner", "Online", "Main Gate Exit"),
        ("HW003", "Boom Barrier", "Boom Barrier", "Online", "Main Gate"),
        ("HW004", "Thermal Printer", "Thermal Printer", "Offline", "Operator Desk"),
        ("HW005", "Network Controller", "Network Controller", "Online", "Server Room"),
    ]
    for external_code, name, device_type, status, location in devices:
        if db.scalar(select(HardwareDevice).where(HardwareDevice.external_code == external_code)):
            continue
        db.add(
            HardwareDevice(
                external_code=external_code,
                name=name,
                type=device_type,
                status=status,
                location=location,
            )
        )
    db.commit()


def seed_monitoring(db) -> None:
    if db.scalar(select(SupervisorAlert).limit(1)):
        return
    alerts = [
        ("high", "Exit lane congestion", "Average exit wait time exceeded 6 minutes at Main Gate Exit."),
        ("medium", "Thermal printer offline", "Operator desk printer has not responded for 15 minutes."),
        ("low", "Unpaid ticket backlog", "4 unpaid tickets are pending collection for more than 30 minutes."),
    ]
    for severity, title, detail in alerts:
        db.add(SupervisorAlert(severity=severity, title=title, detail=detail))
    scans = [
        ("PK102391", "AP31CD9988", "Entry Scan", "Valid"),
        ("PK102392", "TS09XY4455", "Entry Scan", "Valid"),
        ("PK102390", "KA01AB1234", "Exit Scan", "Invalid"),
    ]
    for ticket_code, vehicle, action, status in scans:
        db.add(QrScanEvent(ticket_code=ticket_code, vehicle_number=vehicle, action=action, status=status))
    db.commit()


def seed_audit_logs(db) -> None:
    if db.scalar(select(AuditLog).limit(1)):
        return
    db.add(
        AuditLog(
            action="User Login",
            user_name="Rajesh Kumar",
            role="admin",
            details="Admin logged in during seed",
        )
    )
    db.commit()


def run() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        roles = seed_roles_and_permissions(db)
        seed_users(db, roles)
        seed_floors(db)
        seed_pricing(db)
        seed_hardware(db)
        seed_monitoring(db)
        seed_audit_logs(db)
        print("Seed completed.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
