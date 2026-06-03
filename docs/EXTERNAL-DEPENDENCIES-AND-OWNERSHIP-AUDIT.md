# Fleetbase — External Dependencies & Ownership Audit

**Document version:** 1.0  
**Audit date:** 2026-06-03  
**Scope:** Full monorepo — `api/`, `packages/*`, `console/` (Ember), `frontend/` (React), `docker-compose.yml`, build/CI configs  
**Goal:** Operate the platform with full control; identify every external runtime/build dependency, ownership gaps, and isolation impact.

---

## Executive summary

| Area | Finding |
|------|---------|
| **Core business logic** | Substantial **source is in-repo** under `packages/` (core-api, fleetops, registry-bridge, storefront, ledger, pallet, ember engines). |
| **Runtime supply chain** | Production Docker uses **`fleetbase/fleetbase-api:latest`** and Composer resolves PHP packages from **`https://registry.fleetbase.io`** — not necessarily the local `packages/` tree unless you wire path repos and build images yourself. |
| **Ember console** | Built from `console/` but depends on **`@fleetbase/*` npm packages** (GitHub Packages / npm) during `pnpm install`; engines also exist as source under `packages/`. |
| **React frontend** | Self-contained in `frontend/`; talks only to **your API** + **SocketCluster** + **map tile CDN** by default. |
| **Hidden outbound (defaults)** | **Telemetry**, **Fleetbase S3 placeholder assets**, **public OSRM**, **registry host**, **GitHub/RSS/blog** in Ember widgets, **geo IP lookups**, optional **Google/Apple auth**, **Stripe/Twilio/FCM/Sentry** when configured. |
| **True air-gap** | Achievable for **core IAM/FleetOps/order flows** if you self-host DB/Redis/SocketCluster/OSRM/maps, disable telemetry, mirror assets, use `REGISTRY_PREINSTALLED_EXTENSIONS`, and avoid optional SaaS integrations — but **not** “zero config” out of the box. |

---

## 1. Source code ownership & completeness

### 1.1 What you have in this repository

| Component | In-repo path | License (per package.json/composer) | Notes |
|-----------|--------------|-------------------------------------|--------|
| Core API | `packages/core-api/` | AGPL-3.0-or-later | Auth, IAM primitives, installer, webhooks, telemetry, settings |
| FleetOps API + Ember engine | `packages/fleetops/`, `packages/fleetops-data/` | AGPL | Orders, routing, telematics hooks, integrated vendors |
| Registry bridge | `packages/registry-bridge/` | AGPL | Extension marketplace bridge |
| Storefront | `packages/storefront/` | AGPL | E-commerce / gateways |
| Ledger | `packages/ledger/` | AGPL | Accounting / Stripe driver |
| Pallet | `packages/pallet/` | AGPL | Warehouse — **not** in `api/composer.json` require list |
| Ember shared libs | `packages/ember-core/`, `packages/ember-ui/` | AGPL | Fetch, maps helpers, assets |
| Ember engines | `packages/iam-engine/`, `packages/dev-engine/`, engines above | AGPL | IAM, dev tools, etc. |
| React app | `frontend/` | (private) | Parity UI; no npm `@fleetbase` engines |
| API shell | `api/` | AGPL | Laravel app; **pulls published** `fleetbase/*` Composer packages |
| Ember console shell | `console/` | AGPL | Ember app shell |

### 1.2 Supply-chain gaps (control / completeness risks)

