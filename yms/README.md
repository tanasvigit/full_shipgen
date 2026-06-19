# Smart Yard

## Authentication (JWT + RBAC)

Production auth uses **JWT Bearer tokens** with role-based permissions. The dev header override (`X-YMS-Role`) is disabled by default.

### Default accounts (seeded on first startup)

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | yard_admin |
| manager | manager123 | yard_manager |
| gate | gate123 | gate_operator |
| coordinator | coordinator123 | yard_coordinator |
| supervisor | supervisor123 | dock_supervisor |

### Auth endpoints

- `POST /api/auth/login` — returns `access_token` + `refresh_token`
- `POST /api/auth/refresh` — rotate tokens
- `POST /api/auth/logout` — revoke refresh token
- `GET /api/auth/me` — current user, role, permissions
- `POST /api/auth/impersonate` — admin-only role impersonation for testing

### Environment (`backend/.env`)

```
JWT_SECRET_KEY=change-me-in-production
JWT_ACCESS_EXPIRE_MINUTES=30
JWT_REFRESH_EXPIRE_DAYS=7
ENABLE_DEV_ROLE_OVERRIDE=false
```

Set `ENABLE_DEV_ROLE_OVERRIDE=true` locally to restore header-based role override for development.

## Run with Docker (recommended — production frontend)

From `yard_frontend/`:

**First time or after Dockerfile / dependency changes:**

```powershell
docker compose up -d --build
```

**Daily use (reuse existing images — much faster):**

```powershell
docker compose up -d
```

The default stack serves a **pre-built** React app with nginx (port **3001**). It does **not** run the CRA dev server, so the browser is usable as soon as nginx and the API are up.

Apps:
- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:8001`
- API health: `http://localhost:8001/api/`
- OpenAPI docs: `http://localhost:8001/docs`

Startup order: Postgres → backend (healthcheck) → frontend (waits for healthy backend).

Stop:

```powershell
docker compose down
```

Stop and remove database volume:

```powershell
docker compose down -v
```

## Frontend dev mode (hot reload — slower)

Use only when editing UI code and you need live reload:

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

This runs `npm start` (webpack compile on startup). Expect a longer wait before `http://localhost:3001` is ready.

## Rebuild one service

```powershell
docker compose up -d --build frontend
docker compose up -d --build backend
```

## Run backend locally with PostgreSQL

1. Start PostgreSQL (for example with Docker):

```powershell
docker run --name smart-yard-pg -e POSTGRES_DB=smart_yard -e POSTGRES_USER=smart_yard_user -e POSTGRES_PASSWORD=smart_yard_password -p 5432:5432 -d postgres:16-alpine
```

2. In `backend`, create `.env` from `.env.example`.
3. Install and run:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn server:app --host 0.0.0.0 --port 8000
```
