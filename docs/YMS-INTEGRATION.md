# Yard (YMS) integration in Shipgen

YARD.OS is embedded in the Shipgen console as the **Yard** engine (`/yard/*`), alongside FleetOps, Pallet, and Ledger.

## Architecture

| Layer | Technology | Path |
|-------|------------|------|
| UI | Shipgen React (`frontend/`) | `/yard/*` routes, shared `ConsoleLayout` |
| YMS pages | `yms/frontend_1/src` (imported via `@yard` alias) | Lazy-loaded module |
| API gateway | nginx (`docker/gateway`) | `/api/yms/*` → `yms-service` |
| YMS API | FastAPI (`yms/backend`) | Internal `/api/*` |
| Database | PostgreSQL 16 | `yms-postgres` on host port **5433** |

## Local development

### 1. Start stack (includes YMS)

```powershell
docker compose up -d --build yms-postgres yms-service gateway iam-service fleetops-service application cache database
```

Or full stack:

```powershell
docker compose up -d --build
```

### 2. Start Shipgen frontend

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 → sign in to Shipgen → switch engine to **Yard** in the header. Yard uses your Shipgen session automatically — no separate yard login.

## Environment

**`frontend/.env`**

```env
VITE_YARD_BASE_PATH=/yard
VITE_YMS_API_BASE_URL=/api/yms
```

**`yms-service` (docker-compose)** — `PLATFORM_USERINFO_URL` points at IAM `GET /int/v1/users/me` so Yard can validate Shipgen tokens and provision yard users by email on first visit.

**`yms/.env`** — used by `yms-service` container; `DATABASE_URL` is overridden in root `docker-compose.yml`.

## API routing

| Public URL | Upstream |
|------------|----------|
| `POST http://localhost:8000/api/yms/auth/platform-login` | Shipgen session → Yard JWT (embedded console) |
| `GET http://localhost:8000/api/yms/gate/dashboard` | `yms-service:8000/api/gate/dashboard` |

Vite dev server proxies `/api/yms` to `VITE_API_HOST` (gateway).

## Standalone YMS (optional)

YMS can still run independently from `yms/`:

```powershell
cd yms
docker compose up -d --build
```

Standalone UI: http://localhost:3001 (leave `VITE_YARD_BASE_PATH` unset / empty).

### Demo YMS credentials (standalone / mobile)

Same rules as Shipgen IAM: sign in with **email**, password must include upper, lower, number, and symbol (min 8 chars).

| Email | Password | Role |
|-------|----------|------|
| yard.admin@shipgen.demo | Shipgen@Yms2026! | yard_admin |
| yard.manager@shipgen.demo | Shipgen@Yms2026! | yard_manager |
| yard.gate@shipgen.demo | Shipgen@Yms2026! | gate_operator |
| yard.coordinator@shipgen.demo | Shipgen@Yms2026! | yard_coordinator |
| yard.supervisor@shipgen.demo | Shipgen@Yms2026! | dock_supervisor |

## Next steps (not in this integration)

- Keycloak OIDC (replace platform token exchange)
- FleetOps order → YMS appointment sync
- Fine-grained Shipgen role → YMS role mapping (today: admin → yard_admin, others → yard_manager)
