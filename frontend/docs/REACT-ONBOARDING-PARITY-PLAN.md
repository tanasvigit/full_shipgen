# React Onboarding Parity Plan (vs Ember)

Canonical plan to implement first-account onboarding in React with parity to Ember's `onboard` flow.
Fresh setup sequence in React is now: **Install (`/install`) -> Onboard (`/auth/onboard`) -> Login (`/auth`)**.

| Field | Value |
|------|-------|
| Version | 1.1 |
| Date | 2026-06-02 |
| Scope | React public onboarding + verification + startup gating |
| Out of scope | Logged-in FleetOps checklist at `/onboarding` (already exists) |

---

## 1) Current state

### Ember (`console/`)
- Public onboarding route exists (`onboard`, `onboard/verify-email`).
- Signup posts to `POST /onboard/create-account`.
- Verification posts to `POST /onboard/verify-email`.
- Resend APIs are used (`send-verification-email`, `send-verification-sms`).
- Login includes "Create account" path.

### React (`frontend/`)
- `/onboarding` exists but is a logged-in setup wizard.
- Route is behind `RequireAuth`, so unauthenticated users are redirected to `/auth`.
- Public first-account onboarding UI is missing.

### Backend (`core-api`)
- Required onboarding endpoints already exist:
  - `GET /int/v1/onboard/should-onboard`
  - `POST /int/v1/onboard/create-account`
  - `POST /int/v1/onboard/verify-email`
  - `POST /int/v1/onboard/send-verification-email`
  - `POST /int/v1/onboard/send-verification-sms`
- First account is assigned `Administrator` in `OnboardController`.

---

## 2) Target parity behavior

For a fresh installation:

1. App checks `should-onboard`.
2. If true and user is not authenticated, route to public onboarding form.
3. User submits account + organization details.
4. App calls `create-account`.
5. If `skipVerification` is true, sign in and continue.
6. Otherwise, route to verification screen.
7. User verifies with code; app calls `verify-email`.
8. On success, authenticate and enter console.
9. Existing logged-in setup checklist (`/onboarding`) remains separate.

---

## 3) Delivery phases

## Phase 1 - Public route and startup gate ✅ Done

### Deliverables
- Add public routes under auth layout:
  - `/auth/onboard`
  - `/auth/onboard/verify-email`
- Keep `/onboarding` as logged-in checklist.
- Add startup check with `GET /onboard/should-onboard`.
- If onboarding is required, redirect unauthenticated users to `/auth/onboard`.

### Acceptance criteria
- Fresh DB opens onboarding form without login.
- Existing tenants still see normal auth flow.

### Completion notes
- Added public auth routes: `/auth/onboard` and `/auth/onboard/verify-email`.
- Kept existing `/onboarding` route unchanged under auth guard.
- Added one-time startup gate via `GET /int/v1/onboard/should-onboard` in `AuthContext`.
- Unauthenticated redirects now route to `/auth/onboard` when onboarding is required, else `/auth`.
- Added login CTA: "Create account" -> `/auth/onboard`.

---

## Phase 2 - Create account form parity ✅ Done

### Deliverables
- React onboarding form with:
  - full name
  - email
  - phone
  - organization name
  - password
  - password confirmation
- Validation parity with API request rules.
- Submit to `POST /onboard/create-account`.
- Handle response:
  - `skipVerification=true`: authenticate directly.
  - otherwise, store session and go to verify step.

### Acceptance criteria
- Form creates first account successfully.
- API validation errors map to UI cleanly.

### Completion notes
- Implemented `/auth/onboard` form fields: `name`, `email`, `phone`, `organization_name`, `password`, `password_confirmation`.
- Added client validation for required fields, email format, and password confirmation match.
- Wired `POST /int/v1/onboard/create-account` through `authService.createOnboardingAccount`.
- Added response branching:
  - `skipVerification=true` + token: stores auth, bootstraps user/org, and routes to `/`.
  - otherwise: stores onboarding session in auth context and routes to `/auth/onboard/verify-email`.
- Verification submit/resend remains intentionally deferred to Phase 3.

---

## Phase 3 - Verification parity ✅ Done

### Deliverables
- Verification screen:
  - code input
  - submit to `POST /onboard/verify-email`
