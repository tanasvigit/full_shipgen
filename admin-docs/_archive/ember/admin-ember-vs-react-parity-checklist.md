# Ember vs React Admin Parity Checklist

This is a simple page-by-page checklist comparing the original Ember admin panel against the current React admin implementation.

## Status Rules

- `done`: React has a dedicated equivalent page with most of the core page behavior present
- `partial`: React route exists, but the page is still simpler, visually different, or missing important Ember behavior
- `missing`: no meaningful React equivalent yet for that Ember admin route/pattern

## Important Note

This checklist is **page-focused**.

So a route can be marked `done` even if the broader admin shell is still not fully matched.

Global admin parity still missing across many pages:

- Ember-style admin sidebar
- admin panel grouping
- right-side overlay behavior for nested admin pages
- runtime admin menu panel rendering
- full visual parity

## Core Built-In Ember Admin Routes

| Ember Route | URL | React Equivalent | Status | Why |
|---|---|---|---|---|
| `console.admin.index` | `/admin` | `AdminOverviewPage` | `partial` | React loads overview data, but the page structure and admin-shell presentation are still simpler than Ember. |
| `console.admin.organizations.index` | `/admin/organizations` | `AdminOrganizationsPage` | `partial` | React has search and a table, but it lacks Ember’s export, query-param driven table behavior, and fuller admin page polish. |
| `console.admin.organizations.index.users` | `/admin/organizations/:public_id/users` | `AdminOrganizationUsersPage` | `partial` | React supports the route and impersonation, but Ember uses a nested right-side overlay with nested search/pagination. |
| `console.admin.branding` | `/admin/branding` | `AdminBrandingPage` | `partial` | React supports editing branding fields, but Ember behavior is more upload/reset-oriented and visually more complete. |
| `console.admin.two-fa-settings` | `/admin/two-fa-settings` | `AdminTwoFaSettingsPage` | `partial` | Core form exists, but the Ember page presentation and admin flow are still richer. |
| `console.admin.schedule-monitor` | `/admin/schedule-monitor` | `ScheduleMonitorPage` | `partial` | React fetches tasks, but Ember uses a fuller operational table with more monitoring context. |
| `console.admin.schedule-monitor.logs` | `/admin/schedule-monitor/:id/logs` | `ScheduleLogsPage` | `partial` | React fetches logs, but Ember presents logs in an admin overlay/detail flow rather than a plain routed page. |
| `console.admin.config.services` | `/admin/config/services` | `AdminServicesConfigPage` | `done` | React has a dedicated services config page with editable fields and save/test actions. |
| `console.admin.config.mail` | `/admin/config/mail` | `AdminMailConfigPage` | `done` | React has a dedicated mail config page with multi-mailer handling and test/save actions. |
| `console.admin.config.filesystem` | `/admin/config/filesystem` | `AdminFilesystemConfigPage` | `done` | React has a dedicated filesystem config form with driver switching and test/save actions. |
| `console.admin.config.queue` | `/admin/config/queue` | `AdminQueueConfigPage` | `done` | React has a dedicated queue config form with test/save flows. |
| `console.admin.config.socket` | `/admin/config/socket` | `AdminSocketConfigPage` | `partial` | React has socket tooling, but it is more of a custom console/test page than Ember parity. |
| `console.admin.config.notification-channels` | `/admin/config/push-notifications` | `AdminPushNotificationsConfigPage` | `done` | React has a dedicated push notification config page with APN/Firebase fields and testing. |
| `console.admin.config.database` | `/admin/config/database` | `AdminDatabaseConfigPage` | `done` | React has a dedicated database config screen with connection switching and test/save actions. |
| `console.admin.config.cache` | `/admin/config/cache` | `AdminCacheConfigPage` | `partial` | React has a usable cache config screen, but Ember’s route behavior is structurally different and broader shell parity is still missing. |

## Ember Admin Structural Routes

These are important admin route patterns in Ember, even if they are not always full standalone content pages.

| Ember Route / Pattern | URL | React Equivalent | Status | Why |
|---|---|---|---|---|
| `console.admin.config` | `/admin/config` | `AdminConfigEditorPage` | `missing` | React currently uses a generic JSON editor here, but Ember uses this route mainly as a structural config container/grouping route. |
| `console.admin.virtual` | `/admin/:slug` | `VirtualPage` | `partial` | React has a dynamic route host, but it is not yet integrated into an Ember-style admin sidebar/menu panel system. |

## Runtime / Extension-Driven Ember Admin Entries

These are the admin pages/panels that appear through Ember runtime menu registration rather than only through static core routes.

| Ember Admin Entry | Typical URL Shape | React Equivalent | Status | Why |
|---|---|---|---|---|
| `Fleet-Ops Config` panel | runtime admin panel | none under `/admin` | `missing` | React has FleetOps pages, but not as Ember-style admin panel entries inside the admin sidebar. |
| `Navigator App` under Fleet-Ops Config | likely `/admin/:slug`-style dynamic admin entry | none under `/admin` | `missing` | React has FleetOps settings elsewhere, but not mapped into admin runtime panel parity. |
| `Extensions Registry` panel | runtime admin panel | none under `/admin` | `missing` | Ember can inject this through admin menu panels; React does not yet have an equivalent admin registry panel system. |
| `Registry Config` | dynamic admin page | no equivalent admin route | `missing` | No matching React admin page surfaced through admin dynamic menu infrastructure. |
| `Awaiting Review` | dynamic admin page | no equivalent admin route | `missing` | No React admin page currently reproduces this extension-driven admin screen. |
| `Pending Publish` | dynamic admin page | no equivalent admin route | `missing` | No React admin page currently reproduces this extension-driven admin screen. |

## React-Only Admin Route

This route exists in React, but it is not part of the core Ember admin route tree documented from the original app.

| React Route | Component | Status vs Ember | Notes |
|---|---|---|---|
| `/admin/notifications` | `AdminNotificationsPage` | `extra / non-core` | Functional React admin page, but not part of the core Ember admin route tree documented in the source review. |

## Summary Counts

### Core built-in Ember admin routes

- `done`: 5
- `partial`: 10
- `missing`: 0

### Ember structural admin routes

- `done`: 0
- `partial`: 1
- `missing`: 1

### Runtime / extension-driven Ember admin entries reviewed

- `done`: 0
- `partial`: 0
- `missing`: 6

## Practical Reading Of The Checklist

### Best-covered area in React

The strongest parity work today is the dedicated config pages:

- services
- mail
- filesystem
- queue
- push notifications
- database

### Mostly present, but still not Ember-parity

These pages exist and work, but still need major parity work:

- overview
- organizations
- organization users
- branding
- 2FA settings
- schedule monitor
- schedule logs
- socket config
- cache config
- virtual admin route

### Largest missing gap

The biggest parity gap is not a single page. It is the missing Ember admin system around the pages:

- admin sidebar
- system config grouping in the sidebar
- nested overlay UX
- dynamic runtime admin menu panels

## Recommended Next Step

If you want the best next parity document after this one, the next useful file would be:

`admin-react-build-order-for-parity.md`

That would translate this checklist into the exact order React admin work should be built in.