| Gap | Risk | Mitigation |
|-----|------|------------|
| **`api/composer.json` → `registry.fleetbase.io`** | Runtime code may differ from local `packages/` | Add Composer `path` repositories to `packages/*` and `composer update`; build your own API image from monorepo |
| **Docker `fleetbase/fleetbase-api:latest`** | Opaque image; vendor-controlled updates | Build API Dockerfile from monorepo + pinned tags |
| **Console `pnpm install` → `@fleetbase/*` from npm/GitHub** | Build requires external registry | Link local `packages/*` via `pnpm link` / workspace; vendor tarballs in private registry |
| **`GoogleIdTokenVerifier` referenced, not present in tree** | `AuthController` imports `Fleetbase\Support\GoogleIdTokenVerifier` but repo has `Fleetbase\Auth\GoogleVerifier` only — possible **broken or vendor-only class** in published package | Verify against installed `vendor/fleetbase/core-api`; align monorepo or remove Google login until fixed |
| **Default images on `flb-assets.s3.*.amazonaws.com`** | UI works offline only if URLs fail gracefully; broken avatars/icons without network | Host assets on your CDN/S3; override env defaults in `console/config/environment.js`, `packages/fleetops/config/environment.js`, model fallbacks |
| **Prebuilt extension bundles** | With `REGISTRY_PREINSTALLED_EXTENSIONS=true`, extensions ship in image/vendor — **source for every extension may not be in repo** | Inventory installed extensions in DB/`extensions` table; mirror bundles on private registry |

### 1.3 AGPL & third-party libraries

Application code is largely **AGPL**. Dependencies (Laravel, Ember, Leaflet, Stripe SDK, Google API client, etc.) are **open-source libraries**, not SaaS — but **using** them can still imply outbound calls (e.g. Google token verification → Google).

---

## 2. Infrastructure dependencies (your environment)

These are **not Fleetbase SaaS** but required for a typical Docker deployment (`docker-compose.yml`):

| Service | Image / role | Mandatory for full platform? | Offline |
|---------|----------------|-------------------------------|---------|
| **MySQL** | `mysql:8.0-oracle` | Yes | Yes (local) |
| **Redis** | `redis:4-alpine` | Yes (cache, queue) | Yes (local) |
| **SocketCluster** | `socketcluster/socketcluster:v17.4.0` | Yes if `BROADCAST_DRIVER=socketcluster` | Yes (local container) |
| **Queue worker** | `fleetbase/fleetbase-api` + `queue:work` | Yes for async mail/jobs | Yes |
| **Scheduler** | `go-crond` + crontab | Yes for scheduled FleetOps/core tasks | Yes |
| **HTTP proxy** | `httpd` build | Yes for API port 8000 | Yes |

**No cloud SaaS required** for this stack if all containers run on your hardware.

---

## 3. Master table — external runtime dependencies

Legend: **M** = Mandatory for default feature set, **O** = Optional (feature-gated), **B** = Build-time only, **D** = Default-on but disableable

