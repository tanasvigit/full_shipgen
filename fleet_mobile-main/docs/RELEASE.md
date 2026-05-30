# Fleetbase Mobile — Release Guide

## Build profiles (EAS)

- `development` — dev client, internal distribution
- `preview` — internal QA channel
- `production` — store-ready builds with auto version increment

```bash
cd frontend
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile production --platform ios
```

## Environment variables

Production builds should set:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_SOCKET_HOSTNAME`
- `EXPO_PUBLIC_SOCKET_PORT`
- `EXPO_PUBLIC_SOCKET_SECURE`
- `EXPO_PUBLIC_SOCKET_PATH`
- `EXPO_PUBLIC_SENTRY_DSN` (optional)

## OTA strategy

- Use EAS Update channels aligned with `eas.json` (`preview`, `production`)
- Restrict OTA to JS/assets; native module changes require new binary builds

## Versioning

- App version in `app.json` (`expo.version`)
- EAS `production.autoIncrement` for build numbers

## Pre-release checklist

1. `npm test`
2. `npm run lint`
3. Manual E2E: login → dispatch order → start → POD → complete
4. Offline replay test
5. Background location permission UX review (iOS/Android)
