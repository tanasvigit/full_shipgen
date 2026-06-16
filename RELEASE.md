# Shipgen — Production deployment runbook

This document is the **step-by-step production runbook** for deploying Shipgen (React console + API gateway + domain services).

| Audience | Document |
|----------|----------|
| **Production deploy** | This file |
| **Local development** | [docs/PRODUCTION-UI.md](docs/PRODUCTION-UI.md) |
| **Frontend/nginx detail** | [frontend/docs/DEPLOYMENT.md](frontend/docs/DEPLOYMENT.md) |
| **SaaS features** | [frontend/docs/SAAS-RELEASE.md](frontend/docs/SAAS-RELEASE.md) |

---

## Deployment model (SaaS)

Shipgen is deployed as **SaaS**: database setup, migrations, and seeding happen **during deployment** — not from a browser installer.

| Concern | Where it runs | UI involvement |
|---------|---------------|----------------|
| Create database | `api/deploy.sh` (`DEPLOY_CREATE_DB`) | None |
| Migrations | `api/deploy.sh` | None |
| Seed baseline data | `api/deploy.sh` (`DEPLOY_RUN_SEED`) | None |
| Permissions / roles sync | `api/deploy.sh` | None |
| First company + admin user | `/auth/onboard` | **Yes** — company onboarding only |

**Disable the legacy UI installer in production:**

```env
# api/.env
INSTALLER_UI_ENABLED=false
INSTALLER_RUNTIME_SETUP_ENABLED=false

# frontend/.env (build-time)
VITE_INSTALLER_UI_ENABLED=false
```

---

## Deployment order (quick reference)

Follow these steps **in order** on every environment.

