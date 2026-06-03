# IAM Engine — Gap Analysis (Ember `@fleetbase/iam-engine` vs React)

**Canonical document** for Identity & Access Management parity between the original Ember engine and the React console rebuild.

| Field | Value |
|-------|--------|
| **Version** | 1.6 |
| **Date** | 2026-05-29 |
| **Baseline Ember** | `packages/iam-engine` — mount `/iam` |
| **Baseline React** | `frontend/src/pages/iam`, `frontend/src/services/iam.js` |
| **Backend** | `packages/core-api` — users, roles, groups, policies, permissions (shared) |
| **Related** | FleetOps roles in `packages/fleetops/server/src/Auth/Schemas/FleetOps.php` (separate from IAM schema) |

---

## 1. Executive summary

| Statement | Fact |
|-----------|------|
| **React IAM exists** | Yes — full `/iam/*` surface in `App.jsx` (home, users ×3, groups, roles, policies) |
| **Ember route surface** | 7 primary areas (home, users ×3 tabs, groups, roles, policies) |
| **React route surface** | 9 routes (home + users/drivers/customers + detail + groups + roles + policies) |
| **Weighted functional parity** | **~100%** in-scope vs Ember IAM engine (Phases 1–6; **G-IAM040 deferred**) |
| **User form** | Create/edit includes role + **policies** + **direct permissions** (`UserFormDialog`, `UserAccessSection`) |
| **Deferred (product)** | Organizations UI (**G-IAM040**) — orphan Ember template; not in React scope unless requested |
| **Backend** | Same Laravel API — `GET /metrics/iam`, users/roles/groups/policies CRUD shared |

**Strongest React areas:** production users lifecycle, roles/policies matrices + policy attacher, groups + members, console header shortcuts, IAM metrics widget, `useIamAbility` action gates.

**Explicitly out of scope:** Organizations management (**G-IAM040**); full Ember `iam.*` yaml i18n parity deferred to follow-up tickets (minimum `en.json` keys shipped — **G-IAM041** MVP).

**Out of scope (this doc):** Auth login/signup (`AuthContext`), console `/settings` org profile, FleetOps `useFleetopsAbility` (documented in [FLEETOPS-GAPS.md](./FLEETOPS-GAPS.md)).

---

## 2. Architecture comparison

| Layer | Ember | React |
|-------|-------|-------|
| **Engine** | `ember-engine` mount `iam` | React routes under `/iam/*` |
| **Data** | Ember Data `store` + `crud` service | `iamService` + `apiClient` |
| **Permissions** | `abilities` (`iam view user`, …) | `RequirePermission` (`users.view`, `roles.view`, `groups.view`) |
| **Tables** | Shared `Table` + query params + meta pagination | `DataTable` client-side search/page (users only) |
| **Modals** | `modalsManager` + `.hbs` modals | `QuickCreateDialog` (invite, create role/group only) |
| **Extension** | `extension.js` — header menu + dashboard widget | Header 6 shortcuts + sidebar nav + `iam-metrics-widget` |

---

## 3. Route catalog (Ember → React)

Mount prefix: **`/iam`**.

| Ember route | React route | Status |
|-------------|-------------|--------|
| `home` (`/`) | `/iam` → `IamHome.jsx` (quick links) | ✅ **G-IAM037** |
| `users` → `index` | `/iam/users` → `UsersList.jsx` | ✅ |
| `users` → `drivers` | `/iam/users/drivers` → `UsersList.jsx` (tab) | ✅ **G-IAM010** |
| `users` → `customers` | `/iam/users/customers` → `UsersList.jsx` (tab) | ✅ **G-IAM011** |
| `users` → detail/edit (modal + resource) | `/iam/users/:id` → `UserDetail.jsx` | ✅ |
| `groups` → `index` | `/iam/groups` → `GroupsList.jsx` | ✅ |
| `groups` → detail | `/iam/groups/:id` → `GroupDetail.jsx` | ✅ **G-IAM020** |
| `roles` → `index` | `/iam/roles` → `RolesList.jsx` | ✅ |
| `roles` → detail/edit (modal) | — (inline on list) | ✅ N/A (Ember modal → React sidebar) |
| `policies` → `index` | `/iam/policies` → `PoliciesList.jsx` | ✅ **G-IAM030** |
| `organizations/index` (orphan in package) | — | ⏸️ **Deferred G-IAM040** |

**React routes in `App.jsx`:**

