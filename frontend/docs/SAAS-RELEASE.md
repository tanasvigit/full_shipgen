# FleetOps React — SaaS & release readiness

Phase 5 foundations for multi-tenant SaaS, deployment, onboarding, billing architecture, and demos.

## Multi-tenant (5A)

- **TenantProvider** (`src/contexts/TenantContext.jsx`) — per-organization branding, preferences, onboarding state (localStorage keyed by org id).
- **Settings** (`/settings`) — organization profile, branding (logo URL, colors, product name), operational preferences, notifications, billing preview.
- CSS variables: `--tenant-primary`, `--tenant-accent` applied on theme change.

## Onboarding (5B)

- **Setup wizard**: `/onboarding`
- **Floating checklist**: bottom-right on console layout; persists progress per tenant.
- **Demo data shortcut** from wizard enables demo mode and opens orders hub.

## Deployment & runtime (5C)

- **validateRuntimeConfig** (`src/lib/runtimeConfig.js`) — warns on missing/invalid env at dev boot.
- **PlatformProvider** — online/offline detection, periodic API + websocket health checks.
- **PlatformErrorBoundary** — graceful crash screen with reload.
- **OfflineBanner** — degraded connectivity messaging.

## Billing foundations (5D)

- **Plans** (`src/lib/subscription/plans.js`) — Starter / Professional / Enterprise with feature flags and limits.
- **useSubscription** + **FeatureGate** — e.g. order config manager gated on Starter.
- Stripe not integrated; Settings billing tab is UI-ready.

## Demo mode (5E)

- Toggle from **Platform health** (`/admin/health`) or onboarding wizard.
- **DemoModeProvider** — seeded orders/drivers, animated driver positions on map, no API writes on orders list load.

## Admin tools (5G)

- **Platform health** (`/admin/health`) — API latency, websocket state, runtime config summary, demo toggle, plan preview.

## Release verification (5H)

```bash
cd frontend
npm run build
node scripts/verify-release.mjs
npm run test:e2e:fleetops:form-dropdowns   # smoke subset
```

## Environment variables

Copy `.env.example` to `.env` and set `VITE_API_HOST` to your Fleetbase API origin.

## Next steps (incremental)

1. Persist branding/preferences via Fleetbase organization API when endpoints are available.
2. Wire Stripe Customer Portal to Settings billing tab.
3. Server-side tenant isolation tests against org-scoped API headers.
4. Expand E2E: onboarding wizard, demo mode, feature gates.
