# Play Store signing — backup & future releases

Google Play requires every release AAB to be signed with the **same upload key**. If you lose the keystore, you cannot publish updates to the existing app listing (only Google support can help, and recovery is not guaranteed).

## Files you MUST backup

These are the most important files (all under `frontend/android/` unless noted):

| File | Path | Purpose |
|------|------|---------|
| **Upload keystore** | `app/upload-keystore.jks` | Private signing key — **never lose this** |
| **Gradle signing config** | `key.properties` | Store path, alias, passwords for builds |
| **Credential reference** | `keystore.credentials` | Human-readable copy of passwords + alias |

Also save these values in a password manager (they are inside `key.properties` / `keystore.credentials`):

- **Keystore password** (`storePassword`)
- **Key alias** (`upload`)
- **Key password** (`keyPassword`)

### Store backups somewhere safe

- Google Drive (encrypted folder or zip with password)
- Password manager (1Password, Bitwarden, etc.)
- External SSD or pendrive (offline copy)

**Never commit** `.jks`, `key.properties`, or `keystore.credentials` to git — they are listed in `.gitignore`.

---

## Build a signed AAB (local)

From `frontend_mobile/frontend`:

```bash
npm run android:release:aab
```

This script:

1. Uses existing `upload-keystore.jks` + `key.properties` if present
2. Creates them only on first run (then you must back them up immediately)
3. Runs `gradlew bundleRelease`
4. Copies the AAB to `dist/shipgen-mobile-YYYYMMDD-HHMMSS.aab`

Output paths:

- **Timestamped copy:** `frontend/dist/shipgen-mobile-*.aab`
- **Gradle output:** `frontend/android/app/build/outputs/bundle/release/app-release.aab`

### Optional: set passwords via environment (CI or new machine)

```powershell
$env:ANDROID_KEYSTORE_PASSWORD = "your-store-password"
$env:ANDROID_KEY_PASSWORD = "your-key-password"
npm run android:release:aab
```

Only needed when **generating** a new keystore. Normal rebuilds read `key.properties`.

---

## Restore signing on a new PC

1. Copy these three files into the same paths:
   - `android/app/upload-keystore.jks`
   - `android/key.properties`
   - (optional) `android/keystore.credentials`
2. Install JDK 17+ and Android SDK / Android Studio
3. `npm install` in `frontend_mobile/frontend`
4. Run `npm run android:release:aab`

Template for `key.properties` (replace placeholders): see `android/key.properties.example`.

---

## Play Console upload

1. [Google Play Console](https://play.google.com/console) → your app
2. **Production** or **Internal testing** → **Create new release**
3. Upload the `.aab` from `dist/`
4. First upload: enroll in **Play App Signing** when prompted

**App ID:** `com.shipgen.mobile`

---

## Version bumps before each release

Edit `frontend/android/app/build.gradle`:

- `versionCode` — integer, must increase every Play upload
- `versionName` — user-visible version string (e.g. `1.0.2`)

Then rebuild the AAB.

---

## If you already registered a different upload key

If an earlier build was uploaded with another keystore, you **must** use that original `.jks` — do not generate a new one. Place it at `android/app/upload-keystore.jks` and update `key.properties` to match.

---

## Quick checklist (every release)

- [ ] Backed up `upload-keystore.jks`, `key.properties`, `keystore.credentials`
- [ ] Passwords saved in password manager
- [ ] Bumped `versionCode` / `versionName`
- [ ] `npm run android:release:aab` succeeded
- [ ] Uploaded `dist/shipgen-mobile-*.aab` to Play Console