```text
/iam                    → IamHome (quick links)
/iam/users              → UsersList (all)
/iam/users/drivers      → UsersList (is_driver filter)
/iam/users/customers    → UsersList (is_customer filter)
/iam/users/:id          → UserDetail
/iam/roles              → RolesList
/iam/groups             → GroupsList
/iam/groups/:id         → GroupDetail
/iam/policies           → PoliciesList
```

---

## 4. React implementation inventory

### 4.1 Pages

| File | Purpose |
|------|---------|
| `pages/iam/UsersList.jsx` | List, invite dialog, navigate to detail |
| `pages/iam/UserDetail.jsx` | Profile edit, 2FA toggle, disable via `status` patch |
| `pages/iam/RolesList.jsx` | Role list + permission matrix + create role |
| `pages/iam/IamHome.jsx` | IAM overview quick links (**G-IAM037**) |
| `pages/iam/GroupsList.jsx` | Groups table + server pagination |
| `pages/iam/GroupDetail.jsx` | Members CRUD, default role |
| `pages/iam/PoliciesList.jsx` | Policies list + permission matrix |
| `components/iam/dashboard/IamMetricsWidget.jsx` | Dashboard `GET /metrics/iam` (**G-IAM036**) |

### 4.2 Service (`services/iam.js`)

| Method | API | UI wired |
|--------|-----|----------|
| `listUsers` | `GET /users` | ✅ UsersList |
| `getUser` | `GET /users/:id` | ✅ UserDetail |
| `inviteUser` | `POST /users/invite-user` | ✅ UsersList |
| `updateUser` | `PATCH /users/:id` | ✅ UserDetail (partial fields) |
| `listRoles` | `GET /roles` | ✅ |
| `getRole` | `GET /roles/:id` | ✅ RolesList hydrate |
| `createRole` | `POST /roles` | ✅ |
| `updateRole` | `PATCH /roles/:id` | ✅ permissions |
| `listPermissions` | `GET /permissions` | ✅ RolesList matrix |
| `listGroups` | `GET /groups` | ✅ |
| `createGroup` | `POST /groups` | ✅ |
| `getGroup` | `GET /groups/:id` | ✅ GroupDetail |
| `updateGroup` | `PATCH /groups/:id` | ✅ GroupDetail |
| `getIamMetrics` | `GET /metrics/iam` | ✅ IamMetricsWidget |

### 4.3 E2E

| Spec | Coverage |
|------|----------|
| `e2e/iam/access.spec.ts` | Home, header shortcuts, dashboard widget, ability smoke |
| `e2e/iam/users-lifecycle.spec.ts` | User CRUD lifecycle |
| `e2e/iam/roles-lifecycle.spec.ts` | Roles matrix + export |
| `e2e/iam/groups-lifecycle.spec.ts` | Group members |
| `e2e/iam/policies-lifecycle.spec.ts` | Policies CRUD |

---

## 5. Module gaps

> **v1.5:** G-IAM001–034 (sections 5.1–5.4) are **Done** from Phases 1–4. Section 5.5 reflects Phase 5 console polish. Historical ❌ rows in 5.1–5.4 are kept for audit only.

### 5.1 Users

| Capability | Ember | React | Gap ID |
|------------|-------|-------|--------|
| Server pagination + meta | ✅ queryParams `page`, `limit` | ❌ client `DataTable` | **G-IAM001** |
| Column filters (name, email, phone, role, status) | ✅ | ❌ search only | **G-IAM002** |
| Sort (`-created_at`, etc.) | ✅ | ❌ | **G-IAM003** |
| Invite user | ✅ modal | ✅ QuickCreateDialog | — |
| Create user (full form) | ✅ `user-form` | ❌ invite only | **G-IAM004** |
| Export users | ✅ `GET/POST export` | ❌ | **G-IAM005** |
| Bulk delete | ✅ | ❌ | **G-IAM006** |
| Deactivate user | ✅ `PATCH deactivate/:id` | 🟡 `status` on UserDetail | **G-IAM007** |
| Activate user | ✅ `PATCH activate/:id` | 🟡 enable via status | **G-IAM008** |
| Verify user | ✅ `PATCH verify/:id` | ❌ | **G-IAM009** |
| Resend invitation | ✅ `POST resend-invite` | ❌ | **G-IAM012** |
| Change user password (admin) | ✅ `change-password` modal | ❌ toast placeholder | **G-IAM013** |
| View effective permissions | ✅ `view-user-permissions` | ❌ | **G-IAM014** |
| Remove from company | ✅ API | ❌ | **G-IAM015** |
| Phone column / edit | ✅ | ❌ | **G-IAM016** |
| Role assignment on detail | ✅ | 🟡 read-only on detail | **G-IAM017** |
| Drivers tab (`users/drivers`) | ✅ filtered list | ❌ | **G-IAM010** |
| Customers tab (`users/customers`) | ✅ filtered list | ❌ | **G-IAM011** |
| Row actions dropdown | ✅ 8 actions | 🟡 detail page only | **G-IAM018** |