| # | External target | Category | M/O | Where used | Impact if removed | Disable / self-host |
|---|-----------------|----------|-----|------------|-------------------|---------------------|
| 1 | `https://telemetry.fleetbase.io/` | Telemetry SaaS | D | `packages/core-api/src/Support/Telemetry.php`; scheduled `telemetry:ping`; `CoreServiceProvider::pingTelemetry()` on HTTP boot | No phone-home; no vendor instance metrics | `TELEMETRY_DISABLED=true` (see §3.1 bug) |
| 2 | `https://api.github.com/repos/fleetbase/fleetbase/...` | GitHub API | O | `Telemetry::getOfficialRepoCommitHash()`; `console/app/components/github-card.js` | Telemetry tag missing; Ember GitHub card empty | Remove/disable UI component; fix telemetry |
| 3 | `https://registry.fleetbase.io` | Composer + extension registry | D/O | `api/composer.json` repositories; `REGISTRY_HOST`; `registry-bridge` `Bridge.php` | Cannot install/update extensions from UI; **composer install may fail** without mirror | Private Composer registry; `REGISTRY_PREINSTALLED_EXTENSIONS=true`; path repos |
| 4 | `https://router.project-osrm.org` | Routing SaaS | D | `OSRM_HOST`, `packages/fleetops/server/src/Support/OSRM.php`, Ember OSRM services, orchestrator | No road-snapped routes on public OSRM | Self-host OSRM; set `OSRM_HOST` |
| 5 | `https://api.verso-optim.com/vrp/v1` | VROOM SaaS (default in code) | O | `VroomOrchestrationEngine.php` default `VROOM_HOST` | VRP optimization fails unless greedy fallback | Self-host VROOM; `VROOM_HOST` |
| 6 | `https://routing.fleetbase.io` | Fleetbase routing CDN/API | O | `packages/ember-core/addon/services/fetch.js` `routing()` default host | Ember routing helper fails unless `options.host` / OSRM used | Pass OSRM host in options; patch default |
| 7 | `https://maps.googleapis.com/...` | Google Maps | O | `packages/fleetops/server/config/geocoder.php`, `DistanceMatrix`, `PlaceController` | No Google geocode/matrix | Use alternate geocoder provider; leave key empty |
| 8 | `https://cartodb-basemaps-*.fastly.net/...` | Map tiles CDN | D | `frontend/src/components/common/MapView.jsx`, `ServiceAreaMapEditor.jsx` | Maps blank without tiles | Self-hosted tile server (OpenMapTiles, etc.) |
| 9 | `https://flb-assets.s3.*.amazonaws.com/...` | Fleetbase static assets | D | Many models, `config/fleetbase.php` branding, Ember `environment.js`, import templates | Broken default avatars/icons/templates | Mirror bucket; env overrides |
| 10 | `https://www.fleetbase.io/post/rss.xml` | Marketing RSS | O | `LookupController::fleetbaseBlog` | Blog widget empty | Do not call endpoint |
| 11 | `https://raw.githubusercontent.com/FortAwesome/Font-Awesome/.../icons.json` | CDN/GitHub raw | O | `LookupController::fontAwesomeIcons` | Icon picker search fails | Vendor JSON locally |
| 12 | `https://json.geoiplookup.io/` / `https://api.ipdata.co/` | Geo IP | O | `Support/Http.php` `lookupIp()`; Ember `lookup-user-ip.js` | Whois/IP features fail | `IPINFO_API_KEY` + ipdata; or disable lookups |
| 13 | `https://www.cloudflare.com/cdn-cgi/trace` | Cloudflare trace | O | `Http::trace()` when resolving public IP behind private IP | Trace/IP fallback fails | Avoid `trace()` code paths |
| 14 | `https://appleid.apple.com/auth/keys` | Apple Sign-In | O | `Auth/AppleVerifier.php` | Apple login broken | Disable Apple auth |
| 15 | Google OAuth token verify | Google | O | `Auth/GoogleVerifier.php` (via `Google_Client`) | Google login broken | Do not set `GOOGLE_OAUTH_*` |
| 16 | SMTP provider (e.g. Gmail) | Email | O | Laravel mail, onboarding, notifications | No email | Internal SMTP / Postfix |
| 17 | Twilio | SMS | O | `VerificationCode`, Twilio config | No SMS verification | Omit `TWILIO_*` |
| 18 | Firebase FCM | Push | O | `config/firebase.php`, push notifications | No mobile push | Omit Firebase config |
| 19 | Sentry | Error monitoring | O | `config/sentry.php` | No Sentry reports | Omit `SENTRY_*` |
| 20 | Stripe (`api.stripe.com`, `js.stripe.com`) | Payments | O | `stripe/stripe-php`, ledger/storefront/registry-bridge Ember | Payments fail | Do not configure Stripe |
| 21 | `https://rest.lalamove.com/` | Integrated vendor | O | `IntegratedVendors`, `Lalamove.php` | Lalamove integration only | Do not configure vendor |
| 22 | `https://flespi.io/gw`, Geotab, Samsara APIs | Telematics | O | `packages/fleetops/server/src/Support/Telematics/Providers/*` | Telematics sync off | Do not connect providers |
| 23 | `https://merchant.qpay.mn/` | QPay (Mongolia) | O | Ledger/storefront QPay drivers | QPay payments only | Region-specific |
| 24 | `https://api.messagepro.mn` | CallPro SMS (MN) | O | `CallProSmsService.php` | That SMS provider only | Config-gated |
| 25 | Customer webhook URLs | Outbound HTTP | O | `Webhook/CallWebhookJob.php` | User-defined — not Fleetbase SaaS | Control endpoint URLs |
| 26 | `https://calendar.google.com/calendar/render` | Browser link | O | FleetOps maintenance UI | Opens calendar in browser tab only | N/A |
| 27 | AWS S3 (customer bucket) | Object storage | O | `FILESYSTEM_DRIVER=s3`, Flysystem | Uploads use local disk if `local` | MinIO / self-hosted S3 |
| 28 | Mailgun / Postmark / Resend / SendGrid | Email transports | O | `api/composer.json` optional mailers | Alternative to SMTP | Configure one or SMTP only |

