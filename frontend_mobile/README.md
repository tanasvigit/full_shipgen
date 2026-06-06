# Fleetbase Mobile

React Native (Expo) driver operations app connected to the Fleetbase backend (`int/v1` API).

## Structure

- `frontend/` — Expo Router mobile app
- `memory/PRD.md` — product overview
- `design_guidelines.json` — UI/design reference

## Quick start

```bash
cd frontend
yarn install
yarn start
```

Sign in with your Fleetbase account credentials.

## API configuration

Set the backend base URL (same namespace as the React console):

```bash
# .env or shell
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/int/v1
```

Default if unset: `http://localhost:8000/int/v1`

## End-to-end guide

See **[docs/END-TO-END-GUIDE.md](./docs/END-TO-END-GUIDE.md)** for the full dispatcher → driver → console realtime flow (aligned with `documents/BACKEND-LOW-LEVEL-REQUIREMENTS.md` and `documents/LOW-LEVEL-REQUIREMENTS.md`).

## API compatibility matrix

See **[docs/API-COMPATIBILITY-MATRIX.md](./docs/API-COMPATIBILITY-MATRIX.md)** for normalized endpoint contracts, wrappers (`unwrapEntity`, `unwrapList`), and `/int/v1` alignment notes.

## Architecture (Phase 1)

See **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** for service-layer rules, tenant-scoped query keys, mutation conventions, and org-safe cache invalidation.

Run unit tests:

```bash
cd frontend
npm test
```

### Socket configuration (Phase 2)

Optional env vars for SocketCluster (defaults derive from API host):

```bash
EXPO_PUBLIC_SOCKET_HOSTNAME=localhost
EXPO_PUBLIC_SOCKET_PORT=38000
EXPO_PUBLIC_SOCKET_SECURE=false
EXPO_PUBLIC_SOCKET_PATH=/socketcluster/
```

## Day 4 integration

The mobile app is a thin client over existing FleetOps contracts:

- Auth: `/auth/login`, `/users/me`, `/auth/logout`
- Orders: `/orders` (assigned / active / completed buckets)
- Workflow: `/orders/next-activity/{id}` + `/orders/update-activity/{id}` (server-driven)
- Tracking: `/orders/{id}/track`
- POD: `/orders/{id}/capture-signature`, `capture-photo`, `capture-qr`

Run contract tests from the main frontend repo:

```bash
cd ../../frontend
npm run test:e2e:day4
```
