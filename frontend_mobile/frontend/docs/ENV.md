# Mobile environment files

The Fleetbase mobile app reads configuration from `.env` in this directory (`frontend_mobile/frontend`).

## Files

| File | Purpose |
|------|---------|
| `.env` | Active env at build/runtime. Overwritten by USB scripts — treat as generated. |
| `.env.usb` | Source template for physical Android devices via USB + `adb reverse`. |
| `frontend/.env` | **Web console only** (`VITE_*`). Not used by the mobile app. |

## USB development

```bash
npm run run-android:usb
```

This copies `.env.usb` → `.env`, sets up port forwarding, and launches the dev build.

Required variables in `.env.usb`:

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/int/v1
EXPO_PUBLIC_YMS_API_BASE_URL=http://127.0.0.1:8000/api/yms
EXPO_PUBLIC_SOCKET_HOSTNAME=127.0.0.1
EXPO_PUBLIC_SOCKET_PORT=38000
EXPO_PUBLIC_SOCKET_SECURE=false
EXPO_PUBLIC_SOCKET_PATH=/socketcluster/
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-key-here
```

After changing the Google Maps key, rebuild the native app (`npm run run-android:usb` or `expo run:android`).

## Notes

- Only variables prefixed with `EXPO_PUBLIC_` are exposed to the JavaScript bundle.
- Do not commit real API keys; keep secrets in local `.env.usb` / `.env` (both should stay gitignored).