### 3.1 Known configuration bug — telemetry disable

`Telemetry::isDisabled()` uses `env('TELEMETRY_DISABLED', false) === true`. A `.env` value of `true` is typically the **string** `"true"`, which **fails** strict boolean comparison. Use a code fix (`Utils::castBoolean`) or verify behavior after setting the variable.

---

## 4. Build-time & package registry dependencies

| Source | Used for | Mandatory at build? | Air-gap approach |
|--------|----------|---------------------|------------------|
| **https://registry.fleetbase.io** | Composer packages `fleetbase/*` | Yes for default `composer install` in `api/` | Mirror Composer repo; path repositories to `packages/` |
| **https://registry.npmjs.org** | Public npm deps | Yes for console/frontend builds | npm mirror (Verdaccio) |
| **https://npm.pkg.github.com** | `@fleetbase/*` scoped packages | Yes for default console CI/build | Publish to private registry; link monorepo packages |
| **Docker Hub** `fleetbase/fleetbase-api`, `redis`, `mysql`, `socketcluster` | Images | Yes for default compose | Mirror images to private registry |
| **GitHub** `git` in console Dockerfile | `ssh-keyscan github.com` | If dependencies fetch from git | Vendor deps |

---

## 5. Scheduled tasks & background jobs (outbound potential)

### 5.1 Core (`CoreServiceProvider`)

| Command / job | External? | Notes |
|---------------|-----------|-------|
| `telemetry:ping` | **Yes** → telemetry.fleetbase.io | Daily; also HTTP boot ping |
| `purge:*` logs | No | Local DB |
| `sandbox:sync` | No | Local DB sync |
| `MaterializeSchedulesJob` | No* | *Unless schedules trigger external integrations |

### 5.2 FleetOps (`FleetOpsServiceProvider`)

| Command | External? |
|---------|-----------|
| `fleetops:dispatch-orders` | Only if orders use external vendors/OSRM |
| `fleetops:update-estimations` | May use Google matrix if configured |
| Maintenance reminders | Mail/SMS if notifications configured |

### 5.3 Storefront

| Command | External? |
|---------|-----------|
| `storefront:notify-order-nearby` | Push/SMS/mail if configured |
| `storefront:purge-carts` | No |

All scheduled tasks run **inside your infrastructure**; outbound depends on **configured** integrations.

---

## 6. Module-by-module breakdown

### 6.1 Core API (`packages/core-api`)

| Feature | External dep | Optional? |
|---------|--------------|-------------|
| Installer / onboard | None (local DB) | — |
| Auth email/password | Your DB | — |
| Google / Apple social login | Google, Apple | O |
| SMS verification | Twilio / CallPro | O |
| Mail | SMTP / Mailgun / etc. | O |
| Push | FCM | O |
| Webhooks | Customer URLs | O |
| Lookup: countries/currencies | Local data | — |
| Lookup: Font Awesome | GitHub raw | O |
| Lookup: blog | fleetbase.io RSS | O |
| Lookup: whois | Geo IP services | O |
| Telemetry | fleetbase.io + geo IP + GitHub | D |
| File storage | Local or AWS | O |
| Sentry | sentry.io | O |
| Default branding logos | Fleetbase S3 | D |

### 6.2 FleetOps (`packages/fleetops`)

| Feature | External dep |
|---------|--------------|
| Maps / routing | OSRM, optional VROOM, Ember `routing.fleetbase.io`, Leaflet tiles (frontend) |
| Geocoding | Google Maps (default provider in geocoder config) |
| Distance / ETA | Google Distance Matrix when key set |
| Route optimization wizard | OSRM/VROOM via API settings |
| Integrated vendors | Lalamove API |
| Telematics | Flespi, Geotab, Samsara |
| PDF labels | dompdf (local) |
| Import template download | Fleetbase S3 XLSX URL |
| Analytics reports | Local DB (name only — not Google Analytics) |

### 6.3 Registry bridge (`packages/registry-bridge`)

