# YARD.OS Environment Variables

Copy `.env.example` to `.env` and set all **required** values before starting the stack.

```bash
cp .env.example .env
# Generate a JWT secret:
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

## Required

| Variable | Service | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | postgres | Database name |
| `POSTGRES_USER` | postgres | Database user |
| `POSTGRES_PASSWORD` | postgres | Database password |
| `DATABASE_URL` | backend | Async PostgreSQL URL. **Inside Docker:** `postgresql://user:pass@postgres:5432/smart_yard`. **Local pytest against Docker:** use host port `5433` and the same password as `POSTGRES_PASSWORD` in the repo root `.env` (see `backend/.env.example`). |
| `JWT_SECRET_KEY` | backend | **Cryptographically random** signing secret, **minimum 32 characters**. Placeholders and template values are rejected at startup. |

## Backend (optional)

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `http://localhost:3001` | Comma-separated allowed browser origins |
| `JWT_ACCESS_EXPIRE_MINUTES` | `30` | Access token lifetime |
| `JWT_REFRESH_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `ENABLE_DEV_ROLE_OVERRIDE` | `false` | **Dev only.** Allow `X-YMS-Role` header bypass — must be `false` in production |
| `NODE_ENV` | `development` | Set to `production` in production deployments |

## Frontend build (Docker)

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_BASE_URL` | `http://localhost:8001/api` | Backend API base URL baked into the production frontend image |
| `ENABLE_DEV_ROLE_OVERRIDE` | `false` | Passed to frontend build as `REACT_APP_ENABLE_DEV_ROLE_OVERRIDE` |

## Startup validation

The backend calls `validate_jwt_secret()` on startup (`server.py`). The process **exits** if:

- `JWT_SECRET_KEY` is unset or empty
- Secret is shorter than 32 characters
- Secret matches a known placeholder (e.g. `<YOUR_LONG_RANDOM_SECRET…>`, `replace-with-very-long-random-secret…`)

Docker Compose also requires `JWT_SECRET_KEY` to be set in `.env` before `docker compose up` (`:?` interpolation).

## Security notes

- **Never commit** real secrets to version control. `.env` is gitignored.
- Generate a **unique** `JWT_SECRET_KEY` per environment (dev, staging, production).
- Rotating `JWT_SECRET_KEY` invalidates all existing access and refresh tokens.
