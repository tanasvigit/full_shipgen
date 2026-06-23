# Security Systems — Parking Management

A full-stack parking management platform for multi-floor facilities: ticket entry/exit, payments, floor occupancy, dashboards, reports, hardware monitoring, and role-based access for **Admin**, **Supervisor**, and **Operator** staff.

The web UI is branded **Security Systems**. The API project name is **ParkFlow**.

---

## Features

| Area | Capabilities |
|------|----------------|
| **Tickets** | Create entry tickets, collect payments, exit vehicles, search, QR payload |
| **Floors** | Multi-floor capacity (2W / 4W / heavy), live occupancy |
| **Pricing** | Configurable rules by vehicle category |
| **Dashboards** | Role-specific KPIs (admin, supervisor, operator) |
| **Reports** | Revenue, traffic, category breakdown; date presets + custom range; vehicle filter; admin PDF export |
| **Monitoring** | Operator activity, alerts, QR scans, entry/exit events |
| **Users & audit** | User management (admin), audit log trail |
| **OCR** | License plate recognition (EasyOCR) on supported flows |

---

## Tech stack

| Layer | Stack |
|-------|--------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS 4, React Router, Recharts, jsPDF |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL |
| **Auth** | JWT (Bearer token) |
| **Mobile** | Expo / React Native (`mobile-app/`, optional) |
| **Tests** | pytest (backend), Playwright (frontend E2E smoke) |

---

## Repository layout

```text
Curser/
├── frontend/          Web app (Vite + React)
├── backend/           FastAPI API, Alembic migrations, seed data
│   ├── app/           Application code
│   ├── alembic/       Database migrations
│   ├── docker-compose.yml   PostgreSQL for local dev
│   └── backend.md     Detailed backend architecture & API notes
├── mobile-app/        Expo mobile client (optional)
└── test-cases.txt     Manual / automated test inventory
```

---

## Prerequisites

- **Node.js** 20+ and **npm**
- **Python** 3.11+ (3.12 recommended)
- **Docker** (for local PostgreSQL), or an existing PostgreSQL 16 instance
- **Git**

On Windows, use `python -m pip` and `python -m pytest` instead of bare `pip` / `pytest` if commands are not on PATH.

---

## Quick start

### 1. Database (PostgreSQL)

From the `backend` folder:

```bash
cd backend
docker compose up -d
```

Default connection (matches `.env.example`):

- Host: `localhost:5432`
- Database: `parkflow`
- User / password: `parkflow` / `parkflow`

### 2. Backend API

```bash
cd backend
copy .env.example .env          # Windows
# cp .env.example .env          # macOS / Linux

python -m venv .venv
.\.venv\Scripts\activate        # Windows PowerShell
# source .venv/bin/activate   # macOS / Linux

python -m pip install -r requirements.txt
alembic upgrade head
python -m app.seed.run
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) → `{"status":"ok"}`  
API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

> **Note:** First startup may download EasyOCR models; this can take a few minutes.

### 3. Web frontend

In a second terminal:

```bash
cd frontend
copy .env.example .env          # Windows
npm install
npm run dev
```

Open the URL Vite prints (usually [http://localhost:5173](http://localhost:5173)).

### 4. Log in

Demo accounts (created by `python -m app.seed.run`):

| Role | Email | Password |
|------|--------|----------|
| Admin | `admin@parkflow.com` | `admin123` |
| Supervisor | `supervisor@parkflow.com` | `supervisor123` |
| Operator | `operator@parkflow.com` | `operator123` |

Change these passwords before any production deployment.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | SQLAlchemy URL | `postgresql+psycopg2://parkflow:parkflow@localhost:5432/parkflow` |
| `JWT_SECRET` | Signing key for tokens | Strong random string in production |
| `JWT_ALGORITHM` | JWT algorithm | `HS256` |
| `JWT_EXPIRE_MINUTES` | Token lifetime | `60` |
| `APP_TIMEZONE` | App timezone label | `UTC` |
| `CORS_ORIGINS` | Allowed browser origins (comma-separated) | `http://localhost:5173` |

Copy from `backend/.env.example`.

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base (must include `/api/v1`) | `http://127.0.0.1:8000/api/v1` |

Copy from `frontend/.env.example`.

---

## Roles & main routes (web)

After login, users are routed by role:

| Role | Typical areas |
|------|----------------|
| **Admin** | Dashboard, users, pricing, parking config, floors, **reports (with PDF export)**, hardware, QR monitoring, audit, settings |
| **Supervisor** | Dashboard, floors (view), **reports (read-only)**, monitoring, alerts |
| **Operator** | Dashboard, new ticket, ticket search, QR ticket print |

Permissions are enforced on both the API and the React router.

---

## Development commands

### Frontend (`frontend/`)

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test:e2e     # Playwright (see frontend/.env.playwright.example)
```

### Backend (`backend/`)

```bash
uvicorn app.main:app --reload
alembic revision --autogenerate -m "description"   # New migration
alembic upgrade head
python -m app.seed.run                             # Re-seed (skips existing users)
python -m pytest tests/test_main_flows.py -v       # API flow tests
```

---

## Reports (web)

Available under **Admin** and **Supervisor** (supervisor is view-only, no PDF export).

- **Period:** Today, This Week (rolling 7 days), This Month (rolling 30 days), Custom Range
- **Vehicle filter:** All, 2 Wheeler, 4 Wheeler, Other
- **Admin:** Export current view to PDF (Security Systems branding)

Requires permissions `reports.admin` (admin) or `reports.view` (supervisor).

---

## Mobile app (optional)

```bash
cd mobile-app
copy .env.example .env
npm install
npx expo start
```

Point the mobile API URL at the same backend (`/api/v1`). See `mobile-app/.env.example`.

---

## Testing

**Backend** (in-memory SQLite in tests; no Docker required for pytest):

```bash
cd backend
python -m pip install -r requirements.txt
python -m pytest tests/test_main_flows.py -v
```

**Frontend E2E** (Playwright; backend + frontend should be running or configured via env):

```bash
cd frontend
npm run test:e2e
```

See `test-cases.txt` for a full test inventory and `backend/backend.md` for API-level documentation.

---

## Production checklist

- Set a strong `JWT_SECRET` and restrict `CORS_ORIGINS`
- Use managed PostgreSQL with backups
- Do not use default seed passwords
- Serve the frontend build behind HTTPS and set `VITE_API_URL` to your production API
- Review OCR / hardware features for your deployment environment

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Frontend cannot reach API | Confirm backend is on port 8000; check `VITE_API_URL` ends with `/api/v1` |
| Login fails immediately | Run migrations + seed; confirm PostgreSQL is up (`docker compose ps`) |
| CORS errors in browser | Add your frontend origin to `CORS_ORIGINS` in `backend/.env` |
| `ModuleNotFoundError` in Python | Activate `.venv` and `python -m pip install -r requirements.txt` |
| Port 5173 in use | Vite will use 5174+; local CORS allows common dev ports automatically |
| Reports empty | Seed data or create tickets/payments in the selected date range |

---

## Further reading

- **[backend/backend.md](backend/backend.md)** — Architecture, permissions, business rules, API cheat sheet
- **[test-cases.txt](test-cases.txt)** — Test case list and run commands

---

## License

Private / internal use unless a separate license file is added to this repository.