- Resend actions:
  - `POST /onboard/send-verification-email`
  - `POST /onboard/send-verification-sms`
- On success, persist token/session and route to console.

### Acceptance criteria
- Verify flow works end-to-end for first account.
- Resend actions work and show clear success/error states.

### Completion notes
- Implemented verification page code input + submit to `POST /int/v1/onboard/verify-email` with `{ session, code }`.
- Added auth handoff on verify success (`token` persisted + bootstrap) and route to `/`.
- Added resend actions:
  - email -> `POST /int/v1/onboard/send-verification-email` with `{ session, email }`
  - sms -> `POST /int/v1/onboard/send-verification-sms` with `{ session, phone }`
- Added guarded missing-session fallback: displays message and safely redirects back to `/auth/onboard`.
- Assumption: verify response always includes a `token` on success; missing token is treated as an error.

---

## Phase 4 - Context persistence and recovery ✅ Done

### Deliverables
- Add onboarding context store in React:
  - persist non-sensitive fields
  - never persist password fields
- Restore partially completed onboarding form after refresh.
- Clear context after successful completion.

### Acceptance criteria
- Reload during onboarding preserves non-sensitive progress.
- Password fields are never stored in local storage.

### Completion notes
- Added centralized onboarding persistence store with key `onboarding:context:v1`.
- Persisted allowlist fields only: `name`, `email`, `phone`, `organization_name`, `session`.
- Explicitly excluded sensitive values from persistence: `password`, `password_confirmation`, verification code, auth token.
- `/auth/onboard` now restores non-sensitive draft fields after refresh.
- `/auth/onboard/verify-email` recovers session/email/phone after refresh when available.
- Successful onboarding verification now clears persisted onboarding context and in-memory onboarding state.

---

## Phase 5 - UX integration ✅ Done

### Deliverables
- Add "Create account" CTA on login page to `/auth/onboard`.
- Prevent redirect loops between `/auth` and onboarding routes.
- Ensure onboarding-required state is obvious and deterministic.

### Acceptance criteria
- New install users can self-serve first account creation.
- Existing users are not blocked by onboarding checks.

### Completion notes
- Added retry actions and clearer inline/toast errors for create/verify/resend onboarding actions.
- Hardened malformed response handling for create-account and verify flows with safe-path recovery.
- Added frontend debug logging hooks for onboarding failures (`create-account`, `verify`, `resend-email`, `resend-sms`) without sensitive payloads.
- Added E2E hardening scenarios for malformed responses, bootstrap failure recovery, and retry/button-state behavior.
- Reduced auth-suite flake by waiting out transient loader overlays before logout interactions.

### Known limitations
- Observability is dev-console based only; no external telemetry shipping yet.

---

## Phase 6 - QA, docs, and release

### Deliverables
- E2E coverage:
  - should-onboard true path
  - create-account flow
  - verify-email flow
  - resend email/SMS
  - should-onboard false path
- Regression coverage for login/2FA/forgot-password.
- Documentation updates:
  - deployment first-account steps
  - route map for onboarding paths
  - troubleshooting section

### Acceptance criteria
- Build and release checks pass.
- First user creation works from UI on a clean setup.

---

## 4) API contract notes

- `create-account` response should support:
  - `status`
  - `session`
  - `token` (when applicable)
  - `skipVerification`
- `verify-email` response should support:
  - `status`
  - `token`
  - `verified_at`

Frontend should treat API as source-of-truth for validation and status transitions.

---

## 5) Risks and mitigations

- **Route guard conflict**: onboarding route accidentally protected by auth guard.
  - Mitigation: keep `/auth/onboard*` under public auth layout only.
- **Token/session mismatch** after verification.
  - Mitigation: centralize auth handoff in one onboarding auth helper.
- **Tenant confusion** between public onboarding and logged-in checklist.
  - Mitigation: keep naming and route intent explicit in UI copy.

---

## 6) Completion definition

This parity project is complete when:
- first account can be created entirely from React UI,
- verification + resend flow works,
- first user becomes `Administrator`,
- existing logged-in setup checklist stays functional,
- and E2E covers both onboarding-required and onboarding-not-required states.