| Feature | External dep |
|---------|--------------|
| Browse/install extensions | `REGISTRY_HOST` HTTP API |
| Stripe in registry UI | js.stripe.com |
| npm login for publishers | npm registry (dev/publish flow) |
| Preinstalled mode | Bundles in image/storage — **reduces** live registry need |

### 6.4 Storefront & Ledger

| Feature | External dep |
|---------|--------------|
| Stripe gateway | Stripe API |
| QPay | qpay.mn |
| Product images fallback | Fleetbase S3 |

### 6.5 Pallet (`packages/pallet`)

Warehouse module — **no hardcoded external URLs** in server code reviewed; depends on core API + DB when enabled.

### 6.6 Ember console (`console/`)

| Feature | External dep |
|---------|--------------|
| API calls | Your `API_HOST` only |
| OSRM | `OSRM_HOST` env |
| Default images | Fleetbase S3 URLs |
| GitHub card component | api.github.com |
| Fleetbase blog link | fleetbase.io (browser) |
| Extension engines | Loaded from build; data from API |
| `fetch.routing()` default | routing.fleetbase.io |

### 6.7 React frontend (`frontend/`)

| Feature | External dep |
|---------|--------------|
| All API | `VITE_API_HOST` (your API) |
| Realtime | SocketCluster (local compose) |
| Maps | CartoDB/Fastly tiles (CDN) |
| No telemetry/analytics SDK found | — |
| Registry module routes | Your API `registry/v1` (may proxy to Fleetbase registry server-side) |

---

## 7. Offline / air-gapped operation matrix

| Capability | Works fully offline? | Requirements |
|------------|----------------------|--------------|
| Install / migrate / seed | Yes | Local MySQL |
| Login / IAM / CRUD | Yes | Local stack |
| Orders / dispatch (no external routing) | Partial | Without OSRM, map/routing UX degraded |
| Maps in React | No* | *Unless self-hosted tiles |
| Geocoding | No* | *Unless self-hosted Nominatim or local data |
| Extension marketplace | No | Unless preinstalled + no updates |
| Email / SMS / push | No | Unless internal mail/SMS/push |
| Payments | No | Unless not used |
| Telemetry | Yes (if disabled) | `TELEMETRY_DISABLED` + code fix |
| Composer/npm build | No | Mirror registries first |
| Default UI placeholders | Degraded | Mirror S3 assets |

---

## 8. Vendor lock-in & control risks

| Risk | Severity | Description |
|------|----------|-------------|
| **Fleetbase Composer registry** | High | `api/composer.json` defaults to `registry.fleetbase.io` for all `fleetbase/*` packages |
| **Fleetbase Docker API image** | High | Prebuilt `fleetbase/fleetbase-api:latest` may not match your git tree |
| **Fleetbase extension registry** | Medium | Extension distribution tied to `REGISTRY_HOST` unless preinstalled/mirrored |
| **Fleetbase telemetry** | Medium | Default outbound instance metadata |
| **Fleetbase S3 assets** | Low–Medium | Widespread default URLs; cosmetic + templates |
| **Public OSRM default** | Medium | Routing depends on third-party SLA |
| **routing.fleetbase.io (Ember)** | Medium | Legacy/default routing host |
| **Stripe / Twilio / Google / Apple** | Low (optional) | Standard SaaS; you choose to enable |
| **AGPL license** | Legal | Forking/modification obligations if you distribute changes |

---

## 9. Recommended hardening checklist (full control)

