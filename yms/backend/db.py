import os
from pathlib import Path

import asyncpg
from dotenv import load_dotenv


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

database_url = os.environ["DATABASE_URL"]
db_pool: asyncpg.Pool | None = None


def get_pool() -> asyncpg.Pool:
    if db_pool is None:
        raise RuntimeError("Database pool is not initialized")
    return db_pool


async def init_db() -> None:
    global db_pool
    db_pool = await asyncpg.create_pool(database_url)
    await create_schema()


async def close_db() -> None:
    if db_pool is not None:
        await db_pool.close()


async def create_schema() -> None:
    pool = get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS status_checks (
                id UUID PRIMARY KEY,
                client_name TEXT NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL
            );
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS vehicles (
                id UUID PRIMARY KEY,
                vehicle_number TEXT NOT NULL UNIQUE,
                vehicle_type TEXT NOT NULL,
                ownership_type TEXT NOT NULL CHECK (ownership_type IN ('company', 'contract', 'outside')),
                transporter_name TEXT NOT NULL,
                driver_name TEXT NOT NULL,
                driver_phone TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS appointments (
                id UUID PRIMARY KEY,
                booking_reference TEXT NOT NULL UNIQUE,
                vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
                customer_name TEXT NOT NULL,
                shipment_reference TEXT NOT NULL,
                booking_date DATE NOT NULL,
                reporting_time TIMESTAMPTZ NOT NULL,
                scheduled_slot TEXT NOT NULL,
                gate_number TEXT NOT NULL,
                priority INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL,
                remarks TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS docks (
                id UUID PRIMARY KEY,
                dock_code TEXT NOT NULL UNIQUE,
                dock_name TEXT NOT NULL,
                dock_type TEXT NOT NULL,
                supported_vehicle_types TEXT[] NOT NULL DEFAULT '{}',
                supported_cargo_types TEXT[] NOT NULL DEFAULT '{}',
                status TEXT NOT NULL,
                current_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS queue_entries (
                id UUID PRIMARY KEY,
                appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE RESTRICT,
                vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
                queue_number TEXT NOT NULL UNIQUE,
                queue_type TEXT NOT NULL,
                priority_score INTEGER NOT NULL,
                checkin_time TIMESTAMPTZ,
                called_time TIMESTAMPTZ,
                dock_assigned_time TIMESTAMPTZ,
                dock_id UUID REFERENCES docks(id) ON DELETE SET NULL,
                status TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS equipment (
                id UUID PRIMARY KEY,
                equipment_code TEXT NOT NULL UNIQUE,
                equipment_type TEXT NOT NULL,
                model TEXT NOT NULL,
                status TEXT NOT NULL,
                battery_level INTEGER,
                operator_name TEXT,
                current_location TEXT,
                assigned_dock_id UUID REFERENCES docks(id) ON DELETE SET NULL,
                assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
                maintenance_due DATE,
                notes TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS labor_teams (
                id UUID PRIMARY KEY,
                team_code TEXT NOT NULL UNIQUE,
                team_name TEXT NOT NULL,
                shift_start TEXT NOT NULL,
                shift_end TEXT NOT NULL,
                members_count INTEGER NOT NULL DEFAULT 0,
                available_count INTEGER NOT NULL DEFAULT 0,
                assigned_count INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL,
                supervisor_name TEXT,
                current_assignment TEXT,
                current_location TEXT,
                assigned_dock_id UUID REFERENCES docks(id) ON DELETE SET NULL,
                assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
                notes TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS detention_records (
                id UUID PRIMARY KEY,
                detention_ref TEXT NOT NULL UNIQUE,
                vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
                queue_entry_id UUID REFERENCES queue_entries(id) ON DELETE SET NULL,
                appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
                billing_date DATE NOT NULL,
                plate TEXT NOT NULL,
                category TEXT NOT NULL,
                transporter TEXT NOT NULL,
                free_hours NUMERIC(6, 2) NOT NULL DEFAULT 2,
                actual_hours NUMERIC(6, 2) NOT NULL,
                rate INTEGER NOT NULL,
                cost INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'Pending',
                remarks TEXT,
                is_estimated BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS yard_events (
                id UUID PRIMARY KEY,
                vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
                appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
                queue_entry_id UUID REFERENCES queue_entries(id) ON DELETE SET NULL,
                dock_id UUID REFERENCES docks(id) ON DELETE SET NULL,
                equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
                labor_id UUID REFERENCES labor_teams(id) ON DELETE SET NULL,
                event_type TEXT NOT NULL,
                event_time TIMESTAMPTZ NOT NULL,
                event_note TEXT,
                created_by TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            "ALTER TABLE yard_events ADD COLUMN IF NOT EXISTS equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL;"
        )
        await conn.execute(
            "ALTER TABLE yard_events ADD COLUMN IF NOT EXISTS labor_id UUID REFERENCES labor_teams(id) ON DELETE SET NULL;"
        )

        await conn.execute("CREATE INDEX IF NOT EXISTS idx_vehicles_vehicle_number ON vehicles(vehicle_number);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_appointments_booking_reference ON appointments(booking_reference);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_number ON queue_entries(queue_number);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON queue_entries(status);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_docks_dock_code ON docks(dock_code);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_docks_status ON docks(status);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_yard_events_event_time ON yard_events(event_time DESC);")
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS loading_operation_exceptions (
                id UUID PRIMARY KEY,
                vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
                appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
                queue_entry_id UUID REFERENCES queue_entries(id) ON DELETE SET NULL,
                dock_id UUID REFERENCES docks(id) ON DELETE SET NULL,
                exception_type TEXT NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
                description TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                created_by TEXT NOT NULL,
                assigned_to TEXT,
                resolved_at TIMESTAMPTZ,
                resolved_by TEXT,
                resolution_notes TEXT,
                closed_at TIMESTAMPTZ,
                closed_by TEXT,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_loading_exceptions_status ON loading_operation_exceptions(status);"
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_loading_exceptions_vehicle ON loading_operation_exceptions(vehicle_id);"
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_loading_exceptions_queue ON loading_operation_exceptions(queue_entry_id);"
        )
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_equipment_code ON equipment(equipment_code);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_equipment_assigned_dock ON equipment(assigned_dock_id);")
        await conn.execute(
            "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS equipment_name TEXT;"
        )
        await conn.execute(
            "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS asset_number TEXT;"
        )
        await conn.execute(
            "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS assigned_since TIMESTAMPTZ;"
        )
        await conn.execute(
            "ALTER TABLE equipment ADD COLUMN IF NOT EXISTS assigned_queue_entry_id UUID REFERENCES queue_entries(id) ON DELETE SET NULL;"
        )
        await conn.execute(
            """
            UPDATE equipment
            SET equipment_name = COALESCE(NULLIF(TRIM(equipment_name), ''), equipment_code || ' · ' || equipment_type)
            WHERE equipment_name IS NULL OR TRIM(equipment_name) = '';
            """
        )
        await conn.execute("ALTER TABLE docks ADD COLUMN IF NOT EXISTS zone TEXT;")
        await conn.execute(
            "ALTER TABLE docks ADD COLUMN IF NOT EXISTS max_capacity INTEGER NOT NULL DEFAULT 1;"
        )
        await conn.execute("ALTER TABLE docks ADD COLUMN IF NOT EXISTS notes TEXT;")
        await conn.execute(
            "ALTER TABLE docks ADD COLUMN IF NOT EXISTS assigned_since TIMESTAMPTZ;"
        )
        await conn.execute(
            "ALTER TABLE docks ADD COLUMN IF NOT EXISTS estimated_service_time_min INTEGER NOT NULL DEFAULT 90;"
        )
        await conn.execute(
            "ALTER TABLE docks ADD COLUMN IF NOT EXISTS default_labor_id UUID REFERENCES labor_teams(id) ON DELETE SET NULL;"
        )
        await conn.execute(
            "ALTER TABLE docks ADD COLUMN IF NOT EXISTS default_equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL;"
        )
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_labor_teams_code ON labor_teams(team_code);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_labor_teams_status ON labor_teams(status);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_labor_teams_assigned_dock ON labor_teams(assigned_dock_id);")
        await conn.execute(
            "ALTER TABLE labor_teams ADD COLUMN IF NOT EXISTS supervisor_phone TEXT;"
        )
        await conn.execute(
            "ALTER TABLE labor_teams ADD COLUMN IF NOT EXISTS team_type TEXT NOT NULL DEFAULT 'GENERAL';"
        )
        await conn.execute(
            "ALTER TABLE labor_teams ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}';"
        )
        await conn.execute(
            "ALTER TABLE labor_teams ADD COLUMN IF NOT EXISTS assigned_since TIMESTAMPTZ;"
        )
        await conn.execute(
            """
            ALTER TABLE labor_teams
            ADD COLUMN IF NOT EXISTS assigned_queue_entry_id UUID
            REFERENCES queue_entries(id) ON DELETE SET NULL;
            """
        )
        await conn.execute(
            """
            ALTER TABLE labor_teams
            ADD COLUMN IF NOT EXISTS assigned_appointment_id UUID
            REFERENCES appointments(id) ON DELETE SET NULL;
            """
        )
        await conn.execute(
            """
            ALTER TABLE equipment
            ADD COLUMN IF NOT EXISTS assigned_appointment_id UUID
            REFERENCES appointments(id) ON DELETE SET NULL;
            """
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_labor_teams_assigned_vehicle ON labor_teams(assigned_vehicle_id);"
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_labor_teams_team_type ON labor_teams(team_type);"
        )
        await conn.execute(
            "ALTER TABLE labor_teams ADD COLUMN IF NOT EXISTS material_type TEXT NOT NULL DEFAULT 'GENERAL';"
        )
        await conn.execute(
            """
            UPDATE labor_teams
            SET material_type = CASE
                WHEN team_type IN ('HAZMAT', 'COLD_CHAIN', 'GENERAL') THEN team_type
                WHEN team_type = 'LOADING' THEN 'PALLETS'
                WHEN team_type = 'UNLOADING' THEN 'GENERAL'
                ELSE COALESCE(team_type, 'GENERAL')
            END
            WHERE material_type IS NULL OR material_type = 'GENERAL';
            """
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_labor_teams_material_type ON labor_teams(material_type);"
        )
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_detention_ref ON detention_records(detention_ref);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_detention_status ON detention_records(status);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_detention_billing_date ON detention_records(billing_date);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_detention_vehicle ON detention_records(vehicle_id);")

        await conn.execute(
            """
            UPDATE queue_entries
            SET dock_id = NULL, updated_at = NOW()
            WHERE dock_id IS NOT NULL
              AND status IN ('EXITED', 'COMPLETED', 'CANCELLED', 'EXIT_HOLDING', 'EXIT_VERIFIED')
            """
        )

        await conn.execute(
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ;"
        )
        await conn.execute(
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS exit_time TIMESTAMPTZ;"
        )
        await conn.execute(
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS exited_by TEXT;"
        )
        await conn.execute(
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS exit_gate_id TEXT;"
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS gate_verifications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
                appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
                gate_id TEXT NOT NULL DEFAULT 'G1',
                gate_pass_approved BOOLEAN NOT NULL DEFAULT FALSE,
                invoice_approved BOOLEAN NOT NULL DEFAULT FALSE,
                security_cleared BOOLEAN NOT NULL DEFAULT FALSE,
                entry_approved_at TIMESTAMPTZ,
                entry_rejected_at TIMESTAMPTZ,
                exit_approved_at TIMESTAMPTZ,
                exit_rejected_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (vehicle_id, appointment_id)
            );
            """
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_gate_verifications_vehicle ON gate_verifications(vehicle_id);"
        )
        await conn.execute(
            "ALTER TABLE gate_verifications ADD COLUMN IF NOT EXISTS vehicle_verified BOOLEAN NOT NULL DEFAULT FALSE;"
        )
        await conn.execute(
            "ALTER TABLE gate_verifications ADD COLUMN IF NOT EXISTS delivery_document_verified BOOLEAN NOT NULL DEFAULT FALSE;"
        )
        await conn.execute(
            "ALTER TABLE gate_verifications ADD COLUMN IF NOT EXISTS verified_by TEXT;"
        )
        await conn.execute(
            "ALTER TABLE gate_verifications ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;"
        )
        await conn.execute(
            "ALTER TABLE gate_verifications ADD COLUMN IF NOT EXISTS exit_remarks TEXT;"
        )
        await conn.execute(
            "ALTER TABLE gate_verifications ADD COLUMN IF NOT EXISTS loading_completed_verified BOOLEAN NOT NULL DEFAULT FALSE;"
        )
        await conn.execute(
            "ALTER TABLE gate_verifications ADD COLUMN IF NOT EXISTS appointment_completed_verified BOOLEAN NOT NULL DEFAULT FALSE;"
        )
        await conn.execute(
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS exit_holding_at TIMESTAMPTZ;"
        )
        await conn.execute(
            """
            UPDATE vehicles SET status = 'EXIT_HOLDING'
            WHERE status = 'COMPLETED';
            """
        )
        await conn.execute(
            """
            UPDATE appointments SET status = 'EXIT_HOLDING'
            WHERE status = 'COMPLETED';
            """
        )
        await conn.execute(
            """
            UPDATE queue_entries SET status = 'EXIT_HOLDING'
            WHERE status = 'COMPLETED';
            """
        )

        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS yard_zones (
                id UUID PRIMARY KEY,
                zone_code TEXT NOT NULL UNIQUE,
                zone_name TEXT NOT NULL,
                zone_type TEXT NOT NULL,
                max_capacity INTEGER NOT NULL DEFAULT 1 CHECK (max_capacity >= 1),
                status TEXT NOT NULL DEFAULT 'ACTIVE',
                description TEXT,
                remarks TEXT,
                map_code TEXT,
                linked_dock_id UUID REFERENCES docks(id) ON DELETE SET NULL,
                is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS vehicle_zone_history (
                id UUID PRIMARY KEY,
                vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
                previous_zone_id UUID REFERENCES yard_zones(id) ON DELETE SET NULL,
                new_zone_id UUID REFERENCES yard_zones(id) ON DELETE SET NULL,
                moved_by TEXT NOT NULL,
                moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                reason TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS zone_rules (
                id UUID PRIMARY KEY,
                zone_type TEXT NOT NULL,
                rule_key TEXT NOT NULL,
                rule_value TEXT NOT NULL,
                description TEXT,
                active BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE (zone_type, rule_key)
            );
            """
        )
        await conn.execute(
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS current_zone_id UUID REFERENCES yard_zones(id) ON DELETE SET NULL;"
        )
        await conn.execute(
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS vehicle_reference TEXT UNIQUE;"
        )
        await conn.execute(
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS display_name TEXT;"
        )
        await conn.execute(
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS operation_type TEXT NOT NULL DEFAULT 'Loading';"
        )
        await conn.execute(
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS material_type TEXT NOT NULL DEFAULT 'GENERAL';"
        )
        await conn.execute(
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS expected_arrival TIMESTAMPTZ;"
        )
        await conn.execute(
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS remarks TEXT;"
        )
        await conn.execute(
            "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_source TEXT NOT NULL DEFAULT 'manual';"
        )
        await conn.execute(
            "ALTER TABLE vehicles ALTER COLUMN driver_name DROP NOT NULL;"
        )
        await conn.execute(
            "ALTER TABLE vehicles ALTER COLUMN driver_phone DROP NOT NULL;"
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_vehicles_reference ON vehicles(vehicle_reference);"
        )
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_yard_zones_code ON yard_zones(zone_code);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_yard_zones_type ON yard_zones(zone_type);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_yard_zones_status ON yard_zones(status);")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_vehicles_current_zone ON vehicles(current_zone_id);")
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_vehicle_zone_history_vehicle ON vehicle_zone_history(vehicle_id, moved_at DESC);"
        )

        await _ensure_yard_zones(conn)
        zone_count = await conn.fetchval("SELECT COUNT(*)::int FROM zone_rules")
        if zone_count == 0:
            await _seed_zone_rules(conn)
        from services.yard_service import reconcile_vehicle_zones

        await reconcile_vehicle_zones(conn=conn)

        await _create_auth_schema(conn)
        from services.auth_seed import seed_auth_data

        await seed_auth_data(conn)


async def _create_auth_schema(conn) -> None:
    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            email TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS roles (
            id UUID PRIMARY KEY,
            code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            display_name TEXT NOT NULL DEFAULT '',
            description TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS permissions (
            id UUID PRIMARY KEY,
            code TEXT NOT NULL UNIQUE,
            description TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'action',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS role_permissions (
            role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
            permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
            PRIMARY KEY (role_id, permission_id)
        );
        """
    )
    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS user_roles (
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, role_id)
        );
        """
    )
    await conn.execute(
        """
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TIMESTAMPTZ NOT NULL,
            revoked_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        """
    )
    await conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);"
    )
    await _migrate_auth_schema(conn)


async def _migrate_auth_schema(conn) -> None:
    """Add auth columns when tables pre-exist from an earlier partial deploy."""
    await conn.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;"
    )
    await conn.execute(
        "ALTER TABLE roles ADD COLUMN IF NOT EXISTS code TEXT;"
    )
    await conn.execute(
        "ALTER TABLE roles ADD COLUMN IF NOT EXISTS name TEXT;"
    )
    await conn.execute(
        "UPDATE roles SET code = name WHERE code IS NULL AND name IS NOT NULL;"
    )
    await conn.execute(
        "UPDATE roles SET name = code WHERE name IS NULL AND code IS NOT NULL;"
    )
    await conn.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT '';"
    )
    await conn.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;"
    )
    await conn.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();"
    )
    await conn.execute(
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();"
    )
    await conn.execute(
        "ALTER TABLE roles ADD COLUMN IF NOT EXISTS display_name TEXT NOT NULL DEFAULT '';"
    )
    await conn.execute(
        "ALTER TABLE roles ADD COLUMN IF NOT EXISTS description TEXT;"
    )
    await conn.execute(
        "ALTER TABLE roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();"
    )
    await conn.execute(
        "ALTER TABLE permissions ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';"
    )
    await conn.execute(
        "ALTER TABLE permissions ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'action';"
    )
    await conn.execute(
        "ALTER TABLE permissions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();"
    )
    await conn.execute(
        "ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;"
    )
    await conn.execute(
        "ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();"
    )
    await conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);"
    )
    await conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_code ON roles(code);"
    )
    await conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_name ON roles(name);"
    )
    await conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);"
    )
    await conn.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);"
    )