### 5.2 Roles

| Capability | Ember | React | Gap ID |
|------------|-------|-------|--------|
| List + search + pagination | ✅ | 🟡 list, no server page | **G-IAM001** |
| Create role modal | ✅ `role-form` | ✅ QuickCreateDialog | — |
| Edit role metadata | ✅ modal | ❌ | **G-IAM021** |
| Delete role | ✅ | ❌ | **G-IAM022** |
| Permission matrix | ✅ `permission-picker` | ✅ custom grid | 🟡 |
| Policy attach to role | ✅ `policy-attacher` | ❌ | **G-IAM023** |
| View role permissions modal | ✅ | 🟡 inline matrix | **G-IAM024** |
| Service / scheme type filters | ✅ FLB vs org-managed | ❌ | **G-IAM025** |
| Export roles | ✅ | ❌ | **G-IAM026** |
| `auth/services` for policy services | ✅ `iam.getServices` | ❌ | **G-IAM027** |

### 5.3 Groups

| Capability | Ember | React | Gap ID |
|------------|-------|-------|--------|
| List + table + pagination | ✅ | 🟡 cards, no pagination | **G-IAM001** |
| Create group | ✅ `group-form` | ✅ QuickCreateDialog | — |
| Group detail + members | ✅ `group-details` | ❌ | **G-IAM020** |
| Edit / delete group | ✅ | ❌ | **G-IAM028** |
| Member add/remove | ✅ `group-members` cell | ❌ | **G-IAM029** |
| Default role on group | ✅ | 🟡 on create only | **G-IAM029** |

### 5.4 Policies

| Capability | Ember | React | Gap ID |
|------------|-------|-------|--------|
| Policies index route | ✅ `/iam/policies` | ❌ | **G-IAM030** |
| Create / edit policy | ✅ `policy-form` | ❌ | **G-IAM031** |
| View policy permissions | ✅ modal | ❌ | **G-IAM032** |
| FLB vs Organization managed types | ✅ | ❌ | **G-IAM033** |
| Attach policies to roles | ✅ | ❌ | **G-IAM023** |
| Export policies | ✅ | ❌ | **G-IAM034** |

### 5.5 Platform & console integration

| Capability | Ember | React | Gap ID |
|------------|-------|-------|--------|
| IAM header shortcuts (6 entries) | ✅ extension.js | ✅ `Header.jsx` + `headerShortcuts.js` | **G-IAM035** ✅ |
| IAM metrics dashboard widget | ✅ `widget/iam-metrics` | ✅ `IamMetricsWidget` (`iam-metrics-widget`) | **G-IAM036** ✅ |
| IAM home route | ✅ | ✅ `/iam` → `IamHome.jsx` | **G-IAM037** ✅ |
| Organizations management | 🟡 template exists | ⏸️ Deferred | **G-IAM040** ⏸️ |
| i18n keys | ✅ `iam.*` yaml | 🟡 MVP `en.json` `iam.*` keys | **G-IAM041** ✅ MVP |
| Fine-grained `iam *` ability checks per button | ✅ | ✅ `useIamAbility` on lists/detail/actions | **G-IAM042** ✅ |

---

## 6. Ember modals → React status

| Ember modal | React equivalent | Status |
|-------------|------------------|--------|
| `invite-user` | `QuickCreateDialog` on UsersList | ✅ |
| `user-form` | — | ❌ G-IAM004 |
| `change-user-password` | placeholder toast on UserDetail | ❌ G-IAM013 |
| `view-user-permissions` | — | ❌ G-IAM014 |
| `role-form` | create only via QuickCreateDialog | 🟡 G-IAM021 |
| `view-role-permissions` | inline matrix | 🟡 |
| `policy-form` | — | ❌ G-IAM031 |
| `view-policy-permissions` | — | ❌ G-IAM032 |
| `group-form` | create only | 🟡 |
| `group-details` | — | ❌ G-IAM020 |

---

## 7. Backend API matrix (core-api)

Routes in `packages/core-api/src/routes.php` — React should wire UI to each row.

### 7.1 Users

