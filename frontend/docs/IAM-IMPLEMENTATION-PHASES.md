# IAM React — Implementation Phases (~40% → 100%)

**Canonical execution plan.** Gap inventory: [IAM-GAPS.md](./IAM-GAPS.md).

| Field | Value |
|-------|--------|
| **Version** | 1.3 |
| **Date** | 2026-05-29 |
| **Baseline** | **~40%** → … → **~100%** (P6 user-form; G-IAM040 deferred) |
| **Target** | **~100%** IAM engine parity (in-scope) |

---

## Summary timeline

| Phase | Name | Parity Δ | Cumulative |
|-------|------|----------|------------|
| — | Baseline | — | **~40%** |
| **1** | Users production-grade | +15% | ~55% |
| **2** | Roles & permissions depth | +12% | ~67% |
| **3** | Groups & members | +8% | ~75% |
| **4** | Policies module | +15% | ~90% |
| **5** | Console polish & QA | +10% | ~100% |
| **6** | User-form & IAM closure | closure | **~100%** in-scope |

---

## Phase 1 — Users production-grade ✅

**G-IDs:** G-IAM001–G-IAM018, G-IAM010, G-IAM011

### Deliverables

- [x] Server pagination + filters on `UsersList` (`page`, `limit`, `query`, `role`, `status`, `name`, `email`, `phone`)
- [x] `users/drivers` and `users/customers` routes (tabs like Ember)
- [x] Lifecycle: `deactivate`, `activate`, `verify`, `resend-invite`, `change-password`, `remove-from-company`
- [x] Create user modal (not invite-only); role assign on detail
- [x] View effective permissions modal
- [x] Export + bulk delete
- [x] Extend `iamService` + `useIamListPage` + E2E (`e2e/iam/access.spec.ts`, `users-lifecycle.spec.ts`)

### Exit criteria

- [x] Can invite/create user with **Driver** role (IAM user + role assignment; FleetOps abilities via role)
- [x] G-IAM001–018, G-IAM010–011 → **Done** in IAM-GAPS §9

---

## Phase 2 — Roles & permissions depth ✅

**G-IDs:** G-IAM021–G-IAM027, G-IAM023

### Deliverables

- [x] Edit/delete role with `is_mutable` / `is_deletable` guards (Ember parity)
- [x] `PolicyAttacher` + wire to role save (matrix + role form)
- [x] `GET /auth/services` service filter; FLB vs org-managed type filter
- [x] Export roles; server pagination (`useRolesListPage`)
- [x] E2E `e2e/iam/roles-lifecycle.spec.ts`

### Exit criteria

- [x] G-IAM021–027, G-IAM023 → **Done** in IAM-GAPS §9

---

## Phase 3 — Groups & members ✅

**G-IDs:** G-IAM020, G-IAM028, G-IAM029

### Deliverables

- [x] `useGroupsListPage` + server pagination/search on `GroupsList`
- [x] `/iam/groups/:id` `GroupDetail` — members table, add/remove, edit/delete
- [x] `PolicyAttacher` N/A; `iamService` member sync via `group.users`
- [x] E2E `e2e/iam/groups-lifecycle.spec.ts`

### Exit criteria

- [x] Create group with default role → add user → member in list; remove member; edit/delete when allowed
- [x] G-IAM020, G-IAM028, G-IAM029 → **Done** in IAM-GAPS §9

---

## Phase 4 — Policies module ✅

**G-IDs:** G-IAM030–G-IAM034 (G-IAM023 Done on roles in Phase 2)

### Deliverables

- [x] `/iam/policies` — `PoliciesList` with server pagination, service/type filters, permission matrix
- [x] Create/edit/delete org policies; FLB-managed read-only + `ViewPolicyPermissionsDialog`
- [x] `listPolicies` / `listPoliciesPage` shared catalog for `PolicyAttacher` on roles
- [x] E2E `e2e/iam/policies-lifecycle.spec.ts`

### Exit criteria

- [x] G-IAM030–034 → **Done** in IAM-GAPS §9

---

## Phase 5 — Console polish & QA ✅

**G-IDs:** G-IAM035–G-IAM037, G-IAM041–G-IAM042 (**G-IAM040** organizations deferred)

### Deliverables

- [x] Header IAM shortcuts (6) — `lib/iam/headerShortcuts.js`, `Header.jsx` (`data-testid="iam-header-shortcuts"`)
- [x] IAM metrics widget — `IamMetricsWidget`, `iamService.getIamMetrics()`, dashboard `iam-metrics-widget`
- [x] IAM home `/iam` — `IamHome.jsx` quick links
- [x] `useIamAbility` gates on all IAM pages (create/edit/delete/export/matrix/members)
- [x] MVP i18n — `en.json` `iam.*` keys + `t()` on home/widget
- [x] E2E `access.spec.ts` extensions; IAM-GAPS §11 sign-off; docs v1.5

### Exit criteria

- [x] G-IAM035–037, G-IAM041–042 → **Done** in IAM-GAPS §9
- [x] G-IAM040 → **Deferred** (documented out of scope)
- [x] `npm run build && npm run verify:release`

---

## Phase 6 — User-form & IAM closure ✅

**G-IDs:** G-IAM043–G-IAM046 (**G-IAM047** N/A; **G-IAM040** deferred)

### Deliverables

- [x] `UserAccessSection` + `UserFormDialog` — policies (`PolicyAttacher`) + direct permissions (matrix)
- [x] `UserDetail` access control card; create via `UserFormDialog`; invite unchanged (role-only)
- [x] `mapUser` — `policies`, `directPermissions`, `effectivePermissions`; `lib/iam/userPayload.js`
- [x] Groups export; bulk delete roles/groups/policies
- [x] E2E `e2e/iam/user-access-control.spec.ts`; docs v1.6

### Exit criteria

- [x] POST/PATCH `/users` sends `user.policies[]` + `user.permissions[]` with `role_uuid` / `role`
- [x] G-IAM043–046 → **Done** in IAM-GAPS §9

---

*Do not duplicate gap lists here — update [IAM-GAPS.md](./IAM-GAPS.md) when gaps close.*