async def _ensure_yard_zones(conn) -> None:
    """Upsert mandatory operational zones and map layout zones (restores missing ZN-A, etc.)."""
    rows = [
        ("ZN-GATE-IN", "Gate In", "GATE_IN", 20, "Gate arrival and validation", True, None),
        ("ZN-GATE-OUT", "Gate Out", "GATE_OUT", 20, "Outbound exit lane", True, None),
        ("ZN-WAITING-AREA", "Waiting Area", "WAITING_AREA", 40, "Virtual queue staging", True, None),
        ("ZN-EXIT-HOLDING", "Exit Holding", "EXIT_HOLDING", 30, "Post-loading exit staging", True, None),
        ("ZN-STAGING", "Staging", "STAGING", 16, "Called vehicles staging", False, None),
        ("ZN-A", "Loading", "LOADING", 24, "Outbound loading staging", False, "A"),
        ("ZN-B", "Unloading", "UNLOADING", 24, "Inbound unloading staging", False, "B"),
        ("ZN-C", "Documentation", "DOCUMENTATION", 12, "Documentation hold", False, "C"),
        ("ZN-D", "Hazardous", "HAZMAT", 8, "Hazmat isolation", False, "D"),
        ("ZN-E", "Cold Chain", "COLD_CHAIN", 10, "Cold chain staging", False, "E"),
        ("ZN-F", "Emergency Holding", "EMERGENCY_HOLDING", 6, "Overflow holds", False, "F"),
    ]
    for code, name, ztype, cap, desc, mandatory, layout in rows:
        await conn.execute(
            """
            INSERT INTO yard_zones (
                id, zone_code, zone_name, zone_type, max_capacity, status,
                description, map_code, is_mandatory, created_at, updated_at
            )
            VALUES (gen_random_uuid(), $1, $2, $3, $4, 'ACTIVE', $5, $6, $7, NOW(), NOW())
            ON CONFLICT (zone_code) DO UPDATE SET
                zone_name = EXCLUDED.zone_name,
                zone_type = EXCLUDED.zone_type,
                max_capacity = EXCLUDED.max_capacity,
                description = EXCLUDED.description,
                map_code = EXCLUDED.map_code,
                is_mandatory = EXCLUDED.is_mandatory,
                updated_at = NOW()
            """,
            code,
            name,
            ztype,
            cap,
            desc,
            layout,
            mandatory,
        )