| Step | Action | Section |
|------|--------|---------|
| 1 | Prerequisites & secrets | [§1](#1-prerequisites) |
| 2 | Configure `api/.env` | [§2](#2-configure-apienv) |
| 3 | Build API image | [§3](#3-build-api-image) |
| 4 | Start data services | [§4](#4-start-data-services) |
| 5 | Run `deploy.sh` (schema + permissions) | [§5](#5-run-deployment-script) |
| 6 | Start application stack | [§6](#6-start-application-stack) |
| 7 | Build & deploy React console | [§7](#7-build--deploy-react-console) |
| 8 | Configure TLS / reverse proxy | [§8](#8-reverse-proxy-tls) |
| 9 | Post-deploy verification | [§9](#9-post-deploy-checklist) |
| 10 | First company onboarding (if fresh DB) | [§10](#10-first-company-onboarding) |

**Upgrades** skip steps 4 and 10; see [§11 Upgrading a release](#11-upgrading-a-release).

---

## Architecture (production)

```mermaid
flowchart LR
  Browser[Browser]
  UI[frontend nginx :443]
  GW[API gateway :8000]
  IAM[iam-service]
  FO[fleetops-service]
  SF[storefront-service]
  PL[pallet-service]
  LD[ledger-service]
  APP[application — registry / queue]
  DB[(MySQL)]
  Redis[(Redis)]
  SC[SocketCluster]
  Tiles[Map tiles :8080]

  Browser --> UI
  Browser --> GW
  Browser --> SC
  UI -->|/socketcluster/ proxy| SC
  GW --> IAM
  GW --> FO
  GW --> SF
  GW --> PL
  GW --> LD
  GW --> APP
  IAM --> DB
  FO --> DB
  SF --> DB
  PL --> DB
  LD --> DB
  APP --> DB
  IAM --> Redis
  Browser --> Tiles
```

| Layer | Service | Role |
|-------|---------|------|
| **UI** | `frontend` | Static React SPA; proxies WebSocket to SocketCluster |
| **API edge** | `gateway` | Path routing, CORS preflight, session → internal JWT |
| **IAM** | `iam-service` | Auth, users, orgs, settings, files, gateway introspection |
| **FleetOps** | `fleetops-service` | Orders, drivers, routes, vehicles, … (`/int/v1/*` non-IAM) |
| **Storefront** | `storefront-service` | `storefront/int/v1/*` |
| **Pallet** | `pallet-service` | `pallet/int/v1/*` |
| **Ledger** | `ledger-service` | `ledger/int/v1/*` |
| **Monolith slice** | `application` | Registry (`~registry/v1`), queue, scheduler, deploy job target |
| **Realtime** | `socket` | SocketCluster (host **38000** or proxied via UI) |
| **Maps** | `tiles` | Basemap on **8080** (dev proxy) or TileServer GL in prod |
| **Routing** | `osrm` / `osrm-backend` | Self-hosted OSRM (optional) |

**Public URLs (typical)**

| URL | Purpose |
|-----|---------|
| `https://app.yourdomain.com` | React console |
| `https://api.yourdomain.com` | API gateway (`VITE_API_HOST`) |
| `wss://app.yourdomain.com/socketcluster/` | Realtime (when using UI proxy) |

---

## 1. Prerequisites

| Requirement | Notes |
|-------------|--------|
| Docker + Compose v2 | API services use image `fleetbase-api-onprem:local` (build from repo) |
| TLS certificates | Terminate HTTPS at your reverse proxy or load balancer |
| MySQL 8 | Persistent volume; backup strategy required |
| Redis | Sessions, cache, queues |
| Secrets manager | Never commit production `api/.env` |

Optional: OSRM map data ([docker/osrm/README.md](docker/osrm/README.md)), SMTP, S3 for files, TileServer GL for map tiles.

**Generate secrets before step 2:**

```bash
# APP_KEY
docker compose run --rm application php artisan key:generate --show

# Gateway secrets (example)
openssl rand -hex 32   # GATEWAY_INTERNAL_SECRET
openssl rand -hex 32   # GATEWAY_JWT_SECRET
```

---

## 2. Configure `api/.env`

Copy `api/.env.example` → `api/.env`. Minimum **production** values:

```env
APP_NAME=Shipgen
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:GENERATE_WITH_artisan_key_generate
APP_URL=https://api.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=database
DB_DATABASE=fleetbase
DB_USERNAME=root
DB_PASSWORD=STRONG_PASSWORD_HERE

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_HOST=cache
BROADCAST_DRIVER=socketcluster

# CORS — exact React origin(s), scheme + host + port
CONSOLE_HOST=https://app.yourdomain.com
FRONTEND_HOSTS=https://app.yourdomain.com

# SaaS: no UI installer
INSTALLER_UI_ENABLED=false
INSTALLER_RUNTIME_SETUP_ENABLED=false

# Deployment script controls (used by api/deploy.sh)
DEPLOY_CREATE_DB=true
DEPLOY_RUN_SEED=never
DEPLOY_RUN_PERMISSIONS_SYNC=true
DEPLOY_RUN_REGISTRY_INIT=true

# On-prem: disable Fleetbase cloud telemetry
TELEMETRY_DISABLED=true
REGISTRY_PREINSTALLED_EXTENSIONS=true

# Mail (production mailboxes)
MAIL_MAILER=smtp
MAIL_FROM_ADDRESS=noreply@shipgen.net
MAIL_FROM_NAME=Shipgen
MAIL_NOREPLY_ADDRESS=noreply@shipgen.net
MAIL_SUPPORT_ADDRESS=support@shipgen.net

# Assets & maps (browser-reachable URLs)
ASSET_PUBLIC_BASE_URL=https://api.yourdomain.com
BRANDING_LOGO_URL=https://api.yourdomain.com/images/logo_logistic.png
MAP_TILE_URL=https://tiles.yourdomain.com/styles/basic/{z}/{x}/{y}.png
MAP_TILE_URL_DARK=https://tiles.yourdomain.com/styles/basic/{z}/{x}/{y}.png
MAP_TILE_ATTRIBUTION=© OpenStreetMap contributors

# Routing (self-hosted OSRM recommended in production)
OSRM_HOST=http://osrm-backend:5000

# API gateway — CHANGE ALL SECRETS
GATEWAY_INTERNAL_SECRET=REPLACE_ME
GATEWAY_JWT_SECRET=REPLACE_ME
GATEWAY_JWT_ISSUER=shipgen-iam
GATEWAY_JWT_AUDIENCE=shipgen-internal
GATEWAY_JWT_TTL=900
GATEWAY_TRUST_INTERNAL_JWT=false
```

**Per-service containers** (`iam-service`, `fleetops-service`, …) read the same `api/.env` via compose. Domain services need:

```env
GATEWAY_TRUST_INTERNAL_JWT=true
GATEWAY_JWT_SECRET=<same as above>
```

(Set in `docker-compose.yml` for `fleetops-service`, `pallet-service`, `ledger-service`, `storefront-service` — already wired for local stack.)

Create `docker-compose.override.yml` for production overrides (do not commit secrets):

```yaml
services:
  database:
    environment:
      MYSQL_ROOT_PASSWORD: "${MYSQL_ROOT_PASSWORD}"
      MYSQL_DATABASE: fleetbase

  gateway:
    environment:
      GATEWAY_INTERNAL_SECRET: "${GATEWAY_INTERNAL_SECRET}"

  application:
    environment:
      APP_ENV: production
      APP_DEBUG: "false"
      CONSOLE_HOST: https://app.yourdomain.com
      FRONTEND_HOSTS: https://app.yourdomain.com
      INSTALLER_UI_ENABLED: "false"
      INSTALLER_RUNTIME_SETUP_ENABLED: "false"

  socket:
    environment:
      SOCKETCLUSTER_OPTIONS: '{"origins":"https://app.yourdomain.com:*"}'
```

---

## 3. Build API image

Packages under `packages/*` are baked into the image at build time:

```bash
docker compose build application gateway
```

After changing PHP packages in production, rebuild the image and redeploy **all** API containers (`iam-service`, `fleetops-service`, `application`, etc.).

---

## 4. Start data services

Bring up MySQL and Redis first so `deploy.sh` can connect:

```bash
docker compose pull database cache   # base images only
docker compose up -d database cache
```

Wait until MySQL is healthy:

```bash
docker compose ps database
```

---

## 5. Run deployment script

`api/deploy.sh` is the canonical deployment task runner. It is also invoked by the Helm pre-install/pre-upgrade hook (`infra/helm/templates/hooks.yaml`).

**What it does (in order):**

1. `mysql:createdb` (if `DEPLOY_CREATE_DB=true`)
2. `migrate --force`
3. `sandbox:migrate --force`
4. `fleetbase:seed --force` (only if `DEPLOY_RUN_SEED=always`)
5. `fleetbase:create-permissions` (if enabled)
6. Queue restart, scheduler sync, cache rebuild
7. `registry:init` (if enabled)

**First production deploy (Docker Compose):**

```bash
docker compose run --rm application ./deploy.sh
```

**SaaS default:** leave `DEPLOY_RUN_SEED=never`. Baseline roles/permissions are synced by `fleetbase:create-permissions`; the first company is created via UI onboarding (§10).

**Staging / demo environments** that need seeded reference data:

```env
DEPLOY_RUN_SEED=always
```

Then re-run `./deploy.sh`.

**Kubernetes / Helm:** the hook job runs `./deploy.sh` automatically on `helm upgrade`. Set deploy flags via the `infra-provided-secret` env block.

---

## 6. Start application stack

```bash
docker compose build iam-service fleetops-service storefront-service pallet-service ledger-service frontend
docker compose up -d
```

### Services to run in production

| Service | Required |
|---------|----------|
| `database`, `cache` | Yes |
| `gateway`, `iam-service`, `fleetops-service` | Yes |
| `storefront-service`, `pallet-service`, `ledger-service` | If modules used |
| `application` | Yes (registry, deploy target) |
| `queue`, `scheduler` | Yes |
| `frontend`, `socket` | Yes |
| `tiles` | Yes unless external TileServer GL |
| `osrm`, `osrm-backend` | If route optimization / maps routing used |

Verify all containers are up:

```bash
docker compose ps
```

---

## 7. Build & deploy React console

Vite **bakes** `VITE_*` at build time. Production `frontend/.env`:

```env
VITE_API_HOST=https://api.yourdomain.com
VITE_API_NAMESPACE=int/v1

# SaaS: no installer UI
VITE_INSTALLER_UI_ENABLED=false

# Extension API mounts (defaults)
VITE_STOREFRONT_MODULE_ROOT=storefront/int/v1
VITE_LEDGER_MODULE_ROOT=ledger/int/v1
VITE_PALLET_MODULE_ROOT=pallet/int/v1
VITE_REGISTRY_MODULE_ROOT=~registry/v1

# Realtime — same origin as UI (recommended): nginx proxies /socketcluster/
VITE_SOCKETCLUSTER_PROXY=true

# Map tiles (public URL reachable from users' browsers)
VITE_MAP_TILE_URL=https://tiles.yourdomain.com/styles/basic/{z}/{x}/{y}.png
VITE_MAP_TILE_URL_DARK=https://tiles.yourdomain.com/styles/basic/{z}/{x}/{y}.png

# NEVER in production:
# VITE_FLEETOPS_PERMISSIVE=true
```

```bash
cd frontend
npm ci
npm run build
npm run verify:release
```

Docker build (matches compose defaults):

```bash
docker compose build frontend \
  --build-arg VITE_API_HOST=https://api.yourdomain.com \
  --build-arg VITE_SOCKETCLUSTER_PROXY=true \
  --build-arg VITE_INSTALLER_UI_ENABLED=false \
  --build-arg VITE_MAP_TILE_URL=https://tiles.yourdomain.com/styles/basic/{z}/{x}/{y}.png

docker compose up -d frontend
```

---

## 8. Reverse proxy (TLS)

Terminate TLS in front of Docker published ports. Example **split domains**:

| Upstream | Target |
|----------|--------|
| `app.yourdomain.com` | `frontend:5173` (or static `dist/`) |
| `api.yourdomain.com` | `gateway:8000` |
| `tiles.yourdomain.com` | `tiles:8080` or TileServer GL |

**Single-domain** (optional): serve React at `/` and proxy `/int/`, `/ledger`, `/storefront/`, `/pallet/`, `/registry/`, `/~registry/` to `gateway:8000`, and `/socketcluster/` to SocketCluster or `frontend` (which proxies to `socket:8000`).

The gateway handles:

- IAM vs FleetOps path split on `/int/v1/*`
- CORS `OPTIONS` on protected routes
- Registry alias: `/registry/v1/*` → `~registry/v1/*`

See [docker/gateway/README.md](docker/gateway/README.md).

---

## 9. Post-deploy checklist

### Security

- [ ] `APP_DEBUG=false`, strong `APP_KEY`, `MYSQL_ROOT_PASSWORD` set
- [ ] `GATEWAY_INTERNAL_SECRET` and `GATEWAY_JWT_SECRET` rotated (not dev defaults)
- [ ] `FRONTEND_HOSTS` / `CONSOLE_HOST` match exact production UI URL
- [ ] `INSTALLER_UI_ENABLED=false` and `INSTALLER_RUNTIME_SETUP_ENABLED=false`
- [ ] `VITE_INSTALLER_UI_ENABLED=false` in frontend build
- [ ] `SOCKETCLUSTER_OPTIONS` origins restricted to your domain
- [ ] `VITE_FLEETOPS_PERMISSIVE` **unset** in production frontend build
- [ ] Secrets not in git; `.env` in `.gitignore`

### Infrastructure

- [ ] `deploy.sh` completed without errors (migrations + permissions sync)
- [ ] `https://api.yourdomain.com/health` → 200
- [ ] `docker compose ps` — all required services healthy
- [ ] `docker compose exec application php artisan queue:status` — workers running

### Functional

- [ ] Fresh DB does **not** redirect to `/install`
- [ ] Login page loads at `https://app.yourdomain.com/auth`
- [ ] `/int/v1/users/me` returns user + company (after login)
- [ ] FleetOps: orders, drivers, routes load
- [ ] Storefront / Pallet / Ledger pages load via module paths
- [ ] Registry: extensions list (`~registry/v1` or `/registry/v1` via gateway)
- [ ] WebSocket: browser connects (101) to `/socketcluster/`
- [ ] Maps: tiles load (no failed requests to `:8080` or tile host)
- [ ] Credential emails: logo URL is public HTTPS (`BRANDING_LOGO_URL`)

### Smoke commands

```bash
curl -fsS https://api.yourdomain.com/health
docker compose exec application php artisan queue:status
docker compose logs --tail=50 gateway iam-service fleetops-service
```

---

## 10. First company onboarding

After a **fresh deploy** with an empty `companies` table:

1. Open `https://app.yourdomain.com` — you should be redirected to `/auth/onboard` (not `/install`).
2. Create the first organization account (name, email, phone, organization, password).
3. Complete email verification if prompted.
4. Sign in and confirm console access.

**Optional CLI bootstrap** (automation / break-glass only):

```bash
docker compose exec application php scripts/create-admin-user.php
```

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_ORG` in the environment before running.

---

## 11. Upgrading a release

Follow this order on every upgrade:

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild images (required after package or Dockerfile changes)
docker compose build application gateway iam-service fleetops-service frontend

# 3. Rolling restart
docker compose up -d

# 4. Run deployment script (migrations + permissions + cache)
docker compose exec application ./deploy.sh

# 5. Rebuild frontend if VITE_* or UI changed
cd frontend && npm ci && npm run build && npm run verify:release
docker compose up -d frontend
```

PowerShell helper (local/staging):

```powershell
.\scripts\refresh-microservices.ps1 -Rebuild -RebuildFrontend
```

**Helm / GCP CD:** `helm upgrade` triggers the pre-upgrade hook that runs `./deploy.sh` automatically. See [.github/workflows/gcp-cd.yml](.github/workflows/gcp-cd.yml).

| Upgrade step | First deploy | Subsequent upgrades |
|--------------|--------------|---------------------|
| `deploy.sh` | Required | Required |
| `DEPLOY_RUN_SEED` | `never` (SaaS) | `never` |
| Rebuild frontend | Required | Only if `VITE_*` changed |
| Onboarding UI | If no companies exist | Skip |

---

## 12. Troubleshooting

| Symptom | Cause | Fix |
|---------|--------|-----|
| Redirected to `/install` | Installer UI still enabled | Set `INSTALLER_UI_ENABLED=false`, `VITE_INSTALLER_UI_ENABLED=false`; rebuild frontend |
| `403` on `/installer/migrate` | Runtime setup disabled (expected in SaaS) | Run `./deploy.sh` during deployment |
| CORS / blocked preflight | UI origin missing from `FRONTEND_HOSTS` | Add exact origin; restart API containers |
| `401` on FleetOps/Storefront API | Gateway auth failed | Check session/Bearer token; IAM `gateway/auth` logs |
| `500` on FleetOps API | Broken `vendor/fleetbase/core-api` or JWT mint | Rebuild `application` image; verify `GATEWAY_JWT_*` |
| `400` “There is nothing to see here.” on `/int/v1/products` | Request hit wrong service | UI should use `storefront/int/v1`; rebuild frontend |
| Registry `400` on `/registry/v1` | Laravel uses `~registry` prefix | Use `VITE_REGISTRY_MODULE_ROOT=~registry/v1` or gateway rewrite |
| WebSocket fails | No proxy or wrong port | Enable `VITE_SOCKETCLUSTER_PROXY=true` + frontend nginx `/socketcluster/` |
| Map tiles missing | Nothing on tile URL | Run `tiles` service or external TileServer; set `MAP_TILE_URL` / `VITE_MAP_TILE_URL` |
| Stale code in containers | Image vendor not updated | Rebuild `application` image or `refresh-microservices.ps1` |
| Broken logo in emails | Localhost or auth-gated asset URL | Set `BRANDING_LOGO_URL` to public HTTPS path |

---

## 13. Related documentation

| Document | Content |
|----------|---------|
| [docs/PRODUCTION-UI.md](docs/PRODUCTION-UI.md) | React-only UI, local Docker ports |
| [docs/MICROSERVICES-ARCHITECTURE.md](docs/MICROSERVICES-ARCHITECTURE.md) | Service boundaries, migration plan |
| [docker/gateway/README.md](docker/gateway/README.md) | Gateway routes and env |
| [frontend/docs/DEPLOYMENT.md](frontend/docs/DEPLOYMENT.md) | Frontend build, nginx examples, E2E |
| [frontend/docs/SAAS-RELEASE.md](frontend/docs/SAAS-RELEASE.md) | SaaS features, demo mode, health page |
| [docker/tiles/README.md](docker/tiles/README.md) | Map tile server |
| [docker/osrm/README.md](docker/osrm/README.md) | OSRM setup |

---

## Component versions (this fork)

Track versions in `api/composer.json` / `packages/*/composer.json` when cutting a release:

| Package | Path |
|---------|------|
| core-api | `packages/core-api` |
| fleetops-api | `packages/fleetops/server` |
| storefront-api | `packages/storefront/server` |
| ledger-api | `packages/ledger/server` |
| pallet-api | `packages/pallet/server` |
| registry-bridge | `packages/registry-bridge/server` |

---

## Support

- Architecture and gateway: [docs/MICROSERVICES-ARCHITECTURE.md](docs/MICROSERVICES-ARCHITECTURE.md)
- Upstream Fleetbase: [GitHub Discussions](https://github.com/fleetbase/fleetbase/discussions)