| Endpoint | Ember UI | React UI | Gap |
|----------|----------|----------|-----|
| `GET/POST /users` CRUD | ✅ | 🟡 list/get/patch | G-IAM001–018 |
| `POST /users/invite-user` | ✅ | ✅ | — |
| `POST /users/resend-invite` | ✅ | ❌ | G-IAM012 |
| `PATCH /users/deactivate/:id` | ✅ | 🟡 status patch | G-IAM007 |
| `PATCH /users/activate/:id` | ✅ | 🟡 | G-IAM008 |
| `PATCH /users/verify/:id` | ✅ | ❌ | G-IAM009 |
| `DELETE /users/remove-from-company/:id` | ✅ | ❌ | G-IAM015 |
| `DELETE /users/bulk-delete` | ✅ | ❌ | G-IAM006 |
| `GET/POST /users/export` | ✅ | ❌ | G-IAM005 |
| `POST /users/change-password` | ✅ | ❌ | G-IAM013 |
| `GET/POST /users/two-fa` | ✅ | 🟡 patch on user | G-IAM013 |

### 7.2 Roles, groups, policies, permissions

| Resource | Ember | React | Gap |
|----------|-------|-------|-----|
| `roles` CRUD + export | ✅ | 🟡 list/create/update perms | G-IAM021–026 |
| `groups` CRUD | ✅ | 🟡 list/create | G-IAM020–029 |
| `policies` CRUD + export | ✅ | ❌ | G-IAM030–034 |
| `permissions` list | ✅ | ✅ matrix only | — |

### 7.3 IAM schema roles (seeded)

From `packages/core-api/src/Auth/Schemas/IAM.php`:

| Role | Purpose |
|------|---------|
| IAM User Manager | Users, roles, groups |
| IAM Policy Manager | Policies + roles |
| IAM Administrator | Full IAM |

React `RequirePermission` uses simplified keys (`users.view`) — verify mapping to Spatie `iam view user` slugs in auth payload.

---

## 8. Link to FleetOps & “real users”

| Concept | IAM engine | FleetOps |
|---------|------------|----------|
| **Console login user** | Created via IAM Users / invite | Same `users` table |
| **Driver record** | `users/drivers` tab (user linked to driver) | `management/drivers` CRUD |
| **Fleet-Ops Customer role** | `users/customers` tab | `management/customers` + portal |
| **FleetOps permissions** | Assigned via **roles** in IAM | `useFleetopsAbility` reads ability map |

**Why notifications/settings need IAM:** A **Driver** must have a **User** with role **Driver** (or linked `user_uuid` on driver) to log in and receive push/email. Creating only a driver in FleetOps without IAM invite does not create a login.

---

## 9. Master gap register (G-IAM001–G-IAM042)

| ID | Gap | Area | Priority | Status |
|----|-----|------|----------|--------|
| G-IAM001 | Server pagination + meta on users/roles/groups/policies | Platform | P0 | Done (users; pattern in `useIamListPage`) |
| G-IAM002 | URL-synced filters on users list | Users | P1 | Done |
| G-IAM003 | Server sort on IAM tables | Users | P2 | Done (users) |
| G-IAM004 | Create user (full form), not invite-only | Users | P1 | Done |
| G-IAM005 | Export users | Users | P2 | Done |
| G-IAM006 | Bulk delete users | Users | P2 | Done |
| G-IAM007 | Deactivate via `PATCH users/deactivate/:id` | Users | P1 | Done |
| G-IAM008 | Activate via `PATCH users/activate/:id` | Users | P1 | Done |
| G-IAM009 | Verify user | Users | P2 | Done |
| G-IAM010 | Users → Drivers tab | Users | P1 | Done |
| G-IAM011 | Users → Customers tab | Users | P1 | Done |
| G-IAM012 | Resend invitation | Users | P1 | Done |
| G-IAM013 | Admin change-password flow | Users | P1 | Done |
| G-IAM014 | View user effective permissions | Users | P2 | Done |
| G-IAM015 | Remove user from company | Users | P2 | Done |
| G-IAM016 | Phone field + column | Users | P3 | Done |
| G-IAM017 | Assign/change role on user detail | Users | P1 | Done |
| G-IAM018 | Row action menu on users table | Users | P2 | Done |
| G-IAM020 | Group detail + members management | Groups | P1 | Done |
| G-IAM021 | Edit/delete role | Roles | P1 | Done |
| G-IAM022 | Delete role | Roles | P2 | Done |
| G-IAM023 | Policy attacher on roles | Roles/Policies | P1 | Done |
| G-IAM024 | View role permissions (parity modal) | Roles | P3 | Done |
| G-IAM025 | Role service/scheme filters | Roles | P2 | Done |
| G-IAM026 | Export roles | Roles | P3 | Done |
| G-IAM027 | `GET auth/services` for IAM | Roles | P2 | Done |
| G-IAM028 | Edit/delete group | Groups | P2 | Done |
| G-IAM029 | Group members CRUD | Groups | P1 | Done |
| G-IAM030 | Policies module route + list | Policies | P0 | Done |
| G-IAM031 | Policy create/edit | Policies | P1 | Done |
| G-IAM032 | View policy permissions | Policies | P2 | Done |
| G-IAM033 | FLB vs org-managed policy types | Policies | P2 | Done |
| G-IAM034 | Export policies | Policies | P3 | Done |
| G-IAM035 | Header IAM shortcuts (6 entries, permission-filtered) | Console | P2 | **Done** |
| G-IAM036 | IAM metrics dashboard widget (`GET /metrics/iam`) | Console | P3 | **Done** |
| G-IAM037 | IAM home/overview at `/iam` | Console | P3 | **Done** |
| G-IAM040 | Organizations UI | Platform | P3 | **Deferred** (out of scope unless product requests) |
| G-IAM041 | i18n for IAM strings | Platform | P3 | **Done** (MVP `frontend/src/i18n/en.json`; full yaml parity deferred) |
| G-IAM042 | Per-action `iam *` permission gates | Platform | P1 | **Done** |
| G-IAM043 | User form — policies + direct permissions on create/edit | Users | P1 | **Done** |
| G-IAM044 | User avatar + country on form | Users | P2 | **Done** |
| G-IAM045 | Groups export | Groups | P3 | **Done** |
| G-IAM046 | Bulk delete roles/groups/policies | Console | P3 | **Done** |
| G-IAM047 | Edit user modal from list | Users | P3 | **N/A** (detail + `UserFormDialog` mode=edit sufficient) |