1. **Build API from monorepo** — Composer path repos for `packages/*`; drop reliance on `registry.fleetbase.io` for production deploys.
2. **Pin and build Docker images** — Replace `fleetbase/fleetbase-api:latest` with Dockerfile from repo.
3. **Set `TELEMETRY_DISABLED=true`** — Fix boolean parsing in `Telemetry.php` (recommended patch).
4. **Self-host:** MySQL, Redis, SocketCluster, OSRM, VROOM (optional), map tiles, object storage (MinIO).
5. **Mirror:** `flb-assets` static files; Font Awesome metadata JSON; extension bundles.
6. **`REGISTRY_PREINSTALLED_EXTENSIONS=true`** + private registry or no marketplace UI.
7. **Override env:** `OSRM_HOST`, `REGISTRY_HOST`, all `DEFAULT_*_IMAGE` URLs, `GOOGLE_*`, `TWILIO_*`, `SENTRY_*`, mail.
8. **Block egress** at firewall to: `telemetry.fleetbase.io`, `registry.fleetbase.io`, `router.project-osrm.org`, `flb-assets.s3.*`, GitHub/raw RSS — verify app still meets requirements.
9. **Audit installed extensions** in DB for hidden HTTP clients.
10. **Resolve `GoogleIdTokenVerifier`** — Confirm class exists in deployed vendor package or align `AuthController` with `GoogleVerifier`.

---

## 10. Features with incomplete or external-only implementation

| Item | Status |
|------|--------|
| **Google login** | `AuthController` references missing `GoogleIdTokenVerifier` in monorepo; `GoogleVerifier` exists under different namespace — verify before enabling |
| **Extension source** | Not all marketplace extensions may be present as source in git; bundles may be binary/vendor |
| **VROOM “fleetbase/vroom” extension** | Referenced as optional in docs; self-contained engine exists in FleetOps |
| **Pallet module** | Source in repo; not in default `api/composer.json` require |
| **React vs Ember** | React does not embed Ember engines; parity is reimplementation — Ember still depends on `@fleetbase/*` packages at build time |
| **Prebuilt API image** | May contain compiled/vendor code not identical to workspace `packages/` |

---

## 11. Document maintenance

Re-run greps after major upgrades:

```bash
# Example: find new hardcoded URLs in PHP/JS
rg "https?://" packages api frontend console --glob "*.{php,js,jsx,ts,tsx,hbs}" 
```

Update this document when adding integrations, env vars, or replacing defaults.

---

## Appendix A — Environment variables reference (external-related)

| Variable | Service |
|----------|---------|
| `TELEMETRY_DISABLED` | Fleetbase telemetry |
| `REGISTRY_HOST`, `REGISTRY_TOKEN`, `REGISTRY_PREINSTALLED_EXTENSIONS` | Extension registry |
| `OSRM_HOST` | OSRM routing |
| `VROOM_HOST` | VROOM optimization |
| `GOOGLE_MAPS_API_KEY`, `GOOGLE_OAUTH_CLIENT_ID/SECRET` | Google |
| `IPINFO_API_KEY` | ipdata.co |
| `MAIL_*` | SMTP / mail provider |
| `TWILIO_*` | Twilio |
| `SENTRY_*` | Sentry |
| `AWS_*`, `FILESYSTEM_DRIVER` | S3 storage |
| Firebase settings (DB/system settings) | FCM |
| `VITE_API_HOST`, `VITE_SOCKETCLUSTER_*` | React → your infra |
| `FRONTEND_HOSTS` | CORS for your frontends |

---

## Appendix B — React frontend external touchpoints (complete list)

| URL / service | File |
|---------------|------|
| User API (`VITE_API_HOST`) | `frontend/src/lib/env.js` |
| SocketCluster | `frontend/src/domain/fleetops/realtime/*` |
| CartoDB/Fastly tiles | `MapView.jsx`, `ServiceAreaMapEditor.jsx` |
| Inline SVG noise (data URI) | `index.css` — **no network** |

No Mixpanel/Segment/Google Analytics SDK detected in `frontend/src`.

---

## Appendix C — Ember console external touchpoints (additional)

| URL / service | File |
|---------------|------|
| `api.github.com` | `console/app/components/github-card.js` |
| `fleetbase.io` blog | `console/app/components/fleetbase-blog.hbs` |
| Geo IP | `packages/ember-core/addon/utils/lookup-user-ip.js` |
| `routing.fleetbase.io` | `packages/ember-core/addon/services/fetch.js` |

---

*End of audit.*


final answer:-
✅ Yes, we have the complete backend, React frontend, and original Ember codebase. The main remaining concerns are a few external services (registry, telemetry, OSRM, map tiles, assets, and prebuilt Docker images), which can be self-hosted, replaced, or disabled if full ownership is required.