async def _seed_yard_zones(conn) -> None:
    """Deprecated alias — use _ensure_yard_zones."""
    await _ensure_yard_zones(conn)


async def _seed_zone_rules(conn) -> None:
    rules = [
        ("HAZMAT", "cargo_match", "hazmat|hazard|chem|class 3|flamm", "Hazmat cargo only in HAZMAT zones"),
        ("COLD_CHAIN", "cargo_match", "cold|pharma|refrig|freezer|reefer|chilled", "Cold chain cargo only"),
        ("DOCUMENTATION", "vehicle_status", "SCHEDULED|CHECKED_IN", "Documentation zone for pre-queue vehicles"),
        ("GATE_IN", "vehicle_status", "SCHEDULED|ARRIVED|CHECKED_IN|WAITING", "Gate in for pre-queue vehicles"),
        ("LOADING", "vehicle_status", "DOCK_ASSIGNED|RESOURCE_PENDING|READY_FOR_LOADING|LOADING", "Loading zone for active dock operations"),
        ("STAGING", "vehicle_status", "CALLED", "Staging for called vehicles"),
        ("WAITING_AREA", "vehicle_status", "WAITING|CHECKED_IN", "Waiting area for queued vehicles"),
        ("EXIT_HOLDING", "vehicle_status", "COMPLETED", "Completed vehicles await exit"),
        ("GATE_OUT", "vehicle_status", "COMPLETED|EXITED", "Exit gate lane"),
    ]
    for ztype, key, val, desc in rules:
        await conn.execute(
            """
            INSERT INTO zone_rules (id, zone_type, rule_key, rule_value, description, active)
            VALUES (gen_random_uuid(), $1, $2, $3, $4, TRUE)
            ON CONFLICT (zone_type, rule_key) DO NOTHING
            """,
            ztype,
            key,
            val,
            desc,
        )

        labor_count = await conn.fetchval("SELECT COUNT(*)::int FROM labor_teams")
        if labor_count == 0:
            await conn.execute(
                """
                INSERT INTO labor_teams (
                    id, team_code, team_name, shift_start, shift_end,
                    members_count, available_count, assigned_count, status,
                    supervisor_name, current_assignment, current_location,
                    assigned_dock_id, assigned_vehicle_id, notes
                )
                VALUES
                    (gen_random_uuid(), 'T-A', 'Team A', '06:00', '14:00', 8, 8, 0, 'ON_DUTY', 'Rohan D.', '—', 'Zone A', NULL, NULL, NULL),
                    (gen_random_uuid(), 'T-B', 'Team B', '06:00', '14:00', 7, 5, 2, 'ASSIGNED', 'Priya S.', 'Dock staging', 'Bay 3', NULL, NULL, NULL),
                    (gen_random_uuid(), 'T-C', 'Team C', '06:00', '14:00', 10, 10, 0, 'ON_DUTY', 'Amit K.', '—', 'Zone A', NULL, NULL, NULL),
                    (gen_random_uuid(), 'T-D', 'Team D', '14:00', '22:00', 9, 0, 0, 'OFF_DUTY', NULL, '—', '—', NULL, NULL, NULL),
                    (gen_random_uuid(), 'T-E', 'Team E', '06:00', '14:00', 6, 4, 2, 'ASSIGNED', 'Neha M.', 'Cold Chain', 'Cold zone', NULL, NULL, NULL),
                    (gen_random_uuid(), 'T-F', 'Team F', '22:00', '06:00', 8, 0, 0, 'OFF_DUTY', NULL, '—', '—', NULL, NULL, NULL)
                """
            )

        count = await conn.fetchval("SELECT COUNT(*)::int FROM equipment")
        if count == 0:
            await conn.execute(
                """
                INSERT INTO equipment (
                    id, equipment_code, equipment_type, model, status,
                    battery_level, operator_name, current_location,
                    assigned_dock_id, assigned_vehicle_id, maintenance_due, notes
                )
                VALUES
                    (gen_random_uuid(), 'EQ-101', 'Forklift', 'Toyota 8FG25', 'IDLE', 78, 'Suresh Y.', 'Zone A', NULL, NULL, NULL, NULL),
                    (gen_random_uuid(), 'EQ-102', 'Forklift', 'Godrej GX300', 'IDLE', 92, NULL, 'Zone A', NULL, NULL, NULL, NULL),
                    (gen_random_uuid(), 'EQ-103', 'Reach Stacker', 'Kalmar DRG', 'IDLE', 65, 'Ramesh K.', 'Zone B', NULL, NULL, NULL, NULL),
                    (gen_random_uuid(), 'EQ-104', 'Crane', 'TIL RT740', 'MAINTENANCE', 0, NULL, 'Bay 2', NULL, NULL, CURRENT_DATE + 7, 'Scheduled service'),
                    (gen_random_uuid(), 'EQ-105', 'Pallet Jack', 'Manual', 'IDLE', NULL, NULL, 'Dock staging', NULL, NULL, NULL, NULL),
                    (gen_random_uuid(), 'EQ-106', 'Forklift', 'Voltas DB30', 'CHARGING', 41, 'Manoj P.', 'Charge bay', NULL, NULL, NULL, NULL),
                    (gen_random_uuid(), 'EQ-107', 'Reach Stacker', 'Hyster RS46', 'IDLE', 88, 'Iqbal K.', 'Zone B', NULL, NULL, NULL, NULL),
                    (gen_random_uuid(), 'EQ-108', 'Crane', 'ACE NX 14', 'IDLE', 100, NULL, 'Bay 1', NULL, NULL, NULL, NULL)
                """
            )
