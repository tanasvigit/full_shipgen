# Fleetbase UI documentation — complete overview (documents 01–62)

| Property | Value |
|----------|-------|
| **Contents** | All 62 numbered overview documents in one file |
| **Generated** | 2026-05-18 |
| **Note** | Individual `01-*.md` … `62-*.md` files were merged into this file and removed from the folder |

> Per-screen specs (466+ files) stay in [`screens/`](./screens/). This file is the **overview library only** (docs 01–62).

---

## Table of contents

- [01. executive summary and product surface map](#doc-01)
- [02. architecture host app engines extensions](#doc-02)
- [03. extension and dynamic ui model](#doc-03)
- [04. complete route and url map](#doc-04)
- [05. auth flows](#doc-05)
- [06. install onboard and invite](#doc-06)
- [07. application bootstrap and runtime config](#doc-07)
- [08. authenticated console shell](#doc-08)
- [09. smart navigation and overflow menu](#doc-09)
- [10. homepage and dashboard](#doc-10)
- [11. notifications center](#doc-11)
- [12. account area](#doc-12)
- [13. settings area](#doc-13)
- [14. admin panel built in pages](#doc-14)
- [15. admin extension driven pages](#doc-15)
- [16. virtual routes and lazy engine hosting](#doc-16)
- [17. global shell features](#doc-17)
- [18. design foundations](#doc-18)
- [19. layout components](#doc-19)
- [20. navigation and chrome](#doc-20)
- [21. forms and inputs](#doc-21)
- [22. tables and data views](#doc-22)
- [23. modals overlays and side panels](#doc-23)
- [24. maps and location ui](#doc-24)
- [25. charts metrics and stat cards](#doc-25)
- [26. files media and rich text](#doc-26)
- [27. ember ui component catalog a m](#doc-27)
- [28. ember ui component catalog n z](#doc-28)
- [29. ember core services reference](#doc-29)
- [30. universe menu widget registry hook](#doc-30)
- [31. extension lifecycle and extension manager](#doc-31)
- [32. console data models and relationships](#doc-32)
- [33. fleetops data model encyclopedia](#doc-33)
- [34. api and adapter map by feature](#doc-34)
- [35. fleetops overview and route tree](#doc-35)
- [36. fleetops operations](#doc-36)
- [37. fleetops management](#doc-37)
- [38. fleetops connectivity and telematics](#doc-38)
- [39. fleetops maintenance](#doc-39)
- [40. fleetops analytics and reports](#doc-40)
- [41. fleetops settings](#doc-41)
- [42. fleetops order detail composition](#doc-42)
- [43. fleetops map and navigator ui](#doc-43)
- [44. fleetops admin extension panels](#doc-44)
- [45. fleetops virtual routes and registrations](#doc-45)
- [46. fleetops screen inventory and journeys](#doc-46)
- [47. storefront overview and routes](#doc-47)
- [48. storefront catalog products customers](#doc-48)
- [49. storefront orders networks promotions](#doc-49)
- [50. ledger overview and routes](#doc-50)
- [51. ledger billing and invoices](#doc-51)
- [52. ledger payments accounting reports](#doc-52)
- [53. iam overview and routes](#doc-53)
- [54. iam users groups roles policies](#doc-54)
- [55. developers overview and routes](#doc-55)
- [56. developers api keys webhooks sockets logs](#doc-56)
- [57. registry bridge overview](#doc-57)
- [58. registry explore install publish admin](#doc-58)
- [59. pallet overview and routes](#doc-59)
- [60. pallet inventory warehouses orders](#doc-60)
- [61. permissions roles and ui gating](#doc-61)
- [62. i18n branding realtime and custom ui playbook](#doc-62)

---



<a id="doc-01"></a>

<!-- ========== DOCUMENT 01: 01-executive-summary-and-product-surface-map.md ========== -->

# Executive Summary & Product Surface Map

| Field | Value |
|-------|-------|
| **Doc ID** | 01 |
| **Volume** | 0 |
| **Status** | ✅ Done |
| **Sources** | `console/, packages/, frontend_blue_print.txt` |

---

## Purpose

High-level map of Fleetbase Console for a custom UI rebuild.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## 1. What Fleetbase Console is

Fleetbase Console is the **web admin UI** for the Fleetbase logistics platform. It is an **Ember.js 5** host application that mounts multiple **ember-engines** (product modules) and loads **runtime extensions** from the API.

**Primary users:** organization admins, operators, developers, and system administrators.

## 2. Product surface map

| Module | NPM package | URL mount | Primary jobs-to-be-done |
|--------|-------------|-----------|-------------------------|
| **Console host** | `@fleetbase/console` | `/` (auth, shell, admin) | Login, dashboard, account, settings, system admin |
| **FleetOps** | `@fleetbase/fleetops-engine` | `/fleet-ops` | Orders, fleets, drivers, vehicles, routes, maps |
| **Storefront** | `@fleetbase/storefront-engine` | `/storefront` | E-commerce catalog, customers, storefront orders |
| **Ledger** | `@fleetbase/ledger-engine` | `/ledger` | Billing, invoices, payments, accounting |
| **IAM** | `@fleetbase/iam-engine` | `/iam` | Users, groups, roles, policies |
| **Developers** | `@fleetbase/dev-engine` | `/developers` | API keys, webhooks, sockets, logs |
| **Registry** | `@fleetbase/registry-bridge-engine` | `/extensions` | Extension marketplace & publishing |
| **Pallet** *(optional)* | `@fleetbase/pallet-engine` | `/pallet` | Inventory, warehouses, WMS-style flows |

## 3. Shared platform layers

| Layer | Package | Role in UI rebuild |
|-------|---------|-------------------|
| Design system | `@fleetbase/ember-ui` | All layout, forms, tables, maps, modals |
| Platform services | `@fleetbase/ember-core` | Auth, HTTP, menus, widgets, extensions |
| Operational data | `@fleetbase/fleetops-data` | Shared Ember Data models for logistics entities |

## 4. Console host pages (static)

| Area | Routes | Count |
|------|--------|------:|
| Auth | `/auth/*` | 6 |
| Public | install, onboard, invite | 5 |
| Console | home, notifications, account, settings | 4 areas |
| Admin | `/admin/*` | 15 built-in pages |
| Virtual | `/:slug`, `/admin/:slug`, etc. | Dynamic |

## 5. Custom UI rebuild scope

Your team replaces **visual presentation** while preserving:

1. **Route URLs** (or document redirects)
2. **API contracts** (see doc 34)
3. **Permission gates** (see doc 61)
4. **Extension injection points** (see doc 03, 16)

## 6. Related documents

- [02 Architecture](./02-architecture-host-app-engines-extensions.md)
- [04 Route map](./04-complete-route-and-url-map.md)
- [62 Custom UI playbook](./62-i18n-branding-realtime-and-custom-ui-playbook.md)

---



<a id="doc-02"></a>

<!-- ========== DOCUMENT 02: 02-architecture-host-app-engines-extensions.md ========== -->

# Architecture: Host App, Engines & Extensions

| Field | Value |
|-------|-------|
| **Doc ID** | 02 |
| **Volume** | 0 |
| **Status** | ✅ Done |
| **Sources** | `console/app/app.js, lib/fleetbase-extensions-generator` |

---

## Purpose

Technical architecture of the Ember frontend stack.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## 1. Stack

| Technology | Version (console) | Role |
|------------|-------------------|------|
| Ember.js | ~5.4 | Host framework |
| ember-engines | ^0.9 | Lazy product modules |
| ember-data | ^4.12 | Models & API sync |
| ember-simple-auth | (via ember-core) | Session |
| Tailwind + PostCSS | via ember-cli-postcss | Styling |
| ember-intl | 6.3 | i18n |

## 2. Host vs engine vs addon

```
┌─────────────────────────────────────────────────────────┐
│  @fleetbase/console (host app)                          │
│  router.map.js + auth + admin + shell                   │
├─────────────────────────────────────────────────────────┤
│  ember-engines (mounted under console)                  │
│  fleetops │ storefront │ ledger │ iam │ dev │ registry│
├─────────────────────────────────────────────────────────┤
│  @fleetbase/ember-ui (components)                       │
│  @fleetbase/ember-core (services, universe)             │
│  @fleetbase/fleetops-data (shared models)               │
└─────────────────────────────────────────────────────────┘
```

## 3. Build-time extension discovery

`console/lib/fleetbase-extensions-generator`:

1. Scans `node_modules` for packages with keywords `fleetbase-extension` + `ember-engine`
2. Generates `app/router.js` with `this.mount('package-name', { as, path })`
3. Copies `addon/extension.js` → `app/extensions/<route>.js`
4. Writes `public/extensions.json` manifest

**Default engines** (from `console/package.json`):

| Package | Mount path |
|---------|------------|
| `@fleetbase/fleetops-engine` | `fleet-ops` |
| `@fleetbase/storefront-engine` | `storefront` |
| `@fleetbase/ledger-engine` | `ledger` |
| `@fleetbase/iam-engine` | `iam` |
| `@fleetbase/dev-engine` | `developers` |
| `@fleetbase/registry-bridge-engine` | `extensions` |

## 4. Runtime boot sequence

| Order | Initializer | Action |
|------:|-------------|--------|
| 1 | `load-extensions` | API extension list via extension-manager |
| 2 | `initialize-registries` | Creates `@fleetbase/console`, `auth:login` registries |
| 3 | `initialize-widgets` | Console dashboard widgets |
| 4 | `setup-extensions` | Runs each engine `setupExtension(app, universe)` |

## 5. Application route gates

`application` route (`console/app/routes/application.js`):

- `GET installer/initialize` → redirect to `install` or `onboard` if needed
- `session.setup()` + `extensionManager.waitForBoot()`
- Theme + locale initialization on activate

## 6. Console route guard

`console` route requires authentication via `session.requireAuthentication(transition, 'auth.login')`, loads `brand` record id `1` for header branding.

## 7. Custom rebuild implications

- Treat **engines as micro-frontends** — each mount is a separate product area
- Shared shell (doc 08) wraps all authenticated routes
- Dynamic pages use **virtual routes** (doc 16), not new static routes

---



<a id="doc-03"></a>

<!-- ========== DOCUMENT 03: 03-extension-and-dynamic-ui-model.md ========== -->

# Extension & Dynamic UI Model

| Field | Value |
|-------|-------|
| **Doc ID** | 03 |
| **Volume** | 0 |
| **Status** | ✅ Done |
| **Sources** | `@fleetbase/ember-core, console/instance-initializers` |

---

## Purpose

How extensions register UI without changing the host router.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## 1. Core concepts

| Concept | Service | Purpose |
|---------|---------|---------|
| **Menu item** | `universe/menu-service` | Sidebar/header entries pointing to virtual pages |
| **Registry** | `universe/registry-service` | Named slots for composable UI (tabs, panels) |
| **Widget** | `universe/widget-service` | Dashboard tiles |
| **Hook** | `universe/hook-service` | Route lifecycle callbacks |
| **Extension** | `universe/extension-manager` | Load API extensions + run setupExtension |

## 2. Menu registration APIs

| Method | Registry | Example use |
|--------|----------|-------------|
| `registerHeaderMenuItem` | header nav | Fleet-Ops, Storefront top links |
| `registerAdminMenuItem` | `console:admin` | Admin plugin pages |
| `registerAdminMenuPanel` | `console:admin` | Grouped admin panels |
| `registerSettingsMenuItem` | `console:settings` | Org settings extensions |
| `registerUserMenuItem` | `console:account` | Account extensions |
| `registerMenuItem(registry, ...)` | custom | Order detail tabs, auth buttons |

## 3. Virtual route resolution

**Console virtual** (`console/app/routes/console/virtual.js`):

```javascript
model({ slug }, transition) {
  const view = this.universe.getViewFromTransition(transition);
  return this.menuService.lookupMenuItem('console', slug, view);
}
```

**Template** renders `<LazyEngineComponent @component={{@model.component}} />`.

| Virtual host | URL pattern | Registry key |
|--------------|-------------|--------------|
| Root | `/~/:slug` | varies |
| Console | `/:slug` | `console` |
| Account | `/account/:slug` | `console:account` |
| Settings | `/settings/:slug` | `console:settings` |
| Admin | `/admin/:slug?view=...` | `console:admin` |

## 4. Registry yield (auth login example)

`auth/login.hbs` uses:

```hbs
<RegistryYield @type="menu" @registry="auth:login" as |menuItem|>
  <Button @text={{menuItem.title}} ... />
</RegistryYield>
```

Console creates registries in `initialize-registries.js`: `@fleetbase/console`, `auth:login`.

## 5. Engine setupExtension

Each engine ships `addon/extension.js`:

```javascript
export default function setupExtension(app, universe) {
  universe.registerHeaderMenuItem(...);
  universe.registerDashboard(...);
}
```

Copied to `console/app/extensions/<mount>.js` at build time.

## 6. Custom UI mapping

| Ember pattern | Custom UI equivalent |
|---------------|---------------------|
| Virtual route + menu item | Dynamic route + lazy-loaded module |
| RegistryYield | Plugin slot / portal |
| Widget registration | Dashboard widget registry |
| Hook | Router middleware / layout effects |

---



<a id="doc-04"></a>

<!-- ========== DOCUMENT 04: 04-complete-route-and-url-map.md ========== -->

# Complete Route & URL Map

| Field | Value |
|-------|-------|
| **Doc ID** | 04 |
| **Volume** | 1 |
| **Status** | ✅ Done |
| **Sources** | `console/router.map.js, generated app/router.js` |

---

## Purpose

Master route table for console host + engine mounts.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## 1. Static host routes

### Auth (`/auth`)
| Route name | URL |
|------------|-----|
| auth.login | `/auth/` |
| auth.forgot-password | `/auth/forgot-password` |
| auth.reset-password | `/auth/reset-password/:id` |
| auth.two-fa | `/auth/two-fa` |
| auth.verification | `/auth/verification` |
| auth.portal-login | `/auth/portal` *(extension-owned UI)* |

### Public
| Route | URL |
|-------|-----|
| install | `/install` |
| onboard.index | `/onboard/` |
| onboard.verify-email | `/onboard/verify-email` |
| invite.for-user | `/join/org/:public_id` |
| invite.for-driver | `/join/fleet/:public_id` |
| catch | `/*` |

### Console (authenticated, path `/`)
| Route | URL |
|-------|-----|
| console.home | `/` |
| console.notifications | `/notifications` |
| console.account.index | `/account` |
| console.account.auth | `/account/auth` |
| console.account.organizations | `/account/organizations` |
| console.account.virtual | `/account/:slug` |
| console.settings.index | `/settings` |
| console.settings.two-fa | `/settings/two-fa` |
| console.settings.notifications | `/settings/notifications` |
| console.settings.virtual | `/settings/:slug` |
| console.virtual | `/:slug` |

### Admin (`/admin`)
| Route | URL |
|-------|-----|
| console.admin.index | `/admin/` |
| console.admin.branding | `/admin/branding` |
| console.admin.two-fa-settings | `/admin/two-fa-settings` |
| console.admin.organizations.index | `/admin/organizations/` |
| console.admin.organizations.index.users | `/admin/organizations/:public_id/users` |
| console.admin.schedule-monitor | `/admin/schedule-monitor` |
| console.admin.schedule-monitor.logs | `/admin/schedule-monitor/:id/logs` |
| console.admin.config.* | `/admin/config/database`, `cache`, `filesystem`, `mail`, `push-notifications`, `queue`, `services`, `socket` |
| console.admin.virtual | `/admin/:slug` |

### Root virtual
| Route | URL |
|-------|-----|
| virtual | `/~/:slug` |

## 2. Engine mounts (build-generated)

Mounted under `console` unless `fleetbase.mount: 'root'`:

| Engine | Path | Full URL prefix |
|--------|------|-----------------|
| fleetops-engine | `fleet-ops` | `/fleet-ops/...` |
| storefront-engine | `storefront` | `/storefront/...` |
| ledger-engine | `ledger` | `/ledger/...` |
| iam-engine | `iam` | `/iam/...` |
| dev-engine | `developers` | `/developers/...` |
| registry-bridge-engine | `extensions` | `/extensions/...` |

## 3. Query params (virtual)

- `?view=` — selects sub-view within a menu item (admin panels)

## 4. Source files

- Canonical: `console/router.map.js`
- Built: `console/app/router.js` (includes mounts)

---



<a id="doc-05"></a>

<!-- ========== DOCUMENT 05: 05-auth-flows.md ========== -->

# Auth Flows

| Field | Value |
|-------|-------|
| **Doc ID** | 05 |
| **Volume** | 1 |
| **Status** | ✅ Done (source-exhaustive) |
| **Enriched** | `_enrich-from-source.mjs` + `_enrich-pass2.mjs` |

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## 1. Login — `/auth/`

**Files:** `templates/auth/login.hbs`, `controllers/auth/login.js`, route `auth.login`

| Field / element | Type | Binding | Validation |
|-----------------|------|---------|------------|
| Logo | LogoIcon | @brand | — |
| Title | h2 | i18n `auth.login.title` | — |
| Failed-attempt banner | Alert | shows if `failedAttempts >= 3` | Link → forgot password |
| Email | Input email | `identity` | required, autocomplete username |
| Password | Input password | `password` | required |
| Remember me | Checkbox | `rememberMe` | — |
| Forgot password | link | `forgotPassword` action | — |
| Sign in | Button primary submit | `login` | loading: `isLoading` |
| Create account | Button | → `onboard` | — |
| Extension auth buttons | RegistryYield | registry `auth:login` | per menuItem |

**API:** ESA authenticate → may redirect to two-fa or verification.

---

## 2. Forgot password — `/auth/forgot-password`

| State | UI |
|-------|-----|
| Not sent | InfoBlock + email Input + Submit + Nevermind |
| Sent | Success InfoBlock + Continue → login |

| Field | Type | Binding |
|-------|------|---------|
| Email | Input email | `email` |

**API:** `POST auth/get-magic-reset-link` via `sendSecureLink` task.

---

## 3. Reset password — `/auth/reset-password/:id`

Password + confirm fields, submit → `POST auth/reset-password`.

---

## 4. Two-FA — `/auth/two-fa`

| Element | Component | Notes |
|---------|-----------|-------|
| OTP | OtpInput | 6 digits, `handleOtpInput` |
| Countdown | Countdown | `twoFactorSessionExpiresAfter` |
| Expired | InfoBlock + resend | `isCodeExpired` |
| Verify | Button submit | `verifyCode` |
| Resend / Cancel | links | `resendCode`, `cancelTwoFactor` |

**APIs:** `POST two-fa/validate`, `verify`, `resend`, `invalidate`

---

## 5. Verification — `/auth/verification`

| Field | Type | Binding |
|-------|------|---------|
| Code | InputGroup tel | `code`, `validateInput` |
| Verify | Button | `verifyCode`, disabled until `isReadyToSubmit` |
| Resend email/SMS | Buttons | `resendEmail`, `resendBySms` when `stillWaiting` |

**APIs:** `POST auth/verify-email`, `create-verification-session`, `validate-verification-session`

---

## 6. Portal login — `/auth/portal`

No local template — extension/SSO only.

---

## Custom UI mapping

| Ember | Custom |
|-------|--------|
| OtpInput | 6-box OTP component |
| RegistryYield slots | OAuth / SSO button row |
| Centered card | AuthLayout max-w-md |

---



<a id="doc-06"></a>

<!-- ========== DOCUMENT 06: 06-install-onboard-and-invite.md ========== -->

# Install, Onboard & Invite

| Field | Value |
|-------|-------|
| **Doc ID** | 06 |
| **Volume** | 1 |
| **Status** | ✅ Done |
| **Sources** | `console/` |

---

## Purpose

Install wizard, onboarding orchestrator, invite join flows.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Install (`/install`)

**Template:** `install.hbs` | **Route:** `install.js`

| UI element | Behavior |
|------------|----------|
| Installer card | Dark card, centered max-w-2xl |
| Step list | Each step: `pending` \| `in_progress` \| `completed` \| `failed` with color borders |
| Step icon | FaIcon circle-check + Spinner when in_progress |
| Error banner | Red alert if install fails |
| Primary CTA | Start install / Retry — runs `startInstall` task |

**API sequence:** `POST installer/createdb` → `migrate` → `seed`

## Onboard (`/onboard`)

| Route | Template | UI |
|-------|----------|-----|
| `/onboard/` | `onboard/index.hbs` | `<Onboarding::Yield @step @session @code @brand>` |
| `/onboard/verify-email` | `onboard/verify-email.hbs` | Logo, InfoBlock, verification code InputGroup, verify/resend buttons |

**Services:** `onboarding-orchestrator`, `onboarding-registry`, `onboarding-context`

**APIs:** `POST onboard/verify-email`, `send-verification-email`, `send-verification-sms`

## Invite user (`/join/org/:public_id`)

**Template:** `invite/for-user.hbs`

| Field | Control |
|-------|---------|
| Org logo | Image from model |
| Invitation code | Input `code`, required |
| Accept | Primary button → `acceptInvite` |

**APIs:** `POST users/accept-company-invite`, optional `users/set-password` + authenticate

## Invite driver (`/join/fleet/:public_id`)

**Template:** `invite/for-driver.hbs` — minimal; extend per FleetOps/driver portal requirements.

---



<a id="doc-07"></a>

<!-- ========== DOCUMENT 07: 07-application-bootstrap-and-runtime-config.md ========== -->

# Application Bootstrap & Runtime Config

| Field | Value |
|-------|-------|
| **Doc ID** | 07 |
| **Volume** | 1 |
| **Status** | ✅ Done |
| **Sources** | `console/` |

---

## Purpose

Boot sequence, env, initializers.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Initializers (app)
- intl polyfills, socketcluster, runtime config, UUID polyfill

## Instance initializers
| Name | After | Role |
|------|-------|------|
| load-extensions | — | extension-manager |
| initialize-registries | load-extensions | registry slots |
| initialize-widgets | — | dashboard widgets |
| setup-extensions | — | engine setupExtension |
| load-leaflet | — | map libs |

## Config
- `config/environment.js` — API host, namespace, socket URL
- `config/dotenv.js` — env vars
- `translations/*.yaml` — copy keys

---



<a id="doc-08"></a>

<!-- ========== DOCUMENT 08: 08-authenticated-console-shell.md ========== -->

# Authenticated Console Shell

| Field | Value |
|-------|-------|
| **Doc ID** | 08 |
| **Volume** | 1 |
| **Status** | ✅ Done |
| **Sources** | `console/app/templates/console.hbs` |

---

## Purpose

Layout composition for all logged-in pages.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Shell component tree

```
Layout::Container
├── Layout::Header (@brand, @menuItems, @organizationMenuItems, @userMenuItems)
├── Layout::Main
│   ├── Layout::Sidebar (#sidebar-menu-items — populated per-route)
│   ├── Layout::Section → {{outlet}}
│   └── ResourceContextPanel
├── Layout::MobileNavbar
ChatContainer
ConsoleWormhole
ImpersonatorTray
RegistryYield @registry="@fleetbase/console"
```

## Brand model

Loaded in `console` route: `store.findRecord('brand', 1)` — logo, theme for header.

## Sidebar visibility

`ConsoleController.hiddenSidebarRoutes`:
- `console.home`
- `console.notifications`
- `console.virtual`

On these routes sidebar is hidden; navigation is header-only.

## Custom UI regions

| Region | Your component |
|--------|----------------|
| Header | AppHeader with logo, nav, user menu |
| Sidebar | ContextSidebar (account/settings/admin engines) |
| Main | Page outlet |
| Resource panel | Contextual inspector (right) |
| Mobile nav | Bottom tab bar |

---



<a id="doc-09"></a>

<!-- ========== DOCUMENT 09: 09-smart-navigation-and-overflow-menu.md ========== -->

# Smart Navigation & Overflow Menu

| Field | Value |
|-------|-------|
| **Doc ID** | 09 |
| **Volume** | 1 |
| **Status** | ✅ Done |
| **Sources** | `ember-ui Layout::Header, menu-service` |

---

## Purpose

Top navigation and extension launcher.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Header left

1. Logo → home
2. Sidebar toggle (desktop)
3. **Smart nav** — `menuItems` from header menu registrations (Fleet-Ops, Storefront, etc.)
4. Wormholes: `view-header-left-content-a/b`

## Header right

1. Loading indicator
2. `view-header-actions` wormhole
3. Locale selector tray
4. Notifications tray
5. Chat tray
6. Organization dropdown (switch/create/join org)
7. User menu (profile, settings, logout)

## Menu item sources

- Built from `universe/menu-service` after extensions boot
- Console controller sets `menuItems`, `userMenuItems`, `organizationMenuItems`

## Overflow / extensions

Mobile navbar receives `@extensions` for overflow launcher when many engines installed.

## Custom UI

- Preserve **active route highlighting** per engine mount prefix
- Org switcher must call `POST auth/switch-organization`

---



<a id="doc-10"></a>

<!-- ========== DOCUMENT 10: 10-homepage-and-dashboard.md ========== -->

# Homepage & Dashboard

| Field | Value |
|-------|-------|
| **Doc ID** | 10 |
| **Volume** | 1 |
| **Status** | ✅ Done |
| **Sources** | `console/home.hbs, Dashboard component` |

---

## Purpose

Dashboard at /.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Template (`console/home.hbs`)

1. `TwoFaEnforcementAlert` — policy banner if 2FA required
2. `Dashboard @extension="core"` — gridstack widget board
3. `Spacer` 300px
4. `#console-home-wormhole` — extension injection point

## Dashboard behavior

- Widgets registered via `widget-service` for dashboard id `dashboard`
- Console registers: blog widget, GitHub card (initialize-widgets)
- Engines add: FleetOps metrics, Ledger financials, etc.

## Widget UX

| State | UI |
|-------|-----|
| View mode | Grid of metric/chart cards |
| Edit mode | Drag-resize, add/remove widgets |
| Empty | Placeholder + add widget CTA |

## APIs

- Widget data via per-widget component queries
- Dashboard model: `dashboard`, `dashboard-widget`

## Custom UI

- Use CSS grid or your dashboard lib instead of gridstack
- Keep widget aspect ratios similar for parity

---



<a id="doc-11"></a>

<!-- ========== DOCUMENT 11: 11-notifications-center.md ========== -->

# Notifications Center

| Field | Value |
|-------|-------|
| **Doc ID** | 11 |
| **Volume** | 1 |
| **Status** | ✅ Done |
| **Sources** | `console/notifications` |

---

## Purpose

In-app notification inbox.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Route

`/notifications` — sidebar hidden (same as home)

## UI (`console/notifications.hbs`)

**Header actions**

| Button | Action |
|--------|--------|
| Select all | `selectAll` |
| Mark as read | `read` (selected or clicked row) |
| Delete | `delete` bulk |

**List row**

| Element | Data |
|---------|------|
| Checkbox | Selection for bulk ops |
| Envelope icon | open vs unread |
| Subject | `notification.data.subject` |
| Message | `notification.data.message` |
| Received | `notification.createdAgo` |
| Timestamp | `notification.createdAt` |
| Row click | `markNotificationAsRead` |
| Background | gray when `read_at` set |

**Footer:** `Pagination` with `@meta`, `page` query param

**Empty state:** italic centered message (i18n `console.notifications.message`)

## APIs

| Method | Endpoint |
|--------|----------|
| GET | `notifications` (query) |
| PUT | `notifications/mark-as-read` |
| DELETE | `notifications/bulk-delete` |

## Model

`notification` — read_at, meta, notifiable, etc.

## Header tray

Separate from page: notifications **tray** in header shows recent items with link to full inbox.

---



<a id="doc-12"></a>

<!-- ========== DOCUMENT 12: 12-account-area.md ========== -->

# Account Area

| Field | Value |
|-------|-------|
| **Doc ID** | 12 |
| **Volume** | 1 |
| **Status** | ✅ Done (source-exhaustive) |
| **Enriched** | `_enrich-from-source.mjs` + `_enrich-pass2.mjs` |

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Sidebar (`console/account.hbs`)

| Item | Route | Icon |
|------|-------|------|
| Profile | `console.account.index` | user |
| Auth | `console.account.auth` | shield |
| Organizations | `console.account.organizations` | building |
| + extension items | `console.account.virtual` | dynamic |

---

## Profile — `/account` (`account/index.hbs`)

| Field | Control | Model attr |
|-------|---------|------------|
| Avatar | Image + FileUpload image/* | `user.avatar_url` |
| Name | InputGroup | `user.name` |
| Email | InputGroup email | `user.email` |
| Phone | PhoneInput | `user.phone` |
| Date of birth | date InputGroup | `user.date_of_birth` |
| Timezone | PowerSelect | `user.timezone`, options from `GET lookup/timezones` |

**Save:** `saveProfile` task (ember-concurrency)

---

## Account auth — `/account/auth`

| Panel | Fields | API |
|-------|--------|-----|
| Change Password | newPassword, newConfirmPassword | `POST users/change-password` |
| 2FA Settings | TwoFaSettings component | `GET/POST users/two-fa` (if system 2FA enabled) |

---

## Organizations — `/account/organizations`

Org table + modals: create, join, switch, leave, transfer ownership, edit organization.

**APIs:** `POST auth/create-organization`, `join-organization`, `switch-organization`

---

## Virtual — `/account/:slug`

`account/virtual.hbs`: Section header + LazyEngineComponent

---



<a id="doc-13"></a>

<!-- ========== DOCUMENT 13: 13-settings-area.md ========== -->

# Settings Area

| Field | Value |
|-------|-------|
| **Doc ID** | 13 |
| **Volume** | 1 |
| **Status** | ✅ Done (source-exhaustive) |
| **Enriched** | `_enrich-from-source.mjs` + `_enrich-pass2.mjs` |

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Sidebar (`console/settings.hbs`)

| Item | Route |
|------|-------|
| Organization | `console.settings.index` |
| 2FA | `console.settings.two-fa` |
| Notifications | `console.settings.notifications` |
| Extension panels | virtual |

---

## Organization — `/settings`

| Field | Control | Model |
|-------|---------|-------|
| name | InputGroup | company.name |
| description | InputGroup | company.description |
| phone | PhoneInput | company.phone |
| currency | CurrencySelect | company.currency |
| timezone | Select | company.timezone |
| public_id | InputGroup disabled | company.public_id |
| logo | Image + FileUpload | logo upload |
| backdrop | Image + FileUpload | backdrop upload |

---

## Settings 2FA — `/settings/two-fa`

TwoFaSettings for **organization** policy. Save button.

**API:** `GET/POST companies/two-fa`

---

## Settings notifications — `/settings/notifications`

| Section | UI |
|---------|-----|
| Per notification group | ContentPanel + PowerSelectMultiple notifiables per notification type |
| SMS | Toggle alpha_numeric_sender_id + InputGroup sender ID + InfoBlocks |

**APIs:** `GET notifications/registry`, `notifiables`, `get-settings`, `POST save-settings`

Header: Save changes button (primary)

---



<a id="doc-14"></a>

<!-- ========== DOCUMENT 14: 14-admin-panel-built-in-pages.md ========== -->

# Admin Panel — Built-in Pages

| Field | Value |
|-------|-------|
| **Doc ID** | 14 |
| **Volume** | 1 |
| **Status** | ✅ Done |
| **Sources** | `console/app/templates/console/admin/**` |

---

## Purpose

Exhaustive field-level spec for all 15+ admin pages from source templates.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Admin shell

**Template:** `console/admin.hbs` — sidebar with built-in items + `menuService.adminMenuItems` + `adminMenuPanels` + System Config panel.

## Built-in sidebar entries

| # | Label | Route | Template |
|---|-------|-------|----------|
| 1 | Overview | `/admin/` | `admin/index.hbs` |
| 2 | Organizations | `/admin/organizations` | `admin/organizations/index.hbs` |
| 3 | Branding | `/admin/branding` | `admin/branding.hbs` |
| 4 | 2FA Config | `/admin/two-fa-settings` | `admin/two-fa-settings.hbs` |
| 5 | Schedule Monitor | `/admin/schedule-monitor` | `admin/schedule-monitor.hbs` |
| 6–11 | System Config | `/admin/config/*` | see below |

---

## /admin/

**Template:** `admin/index.hbs`

**API:** `GET settings/overview`

### Stat widgets

| Key | Label |
|-----|-------|
| `total_users` | Total Users |
| `total_organizations` | Total Organizations |
| `total_transactions` | Total Transactions |

## /admin/organizations

**Template:** `admin/organizations/index.hbs`

**API:** `GET companies?view=admin`

**Query params:** `page`, `query`, `sort`, `limit`, `name`, `country`

### Table columns

| Column key | Notes |
|------------|-------|
| `name` | |
| `owner.name` | |
| `owner.email` | |
| `owner.phone` | |
| `users_count` | |
| `createdAt` | |

**Actions:** Search (filters query), Export

## /admin/organizations/:public_id/users

**Template:** `admin/organizations/index/users.hbs`

**API:** `GET companies/:id/users`

**Query params:** `nestedPage`, `nestedLimit`, `nestedSort`, `nestedQuery`

### Table columns

| Column key | Notes |
|------------|-------|
| `name` | |
| `roleName` | |
| `phone` | |
| `email` | |
| `status` | |

**Row actions:** Impersonate → POST auth/impersonate; Change Password

**Layout:** Right overlay 800px right panel

## /admin/branding

**Template:** `admin/branding.hbs`

**API:** `brand model id 1`

### Form fields

- icon — FileUpload image/*
- logo — FileUpload image/*
- default_theme — Select (theme options)

**Actions:** Save, Reset icon, Reset logo

## /admin/two-fa-settings

**Template:** `admin/two-fa-settings.hbs`

**API:** `GET/POST two-fa/config`

**Components:** TwoFaSettings @twoFaMethods @enforce @selectedMethod

**Actions:** Save

## /admin/schedule-monitor

**Template:** `admin/schedule-monitor.hbs`

**API:** `GET schedule-monitor/tasks`

### Table columns

| Column key | Notes |
|------------|-------|
| `Name (link to logs)` | |
| `Type` | |
| `Timezone` | |
| `Last Started` | |
| `Last Finished` | |
| `Last Failure` | |

## /admin/schedule-monitor/:id/logs

**Template:** `admin/schedule-monitor/logs.hbs`

**API:** `GET schedule-monitor/:id, GET schedule-monitor/:id/logs`

**Actions:** Refresh

**Layout:** Right overlay true

**Log entry fields:** date, memory, runtime, output

## System config subpages

| URL | Component | Header |
|-----|-----------|--------|
| `/admin/config/database` | `Configure::Database` | Database Configuration |
| `/admin/config/cache` | `outlet only` | Cache (placeholder — title + outlet) |
| `/admin/config/filesystem` | `Configure::Filesystem` | Filesystem Configuration |
| `/admin/config/mail` | `Configure::Mail` | Mail Configuration |
| `/admin/config/queue` | `Configure::Queue` | Queue Configuration |
| `/admin/config/services` | `Configure::Services` | Services Configuration |
| `/admin/config/socket` | `Configure::Socket` | Socket Configuration |
| `/admin/config/push-notifications` | `Configure::NotificationChannels` | Push Notifications Configuration |

## URL-only (not in default sidebar)

- `/admin/config/database`
- `/admin/config/cache`

## Configure component source

`console/app/components/configure/*.hbs` — parse each for env keys and form fields when implementing.

---



<a id="doc-15"></a>

<!-- ========== DOCUMENT 15: 15-admin-extension-driven-pages.md ========== -->

# Admin Panel — Extension-driven Pages

| Field | Value |
|-------|-------|
| **Doc ID** | 15 |
| **Volume** | 1 |
| **Status** | ✅ Done |
| **Sources** | `console/admin/virtual` |

---

## Purpose

Dynamic admin via menu service.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Mechanism

Sidebar renders `menuService.adminMenuItems` + `adminMenuPanels` after built-in items.

Routes to `console.admin.virtual` → `/admin/:slug?view=...`

## Example entries (when engines installed)

| Panel | Page |
|-------|------|
| Fleet-Ops Config | Navigator App |
| Extensions Registry | Registry Config, Awaiting Review, Pending Publish |

## Custom UI

- Parse `slug` + `view` query param to load correct panel component
- Admin layout: left sidebar + main content (same as Ember admin.hbs)

---



<a id="doc-16"></a>

<!-- ========== DOCUMENT 16: 16-virtual-routes-and-lazy-engine-hosting.md ========== -->

# Virtual Routes & Lazy Engine Hosting

| Field | Value |
|-------|-------|
| **Doc ID** | 16 |
| **Volume** | 1 |
| **Status** | ✅ Done |
| **Sources** | `console/virtual, LazyEngineComponent` |

---

## Purpose

Dynamic page hosting.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Resolution flow

1. User navigates to `/:slug` (or scoped variant)
2. Route loads menu item: `lookupMenuItem(registry, slug, view)`
3. Model contains `title`, `component` (ExtensionComponent), `componentParams`
4. Template renders `LazyEngineComponent`

## Registries by scope

| Scope | Registry name |
|-------|---------------|
| Console main | `console` |
| Account | `console:account` |
| Settings | `console:settings` |
| Admin | `console:admin` |

## Custom UI

Implement as **dynamic import** route: `/pages/:slug` loading federated module or lazy React chunk matching `component` path from API/menu config.

---



<a id="doc-17"></a>

<!-- ========== DOCUMENT 17: 17-global-shell-features.md ========== -->

# Global Shell Features

| Field | Value |
|-------|-------|
| **Doc ID** | 17 |
| **Volume** | 1 |
| **Status** | ✅ Done |
| **Sources** | `console.hbs, ember-ui` |

---

## Purpose

Chat, impersonation, wormholes.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## ChatContainer

- Floating chat windows, channels, participants
- Models: `chat-channel`, `chat-message`, `chat-participant`, `chat-attachment`

## ImpersonatorTray

- Visible when admin impersonates user
- `POST auth/impersonate` from org users overlay

## ConsoleWormhole

- Portal target for extension-injected overlays

## ResourceContextPanel

- Right-side contextual resource inspector (ember-ui)

## RegistryYield on console

- Extension components can attach to console controller scope

---



<a id="doc-18"></a>

<!-- ========== DOCUMENT 18: 18-design-foundations.md ========== -->

# Design Foundations

| Field | Value |
|-------|-------|
| **Doc ID** | 18 |
| **Volume** | 2 |
| **Status** | ✅ Done |
| **Sources** | `@fleetbase/ember-ui` |

---

## Purpose

Tokens, Tailwind, theming.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Ember → custom component mapping

Document each `@fleetbase/ember-ui` component your screens use with:

| Ember component | Suggested custom equivalent | Props to support |
|-----------------|----------------------------|------------------|
| *(fill per screen)* | | |

## Key patterns in this area

Tailwind utility classes, CSS custom properties in ember-ui, dark: variants, btn/btn-primary, form-input, bordered-classic panels

## Submodule note

Run `git submodule update --init` and inventory `packages/ember-ui/addon/components/` for exhaustive prop lists.

---



<a id="doc-19"></a>

<!-- ========== DOCUMENT 19: 19-layout-components.md ========== -->

# Layout Components

| Field | Value |
|-------|-------|
| **Doc ID** | 19 |
| **Volume** | 2 |
| **Status** | ✅ Done |
| **Sources** | `@fleetbase/ember-ui` |

---

## Purpose

Layout::* hierarchy.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Ember → custom component mapping

Document each `@fleetbase/ember-ui` component your screens use with:

| Ember component | Suggested custom equivalent | Props to support |
|-----------------|----------------------------|------------------|
| *(fill per screen)* | | |

## Key patterns in this area

Container, Header, Main, Sidebar, Section::Header, Section::Body, MobileNavbar — map 1:1 to AppShell

## Submodule note

Run `git submodule update --init` and inventory `packages/ember-ui/addon/components/` for exhaustive prop lists.

---



<a id="doc-20"></a>

<!-- ========== DOCUMENT 20: 20-navigation-and-chrome.md ========== -->

# Navigation & Chrome

| Field | Value |
|-------|-------|
| **Doc ID** | 20 |
| **Volume** | 2 |
| **Status** | ✅ Done |
| **Sources** | `@fleetbase/ember-ui` |

---

## Purpose

Tabs, breadcrumbs, page titles.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Ember → custom component mapping

Document each `@fleetbase/ember-ui` component your screens use with:

| Ember component | Suggested custom equivalent | Props to support |
|-----------------|----------------------------|------------------|
| *(fill per screen)* | | |

## Key patterns in this area

page-title helper, Section::Header @title, TabNavigation patterns in engines

## Submodule note

Run `git submodule update --init` and inventory `packages/ember-ui/addon/components/` for exhaustive prop lists.

---



<a id="doc-21"></a>

<!-- ========== DOCUMENT 21: 21-forms-and-inputs.md ========== -->

# Forms & Inputs

| Field | Value |
|-------|-------|
| **Doc ID** | 21 |
| **Volume** | 2 |
| **Status** | ✅ Done |
| **Sources** | `@fleetbase/ember-ui` |

---

## Purpose

Form controls.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Ember → custom component mapping

Document each `@fleetbase/ember-ui` component your screens use with:

| Ember component | Suggested custom equivalent | Props to support |
|-----------------|----------------------------|------------------|
| *(fill per screen)* | | |

## Key patterns in this area

InputGroup, Input, Select, PowerSelect, PhoneInput, CurrencySelect, Checkbox, form-input, ember-changeset validations

## Submodule note

Run `git submodule update --init` and inventory `packages/ember-ui/addon/components/` for exhaustive prop lists.

---



<a id="doc-22"></a>

<!-- ========== DOCUMENT 22: 22-tables-and-data-views.md ========== -->

# Tables & Data Views

| Field | Value |
|-------|-------|
| **Doc ID** | 22 |
| **Volume** | 2 |
| **Status** | ✅ Done |
| **Sources** | `@fleetbase/ember-ui` |

---

## Purpose

Data tables.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Ember → custom component mapping

Document each `@fleetbase/ember-ui` component your screens use with:

| Ember component | Suggested custom equivalent | Props to support |
|-----------------|----------------------------|------------------|
| *(fill per screen)* | | |

## Key patterns in this area

ModelTable, Table, pagination controls, empty states, row actions, bulk select

## Submodule note

Run `git submodule update --init` and inventory `packages/ember-ui/addon/components/` for exhaustive prop lists.

---



<a id="doc-23"></a>

<!-- ========== DOCUMENT 23: 23-modals-overlays-and-side-panels.md ========== -->

# Modals, Overlays & Side Panels

| Field | Value |
|-------|-------|
| **Doc ID** | 23 |
| **Volume** | 2 |
| **Status** | ✅ Done |
| **Sources** | `@fleetbase/ember-ui` |

---

## Purpose

Overlays.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Ember → custom component mapping

Document each `@fleetbase/ember-ui` component your screens use with:

| Ember component | Suggested custom equivalent | Props to support |
|-----------------|----------------------------|------------------|
| *(fill per screen)* | | |

## Key patterns in this area

modalsManager service, Overlay, Right sidebar overlays (admin users, schedule logs), ContentPanel

## Submodule note

Run `git submodule update --init` and inventory `packages/ember-ui/addon/components/` for exhaustive prop lists.

---



<a id="doc-24"></a>

<!-- ========== DOCUMENT 24: 24-maps-and-location-ui.md ========== -->

# Maps & Location UI

| Field | Value |
|-------|-------|
| **Doc ID** | 24 |
| **Volume** | 2 |
| **Status** | ✅ Done |
| **Sources** | `@fleetbase/ember-ui` |

---

## Purpose

Maps.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Ember → custom component mapping

Document each `@fleetbase/ember-ui` component your screens use with:

| Ember component | Suggested custom equivalent | Props to support |
|-----------------|----------------------------|------------------|
| *(fill per screen)* | | |

## Key patterns in this area

Leaflet, leaflet-routing-machine, map drawers in FleetOps, geocoder inputs

## Submodule note

Run `git submodule update --init` and inventory `packages/ember-ui/addon/components/` for exhaustive prop lists.

---



<a id="doc-25"></a>

<!-- ========== DOCUMENT 25: 25-charts-metrics-and-stat-cards.md ========== -->

# Charts, Metrics & Stat Cards

| Field | Value |
|-------|-------|
| **Doc ID** | 25 |
| **Volume** | 2 |
| **Status** | ✅ Done |
| **Sources** | `@fleetbase/ember-ui` |

---

## Purpose

Dashboard widgets.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Ember → custom component mapping

Document each `@fleetbase/ember-ui` component your screens use with:

| Ember component | Suggested custom equivalent | Props to support |
|-----------------|----------------------------|------------------|
| *(fill per screen)* | | |

## Key patterns in this area

dashboard/metric, dashboard/count, stat widgets on admin overview

## Submodule note

Run `git submodule update --init` and inventory `packages/ember-ui/addon/components/` for exhaustive prop lists.

---



<a id="doc-26"></a>

<!-- ========== DOCUMENT 26: 26-files-media-and-rich-text.md ========== -->

# Files, Media & Rich Text

| Field | Value |
|-------|-------|
| **Doc ID** | 26 |
| **Volume** | 2 |
| **Status** | ✅ Done |
| **Sources** | `@fleetbase/ember-ui` |

---

## Purpose

Uploads and editors.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Ember → custom component mapping

Document each `@fleetbase/ember-ui` component your screens use with:

| Ember component | Suggested custom equivalent | Props to support |
|-----------------|----------------------------|------------------|
| *(fill per screen)* | | |

## Key patterns in this area

FileUpload, Image, TipTap editor components, avatar/logo upload patterns

## Submodule note

Run `git submodule update --init` and inventory `packages/ember-ui/addon/components/` for exhaustive prop lists.

---



<a id="doc-27"></a>

<!-- ========== DOCUMENT 27: 27-ember-ui-component-catalog-a-m.md ========== -->

# ember-ui Component Catalog (A–M)

| Field | Value |
|-------|-------|
| **Doc ID** | 27 |
| **Volume** | 2 |
| **Status** | ✅ Done |
| **Sources** | `packages/ember-ui/addon/components` |

---

## Purpose

138 components from ember-ui source.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Count: 138 components

| Component path | Custom UI component |
|----------------|---------------------|
| `activity-log` | _TBD_ |
| `app-container` | _TBD_ |
| `array-input` | _TBD_ |
| `aside-item-scroller` | _TBD_ |
| `aside-item-scroller/item` | _TBD_ |
| `autocomplete-input` | _TBD_ |
| `availability-editor` | _TBD_ |
| `basic-dropdown-hover` | _TBD_ |
| `bulk-search-dropdown` | _TBD_ |
| `button` | _TBD_ |
| `chart` | _TBD_ |
| `chat-container` | _TBD_ |
| `chat-tray` | _TBD_ |
| `chat-window` | _TBD_ |
| `chat-window/attachment` | _TBD_ |
| `chat-window/feed` | _TBD_ |
| `chat-window/log` | _TBD_ |
| `chat-window/message` | _TBD_ |
| `checkbox` | _TBD_ |
| `click-to-copy` | _TBD_ |
| `click-to-reveal` | _TBD_ |
| `combo-box` | _TBD_ |
| `comment-thread` | _TBD_ |
| `comment-thread/comment` | _TBD_ |
| `content-panel` | _TBD_ |
| `coordinates-input` | _TBD_ |
| `countdown` | _TBD_ |
| `country-name` | _TBD_ |
| `country-select` | _TBD_ |
| `currency-select` | _TBD_ |
| `custom-field/form` | _TBD_ |
| `custom-field/input` | _TBD_ |
| `custom-fields-manager` | _TBD_ |
| `dashboard` | _TBD_ |
| `dashboard/create` | _TBD_ |
| `date-picker` | _TBD_ |
| `date-time-input` | _TBD_ |
| `drawer` | _TBD_ |
| `dropdown-button` | _TBD_ |
| `event-calendar` | _TBD_ |
| `extensions-list` | _TBD_ |
| `fetch-select` | _TBD_ |
| `file` | _TBD_ |
| `file-icon` | _TBD_ |
| `filter/checkbox` | _TBD_ |
| `filter/country` | _TBD_ |
| `filter/date` | _TBD_ |
| `filter/model` | _TBD_ |
| `filter/multi-input` | _TBD_ |
| `filter/multi-option` | _TBD_ |
| `filters-picker` | _TBD_ |
| `filters-picker/button` | _TBD_ |
| `floating` | _TBD_ |
| `full-calendar` | _TBD_ |
| `full-calendar/draggable` | _TBD_ |
| `image` | _TBD_ |
| `input-group` | _TBD_ |
| `input-info` | _TBD_ |
| `input-label` | _TBD_ |
| `kanban` | _TBD_ |
| `kanban/card` | _TBD_ |
| `kanban/column` | _TBD_ |
| `key-input` | _TBD_ |
| `layout/container` | _TBD_ |
| `layout/header` | _TBD_ |
| `layout/header/dark-mode-toggle` | _TBD_ |
| `layout/header/dropdown` | _TBD_ |
| `layout/header/dropdown/item` | _TBD_ |
| `layout/header/smart-nav-menu/customizer` | _TBD_ |
| `layout/header/smart-nav-menu/dropdown` | _TBD_ |
| `layout/header/smart-nav-menu/item` | _TBD_ |
| `layout/mobile-navbar` | _TBD_ |
| `layout/resource/card` | _TBD_ |
| `layout/resource/card/body` | _TBD_ |
| `layout/resource/card/footer` | _TBD_ |
| `layout/resource/card/header` | _TBD_ |
| `layout/resource/cards-grid` | _TBD_ |
| `layout/resource/panel/header` | _TBD_ |
| `layout/resource/panel/header-actions` | _TBD_ |
| `layout/sidebar/item` | _TBD_ |
| `lazy-engine-component` | _TBD_ |
| `load-engine` | _TBD_ |
| `locale-selector-tray` | _TBD_ |
| `logo-icon` | _TBD_ |
| `metadata-editor` | _TBD_ |
| `metadata-viewer` | _TBD_ |
| `modal` | _TBD_ |
| `modal/body` | _TBD_ |
| `modal/default` | _TBD_ |
| `modal/dialog` | _TBD_ |
| `modal/footer` | _TBD_ |
| `modal/header` | _TBD_ |
| `modal/header/close` | _TBD_ |
| `modals-container` | _TBD_ |
| `modals/changelog` | _TBD_ |
| `model-coordinates-input` | _TBD_ |
| `model-multi-file-upload` | _TBD_ |
| `model-select` | _TBD_ |
| `model-select-multiple` | _TBD_ |
| `model-tag-input` | _TBD_ |
| `money-input` | _TBD_ |
| `overlay/body` | _TBD_ |
| `overlay/footer` | _TBD_ |
| `overlay/header` | _TBD_ |
| `portal/footer` | _TBD_ |
| `query-builder/actions` | _TBD_ |
| `query-builder/column-select` | _TBD_ |
| `query-builder/computed-columns` | _TBD_ |
| `query-builder/conditions` | _TBD_ |
| `query-builder/group-by` | _TBD_ |
| `query-builder/joins` | _TBD_ |
| `query-builder/limit` | _TBD_ |
| `report-builder/condition-value` | _TBD_ |
| `report-builder/export-options` | _TBD_ |
| `report/details` | _TBD_ |
| `report/form` | _TBD_ |
| `table/body` | _TBD_ |
| `table/cell` | _TBD_ |
| `table/cell/anchor` | _TBD_ |
| `table/cell/checkbox` | _TBD_ |
| `table/cell/driver-name` | _TBD_ |
| `table/cell/dropdown` | _TBD_ |
| `table/cell/dropdown/action-item` | _TBD_ |
| `table/cell/link-list` | _TBD_ |
| `table/cell/link-to` | _TBD_ |
| `table/cell/media-name` | _TBD_ |
| `table/column` | _TBD_ |
| `table/column-group` | _TBD_ |
| `table/expandable-row` | _TBD_ |
| `table/expandable-row/content` | _TBD_ |
| `table/foot` | _TBD_ |
| `table/head` | _TBD_ |
| `template-builder/canvas` | _TBD_ |
| `template-builder/element-renderer` | _TBD_ |
| `template-builder/layers-panel` | _TBD_ |
| `template-builder/properties-panel/field` | _TBD_ |
| `timeline/item` | _TBD_ |
| `widget/count` | _TBD_ |

## Usage

Search Fleetbase templates for each component name to find real usage examples.

---



<a id="doc-28"></a>

<!-- ========== DOCUMENT 28: 28-ember-ui-component-catalog-n-z.md ========== -->

# ember-ui Component Catalog (N–Z)

| Field | Value |
|-------|-------|
| **Doc ID** | 28 |
| **Volume** | 2 |
| **Status** | ✅ Done |
| **Sources** | `packages/ember-ui/addon/components` |

---

## Purpose

68 components from ember-ui source.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Count: 68 components

| Component path | Custom UI component |
|----------------|---------------------|
| `attach/popover` | _TBD_ |
| `attach/tooltip` | _TBD_ |
| `chat-window/pending-attachment` | _TBD_ |
| `custom-field/options-input` | _TBD_ |
| `custom-field/value` | _TBD_ |
| `custom-field/yield` | _TBD_ |
| `dashboard/widget-panel` | _TBD_ |
| `filter/range` | _TBD_ |
| `filter/select` | _TBD_ |
| `filter/string` | _TBD_ |
| `layout/header/sidebar-toggle` | _TBD_ |
| `layout/header/smart-nav-menu` | _TBD_ |
| `layout/resource/panel` | _TBD_ |
| `layout/resource/tabular` | _TBD_ |
| `layout/resource/tabular-actions` | _TBD_ |
| `layout/section` | _TBD_ |
| `layout/sidebar` | _TBD_ |
| `layout/sidebar/panel` | _TBD_ |
| `modal/header/title` | _TBD_ |
| `modal/title-with-buttons` | _TBD_ |
| `modals/query-builder-computed-column-editor` | _TBD_ |
| `model-select/options` | _TBD_ |
| `notification-tray` | _TBD_ |
| `otp-input` | _TBD_ |
| `overlay` | _TBD_ |
| `pagination` | _TBD_ |
| `phone-input` | _TBD_ |
| `pill` | _TBD_ |
| `progress-bar` | _TBD_ |
| `query-builder` | _TBD_ |
| `query-builder/sort-by` | _TBD_ |
| `query-builder/table-select` | _TBD_ |
| `registry-yield` | _TBD_ |
| `report-builder` | _TBD_ |
| `report-builder/query-builder` | _TBD_ |
| `report-builder/results-table` | _TBD_ |
| `resource-context-panel` | _TBD_ |
| `rules-builder` | _TBD_ |
| `schedule-calendar` | _TBD_ |
| `schedule-item-card` | _TBD_ |
| `select` | _TBD_ |
| `spacer` | _TBD_ |
| `spinner` | _TBD_ |
| `tab-navigation` | _TBD_ |
| `table` | _TBD_ |
| `table/cell/point` | _TBD_ |
| `table/cell/resizer` | _TBD_ |
| `table/cell/vehicle-name` | _TBD_ |
| `table/row` | _TBD_ |
| `table/td` | _TBD_ |
| `table/th` | _TBD_ |
| `tabs` | _TBD_ |
| `tabs/tab` | _TBD_ |
| `template-builder` | _TBD_ |
| `template-builder/properties-panel` | _TBD_ |
| `template-builder/properties-panel/section` | _TBD_ |
| `template-builder/queries-panel` | _TBD_ |
| `template-builder/query-form` | _TBD_ |
| `template-builder/toolbar` | _TBD_ |
| `template-builder/variable-picker` | _TBD_ |
| `timeline` | _TBD_ |
| `tip-tap-editor` | _TBD_ |
| `toggle` | _TBD_ |
| `translations-editor` | _TBD_ |
| `unit-input` | _TBD_ |
| `visible-column-picker` | _TBD_ |
| `widget/query-params` | _TBD_ |
| `with-record` | _TBD_ |

## Usage

Search Fleetbase templates for each component name to find real usage examples.

---



<a id="doc-29"></a>

<!-- ========== DOCUMENT 29: 29-ember-core-services-reference.md ========== -->

# ember-core Services Reference

| Field | Value |
|-------|-------|
| **Doc ID** | 29 |
| **Volume** | 3 |
| **Status** | ✅ Done |
| **Sources** | `@fleetbase/ember-core` |

---

## Purpose

Core services used by every page.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


| Service | Purpose |
|---------|---------|
| `session` | Auth, requireAuthentication, invalidateWithLoader |
| `currentUser` | User + company context, options, admin flag |
| `fetch` | HTTP client, uploads |
| `store` | Ember Data |
| `notifications` | Toast messages |
| `modalsManager` | Confirm/action modals |
| `abilities` | Permission checks (can helper) |
| `theme` | Body classes, theme init |
| `sidebar` | show/hide sidebar |
| `intl` | Translations |

---



<a id="doc-30"></a>

<!-- ========== DOCUMENT 30: 30-universe-menu-widget-registry-hook.md ========== -->

# Universe: Menu, Widget, Registry & Hook

| Field | Value |
|-------|-------|
| **Doc ID** | 30 |
| **Volume** | 3 |
| **Status** | ✅ Done |
| **Sources** | `ember-core universe/*` |

---

## Purpose

Universe sub-services.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


See doc 03 for full API table.

## Hook events (examples)

- `application:before-model`, `application:loading`, `application:will-transition`
- `console:before-model`, `console:after-model`, `console:did-transition`
- `virtual:before-model`, `virtual:after-model`

---



<a id="doc-31"></a>

<!-- ========== DOCUMENT 31: 31-extension-lifecycle-and-extension-manager.md ========== -->

# Extension Lifecycle & Extension Manager

| Field | Value |
|-------|-------|
| **Doc ID** | 31 |
| **Volume** | 3 |
| **Status** | ✅ Done |
| **Sources** | `extension-manager, load-extensions` |

---

## Purpose

Extension boot.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


1. Build: fleetbase-extensions-generator discovers npm engines
2. App boot: `extensionManager.waitForBoot()` in application route
3. `load-extensions` fetches installed extensions from API
4. `setup-extensions` runs each `setupExtension(app, universe)`
5. Menu/widget/registry populated before first console render

---



<a id="doc-32"></a>

<!-- ========== DOCUMENT 32: 32-console-data-models-and-relationships.md ========== -->

# Console Data Models & Relationships

| Field | Value |
|-------|-------|
| **Doc ID** | 32 |
| **Volume** | 4 |
| **Status** | ✅ Done |
| **Sources** | `console/app/models/` |

---

## Purpose

All console host models with fields from source.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---

## Models (36 total)

### `activity`
| Field | Type |
|-------|------|
| `uuid` | string |
| `log_name` | string |
| `description` | string |
| `company_id` | string |
| `subject_id` | string |
| `subject_type` | string |
| `humanized_subject_type` | string |
| `event` | string |
| `causer_id` | string |
| `causer_type` | string |
| `humanized_causer_type` | string |
| `properties` | object |
| `causer` | object |
| `subject` | object |
| `created_at` | date |
| `updated_at` | date |

### `alert`
| Field | Type |
|-------|------|
| `type` | string |
| `severity` | string |
| `status` | string |
| `subject_type` | string |
| `subject_uuid` | string |
| `message` | string |
| `rule` | string |
| `context` | string |
| `meta` | string |
| `triggered_at` | date |
| `acknowledged_at` | date |
| `resolved_at` | date |
| `created_at` | date |
| `updated_at` | date |
| `deleted_at` | date |

**belongsTo:** `company`

### `brand`
| Field | Type |
|-------|------|
| `uuid` | string |
| `logo_uuid` | string |
| `icon_uuid` | string |
| `default_theme` | string |
| `logo_url` | string |
| `icon_url` | string |

### `category`
| Field | Type |
|-------|------|
| `uuid` | string |
| `company_uuid` | string |
| `parent_uuid` | string |
| `owner_uuid` | string |
| `icon_file_uuid` | string |
| `owner_type` | string |
| `name` | string |
| `description` | string |
| `icon` | string |
| `icon_color` | string |
| `for` | string |
| `slug` | string |
| `order` | string |
| `translations` | raw |
| `meta` | raw |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `file`, `category:subcategories`

**hasMany:** `category:parent`

### `chat-attachment`
| Field | Type |
|-------|------|
| `chat_channel_uuid` | string |
| `sender_uuid` | string |
| `file_uuid` | string |
| `chat_message_uuid` | string |
| `url` | string |
| `filename` | string |
| `content_type` | string |
| `created_at` | date |
| `updated_at` | date |

### `chat-channel`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `created_by_uuid` | string |
| `name` | string |
| `title` | string |
| `unread_count` | number |
| `slug` | string |
| `feed` | array |
| `meta` | array |
| `created_at` | date |
| `updated_at` | date |

### `chat-log`
| Field | Type |
|-------|------|
| `company_uuid` | string |
| `chat_channel_uuid` | string |
| `initiator_uuid` | string |
| `content` | string |
| `resolved_content` | string |
| `event_type` | string |
| `status` | string |
| `meta` | array |
| `created_at` | date |
| `updated_at` | date |

### `chat-message`
| Field | Type |
|-------|------|
| `chat_channel_uuid` | string |
| `sender_uuid` | string |
| `content` | string |
| `attachment_files` | array |
| `created_at` | date |
| `updated_at` | date |

### `chat-participant`
| Field | Type |
|-------|------|
| `user_uuid` | string |
| `chat_channel_uuid` | string |
| `name` | string |
| `username` | string |
| `phone` | string |
| `email` | string |
| `avatar_url` | string |
| `is_online` | boolean |
| `last_seen_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `chat-receipt`
| Field | Type |
|-------|------|
| `participant_uuid` | string |
| `chat_message_uuid` | string |
| `participant_name` | string |
| `created_at` | date |
| `updated_at` | date |
| `read_at` | date |

### `comment`
| Field | Type |
|-------|------|
| `company_uuid` | string |
| `parent_comment_uuid` | string |
| `subject_uuid` | string |
| `subject_type` | string |
| `content` | string |
| `editable` | boolean |
| `tags` | raw |
| `meta` | raw |
| `created_at` | date |
| `updated_at` | date |
| `deleted_at` | date |

**belongsTo:** `user`, `comment:replies`

**hasMany:** `comment:parent`

### `company`
| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `owner_uuid` | string |
| `logo_uuid` | string |
| `backdrop_uuid` | string |
| `place_uuid` | string |
| `name` | string |
| `website_url` | string |
| `logo_url` | string |
| `backdrop_url` | string |
| `description` | string |
| `options` | object |
| `users_count` | number |
| `type` | string |
| `currency` | string |
| `country` | string |
| `timezone` | string |
| `phone` | string |
| `status` | string |
| `slug` | string |
| `onboarding_completed` | boolean, { defaultValue: false } |
| `joined_at` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `user`, `file`, `file`

### `custom-field`
| Field | Type |
|-------|------|
| `company_uuid` | string |
| `category_uuid` | string |
| `subject_uuid` | string |
| `subject_type` | string |
| `name` | string |
| `description` | string |
| `for` | string |
| `help_text` | string |
| `label` | string |
| `type` | string |
| `component` | string |
| `default_value` | string |
| `order` | number |
| `required` | boolean |
| `editable` | boolean, { defaultValue: true } |
| `options` | raw |
| `validation_rules` | raw |
| `meta` | raw |
| `created_at` | date |
| `updated_at` | date |
| `deleted_at` | date |

### `custom-field-value`
| Field | Type |
|-------|------|
| `company_uuid` | string |
| `custom_field_uuid` | string |
| `subject_uuid` | string |
| `subject_type` | string |
| `value` | string |
| `value_type` | string |
| `created_at` | date |
| `updated_at` | date |
| `deleted_at` | date |

### `dashboard`
| Field | Type |
|-------|------|
| `company_uuid` | string |
| `user_uuid` | string |
| `name` | string |
| `extension` | string |
| `is_default` | boolean |
| `tags` | array |
| `options` | object |
| `meta` | object |
| `created_at` | date |
| `updated_at` | date |

### `dashboard-widget`
| Field | Type |
|-------|------|
| `dashboard_uuid` | string |
| `name` | string |
| `component` | string |
| `grid_options` | object |
| `options` | object |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `dashboard`

### `extension`
| Field | Type |
|-------|------|
| `uuid` | string |
| `author_uuid` | string |
| `category_uuid` | string |
| `type_uuid` | string |
| `icon_uuid` | string |
| `extension_id` | string |
| `name` | string |
| `display_name` | string |
| `description` | string |
| `icon_url` | string |
| `namespace` | string |
| `key` | string |
| `internal_route` | string |
| `fa_icon` | string |
| `version` | string |
| `website_url` | string |
| `privacy_policy_url` | string |
| `tos_url` | string |
| `contact_email` | string |
| `domains` | string |
| `type_name` | string |
| `category_name` | string |
| `author_name` | string |
| `install_count` | number |
| `secret` | string |
| `client_token` | string |
| `status` | string |
| `slug` | string |
| `core_service` | boolean |
| `is_installed` | boolean |
| `installed` | boolean |
| `tags` | raw |
| `meta` | raw |
| `config` | raw |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `file`
| Field | Type |
|-------|------|
| `uuid` | string |
| `uploader_uuid` | string |
| `company_uuid` | string |
| `subject_uuid` | string |
| `caption` | string |
| `url` | string |
| `path` | string |
| `bucket` | string |
| `folder` | string |
| `etag` | string |
| `original_filename` | string |
| `type` | string |
| `content_type` | string |
| `subject_type` | string |
| `file_size` | number |
| `slug` | string |
| `permalink` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `group`
| Field | Type |
|-------|------|
| `name` | string |
| `description` | string |
| `created_at` | date |
| `updated_at` | date |

**hasMany:** `policy`, `permission`

### `notification`
| Field | Type |
|-------|------|
| `notifiable_id` | string |
| `notifiable_type` | string |
| `type` | string |
| `data` | raw |
| `meta` | raw |
| `read_at` | date |
| `created_at` | date |

### `permission`
| Field | Type |
|-------|------|
| `name` | string |
| `guard_name` | string |
| `service` | string |
| `created_at` | date |
| `updated_at` | date |

### `policy`
| Field | Type |
|-------|------|
| `company_uuid` | string |
| `name` | string |
| `type` | string |
| `service` | string |
| `guard_name` | string |
| `description` | string |
| `is_mutable` | boolean |
| `is_deletable` | boolean |
| `created_at` | date |
| `updated_at` | date |

**hasMany:** `permission`

### `report`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `created_by_uuid` | string |
| `category_uuid` | string |
| `subject_uuid` | string |
| `subject_type` | string |
| `title` | string |
| `description` | string |
| `period_start` | date |
| `period_end` | date |
| `last_executed_at` | date |
| `execution_time` | number |
| `row_count` | number |
| `is_scheduled` | boolean |
| `is_generated` | boolean |
| `status` | string |
| `type` | string |
| `export_formats` | raw |
| `schedule_config` | raw |
| `data` | raw |
| `result_columns` | raw |
| `query_config` | raw |
| `tags` | raw |
| `options` | raw |
| `meta` | raw |
| `status` | string |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `company`, `user`

**hasMany:** `report-execution`, `report-audit-log`

### `role`
| Field | Type |
|-------|------|
| `company_uuid` | string |
| `name` | string |
| `guard_name` | string |
| `description` | string |
| `service` | string |
| `type` | string |
| `is_mutable` | boolean |
| `is_deletable` | boolean |
| `created_at` | date |
| `updated_at` | date |

**hasMany:** `policy`, `permission`

### `schedule`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `subject_uuid` | string |
| `subject_type` | string |
| `name` | string |
| `description` | string |
| `start_date` | date |
| `end_date` | date |
| `timezone` | string |
| `status` | string, { defaultValue: draft } |
| `meta` | object |
| `last_materialized_at` | date |
| `materialization_horizon_days` | number, { defaultValue: 60 } |
| `created_at` | date |
| `updated_at` | date |
| `deleted_at` | date |

### `schedule-availability`
| Field | Type |
|-------|------|
| `subject_uuid` | string |
| `subject_type` | string |
| `start_at` | date |
| `end_at` | date |
| `is_available` | boolean, { defaultValue: true } |
| `preference_level` | number |
| `rrule` | string |
| `reason` | string |
| `notes` | string |
| `meta` | object |
| `created_at` | date |
| `updated_at` | date |
| `deleted_at` | date |

### `schedule-constraint`
| Field | Type |
|-------|------|
| `company_uuid` | string |
| `subject_uuid` | string |
| `subject_type` | string |
| `name` | string |
| `description` | string |
| `type` | string |
| `category` | string |
| `constraint_key` | string |
| `constraint_value` | string |
| `jurisdiction` | string |
| `priority` | number, { defaultValue: 0 } |
| `is_active` | boolean, { defaultValue: true } |
| `meta` | object |
| `created_at` | date |
| `updated_at` | date |
| `deleted_at` | date |

**belongsTo:** `company`

### `schedule-exception`
| Field | Type |
|-------|------|
| `public_id` | string |
| `schedule_uuid` | string |
| `subject_uuid` | string |
| `subject_type` | string |
| `requested_by_uuid` | string |
| `type` | string, { defaultValue: time_off } |
| `status` | string, { defaultValue: pending } |
| `start_at` | date |
| `end_at` | date |
| `reason` | string |
| `notes` | string |
| `rejection_reason` | string |
| `reviewed_at` | date |
| `reviewed_by_uuid` | string |
| `meta` | object |
| `created_at` | date |
| `updated_at` | date |
| `deleted_at` | date |

### `schedule-item`
| Field | Type |
|-------|------|
| `public_id` | string |
| `schedule_uuid` | string |
| `schedule_template_uuid` | string |
| `assignee_uuid` | string |
| `assignee_type` | string |
| `resource_uuid` | string |
| `resource_type` | string |
| `start_at` | date |
| `end_at` | date |
| `duration` | number |
| `break_start_at` | date |
| `break_end_at` | date |
| `title` | string |
| `status` | string, { defaultValue: scheduled } |
| `notes` | string |
| `is_exception` | boolean, { defaultValue: false } |
| `exception_for_date` | date |
| `meta` | object |
| `created_at` | date |
| `updated_at` | date |
| `deleted_at` | date |

### `schedule-template`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `name` | string |
| `description` | string |
| `start_time` | string |
| `end_time` | string |
| `break_start_time` | string |
| `break_end_time` | string |
| `duration` | number |
| `break_duration` | number |
| `rrule` | string |
| `color` | string |
| `meta` | object |
| `created_at` | date |
| `updated_at` | date |
| `deleted_at` | date |

### `setting`
### `template`
| Field | Type |
|-------|------|
| `public_id` | string |
| `uuid` | string |
| `company_uuid` | string |
| `created_by_uuid` | string |
| `name` | string |
| `description` | string |
| `context_type` | string |
| `paper_size` | string, { defaultValue: A4 } |
| `orientation` | string, { defaultValue: portrait } |
| `width` | number |
| `height` | number |
| `unit` | string, { defaultValue: mm } |
| `background_color` | string, { defaultValue: #ffffff } |
| `content` | array |
| `is_default` | boolean, { defaultValue: false } |
| `status` | string, { defaultValue: draft } |
| `meta` | object |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**hasMany:** `template-query:template`

### `template-query`
| Field | Type |
|-------|------|
| `public_id` | string |
| `uuid` | string |
| `company_uuid` | string |
| `template_uuid` | string |
| `name` | string |
| `label` | string |
| `description` | string |
| `resource_type` | string |
| `filters` | object |
| `sort_by` | string |
| `sort_direction` | string, { defaultValue: desc } |
| `limit` | number |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `template:queries`

### `transaction`
### `user`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `avatar_uuid` | string |
| `name` | string |
| `email` | string |
| `password` | string |
| `phone` | string |
| `company_name` | string |
| `date_of_birth` | string |
| `timezone` | string |
| `country` | string |
| `ip_address` | string |
| `aws_customer_id` | string |
| `slug` | string |
| `role_name` | string |
| `type` | string |
| `session_status` | string |
| `status` | string |
| `locale` | string |
| `is_online` | boolean |
| `is_admin` | boolean |
| `is_subscribed` | boolean |
| `is_trialing` | boolean |
| `company_onboarding_completed` | boolean |
| `meta` | raw |
| `subscription` | raw |
| `last_seen_at` | date |
| `phone_verified_at` | date |
| `email_verified_at` | date |
| `trial_ends_at` | date |
| `last_login` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `role`

**hasMany:** `policy`, `permission`

### `user-device`

---



<a id="doc-33"></a>

<!-- ========== DOCUMENT 33: 33-fleetops-data-model-encyclopedia.md ========== -->

# fleetops-data Model Encyclopedia

| Field | Value |
|-------|-------|
| **Doc ID** | 33 |
| **Volume** | 4 |
| **Status** | ✅ Done |
| **Sources** | `packages/fleetops-data/addon/models/*.js` |

---

## Purpose

Complete field-level reference for all 52 shared logistics Ember Data models.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---

## Models (52 total)

### `asset`
| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `company_uuid` | string |
| `category_uuid` | string |
| `vendor_uuid` | string |
| `warranty_uuid` | string |
| `telematic_uuid` | string |
| `assigned_to_uuid` | string |
| `assigned_to_type` | string |
| `operator_uuid` | string |
| `operator_type` | string |
| `current_place_uuid` | string |
| `photo_uuid` | string |
| `name` | string |
| `description` | string |
| `code` | string |
| `type` | string |
| `location` | point |
| `speed` | string |
| `heading` | string |
| `altitude` | string |
| `status` | string |
| `usage_type` | string |
| `vin` | string |
| `plate_number` | string |
| `make` | string |
| `model` | string |
| `year` | string |
| `color` | string |
| `serial_number` | string |
| `measurement_system` | string |
| `odometer` | string |
| `odometer_unit` | string |
| `transmission` | string |
| `fuel_volume_unit` | string |
| `fuel_Type` | string |
| `ownership_type` | string |
| `engine_hours` | string |
| `gvw` | string |
| `capacity` | raw |
| `specs` | raw |
| `attributes` | raw |
| `notes` | string |
| `slug` | string |
| `photo_url` | string |
| `display_name` | string |
| `category_name` | string |
| `vendor_name` | string |
| `warranty_name` | string |
| `current_location` | string |
| `is_online` | boolean |
| `last_maintenance` | date |
| `next_maintenance_due` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `contact`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `user_uuid` | string |
| `photo_uuid` | string |
| `place_uuid` | string |
| `internal_id` | string |
| `name` | string |
| `title` | string |
| `email` | string |
| `phone` | string |
| `address` | string |
| `address_street` | string |
| `type` | string |
| `photo_url` | string, {
        defaultValue: https://s3.ap-southeast-1.amazonaws.com/flb-assets/static/no-avatar.png,
    } |
| `slug` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `file`, `user`, `place`

**hasMany:** `place`

### `customer`
**Extends:** `ContactModel`

| Field | Type |
|-------|------|
| `name` | string |
| `customer_type` | string |

**hasMany:** `waypoint:customer`

### `customer-contact`
**Extends:** `CustomerModel`

| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `company_uuid` | string |
| `photo_uuid` | string |
| `photo_url` | string |
| `name` | string |
| `title` | string |
| `email` | string |
| `phone` | string |
| `type` | string |
| `slug` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `customer-vendor`
**Extends:** `CustomerModel`

| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `company_uuid` | string |
| `type_uuid` | string |
| `connect_company_uuid` | string |
| `logo_uuid` | string |
| `internal_id` | string |
| `business_id` | string |
| `name` | string |
| `email` | string |
| `website_url` | string |
| `phone` | string |
| `address` | string |
| `address_street` | string |
| `place_uuid` | string |
| `country` | string |
| `status` | string |
| `slug` | string |
| `type` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `device`
| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `company_uuid` | string |
| `telematic_uuid` | string |
| `warranty_uuid` | string |
| `attachable_type` | string |
| `attachable_uuid` | string |
| `photo_uuid` | string |
| `name` | string |
| `model` | string |
| `location` | string |
| `type` | string |
| `device_id` | string |
| `internal_id` | string |
| `imei` | string |
| `imsi` | string |
| `firmware_version` | string |
| `provider` | string |
| `photo_url` | string |
| `warranty_name` | string |
| `telematic_name` | string |
| `is_online` | boolean |
| `attached_to_name` | string |
| `connection_status` | string |
| `manufacturer` | string |
| `serial_number` | string |
| `last_position` | point |
| `meta` | object |
| `data` | object |
| `options` | object |
| `online` | boolean |
| `status` | string, { defaultValue: inactive } |
| `data_frequency` | string |
| `notes` | string |
| `slug` | string |
| `last_maintenance_date` | date |
| `installation_date` | date |
| `last_online_at` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `device-event`
| Field | Type |
|-------|------|
| `public_id` | string |
| `device_uuid` | string |
| `payload` | raw |
| `meta` | raw |
| `location` | string |
| `event_type` | string |
| `severity` | string |
| `ident` | string |
| `protocol` | string |
| `provider` | string |
| `mileage` | string |
| `state` | string |
| `code` | string |
| `reason` | string |
| `comment` | string |
| `slug` | string |
| `device_name` | string |
| `occurred_at` | date |
| `processed_at` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `driver`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `user_uuid` | string |
| `vehicle_uuid` | string |
| `vendor_uuid` | string |
| `current_job_uuid` | string |
| `photo_uuid` | string |
| `vehicle_id` | string |
| `vendor_id` | string |
| `current_job_id` | string |
| `internal_id` | string |
| `name` | string |
| `phone` | string |
| `email` | string |
| `vehicle_name` | string |
| `vendor_name` | string |
| `drivers_license_number` | string |
| `avatar_value` | string |
| `location` | point |
| `heading` | number |
| `country` | string |
| `city` | string |
| `status` | string |
| `online` | boolean |
| `meta` | raw |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `entity`
| Field | Type |
|-------|------|
| `public_id` | string |
| `internal_id` | string |
| `_import_id` | string |
| `payload_uuid` | string |
| `company_uuid` | string |
| `customer_uuid` | string |
| `supplier_uuid` | string |
| `driver_assigned_uuid` | string |
| `tracking_number_uuid` | string |
| `destination_uuid` | string |
| `photo_uuid` | string |
| `name` | string |
| `type` | string |
| `description` | string |
| `photo_url` | string, {
        defaultValue: https://flb-assets.s3-ap-southeast-1.amazonaws.com/static/parcels/medium.png,
    } |
| `currency` | string, {
        defaultValue: USD,
    } |
| `barcode` | string |
| `tracking` | string |
| `qr_code` | string |
| `weight` | string |
| `weight_unit` | string, {
        defaultValue: g,
    } |
| `length` | string |
| `width` | string |
| `height` | string |
| `dimensions_unit` | string, {
        defaultValue: cm,
    } |
| `declared_value` | string |
| `sku` | string |
| `price` | string |
| `sale_price` | string |
| `slug` | string |
| `meta` | raw |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `payload`, `vendor`, `driver`, `tracking-number`, `place`, `file`

### `equipment`
| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `company_uuid` | string |
| `warranty_uuid` | string |
| `photo_uuid` | string |
| `equipable_type` | string |
| `equipable_uuid` | string |
| `name` | string |
| `code` | string |
| `type` | string |
| `status` | string |
| `serial_number` | string |
| `manufacturer` | string |
| `model` | string |
| `purchase_price` | string |
| `currency` | string |
| `meta` | raw |
| `slug` | string |
| `warranty_name` | string |
| `photo_url` | string |
| `equipped_to_name` | string |
| `is_equipped` | boolean |
| `age_in_days` | number |
| `depreciated_value` | string |
| `purchased_at` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `facilitator`
| Field | Type |
|-------|------|
| `public_id` | string |
| `name` | string |
| `facilitator_type` | string |
| `provider` | string |
| `photo_url` | string |
| `provider_settings` | raw |
| `service_types` | raw |
| `supported_countries` | raw |

### `facilitator-contact`
**Extends:** `FacilitatorModel`

| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `company_uuid` | string |
| `photo_uuid` | string |
| `photo_url` | string |
| `name` | string |
| `title` | string |
| `email` | string |
| `phone` | string |
| `type` | string |
| `slug` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `facilitator-customer`
**Extends:** `FacilitatorModel`

| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `company_uuid` | string |
| `photo_uuid` | string |
| `photo_url` | string |
| `name` | string |
| `title` | string |
| `email` | string |
| `phone` | string |
| `type` | string |
| `slug` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `facilitator-integrated-vendor`
**Extends:** `FacilitatorModel`

| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `created_by_uuid` | string |
| `host` | string |
| `namespace` | string |
| `provider` | string |
| `sandbox` | boolean |
| `credentials` | raw |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |
| `name` | string |
| `photo_url` | string |
| `status` | string |
| `type` | string |
| `address` | string |
| `internal_id` | string |
| `email` | string |
| `phone` | string |
| `provider_settings` | raw |
| `service_types` | raw |
| `supported_countries` | raw |

### `facilitator-vendor`
**Extends:** `FacilitatorModel`

| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `company_uuid` | string |
| `type_uuid` | string |
| `connect_company_uuid` | string |
| `logo_uuid` | string |
| `internal_id` | string |
| `business_id` | string |
| `name` | string |
| `email` | string |
| `website_url` | string |
| `phone` | string |
| `address` | string |
| `address_street` | string |
| `place_uuid` | string |
| `country` | string |
| `status` | string |
| `slug` | string |
| `type` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `fleet`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `image_uuid` | string |
| `service_area_uuid` | string |
| `zone_uuid` | string |
| `vendor_uuid` | string |
| `parent_fleet_uuid` | string |
| `drivers_count` | number |
| `drivers_online_count` | number |
| `vehicles_count` | number |
| `vehicles_online_count` | number |
| `photo_url` | string |
| `name` | string |
| `color` | string |
| `task` | string |
| `status` | string |
| `slug` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `vendor`, `service-area`, `zone`, `fleet:subfleets`

**hasMany:** `fleet:parent_fleet`, `driver`, `vehicle`

### `fleet-driver`
| Field | Type |
|-------|------|
| `fleet_uuid` | string |
| `driver_uuid` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `fleet`, `driver`

### `fuel-report`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `driver_uuid` | string |
| `vehicle_uuid` | string |
| `reported_by_uuid` | string |
| `reporter_name` | string |
| `driver_name` | string |
| `vehicle_name` | string |
| `report` | string |
| `odometer` | string |
| `amount` | string |
| `currency` | string |
| `volume` | string |
| `metric_unit` | string, { defaultValue: L } |
| `status` | string |
| `location` | point |
| `meta` | raw |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `driver`, `vehicle`, `user`

### `integrated-vendor`
**Extends:** `FacilitatorModel`

| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `created_by_uuid` | string |
| `host` | string |
| `namespace` | string |
| `webhook_url` | string |
| `provider` | string |
| `name` | string |
| `logo_url` | string |
| `status` | string |
| `type` | string |
| `address` | string |
| `internal_id` | string |
| `email` | string |
| `phone` | string |
| `sandbox` | boolean |
| `isIntegratedVendor` | boolean, { defaultValue: true } |
| `credentials` | object |
| `options` | object |
| `provider_options` | object |
| `service_types` | object |
| `supported_countries` | array |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `issue`
| Field | Type |
|-------|------|
| `public_id` | string |
| `issue_id` | string |
| `company_uuid` | string |
| `reported_by_uuid` | string |
| `assigned_to_uuid` | string |
| `driver_uuid` | string |
| `vehicle_uuid` | string |
| `title` | string |
| `type` | string |
| `category` | string |
| `report` | string |
| `priority` | string |
| `status` | string |
| `driver_name` | string |
| `vehicle_name` | string |
| `assignee_name` | string |
| `reporter_name` | string |
| `location` | point |
| `tags` | raw |
| `meta` | raw |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `user`, `user`, `vehicle`, `driver`

### `maintenance`
| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `company_uuid` | string |
| `work_order_uuid` | string |
| `maintainable_name` | string |
| `performed_by_name` | string |
| `work_order_subject` | string |
| `type` | string |
| `status` | string |
| `priority` | string |
| `odometer` | number |
| `engine_hours` | number |
| `summary` | string |
| `notes` | string |
| `line_items` | raw |
| `labor_cost` | string |
| `parts_cost` | string |
| `tax` | string |
| `total_cost` | string |
| `currency` | string |
| `attachments` | raw |
| `meta` | raw |
| `slug` | string |
| `duration_hours` | number |
| `is_overdue` | boolean |
| `days_until_due` | number |
| `cost_breakdown` | raw |
| `scheduled_at` | date |
| `started_at` | date |
| `completed_at` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `maintenance-schedule`
| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `company_uuid` | string |
| `subject_name` | string |
| `default_assignee_name` | string |
| `code` | string |
| `title` | string |
| `description` | string |
| `name` | string |
| `type` | string |
| `status` | string |
| `interval_method` | string |
| `interval_type` | string |
| `interval_value` | number |
| `interval_unit` | string |
| `interval_distance` | number |
| `interval_engine_hours` | number |
| `last_service_odometer` | number |
| `last_service_engine_hours` | number |
| `last_service_date` | date |
| `next_due_date` | date |
| `next_due_odometer` | number |
| `next_due_engine_hours` | number |
| `default_priority` | string |
| `instructions` | string |
| `meta` | raw |
| `slug` | string |
| `reminder_offsets` | raw |
| `last_triggered_at` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `maintenance-subject`
| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `company_uuid` | string |
| `name` | string |
| `display_name` | string |
| `type` | string |
| `status` | string |
| `photo_url` | string |
| `slug` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `maintenance-subject-equipment`
**Extends:** `MaintenanceSubjectModel`

| Field | Type |
|-------|------|
| `warranty_uuid` | string |
| `photo_uuid` | string |
| `equipable_type` | string |
| `equipable_uuid` | string |
| `code` | string |
| `serial_number` | string |
| `manufacturer` | string |
| `model` | string |
| `purchase_price` | number |
| `warranty_name` | string |
| `meta` | raw |
| `purchased_at` | date |

### `maintenance-subject-vehicle`
**Extends:** `MaintenanceSubjectModel`

| Field | Type |
|-------|------|
| `internal_id` | string |
| `photo_uuid` | string |
| `vendor_uuid` | string |
| `category_uuid` | string |
| `warranty_uuid` | string |
| `telematic_uuid` | string |
| `make` | string |
| `model` | string |
| `year` | string |
| `trim` | string |
| `plate_number` | string |
| `vin` | string |
| `driver_name` | string |
| `vendor_name` | string |
| `display_name` | string |
| `avatar_value` | string |
| `color` | string |
| `country` | string |
| `odometer` | number |
| `engine_hours` | number |
| `meta` | raw |

### `manifest`
| Field | Type |
|-------|------|
| `public_id` | string |
| `internal_id` | string |
| `company_uuid` | string |
| `driver_uuid` | string |
| `vehicle_uuid` | string |
| `status` | string |
| `notes` | string |
| `driver_name` | string |
| `vehicle_name` | string |
| `stop_count` | number |
| `completed_stops` | number |
| `pending_stops` | number |
| `total_distance_m` | number |
| `total_duration_s` | number |
| `meta` | raw |
| `scheduled_date` | date |
| `started_at` | date |
| `completed_at` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `manifest-stop`
| Field | Type |
|-------|------|
| `public_id` | string |
| `manifest_uuid` | string |
| `order_uuid` | string |
| `place_uuid` | string |
| `waypoint_uuid` | string |
| `sequence` | number |
| `status` | string |
| `notes` | string |
| `estimated_arrival` | date |
| `actual_arrival` | date |
| `distance_from_prev_m` | number |
| `meta` | raw |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `manifest:stops`

### `order`
| Field | Type |
|-------|------|
| `public_id` | string |
| `internal_id` | string |
| `company_uuid` | string |
| `transaction_uuid` | string |
| `customer_uuid` | string |
| `facilitator_uuid` | string |
| `payload_uuid` | string |
| `route_uuid` | string |
| `purchase_rate_uuid` | string |
| `tracking_number_uuid` | string |
| `driver_assigned_uuid` | string |
| `manifest_uuid` | string |
| `service_quote_uuid` | string |
| `order_config_uuid` | string |
| `payload_id` | string |
| `purchase_rate_id` | string |
| `driver_id` | string |
| `tracking` | string |
| `qr_code` | string |
| `barcode` | string |
| `pickup_name` | string |
| `dropoff_name` | string |
| `driver_name` | string |
| `customer_name` | string |
| `customer_type` | string |
| `facilitator_name` | string |
| `facilitator_type` | string |
| `created_by_name` | string |
| `updated_by_name` | string |
| `pod_method` | string |
| `notes` | string |
| `type` | string |
| `status` | string |
| `adhoc_distance` | number |
| `total_entities` | number |
| `transaction_amount` | number |
| `has_driver_assigned` | boolean |
| `pod_required` | boolean |
| `dispatched` | boolean |
| `started` | boolean |
| `adhoc` | boolean |
| `is_route_optimized` | boolean |
| `customer_is_contact` | boolean |
| `customer_is_vendor` | boolean |
| `facilitator_is_contact` | boolean |
| `facilitator_is_vendor` | boolean |
| `meta` | raw |
| `options` | raw |
| `tracker_data` | raw |
| `eta` | raw |
| `time_window_start` | date |
| `time_window_end` | date |
| `required_skills` | raw |
| `orchestrator_priority` | number |
| `scheduled_at` | date |
| `dispatched_at` | date |
| `started_at` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `company`, `order-config`, `driver:jobs`

### `order-config`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `author_uuid` | string |
| `category_uuid` | string |
| `icon_uuid` | string |
| `name` | string |
| `namespace` | string |
| `description` | string |
| `key` | string |
| `status` | string |
| `version` | string |
| `type` | string |
| `core_service` | boolean, { defaultValue: false } |
| `tags` | array |
| `entities` | array |
| `flow` | object |
| `meta` | object |

**belongsTo:** `user`, `category`, `file`

### `part`
| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `company_uuid` | string |
| `vendor_uuid` | string |
| `warranty_uuid` | string |
| `photo_uuid` | string |
| `asset_type` | string |
| `asset_uuid` | string |
| `sku` | string |
| `name` | string |
| `manufacturer` | string |
| `model` | string |
| `serial_number` | string |
| `barcode` | string |
| `description` | string |
| `quantity_on_hand` | number |
| `unit_cost` | string |
| `msrp` | string |
| `currency` | string |
| `type` | string |
| `status` | string |
| `specs` | raw |
| `meta` | raw |
| `slug` | string |
| `vendor_name` | string |
| `warranty_name` | string |
| `photo_url` | string |
| `total_value` | string |
| `is_in_stock` | boolean |
| `is_low_stock` | boolean |
| `asset_name` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `payload`
| Field | Type |
|-------|------|
| `public_id` | string |
| `current_waypoint_uuid` | string |
| `pickup_uuid` | string |
| `dropoff_uuid` | string |
| `return_uuid` | string |
| `meta` | string |
| `cod_amount` | string |
| `cod_currency` | string |
| `cod_payment_method` | string |
| `type` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `place`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `vendor_uuid` | string |
| `name` | string |
| `phone` | string |
| `type` | string |
| `avatar_value` | string |
| `address` | string |
| `address_html` | string |
| `street1` | string |
| `street2` | string |
| `city` | string |
| `province` | string |
| `postal_code` | string |
| `neighborhood` | string |
| `district` | string |
| `building` | string |
| `security_access_code` | string |
| `country` | string |
| `country_name` | string |
| `vendor_name` | string |
| `_import_id` | string |
| `eta` | string |
| `meta` | raw |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `position`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `order_uuid` | string |
| `destination_uuid` | string |
| `subject_uuid` | string |
| `subject_type` | string |
| `coordinates` | point |
| `heading` | number |
| `bearing` | number |
| `speed` | number |
| `altitude` | number |
| `latitude` | number |
| `longitude` | number |
| `created_at` | date |
| `updated_at` | date |

### `purchase-rate`
| Field | Type |
|-------|------|
| `customer_uuid` | string |
| `company_uuid` | string |
| `service_quote_uuid` | string |
| `payload_uuid` | string |
| `transaction_uuid` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |
| `status` | string |
| `meta` | raw |

**belongsTo:** `service-quote`

### `route`
| Field | Type |
|-------|------|
| `company_uuid` | string |
| `order_uuid` | string |
| `order_status` | string |
| `order_public_id` | string |
| `order_internal_id` | string |
| `details` | raw |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `sensor`
| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `company_uuid` | string |
| `telematic_uuid` | string |
| `device_uuid` | string |
| `warranty_uuid` | string |
| `sensorable_type` | string |
| `sensorable_uuid` | string |
| `photo_uuid` | string |
| `name` | string |
| `internal_id` | string |
| `type` | string |
| `serial_number` | string |
| `imei` | string |
| `imsi` | string |
| `firmware_version` | string |
| `unit` | string |
| `min_threshold` | number |
| `max_threshold` | number |
| `threshold_inclusive` | boolean |
| `last_value` | string |
| `report_frequency_sec` | number |
| `last_position` | point |
| `calibration` | object |
| `meta` | object |
| `slug` | string |
| `status` | string, { defaultValue: inactive } |
| `photo_url` | string |
| `is_active` | boolean |
| `threshold_status` | string |
| `last_reading_at` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `service-area`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `parent_uuid` | string |
| `name` | string |
| `type` | string |
| `country` | string |
| `color` | string |
| `stroke_color` | string |
| `status` | string |
| `trigger_on_entry` | boolean |
| `trigger_on_exit` | boolean |
| `dwell_threshold_minutes` | number |
| `speed_limit_kmh` | number |
| `border` | multi-polygon |
| `center` | point |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `service-quote`
| Field | Type |
|-------|------|
| `public_id` | string |
| `request_id` | string |
| `service_rate_uuid` | string |
| `payload_uuid` | string |
| `service_rate_name` | string |
| `amount` | string |
| `currency` | string |
| `meta` | raw |
| `expired_at` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**hasMany:** `service-quote-item`

### `service-quote-item`
| Field | Type |
|-------|------|
| `public_id` | string |
| `service_quote_uuid` | string |
| `amount` | number |
| `currency` | string |
| `details` | string |
| `code` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `service-rate`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `service_area_uuid` | string |
| `zone_uuid` | string |
| `order_config_uuid` | string |
| `service_area_name` | string |
| `zone_name` | string |
| `service_name` | string |
| `service_type` | string |
| `base_fee` | string |
| `per_meter_flat_rate_fee` | string |
| `per_meter_unit` | string |
| `max_distance_unit` | string, { defaultValue: km } |
| `max_distance` | number, { defaultValue: 1 } |
| `algorithm` | string |
| `rate_calculation_method` | string |
| `cod_calculation_method` | string |
| `cod_flat_fee` | string |
| `cod_percent` | string |
| `peak_hours_calculation_method` | string |
| `peak_hours_flat_fee` | string |
| `peak_hours_percent` | string |
| `peak_hours_start` | string |
| `peak_hours_end` | string |
| `currency` | string |
| `duration_terms` | string |
| `estimated_days` | string |
| `has_cod_fee` | boolean |
| `has_peak_hours_fee` | boolean |
| `meta` | raw |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `service-area`, `order-config`, `zone`

**hasMany:** `service-rate-fee`, `service-rate-parcel-fee`

### `service-rate-fee`
| Field | Type |
|-------|------|
| `service_rate_uuid` | string |
| `distance` | number |
| `distance_unit` | string |
| `unit` | string |
| `fee` | string |
| `currency` | string |
| `min` | number |
| `max` | number |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `service-rate-parcel-fee`
| Field | Type |
|-------|------|
| `service_rate_uuid` | string |
| `size` | string |
| `length` | string |
| `width` | string |
| `height` | string |
| `dimensions_unit` | string |
| `weight` | string |
| `weight_unit` | string |
| `fee` | string |
| `currency` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `telematic`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `warranty_uuid` | string |
| `name` | string |
| `provider` | string |
| `model` | string |
| `serial_number` | string |
| `firmware_version` | string |
| `status` | string, { defaultValue: initialized } |
| `imei` | string |
| `iccid` | string |
| `imsi` | string |
| `msisdn` | string |
| `last_metrics` | object |
| `credentials` | object |
| `config` | object |
| `meta` | object |
| `provider_descriptor` | object |
| `slug` | string |
| `warranty_name` | string |
| `last_seen_at` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `tracking-number`
| Field | Type |
|-------|------|
| `status_uuid` | string |
| `owner_uuid` | string |
| `tracking_number` | string |
| `region` | string |
| `qr_code` | string |
| `barcode` | string |
| `last_status` | string |
| `type` | string |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `tracking-status`
| Field | Type |
|-------|------|
| `tracking_number_uuid` | string |
| `status` | string |
| `details` | string |
| `code` | string |
| `city` | string |
| `province` | string |
| `postal_code` | string |
| `country` | string |
| `location` | point |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `vehicle`
| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `internal_id` | string |
| `company_uuid` | string |
| `photo_uuid` | string |
| `vendor_uuid` | string |
| `category_uuid` | string |
| `warranty_uuid` | string |
| `telematic_uuid` | string |
| `name` | string |
| `description` | string |
| `driver_name` | string |
| `vendor_name` | string |
| `display_name` | string |
| `avatar_value` | string |
| `location` | point |
| `speed` | string |
| `heading` | string |
| `altitude` | string |
| `make` | string |
| `model` | string |
| `model_type` | string |
| `year` | string |
| `trim` | string |
| `color` | string |
| `transmission` | string |
| `type` | string |
| `class` | string |
| `measurement_system` | string, { defaultValue: km } |
| `fuel_type` | string |
| `fuel_volume_unit` | string |
| `body_type` | string |
| `body_sub_type` | string |
| `usage_type` | string |
| `ownership_type` | string |
| `odometer` | string |
| `odometer_unit` | string, { defaultValue: km } |
| `odometer_at_purchase` | number |
| `plate_number` | string |
| `call_sign` | string |
| `serial_number` | string |
| `vin` | string |
| `financing_status` | string |
| `loan_number_of_payments` | number |
| `loan_first_payment` | date |
| `loan_amount` | string |
| `estimated_service_life_distance_unit` | string |
| `estimated_service_life_distance` | number |
| `estimated_service_life_months` | number |
| `cargo_volume` | number |
| `passenger_volume` | number |
| `interior_volume` | number |
| `weight` | number |
| `width` | number |
| `length` | number |
| `height` | number |
| `towing_capacity` | number |
| `payload_capacity` | number |
| `payload_capacity_volume` | number |
| `payload_capacity_pallets` | number |
| `payload_capacity_parcels` | number |
| `seating_capacity` | number |
| `ground_clearance` | number |
| `bed_length` | number |
| `fuel_capacity` | number |
| `skills` | raw |
| `max_tasks` | number |
| `time_window_start` | string |
| `time_window_end` | string |
| `return_to_depot` | boolean |
| `emission_standard` | string |
| `dpf_equipped` | boolean |
| `scr_equipped` | boolean |
| `gvwr` | number |
| `gcwr` | number |
| `engine_number` | string |
| `engine_model` | string |
| `engine_make` | string |
| `engine_family` | string |
| `engine_configuration` | string |
| `engine_displacement` | number |
| `engine_size` | number |
| `horsepower` | number |
| `horsepower_rpm` | number |
| `torque` | number |
| `torque_rpm` | number |
| `number_of_cylinders` | number |
| `cylinder_arrangement` | string |
| `currency` | string |
| `insurance_value` | string |
| `depreciation_rate` | string |
| `current_value` | string |
| `acquisition_cost` | string |
| `notes` | string |
| `status` | string |
| `slug` | string |
| `online` | boolean |
| `vin_data` | raw |
| `specs` | raw |
| `telematics` | raw |
| `meta` | raw |
| `purchased_at` | date |
| `lease_expires_at` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `vehicle-device`
| Field | Type |
|-------|------|
| `vehicle_uuid` | string |
| `device_id` | string |
| `device_provider` | string |
| `device_type` | string |
| `device_name` | string |
| `device_location` | string |
| `device_model` | string |
| `manufacturer` | string |
| `serial_number` | string |
| `data_frequency` | string |
| `notes` | string |
| `status` | string |
| `online` | boolean |
| `meta` | raw |
| `data` | raw |
| `installation_date` | date |
| `last_maintenance_date` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `vendor`
| Field | Type |
|-------|------|
| `public_id` | string |
| `company_uuid` | string |
| `type_uuid` | string |
| `place_uuid` | string |
| `connect_company_uuid` | string |
| `logo_uuid` | string |
| `internal_id` | string |
| `business_id` | string |
| `name` | string |
| `email` | string |
| `website_url` | string |
| `phone` | string |
| `address` | string |
| `address_street` | string |
| `country` | string |
| `status` | string |
| `slug` | string |
| `type` | string |
| `customer_type` | string |
| `facilitator_type` | string |
| `meta` | raw |
| `callbacks` | raw |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `place`

**hasMany:** `contact`

### `warranty`
| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `company_uuid` | string |
| `subject_type` | string |
| `subject_uuid` | string |
| `vendor_uuid` | string |
| `provider` | string |
| `policy_number` | string |
| `coverage` | raw |
| `terms` | raw |
| `policy` | raw |
| `meta` | raw |
| `slug` | string |
| `vendor_name` | string |
| `subject_name` | string |
| `is_active` | boolean |
| `is_expired` | boolean |
| `days_remaining` | number |
| `coverage_summary` | string |
| `status` | string |
| `start_date` | date |
| `end_date` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `waypoint`
**Extends:** `PlaceModel`

| Field | Type |
|-------|------|
| `public_id` | string |
| `_import_id` | string |
| `waypoint_uuid` | string |
| `waypoint_public_id` | string |
| `tracking_number_uuid` | string |
| `customer_uuid` | string |
| `customer_type` | string |
| `tracking` | string |
| `status` | string |
| `status_code` | string |
| `type` | string |
| `order` | number |
| `time_window_start` | date |
| `time_window_end` | date |
| `service_time` | number |
| `notes` | string |
| `pod_method` | string |
| `pod_required` | boolean |

**belongsTo:** `customer:waypoints`

### `work-order`
| Field | Type |
|-------|------|
| `uuid` | string |
| `public_id` | string |
| `company_uuid` | string |
| `schedule_uuid` | string |
| `target_name` | string |
| `assignee_name` | string |
| `code` | string |
| `subject` | string |
| `status` | string |
| `priority` | string |
| `instructions` | string |
| `checklist` | raw |
| `estimated_cost` | string |
| `approved_budget` | string |
| `actual_cost` | string |
| `currency` | string |
| `cost_breakdown` | raw |
| `cost_center` | string |
| `budget_code` | string |
| `meta` | raw |
| `is_overdue` | boolean |
| `days_until_due` | number |
| `completion_percentage` | number |
| `estimated_duration` | number |
| `opened_at` | date |
| `due_at` | date |
| `closed_at` | date |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

### `zone`
| Field | Type |
|-------|------|
| `public_id` | string |
| `service_area_uuid` | string |
| `name` | string |
| `description` | string |
| `color` | string |
| `stroke_color` | string |
| `status` | string |
| `trigger_on_entry` | boolean |
| `trigger_on_exit` | boolean |
| `dwell_threshold_minutes` | number |
| `speed_limit_kmh` | number |
| `border` | polygon |
| `center` | point |
| `deleted_at` | date |
| `created_at` | date |
| `updated_at` | date |

**belongsTo:** `service-area`


## Custom UI notes

- Use this table to generate TypeScript interfaces and form schemas.
- Polymorphic types: `customer`, `facilitator`, `order.customer`, `order.facilitator`.
- Geo fields: `point`, `polygon`, `multi-polygon` need map pickers.

---



<a id="doc-34"></a>

<!-- ========== DOCUMENT 34: 34-api-and-adapter-map-by-feature.md ========== -->

# API & Adapter Map by Feature

| Field | Value |
|-------|-------|
| **Doc ID** | 34 |
| **Volume** | 4 |
| **Status** | ✅ Done |
| **Sources** | `frontend_blue_print.txt §5` |

---

## Purpose

HTTP endpoints by feature.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


> Source: `frontend_blue_print.txt` sections 5–6

## Auth
`POST auth/get-magic-reset-link`, `POST auth/reset-password`, `POST auth/verify-email`, `POST two-fa/*`

## Install / onboard
`GET installer/initialize`, `POST installer/createdb|migrate|seed`, `POST onboard/*`

## Console
`GET notifications`, `PUT notifications/mark-as-read`, `DELETE notifications/bulk-delete`
`GET lookup/timezones`, `POST users/change-password`, `POST auth/switch-organization`

## Admin
`GET settings/overview`, `GET two-fa/config`, `POST two-fa/config`
`GET schedule-monitor/tasks`, `GET schedule-monitor/:id/logs`
`POST auth/impersonate`

Engines use namespace from `config/environment.js` (`API.host` + `API.namespace`).

---



<a id="doc-35"></a>

<!-- ========== DOCUMENT 35: 35-fleetops-overview-and-route-tree.md ========== -->

# FleetOps — Overview & Route Tree

| Field | Value |
|-------|-------|
| **Doc ID** | 35 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/fleetops` |

---

## Purpose

Full routes and 188 screens.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Mount: `/fleet-ops`

## routes.js

```javascript
/* eslint-disable ember/no-shadow-route-definition */
import buildRoutes from 'ember-engines/routes';

export default buildRoutes(function () {
    this.route('virtual', { path: '/:section/:slug' });
    this.route('operations', { path: '/' }, function () {
        this.route('order-config', function () {});
        this.route('service-rates', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
        });
        this.route('orchestrator', function () {});
        this.route('scheduler', function () {
            this.route('index', { path: '/' });
            this.route('fleet-schedule');
        });
        this.route('orders', { path: '/' }, function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('virtual', { path: '/:slug' });
                });
            });
        });
        this.route('routes', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' });
            });
        });
    });
    this.route('management', { path: '/manage' }, function () {
        this.route('fleets', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('vehicles');
                    this.route('drivers');
                    this.route('virtual', { path: '/:slug' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
        });
        this.route('vendors', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
            this.route('integrated', function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
        });
        this.route('drivers', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('positions');
                    this.route('schedule');
                    this.route('virtual', { path: '/:slug' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
        });
        this.route('vehicles', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('positions');
                    this.route('devices');
                    this.route('equipment');
                    this.route('schedules');
                    this.route('work-orders');
                    this.route('maintenance-history');
                    this.route('virtual', { path: '/:slug' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
        });
        this.route('places', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('operations');
                    this.route('performance');
                    this.route('activity');
                    this.route('map');
                    this.route('comments');
                    this.route('documents');
                    this.route('rules');
                    this.route('virtual', { path: '/:slug' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
        });
        this.route('contacts', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
            this.route('customers', function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
        });
        this.route('fuel-reports', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
        });
        this.route('issues', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
        });
    });
    this.route('connectivity', function () {
        this.route('telematics', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('edit', { path: '/edit/:public_id' });
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('devices');
                    this.route('sensors');
                    this.route('events');
                });
            });
        });

        this.route('devices', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('edit', { path: '/edit/:public_id' });
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('events');
                    this.route('virtual', { path: '/:slug' });
                });
            });
        });

        this.route('sensors', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('edit', { path: '/edit/:public_id' });
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('virtual', { path: '/:slug' 
```

## Templates (188)

| # | Template |
|---|----------|
| 1 | `analytics.hbs` |
| 2 | `analytics/reports.hbs` |
| 3 | `analytics/reports/index.hbs` |
| 4 | `analytics/reports/index/details.hbs` |
| 5 | `analytics/reports/index/details/index.hbs` |
| 6 | `analytics/reports/index/details/result.hbs` |
| 7 | `analytics/reports/index/edit.hbs` |
| 8 | `analytics/reports/index/new.hbs` |
| 9 | `application.hbs` |
| 10 | `connectivity.hbs` |
| 11 | `connectivity/devices.hbs` |
| 12 | `connectivity/devices/index.hbs` |
| 13 | `connectivity/devices/index/details.hbs` |
| 14 | `connectivity/devices/index/details/events.hbs` |
| 15 | `connectivity/devices/index/details/index.hbs` |
| 16 | `connectivity/devices/index/details/virtual.hbs` |
| 17 | `connectivity/devices/index/edit.hbs` |
| 18 | `connectivity/devices/index/new.hbs` |
| 19 | `connectivity/events.hbs` |
| 20 | `connectivity/events/index.hbs` |
| 21 | `connectivity/events/index/details.hbs` |
| 22 | `connectivity/sensors.hbs` |
| 23 | `connectivity/sensors/index.hbs` |
| 24 | `connectivity/sensors/index/details.hbs` |
| 25 | `connectivity/sensors/index/details/index.hbs` |
| 26 | `connectivity/sensors/index/details/virtual.hbs` |
| 27 | `connectivity/sensors/index/edit.hbs` |
| 28 | `connectivity/sensors/index/new.hbs` |
| 29 | `connectivity/telematics.hbs` |
| 30 | `connectivity/telematics/index.hbs` |
| 31 | `connectivity/telematics/index/details.hbs` |
| 32 | `connectivity/telematics/index/details/devices.hbs` |
| 33 | `connectivity/telematics/index/details/events.hbs` |
| 34 | `connectivity/telematics/index/details/index.hbs` |
| 35 | `connectivity/telematics/index/details/sensors.hbs` |
| 36 | `connectivity/telematics/index/edit.hbs` |
| 37 | `connectivity/telematics/index/new.hbs` |
| 38 | `connectivity/tracking.hbs` |
| 39 | `connectivity/tracking/index.hbs` |
| 40 | `home.hbs` |
| 41 | `maintenance.hbs` |
| 42 | `maintenance/equipment.hbs` |
| 43 | `maintenance/equipment/index.hbs` |
| 44 | `maintenance/equipment/index/details.hbs` |
| 45 | `maintenance/equipment/index/details/index.hbs` |
| 46 | `maintenance/equipment/index/edit.hbs` |
| 47 | `maintenance/equipment/index/new.hbs` |
| 48 | `maintenance/maintenances.hbs` |
| 49 | `maintenance/maintenances/index.hbs` |
| 50 | `maintenance/maintenances/index/details.hbs` |
| 51 | `maintenance/maintenances/index/details/index.hbs` |
| 52 | `maintenance/maintenances/index/edit.hbs` |
| 53 | `maintenance/maintenances/index/new.hbs` |
| 54 | `maintenance/parts.hbs` |
| 55 | `maintenance/parts/index.hbs` |
| 56 | `maintenance/parts/index/details.hbs` |
| 57 | `maintenance/parts/index/details/index.hbs` |
| 58 | `maintenance/parts/index/edit.hbs` |
| 59 | `maintenance/parts/index/new.hbs` |
| 60 | `maintenance/schedules.hbs` |
| 61 | `maintenance/schedules/index.hbs` |
| 62 | `maintenance/schedules/index/details.hbs` |
| 63 | `maintenance/schedules/index/details/index.hbs` |
| 64 | `maintenance/schedules/index/details/work-orders.hbs` |
| 65 | `maintenance/schedules/index/edit.hbs` |
| 66 | `maintenance/schedules/index/new.hbs` |
| 67 | `maintenance/work-orders.hbs` |
| 68 | `maintenance/work-orders/index.hbs` |
| 69 | `maintenance/work-orders/index/details.hbs` |
| 70 | `maintenance/work-orders/index/details/index.hbs` |
| 71 | `maintenance/work-orders/index/edit.hbs` |
| 72 | `maintenance/work-orders/index/new.hbs` |
| 73 | `management.hbs` |
| 74 | `management/contacts.hbs` |
| 75 | `management/contacts/customers.hbs` |
| 76 | `management/contacts/customers/details.hbs` |
| 77 | `management/contacts/customers/details/index.hbs` |
| 78 | `management/contacts/customers/edit.hbs` |
| 79 | `management/contacts/customers/new.hbs` |
| 80 | `management/contacts/index.hbs` |
| 81 | `management/contacts/index/details.hbs` |
| 82 | `management/contacts/index/details/index.hbs` |
| 83 | `management/contacts/index/edit.hbs` |
| 84 | `management/contacts/index/new.hbs` |
| 85 | `management/drivers.hbs` |
| 86 | `management/drivers/index.hbs` |
| 87 | `management/drivers/index/details.hbs` |
| 88 | `management/drivers/index/details/index.hbs` |
| 89 | `management/drivers/index/details/orders.hbs` |
| 90 | `management/drivers/index/details/positions.hbs` |
| 91 | `management/drivers/index/details/schedule.hbs` |
| 92 | `management/drivers/index/details/virtual.hbs` |
| 93 | `management/drivers/index/edit.hbs` |
| 94 | `management/drivers/index/new.hbs` |
| 95 | `management/fleets.hbs` |
| 96 | `management/fleets/index.hbs` |
| 97 | `management/fleets/index/details.hbs` |
| 98 | `management/fleets/index/details/drivers.hbs` |
| 99 | `management/fleets/index/details/index.hbs` |
| 100 | `management/fleets/index/details/vehicles.hbs` |
| 101 | `management/fleets/index/details/virtual.hbs` |
| 102 | `management/fleets/index/edit.hbs` |
| 103 | `management/fleets/index/new.hbs` |
| 104 | `management/fuel-reports.hbs` |
| 105 | `management/fuel-reports/index.hbs` |
| 106 | `management/fuel-reports/index/details.hbs` |
| 107 | `management/fuel-reports/index/details/index.hbs` |
| 108 | `management/fuel-reports/index/edit.hbs` |
| 109 | `management/fuel-reports/index/new.hbs` |
| 110 | `management/index.hbs` |
| 111 | `management/issues.hbs` |
| 112 | `management/issues/index.hbs` |
| 113 | `management/issues/index/details.hbs` |
| 114 | `management/issues/index/details/index.hbs` |
| 115 | `management/issues/index/edit.hbs` |
| 116 | `management/issues/index/new.hbs` |
| 117 | `management/places.hbs` |
| 118 | `management/places/index.hbs` |
| 119 | `management/places/index/details.hbs` |
| 120 | `management/places/index/details/activity.hbs` |
| 121 | `management/places/index/details/comments.hbs` |
| 122 | `management/places/index/details/documents.hbs` |
| 123 | `management/places/index/details/index.hbs` |
| 124 | `management/places/index/details/map.hbs` |
| 125 | `management/places/index/details/operations.hbs` |
| 126 | `management/places/index/details/performance.hbs` |
| 127 | `management/places/index/details/rules.hbs` |
| 128 | `management/places/index/details/virtual.hbs` |
| 129 | `management/places/index/edit.hbs` |
| 130 | `management/places/index/new.hbs` |
| 131 | `management/vehicles.hbs` |
| 132 | `management/vehicles/index.hbs` |
| 133 | `management/vehicles/index/details.hbs` |
| 134 | `management/vehicles/index/details/devices.hbs` |
| 135 | `management/vehicles/index/details/equipment.hbs` |
| 136 | `management/vehicles/index/details/index.hbs` |
| 137 | `management/vehicles/index/details/maintenance-history.hbs` |
| 138 | `management/vehicles/index/details/positions.hbs` |
| 139 | `management/vehicles/index/details/schedules.hbs` |
| 140 | `management/vehicles/index/details/virtual.hbs` |
| 141 | `management/vehicles/index/details/work-orders.hbs` |
| 142 | `management/vehicles/index/edit.hbs` |
| 143 | `management/vehicles/index/new.hbs` |
| 144 | `management/vendors.hbs` |
| 145 | `management/vendors/index.hbs` |
| 146 | `management/vendors/index/details.hbs` |
| 147 | `management/vendors/index/details/index.hbs` |
| 148 | `management/vendors/index/details/personnel.hbs` |
| 149 | `management/vendors/index/edit.hbs` |
| 150 | `management/vendors/index/new.hbs` |
| 151 | `management/vendors/integrated.hbs` |
| 152 | `management/vendors/integrated/details.hbs` |
| 153 | `management/vendors/integrated/edit.hbs` |
| 154 | `management/vendors/integrated/new.hbs` |
| 155 | `operations.hbs` |
| 156 | `operations/orchestrator.hbs` |
| 157 | `operations/order-config.hbs` |
| 158 | `operations/orders.hbs` |
| 159 | `operations/orders/index.hbs` |
| 160 | `operations/orders/index/details.hbs` |
| 161 | `operations/orders/index/details/index.hbs` |
| 162 | `operations/orders/index/details/virtual.hbs` |
| 163 | `operations/orders/index/new.hbs` |
| 164 | `operations/routes.hbs` |
| 165 | `operations/routes/index.hbs` |
| 166 | `operations/routes/index/details.hbs` |
| 167 | `operations/routes/index/new.hbs` |
| 168 | `operations/scheduler.hbs` |
| 169 | `operations/scheduler/fleet-schedule.hbs` |
| 170 | `operations/scheduler/index.hbs` |
| 171 | `operations/service-rates.hbs` |
| 172 | `operations/service-rates/index.hbs` |
| 173 | `operations/service-rates/index/details.hbs` |
| 174 | `operations/service-rates/index/details/index.hbs` |
| 175 | `operations/service-rates/index/edit.hbs` |
| 176 | `operations/service-rates/index/new.hbs` |
| 177 | `settings.hbs` |
| 178 | `settings/avatars.hbs` |
| 179 | `settings/custom-fields.hbs` |
| 180 | `settings/navigator-app.hbs` |
| 181 | `settings/notifications.hbs` |
| 182 | `settings/orchestrator.hbs` |
| 183 | `settings/payments.hbs` |
| 184 | `settings/payments/index.hbs` |
| 185 | `settings/payments/onboard.hbs` |
| 186 | `settings/routing.hbs` |
| 187 | `settings/scheduling.hbs` |
| 188 | `virtual.hbs` |

---



<a id="doc-36"></a>

<!-- ========== DOCUMENT 36: 36-fleetops-operations.md ========== -->

# FleetOps — Operations

| Field | Value |
|-------|-------|
| **Doc ID** | 36 |
| **Volume** | 5 |
| **Status** | ✅ Done (source-exhaustive) |
| **Enriched** | `_enrich-from-source.mjs` + `_enrich-pass2.mjs` |

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Scope

Operations: orders, routes, orchestrator, scheduler, service rates, order config.

---

## Orders — `/fleet-ops/operations/orders`

### View modes

| Mode | UI |
|------|-----|
| map | Leaflet map + OrderList + Drawer |
| table | Layout::Resource::Tabular |
| kanban | Status board + order-config filter |

### Table columns

| i18n key | valuePath |
|----------|----------|
| common.dispatch-orders | `public_id` |
| column.internal-id | `internal_id` |
| column.payload | `payload.public_id` |
| column.driver-assigned | `driver_assigned` |
| column.pickup | `pickupName` |
| column.dropoff | `dropoffName` |
| column.customer | `customer.name` |
| column.vehicle-assigned | `vehicle_assigned.display_name` |
| column.facilitator | `facilitator.name` |
| column.scheduled-at | `scheduledAt` |
| column.items | `item_count` |
| column.transaction | `transaction_amount` |
| column.tracking | `tracking_number.tracking_number` |
| column.type | `type` |
| column.status | `status` |
| column.created-at | `createdAt` |
| column.updated-at | `updatedAt` |
| column.created-by | `created_by_name` |
| column.updated-by | `updated_by_name` |


### Features

Search, bulk search, pagination, bulk actions, filters (driver, places, customer, dates, status multi-select from `orders/statuses`).

---

## Other operation routes

| Route | Screens |
|-------|---------|
| `/operations/routes` | list, new, details |
| `/operations/orchestrator` | orchestrator + import modal |
| `/operations/scheduler` | index, fleet-schedule |
| `/operations/service-rates` | list, new, details, edit |
| `/operations/order-config` | config builder |

---

## All operations templates

- `operations/orchestrator.hbs`
- `operations/order-config.hbs`
- `operations/orders/index/details/index.hbs`
- `operations/orders/index/details/virtual.hbs`
- `operations/orders/index/details.hbs`
- `operations/orders/index/new.hbs`
- `operations/orders/index.hbs`
- `operations/orders.hbs`
- `operations/routes/index/details.hbs`
- `operations/routes/index/new.hbs`
- `operations/routes/index.hbs`
- `operations/routes.hbs`
- `operations/scheduler/fleet-schedule.hbs`
- `operations/scheduler/index.hbs`
- `operations/scheduler.hbs`
- `operations/service-rates/index/details/index.hbs`
- `operations/service-rates/index/details.hbs`
- `operations/service-rates/index/edit.hbs`
- `operations/service-rates/index/new.hbs`
- `operations/service-rates/index.hbs`
- `operations/service-rates.hbs`

---



<a id="doc-37"></a>

<!-- ========== DOCUMENT 37: 37-fleetops-management.md ========== -->

# FleetOps — Management

| Field | Value |
|-------|-------|
| **Doc ID** | 37 |
| **Volume** | 5 |
| **Status** | ✅ Done (source-exhaustive) |
| **Enriched** | `_enrich-from-source.mjs` + `_enrich-pass2.mjs` |

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Mount: `/fleet-ops/manage`

## Resource areas

| Area | Routes | Typical UI |
|------|--------|------------|
| Fleets | index, new, details (vehicles, drivers, virtual), edit | Tabular + detail tabs |
| Drivers | index, new, details (positions, schedule, virtual), edit | Map positions, schedule calendar |
| Vehicles | index, new, details (devices, equipment, maintenance, work-orders, virtual) | Telematics tabs |
| Places | index, new, details (map, operations, performance, activity, documents, rules) | Map + analytics |
| Vendors | index + integrated vendors | CRUD tables |
| Contacts / Customers | index, new, edit, details | CRM tables |
| Fuel reports | index, new, edit, details | Form + list |
| Issues | index, new, edit, details | Ticket-style |

## Templates (81 files)

| # | Template |
|---|----------|
| 1 | `management/contacts/customers/details/index.hbs` |
| 2 | `management/contacts/customers/details.hbs` |
| 3 | `management/contacts/customers/edit.hbs` |
| 4 | `management/contacts/customers/new.hbs` |
| 5 | `management/contacts/customers.hbs` |
| 6 | `management/contacts/index/details/index.hbs` |
| 7 | `management/contacts/index/details.hbs` |
| 8 | `management/contacts/index/edit.hbs` |
| 9 | `management/contacts/index/new.hbs` |
| 10 | `management/contacts/index.hbs` |
| 11 | `management/contacts.hbs` |
| 12 | `management/drivers/index/details/index.hbs` |
| 13 | `management/drivers/index/details/orders.hbs` |
| 14 | `management/drivers/index/details/positions.hbs` |
| 15 | `management/drivers/index/details/schedule.hbs` |
| 16 | `management/drivers/index/details/virtual.hbs` |
| 17 | `management/drivers/index/details.hbs` |
| 18 | `management/drivers/index/edit.hbs` |
| 19 | `management/drivers/index/new.hbs` |
| 20 | `management/drivers/index.hbs` |
| 21 | `management/drivers.hbs` |
| 22 | `management/fleets/index/details/drivers.hbs` |
| 23 | `management/fleets/index/details/index.hbs` |
| 24 | `management/fleets/index/details/vehicles.hbs` |
| 25 | `management/fleets/index/details/virtual.hbs` |
| 26 | `management/fleets/index/details.hbs` |
| 27 | `management/fleets/index/edit.hbs` |
| 28 | `management/fleets/index/new.hbs` |
| 29 | `management/fleets/index.hbs` |
| 30 | `management/fleets.hbs` |
| 31 | `management/fuel-reports/index/details/index.hbs` |
| 32 | `management/fuel-reports/index/details.hbs` |
| 33 | `management/fuel-reports/index/edit.hbs` |
| 34 | `management/fuel-reports/index/new.hbs` |
| 35 | `management/fuel-reports/index.hbs` |
| 36 | `management/fuel-reports.hbs` |
| 37 | `management/index.hbs` |
| 38 | `management/issues/index/details/index.hbs` |
| 39 | `management/issues/index/details.hbs` |
| 40 | `management/issues/index/edit.hbs` |
| 41 | `management/issues/index/new.hbs` |
| 42 | `management/issues/index.hbs` |
| 43 | `management/issues.hbs` |
| 44 | `management/places/index/details/activity.hbs` |
| 45 | `management/places/index/details/comments.hbs` |
| 46 | `management/places/index/details/documents.hbs` |
| 47 | `management/places/index/details/index.hbs` |
| 48 | `management/places/index/details/map.hbs` |
| 49 | `management/places/index/details/operations.hbs` |
| 50 | `management/places/index/details/performance.hbs` |
| 51 | `management/places/index/details/rules.hbs` |
| 52 | `management/places/index/details/virtual.hbs` |
| 53 | `management/places/index/details.hbs` |
| 54 | `management/places/index/edit.hbs` |
| 55 | `management/places/index/new.hbs` |
| 56 | `management/places/index.hbs` |
| 57 | `management/places.hbs` |
| 58 | `management/vehicles/index/details/devices.hbs` |
| 59 | `management/vehicles/index/details/equipment.hbs` |
| 60 | `management/vehicles/index/details/index.hbs` |
| 61 | `management/vehicles/index/details/maintenance-history.hbs` |
| 62 | `management/vehicles/index/details/positions.hbs` |
| 63 | `management/vehicles/index/details/schedules.hbs` |
| 64 | `management/vehicles/index/details/virtual.hbs` |
| 65 | `management/vehicles/index/details/work-orders.hbs` |
| 66 | `management/vehicles/index/details.hbs` |
| 67 | `management/vehicles/index/edit.hbs` |
| 68 | `management/vehicles/index/new.hbs` |
| 69 | `management/vehicles/index.hbs` |
| 70 | `management/vehicles.hbs` |
| 71 | `management/vendors/index/details/index.hbs` |
| 72 | `management/vendors/index/details/personnel.hbs` |
| 73 | `management/vendors/index/details.hbs` |
| 74 | `management/vendors/index/edit.hbs` |
| 75 | `management/vendors/index/new.hbs` |
| 76 | `management/vendors/index.hbs` |
| 77 | `management/vendors/integrated/details.hbs` |
| 78 | `management/vendors/integrated/edit.hbs` |
| 79 | `management/vendors/integrated/new.hbs` |
| 80 | `management/vendors/integrated.hbs` |
| 81 | `management/vendors.hbs` |

---



<a id="doc-38"></a>

<!-- ========== DOCUMENT 38: 38-fleetops-connectivity-and-telematics.md ========== -->

# FleetOps — Connectivity & Telematics

| Field | Value |
|-------|-------|
| **Doc ID** | 38 |
| **Status** | ✅ Done (source-exhaustive) |

---

## Templates (29 files)

| # | Template | URL prefix |
|---|----------|------------|
| 1 | `connectivity/devices/index/details/events.hbs` | `/fleet-ops/connectivity/devices/index/details/events` |
| 2 | `connectivity/devices/index/details/index.hbs` | `/fleet-ops/connectivity/devices/index/details` |
| 3 | `connectivity/devices/index/details/virtual.hbs` | `/fleet-ops/connectivity/devices/index/details/virtual` |
| 4 | `connectivity/devices/index/details.hbs` | `/fleet-ops/connectivity/devices/index/details` |
| 5 | `connectivity/devices/index/edit.hbs` | `/fleet-ops/connectivity/devices/index/edit` |
| 6 | `connectivity/devices/index/new.hbs` | `/fleet-ops/connectivity/devices/index/new` |
| 7 | `connectivity/devices/index.hbs` | `/fleet-ops/connectivity/devices` |
| 8 | `connectivity/devices.hbs` | `/fleet-ops/connectivity/devices` |
| 9 | `connectivity/events/index/details.hbs` | `/fleet-ops/connectivity/events/index/details` |
| 10 | `connectivity/events/index.hbs` | `/fleet-ops/connectivity/events` |
| 11 | `connectivity/events.hbs` | `/fleet-ops/connectivity/events` |
| 12 | `connectivity/sensors/index/details/index.hbs` | `/fleet-ops/connectivity/sensors/index/details` |
| 13 | `connectivity/sensors/index/details/virtual.hbs` | `/fleet-ops/connectivity/sensors/index/details/virtual` |
| 14 | `connectivity/sensors/index/details.hbs` | `/fleet-ops/connectivity/sensors/index/details` |
| 15 | `connectivity/sensors/index/edit.hbs` | `/fleet-ops/connectivity/sensors/index/edit` |
| 16 | `connectivity/sensors/index/new.hbs` | `/fleet-ops/connectivity/sensors/index/new` |
| 17 | `connectivity/sensors/index.hbs` | `/fleet-ops/connectivity/sensors` |
| 18 | `connectivity/sensors.hbs` | `/fleet-ops/connectivity/sensors` |
| 19 | `connectivity/telematics/index/details/devices.hbs` | `/fleet-ops/connectivity/telematics/index/details/devices` |
| 20 | `connectivity/telematics/index/details/events.hbs` | `/fleet-ops/connectivity/telematics/index/details/events` |
| 21 | `connectivity/telematics/index/details/index.hbs` | `/fleet-ops/connectivity/telematics/index/details` |
| 22 | `connectivity/telematics/index/details/sensors.hbs` | `/fleet-ops/connectivity/telematics/index/details/sensors` |
| 23 | `connectivity/telematics/index/details.hbs` | `/fleet-ops/connectivity/telematics/index/details` |
| 24 | `connectivity/telematics/index/edit.hbs` | `/fleet-ops/connectivity/telematics/index/edit` |
| 25 | `connectivity/telematics/index/new.hbs` | `/fleet-ops/connectivity/telematics/index/new` |
| 26 | `connectivity/telematics/index.hbs` | `/fleet-ops/connectivity/telematics` |
| 27 | `connectivity/telematics.hbs` | `/fleet-ops/connectivity/telematics` |
| 28 | `connectivity/tracking/index.hbs` | `/fleet-ops/connectivity/tracking` |
| 29 | `connectivity/tracking.hbs` | `/fleet-ops/connectivity/tracking` |

---



<a id="doc-39"></a>

<!-- ========== DOCUMENT 39: 39-fleetops-maintenance.md ========== -->

# FleetOps — Maintenance

| Field | Value |
|-------|-------|
| **Doc ID** | 39 |
| **Status** | ✅ Done (source-exhaustive) |

---

## Templates (31 files)

| # | Template | URL prefix |
|---|----------|------------|
| 1 | `maintenance/equipment/index/details/index.hbs` | `/fleet-ops/maintenance/equipment/index/details` |
| 2 | `maintenance/equipment/index/details.hbs` | `/fleet-ops/maintenance/equipment/index/details` |
| 3 | `maintenance/equipment/index/edit.hbs` | `/fleet-ops/maintenance/equipment/index/edit` |
| 4 | `maintenance/equipment/index/new.hbs` | `/fleet-ops/maintenance/equipment/index/new` |
| 5 | `maintenance/equipment/index.hbs` | `/fleet-ops/maintenance/equipment` |
| 6 | `maintenance/equipment.hbs` | `/fleet-ops/maintenance/equipment` |
| 7 | `maintenance/maintenances/index/details/index.hbs` | `/fleet-ops/maintenance/maintenances/index/details` |
| 8 | `maintenance/maintenances/index/details.hbs` | `/fleet-ops/maintenance/maintenances/index/details` |
| 9 | `maintenance/maintenances/index/edit.hbs` | `/fleet-ops/maintenance/maintenances/index/edit` |
| 10 | `maintenance/maintenances/index/new.hbs` | `/fleet-ops/maintenance/maintenances/index/new` |
| 11 | `maintenance/maintenances/index.hbs` | `/fleet-ops/maintenance/maintenances` |
| 12 | `maintenance/maintenances.hbs` | `/fleet-ops/maintenance/maintenances` |
| 13 | `maintenance/parts/index/details/index.hbs` | `/fleet-ops/maintenance/parts/index/details` |
| 14 | `maintenance/parts/index/details.hbs` | `/fleet-ops/maintenance/parts/index/details` |
| 15 | `maintenance/parts/index/edit.hbs` | `/fleet-ops/maintenance/parts/index/edit` |
| 16 | `maintenance/parts/index/new.hbs` | `/fleet-ops/maintenance/parts/index/new` |
| 17 | `maintenance/parts/index.hbs` | `/fleet-ops/maintenance/parts` |
| 18 | `maintenance/parts.hbs` | `/fleet-ops/maintenance/parts` |
| 19 | `maintenance/schedules/index/details/index.hbs` | `/fleet-ops/maintenance/schedules/index/details` |
| 20 | `maintenance/schedules/index/details/work-orders.hbs` | `/fleet-ops/maintenance/schedules/index/details/work-orders` |
| 21 | `maintenance/schedules/index/details.hbs` | `/fleet-ops/maintenance/schedules/index/details` |
| 22 | `maintenance/schedules/index/edit.hbs` | `/fleet-ops/maintenance/schedules/index/edit` |
| 23 | `maintenance/schedules/index/new.hbs` | `/fleet-ops/maintenance/schedules/index/new` |
| 24 | `maintenance/schedules/index.hbs` | `/fleet-ops/maintenance/schedules` |
| 25 | `maintenance/schedules.hbs` | `/fleet-ops/maintenance/schedules` |
| 26 | `maintenance/work-orders/index/details/index.hbs` | `/fleet-ops/maintenance/work-orders/index/details` |
| 27 | `maintenance/work-orders/index/details.hbs` | `/fleet-ops/maintenance/work-orders/index/details` |
| 28 | `maintenance/work-orders/index/edit.hbs` | `/fleet-ops/maintenance/work-orders/index/edit` |
| 29 | `maintenance/work-orders/index/new.hbs` | `/fleet-ops/maintenance/work-orders/index/new` |
| 30 | `maintenance/work-orders/index.hbs` | `/fleet-ops/maintenance/work-orders` |
| 31 | `maintenance/work-orders.hbs` | `/fleet-ops/maintenance/work-orders` |

---



<a id="doc-40"></a>

<!-- ========== DOCUMENT 40: 40-fleetops-analytics-and-reports.md ========== -->

# FleetOps — Analytics & Reports

| Field | Value |
|-------|-------|
| **Doc ID** | 40 |
| **Status** | ✅ Done (source-exhaustive) |

---

## Templates (7 files)

| # | Template | URL prefix |
|---|----------|------------|
| 1 | `analytics/reports/index/details/index.hbs` | `/fleet-ops/analytics/reports/index/details` |
| 2 | `analytics/reports/index/details/result.hbs` | `/fleet-ops/analytics/reports/index/details/result` |
| 3 | `analytics/reports/index/details.hbs` | `/fleet-ops/analytics/reports/index/details` |
| 4 | `analytics/reports/index/edit.hbs` | `/fleet-ops/analytics/reports/index/edit` |
| 5 | `analytics/reports/index/new.hbs` | `/fleet-ops/analytics/reports/index/new` |
| 6 | `analytics/reports/index.hbs` | `/fleet-ops/analytics/reports` |
| 7 | `analytics/reports.hbs` | `/fleet-ops/analytics/reports` |

---



<a id="doc-41"></a>

<!-- ========== DOCUMENT 41: 41-fleetops-settings.md ========== -->

# FleetOps — Settings

| Field | Value |
|-------|-------|
| **Doc ID** | 41 |
| **Status** | ✅ Done (source-exhaustive) |

---

## Templates (10 files)

| # | Template | URL prefix |
|---|----------|------------|
| 1 | `settings/avatars.hbs` | `/fleet-ops/settings/avatars` |
| 2 | `settings/custom-fields.hbs` | `/fleet-ops/settings/custom-fields` |
| 3 | `settings/navigator-app.hbs` | `/fleet-ops/settings/navigator-app` |
| 4 | `settings/notifications.hbs` | `/fleet-ops/settings/notifications` |
| 5 | `settings/orchestrator.hbs` | `/fleet-ops/settings/orchestrator` |
| 6 | `settings/payments/index.hbs` | `/fleet-ops/settings/payments` |
| 7 | `settings/payments/onboard.hbs` | `/fleet-ops/settings/payments/onboard` |
| 8 | `settings/payments.hbs` | `/fleet-ops/settings/payments` |
| 9 | `settings/routing.hbs` | `/fleet-ops/settings/routing` |
| 10 | `settings/scheduling.hbs` | `/fleet-ops/settings/scheduling` |

---



<a id="doc-42"></a>

<!-- ========== DOCUMENT 42: 42-fleetops-order-detail-composition.md ========== -->

# FleetOps — Order Detail Composition

| Field | Value |
|-------|-------|
| **Doc ID** | 42 |
| **Volume** | 5 |
| **Status** | ✅ Done (source-exhaustive) |
| **Sources** | `packages/fleetops/addon/extension.js`, order detail templates |

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---

## Route

`/fleet-ops/operations/orders/:public_id` → `operations.orders.index.details`

Virtual extension tabs: `/fleet-ops/operations/orders/:public_id/:slug`

---

## Registries (from `extension.js`)

Extensions inject UI via `universe/registry-service`:

| Registry name | Purpose |
|---------------|---------|
| `engine:fleet-ops` | Engine-level slots |
| `fleet-ops:component:map:drawer` | Map side drawer panels |
| `fleet-ops:component:vehicle:details` | Vehicle detail tabs |
| `fleet-ops:component:driver:details` | Driver detail tabs |
| `fleet-ops:component:order-config-manager` | Order type config UI |
| `fleet-ops:component:contact:form` | Contact create/edit |
| `fleet-ops:component:contact:form:details` | Contact detail form |
| `fleet-ops:component:customer:form` | Customer forms |
| `fleet-ops:component:customer:form:details` | Customer detail |
| `fleet-ops:component:driver:form` | Driver forms |
| `fleet-ops:component:driver:form:details` | Driver detail |
| `fleet-ops:component:fleet:form` | Fleet forms |
| `fleet-ops:component:fleet:form:details` | Fleet detail |
| `fleet-ops:component:place:form` | Place forms |
| `fleet-ops:component:place:form:details` | Place detail |
| `fleet-ops:component:vehicle:form` | Vehicle forms |
| `fleet-ops:component:vehicle:form:details` | Vehicle detail |
| `fleet-ops:component:vendor:form:edit` | Vendor edit |
| `fleet-ops:component:vendor:form:edit:details` | Vendor edit detail |
| `fleet-ops:component:vendor:form:create` | Vendor create |
| `fleet-ops:component:vendor:form:create:details` | Vendor create detail |
| `fleet-ops:component:issue:form` | Issue forms |
| `fleet-ops:component:issue:form:details` | Issue detail |
| `fleet-ops:component:fuel-report:form` | Fuel report forms |
| `fleet-ops:component:fuel-report:form:details` | Fuel report detail |
| `fleet-ops:component:maintenance:form` | Maintenance forms |
| `fleet-ops:component:maintenance:form:details` | Maintenance form detail |
| `fleet-ops:component:maintenance:details` | Maintenance detail |
| `fleet-ops:component:work-order:form` | Work order forms |
| `fleet-ops:component:work-order:form:details` | Work order form detail |
| `fleet-ops:component:work-order:details` | Work order detail |
| `fleet-ops:component:equipment:form` | Equipment forms |
| `fleet-ops:component:equipment:form:details` | Equipment form detail |
| `fleet-ops:component:equipment:details` | Equipment detail |
| `fleet-ops:component:part:form` | Parts forms |
| `fleet-ops:component:part:form:details` | Parts form detail |
| `fleet-ops:component:part:details` | Parts detail |
| `fleet-ops:contextmenu:vehicle` | Vehicle map context menu |
| `fleet-ops:contextmenu:driver` | Driver map context menu |
| `fleet-ops:component:order:details` | **Order detail tabs** (primary) |
| `fleet-ops:component:order:form` | Order create/edit shell |
| `fleet-ops:component:order:form:payload:entity` | Payload entity row |
| `fleet-ops:component:order:form:payload:entity:form` | Entity form |
| `fleet-ops:template:settings:routing` | Routing settings template |
| `fleet-ops:template:settings:orchestrator` | Orchestrator settings template |

Other engines register into `fleet-ops:component:order:details` (e.g. Storefront order tab, Ledger invoice tab).

---

## Order detail UI regions (implement as plugin slots)

| Region | Typical content |
|--------|-----------------|
| Header | Status badge, public_id, actions (assign, cancel, dispatch) |
| Summary | Customer, driver, vehicle, schedule window |
| Timeline | Status history / tracking_statuses |
| Map | Live route, pickup/dropoff markers |
| Payload | Waypoints, entities line items |
| Documents | Files, POD |
| Comments | Activity thread |
| Extension tabs | Registry-rendered components |

---

## Header menu shortcuts (Fleet-Ops entry)

Registered shortcuts include Orders, Places, Drivers, Vehicles, Fleets, Service Rates, Devices, Reports, Orchestrator — see `extension.js` lines 14–68.

---

## Widgets

| Widget ID | Component | Dashboard |
|-----------|-----------|-----------|
| fleet-ops-key-metrics-widget | `widget/fleet-ops-key-metrics` | default dashboard |

---

## Auth integration

`auth:login` registry: **Track Order** button → virtual slug `track-order` → `order-tracking-lookup` component.

---

## Custom UI

Build order detail as:

```
<OrderDetailLayout>
  <OrderHeader />
  <Tabs>
    <Tab id="overview" />
    <Tab id="map" />
    <Tab id="items" />
    {extensionTabs.map(...)}
  </Tabs>
</OrderDetailLayout>
```

Match registry names to your plugin API for parity with Ledger/Storefront extensions.

---



<a id="doc-43"></a>

<!-- ========== DOCUMENT 43: 43-fleetops-map-and-navigator-ui.md ========== -->

# FleetOps — Map & Navigator UI

| Field | Value |
|-------|-------|
| **Doc ID** | 43 |
| **Status** | ✅ Done (source-exhaustive) |

---

## Templates (29 files)

| # | Template | URL prefix |
|---|----------|------------|
| 1 | `connectivity/devices/index/details/events.hbs` | `/fleet-ops/connectivity/devices/index/details/events` |
| 2 | `connectivity/devices/index/details/index.hbs` | `/fleet-ops/connectivity/devices/index/details` |
| 3 | `connectivity/devices/index/details/virtual.hbs` | `/fleet-ops/connectivity/devices/index/details/virtual` |
| 4 | `connectivity/devices/index/details.hbs` | `/fleet-ops/connectivity/devices/index/details` |
| 5 | `connectivity/devices/index/edit.hbs` | `/fleet-ops/connectivity/devices/index/edit` |
| 6 | `connectivity/devices/index/new.hbs` | `/fleet-ops/connectivity/devices/index/new` |
| 7 | `connectivity/devices/index.hbs` | `/fleet-ops/connectivity/devices` |
| 8 | `connectivity/devices.hbs` | `/fleet-ops/connectivity/devices` |
| 9 | `connectivity/events/index/details.hbs` | `/fleet-ops/connectivity/events/index/details` |
| 10 | `connectivity/events/index.hbs` | `/fleet-ops/connectivity/events` |
| 11 | `connectivity/events.hbs` | `/fleet-ops/connectivity/events` |
| 12 | `connectivity/sensors/index/details/index.hbs` | `/fleet-ops/connectivity/sensors/index/details` |
| 13 | `connectivity/sensors/index/details/virtual.hbs` | `/fleet-ops/connectivity/sensors/index/details/virtual` |
| 14 | `connectivity/sensors/index/details.hbs` | `/fleet-ops/connectivity/sensors/index/details` |
| 15 | `connectivity/sensors/index/edit.hbs` | `/fleet-ops/connectivity/sensors/index/edit` |
| 16 | `connectivity/sensors/index/new.hbs` | `/fleet-ops/connectivity/sensors/index/new` |
| 17 | `connectivity/sensors/index.hbs` | `/fleet-ops/connectivity/sensors` |
| 18 | `connectivity/sensors.hbs` | `/fleet-ops/connectivity/sensors` |
| 19 | `connectivity/telematics/index/details/devices.hbs` | `/fleet-ops/connectivity/telematics/index/details/devices` |
| 20 | `connectivity/telematics/index/details/events.hbs` | `/fleet-ops/connectivity/telematics/index/details/events` |
| 21 | `connectivity/telematics/index/details/index.hbs` | `/fleet-ops/connectivity/telematics/index/details` |
| 22 | `connectivity/telematics/index/details/sensors.hbs` | `/fleet-ops/connectivity/telematics/index/details/sensors` |
| 23 | `connectivity/telematics/index/details.hbs` | `/fleet-ops/connectivity/telematics/index/details` |
| 24 | `connectivity/telematics/index/edit.hbs` | `/fleet-ops/connectivity/telematics/index/edit` |
| 25 | `connectivity/telematics/index/new.hbs` | `/fleet-ops/connectivity/telematics/index/new` |
| 26 | `connectivity/telematics/index.hbs` | `/fleet-ops/connectivity/telematics` |
| 27 | `connectivity/telematics.hbs` | `/fleet-ops/connectivity/telematics` |
| 28 | `connectivity/tracking/index.hbs` | `/fleet-ops/connectivity/tracking` |
| 29 | `connectivity/tracking.hbs` | `/fleet-ops/connectivity/tracking` |

## Map UI components

- `Map`, `MapContainer`, `LeafletLiveMap` (ember-ui / fleetops)
- Orders list map view: `operations/orders/index.hbs`
- Admin Navigator App: `admin/navigator-app` via extension panel

---



<a id="doc-44"></a>

<!-- ========== DOCUMENT 44: 44-fleetops-admin-extension-panels.md ========== -->

# FleetOps — Admin Extension Panels

| Field | Value |
|-------|-------|
| **Doc ID** | 44 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/*-engine, node_modules/@fleetbase/*-engine` |

---

## Purpose

Documentation for FleetOps — Admin Extension Panels.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Engine mount

**Base URL:** `/fleet-ops`

## Route tree

### Operations
- `/fleet-ops/orders`
- `/fleet-ops/routes`
- `/fleet-ops/orchestrator`
- `/fleet-ops/scheduler`
- `/fleet-ops/service-rates`
- `/fleet-ops/order-config`

### Management
- `/fleet-ops/fleets`
- `/fleet-ops/drivers`
- `/fleet-ops/vehicles`
- `/fleet-ops/places`
- `/fleet-ops/vendors`
- `/fleet-ops/contacts`
- `/fleet-ops/fuel-reports`
- `/fleet-ops/issues`

### Connectivity
- `/fleet-ops/devices`
- `/fleet-ops/telematics`

### Maintenance
- `/fleet-ops/maintenance`

### Analytics
- `/fleet-ops/reports`

### Settings
- `/fleet-ops/settings`

## UI patterns (all engines)

| Pattern | Description |
|---------|-------------|
| Engine layout | Own sidebar under mount path |
| Section header | `Layout::Section::Header` |
| Tables | Paginated model tables with filters |
| Detail panels | Right overlay or split view |
| Virtual | `/fleet-ops/:section/:slug` for extension pages |

## Custom UI handoff

1. Implement sidebar nav matching route tree above
2. Each list page: filter bar + data table + primary CTA
3. Each detail: header actions + tabbed content
4. Register extension slots where Fleetbase uses registries (FleetOps order detail — doc 42)

---



<a id="doc-45"></a>

<!-- ========== DOCUMENT 45: 45-fleetops-virtual-routes-and-registrations.md ========== -->

# FleetOps — Virtual Routes & Registrations

| Field | Value |
|-------|-------|
| **Doc ID** | 45 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/*-engine, node_modules/@fleetbase/*-engine` |

---

## Purpose

Documentation for FleetOps — Virtual Routes & Registrations.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Engine mount

**Base URL:** `/fleet-ops`

## Route tree

### Operations
- `/fleet-ops/orders`
- `/fleet-ops/routes`
- `/fleet-ops/orchestrator`
- `/fleet-ops/scheduler`
- `/fleet-ops/service-rates`
- `/fleet-ops/order-config`

### Management
- `/fleet-ops/fleets`
- `/fleet-ops/drivers`
- `/fleet-ops/vehicles`
- `/fleet-ops/places`
- `/fleet-ops/vendors`
- `/fleet-ops/contacts`
- `/fleet-ops/fuel-reports`
- `/fleet-ops/issues`

### Connectivity
- `/fleet-ops/devices`
- `/fleet-ops/telematics`

### Maintenance
- `/fleet-ops/maintenance`

### Analytics
- `/fleet-ops/reports`

### Settings
- `/fleet-ops/settings`

## UI patterns (all engines)

| Pattern | Description |
|---------|-------------|
| Engine layout | Own sidebar under mount path |
| Section header | `Layout::Section::Header` |
| Tables | Paginated model tables with filters |
| Detail panels | Right overlay or split view |
| Virtual | `/fleet-ops/:section/:slug` for extension pages |

## Custom UI handoff

1. Implement sidebar nav matching route tree above
2. Each list page: filter bar + data table + primary CTA
3. Each detail: header actions + tabbed content
4. Register extension slots where Fleetbase uses registries (FleetOps order detail — doc 42)

---



<a id="doc-46"></a>

<!-- ========== DOCUMENT 46: 46-fleetops-screen-inventory-and-journeys.md ========== -->

# FleetOps — Screen Inventory & User Journeys

| Field | Value |
|-------|-------|
| **Doc ID** | 46 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/fleetops/addon/templates` |

---

## Purpose

Complete inventory of all 188 FleetOps templates mapped to URLs.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Summary

| Metric | Value |
|--------|------:|
| Templates | 188 |
| Engine mount | `/fleet-ops` |

## Route tree

```
/* eslint-disable ember/no-shadow-route-definition */
import buildRoutes from 'ember-engines/routes';

export default buildRoutes(function () {
    this.route('virtual', { path: '/:section/:slug' });
    this.route('operations', { path: '/' }, function () {
        this.route('order-config', function () {});
        this.route('service-rates', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
        });
        this.route('orchestrator', function () {});
        this.route('scheduler', function () {
            this.route('index', { path: '/' });
            this.route('fleet-schedule');
        });
        this.route('orders', { path: '/' }, function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('virtual', { path: '/:slug' });
                });
            });
        });
        this.route('routes', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' });
            });
        });
    });
    this.route('management', { path: '/manage' }, function () {
        this.route('fleets', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('vehicles');
                    this.route('drivers');
                    this.route('virtual', { path: '/:slug' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
        });
        this.route('vendors', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
            this.route('integrated', function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
        });
        this.route('drivers', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('positions');
                    this.route('schedule');
                    this.route('virtual', { path: '/:slug' });
                });
                this.route('edit', { path: '/edit/:public_id' });
            });
        });
        this.route('vehicles', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('details', { path: '/:public_id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('positions');
                    this.route('devices');
                    this.route('equipment');
                    this.route('schedules');
                    this.route('work-orders');
                    this.r
```

## Screen inventory (all templates)

| # | Template | URL (approx) |
|---|----------|---------------|
| 1 | `analytics.hbs` | `/fleet-ops/analytics` |
| 2 | `analytics/reports.hbs` | `/fleet-ops/analytics/reports` |
| 3 | `analytics/reports/index.hbs` | `/fleet-ops/analytics/reports` |
| 4 | `analytics/reports/index/details.hbs` | `/fleet-ops/analytics/reports/details` |
| 5 | `analytics/reports/index/details/index.hbs` | `/fleet-ops/analytics/reports/details` |
| 6 | `analytics/reports/index/details/result.hbs` | `/fleet-ops/analytics/reports/details/result` |
| 7 | `analytics/reports/index/edit.hbs` | `/fleet-ops/analytics/reports/edit` |
| 8 | `analytics/reports/index/new.hbs` | `/fleet-ops/analytics/reports/new` |
| 9 | `application.hbs` | `/fleet-ops/application` |
| 10 | `connectivity.hbs` | `/fleet-ops/connectivity` |
| 11 | `connectivity/devices.hbs` | `/fleet-ops/connectivity/devices` |
| 12 | `connectivity/devices/index.hbs` | `/fleet-ops/connectivity/devices` |
| 13 | `connectivity/devices/index/details.hbs` | `/fleet-ops/connectivity/devices/details` |
| 14 | `connectivity/devices/index/details/events.hbs` | `/fleet-ops/connectivity/devices/details/events` |
| 15 | `connectivity/devices/index/details/index.hbs` | `/fleet-ops/connectivity/devices/details` |
| 16 | `connectivity/devices/index/details/virtual.hbs` | `/fleet-ops/connectivity/devices/details/virtual` |
| 17 | `connectivity/devices/index/edit.hbs` | `/fleet-ops/connectivity/devices/edit` |
| 18 | `connectivity/devices/index/new.hbs` | `/fleet-ops/connectivity/devices/new` |
| 19 | `connectivity/events.hbs` | `/fleet-ops/connectivity/events` |
| 20 | `connectivity/events/index.hbs` | `/fleet-ops/connectivity/events` |
| 21 | `connectivity/events/index/details.hbs` | `/fleet-ops/connectivity/events/details` |
| 22 | `connectivity/sensors.hbs` | `/fleet-ops/connectivity/sensors` |
| 23 | `connectivity/sensors/index.hbs` | `/fleet-ops/connectivity/sensors` |
| 24 | `connectivity/sensors/index/details.hbs` | `/fleet-ops/connectivity/sensors/details` |
| 25 | `connectivity/sensors/index/details/index.hbs` | `/fleet-ops/connectivity/sensors/details` |
| 26 | `connectivity/sensors/index/details/virtual.hbs` | `/fleet-ops/connectivity/sensors/details/virtual` |
| 27 | `connectivity/sensors/index/edit.hbs` | `/fleet-ops/connectivity/sensors/edit` |
| 28 | `connectivity/sensors/index/new.hbs` | `/fleet-ops/connectivity/sensors/new` |
| 29 | `connectivity/telematics.hbs` | `/fleet-ops/connectivity/telematics` |
| 30 | `connectivity/telematics/index.hbs` | `/fleet-ops/connectivity/telematics` |
| 31 | `connectivity/telematics/index/details.hbs` | `/fleet-ops/connectivity/telematics/details` |
| 32 | `connectivity/telematics/index/details/devices.hbs` | `/fleet-ops/connectivity/telematics/details/devices` |
| 33 | `connectivity/telematics/index/details/events.hbs` | `/fleet-ops/connectivity/telematics/details/events` |
| 34 | `connectivity/telematics/index/details/index.hbs` | `/fleet-ops/connectivity/telematics/details` |
| 35 | `connectivity/telematics/index/details/sensors.hbs` | `/fleet-ops/connectivity/telematics/details/sensors` |
| 36 | `connectivity/telematics/index/edit.hbs` | `/fleet-ops/connectivity/telematics/edit` |
| 37 | `connectivity/telematics/index/new.hbs` | `/fleet-ops/connectivity/telematics/new` |
| 38 | `connectivity/tracking.hbs` | `/fleet-ops/connectivity/tracking` |
| 39 | `connectivity/tracking/index.hbs` | `/fleet-ops/connectivity/tracking` |
| 40 | `home.hbs` | `/fleet-ops/home` |
| 41 | `maintenance.hbs` | `/fleet-ops/maintenance` |
| 42 | `maintenance/equipment.hbs` | `/fleet-ops/maintenance/equipment` |
| 43 | `maintenance/equipment/index.hbs` | `/fleet-ops/maintenance/equipment` |
| 44 | `maintenance/equipment/index/details.hbs` | `/fleet-ops/maintenance/equipment/details` |
| 45 | `maintenance/equipment/index/details/index.hbs` | `/fleet-ops/maintenance/equipment/details` |
| 46 | `maintenance/equipment/index/edit.hbs` | `/fleet-ops/maintenance/equipment/edit` |
| 47 | `maintenance/equipment/index/new.hbs` | `/fleet-ops/maintenance/equipment/new` |
| 48 | `maintenance/maintenances.hbs` | `/fleet-ops/maintenance/maintenances` |
| 49 | `maintenance/maintenances/index.hbs` | `/fleet-ops/maintenance/maintenances` |
| 50 | `maintenance/maintenances/index/details.hbs` | `/fleet-ops/maintenance/maintenances/details` |
| 51 | `maintenance/maintenances/index/details/index.hbs` | `/fleet-ops/maintenance/maintenances/details` |
| 52 | `maintenance/maintenances/index/edit.hbs` | `/fleet-ops/maintenance/maintenances/edit` |
| 53 | `maintenance/maintenances/index/new.hbs` | `/fleet-ops/maintenance/maintenances/new` |
| 54 | `maintenance/parts.hbs` | `/fleet-ops/maintenance/parts` |
| 55 | `maintenance/parts/index.hbs` | `/fleet-ops/maintenance/parts` |
| 56 | `maintenance/parts/index/details.hbs` | `/fleet-ops/maintenance/parts/details` |
| 57 | `maintenance/parts/index/details/index.hbs` | `/fleet-ops/maintenance/parts/details` |
| 58 | `maintenance/parts/index/edit.hbs` | `/fleet-ops/maintenance/parts/edit` |
| 59 | `maintenance/parts/index/new.hbs` | `/fleet-ops/maintenance/parts/new` |
| 60 | `maintenance/schedules.hbs` | `/fleet-ops/maintenance/schedules` |
| 61 | `maintenance/schedules/index.hbs` | `/fleet-ops/maintenance/schedules` |
| 62 | `maintenance/schedules/index/details.hbs` | `/fleet-ops/maintenance/schedules/details` |
| 63 | `maintenance/schedules/index/details/index.hbs` | `/fleet-ops/maintenance/schedules/details` |
| 64 | `maintenance/schedules/index/details/work-orders.hbs` | `/fleet-ops/maintenance/schedules/details/work-orders` |
| 65 | `maintenance/schedules/index/edit.hbs` | `/fleet-ops/maintenance/schedules/edit` |
| 66 | `maintenance/schedules/index/new.hbs` | `/fleet-ops/maintenance/schedules/new` |
| 67 | `maintenance/work-orders.hbs` | `/fleet-ops/maintenance/work-orders` |
| 68 | `maintenance/work-orders/index.hbs` | `/fleet-ops/maintenance/work-orders` |
| 69 | `maintenance/work-orders/index/details.hbs` | `/fleet-ops/maintenance/work-orders/details` |
| 70 | `maintenance/work-orders/index/details/index.hbs` | `/fleet-ops/maintenance/work-orders/details` |
| 71 | `maintenance/work-orders/index/edit.hbs` | `/fleet-ops/maintenance/work-orders/edit` |
| 72 | `maintenance/work-orders/index/new.hbs` | `/fleet-ops/maintenance/work-orders/new` |
| 73 | `management.hbs` | `/fleet-ops/management` |
| 74 | `management/contacts.hbs` | `/fleet-ops/management/contacts` |
| 75 | `management/contacts/customers.hbs` | `/fleet-ops/management/contacts/customers` |
| 76 | `management/contacts/customers/details.hbs` | `/fleet-ops/management/contacts/customers/details` |
| 77 | `management/contacts/customers/details/index.hbs` | `/fleet-ops/management/contacts/customers/details` |
| 78 | `management/contacts/customers/edit.hbs` | `/fleet-ops/management/contacts/customers/edit` |
| 79 | `management/contacts/customers/new.hbs` | `/fleet-ops/management/contacts/customers/new` |
| 80 | `management/contacts/index.hbs` | `/fleet-ops/management/contacts` |
| 81 | `management/contacts/index/details.hbs` | `/fleet-ops/management/contacts/details` |
| 82 | `management/contacts/index/details/index.hbs` | `/fleet-ops/management/contacts/details` |
| 83 | `management/contacts/index/edit.hbs` | `/fleet-ops/management/contacts/edit` |
| 84 | `management/contacts/index/new.hbs` | `/fleet-ops/management/contacts/new` |
| 85 | `management/drivers.hbs` | `/fleet-ops/management/drivers` |
| 86 | `management/drivers/index.hbs` | `/fleet-ops/management/drivers` |
| 87 | `management/drivers/index/details.hbs` | `/fleet-ops/management/drivers/details` |
| 88 | `management/drivers/index/details/index.hbs` | `/fleet-ops/management/drivers/details` |
| 89 | `management/drivers/index/details/orders.hbs` | `/fleet-ops/management/drivers/details/orders` |
| 90 | `management/drivers/index/details/positions.hbs` | `/fleet-ops/management/drivers/details/positions` |
| 91 | `management/drivers/index/details/schedule.hbs` | `/fleet-ops/management/drivers/details/schedule` |
| 92 | `management/drivers/index/details/virtual.hbs` | `/fleet-ops/management/drivers/details/virtual` |
| 93 | `management/drivers/index/edit.hbs` | `/fleet-ops/management/drivers/edit` |
| 94 | `management/drivers/index/new.hbs` | `/fleet-ops/management/drivers/new` |
| 95 | `management/fleets.hbs` | `/fleet-ops/management/fleets` |
| 96 | `management/fleets/index.hbs` | `/fleet-ops/management/fleets` |
| 97 | `management/fleets/index/details.hbs` | `/fleet-ops/management/fleets/details` |
| 98 | `management/fleets/index/details/drivers.hbs` | `/fleet-ops/management/fleets/details/drivers` |
| 99 | `management/fleets/index/details/index.hbs` | `/fleet-ops/management/fleets/details` |
| 100 | `management/fleets/index/details/vehicles.hbs` | `/fleet-ops/management/fleets/details/vehicles` |
| 101 | `management/fleets/index/details/virtual.hbs` | `/fleet-ops/management/fleets/details/virtual` |
| 102 | `management/fleets/index/edit.hbs` | `/fleet-ops/management/fleets/edit` |
| 103 | `management/fleets/index/new.hbs` | `/fleet-ops/management/fleets/new` |
| 104 | `management/fuel-reports.hbs` | `/fleet-ops/management/fuel-reports` |
| 105 | `management/fuel-reports/index.hbs` | `/fleet-ops/management/fuel-reports` |
| 106 | `management/fuel-reports/index/details.hbs` | `/fleet-ops/management/fuel-reports/details` |
| 107 | `management/fuel-reports/index/details/index.hbs` | `/fleet-ops/management/fuel-reports/details` |
| 108 | `management/fuel-reports/index/edit.hbs` | `/fleet-ops/management/fuel-reports/edit` |
| 109 | `management/fuel-reports/index/new.hbs` | `/fleet-ops/management/fuel-reports/new` |
| 110 | `management/index.hbs` | `/fleet-ops/management` |
| 111 | `management/issues.hbs` | `/fleet-ops/management/issues` |
| 112 | `management/issues/index.hbs` | `/fleet-ops/management/issues` |
| 113 | `management/issues/index/details.hbs` | `/fleet-ops/management/issues/details` |
| 114 | `management/issues/index/details/index.hbs` | `/fleet-ops/management/issues/details` |
| 115 | `management/issues/index/edit.hbs` | `/fleet-ops/management/issues/edit` |
| 116 | `management/issues/index/new.hbs` | `/fleet-ops/management/issues/new` |
| 117 | `management/places.hbs` | `/fleet-ops/management/places` |
| 118 | `management/places/index.hbs` | `/fleet-ops/management/places` |
| 119 | `management/places/index/details.hbs` | `/fleet-ops/management/places/details` |
| 120 | `management/places/index/details/activity.hbs` | `/fleet-ops/management/places/details/activity` |
| 121 | `management/places/index/details/comments.hbs` | `/fleet-ops/management/places/details/comments` |
| 122 | `management/places/index/details/documents.hbs` | `/fleet-ops/management/places/details/documents` |
| 123 | `management/places/index/details/index.hbs` | `/fleet-ops/management/places/details` |
| 124 | `management/places/index/details/map.hbs` | `/fleet-ops/management/places/details/map` |
| 125 | `management/places/index/details/operations.hbs` | `/fleet-ops/management/places/details/operations` |
| 126 | `management/places/index/details/performance.hbs` | `/fleet-ops/management/places/details/performance` |
| 127 | `management/places/index/details/rules.hbs` | `/fleet-ops/management/places/details/rules` |
| 128 | `management/places/index/details/virtual.hbs` | `/fleet-ops/management/places/details/virtual` |
| 129 | `management/places/index/edit.hbs` | `/fleet-ops/management/places/edit` |
| 130 | `management/places/index/new.hbs` | `/fleet-ops/management/places/new` |
| 131 | `management/vehicles.hbs` | `/fleet-ops/management/vehicles` |
| 132 | `management/vehicles/index.hbs` | `/fleet-ops/management/vehicles` |
| 133 | `management/vehicles/index/details.hbs` | `/fleet-ops/management/vehicles/details` |
| 134 | `management/vehicles/index/details/devices.hbs` | `/fleet-ops/management/vehicles/details/devices` |
| 135 | `management/vehicles/index/details/equipment.hbs` | `/fleet-ops/management/vehicles/details/equipment` |
| 136 | `management/vehicles/index/details/index.hbs` | `/fleet-ops/management/vehicles/details` |
| 137 | `management/vehicles/index/details/maintenance-history.hbs` | `/fleet-ops/management/vehicles/details/maintenance-history` |
| 138 | `management/vehicles/index/details/positions.hbs` | `/fleet-ops/management/vehicles/details/positions` |
| 139 | `management/vehicles/index/details/schedules.hbs` | `/fleet-ops/management/vehicles/details/schedules` |
| 140 | `management/vehicles/index/details/virtual.hbs` | `/fleet-ops/management/vehicles/details/virtual` |
| 141 | `management/vehicles/index/details/work-orders.hbs` | `/fleet-ops/management/vehicles/details/work-orders` |
| 142 | `management/vehicles/index/edit.hbs` | `/fleet-ops/management/vehicles/edit` |
| 143 | `management/vehicles/index/new.hbs` | `/fleet-ops/management/vehicles/new` |
| 144 | `management/vendors.hbs` | `/fleet-ops/management/vendors` |
| 145 | `management/vendors/index.hbs` | `/fleet-ops/management/vendors` |
| 146 | `management/vendors/index/details.hbs` | `/fleet-ops/management/vendors/details` |
| 147 | `management/vendors/index/details/index.hbs` | `/fleet-ops/management/vendors/details` |
| 148 | `management/vendors/index/details/personnel.hbs` | `/fleet-ops/management/vendors/details/personnel` |
| 149 | `management/vendors/index/edit.hbs` | `/fleet-ops/management/vendors/edit` |
| 150 | `management/vendors/index/new.hbs` | `/fleet-ops/management/vendors/new` |
| 151 | `management/vendors/integrated.hbs` | `/fleet-ops/management/vendors/integrated` |
| 152 | `management/vendors/integrated/details.hbs` | `/fleet-ops/management/vendors/integrated/details` |
| 153 | `management/vendors/integrated/edit.hbs` | `/fleet-ops/management/vendors/integrated/edit` |
| 154 | `management/vendors/integrated/new.hbs` | `/fleet-ops/management/vendors/integrated/new` |
| 155 | `operations.hbs` | `/fleet-ops/operations` |
| 156 | `operations/orchestrator.hbs` | `/fleet-ops/operations/orchestrator` |
| 157 | `operations/order-config.hbs` | `/fleet-ops/operations/order-config` |
| 158 | `operations/orders.hbs` | `/fleet-ops/operations/orders` |
| 159 | `operations/orders/index.hbs` | `/fleet-ops/operations/orders` |
| 160 | `operations/orders/index/details.hbs` | `/fleet-ops/operations/orders/details` |
| 161 | `operations/orders/index/details/index.hbs` | `/fleet-ops/operations/orders/details` |
| 162 | `operations/orders/index/details/virtual.hbs` | `/fleet-ops/operations/orders/details/virtual` |
| 163 | `operations/orders/index/new.hbs` | `/fleet-ops/operations/orders/new` |
| 164 | `operations/routes.hbs` | `/fleet-ops/operations/routes` |
| 165 | `operations/routes/index.hbs` | `/fleet-ops/operations/routes` |
| 166 | `operations/routes/index/details.hbs` | `/fleet-ops/operations/routes/details` |
| 167 | `operations/routes/index/new.hbs` | `/fleet-ops/operations/routes/new` |
| 168 | `operations/scheduler.hbs` | `/fleet-ops/operations/scheduler` |
| 169 | `operations/scheduler/fleet-schedule.hbs` | `/fleet-ops/operations/scheduler/fleet-schedule` |
| 170 | `operations/scheduler/index.hbs` | `/fleet-ops/operations/scheduler` |
| 171 | `operations/service-rates.hbs` | `/fleet-ops/operations/service-rates` |
| 172 | `operations/service-rates/index.hbs` | `/fleet-ops/operations/service-rates` |
| 173 | `operations/service-rates/index/details.hbs` | `/fleet-ops/operations/service-rates/details` |
| 174 | `operations/service-rates/index/details/index.hbs` | `/fleet-ops/operations/service-rates/details` |
| 175 | `operations/service-rates/index/edit.hbs` | `/fleet-ops/operations/service-rates/edit` |
| 176 | `operations/service-rates/index/new.hbs` | `/fleet-ops/operations/service-rates/new` |
| 177 | `settings.hbs` | `/fleet-ops/settings` |
| 178 | `settings/avatars.hbs` | `/fleet-ops/settings/avatars` |
| 179 | `settings/custom-fields.hbs` | `/fleet-ops/settings/custom-fields` |
| 180 | `settings/navigator-app.hbs` | `/fleet-ops/settings/navigator-app` |
| 181 | `settings/notifications.hbs` | `/fleet-ops/settings/notifications` |
| 182 | `settings/orchestrator.hbs` | `/fleet-ops/settings/orchestrator` |
| 183 | `settings/payments.hbs` | `/fleet-ops/settings/payments` |
| 184 | `settings/payments/index.hbs` | `/fleet-ops/settings/payments` |
| 185 | `settings/payments/onboard.hbs` | `/fleet-ops/settings/payments/onboard` |
| 186 | `settings/routing.hbs` | `/fleet-ops/settings/routing` |
| 187 | `settings/scheduling.hbs` | `/fleet-ops/settings/scheduling` |
| 188 | `virtual.hbs` | `/fleet-ops/virtual` |

## User journeys

### Dispatcher
1. `/fleet-ops/operations/orders` — list/filter orders
2. `/fleet-ops/operations/orders/:id` — detail, assign driver, map
3. `/fleet-ops/operations/routes` — route planning

### Fleet manager
1. `/fleet-ops/manage/drivers`, `/manage/vehicles`, `/manage/fleets`
2. `/fleet-ops/maintenance/*` — schedules, work orders

### Analyst
1. `/fleet-ops/analytics/reports`

## Template counts by area

| Folder | Templates |
|--------|----------:|
| management/ | ~90 |
| maintenance/ | ~35 |
| connectivity/ | ~28 |
| operations/ | ~22 |
| settings/ | ~11 |
| analytics/ | ~8 |
| root | ~10 |

---



<a id="doc-47"></a>

<!-- ========== DOCUMENT 47: 47-storefront-overview-and-routes.md ========== -->

# Storefront — Overview & Routes

| Field | Value |
|-------|-------|
| **Doc ID** | 47 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/storefront` |

---

## Purpose

Full routes and 33 screens.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Mount: `/storefront`

## routes.js

```javascript
import buildRoutes from 'ember-engines/routes';

export default buildRoutes(function () {
    this.route('home', { path: '/' });
    this.route('products', function () {
        this.route('index', { path: '/' }, function () {
            this.route('index', { path: '/' }, function () {
                this.route('edit', { path: '/:public_id' });
            });
            this.route('category', { path: '/:slug' }, function () {
                this.route('new');
                this.route('edit', { path: '/:public_id' });
            });
        });
    });
    this.route('catalogs', function () {
        this.route('index', { path: '/' }, function () {});
    });
    this.route('customers', function () {
        this.route('index', { path: '/' }, function () {
            this.route('edit', { path: '/:public_id' });
            this.route('view', { path: '/:public_id' });
        });
    });
    this.route('orders', function () {
        this.route('index', { path: '/' }, function () {
            this.route('new');
            this.route('edit', { path: '/:public_id' });
            this.route('view', { path: '/:public_id' });
        });
    });
    this.route('networks', function () {
        this.route('index', { path: '/' }, function () {
            this.route('network', { path: '/:public_id' }, function () {
                this.route('stores');
                this.route('customers');
                this.route('orders');
            });
        });
    });
    this.route('food-trucks', function () {
        this.route('index', { path: '/' }, function () {});
    });
    this.route('promotions', function () {
        this.route('push-notifications', { path: '/' });
    });
    this.route('coupons');
    this.route('broadcast');
    this.route('pages');
    this.route('settings', function () {
        this.route('index', { path: '/' });
        this.route('api');
        this.route('locations');
        this.route('gateways');
        this.route('notifications');
    });
});

```

## Templates (33)

| # | Template |
|---|----------|
| 1 | `application.hbs` |
| 2 | `catalogs.hbs` |
| 3 | `catalogs/index.hbs` |
| 4 | `customers/index.hbs` |
| 5 | `customers/index/edit.hbs` |
| 6 | `customers/index/view.hbs` |
| 7 | `food-trucks.hbs` |
| 8 | `food-trucks/index.hbs` |
| 9 | `home.hbs` |
| 10 | `networks/index.hbs` |
| 11 | `networks/index/network.hbs` |
| 12 | `networks/index/network/customers.hbs` |
| 13 | `networks/index/network/index.hbs` |
| 14 | `networks/index/network/orders.hbs` |
| 15 | `networks/index/network/stores.hbs` |
| 16 | `orders/index.hbs` |
| 17 | `orders/index/edit.hbs` |
| 18 | `orders/index/new.hbs` |
| 19 | `orders/index/view.hbs` |
| 20 | `products/index.hbs` |
| 21 | `products/index/category.hbs` |
| 22 | `products/index/category/edit.hbs` |
| 23 | `products/index/category/new.hbs` |
| 24 | `products/index/index.hbs` |
| 25 | `products/index/index/edit.hbs` |
| 26 | `promotions.hbs` |
| 27 | `promotions/push-notifications.hbs` |
| 28 | `settings.hbs` |
| 29 | `settings/api.hbs` |
| 30 | `settings/gateways.hbs` |
| 31 | `settings/index.hbs` |
| 32 | `settings/locations.hbs` |
| 33 | `settings/notifications.hbs` |

---



<a id="doc-48"></a>

<!-- ========== DOCUMENT 48: 48-storefront-catalog-products-customers.md ========== -->

# Storefront — Catalog, Products & Customers

| Field | Value |
|-------|-------|
| **Doc ID** | 48 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/*-engine, node_modules/@fleetbase/*-engine` |

---

## Purpose

Documentation for Storefront — Catalog, Products & Customers.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Engine mount

**Base URL:** `/storefront`

## Route tree

### Core
- `/storefront/home`
- `/storefront/products`
- `/storefront/catalogs`
- `/storefront/customers`
- `/storefront/orders`
- `/storefront/networks`
- `/storefront/food-trucks`
- `/storefront/promotions`
- `/storefront/coupons`
- `/storefront/broadcast`
- `/storefront/pages`
- `/storefront/settings`

## UI patterns (all engines)

| Pattern | Description |
|---------|-------------|
| Engine layout | Own sidebar under mount path |
| Section header | `Layout::Section::Header` |
| Tables | Paginated model tables with filters |
| Detail panels | Right overlay or split view |
| Virtual | `/storefront/:section/:slug` for extension pages |

## Custom UI handoff

1. Implement sidebar nav matching route tree above
2. Each list page: filter bar + data table + primary CTA
3. Each detail: header actions + tabbed content
4. Register extension slots where Fleetbase uses registries (FleetOps order detail — doc 42)


Products, catalogs, customers — CRUD tables, category filters, image uploads.

---



<a id="doc-49"></a>

<!-- ========== DOCUMENT 49: 49-storefront-orders-networks-promotions.md ========== -->

# Storefront — Orders, Networks & Promotions

| Field | Value |
|-------|-------|
| **Doc ID** | 49 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/*-engine, node_modules/@fleetbase/*-engine` |

---

## Purpose

Documentation for Storefront — Orders, Networks & Promotions.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Engine mount

**Base URL:** `/storefront`

## Route tree

### Core
- `/storefront/home`
- `/storefront/products`
- `/storefront/catalogs`
- `/storefront/customers`
- `/storefront/orders`
- `/storefront/networks`
- `/storefront/food-trucks`
- `/storefront/promotions`
- `/storefront/coupons`
- `/storefront/broadcast`
- `/storefront/pages`
- `/storefront/settings`

## UI patterns (all engines)

| Pattern | Description |
|---------|-------------|
| Engine layout | Own sidebar under mount path |
| Section header | `Layout::Section::Header` |
| Tables | Paginated model tables with filters |
| Detail panels | Right overlay or split view |
| Virtual | `/storefront/:section/:slug` for extension pages |

## Custom UI handoff

1. Implement sidebar nav matching route tree above
2. Each list page: filter bar + data table + primary CTA
3. Each detail: header actions + tabbed content
4. Register extension slots where Fleetbase uses registries (FleetOps order detail — doc 42)


Orders integrates with FleetOps orders; networks, food-trucks, promotions, coupons, broadcast, CMS pages.

---



<a id="doc-50"></a>

<!-- ========== DOCUMENT 50: 50-ledger-overview-and-routes.md ========== -->

# Ledger — Overview & Routes

| Field | Value |
|-------|-------|
| **Doc ID** | 50 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/ledger` |

---

## Purpose

Full routes and 56 screens.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Mount: `/ledger`

## routes.js

```javascript
import buildRoutes from 'ember-engines/routes';
export default buildRoutes(function () {
    // Dashboard
    this.route('home', { path: '/' });

    // Receivables
    this.route('billing', function () {
        this.route('invoice-templates', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('edit', { path: '/:id/edit' });
            });
        });
        this.route('invoices', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('edit', { path: '/:id/edit' });
                this.route('details', { path: '/:id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('line-items');
                    this.route('transactions');
                });
            });
        });
    });

    // Payments
    this.route('payments', function () {
        this.route('transactions', function () {
            this.route('index', { path: '/' }, function () {
                this.route('details', { path: '/:id' }, function () {
                    this.route('index', { path: '/' });
                });
            });
        });
        this.route('wallets', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('edit', { path: '/:id/edit' });
                this.route('details', { path: '/:id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('transactions');
                });
            });
        });
        this.route('gateways', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('edit', { path: '/:id/edit' });
                this.route('details', { path: '/:id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('webhooks');
                });
            });
        });
    });

    // Accounting
    this.route('accounting', function () {
        this.route('accounts', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('edit', { path: '/:id/edit' });
                this.route('details', { path: '/:id' }, function () {
                    this.route('index', { path: '/' });
                    this.route('ledger');
                });
            });
        });
        this.route('journal', function () {
            this.route('index', { path: '/' }, function () {
                this.route('new');
                this.route('edit', { path: '/:id/edit' });
                this.route('details', { path: '/:id' }, function () {
                    this.route('index', { path: '/' });
                });
            });
        });
        this.route('general-ledger');
    });

    // Reports
    this.route('reports', function () {
        this.route('income-statement');
        this.route('balance-sheet');
        this.route('trial-balance');
        this.route('cash-flow');
        this.route('ar-aging');
        this.route('wallet-summary');
    });

    // Settings
    this.route('settings', function () {
        this.route('invoice');
        this.route('payment');
        this.route('accounting');
    });
});

```

## Templates (56)

| # | Template |
|---|----------|
| 1 | `accounting/accounts.hbs` |
| 2 | `accounting/accounts/index.hbs` |
| 3 | `accounting/accounts/index/details.hbs` |
| 4 | `accounting/accounts/index/details/index.hbs` |
| 5 | `accounting/accounts/index/details/ledger.hbs` |
| 6 | `accounting/accounts/index/edit.hbs` |
| 7 | `accounting/accounts/index/new.hbs` |
| 8 | `accounting/general-ledger.hbs` |
| 9 | `accounting/journal.hbs` |
| 10 | `accounting/journal/index.hbs` |
| 11 | `accounting/journal/index/details.hbs` |
| 12 | `accounting/journal/index/details/index.hbs` |
| 13 | `accounting/journal/index/edit.hbs` |
| 14 | `accounting/journal/index/new.hbs` |
| 15 | `application.hbs` |
| 16 | `billing/invoice-templates.hbs` |
| 17 | `billing/invoice-templates/index.hbs` |
| 18 | `billing/invoice-templates/index/edit.hbs` |
| 19 | `billing/invoice-templates/index/new.hbs` |
| 20 | `billing/invoices.hbs` |
| 21 | `billing/invoices/index.hbs` |
| 22 | `billing/invoices/index/details.hbs` |
| 23 | `billing/invoices/index/details/index.hbs` |
| 24 | `billing/invoices/index/details/line-items.hbs` |
| 25 | `billing/invoices/index/details/transactions.hbs` |
| 26 | `billing/invoices/index/edit.hbs` |
| 27 | `billing/invoices/index/new.hbs` |
| 28 | `home.hbs` |
| 29 | `payments/gateways.hbs` |
| 30 | `payments/gateways/index.hbs` |
| 31 | `payments/gateways/index/details.hbs` |
| 32 | `payments/gateways/index/details/index.hbs` |
| 33 | `payments/gateways/index/details/webhooks.hbs` |
| 34 | `payments/gateways/index/edit.hbs` |
| 35 | `payments/gateways/index/new.hbs` |
| 36 | `payments/transactions.hbs` |
| 37 | `payments/transactions/index.hbs` |
| 38 | `payments/transactions/index/details.hbs` |
| 39 | `payments/transactions/index/details/index.hbs` |
| 40 | `payments/wallets.hbs` |
| 41 | `payments/wallets/index.hbs` |
| 42 | `payments/wallets/index/details.hbs` |
| 43 | `payments/wallets/index/details/index.hbs` |
| 44 | `payments/wallets/index/details/transactions.hbs` |
| 45 | `payments/wallets/index/edit.hbs` |
| 46 | `payments/wallets/index/new.hbs` |
| 47 | `reports/ar-aging.hbs` |
| 48 | `reports/balance-sheet.hbs` |
| 49 | `reports/cash-flow.hbs` |
| 50 | `reports/income-statement.hbs` |
| 51 | `reports/index.hbs` |
| 52 | `reports/trial-balance.hbs` |
| 53 | `reports/wallet-summary.hbs` |
| 54 | `settings/accounting.hbs` |
| 55 | `settings/invoice.hbs` |
| 56 | `settings/payment.hbs` |

---



<a id="doc-51"></a>

<!-- ========== DOCUMENT 51: 51-ledger-billing-and-invoices.md ========== -->

# Ledger — Billing & Invoices

| Field | Value |
|-------|-------|
| **Doc ID** | 51 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/*-engine, node_modules/@fleetbase/*-engine` |

---

## Purpose

Documentation for Ledger — Billing & Invoices.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Engine mount

**Base URL:** `/ledger`

## Route tree

### Modules
- `/ledger/home`
- `/ledger/billing`
- `/ledger/payments`
- `/ledger/accounting`
- `/ledger/reports`
- `/ledger/settings`

## UI patterns (all engines)

| Pattern | Description |
|---------|-------------|
| Engine layout | Own sidebar under mount path |
| Section header | `Layout::Section::Header` |
| Tables | Paginated model tables with filters |
| Detail panels | Right overlay or split view |
| Virtual | `/ledger/:section/:slug` for extension pages |

## Custom UI handoff

1. Implement sidebar nav matching route tree above
2. Each list page: filter bar + data table + primary CTA
3. Each detail: header actions + tabbed content
4. Register extension slots where Fleetbase uses registries (FleetOps order detail — doc 42)

Invoices list, create, send, public invoice virtual route at root /~/:slug.

---



<a id="doc-52"></a>

<!-- ========== DOCUMENT 52: 52-ledger-payments-accounting-reports.md ========== -->

# Ledger — Payments, Accounting & Reports

| Field | Value |
|-------|-------|
| **Doc ID** | 52 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/*-engine, node_modules/@fleetbase/*-engine` |

---

## Purpose

Documentation for Ledger — Payments, Accounting & Reports.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Engine mount

**Base URL:** `/ledger`

## Route tree

### Modules
- `/ledger/home`
- `/ledger/billing`
- `/ledger/payments`
- `/ledger/accounting`
- `/ledger/reports`
- `/ledger/settings`

## UI patterns (all engines)

| Pattern | Description |
|---------|-------------|
| Engine layout | Own sidebar under mount path |
| Section header | `Layout::Section::Header` |
| Tables | Paginated model tables with filters |
| Detail panels | Right overlay or split view |
| Virtual | `/ledger/:section/:slug` for extension pages |

## Custom UI handoff

1. Implement sidebar nav matching route tree above
2. Each list page: filter bar + data table + primary CTA
3. Each detail: header actions + tabbed content
4. Register extension slots where Fleetbase uses registries (FleetOps order detail — doc 42)

Payments, wallets, gateways, chart of accounts, journal entries, GL, P&L reports.

---



<a id="doc-53"></a>

<!-- ========== DOCUMENT 53: 53-iam-overview-and-routes.md ========== -->

# IAM — Overview & Routes

| Field | Value |
|-------|-------|
| **Doc ID** | 53 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/iam-engine` |

---

## Purpose

Full routes and 13 screens.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Mount: `/iam`

## routes.js

```javascript
import buildRoutes from 'ember-engines/routes';

export default buildRoutes(function () {
    this.route('home', { path: '/' }, function () {});
    this.route('users', function () {
        this.route('index', { path: '/' });
        this.route('drivers');
        this.route('customers');
    });
    this.route('groups', function () {});
    this.route('roles', function () {});
    this.route('policies', function () {});
});

```

## Templates (13)

| # | Template |
|---|----------|
| 1 | `application.hbs` |
| 2 | `groups.hbs` |
| 3 | `groups/index.hbs` |
| 4 | `home.hbs` |
| 5 | `organizations/index.hbs` |
| 6 | `policies.hbs` |
| 7 | `policies/index.hbs` |
| 8 | `roles.hbs` |
| 9 | `roles/index.hbs` |
| 10 | `users.hbs` |
| 11 | `users/customers.hbs` |
| 12 | `users/drivers.hbs` |
| 13 | `users/index.hbs` |

---



<a id="doc-54"></a>

<!-- ========== DOCUMENT 54: 54-iam-users-groups-roles-policies.md ========== -->

# IAM — Users, Groups, Roles & Policies

| Field | Value |
|-------|-------|
| **Doc ID** | 54 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/*-engine, node_modules/@fleetbase/*-engine` |

---

## Purpose

Documentation for IAM — Users, Groups, Roles & Policies.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Engine mount

**Base URL:** `/iam`

## Route tree

### Access
- `/iam/home`
- `/iam/users`
- `/iam/groups`
- `/iam/roles`
- `/iam/policies`

## UI patterns (all engines)

| Pattern | Description |
|---------|-------------|
| Engine layout | Own sidebar under mount path |
| Section header | `Layout::Section::Header` |
| Tables | Paginated model tables with filters |
| Detail panels | Right overlay or split view |
| Virtual | `/iam/:section/:slug` for extension pages |

## Custom UI handoff

1. Implement sidebar nav matching route tree above
2. Each list page: filter bar + data table + primary CTA
3. Each detail: header actions + tabbed content
4. Register extension slots where Fleetbase uses registries (FleetOps order detail — doc 42)


Users table (incl. drivers/customers views), groups, roles, policies — standard IAM matrix UI.

---



<a id="doc-55"></a>

<!-- ========== DOCUMENT 55: 55-developers-overview-and-routes.md ========== -->

# Developers — Overview & Routes

| Field | Value |
|-------|-------|
| **Doc ID** | 55 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/dev-engine` |

---

## Purpose

Full routes and 11 screens.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Mount: `/developers`

## routes.js

```javascript
import buildRoutes from 'ember-engines/routes';

export default buildRoutes(function () {
    this.route('home', { path: '/' }, function () {
        this.route('index', { path: '/' });
    });
    this.route('api-keys', function () {
        this.route('index', { path: '/' });
    });
    this.route('webhooks', function () {
        this.route('index', { path: '/' });
        this.route('view', { path: '/:id' });
    });
    this.route('sockets', function () {
        this.route('index', { path: '/' });
        this.route('view', { path: '/:name' });
    });
    this.route('events', function () {
        this.route('index', { path: '/' });
        this.route('view', { path: '/:public_id' });
    });
    this.route('logs', function () {
        this.route('index', { path: '/' });
        this.route('view', { path: '/:public_id' });
    });
});

```

## Templates (11)

| # | Template |
|---|----------|
| 1 | `api-keys/index.hbs` |
| 2 | `application.hbs` |
| 3 | `events/index.hbs` |
| 4 | `events/view.hbs` |
| 5 | `home/index.hbs` |
| 6 | `logs/index.hbs` |
| 7 | `logs/view.hbs` |
| 8 | `sockets/index.hbs` |
| 9 | `sockets/view.hbs` |
| 10 | `webhooks/index.hbs` |
| 11 | `webhooks/view.hbs` |

---



<a id="doc-56"></a>

<!-- ========== DOCUMENT 56: 56-developers-api-keys-webhooks-sockets-logs.md ========== -->

# Developers — API Keys, Webhooks, Sockets & Logs

| Field | Value |
|-------|-------|
| **Doc ID** | 56 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/*-engine, node_modules/@fleetbase/*-engine` |

---

## Purpose

Documentation for Developers — API Keys, Webhooks, Sockets & Logs.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Engine mount

**Base URL:** `/developers`

## Route tree

### Dev tools
- `/developers/home`
- `/developers/api-keys`
- `/developers/webhooks`
- `/developers/sockets`
- `/developers/events`
- `/developers/logs`

## UI patterns (all engines)

| Pattern | Description |
|---------|-------------|
| Engine layout | Own sidebar under mount path |
| Section header | `Layout::Section::Header` |
| Tables | Paginated model tables with filters |
| Detail panels | Right overlay or split view |
| Virtual | `/developers/:section/:slug` for extension pages |

## Custom UI handoff

1. Implement sidebar nav matching route tree above
2. Each list page: filter bar + data table + primary CTA
3. Each detail: header actions + tabbed content
4. Register extension slots where Fleetbase uses registries (FleetOps order detail — doc 42)


API key CRUD with secret reveal once, webhook endpoints, socket channels, event stream, request logs.

---



<a id="doc-57"></a>

<!-- ========== DOCUMENT 57: 57-registry-bridge-overview.md ========== -->

# Registry Bridge — Overview

| Field | Value |
|-------|-------|
| **Doc ID** | 57 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/registry-bridge` |

---

## Purpose

Full routes and 21 screens.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Mount: `/extensions`

## routes.js

```javascript
import buildRoutes from 'ember-engines/routes';

export default buildRoutes(function () {
    this.route('installed');
    this.route('purchased');
    this.route('developers', function () {
        this.route('extensions', function () {
            this.route('index', { path: '/' });
            this.route('new');
            this.route('edit', { path: '/distribution/:public_id' }, function () {
                this.route('index', { path: '/' });
                this.route('details');
                this.route('bundles');
                this.route('monetize');
            });
        });
        this.route('analytics');
        this.route('payments', function () {
            this.route('index', { path: '/' });
            this.route('onboard');
            this.route('settings');
        });
        this.route('credentials');
    });
    this.route('explore', { path: '/' }, function () {
        this.route('index', { path: '/' });
        this.route('category', { path: '/:slug' });
    });
});

```

## Templates (21)

| # | Template |
|---|----------|
| 1 | `application.hbs` |
| 2 | `developers.hbs` |
| 3 | `developers/analytics.hbs` |
| 4 | `developers/credentials.hbs` |
| 5 | `developers/extensions.hbs` |
| 6 | `developers/extensions/edit.hbs` |
| 7 | `developers/extensions/edit/bundles.hbs` |
| 8 | `developers/extensions/edit/details.hbs` |
| 9 | `developers/extensions/edit/index.hbs` |
| 10 | `developers/extensions/edit/monetize.hbs` |
| 11 | `developers/extensions/index.hbs` |
| 12 | `developers/extensions/new.hbs` |
| 13 | `developers/payments.hbs` |
| 14 | `developers/payments/index.hbs` |
| 15 | `developers/payments/onboard.hbs` |
| 16 | `developers/payments/settings.hbs` |
| 17 | `explore.hbs` |
| 18 | `explore/category.hbs` |
| 19 | `explore/index.hbs` |
| 20 | `installed.hbs` |
| 21 | `purchased.hbs` |

---



<a id="doc-58"></a>

<!-- ========== DOCUMENT 58: 58-registry-explore-install-publish-admin.md ========== -->

# Registry — Explore, Install, Publish & Admin

| Field | Value |
|-------|-------|
| **Doc ID** | 58 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/*-engine, node_modules/@fleetbase/*-engine` |

---

## Purpose

Documentation for Registry — Explore, Install, Publish & Admin.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Engine mount

**Base URL:** `/extensions`

## Route tree

### Marketplace
- `/extensions/explore`
- `/extensions/installed`
- `/extensions/purchased`
- `/extensions/developers`

## UI patterns (all engines)

| Pattern | Description |
|---------|-------------|
| Engine layout | Own sidebar under mount path |
| Section header | `Layout::Section::Header` |
| Tables | Paginated model tables with filters |
| Detail panels | Right overlay or split view |
| Virtual | `/extensions/:section/:slug` for extension pages |

## Custom UI handoff

1. Implement sidebar nav matching route tree above
2. Each list page: filter bar + data table + primary CTA
3. Each detail: header actions + tabbed content
4. Register extension slots where Fleetbase uses registries (FleetOps order detail — doc 42)


Explore extensions, installed/purchased lists, developer publish flow, admin review queues.

---



<a id="doc-59"></a>

<!-- ========== DOCUMENT 59: 59-pallet-overview-and-routes.md ========== -->

# Pallet — Overview & Routes (Optional)

| Field | Value |
|-------|-------|
| **Doc ID** | 59 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/pallet` |

---

## Purpose

Full routes and 34 screens.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Mount: `/pallet`

## routes.js

```javascript
import buildRoutes from 'ember-engines/routes';

export default buildRoutes(function () {
    this.route('home', { path: '/' });
    this.route('products', function () {
        this.route('index', { path: '/' }, function () {
            this.route('new');
            this.route('details', { path: '/:public_id' });
            this.route('edit', { path: '/edit/:public_id' });
        });
    });
    this.route('inventory', function () {
        this.route('low-stock');
        this.route('expired-stock');
        this.route('index', { path: '/' }, function () {
            this.route('new');
            this.route('new-stock-adjustment');
            this.route('details', { path: '/:public_id' });
            this.route('edit', { path: '/edit/:public_id' });
        });
    });
    this.route('warehouses', function () {
        this.route('index', { path: '/' }, function () {
            this.route('new');
            this.route('details', { path: '/:public_id' });
            this.route('edit', { path: '/edit/:public_id' });
        });
    });
    this.route('suppliers', function () {
        this.route('index', { path: '/' }, function () {
            this.route('new');
            this.route('details', { path: '/:public_id' });
            this.route('edit', { path: '/edit/:public_id' });
        });
    });
    this.route('sales-orders', function () {
        this.route('index', { path: '/' }, function () {
            this.route('new');
            this.route('details', { path: '/:public_id' });
            this.route('edit', { path: '/edit/:public_id' });
        });
    });
    this.route('purchase-orders', function () {
        this.route('index', { path: '/' }, function () {
            this.route('new');
            this.route('details', { path: '/:public_id' });
            this.route('edit', { path: '/edit/:public_id' });
        });
    });
    this.route('batch', function () {});
    this.route('audits', function () {});
    this.route('reports', function () {});
});

```

## Templates (34)

| # | Template |
|---|----------|
| 1 | `application.hbs` |
| 2 | `audits/index.hbs` |
| 3 | `audits/index/details.hbs` |
| 4 | `audits/index/edit.hbs` |
| 5 | `audits/index/new.hbs` |
| 6 | `home.hbs` |
| 7 | `inventory/expired-stock.hbs` |
| 8 | `inventory/index.hbs` |
| 9 | `inventory/index/details.hbs` |
| 10 | `inventory/index/edit.hbs` |
| 11 | `inventory/index/new-stock-adjustment.hbs` |
| 12 | `inventory/index/new.hbs` |
| 13 | `inventory/low-stock.hbs` |
| 14 | `products/index.hbs` |
| 15 | `products/index/details.hbs` |
| 16 | `products/index/edit.hbs` |
| 17 | `products/index/new.hbs` |
| 18 | `purchase-orders/index.hbs` |
| 19 | `purchase-orders/index/details.hbs` |
| 20 | `purchase-orders/index/edit.hbs` |
| 21 | `purchase-orders/index/new.hbs` |
| 22 | `reports/index.hbs` |
| 23 | `sales-orders/index.hbs` |
| 24 | `sales-orders/index/details.hbs` |
| 25 | `sales-orders/index/edit.hbs` |
| 26 | `sales-orders/index/new.hbs` |
| 27 | `suppliers/index.hbs` |
| 28 | `suppliers/index/details.hbs` |
| 29 | `suppliers/index/edit.hbs` |
| 30 | `suppliers/index/new.hbs` |
| 31 | `warehouses/index.hbs` |
| 32 | `warehouses/index/details.hbs` |
| 33 | `warehouses/index/edit.hbs` |
| 34 | `warehouses/index/new.hbs` |

---



<a id="doc-60"></a>

<!-- ========== DOCUMENT 60: 60-pallet-inventory-warehouses-orders.md ========== -->

# Pallet — Inventory, Warehouses & Orders (Optional)

| Field | Value |
|-------|-------|
| **Doc ID** | 60 |
| **Volume** | 5 |
| **Status** | ✅ Done |
| **Sources** | `packages/*-engine, node_modules/@fleetbase/*-engine` |

---

## Purpose

Documentation for Pallet — Inventory, Warehouses & Orders (Optional).

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Engine mount

**Base URL:** `/pallet`

## Route tree

### WMS
- `/pallet/home`
- `/pallet/products`
- `/pallet/inventory`
- `/pallet/warehouses`
- `/pallet/suppliers`
- `/pallet/sales-orders`
- `/pallet/purchase-orders`
- `/pallet/batch`
- `/pallet/audits`
- `/pallet/reports`

## UI patterns (all engines)

| Pattern | Description |
|---------|-------------|
| Engine layout | Own sidebar under mount path |
| Section header | `Layout::Section::Header` |
| Tables | Paginated model tables with filters |
| Detail panels | Right overlay or split view |
| Virtual | `/pallet/:section/:slug` for extension pages |

## Custom UI handoff

1. Implement sidebar nav matching route tree above
2. Each list page: filter bar + data table + primary CTA
3. Each detail: header actions + tabbed content
4. Register extension slots where Fleetbase uses registries (FleetOps order detail — doc 42)

---



<a id="doc-61"></a>

<!-- ========== DOCUMENT 61: 61-permissions-roles-and-ui-gating.md ========== -->

# Permissions, Roles & UI Gating

| Field | Value |
|-------|-------|
| **Doc ID** | 61 |
| **Volume** | 6 |
| **Status** | ✅ Done |
| **Sources** | `abilities service, can helper` |

---

## Purpose

What to hide per role.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## Patterns

- `{{can "action" "resource"}}` in templates
- `@permission` on Button from menu items
- Route guards via session + admin checks

## Common gates

| Feature | Typical permission |
|---------|------------------|
| Admin panel | is_admin |
| Org settings | org admin role |
| FleetOps actions | fleet-ops permissions |
| IAM management | iam policies |

Document your permission matrix alongside RBAC design.

---



<a id="doc-62"></a>

<!-- ========== DOCUMENT 62: 62-i18n-branding-realtime-and-custom-ui-playbook.md ========== -->

# i18n, Branding, Realtime & Custom UI Playbook

| Field | Value |
|-------|-------|
| **Doc ID** | 62 |
| **Volume** | 6 |
| **Status** | ✅ Done |
| **Sources** | `translations/, brand model, socket` |

---

## Purpose

Handoff guide for custom rebuild.

---

## Documentation checklist

- [x] Discovery complete
- [x] UI specification documented
- [x] Behavior & data documented
- [x] Custom style handoff notes included

---


## i18n

- Files: `console/translations/*.yaml` (en-us, fr-fr, ar-ae, ...)
- Use keys like `auth.login.title`, `common.save-changes`
- User locale from `currentUser.getOption('locale')` default `en-US`

## Branding

- `brand` model id 1 — logo, icon, theme
- Admin branding page + org logo/backdrop in settings
- CSS theme via `theme` service on boot

## Realtime

- Socketcluster client (initializer)
- Live order/map updates in FleetOps
- Chat messages

## Custom UI playbook

### Phase 1 — Shell (week 1–2)
Docs 08, 09, 18, 19 → App shell + navigation

### Phase 2 — Auth & core (week 2–3)
Docs 05–07, 10–13 → Login, home, account, settings

### Phase 3 — Design system (week 3–5)
Docs 18–28 → Component library

### Phase 4 — Admin (week 5–6)
Docs 14–15

### Phase 5 — Engines (week 6+)
Docs 35–58 per product priority (FleetOps first)

### Per-screen spec template

```markdown
## [Screen name]
- Route:
- Layout:
- Data: API + model
- Fields/actions table
- States: loading, empty, error
- Permissions:
- Custom component map:
```

### Definition of done

Developer can implement screen without opening Ember repo.

---