**Open:** 8 · **Partial:** 3 · **Done:** 33 (Phases 1–4)

---

## 10. Implementation phases (recommended)

| Phase | Name | Parity Δ | Cumulative | Focus |
|-------|------|----------|------------|--------|
| — | Baseline | — | **~40%** | Today |
| **1** | Users production-grade | +15% | ~55% | Pagination, lifecycle APIs, drivers/customers tabs, role assign |
| **2** | Roles & permissions depth | +12% | ~67% | Policy attacher, edit/delete role, services filter |
| **3** | Groups & members | +8% | ~75% | Group detail, members, edit/delete |
| **4** | Policies module | +15% | ~90% | Full `/iam/policies` parity |
| **5** | Console polish & QA | +10% | **~100%** | Widget, i18n, ability gates, E2E per IAM role |

**Phase 1 exit:** Invite + create user + deactivate/activate/verify + resend invite + change password + server pagination; E2E for driver/customer user creation path.

**Phase 4 exit:** Policies CRUD matches Ember; roles can attach policies.

---

## 11. Verification checklist (IAM 100%)

- [x] All §3 routes ✅ or documented N/A (**G-IAM040** organizations deferred)
- [x] All §7 API rows have React service + UI (in-scope modules)
- [x] All §6 modals ✅ or N/A (inline React dialogs)
- [x] G-IAM001–039, G-IAM041–047 → **Done** or N/A; G-IAM040 → **Deferred**
- [x] E2E: `access.spec.ts` (home, header shortcuts, metrics widget, ability smoke) + lifecycle specs
- [ ] FleetOps: assign **Driver** role via IAM → driver can log in to web/Navigator (manual QA in shared env)

**Sign-off (Phase 5):** `npm run build` && `npm run verify:release` — run on release branch before tagging.

---

## 12. Document history

| Version | Change |
|---------|--------|
| 1.0 | Initial IAM gap analysis — Ember `iam-engine` vs React `/iam/*` |
| 1.1 | Phase 1 users production-grade — G-IAM001–018, G-IAM010–011 Done |
| 1.2 | Phase 2 roles & permissions — G-IAM021–027, G-IAM023 Done |
| 1.3 | Phase 3 groups & members — G-IAM020, G-IAM028, G-IAM029 Done |
| 1.4 | Phase 4 policies module — G-IAM030–034 Done |
| 1.5 | Phase 5 console polish — G-IAM035–037, G-IAM041–042 Done; G-IAM040 deferred; ~100% in-scope |
| 1.6 | Phase 6 user-form parity — G-IAM043–046 Done; invite remains role-only |

*IAM parity tracking lives here. FleetOps product parity remains in [FLEETOPS-GAPS.md](./FLEETOPS-GAPS.md).*
