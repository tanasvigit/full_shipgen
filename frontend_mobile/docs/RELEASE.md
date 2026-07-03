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
- Android `versionCode` / `versionName` in `android/app/build.gradle`
- EAS `production.autoIncrement` for build numbers (EAS builds only)

## Play Store — local signed AAB

For Google Play uploads built on this machine (not EAS):

```bash
cd frontend
npm run android:release:aab
```

Signed output: `frontend/dist/fleetbase-mobile-*.aab`

**Critical:** Back up signing files before every release. Full instructions:

→ **[PLAYSTORE_SIGNING.md](./PLAYSTORE_SIGNING.md)** — keystore backup, restore on new PC, version bumps, Play upload

### Files you MUST backup (never lose)

| File | Location |
|------|----------|
| `upload-keystore.jks` | `frontend/android/app/` |
| `key.properties` | `frontend/android/` |
| `keystore.credentials` | `frontend/android/` |

Also save in a password manager: **keystore password**, **key alias** (`upload`), **key password**.

Store copies on Google Drive, a password manager, and/or an external SSD/pendrive.

## Pre-release checklist

1. `npm test`
2. `npm run lint`
3. Manual E2E: login → dispatch order → start → POD → complete
4. Offline replay test
5. Background location permission UX review (iOS/Android)
